(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const labels = { admin: 'Administrador', coordinator: 'Equipo TICS', workshop: 'Colaborador' };
  const statusLabels = { pending_review: 'Nuevo', assigned: 'Asignado', in_progress: 'En atención', ready_review: 'Resuelto', closed: 'Cerrado' };
  let currentUser = null;
  let technicians = [];

  async function request(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ocurrió un error.');
    return data;
  }
  function toast(message) {
    let node = $('#toast');
    if (!node) { node = document.createElement('div'); node.id = 'toast'; node.className = 'toast'; document.body.append(node); }
    node.textContent = message; node.classList.add('show'); clearTimeout(node._timer); node._timer = setTimeout(() => node.classList.remove('show'), 3000);
  }
  function shell(user) {
    currentUser = user;
    const app = $('#app'); app.hidden = false; $('#login').hidden = true;
    $('#profile').innerHTML = `<b>${esc(user.name)}</b><small>${esc(labels[user.role])}</small>`;
    $('#logout').onclick = async () => { await request('/api/logout', { method: 'POST', body: '{}' }).catch(() => {}); location.reload(); };
    $('#newTicket').hidden = user.role !== 'workshop';
    $('#userNav').hidden = user.role !== 'admin';
    $('#userNav').onclick = renderUsers;
    $('#ticketNav').onclick = renderTickets;
    $('#newTicket').onclick = renderTicketForm;
    $('#bellBtn').onclick = () => $('#notificationPanel').classList.toggle('open');
    $('#loginForm').onsubmit = async event => {
      event.preventDefault();
      try { const values = Object.fromEntries(new FormData(event.currentTarget)); const result = await request('/api/login', { method: 'POST', body: JSON.stringify(values) }); shell(result.user); await renderTickets(); }
      catch (error) { $('#loginError').textContent = error.message; }
    };
    document.addEventListener('click', handleClick);
    refreshNotifications();
    renderTickets();
    setInterval(() => { refreshNotifications(); if ($('#ticketNav').classList.contains('active')) renderTickets(); }, 30000);
  }
  function setActive(key) {
    $('#ticketNav').classList.toggle('active', key === 'tickets'); $('#userNav').classList.toggle('active', key === 'users');
    $('#pageTitle').textContent = key === 'users' ? 'Usuarios' : 'Mesa de ayuda';
  }
  async function loadTechnicians() { technicians = (await request('/api/users?role=coordinator')).users; }
  function ticketCard(ticket) {
    const manager = ['admin', 'coordinator'].includes(currentUser.role);
    let controls = '';
    if (currentUser.role === 'coordinator' && ticket.assigneeId === currentUser.id && ticket.status === 'assigned') {
      controls = `<button class="primary" data-status="in_progress" data-id="${esc(ticket.id)}">Atender</button>`;
    } else if (currentUser.role === 'coordinator' && ticket.assigneeId === currentUser.id && ticket.status === 'in_progress') {
      controls = `<button class="primary" data-status="ready_review" data-id="${esc(ticket.id)}">Marcar resuelto</button>`;
    } else if (manager && ticket.status !== 'closed') {
      controls = ticket.status === 'ready_review'
        ? (currentUser.role === 'admin' ? `<button class="primary" data-close="${esc(ticket.id)}">Cerrar ticket</button>` : '')
        : `<select data-assignee="${esc(ticket.id)}"><option value="">${ticket.assigneeName ? esc(ticket.assigneeName) : 'Asignar a TICS'}</option>${technicians.map(person => `<option value="${esc(person.id)}" ${person.id === ticket.assigneeId ? 'selected' : ''}>${esc(person.name)}</option>`).join('')}</select><button class="secondary" data-assign="${esc(ticket.id)}">Asignar</button>`;
    }
    const photos = ticket.photos?.length ? `<div class="photos">${ticket.photos.map(photo => `<a href="${esc(photo.url)}" target="_blank" rel="noopener"><img src="${esc(photo.url)}" alt="Adjunto de ${esc(ticket.id)}"></a>`).join('')}</div>` : '';
    const history = ticket.activity?.length ? `<details><summary>Historial (${ticket.activity.length})</summary>${ticket.activity.map(item => `<p>${new Date(item.createdAt).toLocaleString('es-MX')} · <b>${esc(item.userName)}</b> ${esc(item.detail)}</p>`).join('')}</details>` : '';
    return `<article class="ticket"><div class="ticket-head"><div><small>${esc(ticket.id)} · ${new Date(ticket.createdAt).toLocaleString('es-MX')}</small><h2>${esc(ticket.title)}</h2></div><span class="status ${esc(ticket.status)}">${statusLabels[ticket.status] || esc(ticket.status)}</span></div><p>${esc(ticket.description)}</p><div class="meta"><span>Área: <b>${esc(ticket.category)}</b></span><span>Prioridad: <b>${esc(ticket.priority)}</b></span><span>Reportó: <b>${esc(ticket.createdByName)}</b></span><span>Asignado: <b>${esc(ticket.assigneeName || 'Pendiente')}</b></span><span>Ubicación: <b>${esc(ticket.location || 'No indicada')}</b></span></div>${photos}<div class="ticket-foot">${controls}<small>Actualizado ${new Date(ticket.updatedAt).toLocaleString('es-MX')}</small></div>${history}</article>`;
  }
  async function renderTickets() {
    setActive('tickets');
    const { tasks } = await request('/api/tasks');
    if (['admin', 'coordinator'].includes(currentUser.role)) await loadTechnicians();
    const counts = ['pending_review', 'assigned', 'in_progress', 'ready_review'];
    $('#content').innerHTML = `<div class="intro"><div><span class="eyebrow">SOPORTE INTERNO · TRANSATLANTE</span><h1>${currentUser.role === 'workshop' ? 'Mis solicitudes' : 'Solicitudes de soporte'}</h1><p>Registra problemas de tecnología y consulta el avance de cada solicitud.</p></div>${currentUser.role === 'workshop' ? '<button class="primary" id="createTicket">＋ Nuevo ticket</button>' : ''}</div><section class="metrics">${counts.map((status, index) => `<div><b>${tasks.filter(ticket => ticket.status === status).length}</b><span>${['Nuevos', 'Asignados', 'En atención', 'Resueltos'][index]}</span></div>`).join('')}</section><section class="ticket-list">${tasks.length ? tasks.map(ticketCard).join('') : '<div class="empty">Todavía no hay tickets. Registra el primero cuando necesites soporte.</div>'}</section>`;
    $('#createTicket')?.addEventListener('click', renderTicketForm);
  }
  function renderTicketForm() {
    setActive('tickets');
    $('#content').innerHTML = `<div class="form-wrap"><span class="eyebrow">NUEVA SOLICITUD</span><h1>¿Qué problema necesitas resolver?</h1><p>Describe lo que ocurre para que el equipo TICS pueda ayudarte.</p><form id="ticketForm"><label>Área<select name="category" required><option value="">Selecciona</option><option>Equipo de cómputo</option><option>Correo electrónico</option><option>Internet y red</option><option>Sistema o aplicación</option><option>Impresora</option><option>Telefonía</option><option>Accesos y contraseñas</option><option>Otro</option></select></label><label>Prioridad<select name="priority"><option>Media</option><option>Baja</option><option>Alta</option></select></label><label>Ubicación o área<input name="location" maxlength="100" placeholder="Ej. oficina de tráfico"></label><label>Asunto<input name="title" maxlength="140" required placeholder="Ej. No puedo acceder al correo"></label><label>Descripción<textarea name="description" maxlength="1500" required placeholder="¿Qué estabas haciendo? ¿Qué mensaje aparece?"></textarea></label><label>Adjuntos (opcional)<input name="photos" type="file" accept="image/*" multiple><small>Hasta 3 imágenes, máximo 3 MB cada una.</small></label><div id="previews" class="photos"></div><div class="actions"><button class="primary" type="submit">Enviar ticket</button><button class="secondary" type="button" id="cancelTicket">Cancelar</button></div></form></div>`;
    $('#cancelTicket').onclick = renderTickets;
    $('#ticketForm').onsubmit = submitTicket;
    $('#ticketForm [name=photos]').onchange = event => {
      const files = Array.from(event.target.files).slice(0, 3);
      if (event.target.files.length > 3) toast('Puedes adjuntar hasta 3 imágenes.');
      $('#previews').innerHTML = files.map(file => `<img src="${URL.createObjectURL(file)}" alt="Vista previa">`).join('');
    };
  }
  async function compressPhoto(file) {
    const image = await createImageBitmap(file); const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); image.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .78));
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ name: file.name, dataUrl: reader.result }); reader.onerror = reject; reader.readAsDataURL(blob); });
  }
  async function submitTicket(event) {
    event.preventDefault(); const form = event.currentTarget; const button = $('button[type=submit]', form); button.disabled = true;
    try {
      const data = new FormData(form); const photos = await Promise.all(Array.from(form.elements.photos.files).slice(0, 3).map(compressPhoto));
      const payload = Object.fromEntries(['category', 'priority', 'location', 'title', 'description'].map(key => [key, data.get(key)])); payload.photos = photos;
      await request('/api/reports', { method: 'POST', body: JSON.stringify(payload) }); toast('Ticket enviado al equipo TICS.'); await renderTickets();
    } catch (error) { button.disabled = false; toast(error.message); }
  }
  async function renderUsers() {
    if (currentUser.role !== 'admin') return renderTickets(); setActive('users');
    const { users } = await request('/api/users');
    const rows = users.map(user => `<tr><td>${esc(user.name)}<small>${esc(user.username)}</small></td><td>${labels[user.role]}</td><td>${user.id === currentUser.id ? 'Sesión actual' : `<button class="secondary" data-disable="${esc(user.id)}">Desactivar</button>`}</td></tr>`).join('');
    $('#content').innerHTML = `<div class="intro"><div><span class="eyebrow">ADMINISTRACIÓN</span><h1>Usuarios y accesos</h1><p>Administra las cuentas de colaboradores y del equipo TICS.</p></div></div><div class="user-layout"><section class="panel"><h2>Personal registrado</h2><table><thead><tr><th>Persona</th><th>Perfil</th><th>Acceso</th></tr></thead><tbody>${rows}</tbody></table></section><section class="panel"><h2>Agregar usuario</h2><form id="userForm"><label>Nombre<input name="name" required maxlength="100"></label><label>Usuario<input name="username" required minlength="3" maxlength="40" pattern="[a-zA-Z0-9._-]+"></label><label>Perfil<select name="role"><option value="workshop">Colaborador</option><option value="coordinator">Equipo TICS</option></select></label><label>Contraseña inicial<input name="password" type="password" required minlength="12"></label><button class="primary">Crear cuenta</button></form></section></div>`;
    $('#userForm').onsubmit = async event => { event.preventDefault(); try { await request('/api/users', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); toast('Cuenta creada.'); renderUsers(); } catch (error) { toast(error.message); } };
  }
  async function refreshNotifications() {
    try {
      const { notifications } = await request('/api/notifications');
      $('#notificationPanel').innerHTML = `<div class="notification-head">Notificaciones <button id="markRead">Marcar leídas</button></div>${notifications.length ? notifications.slice(0, 12).map(note => `<div class="notice ${note.readAt ? 'read' : ''}"><b>${esc(note.title)}</b><small>${esc(note.body)}</small></div>`).join('') : '<div class="notice">No tienes notificaciones.</div>'}`;
      $('#markRead').onclick = async () => { await request('/api/notifications/read', { method: 'POST', body: '{}' }); refreshNotifications(); };
      $('#bellBtn').dataset.unread = notifications.some(item => !item.readAt) ? 'true' : 'false';
    } catch { /* La sesión puede haber expirado. */ }
  }
  async function handleClick(event) {
    const assign = event.target.closest('[data-assign]');
    if (assign) { const card = assign.closest('.ticket'); const assigneeId = $(`[data-assignee="${CSS.escape(assign.dataset.assign)}"]`, card).value; if (!assigneeId) return toast('Selecciona una persona de TICS.'); try { await request(`/api/tasks/${encodeURIComponent(assign.dataset.assign)}/assign`, { method: 'POST', body: JSON.stringify({ assigneeId }) }); await renderTickets(); toast('Ticket asignado.'); } catch (error) { toast(error.message); } }
    const status = event.target.closest('[data-status]');
    if (status) try { await request(`/api/tasks/${encodeURIComponent(status.dataset.id)}/status`, { method: 'PATCH', body: JSON.stringify({ status: status.dataset.status }) }); await renderTickets(); } catch (error) { toast(error.message); }
    const close = event.target.closest('[data-close]');
    if (close) try { await request(`/api/tasks/${encodeURIComponent(close.dataset.close)}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) }); await renderTickets(); } catch (error) { toast(error.message); }
    const disable = event.target.closest('[data-disable]');
    if (disable && confirm('¿Desactivar este acceso?')) try { await request(`/api/users/${encodeURIComponent(disable.dataset.disable)}`, { method: 'DELETE', body: '{}' }); await renderUsers(); } catch (error) { toast(error.message); }
  }
  document.addEventListener('DOMContentLoaded', async () => {
    $('#loginForm').onsubmit = async event => { event.preventDefault(); try { const result = await request('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) }); shell(result.user); await renderTickets(); } catch (error) { $('#loginError').textContent = error.message; } };
    try { const result = await request('/api/session'); shell(result.user); } catch { $('#login').hidden = false; }
  });
})();
