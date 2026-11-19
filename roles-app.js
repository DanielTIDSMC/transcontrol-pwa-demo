(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  // ==========================================
  // LIBRERÍA DE ICONOS SVG MINIMALISTAS
  // ==========================================
  const ICONS = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    tickets: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    play: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 4 20 12 6 20 6 4"/></svg>',
    check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    lock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    search: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    bell: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    sun: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    alertCircle: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    activity: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    checkCircle: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    clock: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    messageSquare: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    mapPin: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    user: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    wrench: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    camera: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    // Categorías de soporte
    computer: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    mail: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    network: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    app: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    printer: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    phone: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    key: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-1.5 1.5L14 9l-3 3-2-2-4 4 2 2-2 2 4 4 2-2 2 2 4-4-2-2 3.5-3.5L22 4z"/><circle cx="7.5" cy="16.5" r="1.5"/></svg>',
    box: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>'
  };

  const roleLabels = { admin: 'Administrador TICS', coordinator: 'Equipo TICS', workshop: 'Colaborador' };
  const roleClasses = { admin: 'role-admin', coordinator: 'role-coordinator', workshop: 'role-workshop' };
  const statusLabels = {
    pending_review: 'Nuevo',
    assigned: 'Asignado',
    in_progress: 'En atención',
    ready_review: 'Resuelto',
    closed: 'Cerrado'
  };

  const categoryIcons = {
    'Equipo de cómputo': ICONS.computer,
    'Correo electrónico': ICONS.mail,
    'Internet y red': ICONS.network,
    'Sistema o aplicación': ICONS.app,
    'Impresora': ICONS.printer,
    'Telefonía': ICONS.phone,
    'Accesos y contraseñas': ICONS.key,
    'Otro': ICONS.box
  };

  let currentUser = null;
  let technicians = [];
  let currentView = 'dashboard';
  let activeFilter = 'all';
  let searchQuery = '';
  let priorityFilter = 'all';
  let areaFilter = 'all';
  let sseSource = null;
  let allCachedTasks = [];

  // ==========================================
  // HTTP & TOAST HELPERS
  // ==========================================
  async function request(url, options = {}) {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Ocurrió un error en el servidor.');
    return data;
  }

  function toast(message, linkText = null, onLinkClick = null) {
    const container = $('#toastContainer');
    if (!container) return;
    const toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.innerHTML = `<span>${esc(message)}</span>`;
    if (linkText && onLinkClick) {
      const link = document.createElement('span');
      link.className = 'toast-link';
      link.textContent = linkText;
      link.onclick = onLinkClick;
      toastEl.appendChild(link);
    }
    container.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 3200);
  }

  function getInitials(name = '') {
    return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U';
  }

  // ==========================================
  // THEME (DARK / LIGHT MODE)
  // ==========================================
  function initTheme() {
    const saved = localStorage.getItem('tc_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    setTheme(theme);

    const toggleBtn = $('#themeToggle');
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        setTheme(next);
      };
    }
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tc_theme', theme);
    const btn = $('#themeToggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? ICONS.sun : ICONS.moon;
      btn.setAttribute('title', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
  }

  // ==========================================
  // SHELL & NAVIGATION
  // ==========================================
  function shell(user) {
    currentUser = user;
    $('#login').hidden = true;
    $('#app').hidden = false;

    // Sidebar user profile
    const avatar = $('#sidebarAvatar');
    if (avatar) avatar.textContent = getInitials(user.name);
    const nameEl = $('#sidebarUserName');
    if (nameEl) nameEl.textContent = user.name;
    const roleEl = $('#sidebarUserRole');
    if (roleEl) roleEl.textContent = roleLabels[user.role] || user.role;

    // Permissions check
    const isManager = ['admin', 'coordinator'].includes(user.role);
    const isAdmin = user.role === 'admin';

    // Navigation elements
    $('#dashboardNav').hidden = !isManager;
    $('#userNav').hidden = !isAdmin;

    const bottomDash = $(`[data-nav="dashboard"]`);
    if (bottomDash) bottomDash.hidden = !isManager;
    const bottomUsers = $(`[data-nav="users"]`);
    if (bottomUsers) bottomUsers.hidden = !isAdmin;

    // Event listeners
    $('#logout').onclick = async () => {
      if (sseSource) sseSource.close();
      await request('/api/logout', { method: 'POST', body: '{}' }).catch(() => {});
      location.reload();
    };

    $('#dashboardNav').onclick = () => navigateTo('dashboard');
    $('#ticketNav').onclick = () => navigateTo('tickets');
    $('#userNav').onclick = () => navigateTo('users');

    $$('.bottom-nav-item').forEach(btn => {
      btn.onclick = () => navigateTo(btn.dataset.nav);
    });

    // Mobile sidebar toggle
    const menuBtn = $('#menuToggle');
    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');
    if (menuBtn && sidebar && overlay) {
      menuBtn.onclick = () => {
        sidebar.classList.add('open');
        overlay.classList.add('open');
      };
      overlay.onclick = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      };
    }

    // Topbar search
    const globalSearch = $('#globalSearch');
    if (globalSearch) {
      globalSearch.oninput = (e) => {
        searchQuery = e.target.value.trim();
        if (currentView !== 'tickets') {
          navigateTo('tickets');
        } else {
          filterAndRenderTickets();
        }
      };
    }

    // Notifications toggle
    const bellBtn = $('#bellBtn');
    const notifPanel = $('#notificationPanel');
    if (bellBtn && notifPanel) {
      bellBtn.onclick = (e) => {
        e.stopPropagation();
        notifPanel.classList.toggle('open');
      };
      document.addEventListener('click', (e) => {
        if (!notifPanel.contains(e.target) && e.target !== bellBtn) {
          notifPanel.classList.remove('open');
        }
      });
    }

    // Start Real-Time updates (SSE)
    initSSE();

    // Initial notifications fetch
    refreshNotifications();
    setInterval(refreshNotifications, 45000);

    // Initial view navigation
    if (isManager) {
      navigateTo('dashboard');
    } else {
      navigateTo('tickets');
    }
  }

  function navigateTo(view) {
    currentView = view;
    // Close mobile sidebar if open
    $('#sidebar')?.classList.remove('open');
    $('#sidebarOverlay')?.classList.remove('open');

    // Update desktop sidebar buttons
    $('#dashboardNav')?.classList.toggle('active', view === 'dashboard');
    $('#ticketNav')?.classList.toggle('active', view === 'tickets');
    $('#userNav')?.classList.toggle('active', view === 'users');

    // Update bottom nav
    $$('.bottom-nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === view);
    });

    // Topbar title
    const titles = { dashboard: 'Dashboard Ejecutivo', tickets: 'Órdenes de Soporte', users: 'Gestión de Usuarios' };
    const pageTitle = $('#pageTitle');
    if (pageTitle) pageTitle.textContent = titles[view] || 'Mesa de ayuda';

    if (view === 'dashboard') renderDashboard();
    else if (view === 'tickets') renderTickets();
    else if (view === 'users') renderUsers();
  }

  // ==========================================
  // REAL-TIME (SERVER-SENT EVENTS)
  // ==========================================
  function initSSE() {
    if (!window.EventSource) return;
    if (sseSource) sseSource.close();

    try {
      sseSource = new EventSource('/api/events/stream');
      sseSource.addEventListener('task_update', (e) => {
        refreshNotifications();
        if (currentView === 'tickets') {
          fetchAndRenderTicketsSilent();
        } else if (currentView === 'dashboard') {
          renderDashboard(true);
        }
        toast('Actualización en tiempo real recibida ⚡');
      });
      sseSource.onerror = () => {
        // SSE handles reconnection automatically
      };
    } catch {
      // Fallback gracefully
    }
  }

  // ==========================================
  // DASHBOARD VIEW
  // ==========================================
  async function renderDashboard(silent = false) {
    const content = $('#content');
    if (!silent) {
      content.innerHTML = `
        <div class="view-transition">
          <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px;">
            <div>
              <div class="eyebrow">MESA DE AYUDA TICS · TRANSATLANTE</div>
              <h1>Soporte Tecnológico Integral</h1>
              <p>Mesa de servicio técnico de TICS para las áreas Administrativas (Oficinas/Tráfico) y Taller Operativo (Piso/Refacciones).</p>
            </div>
            <button class="btn btn-secondary" id="btnPrintReport" style="display:inline-flex; align-items:center; gap:8px;">
              ${ICONS.tickets}
              <span>Imprimir Bitácora TICS</span>
            </button>
          </div>
          <div class="metrics-row">
            <div class="metric-card"><div class="metric-icon mi-red">${ICONS.alertCircle}</div><div class="metric-value" id="m-new">--</div><div class="metric-label">Tickets Nuevos</div><div class="metric-trend down">Por asignar</div></div>
            <div class="metric-card"><div class="metric-icon mi-amber">${ICONS.activity}</div><div class="metric-value" id="m-proc">--</div><div class="metric-label">En Atención</div><div class="metric-trend up">En proceso por TICS</div></div>
            <div class="metric-card"><div class="metric-icon mi-green">${ICONS.checkCircle}</div><div class="metric-value" id="m-done">--</div><div class="metric-label">Resueltos (Semana)</div><div class="metric-trend up">+15% vs sem. ant.</div></div>
            <div class="metric-card"><div class="metric-icon mi-dark">${ICONS.clock}</div><div class="metric-value" id="m-time">--</div><div class="metric-label">Tiempo de Respuesta</div><div class="metric-trend down">SLA cumplimiento 95%</div></div>
          </div>

          <!-- Áreas Atendidas por TICS -->
          <div class="support-areas-card">
            <div class="support-areas-header">
              <div>
                <h3>Cobertura de Soporte TICS por Área</h3>
                <small style="color:var(--text-muted);">Haz clic en cualquier área para filtrar los requerimientos en seguimiento</small>
              </div>
              <span class="status-pill ready_review">Sistemas Operativos 100%</span>
            </div>
            <div class="areas-grid">
              <div class="area-card" data-area-filter="Tráfico">
                <div class="area-card-head">
                  <div class="area-card-title">${ICONS.computer}<span>Área Administrativa & Oficinas</span></div>
                  <span class="area-badge">2 Tickets</span>
                </div>
                <div class="area-card-desc">Soporte a Tráfico, Facturación y Recursos Humanos: timbrado TMS, cartas porte SAT, ERP y conmutador.</div>
                <div class="area-tags">
                  <span class="area-tag">Facturación TMS</span>
                  <span class="area-tag">Red Oficinas</span>
                  <span class="area-tag">Office 365</span>
                  <span class="area-tag">Conmutador</span>
                </div>
              </div>

              <div class="area-card" data-area-filter="Taller">
                <div class="area-card-head">
                  <div class="area-card-title">${ICONS.wrench}<span>Taller Mecánico & Refacciones</span></div>
                  <span class="area-badge">3 Tickets</span>
                </div>
                <div class="area-card-desc">Soporte a Bahías de mantenimiento y almacén: laptops OBD de diagnóstico diesel, antenas GPS e impresoras Zebra.</div>
                <div class="area-tags">
                  <span class="area-tag">Diagnóstico OBD</span>
                  <span class="area-tag">Antenas GPS Cabina</span>
                  <span class="area-tag">Impresoras Zebra</span>
                  <span class="area-tag">Wi-Fi Patio</span>
                </div>
              </div>
            </div>
          </div>

          <div class="charts-row">
            <div class="chart-card">
              <h3>Distribución por Estado</h3>
              <div class="donut-wrap" id="donutContainer"><div class="skeleton-card" style="height:180px;width:100%;"></div></div>
            </div>
            <div class="chart-card">
              <h3>Incidencias por Categoría</h3>
              <div id="barContainer"><div class="skeleton-card" style="height:180px;width:100%;"></div></div>
            </div>
          </div>
          <div class="activity-card">
            <h3>Bitácora de Actividad Reciente</h3>
            <div id="activityContainer"><div class="skeleton-card" style="height:120px;width:100%;"></div></div>
          </div>
        </div>
      `;
    }

    try {
      const [stats, tasksData] = await Promise.all([
        request('/api/stats').catch(() => null),
        request('/api/tasks')
      ]);

      const tasks = tasksData.tasks || [];
      allCachedTasks = tasks;

      const newCount = stats?.byStatus?.pending_review ?? tasks.filter(t => t.status === 'pending_review').length;
      const procCount = (stats?.byStatus?.in_progress ?? 0) + (stats?.byStatus?.assigned ?? 0);
      const doneCount = stats?.resolvedThisWeek ?? tasks.filter(t => ['ready_review', 'closed'].includes(t.status)).length;
      const avgHours = stats?.avgResolutionHours ? `${stats.avgResolutionHours}h` : '3.8h';

      animateValue($('#m-new'), 0, newCount, 600);
      animateValue($('#m-proc'), 0, procCount, 600);
      animateValue($('#m-done'), 0, doneCount, 600);
      const timeEl = $('#m-time');
      if (timeEl) timeEl.textContent = avgHours;

      // Draw SVG Donut Chart with brand colors
      drawDonutChart(stats?.byStatus || {
        pending_review: newCount,
        assigned: tasks.filter(t => t.status === 'assigned').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        ready_review: tasks.filter(t => t.status === 'ready_review').length,
        closed: tasks.filter(t => t.status === 'closed').length
      });

      // Draw Horizontal Bar Chart
      drawCategoryBars(stats?.byCategory || calculateCategoryCounts(tasks));

      // Draw Activity Feed
      drawActivityFeed(tasks);

      // Print report button listener
      $('#btnPrintReport')?.addEventListener('click', () => {
        window.print();
      });

      // Area filter clicks (Administración vs Taller)
      content.querySelectorAll('[data-area-filter]').forEach(card => {
        card.onclick = () => {
          searchQuery = card.dataset.areaFilter;
          const searchInput = $('#globalSearch');
          if (searchInput) searchInput.value = searchQuery;
          navigateTo('tickets');
        };
      });

    } catch (err) {
      console.error(err);
      toast('Error al actualizar dashboard: ' + err.message);
    }
  }

  function animateValue(obj, start, end, duration) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  function calculateCategoryCounts(tasks) {
    const counts = {};
    for (const t of tasks) counts[t.category] = (counts[t.category] || 0) + 1;
    return counts;
  }

  function drawDonutChart(byStatus) {
    const container = $('#donutContainer');
    if (!container) return;

    // Paleta 100% libre de azul — Rojo corporativo, carbón y neutros
    const colors = {
      pending_review: '#c5232b',
      assigned: '#262626',
      in_progress: '#d97706',
      ready_review: '#16a34a',
      closed: '#737373'
    };

    const total = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;
    const size = 160;
    const strokeWidth = 26;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedAngle = 0;
    const paths = [];
    const legendItems = [];

    for (const [status, count] of Object.entries(byStatus)) {
      const percentage = count / total;
      const strokeDash = `${percentage * circumference} ${circumference}`;
      const rotation = accumulatedAngle * 360 - 90;
      accumulatedAngle += percentage;

      paths.push(`
        <circle cx="${size/2}" cy="${size/2}" r="${radius}"
          fill="none" stroke="${colors[status] || '#737373'}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeDash}"
          transform="rotate(${rotation} ${size/2} ${size/2})"
          style="transition: stroke-dasharray 1s ease;" />
      `);

      legendItems.push(`
        <div class="donut-legend-item">
          <div class="donut-legend-dot" style="background:${colors[status]};"></div>
          <div>${statusLabels[status] || status}</div>
          <span>${count} (${Math.round(percentage * 100)}%)</span>
        </div>
      `);
    }

    container.innerHTML = `
      <div style="position:relative; width:${size}px; height:${size}px; flex-shrink:0;">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="var(--bg-primary)" stroke-width="${strokeWidth}"/>
          ${paths.join('')}
        </svg>
        <div style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none;">
          <b style="font-size:22px; font-weight:800; color:var(--text-primary);">${total}</b>
          <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Tickets</span>
        </div>
      </div>
      <div class="donut-legend">${legendItems.join('')}</div>
    `;
  }

  function drawCategoryBars(byCategory) {
    const container = $('#barContainer');
    if (!container) return;

    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Sin datos de categorías aún.</p>';
      return;
    }

    const max = Math.max(...entries.map(e => e[1])) || 1;
    const html = entries.map(([category, count]) => {
      const pct = Math.round((count / max) * 100);
      const icon = categoryIcons[category] || ICONS.box;
      return `
        <div class="bar-row">
          <div class="bar-label" title="${esc(category)}" style="display:flex; align-items:center; justify-content:flex-end; gap:6px;">
            <span>${icon}</span>
            <span>${esc(category)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%;"></div>
          </div>
          <div class="bar-value">${count}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  function drawActivityFeed(tasks) {
    const container = $('#activityContainer');
    if (!container) return;

    const events = [];
    tasks.forEach(t => {
      if (t.activity && Array.isArray(t.activity)) {
        t.activity.forEach(ev => events.push({ ...ev, taskTitle: t.title, taskIdentifier: t.id }));
      }
    });

    events.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const recent = events.slice(0, 6);

    if (!recent.length) {
      container.innerHTML = '<p style="color:var(--text-muted); font-size:13px; padding:8px 0;">No hay actividad reciente registrada.</p>';
      return;
    }

    container.innerHTML = recent.map(item => `
      <div class="activity-item">
        <div class="activity-avatar" style="background:var(--brand-red);">
          ${getInitials(item.userName)}
        </div>
        <div class="activity-info">
          <p><b>${esc(item.userName)}</b> ${esc(item.detail)} en <b style="color:var(--brand-red);">${esc(item.taskIdentifier || '')}</b></p>
          <div class="activity-time">${formatTimeAgo(item.createdAt)} · ${new Date(item.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    `).join('');
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} d`;
  }

  // ==========================================
  // TICKETS VIEW & FILTERING
  // ==========================================
  async function loadTechnicians() {
    try {
      const data = await request('/api/users?role=coordinator');
      technicians = data.users || [];
    } catch {
      technicians = [];
    }
  }

  async function renderTickets() {
    const content = $('#content');
    const isWorkshop = currentUser.role === 'workshop';
    const isManager = ['admin', 'coordinator'].includes(currentUser.role);

    content.innerHTML = `
      <div class="view-transition">
        <div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px;">
          <div>
            <div class="eyebrow">MESA DE SOPORTE · TRANSATLANTE</div>
            <h1>${isWorkshop ? 'Mis Solicitudes' : 'Control de Órdenes de Servicio'}</h1>
            <p>${isWorkshop ? 'Reporta incidentes de tus equipos y consulta su progreso.' : 'Seguimiento, asignación y resolución de solicitudes técnicas.'}</p>
          </div>
          ${isWorkshop ? `<button class="btn btn-primary" id="btnNewTicket" style="font-size:13px; padding:11px 18px; display:inline-flex; align-items:center; gap:8px;">${ICONS.plus}<span>Levantar Ticket</span></button>` : ''}
        </div>

        <div class="filter-bar">
          <button class="filter-chip active" data-filter="all">Todos</button>
          <button class="filter-chip" data-filter="pending_review">Nuevos</button>
          <button class="filter-chip" data-filter="assigned">Asignados</button>
          <button class="filter-chip" data-filter="in_progress">En Atención</button>
          <button class="filter-chip" data-filter="ready_review">Resueltos</button>
          <button class="filter-chip" data-filter="closed">Cerrados</button>
          
          <select id="areaSelect" class="filter-chip" style="outline:none; cursor:pointer;">
            <option value="all">Área: Todas</option>
            <option value="Tráfico">Oficinas / Administración</option>
            <option value="Taller">Taller / Patio</option>
          </select>

          <select id="prioritySelect" class="filter-chip" style="outline:none; cursor:pointer;">
            <option value="all">Prioridad: Todas</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>

          <div class="filter-search">
            <span class="fs-icon">${ICONS.search}</span>
            <input type="search" id="filterInput" placeholder="Filtrar por texto..." value="${esc(searchQuery)}">
          </div>
        </div>

        <div id="ticketsContainer">
          <div class="skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        </div>
      </div>
    `;

    $('#btnNewTicket')?.addEventListener('click', renderTicketForm);

    // Setup filter chips
    $$('.filter-chip[data-filter]').forEach(chip => {
      chip.onclick = () => {
        $$('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeFilter = chip.dataset.filter;
        filterAndRenderTickets();
      };
    });

    const aSelect = $('#areaSelect');
    if (aSelect) {
      aSelect.value = areaFilter;
      aSelect.onchange = (e) => {
        areaFilter = e.target.value;
        filterAndRenderTickets();
      };
    }

    const pSelect = $('#prioritySelect');
    if (pSelect) {
      pSelect.value = priorityFilter;
      pSelect.onchange = (e) => {
        priorityFilter = e.target.value;
        filterAndRenderTickets();
      };
    }

    const fInput = $('#filterInput');
    if (fInput) {
      fInput.oninput = (e) => {
        searchQuery = e.target.value.trim();
        filterAndRenderTickets();
      };
    }

    if (isManager) await loadTechnicians();
    await fetchAndRenderTicketsSilent();
  }

  async function fetchAndRenderTicketsSilent() {
    try {
      const data = await request('/api/tasks');
      allCachedTasks = data.tasks || [];
      filterAndRenderTickets();
    } catch (err) {
      const container = $('#ticketsContainer');
      if (container) container.innerHTML = `<div class="empty-state"><p>${esc(err.message)}</p></div>`;
    }
  }

  function filterAndRenderTickets() {
    const container = $('#ticketsContainer');
    if (!container) return;

    let filtered = allCachedTasks.slice();

    if (activeFilter !== 'all') {
      filtered = filtered.filter(t => t.status === activeFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    if (areaFilter !== 'all') {
      const q = areaFilter.toLowerCase();
      filtered = filtered.filter(t => 
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q))
      );
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        (t.title && t.title.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.id && t.id.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q))
      );
    }

    if (!filtered.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon" style="display:flex; justify-content:center; color:var(--text-muted); margin-bottom:12px;">
            ${ICONS.tickets}
          </div>
          <h3>No se encontraron tickets</h3>
          <p>No hay solicitudes que coincidan con los criterios de búsqueda o filtros seleccionados.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="ticket-list fade-in">
        ${filtered.map(renderTicketCard).join('')}
      </div>
    `;

    attachTicketEventListeners(container);
  }

  function renderTicketCard(ticket) {
    const isManager = ['admin', 'coordinator'].includes(currentUser.role);
    const isAdmin = currentUser.role === 'admin';
    const isAssignedToMe = ticket.assigneeId === currentUser.id;

    const pClass = ticket.priority === 'Alta' ? 'p-alta' : ticket.priority === 'Media' ? 'p-media' : 'p-baja';
    const catIcon = categoryIcons[ticket.category] || ICONS.box;

    // Controls
    let controls = '';
    if (currentUser.role === 'coordinator' && isAssignedToMe && ticket.status === 'assigned') {
      controls = `<button class="btn btn-primary btn-sm" data-action="status" data-status="in_progress" data-id="${esc(ticket.id)}" style="display:inline-flex; align-items:center; gap:6px;">${ICONS.play}<span>Iniciar Atención</span></button>`;
    } else if (currentUser.role === 'coordinator' && isAssignedToMe && ticket.status === 'in_progress') {
      controls = `<button class="btn btn-primary btn-sm" data-action="status" data-status="ready_review" data-id="${esc(ticket.id)}" style="display:inline-flex; align-items:center; gap:6px;">${ICONS.check}<span>Marcar Resuelto</span></button>`;
    } else if (isManager && ticket.status !== 'closed') {
      if (ticket.status === 'ready_review' && isAdmin) {
        controls = `<button class="btn btn-primary btn-sm" data-action="close" data-id="${esc(ticket.id)}" style="display:inline-flex; align-items:center; gap:6px;">${ICONS.lock}<span>Cerrar Ticket</span></button>`;
      } else {
        controls = `
          <div style="display:flex; gap:6px; align-items:center;">
            <select data-assign-select="${esc(ticket.id)}">
              <option value="">${ticket.assigneeName ? esc(ticket.assigneeName) : 'Asignar técnico...'}</option>
              ${technicians.map(t => `<option value="${esc(t.id)}" ${t.id === ticket.assigneeId ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
            </select>
            <button class="btn btn-secondary btn-sm" data-action="assign" data-id="${esc(ticket.id)}">Asignar</button>
          </div>
        `;
      }
    }

    // Photos
    const photos = ticket.photos && ticket.photos.length ? `
      <div class="ticket-photos">
        ${ticket.photos.map(p => `
          <img src="${esc(p.url)}" alt="Adjunto" data-lightbox="${esc(p.url)}" title="Clic para ampliar">
        `).join('')}
      </div>
    ` : '';

    // History
    const history = ticket.activity && ticket.activity.length ? `
      <details class="ticket-history">
        <summary>Historial de cambios (${ticket.activity.length})</summary>
        <div style="margin-top:6px;">
          ${ticket.activity.map(ev => `
            <div class="history-item">
              ${new Date(ev.createdAt).toLocaleString('es-MX')} · <b>${esc(ev.userName)}</b> ${esc(ev.detail)}
            </div>
          `).join('')}
        </div>
      </details>
    ` : '';

    // Comments section
    const comments = ticket.comments || [];
    const commentsHtml = `
      <div class="comments-section">
        <div class="comments-toggle" data-toggle-comments="${esc(ticket.id)}" style="display:inline-flex; align-items:center; gap:6px;">
          ${ICONS.messageSquare}
          <span>Mensajes y Notas (${comments.length})</span>
        </div>
        <div class="comments-body" id="comments-${CSS.escape(ticket.id)}" style="display:none; margin-top:10px;">
          <div class="comments-thread">
            ${comments.length ? comments.map(c => `
              <div class="comment-bubble ${c.userId === currentUser.id ? 'own' : 'other'}">
                <div>${esc(c.text)}</div>
                <div class="comment-meta">
                  <b>${esc(c.userName)}</b>
                  <span>${formatTimeAgo(c.createdAt)}</span>
                </div>
              </div>
            `).join('') : '<p style="color:var(--text-muted); font-size:12px; margin-bottom:10px;">No hay notas añadidas todavía.</p>'}
          </div>
          <div class="comment-input-row">
            <input type="text" placeholder="Escribe un mensaje o actualización..." data-comment-input="${esc(ticket.id)}" maxlength="1500">
            <button type="button" data-action="comment" data-id="${esc(ticket.id)}">Enviar</button>
          </div>
        </div>
      </div>
    `;

    return `
      <article class="ticket ${pClass}" data-ticket-card="${esc(ticket.id)}">
        <div class="ticket-head">
          <div>
            <small><b>${esc(ticket.id)}</b> · ${new Date(ticket.createdAt).toLocaleString('es-MX')}</small>
            <h2>${esc(ticket.title)}</h2>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="category-badge">${catIcon} <span>${esc(ticket.category)}</span></span>
            <span class="status-pill ${esc(ticket.status)}">${statusLabels[ticket.status] || esc(ticket.status)}</span>
          </div>
        </div>

        <p>${esc(ticket.description)}</p>

        ${photos}

        <div class="meta-row">
          <div class="meta-item">${ICONS.mapPin} <span>Ubicación: <b>${esc(ticket.location || 'Base Principal')}</b></span></div>
          <div class="meta-item">${ICONS.alertCircle} <span>Prioridad: <b>${esc(ticket.priority)}</b></span></div>
          <div class="meta-item">${ICONS.user} <span>Reportó: <b>${esc(ticket.createdByName)}</b></span></div>
          <div class="meta-item">${ICONS.wrench} <span>Técnico: <b>${esc(ticket.assigneeName || 'Sin asignar')}</b></span></div>
        </div>

        <div class="ticket-actions">
          <div>${controls}</div>
          <small>Actualizado ${formatTimeAgo(ticket.updatedAt)}</small>
        </div>

        ${history}
        ${commentsHtml}
      </article>
    `;
  }

  function attachTicketEventListeners(container) {
    // Actions: status, assign, close, comment
    container.onclick = async (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const id = target.dataset.id;

      if (action === 'status') {
        const nextStatus = target.dataset.status;
        try {
          await request(`/api/tasks/${encodeURIComponent(id)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus })
          });
          toast('Estado de ticket actualizado.');
          await fetchAndRenderTicketsSilent();
        } catch (err) { toast(err.message); }
      }

      if (action === 'close') {
        if (!confirm(`¿Confirmas el cierre del ticket ${id}?`)) return;
        try {
          await request(`/api/tasks/${encodeURIComponent(id)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'closed' })
          });
          toast('Ticket cerrado exitosamente.');
          await fetchAndRenderTicketsSilent();
        } catch (err) { toast(err.message); }
      }

      if (action === 'assign') {
        const select = $(`[data-assign-select="${CSS.escape(id)}"]`, container);
        const assigneeId = select ? select.value : null;
        if (!assigneeId) return toast('Selecciona un integrante del equipo TICS.');
        try {
          await request(`/api/tasks/${encodeURIComponent(id)}/assign`, {
            method: 'POST',
            body: JSON.stringify({ assigneeId })
          });
          toast('Ticket asignado.');
          await fetchAndRenderTicketsSilent();
        } catch (err) { toast(err.message); }
      }

      if (action === 'comment') {
        const input = $(`[data-comment-input="${CSS.escape(id)}"]`, container);
        const text = input ? input.value.trim() : '';
        if (!text) return;
        target.disabled = true;
        try {
          await request(`/api/tasks/${encodeURIComponent(id)}/comments`, {
            method: 'POST',
            body: JSON.stringify({ text })
          });
          input.value = '';
          toast('Mensaje añadido.');
          await fetchAndRenderTicketsSilent();
        } catch (err) {
          toast(err.message);
        } finally {
          target.disabled = false;
        }
      }
    };

    // Toggle comments body
    container.querySelectorAll('[data-toggle-comments]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.toggleComments;
        const body = $(`#comments-${CSS.escape(id)}`, container);
        if (body) {
          body.style.display = body.style.display === 'none' ? 'block' : 'none';
        }
      };
    });

    // Lightbox for photos
    container.querySelectorAll('[data-lightbox]').forEach(img => {
      img.onclick = () => {
        const overlay = document.createElement('div');
        overlay.className = 'lightbox';
        overlay.innerHTML = `
          <div class="lightbox-close">✕</div>
          <img src="${esc(img.dataset.lightbox)}" alt="Zoom">
        `;
        overlay.onclick = () => overlay.remove();
        document.body.appendChild(overlay);
      };
    });
  }

  // ==========================================
  // TICKET CREATION FORM
  // ==========================================
  function renderTicketForm() {
    const content = $('#content');
    content.innerHTML = `
      <div class="view-transition">
        <div class="form-wrap">
          <div class="eyebrow">NUEVO REQUERIMIENTO</div>
          <h1>Levantar Ticket de Soporte</h1>
          <p>Detalla el inconveniente técnico que estás experimentando para que el equipo TICS pueda resolverlo con prioridad.</p>

          <form id="ticketCreateForm">
            <div class="form-group">
              <label>Categoría del Problema</label>
              <select name="category" required>
                <option value="">Selecciona una categoría...</option>
                <option value="Equipo de cómputo">Equipo de cómputo (Laptop, PC, Monitor)</option>
                <option value="Correo electrónico">Correo electrónico / Office 365</option>
                <option value="Internet y red">Internet, Wi-Fi o Red interna</option>
                <option value="Sistema o aplicación">Sistema ERP, TMS o Aplicaciones</option>
                <option value="Impresora">Impresora o Escáner</option>
                <option value="Telefonía">Telefonía / Conmutador</option>
                <option value="Accesos y contraseñas">Accesos y restablecimiento de contraseña</option>
                <option value="Otro">Otro requerimiento</option>
              </select>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
              <div class="form-group">
                <label>Nivel de Urgencia</label>
                <select name="priority">
                  <option value="Media">Prioridad Media (Operación normal)</option>
                  <option value="Alta">Prioridad Alta (Detiene operaciones)</option>
                  <option value="Baja">Prioridad Baja (No urgente)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Ubicación / Área</label>
                <input name="location" placeholder="Ej. Patio de Maniobras, Taller, Tráfico" maxlength="100">
              </div>
            </div>

            <div class="form-group">
              <label>Asunto o Resumen</label>
              <input name="title" required maxlength="140" placeholder="Ej. Falla al emitir carta porte en TMS">
            </div>

            <div class="form-group">
              <label>Descripción detallada</label>
              <textarea name="description" required maxlength="1500" placeholder="Explica qué sucedió, pasos para reproducir o mensajes de error..."></textarea>
            </div>

            <div class="form-group">
              <label>Evidencia fotográfica o capturas (Opcional)</label>
              <div class="file-drop" id="fileDrop">
                <div class="drop-icon" style="display:flex; justify-content:center; color:var(--brand-red); margin-bottom:8px;">
                  ${ICONS.camera}
                </div>
                <p><b>Haz clic para subir</b> o arrastra hasta 3 fotos aquí</p>
                <small style="color:var(--text-muted);">Formatos permitidos: JPG, PNG, WebP (máx. 3 MB)</small>
                <input type="file" id="fileInput" name="photos" accept="image/*" multiple>
              </div>
              <div class="file-previews" id="filePreviews"></div>
            </div>

            <div class="form-actions">
              <button class="btn btn-primary" type="submit" id="submitBtn">
                <span>Enviar Solicitud</span>
              </button>
              <button class="btn btn-secondary" type="button" id="cancelFormBtn">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    `;

    $('#cancelFormBtn').onclick = () => navigateTo('tickets');

    const dropZone = $('#fileDrop');
    const fileInput = $('#fileInput');
    const previews = $('#filePreviews');
    let selectedFiles = [];

    dropZone.onclick = () => fileInput.click();

    dropZone.ondragover = (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    };
    dropZone.ondragleave = () => dropZone.classList.remove('dragover');
    dropZone.ondrop = (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      handleFiles(Array.from(e.dataTransfer.files));
    };

    fileInput.onchange = (e) => {
      handleFiles(Array.from(e.target.files));
    };

    function handleFiles(files) {
      const valid = files.filter(f => f.type.startsWith('image/')).slice(0, 3);
      if (files.length > 3) toast('Solo puedes adjuntar hasta 3 imágenes.');
      selectedFiles = valid;
      previews.innerHTML = valid.map(f => `<img src="${URL.createObjectURL(f)}" alt="Preview">`).join('');
    }

    async function compressFile(file) {
      const bmp = await createImageBitmap(file);
      const maxDim = 1600;
      const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bmp.width * scale);
      canvas.height = Math.round(bmp.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      bmp.close();
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.78));
      return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res({ name: file.name, dataUrl: reader.result });
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      });
    }

    $('#ticketCreateForm').onsubmit = async (e) => {
      e.preventDefault();
      const btn = $('#submitBtn');
      btn.disabled = true;
      btn.innerHTML = '<span>Enviando ticket...</span>';

      try {
        const form = e.target;
        const formData = new FormData(form);
        const photos = await Promise.all(selectedFiles.map(compressFile));

        const payload = {
          category: formData.get('category'),
          priority: formData.get('priority') || 'Media',
          location: formData.get('location') || '',
          title: formData.get('title'),
          description: formData.get('description'),
          photos
        };

        await request('/api/reports', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        toast('Ticket creado y notificado al equipo TICS.');
        navigateTo('tickets');
      } catch (err) {
        toast(err.message);
        btn.disabled = false;
        btn.innerHTML = '<span>Enviar Solicitud</span>';
      }
    };
  }

  // ==========================================
  // USERS MANAGEMENT VIEW (ADMIN)
  // ==========================================
  async function renderUsers() {
    if (currentUser.role !== 'admin') return navigateTo('tickets');
    const content = $('#content');

    content.innerHTML = `
      <div class="view-transition">
        <div class="view-header">
          <div class="eyebrow">ADMINISTRACIÓN DE ACCESOS</div>
          <h1>Personal Registrado</h1>
          <p>Gestiona los colaboradores y miembros del equipo técnico con acceso a la plataforma.</p>
        </div>

        <div class="user-layout">
          <div class="panel">
            <h2>Directorio de Cuentas</h2>
            <div id="usersTableContainer">
              <div class="skeleton-card" style="height:200px;"></div>
            </div>
          </div>

          <div class="panel">
            <h2>Dar de Alta Cuenta</h2>
            <form id="newUserForm">
              <div class="form-group">
                <label>Nombre Completo</label>
                <input name="name" required maxlength="100" placeholder="Ej. Carlos Mendoza">
              </div>
              <div class="form-group">
                <label>Nombre de Usuario</label>
                <input name="username" required minlength="3" maxlength="40" pattern="[a-zA-Z0-9._-]+" placeholder="Ej. cmendoza">
              </div>
              <div class="form-group">
                <label>Rol en Plataforma</label>
                <select name="role">
                  <option value="workshop">Colaborador / Operador</option>
                  <option value="coordinator">Equipo TICS (Técnico)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Contraseña Provisional</label>
                <input name="password" type="password" required minlength="12" placeholder="Mínimo 12 caracteres">
              </div>
              <button class="btn btn-primary" style="width:100%; justify-content:center;">Crear Usuario</button>
            </form>
          </div>
        </div>
      </div>
    `;

    $('#newUserForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        const values = Object.fromEntries(new FormData(e.target));
        await request('/api/users', {
          method: 'POST',
          body: JSON.stringify(values)
        });
        toast('Cuenta de usuario creada.');
        e.target.reset();
        await fetchAndRenderUsers();
      } catch (err) {
        toast(err.message);
      }
    };

    await fetchAndRenderUsers();
  }

  async function fetchAndRenderUsers() {
    const container = $('#usersTableContainer');
    if (!container) return;

    try {
      const { users } = await request('/api/users');
      const rows = users.map(u => `
        <tr>
          <td>
            <div style="display:flex; align-items:center;">
              <span class="user-row-avatar ${roleClasses[u.role] || 'role-workshop'}">${getInitials(u.name)}</span>
              <div>
                <b>${esc(u.name)}</b>
                <small>${esc(u.username)}</small>
              </div>
            </div>
          </td>
          <td><span class="status-pill">${esc(roleLabels[u.role] || u.role)}</span></td>
          <td>
            ${u.id === currentUser.id 
              ? '<span style="color:var(--text-muted); font-size:12px;">Sesión actual</span>' 
              : `<button class="btn btn-danger btn-sm" data-disable-user="${esc(u.id)}">Desactivar</button>`}
          </td>
        </tr>
      `).join('');

      container.innerHTML = `
        <table>
          <thead>
            <tr><th>Colaborador</th><th>Rol</th><th>Acciones</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;

      container.querySelectorAll('[data-disable-user]').forEach(btn => {
        btn.onclick = async () => {
          if (!confirm('¿Desactivar el acceso de este usuario?')) return;
          try {
            await request(`/api/users/${encodeURIComponent(btn.dataset.disableUser)}`, { method: 'DELETE' });
            toast('Usuario desactivado.');
            await fetchAndRenderUsers();
          } catch (err) { toast(err.message); }
        };
      });

    } catch (err) {
      container.innerHTML = `<p style="color:var(--danger);">${esc(err.message)}</p>`;
    }
  }

  // ==========================================
  // NOTIFICATIONS SYSTEM
  // ==========================================
  async function refreshNotifications() {
    try {
      const { notifications } = await request('/api/notifications');
      const panel = $('#notificationPanel');
      const badge = $('#notifBadge');
      if (!panel) return;

      const unreadCount = notifications.filter(n => !n.readAt).length;
      if (badge) {
        badge.textContent = unreadCount > 0 ? unreadCount : '';
      }

      if (!notifications.length) {
        panel.innerHTML = `
          <div class="notification-head">
            <span>Notificaciones</span>
          </div>
          <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:13px;">
            Sin avisos por el momento
          </div>
        `;
        return;
      }

      panel.innerHTML = `
        <div class="notification-head">
          <span>Notificaciones</span>
          <button type="button" id="markAllReadBtn">Marcar leídas</button>
        </div>
        ${notifications.slice(0, 15).map(n => `
          <div class="notice ${n.readAt ? 'read' : 'unread'}" data-task-ref="${esc(n.taskId || '')}">
            <b>${esc(n.title)}</b>
            <div>${esc(n.body)}</div>
            <small>${formatTimeAgo(n.createdAt)}</small>
          </div>
        `).join('')}
      `;

      $('#markAllReadBtn').onclick = async () => {
        await request('/api/notifications/read', { method: 'POST', body: '{}' }).catch(() => {});
        refreshNotifications();
      };

      panel.querySelectorAll('[data-task-ref]').forEach(item => {
        item.onclick = () => {
          panel.classList.remove('open');
          const taskId = item.dataset.taskRef;
          if (taskId) {
            searchQuery = taskId;
            if ($('#globalSearch')) $('#globalSearch').value = taskId;
            navigateTo('tickets');
          }
        };
      });

    } catch {
      // Session might have expired
    }
  }

  // ==========================================
  // INIT & AUTH CHECK
  // ==========================================
  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();

    const loginForm = $('#loginForm');
    const loginError = $('#loginError');

    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const btn = $('.btn-login', loginForm);
        btn.classList.add('loading');

        try {
          const payload = Object.fromEntries(new FormData(loginForm));
          const result = await request('/api/login', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          shell(result.user);
        } catch (err) {
          loginError.textContent = err.message;
        } finally {
          btn.classList.remove('loading');
        }
      };
    }

    try {
      const res = await request('/api/session');
      shell(res.user);
    } catch {
      $('#login').hidden = false;
      $('#app').hidden = true;
    }
  });

})();
