const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
loadLocalEnv();

const port = Number(process.env.PORT || 4173);
const dataDir = path.resolve(process.env.DATA_DIR || path.join(root, 'data'));
const uploadDir = path.join(dataDir, 'uploads');
const storeFile = path.join(dataDir, 'transcontrol.json');
const sessionHours = 12;
const sessions = new Map();
const loginAttempts = new Map();
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

let webpush = null;
try { webpush = require('web-push'); } catch { /* Push stays disabled until dependencies are installed. */ }
if (webpush && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@transcontrol.local',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

let state;
let writeQueue = Promise.resolve();
let pushKeys = null;

function loadLocalEnv() {
  try {
    const source = require('node:fs').readFileSync(path.join(__dirname, '.env'), 'utf8');
    for (const row of source.split(/\r?\n/)) {
      const match = row.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match || Object.hasOwn(process.env, match[1])) continue;
      process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  } catch { /* Environment variables are also supported directly. */ }
}

function reply(res, status, value, extraHeaders = {}) {
  const body = Buffer.from(JSON.stringify(value));
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(body);
}

function fail(res, status, message) {
  reply(res, status, { error: message });
}

function safeUser(user) {
  return { id: user.id, username: user.username, name: user.name, role: user.role, active: user.active !== false };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const digest = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${digest}`;
}

function verifyPassword(password, encoded) {
  if (typeof encoded !== 'string' || !encoded.includes(':')) return false;
  const [salt, expected] = encoded.split(':');
  const actual = Buffer.from(hashPassword(password, salt).split(':')[1], 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function requiredPassword(key) {
  const value = process.env[key];
  if (!value || value.length < 12) throw new Error(`${key} debe configurarse con al menos 12 caracteres antes del primer inicio.`);
  return value;
}

async function persist() {
  const snapshot = JSON.stringify(state, null, 2);
  writeQueue = writeQueue.then(async () => {
    const temp = `${storeFile}.${crypto.randomUUID()}.tmp`;
    await fs.writeFile(temp, snapshot, { mode: 0o600 });
    await fs.rename(temp, storeFile);
  });
  await writeQueue;
}

async function initialize() {
  await fs.mkdir(uploadDir, { recursive: true });
  try {
    state = JSON.parse(await fs.readFile(storeFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    state = { users: [], tasks: [], notifications: [], events: [], pushSubscriptions: [] };
  }
  state.users ||= [];
  state.tasks ||= [];
  state.notifications ||= [];
  state.events ||= [];
  state.pushSubscriptions ||= [];

  if (!state.users.length) {
    const starterUsers = [
      { id: 'oscar-1', username: process.env.OSCAR_USERNAME || 'oscar1', name: process.env.OSCAR_NAME || 'Oscar 1', role: 'admin', password: requiredPassword('OSCAR_PASSWORD') },
      { id: 'fernanda', username: process.env.FERNANDA_USERNAME || 'fernanda', name: process.env.FERNANDA_NAME || 'Fernanda', role: 'coordinator', password: requiredPassword('FERNANDA_PASSWORD') },
      { id: 'workshop-1', username: process.env.WORKSHOP_USERNAME || 'taller1', name: process.env.WORKSHOP_NAME || 'Técnico de taller 1', role: 'workshop', password: requiredPassword('WORKSHOP_PASSWORD') },
    ];
    state.users = starterUsers.map(user => ({
      id: user.id,
      username: user.username.toLowerCase(),
      name: user.name,
      role: user.role,
      passwordHash: hashPassword(user.password),
      active: true,
      createdAt: new Date().toISOString(),
    }));
    await persist();
  }
  if (webpush) {
    pushKeys = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
      ? { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY }
      : state.vapidKeys || webpush.generateVAPIDKeys();
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@transcontrol.local',
      pushKeys.publicKey,
      pushKeys.privateKey
    );
    if (!state.vapidKeys && !process.env.VAPID_PUBLIC_KEY) {
      state.vapidKeys = pushKeys;
      await persist();
    }
  }
}

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(part => {
    const splitAt = part.indexOf('=');
    return splitAt < 0 ? ['', ''] : [part.slice(0, splitAt).trim(), decodeURIComponent(part.slice(splitAt + 1).trim())];
  }).filter(([key]) => key));
}

function setSessionCookie(res, token, maxAge) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `tc_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`);
}

function getSession(req) {
  const token = parseCookies(req).tc_session;
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  const user = state.users.find(item => item.id === session.userId && item.active !== false);
  return user ? { token, user } : null;
}

function requireRoles(res, session, roles) {
  if (!session) {
    fail(res, 401, 'Inicia sesión para continuar.');
    return false;
  }
  if (roles && !roles.includes(session.user.role)) {
    fail(res, 403, 'Tu perfil no tiene permiso para esta acción.');
    return false;
  }
  return true;
}

function validateSameOrigin(req, res) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const forwardedProto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const expected = `${forwardedProto}://${req.headers.host}`;
  if (origin === expected) return true;
  fail(res, 403, 'Origen no permitido.');
  return false;
}

async function readJson(req, maxBytes = 10 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('El archivo es demasiado grande.'), { status: 413 });
    chunks.push(chunk);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('El formato enviado no es válido.'), { status: 400 }); }
}

