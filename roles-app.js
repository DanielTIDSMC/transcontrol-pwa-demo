(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const labels = { admin: 'Administrador', coordinator: 'Coordinación', workshop: 'Taller' };
  const statusLabels = {
    pending_review: 'Por revisar', assigned: 'Asignada', in_progress: 'En trabajo', ready_review: 'Lista para revisar', closed: 'Cerrada'
  };
  const statusClass = {
    pending_review: 'pending', assigned: 'assigned', in_progress: 'working', ready_review: 'ready', closed: 'closed'
  };
  let currentUser = null;
  let technicians = [];
  let refreshTimer = null;

  const style = document.createElement('style');
  style.textContent = `
    .role-guide-backdrop{position:fixed;inset:0;z-index:500;background:#11182799;display:grid;place-items:center;padding:16px;font-family:'DM Sans',sans-serif}
    .role-guide-card{position:relative;width:min(480px,100%);background:#fff;border:1px solid #e7e7eb;border-radius:17px;padding:24px;box-shadow:0 25px 80px #11182740}
    .role-guide-kicker{font-size:10px;letter-spacing:1px;font-weight:800;text-transform:uppercase;color:#c5232b}
    .role-guide-card h2{font:800 22px Manrope,sans-serif;color:#202126;margin:10px 0 8px}
    .role-guide-card p{font-size:13px;line-height:1.6;color:#686973;margin:0;min-height:62px}
    .role-guide-progress{height:4px;background:#eeeef0;border-radius:5px;margin:20px 0 14px;overflow:hidden}.role-guide-progress i{display:block;height:100%;background:#c5232b;border-radius:5px;transition:width .2s}
    .role-guide-foot{display:flex;align-items:center;justify-content:space-between;gap:10px}.role-guide-count{font-size:10px;color:#858691;font-weight:700}.role-guide-actions{display:flex;gap:8px}
    .role-guide-trigger{border:1px solid #e2e3e6;border-radius:8px;background:#fff;color:#555761;padding:8px 10px;font:700 10px 'DM Sans',sans-serif;cursor:pointer;white-space:nowrap}
    .role-guide-close{position:absolute;right:15px;top:15px;border:0;background:#f4f4f5;border-radius:8px;width:30px;height:30px;font-size:19px;color:#555;cursor:pointer}
    .role-auth{position:fixed;inset:0;z-index:300;background:radial-gradient(ellipse at 15% 15%,#393136 0,transparent 38%),#151518;display:grid;place-items:center;padding:24px;font-family:'DM Sans',sans-serif}
    .role-auth-shell{width:min(930px,100%);min-height:540px;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);overflow:hidden;background:#fff;border:1px solid #ffffff20;border-radius:22px;box-shadow:0 30px 100px #0007}
    .role-auth-brand{position:relative;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;padding:48px;background:linear-gradient(150deg,#fff 0%,#f6f6f7 100%)}
    .role-auth-brand:after{content:'';position:absolute;width:330px;height:330px;right:-150px;bottom:-180px;border:1px solid #c5232b19;border-radius:50%;box-shadow:0 0 0 35px #c5232b08,0 0 0 75px #c5232b05}
    .role-auth-logo{display:block;width:min(290px,100%);height:auto;object-fit:contain;object-position:left center}
    .role-auth-brand-copy{position:relative;z-index:1;max-width:370px;margin-top:45px}
    .role-auth-brand-copy .role-auth-overline{font-size:10px;font-weight:800;letter-spacing:1.7px;color:#c5232b;text-transform:uppercase}
    .role-auth-brand-copy h2{font:800 30px/1.15 Manrope,sans-serif;letter-spacing:-.8px;color:#202126;margin:13px 0 10px}
    .role-auth-brand-copy p{font-size:13px;line-height:1.65;color:#73737d;margin:0}
    .role-auth-brand-foot{position:relative;z-index:1;display:flex;align-items:center;gap:9px;font-size:10px;font-weight:700;color:#71727b}
    .role-auth-brand-foot i{display:block;width:7px;height:7px;border-radius:50%;background:#21ad91;box-shadow:0 0 0 4px #21ad911c}
    .role-auth-card{width:auto;display:flex;flex-direction:column;justify-content:center;background:#fff;border:0;border-radius:0;padding:48px 42px;box-shadow:none}
    .role-auth-card .role-auth-overline{font-size:10px;font-weight:800;letter-spacing:1.4px;color:#c5232b;text-transform:uppercase}
    .role-auth-card h1{font:800 27px Manrope,sans-serif;letter-spacing:-.5px;margin:10px 0 7px;color:#171719}.role-auth-card>p{font-size:12px;color:#73737d;line-height:1.55;margin:0 0 25px}
    .role-auth-card label,.role-form label{display:block;font-size:11px;font-weight:700;color:#555660;margin:0 0 15px}
    .role-auth-card input,.role-form input,.role-form select,.role-form textarea,.role-select{display:block;width:100%;margin-top:7px;border:1px solid #dedee3;border-radius:9px;background:white;padding:12px 13px;color:#242429;font:inherit;font-size:13px;outline:none;transition:border-color .18s,box-shadow .18s}
    .role-auth-card input:focus,.role-form input:focus,.role-form select:focus,.role-form textarea:focus{border-color:#c5232b;box-shadow:0 0 0 3px #c5232b12}
    .role-auth-password{position:relative}.role-auth-password input{padding-right:72px}.role-auth-show{position:absolute;right:8px;top:14px;border:0;background:transparent;color:#777984;font:700 10px 'DM Sans',sans-serif;padding:8px;cursor:pointer}
    .role-auth-submit{width:100%;min-height:46px;margin-top:3px;font-size:12px;box-shadow:0 5px 14px #c5232b2b}
    .role-auth-help{display:block;margin-top:17px;text-align:center;color:#888994;font-size:10px;line-height:1.5}
    @media(max-width:700px){.role-auth{padding:14px}.role-auth-shell{grid-template-columns:minmax(0,1fr);min-height:0;max-width:440px;border-radius:18px}.role-auth-brand{padding:22px 25px 18px;gap:18px}.role-auth-logo{width:180px}.role-auth-brand-copy{margin:0}.role-auth-brand-copy h2{font-size:21px;margin:7px 0 4px}.role-auth-brand-copy p{font-size:11px}.role-auth-brand-foot{display:none}.role-auth-card{padding:25px}.role-auth-card h1{font-size:24px}.role-auth-card>p{margin-bottom:18px}}
    .role-primary{border:0;border-radius:9px;background:#c5232b;color:white;padding:11px 15px;font:700 12px 'DM Sans',sans-serif;cursor:pointer}
    .role-primary:hover{background:#a91d24}.role-primary:disabled{opacity:.5;cursor:wait}
    .role-muted{font-size:11px;color:#888994}.role-error{font-size:12px;line-height:1.4;color:#a51d28;background:#fff0f1;border:1px solid #f5c9cc;padding:10px 12px;border-radius:8px;margin:0 0 13px}
    .role-toolbar{display:flex;gap:10px;align-items:center}.role-user-tools{display:flex;gap:8px;align-items:center}.role-chip{font-size:10px;font-weight:800;letter-spacing:.3px;color:#9d1e25;background:#fff0f1;padding:7px 9px;border-radius:20px}
    .role-logout,.role-secondary{border:1px solid #e2e3e6;border-radius:8px;background:#fff;color:#555761;padding:9px 11px;font-size:11px;font-weight:700;cursor:pointer}
    .role-nav{border:0;background:transparent;color:#686973;text-align:left;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700;cursor:pointer}
    .role-nav:hover,.role-nav.active{background:#fff0f1;color:#a91d24}.role-nav.active{box-shadow:inset 3px 0 #c5232b}
    .role-content{max-width:1300px;margin:auto}.role-page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin:2px 0 22px}
    .role-page-head h1{font:800 28px Manrope,sans-serif;letter-spacing:-.7px;margin:0;color:#171719}.role-page-head p{font-size:12px;color:#747580;margin:7px 0 0}
    .role-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:15px}.role-kpi{background:white;border:1px solid #e9eaed;border-radius:11px;padding:15px 17px}.role-kpi b{font:800 23px Manrope;color:#202126;display:block}.role-kpi span{font-size:10px;color:#858691}
    .role-task-list{display:grid;gap:11px}.role-task{background:#fff;border:1px solid #e7e8eb;border-left:4px solid #d2a037;border-radius:11px;padding:16px 17px;box-shadow:0 5px 17px #17171908}
    .role-task.assigned{border-left-color:#4581c7}.role-task.working{border-left-color:#c5232b}.role-task.ready{border-left-color:#12816f}.role-task.closed{border-left-color:#a7a8ae;opacity:.8}
    .role-task-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.role-task-title{font:800 14px Manrope,sans-serif;color:#25252a}.role-task-sub{font-size:10px;color:#858691;margin-top:4px}
    .role-status{font-size:9px;font-weight:800;border-radius:20px;padding:6px 9px;white-space:nowrap;background:#fff5df;color:#99701b}.role-status.assigned{background:#edf4ff;color:#416eaa}.role-status.working{background:#fff0f1;color:#a91d24}.role-status.ready{background:#e8f6f1;color:#17745e}.role-status.closed{background:#f0f0f2;color:#73747c}
    .role-task p{font-size:12px;line-height:1.55;color:#5e5f68;margin:12px 0}.role-task-meta{display:flex;gap:7px 16px;flex-wrap:wrap;font-size:10px;color:#777984}
    .role-task-foot{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:13px;padding-top:12px;border-top:1px solid #f0f0f2}.role-task-foot select{max-width:240px;min-width:180px;border:1px solid #e0e1e4;border-radius:8px;background:white;padding:9px;font-size:11px}
    .role-photo-list{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.role-photo-list a{display:block;width:70px;height:70px;border:1px solid #e5e6e9;border-radius:8px;overflow:hidden}.role-photo-list img{width:100%;height:100%;object-fit:cover}
    .role-two-col{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(280px,.7fr);gap:14px;align-items:start}.role-panel{background:#fff;border:1px solid #e8e9ec;border-radius:12px;padding:17px}.role-panel h2{font:800 14px Manrope;margin:0 0 5px;color:#25252a}.role-panel>p{font-size:10px;color:#81828b;margin:0 0 14px}
    .role-form{display:grid;gap:3px}.role-form textarea{min-height:92px;resize:vertical}.role-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
    .role-photo-input{padding:12px!important;border-style:dashed!important;background:#fafafb!important}.role-previews{display:flex;gap:7px;flex-wrap:wrap;margin:0 0 12px}.role-previews img{width:68px;height:68px;object-fit:cover;border-radius:8px;border:1px solid #ddd}
    .role-note{padding:12px 14px;border-radius:9px;background:#fff8e9;border:1px solid #f1dfb4;color:#765819;font-size:11px;line-height:1.5;margin-bottom:14px}
    .role-empty{padding:30px 18px;text-align:center;background:#fff;border:1px dashed #d9dade;border-radius:12px;color:#777984;font-size:12px}
    .role-user-table{width:100%;border-collapse:collapse}.role-user-table th,.role-user-table td{padding:10px 9px;text-align:left;border-bottom:1px solid #eeeef0;font-size:11px}.role-user-table th{color:#858691;text-transform:uppercase;font-size:9px;letter-spacing:.6px}.role-notification-row{display:flex;gap:10px;padding:11px 0;border-bottom:1px solid #eeeeef}.role-notification-row:last-child{border:0}.role-notification-row i{width:7px;height:7px;border-radius:50%;background:#c5232b;margin-top:5px;flex:0 0 auto}.role-notification-row small{display:block;color:#8a8b93;font-size:10px;margin-top:3px}
    body.workshop-role .sidebar{display:none}body.workshop-role .app{display:block;min-height:100dvh}body.workshop-role main{min-height:100dvh}body.workshop-role .topbar{height:64px;padding:0 22px}body.workshop-role .topbar .crumb{font-size:11px}body.workshop-role .content{min-height:calc(100dvh - 64px);padding:24px 24px 42px}body.workshop-role #searchBtn,body.workshop-role #guideBtn{display:none}
    @media(max-width:850px){.role-two-col{grid-template-columns:1fr}.role-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}body.workshop-role .content{padding:18px 16px calc(28px + env(safe-area-inset-bottom))}}
    @media(max-width:600px){.role-page-head{align-items:flex-start;flex-direction:column}.role-page-head h1{font-size:23px}.role-form-grid{grid-template-columns:1fr}.role-task{padding:13px}.role-task-title{font-size:13px}.role-task-foot select{max-width:none;width:100%}.role-toolbar{align-items:flex-start;flex-direction:column}.role-kpi{padding:12px}.role-kpi b{font-size:20px}body.workshop-role .topbar{padding:0 13px}body.workshop-role .top-actions{gap:6px}.role-user-tools .role-chip{display:none}}
  `;
  document.head.append(style);

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
    });
    const type = response.headers.get('content-type') || '';
    const body = type.includes('application/json') ? await response.json() : null;
    if (!response.ok) throw new Error(body?.error || `Error ${response.status}`);
    return body;
  }

  function toast(message) {
    let node = $('.role-toast');
    if (!node) {
      node = document.createElement('div');
      node.className = 'role-toast';
      node.style.cssText = 'position:fixed;z-index:400;left:50%;bottom:24px;transform:translateX(-50%);background:#202126;color:#fff;border-radius:9px;padding:11px 15px;font:600 12px DM Sans,sans-serif;box-shadow:0 8px 30px #0003';
      document.body.append(node);
    }
    node.textContent = message;
    node.hidden = false;
    clearTimeout(node._timer);
    node._timer = setTimeout(() => { node.hidden = true; }, 2800);
  }

  const guides = {
    admin: [
      ['Bienvenido, Oscar', 'Tienes acceso completo a las secciones de Transcontrol. En Tareas del taller puedes coordinar los reportes que envía el equipo.'],
      ['Revisa los reportes', 'Abre Tareas del taller. Los reportes nuevos aparecen como Por revisar e incluyen unidad, falla y fotos.'],
      ['Asigna y da seguimiento', 'Elige un técnico y pulsa Asignar tarea. El técnico marcará el trabajo en curso y después lo enviará a revisión.'],
      ['Confirma el trabajo', 'Cuando aparezca Lista para revisar, revisa las fotos y el historial. Pulsa Confirmar y cerrar para completar el reporte.'],
      ['Administra las cuentas', 'En Usuarios y accesos puedes crear cuentas de taller o coordinación, cambiar contraseñas y desactivar accesos.']
    ],
    coordinator: [
      ['Bienvenida, Fernanda', 'Tu espacio está enfocado en coordinar el taller, consultar el estado de las unidades y atender reportes.'],
      ['Revisa cada falla', 'Abre Tareas del taller. En Por revisar encontrarás la descripción, el odómetro y las fotos enviadas por el técnico.'],
      ['Designa a quien la atiende', 'Selecciona un técnico de la lista y pulsa Asignar tarea. La asignación aparecerá en sus tareas.'],
      ['Revisa y cierra', 'Sigue los estados En trabajo y Lista para revisar. Al verificar que quedó resuelta, pulsa Confirmar y cerrar.'],
      ['Consulta avisos', 'El botón de notificaciones muestra los reportes y cambios recientes. Puedes volver a esta guía con Mi guía.']
    ],
    workshop: [
      ['Bienvenido al taller', 'Aquí puedes reportar fallas y atender las tareas que Oscar o Fernanda te asignen. No necesitas navegar por los tableros de administración.'],
      ['Reporta una falla', 'Pulsa Reportar falla. Selecciona el camión, escribe el odómetro, el tipo de problema y explica qué ocurrió.'],
      ['Agrega evidencia', 'Puedes tomar o elegir hasta tres fotos. Revisa que se vea claramente la falla antes de enviar el reporte.'],
      ['Espera la asignación', 'Al enviarlo, Oscar y Fernanda reciben el aviso. Uno de ellos designará al técnico responsable.'],
      ['Actualiza el avance', 'En Mis tareas pulsa Comenzar trabajo cuando inicies. Al terminar, pulsa Marcar lista para revisión. Coordinación revisará y cerrará el trabajo.']
    ]
  };

  function guideSeenKey() { return `tc-role-guide-seen:${currentUser?.username || 'user'}`; }

  function closeRoleGuide() {
    $('.role-guide-backdrop')?.remove();
    if (currentUser) {
      try { localStorage.setItem(guideSeenKey(), '1'); } catch { /* The guide remains available from its button. */ }
    }
  }

  function showRoleGuide(stepIndex = 0) {
    if (!currentUser) return;
    const steps = guides[currentUser.role] || guides.workshop;
    const index = Math.min(Math.max(stepIndex, 0), steps.length - 1);
    let backdrop = $('.role-guide-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'role-guide-backdrop';
      document.body.append(backdrop);
    }
    const [title, description] = steps[index];
    backdrop.innerHTML = `<section class="role-guide-card" role="dialog" aria-modal="true" aria-labelledby="roleGuideTitle"><button class="role-guide-close" type="button" data-role-guide="close" aria-label="Cerrar guía">×</button><div class="role-guide-kicker">Guía de ${esc(labels[currentUser.role])}</div><h2 id="roleGuideTitle">${esc(title)}</h2><p>${esc(description)}</p><div class="role-guide-progress"><i style="width:${Math.round((index + 1) / steps.length * 100)}%"></i></div><div class="role-guide-foot"><span class="role-guide-count">Paso ${index + 1} de ${steps.length}</span><div class="role-guide-actions"><button class="role-secondary" type="button" data-role-guide="back" ${index === 0 ? 'disabled' : ''}>Atrás</button><button class="role-primary" type="button" data-role-guide="next">${index === steps.length - 1 ? 'Terminar' : 'Siguiente'}</button></div></div></section>`;
  }

  function showLogin(error = '', username = '') {
    $('.role-auth')?.remove();
    const layer = document.createElement('div');
    layer.className = 'role-auth';
    layer.innerHTML = `<div class="role-auth-shell"><aside class="role-auth-brand"><img class="role-auth-logo" src="./brand-mark.png" alt="Trans Atlante"><div class="role-auth-brand-copy"><span class="role-auth-overline">TRANSCONTROL · CONTROL DE TALLER</span><h2>Mantenimiento claro.<br>Flota en movimiento.</h2><p>Reportes, técnicos y órdenes de trabajo, coordinados desde un solo lugar.</p></div><div class="role-auth-brand-foot"><i></i>Portal del equipo de mantenimiento</div></aside><form class="role-auth-card" id="roleLogin"><div class="role-auth-overline">Acceso al equipo</div><h1>Inicia sesión</h1><p>Ingresa con tu cuenta para ver el espacio de trabajo de tu perfil.</p>${error ? `<div class="role-error" role="alert">${esc(error)}</div>` : ''}<label>Usuario<input name="username" autocomplete="username" value="${esc(username)}" placeholder="Tu nombre de usuario" required autofocus></label><label>Contraseña<div class="role-auth-password"><input name="password" type="password" autocomplete="current-password" placeholder="Tu contraseña" required><button class="role-auth-show" type="button" data-show-password aria-label="Mostrar contraseña">Mostrar</button></div></label><button class="role-primary role-auth-submit" type="submit">Entrar <span aria-hidden="true">→</span></button><small class="role-auth-help">El acceso y las herramientas dependen de tu perfil.<br>Si necesitas ayuda, contacta a Oscar.</small></form></div>`;
    document.body.append(layer);
    $('[data-show-password]', layer).addEventListener('click', event => {
      const input = $('[name="password"]', layer);
      const visible = input.type === 'password';
      input.type = visible ? 'text' : 'password';
      event.currentTarget.textContent = visible ? 'Ocultar' : 'Mostrar';
      event.currentTarget.setAttribute('aria-label', `${visible ? 'Ocultar' : 'Mostrar'} contraseña`);
    });
    $('#roleLogin').addEventListener('submit', async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const button = $('button[type="submit"]', event.currentTarget);
      button.disabled = true;
      try {
        const result = await request('/api/login', { method: 'POST', body: JSON.stringify({ username: form.get('username'), password: form.get('password') }) });
        layer.remove();
        await activate(result.user);
      } catch (err) { showLogin(err.message, form.get('username')); }
    });
  }

  function ensureRoleNav() {
    const nav = $('.nav');
    if (!nav) return;
    if (!$('[data-role-section="tasks"]', nav)) {
      const tasks = document.createElement('button');
      tasks.className = 'role-nav';
      tasks.dataset.roleSection = 'tasks';
      tasks.dataset.short = 'Tareas';
      tasks.innerHTML = '<span aria-hidden="true">▤</span><span class="label">Tareas del taller</span>';
      nav.append(tasks);
    }
    if (currentUser.role === 'admin' && !$('[data-role-section="users"]', nav)) {
      const users = document.createElement('button');
      users.className = 'role-nav';
      users.dataset.roleSection = 'users';
      users.dataset.short = 'Usuarios';
      users.innerHTML = '<span aria-hidden="true">♙</span><span class="label">Usuarios y accesos</span>';
      nav.append(users);
    }
    document.querySelectorAll('.nav [data-section]').forEach(button => {
      const hide = currentUser.role === 'coordinator' && ['Almacén de refacciones', 'Reportes de taller'].includes(button.dataset.section);
      button.hidden = hide;
    });
  }

  function setProfile(user) {
    const profile = $('.profile');
    if (profile) {
      const initials = user.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
      profile.innerHTML = `<div class="avatar">${esc(initials)}</div><div><strong>${esc(user.name)}</strong><small>${esc(labels[user.role])}</small></div>`;
    }
    const dashboardProfile = $('.dashboard-profile');
    if (dashboardProfile) dashboardProfile.innerHTML = `<div class="avatar">${esc(user.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase())}</div><div><strong>${esc(user.name)}</strong><small>${esc(labels[user.role])}</small></div>`;
    const topAvatar = $('.top-actions>.avatar');
    if (topAvatar) topAvatar.textContent = user.name.split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
    if (!$('#roleGuideBtn')) {
      const guideButton = document.createElement('button');
      guideButton.type = 'button';
      guideButton.id = 'roleGuideBtn';
      guideButton.className = 'role-guide-trigger';
      guideButton.textContent = 'Mi guía';
      $('.top-actions')?.append(guideButton);
    }
    let tools = $('.role-user-tools');
    if (!tools) {
      tools = document.createElement('div');
      tools.className = 'role-user-tools';
      $('.top-actions')?.append(tools);
    }
    tools.innerHTML = `<span class="role-chip">${esc(labels[user.role])}</span><button class="role-logout" type="button">Salir</button>`;
    $('.role-logout', tools).addEventListener('click', async () => {
      await request('/api/logout', { method: 'POST', body: '{}' }).catch(() => {});
      location.reload();
    });
  }

  function pageHeader(title, description, action = '') {
    return `<div class="role-page-head"><div><div class="eyebrow">${esc(labels[currentUser.role])} · TALLER CENTRAL</div><h1>${title}</h1><p>${description}</p></div>${action}</div>`;
  }

  function statusPill(status) {
    return `<span class="role-status ${statusClass[status] || ''}">${esc(statusLabels[status] || status)}</span>`;
  }

  async function loadTechnicians() {
    const result = await request('/api/users?role=workshop');
    technicians = result.users;
  }

  function renderTask(task, manager) {
    const photos = task.photos?.length ? `<div class="role-photo-list">${task.photos.map(photo => `<a href="${esc(photo.url)}" target="_blank" rel="noopener"><img src="${esc(photo.url)}" alt="Foto de ${esc(task.truckId)}" loading="lazy"></a>`).join('')}</div>` : '';
    let controls = '';
    if (manager && task.status !== 'closed') {
      controls = task.status === 'ready_review'
        ? `<button class="role-primary" data-task-close="${esc(task.id)}">Confirmar y cerrar</button>`
        : `<select aria-label="Asignar técnico" data-assignee-for="${esc(task.id)}"><option value="">${task.assigneeId ? esc(task.assigneeName) : 'Elegir técnico'}</option>${technicians.map(person => `<option value="${esc(person.id)}" ${person.id === task.assigneeId ? 'selected' : ''}>${esc(person.name)}</option>`).join('')}</select><button class="role-primary" data-task-assign="${esc(task.id)}">${task.assigneeId ? 'Guardar asignación' : 'Asignar tarea'}</button>`;
    } else if (!manager && task.assigneeId === currentUser.id && task.status === 'assigned') {
      controls = `<button class="role-primary" data-task-status="in_progress" data-task-id="${esc(task.id)}">Comenzar trabajo</button>`;
    } else if (!manager && task.assigneeId === currentUser.id && task.status === 'in_progress') {
      controls = `<button class="role-primary" data-task-status="ready_review" data-task-id="${esc(task.id)}">Marcar lista para revisión</button>`;
    }
    const activity = task.activity?.length ? `<details style="margin-top:10px"><summary class="role-muted" style="cursor:pointer">Ver historial (${task.activity.length})</summary><div class="role-task-meta" style="display:grid;gap:6px;margin-top:8px">${task.activity.map(item => `<span>${new Date(item.createdAt).toLocaleString('es-MX')} · <b>${esc(item.userName)}</b> ${esc(item.detail)}</span>`).join('')}</div></details>` : '';
    return `<article class="role-task ${statusClass[task.status] || ''}"><div class="role-task-top"><div><div class="role-task-title">${esc(task.truckId)} · ${esc(task.title)}</div><div class="role-task-sub">${esc(task.id)} · Reportó ${esc(task.createdByName)} · ${new Date(task.createdAt).toLocaleString('es-MX')}</div></div>${statusPill(task.status)}</div><p>${esc(task.description)}</p><div class="role-task-meta"><span>Odómetro: <b>${esc(task.odometer)} km</b></span><span>Tipo: <b>${esc(task.category)}</b></span><span>Prioridad: <b>${esc(task.priority)}</b></span><span>Asignado: <b>${esc(task.assigneeName || 'Pendiente de asignar')}</b></span></div>${photos}<div class="role-task-foot">${controls}<span class="role-muted">Último cambio: ${new Date(task.updatedAt).toLocaleString('es-MX')}</span></div>${activity}</article>`;
  }

  async function renderTasks() {
    const host = $('.content');
    const manager = currentUser.role !== 'workshop';
    const result = await request('/api/tasks');
    const tasks = result.tasks;
    if (manager) await loadTechnicians();
    const pending = tasks.filter(task => task.status === 'pending_review').length;
    const active = tasks.filter(task => ['assigned', 'in_progress'].includes(task.status)).length;
    const ready = tasks.filter(task => task.status === 'ready_review').length;
    const title = manager ? 'Tareas y reportes del taller' : 'Mis tareas de taller';
    const description = manager
      ? 'Revisa los reportes con evidencia, asigna al técnico y confirma la reparación cuando esté lista.'
      : 'Consulta tus asignaciones, actualiza el avance y reporta una falla desde la unidad.';
    const reportButton = manager ? '' : '<button class="role-primary" data-open-report>＋ Reportar falla</button>';
    host.innerHTML = `<div class="role-content">${pageHeader(title, description, reportButton)}<div class="role-kpis"><div class="role-kpi"><b>${pending}</b><span>reportes por asignar</span></div><div class="role-kpi"><b>${active}</b><span>tareas activas</span></div><div class="role-kpi"><b>${ready}</b><span>listas para revisar</span></div><div class="role-kpi"><b>${tasks.length}</b><span>reportes visibles</span></div></div>${tasks.length ? `<div class="role-task-list">${tasks.map(task => renderTask(task, manager)).join('')}</div>` : '<div class="role-empty">Aún no hay reportes. Cuando el taller envíe uno, aparecerá aquí.</div>'}</div>`;
    setActiveRoleNav('tasks');
  }

  function setActiveRoleNav(section) {
    document.querySelectorAll('[data-role-section]').forEach(button => button.classList.toggle('active', button.dataset.roleSection === section));
    document.querySelectorAll('.nav button[data-section]').forEach(button => button.classList.remove('active'));
    const crumb = $('#crumbCurrent');
    if (crumb) crumb.textContent = section === 'users' ? 'Usuarios y accesos' : 'Tareas del taller';
  }

  function renderReportForm() {
    const host = $('.content');
    const unitOptions = Array.from({ length: 10 }, (_, index) => `TC-${String(index + 1).padStart(2, '0')}`).map(id => `<option>${id}</option>`).join('');
    host.innerHTML = `<div class="role-content">${pageHeader('Reportar una falla', 'Envía los datos y fotos del camión. Fernanda y Oscar recibirán el reporte para decidir quién lo atiende.')}<div class="role-note">El envío no asigna el trabajo automáticamente. Coordinación revisará la falla y elegirá al técnico.</div><div class="role-two-col"><section class="role-panel"><h2>Datos de la unidad y la falla</h2><p>Agrega información concreta y fotos claras para facilitar el diagnóstico.</p><form class="role-form" id="reportForm"><div class="role-form-grid"><label>Unidad<select name="truckId" required>${unitOptions}</select></label><label>Odómetro<input name="odometer" required inputmode="numeric" placeholder="Ej. 175600"></label></div><div class="role-form-grid"><label>Tipo de problema<select name="category" required><option value="">Selecciona</option><option>Mecánico</option><option>Frenos</option><option>Motor</option><option>Eléctrico</option><option>Neumático</option><option>Llantas</option><option>Otro</option></select></label><label>Prioridad<select name="priority" required><option>Media</option><option>Baja</option><option>Alta</option></select></label></div><label>Resumen<input name="title" maxlength="140" required placeholder="Ej. Fuga en línea de aire trasera"></label><label>Qué pasó<textarea name="description" maxlength="1500" required placeholder="Cuándo empezó, síntomas, luces de tablero o checklist relacionado"></textarea></label><label>Fotos (hasta 3)<input class="role-photo-input" name="photos" type="file" accept="image/*" capture="environment" multiple><small class="role-muted">La app reduce el tamaño antes de guardar y compartir las imágenes.</small></label><div class="role-previews" id="reportPreviews"></div><div class="role-toolbar"><button type="submit" class="role-primary">Enviar a Fernanda y Oscar</button><button type="button" class="role-secondary" data-role-section="tasks">Cancelar</button></div></form></section><aside class="role-panel"><h2>Después de enviarlo</h2><p>Así avanza cada reporte</p><div class="role-task-meta" style="display:grid;gap:12px"><span>1 · El taller informa la falla y adjunta fotos.</span><span>2 · Fernanda y Oscar reciben el aviso.</span><span>3 · Uno de ellos asigna al técnico responsable.</span><span>4 · El técnico actualiza el avance.</span><span>5 · Fernanda u Oscar revisa y cierra el trabajo.</span></div></aside></div></div>`;
    setActiveRoleNav('tasks');
  }

  async function compressPhoto(file) {
    if (!file.type.startsWith('image/')) throw new Error(`${file.name} no es una imagen.`);
    const source = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
    source.close();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .78));
    if (!blob) throw new Error(`No pude preparar ${file.name}.`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
      reader.onerror = () => reject(new Error(`No pude leer ${file.name}.`));
      reader.readAsDataURL(blob);
    });
  }

  async function submitReport(form) {
    const submit = $('button[type="submit"]', form);
    submit.disabled = true;
    submit.textContent = 'Preparando reporte…';
    try {
      const data = new FormData(form);
      const files = Array.from(form.elements.photos.files || []);
      if (files.length > 3) throw new Error('Puedes adjuntar hasta 3 fotografías.');
      const photos = await Promise.all(files.map(compressPhoto));
      const payload = Object.fromEntries(['truckId', 'odometer', 'category', 'priority', 'title', 'description'].map(key => [key, data.get(key)]));
      payload.photos = photos;
      await request('/api/reports', { method: 'POST', body: JSON.stringify(payload) });
      await renderTasks();
      toast('Reporte enviado. Fernanda y Oscar recibieron el aviso.');
    } catch (error) {
      submit.disabled = false;
      submit.textContent = 'Enviar a Fernanda y Oscar';
      toast(error.message);
    }
  }

  async function renderUsers() {
    if (currentUser.role !== 'admin') return renderTasks();
    const { users } = await request('/api/users');
    const rows = users.map(user => `<tr><td><b>${esc(user.name)}</b><small class="role-muted" style="display:block;margin-top:3px">${esc(user.username)}</small></td><td>${esc(labels[user.role])}</td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="role-secondary" data-reset-user="${esc(user.id)}">Cambiar contraseña</button>${user.id === currentUser.id ? '<span class="role-muted">Sesión actual</span>' : `<button class="role-secondary" data-delete-user="${esc(user.id)}">Desactivar</button>`}</div></td></tr>`).join('');
    $('.content').innerHTML = `<div class="role-content">${pageHeader('Usuarios y accesos', 'Oscar administra cuentas y permisos. Desactiva el acceso cuando un empleado deje el equipo.')}<div class="role-two-col"><section class="role-panel"><h2>Personal registrado</h2><p>El permiso se valida en el servidor en cada acción.</p><div class="table-scroll"><table class="role-user-table"><thead><tr><th>Persona</th><th>Perfil</th><th>Acceso</th></tr></thead><tbody>${rows}</tbody></table></div></section><section class="role-panel"><h2>Agregar empleado</h2><p>Las cuentas nuevas quedan activas al guardarlas.</p><form class="role-form" id="userForm"><label>Nombre<input name="name" required maxlength="100" placeholder="Nombre y apellido"></label><label>Usuario<input name="username" required minlength="3" maxlength="40" pattern="[a-zA-Z0-9._-]+" placeholder="ej. raul.soto"></label><label>Perfil<select name="role"><option value="workshop">Taller · Técnico</option><option value="coordinator">Coordinación</option></select></label><label>Contraseña inicial<input name="password" type="password" required minlength="12" autocomplete="new-password"></label><button class="role-primary" type="submit">Crear cuenta</button></form></section></div></div>`;
    setActiveRoleNav('users');
  }

  async function subscribePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return toast('Este dispositivo no permite notificaciones push.');
    const config = await request('/api/push/public-key');
    if (!config.publicKey) return toast('No hay clave VAPID disponible para habilitar avisos con la app cerrada.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return toast('No se concedió permiso para notificaciones.');
    const registration = await navigator.serviceWorker.ready;
    const key = Uint8Array.from(atob(config.publicKey.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    await request('/api/push-subscriptions', { method: 'POST', body: JSON.stringify({ subscription: subscription.toJSON() }) });
    toast('Notificaciones de tareas activadas en este dispositivo.');
  }

  async function refreshNotifications() {
    if (!currentUser) return;
    try {
      const { notifications } = await request('/api/notifications');
      const panel = $('#notificationPanel');
      if (!panel) return;
      const unread = notifications.filter(note => !note.readAt).length;
      const dot = $('.notify-dot');
      if (dot) dot.style.display = unread ? '' : 'none';
      panel.innerHTML = `<div class="notification-head">Avisos y tareas <button id="markRoleRead">Marcar leídas</button></div>${notifications.length ? notifications.map(note => `<div class="notification-item ${note.readAt ? 'read' : ''}"><i style="opacity:${note.readAt ? '.25' : '1'}"></i><div><b>${esc(note.title)}</b><small>${esc(note.body)}</small><small>${new Date(note.createdAt).toLocaleString('es-MX')}</small></div></div>`).join('') : '<div class="notification-item"><div><small>No tienes avisos nuevos.</small></div></div>'}<div class="notification-foot"><button id="enablePush">Activar avisos en este dispositivo</button></div>`;
    } catch { /* The live task screen still works when the notification panel is closed. */ }
  }

  function onRoleClick(event) {
    if (event.target.closest('#roleGuideBtn')) { showRoleGuide(); return; }
    if (event.target.classList.contains('role-guide-backdrop')) { closeRoleGuide(); return; }
    const guideAction = event.target.closest('[data-role-guide]')?.dataset.roleGuide;
    if (guideAction) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const step = Number($('.role-guide-count')?.textContent.match(/\d+/)?.[0] || 1) - 1;
      if (guideAction === 'close') closeRoleGuide();
      if (guideAction === 'back') showRoleGuide(step - 1);
      if (guideAction === 'next') {
        const steps = guides[currentUser?.role] || guides.workshop;
        if (step >= steps.length - 1) closeRoleGuide();
        else showRoleGuide(step + 1);
      }
      return;
    }
    if (event.target.closest('.nav button[data-section="Centro de control"]') && currentUser) {
      setTimeout(() => setProfile(currentUser), 0);
    }
    const nav = event.target.closest('[data-role-section]');
    if (nav) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (nav.dataset.roleSection === 'users') renderUsers().catch(error => toast(error.message));
      else renderTasks().catch(error => toast(error.message));
      return;
    }
    const report = event.target.closest('[data-open-report]');
    if (report) { renderReportForm(); return; }
    const assign = event.target.closest('[data-task-assign]');
    if (assign) {
      const select = $(`[data-assignee-for="${CSS.escape(assign.dataset.taskAssign)}"]`);
      if (!select.value) return toast('Selecciona al técnico que atenderá la tarea.');
      assign.disabled = true;
      request(`/api/tasks/${encodeURIComponent(assign.dataset.taskAssign)}/assign`, { method: 'POST', body: JSON.stringify({ assigneeId: select.value }) })
        .then(async () => { toast('Tarea asignada. El técnico recibirá el aviso.'); await renderTasks(); await refreshNotifications(); })
        .catch(error => { assign.disabled = false; toast(error.message); });
      return;
    }
    const changeStatus = event.target.closest('[data-task-status]');
    if (changeStatus) {
      request(`/api/tasks/${encodeURIComponent(changeStatus.dataset.taskId)}/status`, { method: 'PATCH', body: JSON.stringify({ status: changeStatus.dataset.taskStatus }) })
        .then(() => { toast('Avance enviado a coordinación.'); return renderTasks(); })
        .catch(error => toast(error.message));
      return;
    }
    const closeTask = event.target.closest('[data-task-close]');
    if (closeTask) {
      request(`/api/tasks/${encodeURIComponent(closeTask.dataset.taskClose)}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) })
        .then(() => { toast('Trabajo revisado y cerrado.'); return renderTasks(); })
        .catch(error => toast(error.message));
      return;
    }
    const deleteUser = event.target.closest('[data-delete-user]');
    if (deleteUser) {
      if (!confirm('¿Desactivar el acceso de esta persona?')) return;
      request(`/api/users/${encodeURIComponent(deleteUser.dataset.deleteUser)}`, { method: 'DELETE' })
        .then(() => { toast('Acceso desactivado.'); return renderUsers(); })
        .catch(error => toast(error.message));
      return;
    }
    const resetUser = event.target.closest('[data-reset-user]');
    if (resetUser) {
      const password = prompt('Escribe una contraseña nueva de al menos 12 caracteres:');
      if (!password) return;
      request(`/api/users/${encodeURIComponent(resetUser.dataset.resetUser)}/password`, { method: 'PATCH', body: JSON.stringify({ password }) })
        .then(() => toast('Contraseña actualizada.'))
        .catch(error => toast(error.message));
      return;
    }
    if (event.target.closest('#markRoleRead')) {
      request('/api/notifications/read', { method: 'POST', body: '{}' }).then(refreshNotifications).catch(error => toast(error.message));
      return;
    }
    if (event.target.closest('#enablePush')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      subscribePush().catch(error => toast(error.message));
    }
  }

  async function activate(user) {
    currentUser = user;
    ensureRoleNav();
    setProfile(user);
    document.body.classList.toggle('workshop-role', user.role === 'workshop');
    document.addEventListener('click', onRoleClick, true);
    document.addEventListener('submit', event => {
      if (event.target.id === 'reportForm') { event.preventDefault(); submitReport(event.target); }
      if (event.target.id === 'userForm') {
        event.preventDefault();
        const data = new FormData(event.target);
        const payload = Object.fromEntries(['name', 'username', 'role', 'password'].map(key => [key, data.get(key)]));
        request('/api/users', { method: 'POST', body: JSON.stringify(payload) })
          .then(() => { toast('Cuenta creada.'); return renderUsers(); })
          .catch(error => toast(error.message));
      }
    });
    document.addEventListener('change', event => {
      if (event.target.id === 'reportForm' || event.target.name !== 'photos') return;
      let files = Array.from(event.target.files || []);
      if (files.length > 3) {
        toast('Puedes adjuntar hasta 3 fotografías.');
        files = files.slice(0, 3);
        const transfer = new DataTransfer();
        files.forEach(file => transfer.items.add(file));
        event.target.files = transfer.files;
      }
      const preview = $('#reportPreviews');
      if (preview) {
        preview.querySelectorAll('img').forEach(image => URL.revokeObjectURL(image.src));
        preview.innerHTML = files.map(file => `<img src="${URL.createObjectURL(file)}" alt="Vista previa">`).join('');
      }
    });
    const readOnly = user.role === 'workshop';
    if (readOnly) {
      const main = $('main');
      const topbar = $('.topbar');
      topbar.querySelector('.crumb').innerHTML = `Taller Central <span style="margin:0 8px;color:#c2cbd4">/</span> <strong id="crumbCurrent">Mis tareas</strong>`;
      topbar.querySelector('.top-actions').innerHTML = `<span class="role-chip">TALLER</span><button type="button" id="roleGuideBtn" class="role-guide-trigger">Guía</button><span class="role-user-tools"><span class="role-muted">${esc(user.name)}</span><button class="role-logout" type="button">Salir</button></span>`;
      $('.role-logout', topbar).addEventListener('click', async () => { await request('/api/logout', { method: 'POST', body: '{}' }).catch(() => {}); location.reload(); });
    }
    if (user.role === 'admin' || user.role === 'coordinator') {
      const alertCount = $('.nav .count');
      if (alertCount) alertCount.style.display = 'none';
    }
    if (refreshTimer) clearInterval(refreshTimer);
    await refreshNotifications();
    refreshTimer = setInterval(() => { refreshNotifications(); if ($('[data-role-section="tasks"]')?.classList.contains('active')) renderTasks().catch(() => {}); }, 30_000);
    await renderTasks();
    try { if (!localStorage.getItem(guideSeenKey())) setTimeout(() => showRoleGuide(), 450); } catch { setTimeout(() => showRoleGuide(), 450); }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    document.addEventListener('click', event => {
      const bell = event.target.closest('#bellBtn');
      if (bell) setTimeout(refreshNotifications, 20);
    });
    try {
      const result = await request('/api/session');
      await activate(result.user);
    } catch (error) {
      if (/Inicia sesión|401/.test(error.message)) showLogin();
      else {
        const note = document.createElement('div');
        note.className = 'role-muted';
        note.style.cssText = 'position:fixed;bottom:8px;right:10px;z-index:40;background:#fff;padding:6px 9px;border:1px solid #eee;border-radius:7px';
        note.textContent = 'Modo demostración: las tareas compartidas requieren el servicio del backend.';
        document.body.append(note);
      }
    }
  });
})();
