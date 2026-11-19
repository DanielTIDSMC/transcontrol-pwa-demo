(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

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
    'Equipo de cómputo': '💻',
    'Correo electrónico': '✉️',
    'Internet y red': '🌐',
    'Sistema o aplicación': '⚙️',
    'Impresora': '🖨️',
    'Telefonía': '📞',
    'Accesos y contraseñas': '🔑',
    'Otro': '📦'
  };

  let currentUser = null;
  let technicians = [];
  let currentView = 'dashboard';
  let activeFilter = 'all';
  let searchQuery = '';
  let priorityFilter = 'all';
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
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
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
        const data = JSON.parse(e.data || '{}');
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
          <div class="view-header">
            <div class="eyebrow">CENTRO DE CONTROL · TRANSATLANTE</div>
            <h1>Métricas y Estado Operativo</h1>
            <p>Monitoreo en tiempo real de requerimientos de soporte, tiempos de atención y distribución de incidencias.</p>
          </div>
          <div class="metrics-row">
            <div class="metric-card"><div class="metric-icon mi-red">🚨</div><div class="metric-value" id="m-new">--</div><div class="metric-label">Tickets Nuevos</div><div class="metric-trend down">Por asignar</div></div>
            <div class="metric-card"><div class="metric-icon mi-amber">⚡</div><div class="metric-value" id="m-proc">--</div><div class="metric-label">En Atención</div><div class="metric-trend up">En proceso activo</div></div>
            <div class="metric-card"><div class="metric-icon mi-green">✅</div><div class="metric-value" id="m-done">--</div><div class="metric-label">Resueltos (Semana)</div><div class="metric-trend up">+15% vs sem. ant.</div></div>
            <div class="metric-card"><div class="metric-icon mi-blue">⏱️</div><div class="metric-value" id="m-time">--</div><div class="metric-label">Tiempo Promedio</div><div class="metric-trend down">SLA cumplimiento 94%</div></div>
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

      // Draw SVG Donut Chart
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

    const colors = {
      pending_review: '#c5232b',
      assigned: '#2584a0',
      in_progress: '#d97706',
      ready_review: '#059669',
      closed: '#64748b'
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
          fill="none" stroke="${colors[status] || '#cbd5e1'}"
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
          <b style="font-size:22px; font-weight:800;">${total}</b>
          <span style="font-size:11px; color:var(--text-muted); text-transform:uppercase;">Tickets</span>
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
      const icon = categoryIcons[category] || '📦';
      return `
        <div class="bar-row">
          <div class="bar-label" title="${esc(category)}">${icon} ${esc(category)}</div>
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

    // Collect all events across tasks
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
        <div class="activity-avatar" style="background:var(--brand-teal);">
          ${getInitials(item.userName)}
        </div>
        <div class="activity-info">
          <p><b>${esc(item.userName)}</b> ${esc(item.detail)} en <b style="color:var(--accent);">${esc(item.taskIdentifier || '')}</b></p>
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
          ${isWorkshop ? '<button class="btn btn-primary" id="btnNewTicket" style="font-size:14px; padding:12px 20px;">＋ Levantar Ticket</button>' : ''}
        </div>

        <div class="filter-bar">
          <button class="filter-chip active" data-filter="all">Todos</button>
          <button class="filter-chip" data-filter="pending_review">Nuevos</button>
          <button class="filter-chip" data-filter="assigned">Asignados</button>
          <button class="filter-chip" data-filter="in_progress">En Atención</button>
          <button class="filter-chip" data-filter="ready_review">Resueltos</button>
          <button class="filter-chip" data-filter="closed">Cerrados</button>
          
          <select id="prioritySelect" class="filter-chip" style="outline:none; cursor:pointer;">
            <option value="all">Prioridad: Todas</option>
            <option value="Alta">🔴 Alta</option>
            <option value="Media">🟡 Media</option>
            <option value="Baja">🟢 Baja</option>
          </select>

          <div class="filter-search">
            <span class="fs-icon">🔍</span>
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
          <div class="empty-icon">📭</div>
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
    const catIcon = categoryIcons[ticket.category] || '📦';

    // Controls
    let controls = '';
    if (currentUser.role === 'coordinator' && isAssignedToMe && ticket.status === 'assigned') {
      controls = `<button class="btn btn-primary btn-sm" data-action="status" data-status="in_progress" data-id="${esc(ticket.id)}">▶ Iniciar Atención</button>`;
    } else if (currentUser.role === 'coordinator' && isAssignedToMe && ticket.status === 'in_progress') {
      controls = `<button class="btn btn-primary btn-sm" data-action="status" data-status="ready_review" data-id="${esc(ticket.id)}">✓ Marcar como Resuelto</button>`;
    } else if (isManager && ticket.status !== 'closed') {
      if (ticket.status === 'ready_review' && isAdmin) {
        controls = `<button class="btn btn-primary btn-sm" data-action="close" data-id="${esc(ticket.id)}">🔒 Cerrar y Archivar</button>`;
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
        <div class="comments-toggle" data-toggle-comments="${esc(ticket.id)}">
          💬 Mensajes y Notas (${comments.length})
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
            <span class="category-badge">${catIcon} ${esc(ticket.category)}</span>
            <span class="status-pill ${esc(ticket.status)}">${statusLabels[ticket.status] || esc(ticket.status)}</span>
          </div>
        </div>

        <p>${esc(ticket.description)}</p>

        ${photos}

        <div class="meta-row">
          <div class="meta-item">📍 Ubicación: <b>${esc(ticket.location || 'Base Principal')}</b></div>
          <div class="meta-item">🚨 Prioridad: <b>${esc(ticket.priority)}</b></div>
          <div class="meta-item">👤 Reportó: <b>${esc(ticket.createdByName)}</b></div>
          <div class="meta-item">🛠️ Responsable: <b>${esc(ticket.assigneeName || 'Sin asignar')}</b></div>
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
                <option value="Equipo de cómputo">💻 Equipo de cómputo (Laptop, PC, Monitor)</option>
                <option value="Correo electrónico">✉️ Correo electrónico / Office 365</option>
                <option value="Internet y red">🌐 Internet, Wi-Fi o Red interna</option>
                <option value="Sistema o aplicación">⚙️ Sistema ERP, TMS o Aplicaciones</option>
                <option value="Impresora">🖨️ Impresora o Escáner</option>
                <option value="Telefonía">📞 Telefonía / Conmutador</option>
                <option value="Accesos y contraseñas">🔑 Accesos y restablecimiento de contraseña</option>
                <option value="Otro">📦 Otro requerimiento</option>
              </select>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
              <div class="form-group">
                <label>Nivel de Urgencia</label>
                <select name="priority">
                  <option value="Media">🟡 Prioridad Media (Operación normal)</option>
                  <option value="Alta">🔴 Prioridad Alta (Detiene operaciones)</option>
                  <option value="Baja">🟢 Prioridad Baja (No urgente)</option>
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
                <div class="drop-icon">📸</div>
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