function cleanText(value, maxLength = 1000) {
  return String(value || '').trim().slice(0, maxLength);
}

async function savePhotos(photos) {
  if (!Array.isArray(photos) || photos.length > 3) throw Object.assign(new Error('Adjunta hasta 3 fotografías.'), { status: 400 });
  const saved = [];
  for (const photo of photos) {
    const match = String(photo.dataUrl || '').match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) throw Object.assign(new Error('Las fotos deben ser JPG, PNG o WebP.'), { status: 400 });
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const bytes = Buffer.from(match[2], 'base64');
    if (!bytes.length || bytes.length > 3 * 1024 * 1024) throw Object.assign(new Error('Cada fotografía debe pesar menos de 3 MB.'), { status: 413 });
    const id = crypto.randomUUID();
    await fs.writeFile(path.join(uploadDir, `${id}.${ext}`), bytes, { flag: 'wx', mode: 0o600 });
    saved.push({ id, name: cleanText(photo.name, 120), type: `image/${match[1]}`, ext });
  }
  return saved;
}

function addEvent(task, user, action, detail) {
  const event = { id: crypto.randomUUID(), taskId: task.id, userId: user.id, userName: user.name, action, detail, createdAt: new Date().toISOString() };
  state.events.unshift(event);
  task.updatedAt = event.createdAt;
  task.events ||= [];
  task.events.unshift(event.id);
}

async function notifyUser(userId, title, body, taskId) {
  const note = { id: crypto.randomUUID(), userId, title, body, taskId, readAt: null, createdAt: new Date().toISOString() };
  state.notifications.unshift(note);
  if (!webpush || !pushKeys) return;
  const subscriptions = state.pushSubscriptions.filter(item => item.userId === userId);
  await Promise.all(subscriptions.map(async item => {
    try {
      await webpush.sendNotification(item.subscription, JSON.stringify({ title, body, url: `./?task=${encodeURIComponent(taskId)}`, tag: taskId }), { TTL: 60 * 60 });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) state.pushSubscriptions = state.pushSubscriptions.filter(saved => saved.id !== item.id);
      console.warn(`No se pudo enviar push a ${userId}: ${error.statusCode || error.message}`);
    }
  }));
}

async function notifyManagers(title, body, taskId) {
  const managers = state.users.filter(user => user.active !== false && ['admin', 'coordinator'].includes(user.role));
  await Promise.all(managers.map(user => notifyUser(user.id, title, body, taskId)));
}

function visibleTasksFor(user) {
  if (user.role === 'admin' || user.role === 'coordinator') return state.tasks;
  return state.tasks.filter(task => task.assigneeId === user.id || task.createdBy === user.id);
}

function canViewTask(user, task) {
  return user.role !== 'workshop' || task.assigneeId === user.id || task.createdBy === user.id;
}

function taskWithPhotoUrls(task) {
  return {
    ...task,
    photos: task.photos.map(photo => ({ ...photo, url: `/api/photos/${photo.id}` })),
    activity: (task.events || []).map(id => state.events.find(event => event.id === id)).filter(Boolean),
  };
}

function limitedLogin(req) {
  const ip = req.socket.remoteAddress || 'unknown';
  const record = loginAttempts.get(ip) || { count: 0, resetAt: Date.now() + 60_000 };
  if (record.resetAt <= Date.now()) { record.count = 0; record.resetAt = Date.now() + 60_000; }
  record.count += 1;
  loginAttempts.set(ip, record);
  return record.count <= 8;
}

async function handleApi(req, res, url) {
  const method = req.method;
  if (method !== 'GET' && !validateSameOrigin(req, res)) return;

  if (url.pathname === '/api/health' && method === 'GET') return reply(res, 200, { ok: true });
  if (url.pathname === '/api/login' && method === 'POST') {
    if (!limitedLogin(req)) return fail(res, 429, 'Demasiados intentos. Espera un minuto.');
    const body = await readJson(req, 20_000);
    const username = cleanText(body.username, 80).toLowerCase();
    const password = String(body.password || '');
    const user = state.users.find(item => item.username === username && item.active !== false);
    if (!user || !verifyPassword(password, user.passwordHash)) return fail(res, 401, 'Usuario o contraseña incorrectos.');
    const token = crypto.randomBytes(32).toString('base64url');
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionHours * 60 * 60 * 1000 });
    setSessionCookie(res, token, sessionHours * 60 * 60);
    return reply(res, 200, { user: safeUser(user) });
  }

  const session = getSession(req);
  if (url.pathname === '/api/session' && method === 'GET') {
    if (!requireRoles(res, session)) return;
    return reply(res, 200, { user: safeUser(session.user) });
  }
  if (url.pathname === '/api/logout' && method === 'POST') {
    if (session) sessions.delete(session.token);
    setSessionCookie(res, '', 0);
    return reply(res, 200, { ok: true });
  }
  if (url.pathname === '/api/push/public-key' && method === 'GET') {
    return reply(res, 200, { publicKey: pushKeys?.publicKey || null });
  }
  if (!requireRoles(res, session)) return;
  const user = session.user;

  if (url.pathname === '/api/users' && method === 'GET') {
    if (!requireRoles(res, session, ['admin', 'coordinator'])) return;
    const role = url.searchParams.get('role');
    return reply(res, 200, { users: state.users.filter(item => item.active !== false && (!role || item.role === role)).map(safeUser) });
  }
  if (url.pathname === '/api/users' && method === 'POST') {
    if (!requireRoles(res, session, ['admin'])) return;
    const body = await readJson(req, 20_000);
    const username = cleanText(body.username, 40).toLowerCase();
    const name = cleanText(body.name, 100);
    const role = body.role;
    const password = String(body.password || '');
    if (!/^[a-z0-9._-]{3,40}$/.test(username)) return fail(res, 400, 'El usuario debe tener 3 a 40 caracteres: letras, números, punto, guion o guion bajo.');
    if (!name || !['coordinator', 'workshop'].includes(role)) return fail(res, 400, 'Nombre o perfil no válido.');
    if (password.length < 12) return fail(res, 400, 'La contraseña debe tener al menos 12 caracteres.');
    if (state.users.some(item => item.username === username)) return fail(res, 409, 'Ese usuario ya existe.');
    const newUser = { id: crypto.randomUUID(), username, name, role, passwordHash: hashPassword(password), active: true, createdAt: new Date().toISOString() };
    state.users.push(newUser);
    await persist();
    return reply(res, 201, { user: safeUser(newUser) });
  }
  if (url.pathname.startsWith('/api/users/') && method === 'DELETE') {
    if (!requireRoles(res, session, ['admin'])) return;
    const id = decodeURIComponent(url.pathname.slice('/api/users/'.length));
    const target = state.users.find(item => item.id === id);
    if (!target || target.role === 'admin') return fail(res, 404, 'Usuario no encontrado.');
    target.active = false;
    for (const [token, value] of sessions) if (value.userId === id) sessions.delete(token);
    await persist();
    return reply(res, 200, { ok: true });
  }
  const passwordMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/password$/);
  if (passwordMatch && method === 'PATCH') {
    if (!requireRoles(res, session, ['admin'])) return;
    const target = state.users.find(item => item.id === decodeURIComponent(passwordMatch[1]) && item.active !== false);
    if (!target) return fail(res, 404, 'Usuario no encontrado.');
    const body = await readJson(req, 20_000);
    const password = String(body.password || '');
    if (password.length < 12) return fail(res, 400, 'La contraseña debe tener al menos 12 caracteres.');
    target.passwordHash = hashPassword(password);
    for (const [token, value] of sessions) if (value.userId === target.id && token !== session.token) sessions.delete(token);
    await persist();
    return reply(res, 200, { ok: true });
  }

  if (url.pathname === '/api/tasks' && method === 'GET') {
    const tasks = visibleTasksFor(user).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(taskWithPhotoUrls);
    return reply(res, 200, { tasks });
  }
  if (url.pathname === '/api/reports' && method === 'POST') {
    if (!requireRoles(res, session, ['workshop'])) return;
    const body = await readJson(req, 13 * 1024 * 1024);
    const truckId = cleanText(body.truckId, 20).toUpperCase();
    const odometer = cleanText(body.odometer, 20);
    const odometerDigits = odometer.replaceAll(',', '');
    const category = cleanText(body.category, 50);
    const priority = body.priority;
    const title = cleanText(body.title, 140);
    const description = cleanText(body.description, 1500);
    if (!/^TC-\d{2,4}$/.test(truckId) || !/^\d{1,7}$/.test(odometerDigits) || !['Mecánico', 'Frenos', 'Motor', 'Eléctrico', 'Neumático', 'Llantas', 'Otro'].includes(category) || !title || !description || !['Baja', 'Media', 'Alta'].includes(priority)) {
      return fail(res, 400, 'Completa unidad, odómetro, tipo de falla, prioridad, resumen y descripción.');
    }
    const photos = await savePhotos(body.photos || []);
    const now = new Date().toISOString();
    const task = {
      id: `REP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      truckId, odometer: Number(odometerDigits).toLocaleString('es-MX'), category, priority, title, description, photos,
      createdBy: user.id, createdByName: user.name,
      createdAt: now, updatedAt: now,
      assigneeId: null, assigneeName: null,
      status: 'pending_review',
      events: [],
    };
    state.tasks.unshift(task);
    addEvent(task, user, 'reported', 'El taller envió un reporte nuevo.');
    await notifyManagers(`Reporte nuevo · ${truckId}`, `${user.name}: ${title}`, task.id);
    await persist();
    return reply(res, 201, { task: taskWithPhotoUrls(task) });
  }

  const assignMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/assign$/);
  if (assignMatch && method === 'POST') {
    if (!requireRoles(res, session, ['admin', 'coordinator'])) return;
    const task = state.tasks.find(item => item.id === decodeURIComponent(assignMatch[1]));
    if (!task) return fail(res, 404, 'Reporte no encontrado.');
    if (task.status === 'closed') return fail(res, 409, 'Una tarea cerrada no se puede volver a asignar.');
    const body = await readJson(req, 20_000);
    const assignee = state.users.find(item => item.id === body.assigneeId && item.role === 'workshop' && item.active !== false);
    if (!assignee) return fail(res, 400, 'Selecciona un técnico activo del taller.');
    task.assigneeId = assignee.id;
    task.assigneeName = assignee.name;
    task.status = 'assigned';
    addEvent(task, user, 'assigned', `Asignó el reporte a ${assignee.name}.`);
    await notifyUser(assignee.id, `Tarea asignada · ${task.truckId}`, task.title, task.id);
    await notifyManagers(`Reporte asignado · ${task.truckId}`, `${user.name} asignó la tarea a ${assignee.name}.`, task.id);
    await persist();
    return reply(res, 200, { task: taskWithPhotoUrls(task) });
  }

  const statusMatch = url.pathname.match(/^\/api\/tasks\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const task = state.tasks.find(item => item.id === decodeURIComponent(statusMatch[1]));
    if (!task) return fail(res, 404, 'Tarea no encontrada.');
    const body = await readJson(req, 20_000);
    const nextStatus = body.status;
    if (user.role === 'workshop') {
      if (task.assigneeId !== user.id) return fail(res, 403, 'Solo puedes actualizar tareas que te asignaron.');
      const allowed = task.status === 'assigned' && nextStatus === 'in_progress' || task.status === 'in_progress' && nextStatus === 'ready_review';
      if (!allowed) return fail(res, 409, 'Ese cambio de estado no está permitido.');
    } else {
      if (!['admin', 'coordinator'].includes(user.role) || task.status !== 'ready_review' || nextStatus !== 'closed') return fail(res, 409, 'Solo coordinación puede cerrar una tarea que el taller marcó como lista.');
    }
    task.status = nextStatus;
    const labels = { in_progress: 'comenzó el trabajo', ready_review: 'marcó la tarea lista para revisión', closed: 'cerró la tarea' };
    addEvent(task, user, nextStatus, labels[nextStatus] || 'actualizó la tarea');
    await notifyManagers(`Actualización · ${task.truckId}`, `${user.name} ${labels[nextStatus]}.`, task.id);
    if (nextStatus === 'closed' && task.assigneeId) await notifyUser(task.assigneeId, `Tarea cerrada · ${task.truckId}`, task.title, task.id);
    await persist();
    return reply(res, 200, { task: taskWithPhotoUrls(task) });
  }

  const photoMatch = url.pathname.match(/^\/api\/photos\/([0-9a-f-]{36})$/i);
  if (photoMatch && method === 'GET') {
    const photoId = photoMatch[1];
    const task = state.tasks.find(item => item.photos.some(photo => photo.id === photoId));
    if (!task || !canViewTask(user, task)) return fail(res, 404, 'Foto no encontrada.');
    const photo = task.photos.find(item => item.id === photoId);
    const file = path.join(uploadDir, `${photo.id}.${photo.ext}`);
    try {
      const bytes = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': photo.type, 'Content-Length': bytes.length, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
      return res.end(bytes);
    } catch { return fail(res, 404, 'Foto no encontrada.'); }
  }

  if (url.pathname === '/api/notifications' && method === 'GET') {
    const notifications = state.notifications.filter(note => note.userId === user.id).slice(0, 50);
    return reply(res, 200, { notifications });
  }
  if (url.pathname === '/api/notifications/read' && method === 'POST') {
    const now = new Date().toISOString();
    for (const note of state.notifications) if (note.userId === user.id && !note.readAt) note.readAt = now;
    await persist();
    return reply(res, 200, { ok: true });
  }
  if (url.pathname === '/api/push-subscriptions' && method === 'POST') {
    const body = await readJson(req, 30_000);
    if (!body.subscription?.endpoint || !body.subscription?.keys?.p256dh || !body.subscription?.keys?.auth) return fail(res, 400, 'La suscripción de notificaciones no es válida.');
    state.pushSubscriptions = state.pushSubscriptions.filter(item => item.subscription.endpoint !== body.subscription.endpoint);
    state.pushSubscriptions.push({ id: crypto.randomUUID(), userId: user.id, subscription: body.subscription, createdAt: new Date().toISOString() });
    await persist();
    return reply(res, 201, { ok: true });
  }

  return fail(res, 404, 'Ruta no encontrada.');
}

async function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'Método no permitido.');
  const relativePath = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(root + path.sep) || relativePath.startsWith('.') || relativePath.split(/[\\/]/).some(part => part.startsWith('.'))) return fail(res, 404, 'Archivo no encontrado.');
  try {
    const body = await fs.readFile(filePath);
    const headers = {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': path.extname(filePath) === '.html' ? 'no-store' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
    };
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { fail(res, 404, 'Archivo no encontrado.'); }
}

const server = http.createServer(async (req, res) => {
  try {
    await initializeOnce;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) await handleApi(req, res, url);
    else await serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) fail(res, error.status || 500, error.status ? error.message : 'Ocurrió un error al procesar la solicitud.');
    else res.destroy();
  }
});

const initializeOnce = initialize();
initializeOnce.then(() => {
  server.listen(port, '0.0.0.0', () => console.log(`Transcontrol Taller escuchando en el puerto ${port}`));
}).catch(error => {
  console.error(`No se pudo iniciar Transcontrol: ${error.message}`);
  process.exitCode = 1;
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
