/* ============================================================
   ARCFORM Admin Panel | admin.js  v3.0
   FULLY FIXED — Synchronized with script.js
   ─────────────────────────────────────────────────────────────
   KEY FIX LOG:
   • Storage key 'arcform_theme' shared with script.js
   • Modals use class 'a-hidden' (avoids styles.css conflict)
   • openModal/closeModal toggle 'a-hidden' class
   • refreshDataFromStorage() called on every view switch
   • initStorageSync() handles cross-tab live updates
   • Reads EXACT field names script.js writes:
       requests: fullName, email, phone, projectType,
                 selectedDesign, budget, timeline,
                 requirements, status, date
       messages: name, email, message, status, date
   • Theme applied immediately (before DOMContentLoaded)
     to prevent flash of wrong theme
   • All DOM queries null-checked; graceful fallbacks
   ============================================================ */
'use strict';

/* ═══════════════════════════════════════════════════════════
   1. CONSTANTS — must exactly match script.js
   ═══════════════════════════════════════════════════════════ */
const ADMIN_CREDS = { user: 'admin', pass: 'arcform2024' };

const KEYS = {
  designs:   'arcform_designs',
  requests:  'arcform_requests',   // written by script.js
  messages:  'arcform_messages',   // written by script.js
  saved:     'arcform_saved',
  theme:     'arcform_theme',      // SAME key as script.js
  session:   'arcform_admin_session',
  adminPass: 'arcform_admin_pass',
};

/* ═══════════════════════════════════════════════════════════
   2. SAFE STORAGE
   ═══════════════════════════════════════════════════════════ */
const DB = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === 'undefined' || raw === '') return fallback !== undefined ? fallback : null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[ADMIN] DB.get error:', key, e.message);
      return fallback !== undefined ? fallback : null;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('[ADMIN] DB.set error:', key, e.message); }
  },
};

/* ═══════════════════════════════════════════════════════════
   3. SEED / DEFAULT DATA
   ═══════════════════════════════════════════════════════════ */
const DEFAULT_DESIGNS = [
  { id:1, type:'bungalow',   published:true,  title:'The Savannah Retreat',   desc:'A refined single-storey bungalow blending open-plan living with serene outdoor spaces.',                              fullDesc:'The Savannah Retreat is a masterpiece of modern bungalow design. Featuring expansive open-plan living spaces, floor-to-ceiling windows, and seamless indoor-outdoor flow.',   price:'₦18,500,000', budget:'budget', beds:'3',   baths:'2',   area:'210 m²',      floors:'1',  images:['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80','https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'], features:['Open-plan living room','Master suite with walk-in wardrobe','Wrap-around veranda','Home office','Double garage','Solar-ready roofing','Modern kitchen island','Guest bedroom en-suite'], floorPlan:'Ground floor: Open plan living, dining & kitchen, 3 bedrooms, 2 bathrooms, study, veranda', createdAt:new Date(Date.now()-864e5*5).toISOString() },
  { id:2, type:'duplex',     published:true,  title:'The Meridian Twin',       desc:'An elegant semi-detached duplex with premium finishes and smart home features.',                                       fullDesc:'The Meridian Twin combines modern architectural flair with functional dual-unit living. Each unit boasts its own private entrance, outdoor terrace, and premium interior finishes.',                price:'₦34,000,000', budget:'mid',    beds:'4',   baths:'3',   area:'320 m²',      floors:'2',  images:['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80'], features:['Private separate entrances','Rooftop terrace','Smart home wiring','Open-plan kitchen/dining','4 bedrooms per unit','Dedicated parking bays','Pre-installed solar panels','Intercom security system'], floorPlan:'Ground: Living, dining, kitchen, guest WC | First: 3 bedrooms + master suite with terrace', createdAt:new Date(Date.now()-864e5*4).toISOString() },
  { id:3, type:'apartment',  published:true,  title:'Highrise Luxe 12',        desc:'Contemporary 12-storey apartment complex with panoramic city views and premium amenities.',                           fullDesc:'Highrise Luxe 12 redefines urban living. This 12-storey tower features 48 luxury apartments, a rooftop infinity pool, commercial ground floor, and 3-level underground parking.',                price:'₦2.4B',       budget:'luxury', beds:'2–4', baths:'2–4', area:'85–220 m²/unit',floors:'12', images:['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80','https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80','https://images.unsplash.com/photo-1467533003447-e295ff1b0435?w=800&q=80'], features:['Rooftop infinity pool','Concierge service','3-level underground parking','Fitness centre','Commercial ground floor','CCTV & 24hr security','High-speed lifts x4','Generator backup'], floorPlan:'Floors 1-2: Commercial/lobby | Floors 3-12: Residential | Roof: Pool & terrace', createdAt:new Date(Date.now()-864e5*3).toISOString() },
  { id:4, type:'villa',      published:true,  title:'The Coral Grande',        desc:'A palatial 5-bedroom villa with infinity pool, home cinema, and resort-style grounds.',                               fullDesc:"The Coral Grande is the pinnacle of luxury residential design. A chef's kitchen, wine cellar, infinity pool, 12-seater home cinema, and mature landscaped gardens.",                              price:'₦120,000,000',budget:'luxury', beds:'5',   baths:'5',   area:'650 m²',      floors:'2',  images:['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80'], features:['Infinity edge pool','Home cinema (12-seater)','Wine cellar',"Chef's kitchen",'Ensuite for all bedrooms','Smart home automation','Landscaped gardens','Gym & wellness room','Staff quarters','4-car garage'], floorPlan:'Ground: Reception, lounge, cinema, kitchen | Upper: 4 bed suites | Grounds: Pool, gym, staff', createdAt:new Date(Date.now()-864e5*2).toISOString() },
  { id:5, type:'commercial', published:true,  title:'Nexus Office Tower',      desc:'A 10-storey Grade-A commercial tower designed for multinational and tech corporations.',                              fullDesc:'Nexus Office Tower offers 10 floors of premium Grade-A office space with stunning curtain-wall glazing, flexible floor plates, and green building certification.',                                  price:'₦850,000,000',budget:'luxury', beds:'N/A', baths:'20+', area:'8,500 m²',    floors:'10', images:['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80','https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'], features:['Grade-A specifications','LEED Green certification','Floor plates up to 850 m²','4-storey glass atrium','BMS integration','Conference suites','5-star lobby','3 basement parking levels','Retail ground floor'], floorPlan:'B1-B3: 500 parking bays | GF: Retail & lobby | F1-F10: 850 m² flexible office plates', createdAt:new Date(Date.now()-864e5).toISOString() },
  { id:6, type:'bungalow',   published:true,  title:'The Hillside Craftsman',  desc:'A charming 3-bedroom craftsman bungalow with exposed beams and a timeless aesthetic.',                               fullDesc:'The Hillside Craftsman draws on classic craftsman architecture with exposed timber beams, wide covered porches, stone cladding, and warm natural materials.',                                       price:'₦22,000,000', budget:'mid',    beds:'3',   baths:'2',   area:'195 m²',      floors:'1',  images:['https://images.unsplash.com/photo-1601084881623-cdf9a8ea242c?w=800&q=80','https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80','https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&q=80'], features:['Exposed timber beams','Wide covered veranda','Stone facade cladding','Vaulted living room','Farmhouse kitchen','Fireplace feature wall','Reading nook','Outdoor fire pit area'], floorPlan:'Open living/dining/kitchen, master bedroom + 2 bedrooms, 2 bathrooms, utility, veranda', createdAt:new Date(Date.now()-36e5*12).toISOString() },
  { id:7, type:'duplex',     published:true,  title:'The Urban Loft Duplex',   desc:'Industrial-chic duplex with double-height living spaces and polished concrete finishes.',                             fullDesc:'The Urban Loft Duplex brings New York warehouse aesthetics to contemporary West African urban living — double-height ceilings, polished concrete floors, exposed brickwork.',                       price:'₦45,000,000', budget:'mid',    beds:'3',   baths:'2',   area:'280 m²',      floors:'2',  images:['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80','https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80'], features:['Double-height living room','Polished concrete floors','Exposed brick feature walls','Steel-frame windows','Mezzanine office','Roof deck','Industrial kitchen','Open-tread staircase'], floorPlan:'Ground: Open living/kitchen, guest suite | Upper: Mezzanine, 2 bedrooms, master bath | Roof: Deck', createdAt:new Date(Date.now()-36e5*6).toISOString() },
  { id:8, type:'commercial', published:true,  title:'The Marketplace Hub',     desc:'A vibrant mixed-use commercial complex with retail, food court, and event spaces.',                                   fullDesc:'The Marketplace Hub is a dynamic mixed-use development: 40+ retail shops, a 600-seat food court, flexible event hall, and upper-level office space.',                                              price:'₦320,000,000',budget:'luxury', beds:'N/A', baths:'30+', area:'4,200 m²',    floors:'3',  images:['https://images.unsplash.com/photo-1519567770579-c2fc5f4b7679?w=800&q=80','https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&q=80','https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=80'], features:['40+ retail units','600-seat food court','Flexible event hall','Upper office floors','Central atrium sky-light','Ample surface parking','Accessible design','Modern security systems'], floorPlan:'GF: Retail & food court | F1: Event hall & more retail | F2-F3: Commercial offices | Roof: Services', createdAt:new Date().toISOString() },
];

// No demo data for requests or messages — admin displays only real submissions from the main site.

/* ═══════════════════════════════════════════════════════════
   4. APP STATE
   ═══════════════════════════════════════════════════════════ */
const state = {
  designs:        [],
  requests:       [],
  messages:       [],
  currentView:    'dashboard',
  editingDesignId: null,
  activeReqId:    null,
  activeMsgId:    null,
  confirmCb:      null,
};

/* ═══════════════════════════════════════════════════════════
   5. UTILITIES
   ═══════════════════════════════════════════════════════════ */
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function cap(s) { return String(s||'').charAt(0).toUpperCase() + String(s||'').slice(1); }
function getEl(id) { return document.getElementById(id); }

function fmtDate(iso) {
  try { return new Date(iso).toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}); }
  catch { return '—'; }
}
function timeAgo(iso) {
  try {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m/60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  } catch { return '—'; }
}

/* ═══════════════════════════════════════════════════════════
   6. THEME  — key 'arcform_theme' shared with script.js
   ═══════════════════════════════════════════════════════════ */
function applyTheme(theme) {
  const t = (theme === 'light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  DB.set(KEYS.theme, t);
  const btn = getEl('adminThemeToggle');
  if (btn) btn.textContent = (t === 'dark') ? '☀' : '◑';
  const ck  = getEl('settingsTheme');
  if (ck)  ck.checked = (t === 'dark');
  console.log('[ADMIN] Theme:', t);
}

// Apply theme IMMEDIATELY (before DOMContentLoaded) to prevent flash
(function () {
  const saved = DB.get(KEYS.theme, 'light');
  document.documentElement.setAttribute('data-theme', typeof saved === 'string' ? saved : 'light');
})();

/* ═══════════════════════════════════════════════════════════
   7. MODAL HELPERS  — use class 'a-hidden' NOT 'hidden'
   ═══════════════════════════════════════════════════════════ */
function openModal(id) {
  const el = getEl(id);
  if (!el) { console.warn('[ADMIN] openModal: element not found:', id); return; }
  el.classList.remove('a-hidden');
}
function closeModal(id) {
  const el = getEl(id);
  if (el) el.classList.add('a-hidden');
}

/* ═══════════════════════════════════════════════════════════
   8. TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════ */
function toast(msg, type = 'info') {
  const wrap = getEl('toastContainer');
  if (!wrap) return;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3200);
}

/* ═══════════════════════════════════════════════════════════
   9. CONFIRM DIALOG
   ═══════════════════════════════════════════════════════════ */
function showConfirm(title, msg, cb) {
  const overlay = getEl('confirmOverlay');
  if (!overlay) { if (window.confirm(msg)) cb(); return; }
  const t = getEl('confirmTitle'); if (t) t.textContent = title;
  const m = getEl('confirmMsg');   if (m) m.textContent = msg;
  state.confirmCb = cb;
  openModal('confirmOverlay');
}
function hideConfirm() {
  closeModal('confirmOverlay');
  state.confirmCb = null;
}

/* ═══════════════════════════════════════════════════════════
   10. DATA LOADING & SAVING
   ═══════════════════════════════════════════════════════════ */
function loadAllData() {
  // Designs: seed defaults on first visit if none stored
  const sd = DB.get(KEYS.designs, null);
  state.designs = (sd && Array.isArray(sd) && sd.length > 0) ? sd : DEFAULT_DESIGNS;
  if (!sd || !sd.length) DB.set(KEYS.designs, state.designs);

  // Requests & messages: ONLY load real submissions written by script.js.
  // Never seed dummy data — always start empty if nothing has been submitted yet.
  // Also clear any previously seeded demo data so it no longer pollutes the view.
  const sr = DB.get(KEYS.requests, null);
  state.requests = (sr && Array.isArray(sr))
    ? sr.filter(r => r.id && !r.id.startsWith('req-demo-'))
    : [];

  const sm = DB.get(KEYS.messages, null);
  state.messages = (sm && Array.isArray(sm))
    ? sm.filter(m => m.id && !m.id.startsWith('msg-demo-'))
    : [];

  // Persist the cleaned arrays so demo items are permanently removed from storage
  DB.set(KEYS.requests, state.requests);
  DB.set(KEYS.messages, state.messages);

  // Remove the legacy seeding flag if present
  localStorage.removeItem('arcform_demo_seeded');

  console.log('[ADMIN] Loaded — designs:', state.designs.length, '| requests:', state.requests.length, '| messages:', state.messages.length);
}

/** Re-read from localStorage — picks up new form submissions without page reload */
function refreshDataFromStorage() {
  const sr = DB.get(KEYS.requests, null);
  if (sr && Array.isArray(sr)) {
    state.requests = sr.filter(r => r.id && !r.id.startsWith('req-demo-'));
  }
  const sm = DB.get(KEYS.messages, null);
  if (sm && Array.isArray(sm)) {
    state.messages = sm.filter(m => m.id && !m.id.startsWith('msg-demo-'));
  }
  const sd = DB.get(KEYS.designs, null);
  if (sd && Array.isArray(sd)) { state.designs = sd; }
  console.log('[ADMIN] Refreshed from storage — req:', state.requests.length, '| msg:', state.messages.length);
}

function saveDesigns()  { DB.set(KEYS.designs,  state.designs);  }
function saveRequests() { DB.set(KEYS.requests, state.requests); }
function saveMessages() { DB.set(KEYS.messages, state.messages); }

/* ═══════════════════════════════════════════════════════════
   11. CROSS-TAB LIVE SYNC (from main site)
   ═══════════════════════════════════════════════════════════ */
function initStorageSync() {
  window.addEventListener('storage', e => {
    if (e.key === KEYS.requests && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          state.requests = parsed;
          if (state.currentView === 'requests')  renderRequestsTable();
          if (state.currentView === 'dashboard') renderDashboard();
          updateBadges();
          toast('📋 New plan request received!', 'success');
          console.log('[ADMIN] 🔄 Requests synced from main site:', state.requests.length);
        }
      } catch (err) { console.warn('[ADMIN] Sync parse error (requests):', err); }
    }
    if (e.key === KEYS.messages && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          state.messages = parsed;
          if (state.currentView === 'messages')  renderMessagesList();
          if (state.currentView === 'dashboard') renderDashboard();
          updateBadges();
          toast('💬 New contact message received!', 'success');
          console.log('[ADMIN] 🔄 Messages synced from main site:', state.messages.length);
        }
      } catch (err) { console.warn('[ADMIN] Sync parse error (messages):', err); }
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   12. NAVIGATION / VIEW SWITCHING
   ═══════════════════════════════════════════════════════════ */
function switchView(viewId) {
  if (!viewId) return;
  console.log('[ADMIN] Switching to view:', viewId);

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewEl = getEl(`view-${viewId}`);
  if (!viewEl) { console.warn('[ADMIN] View not found: view-' + viewId); return; }
  viewEl.classList.add('active');

  document.querySelectorAll('.snav-item').forEach(b => b.classList.remove('active'));
  const navBtn = document.querySelector(`.snav-item[data-view="${viewId}"]`);
  if (navBtn) navBtn.classList.add('active');

  const labels = {
    dashboard: 'Dashboard', designs: 'Design Catalogue',
    'add-design': 'Add / Edit Design', requests: 'Plan Requests',
    messages: 'Messages', settings: 'Settings',
  };
  const bc = getEl('topbarBreadcrumb');
  if (bc) bc.textContent = labels[viewId] || viewId;

  state.currentView = viewId;
  getEl('sidebar')?.classList.remove('open');

  // Always refresh data on view switch so new submissions appear
  switch (viewId) {
    case 'dashboard':  refreshDataFromStorage(); renderDashboard();      break;
    case 'designs':    renderDesignsTable();                              break;
    case 'requests':   refreshDataFromStorage(); renderRequestsTable();  break;
    case 'messages':   refreshDataFromStorage(); renderMessagesList();   break;
    case 'add-design': if (!state.editingDesignId) resetDesignForm();    break;
    case 'settings':   syncSettingsUI();                                  break;
  }
}

function initNavigation() {
  // Event delegation for all [data-view] buttons/links
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    const view = btn.dataset.view;
    if (view === 'add-design') state.editingDesignId = null;
    switchView(view);
  });

  const menuBtn  = getEl('topbarMenu');
  const sidebar  = getEl('sidebar');
  const closeBtn = getEl('sidebarClose');
  if (menuBtn  && sidebar) menuBtn .addEventListener('click', () => sidebar.classList.toggle('open'));
  if (closeBtn && sidebar) closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));

  getEl('logoutBtn')?.addEventListener('click', () =>
    showConfirm('Sign Out', 'Are you sure you want to sign out?', doLogout));

  // Dashboard refresh button
  getEl('dashRefreshBtn')?.addEventListener('click', () => {
    refreshDataFromStorage();
    renderDashboard();
    updateBadges();
    toast('Dashboard refreshed.', 'info');
  });
}

/* ═══════════════════════════════════════════════════════════
   13. BADGES
   ═══════════════════════════════════════════════════════════ */
function updateBadges() {
  const newReqs = state.requests.filter(r => r.status === 'new').length;
  const unread  = state.messages.filter(m => m.status === 'unread').length;
  const rb = getEl('reqBadge'); if (rb) rb.textContent = String(newReqs || 0);
  const mb = getEl('msgBadge'); if (mb) mb.textContent = String(unread  || 0);
}

/* ═══════════════════════════════════════════════════════════
   14. LOGIN / LOGOUT
   ═══════════════════════════════════════════════════════════ */
function initLogin() {
  const form = getEl('loginForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const user = (getEl('loginUser')?.value || '').trim();
    const pass = (getEl('loginPass')?.value || '');
    const ue   = getEl('loginUserError');
    const pe   = getEl('loginPassError');
    const eb   = getEl('loginError');

    if (ue) ue.textContent = user ? '' : 'Username is required.';
    if (pe) pe.textContent = pass ? '' : 'Password is required.';
    if (!user || !pass) return;

    const btn     = getEl('loginBtn');
    const btnText = getEl('loginBtnText');
    const spinner = getEl('loginBtnSpinner');
    if (btn)     btn.disabled = true;
    if (btnText) btnText.classList.add('a-hidden');
    if (spinner) spinner.classList.remove('a-hidden');

    setTimeout(() => {
      if (btn)     btn.disabled = false;
      if (btnText) btnText.classList.remove('a-hidden');
      if (spinner) spinner.classList.add('a-hidden');

      const savedPass = DB.get(KEYS.adminPass, null) || ADMIN_CREDS.pass;
      if (user === ADMIN_CREDS.user && pass === savedPass) {
        DB.set(KEYS.session, 'authenticated');
        if (eb) eb.classList.add('a-hidden');
        console.log('[ADMIN] ✅ Login successful');
        showAdminApp();
      } else {
        if (eb) eb.classList.remove('a-hidden');
        getEl('loginUser')?.classList.add('error');
        getEl('loginPass')?.classList.add('error');
        console.warn('[ADMIN] ❌ Login failed for user:', user);
      }
    }, 700);
  });

  // Clear error state on input
  ['loginUser','loginPass'].forEach(id => {
    getEl(id)?.addEventListener('input', () => {
      getEl(id)?.classList.remove('error');
      getEl('loginError')?.classList.add('a-hidden');
    });
  });

  getEl('passToggle')?.addEventListener('click', () => {
    const inp = getEl('loginPass');
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
  });
}

function showAdminApp() {
  getEl('loginScreen')?.classList.add('a-hidden');
  getEl('adminApp')?.classList.remove('a-hidden');
  loadAllData();
  renderDashboard();
  updateBadges();
}

function doLogout() {
  DB.set(KEYS.session, null);
  getEl('adminApp')?.classList.add('a-hidden');
  getEl('loginScreen')?.classList.remove('a-hidden');
  const form = getEl('loginForm');
  if (form) form.reset();
  getEl('loginError')?.classList.add('a-hidden');
  console.log('[ADMIN] Logged out');
}

function checkSession() {
  if (DB.get(KEYS.session, null) === 'authenticated') { showAdminApp(); return true; }
  return false;
}

/* ═══════════════════════════════════════════════════════════
   15. DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function renderDashboard() {
  const saved = DB.get(KEYS.saved, []);
  const setV  = (id, v) => { const el = getEl(id); if (el) el.textContent = v; };
  setV('statDesigns',  state.designs.length);
  setV('statRequests', state.requests.length);
  setV('statMessages', state.messages.length);
  setV('statSaved',    Array.isArray(saved) ? saved.length : 0);
  updateBadges();

  renderRecentList('dashRecentReq', [...state.requests].reverse().slice(0, 5), r => ({
    dot: r.status !== 'new', name: r.fullName || '—',
    sub: `${r.projectType || '—'} · ${r.selectedDesign || 'Custom'}`,
    date: timeAgo(r.date), id: r.id, type: 'req',
  }));

  renderRecentList('dashRecentMsg', [...state.messages].reverse().slice(0, 5), m => ({
    dot: m.status !== 'unread', name: m.name || '—',
    sub: (m.message || '').substring(0, 55) + '…',
    date: timeAgo(m.date), id: m.id, type: 'msg',
  }));

  // Type breakdown
  const breakdown = getEl('typeBreakdown');
  if (breakdown) {
    const counts = {};
    state.designs.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
    const colors = { bungalow:'#C9A84C', duplex:'#50A0DC', apartment:'#64C88C', villa:'#DC6464', commercial:'#A064DC' };
    breakdown.innerHTML = Object.entries(counts).map(([t, n]) =>
      `<div class="type-pill">
         <span style="width:10px;height:10px;border-radius:50%;background:${colors[t]||'#888'};display:inline-block;flex-shrink:0"></span>
         <span class="type-pill-label">${esc(t)}</span>
         <span class="type-pill-count">${n}</span>
       </div>`).join('');
  }
}

function renderRecentList(containerId, items, mapper) {
  const el = getEl(containerId);
  if (!el) return;
  if (!items || items.length === 0) { el.innerHTML = '<div class="empty-state">No data yet.</div>'; return; }
  el.innerHTML = items.map(item => {
    const { dot, name, sub, date, id, type } = mapper(item);
    return `<div class="recent-item" data-id="${esc(id)}" data-type="${type}" role="button" tabindex="0">
      <div class="recent-dot${dot ? ' read' : ''}"></div>
      <div class="recent-info">
        <div class="recent-name">${esc(name)}</div>
        <div class="recent-sub">${esc(sub)}</div>
      </div>
      <div class="recent-date">${date}</div>
    </div>`;
  }).join('');
  el.querySelectorAll('.recent-item').forEach(row => {
    row.addEventListener('click', () => {
      if (row.dataset.type === 'req') { switchView('requests'); openReqDetail(row.dataset.id); }
      else                            { switchView('messages'); openMsgDetail(row.dataset.id); }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   16. DESIGNS TABLE
   ═══════════════════════════════════════════════════════════ */
function renderDesignsTable() {
  const searchVal  = (getEl('designTableSearch')?.value || '').toLowerCase();
  const filterType = getEl('designTableFilter')?.value || '';
  const tbody      = getEl('designsTableBody');
  if (!tbody) return;

  const list = state.designs.filter(d => {
    const ms = !searchVal || (d.title||'').toLowerCase().includes(searchVal) || (d.type||'').toLowerCase().includes(searchVal);
    const mt = !filterType || d.type === filterType;
    return ms && mt;
  });

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-m)">No designs found.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(d => `
    <tr>
      <td><div class="table-thumb" style="background-image:url('${esc(d.images[0])}')"></div></td>
      <td><div class="td-title">${esc(d.title)}</div></td>
      <td><span class="td-type">${esc(d.type)}</span></td>
      <td>${esc(d.price)}</td>
      <td>${esc(d.beds)}</td>
      <td>${esc(d.area)}</td>
      <td><span class="badge-status ${d.published?'published':'draft'}">${d.published?'Published':'Draft'}</span></td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn" data-action="edit"   data-id="${d.id}" type="button">Edit</button>
          <button class="tbl-btn" data-action="toggle" data-id="${d.id}" type="button">${d.published?'Unpublish':'Publish'}</button>
          <button class="tbl-btn danger" data-action="delete" data-id="${d.id}" type="button">Delete</button>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('.tbl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id     = parseInt(btn.dataset.id);
      const action = btn.dataset.action;
      if (action === 'edit')   handleEditDesign(id);
      if (action === 'toggle') handleTogglePublish(id);
      if (action === 'delete') handleDeleteDesign(id);
    });
  });
}

function handleEditDesign(id) {
  const d = state.designs.find(x => x.id === id);
  if (!d) return;
  state.editingDesignId = id;
  fillDesignForm(d);
  switchView('add-design');
}
function handleTogglePublish(id) {
  const d = state.designs.find(x => x.id === id);
  if (!d) return;
  d.published = !d.published;
  saveDesigns();
  renderDesignsTable();
  renderDashboard();
  toast(`"${d.title}" ${d.published?'published':'set to draft'}.`, 'info');
}
function handleDeleteDesign(id) {
  const d = state.designs.find(x => x.id === id);
  showConfirm('Delete Design', `Permanently delete "${d?.title}"? This cannot be undone.`, () => {
    state.designs = state.designs.filter(x => x.id !== id);
    saveDesigns();
    renderDesignsTable();
    renderDashboard();
    toast('Design deleted.', 'info');
  });
}

/* ═══════════════════════════════════════════════════════════
   17. DESIGN FORM (Add / Edit)
   ═══════════════════════════════════════════════════════════ */
function resetDesignForm() {
  state.editingDesignId = null;
  getEl('designForm')?.reset();
  const titleEl  = getEl('designFormTitle');
  const submitEl = getEl('designFormSubmit');
  const delBtn   = getEl('deleteDesignBtn');
  const editId   = getEl('designEditId');
  if (titleEl)  titleEl.textContent  = 'Add New Design';
  if (submitEl) submitEl.textContent = 'Save Design';
  if (delBtn)   delBtn.classList.add('a-hidden');
  if (editId)   editId.value = '';
  const pub = getEl('df-published'); if (pub) pub.checked = true;
  resetImageInputs([]);
  // Reset upload mode back to URL tab
  getEl('urlModePanel')?.classList.remove('a-hidden');
  getEl('uploadModePanel')?.classList.add('a-hidden');
  document.querySelectorAll('.img-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === 'url'));
  // Clear any uploaded previews via the form's reset helper
  const form = getEl('designForm');
  if (form?._resetUploaded) form._resetUploaded();
  clearDesignFormErrors();
}

function fillDesignForm(d) {
  const sv = (id, v) => { const el = getEl(id); if (el) el.value = (v ?? ''); };
  if (getEl('designFormTitle'))  getEl('designFormTitle').textContent  = 'Edit Design';
  if (getEl('designFormSubmit')) getEl('designFormSubmit').textContent = 'Update Design';
  getEl('deleteDesignBtn')?.classList.remove('a-hidden');
  sv('designEditId', d.id);
  sv('df-title',     d.title);
  sv('df-type',      d.type);
  sv('df-price',     d.price);
  sv('df-budget',    d.budget);
  sv('df-desc',      d.desc);
  sv('df-fullDesc',  d.fullDesc);
  sv('df-beds',      d.beds);
  sv('df-baths',     d.baths);
  sv('df-area',      d.area);
  sv('df-floors',    d.floors);
  sv('df-floorPlan', d.floorPlan || '');
  sv('df-features',  (d.features || []).join('\n'));
  const pub = getEl('df-published'); if (pub) pub.checked = (d.published !== false);
  resetImageInputs(d.images || []);
  clearDesignFormErrors();
}

function initDesignForm() {
  const form = getEl('designForm');
  if (!form) { console.warn('[ADMIN] #designForm not found'); return; }

  // ── Image mode tabs ──
  let imageMode = 'url'; // 'url' or 'upload'
  let uploadedImages = []; // array of { dataUrl, name }

  document.querySelectorAll('.img-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      imageMode = btn.dataset.mode;
      document.querySelectorAll('.img-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      getEl('urlModePanel')?.classList.toggle('a-hidden',    imageMode !== 'url');
      getEl('uploadModePanel')?.classList.toggle('a-hidden', imageMode !== 'upload');
    });
  });

  // ── File upload drop zone ──
  const dropZone  = getEl('uploadDropZone');
  const fileInput = getEl('imageFileInput');

  function handleFiles(files) {
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!allowed.length) { toast('Please select image files only.', 'error'); return; }
    const remaining = 5 - uploadedImages.length;
    if (remaining <= 0) { toast('Maximum 5 images already added.', 'error'); return; }
    const toProcess = allowed.slice(0, remaining);
    if (allowed.length > remaining) toast(`Only ${remaining} image slot(s) remaining. Extra files ignored.`, 'info');

    toProcess.forEach(file => {
      if (file.size > 2 * 1024 * 1024) { toast(`"${file.name}" exceeds 2MB limit and was skipped.`, 'error'); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        uploadedImages.push({ dataUrl: ev.target.result, name: file.name });
        renderUploadedPreviews();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderUploadedPreviews() {
    const wrap = getEl('uploadedImagePreviews');
    if (!wrap) return;
    wrap.innerHTML = uploadedImages.map((img, i) => `
      <div class="uploaded-preview-item">
        <img src="${img.dataUrl}" alt="${esc(img.name)}" />
        <span class="preview-num">${i + 1}</span>
        <button type="button" class="preview-del" data-idx="${i}" aria-label="Remove image">✕</button>
      </div>`).join('');
    wrap.querySelectorAll('.preview-del').forEach(btn => {
      btn.addEventListener('click', () => {
        uploadedImages.splice(parseInt(btn.dataset.idx), 1);
        renderUploadedPreviews();
      });
    });
  }

  if (dropZone) {
    dropZone.addEventListener('click', () => fileInput?.click());
    dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      handleFiles(e.dataTransfer.files);
    });
  }
  fileInput?.addEventListener('change', () => { handleFiles(fileInput.files); fileInput.value = ''; });

  // Expose uploadedImages getter for saveDesignFromForm
  form._getUploadedImages = () => uploadedImages;
  form._resetUploaded = () => { uploadedImages = []; renderUploadedPreviews(); };
  form._getImageMode = () => imageMode;

  getEl('addImageUrl')?.addEventListener('click', () => {
    if (document.querySelectorAll('.image-url-row').length >= 5) { toast('Maximum 5 images.', 'error'); return; }
    appendImageRow('', true);
  });

  getEl('deleteDesignBtn')?.addEventListener('click', () => {
    const idVal = parseInt(getEl('designEditId')?.value);
    if (!isNaN(idVal)) handleDeleteDesign(idVal);
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    console.log('[ADMIN] Design form submitted');
    if (!validateDesignForm()) { toast('Please fill all required fields.', 'error'); return; }
    saveDesignFromForm();
  });
}

function resetImageInputs(images) {
  const wrap = getEl('imageUrlInputs');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!images || images.length === 0) appendImageRow('', false);
  else images.forEach((url, i) => appendImageRow(url, i > 0));
}

function appendImageRow(url = '', removable = false) {
  const wrap = getEl('imageUrlInputs');
  if (!wrap) return;
  const num = wrap.querySelectorAll('.image-url-row').length + 1;
  const row = document.createElement('div');
  row.className = 'image-url-row';
  row.innerHTML = `
    <span class="img-num">${num}</span>
    <input type="url" class="img-url-input" placeholder="https://example.com/image.jpg" value="${esc(url)}" />
    <div class="img-preview" style="${url?`background-image:url('${esc(url)}')`:''}" aria-hidden="true"></div>
    <button type="button" class="img-remove${removable?'':' a-hidden'}" aria-label="Remove image">&#10005;</button>`;
  const input   = row.querySelector('.img-url-input');
  const preview = row.querySelector('.img-preview');
  input.addEventListener('input', () => {
    preview.style.backgroundImage = input.value.trim() ? `url('${input.value.trim()}')` : '';
  });
  row.querySelector('.img-remove').addEventListener('click', () => { row.remove(); reNumberImageRows(); });
  wrap.appendChild(row);
  reNumberImageRows();
}

function reNumberImageRows() {
  const rows  = document.querySelectorAll('.image-url-row');
  const total = rows.length;
  rows.forEach((r, i) => {
    const n = r.querySelector('.img-num'); if (n) n.textContent = i + 1;
    const rb = r.querySelector('.img-remove');
    if (rb) rb.classList.toggle('a-hidden', total <= 1);
  });
}

function getImageUrls() {
  return [...document.querySelectorAll('.img-url-input')].map(i => i.value.trim()).filter(Boolean);
}

function validateDesignForm() {
  clearDesignFormErrors();
  let valid = true;
  const required = [
    { id:'df-title',    errId:'df-title-err',    msg:'Title is required.' },
    { id:'df-type',     errId:'df-type-err',     msg:'Type is required.' },
    { id:'df-price',    errId:'df-price-err',    msg:'Price is required.' },
    { id:'df-budget',   errId:'df-budget-err',   msg:'Budget category is required.' },
    { id:'df-desc',     errId:'df-desc-err',     msg:'Short description is required.' },
    { id:'df-fullDesc', errId:'df-fullDesc-err', msg:'Full description is required.' },
    { id:'df-beds',     errId:'df-beds-err',     msg:'Bedrooms value is required.' },
    { id:'df-baths',    errId:'df-baths-err',    msg:'Bathrooms value is required.' },
    { id:'df-area',     errId:'df-area-err',     msg:'Area is required.' },
    { id:'df-floors',   errId:'df-floors-err',   msg:'Floors value is required.' },
    { id:'df-features', errId:'df-features-err', msg:'At least one feature is required.' },
  ];
  required.forEach(({ id, errId, msg }) => {
    const el  = getEl(id);
    const err = getEl(errId);
    if (!el) return;
    const ok = el.value.trim() !== '';
    el.classList.toggle('error', !ok);
    if (err) err.textContent = ok ? '' : msg;
    if (!ok) valid = false;
  });
  // Image validation: check whichever mode is active
  const form = getEl('designForm');
  const mode = form?._getImageMode ? form._getImageMode() : 'url';
  const hasImages = mode === 'upload'
    ? (form?._getUploadedImages?.().length > 0)
    : getImageUrls().length > 0;
  if (!hasImages) {
    const errEl = getEl('df-images-err');
    if (errEl) errEl.textContent = 'At least one image is required.';
    valid = false;
  }
  return valid;
}

function clearDesignFormErrors() {
  document.querySelectorAll('#designForm .fe').forEach(el => el.textContent = '');
  document.querySelectorAll('#designForm .error').forEach(el => el.classList.remove('error'));
}

function saveDesignFromForm() {
  const editId = parseInt(getEl('designEditId')?.value);
  const form   = getEl('designForm');
  const mode   = form?._getImageMode ? form._getImageMode() : 'url';
  const images = mode === 'upload'
    ? (form?._getUploadedImages?.() || []).map(img => img.dataUrl)
    : getImageUrls();

  const data = {
    title:     (getEl('df-title')?.value    || '').trim(),
    type:       getEl('df-type')?.value     || '',
    price:     (getEl('df-price')?.value    || '').trim(),
    budget:     getEl('df-budget')?.value   || '',
    desc:      (getEl('df-desc')?.value     || '').trim(),
    fullDesc:  (getEl('df-fullDesc')?.value || '').trim(),
    beds:      (getEl('df-beds')?.value     || '').trim(),
    baths:     (getEl('df-baths')?.value    || '').trim(),
    area:      (getEl('df-area')?.value     || '').trim(),
    floors:    (getEl('df-floors')?.value   || '').trim(),
    floorPlan: (getEl('df-floorPlan')?.value|| '').trim(),
    features:  (getEl('df-features')?.value || '').split('\n').map(f => f.trim()).filter(Boolean),
    images,
    published:  getEl('df-published')?.checked ?? true,
  };

  if (editId && !isNaN(editId)) {
    const idx = state.designs.findIndex(x => x.id === editId);
    if (idx !== -1) {
      state.designs[idx] = { ...state.designs[idx], ...data };
      toast(`"${data.title}" updated!`, 'success');
      console.log('[ADMIN] ✅ Design updated:', editId);
    }
  } else {
    const newId = state.designs.length > 0 ? Math.max(...state.designs.map(d => d.id)) + 1 : 1;
    state.designs.push({ id: newId, ...data, createdAt: new Date().toISOString() });
    toast(`"${data.title}" added to catalogue!`, 'success');
    console.log('[ADMIN] ✅ Design added:', newId);
  }

  saveDesigns();
  state.editingDesignId = null;
  switchView('designs');
}

/* ═══════════════════════════════════════════════════════════
   18. PLAN REQUESTS TABLE
   ═══════════════════════════════════════════════════════════ */
function renderRequestsTable() {
  const searchVal    = (getEl('reqSearch')?.value || '').toLowerCase();
  const statusFilter = getEl('reqStatusFilter')?.value || '';
  const tbody        = getEl('requestsTableBody');
  const emptyEl      = getEl('reqEmpty');
  if (!tbody) return;

  const list = [...state.requests].reverse().filter(r => {
    const ms = !searchVal ||
      (r.fullName      || '').toLowerCase().includes(searchVal) ||
      (r.email         || '').toLowerCase().includes(searchVal) ||
      (r.projectType   || '').toLowerCase().includes(searchVal) ||
      (r.selectedDesign|| '').toLowerCase().includes(searchVal);
    const mst = !statusFilter || r.status === statusFilter;
    return ms && mst;
  });

  tbody.innerHTML = '';
  if (emptyEl) emptyEl.classList.toggle('a-hidden', list.length > 0);
  if (!list.length) return;

  tbody.innerHTML = list.map((r, i) => `
    <tr>
      <td style="color:var(--text-m);font-size:.78rem">${String(i+1).padStart(2,'0')}</td>
      <td class="td-title">${esc(r.fullName      || '—')}</td>
      <td>${esc(r.email         || '—')}</td>
      <td>${esc(r.phone         || '—')}</td>
      <td>${esc(r.projectType   || '—')}</td>
      <td style="max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.selectedDesign||'Custom')}</td>
      <td style="font-size:.8rem">${esc(r.budget || '—')}</td>
      <td style="white-space:nowrap;font-size:.8rem">${fmtDate(r.date)}</td>
      <td><span class="badge-status ${esc(r.status||'new')}">${esc(r.status||'new')}</span></td>
      <td>
        <div class="table-actions">
          <button class="tbl-btn"       data-req-view="${esc(r.id)}" type="button">View</button>
          <button class="tbl-btn danger" data-req-del="${esc(r.id)}"  type="button">Delete</button>
        </div>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-req-view]').forEach(b =>
    b.addEventListener('click', () => openReqDetail(b.dataset.reqView)));
  tbody.querySelectorAll('[data-req-del]').forEach(b =>
    b.addEventListener('click', () => {
      const delId = b.dataset.reqDel;
      showConfirm('Delete Request', 'Delete this request? This cannot be undone.', () => {
        state.requests = state.requests.filter(r => r.id !== delId);
        saveRequests();
        renderRequestsTable();
        renderDashboard();
        updateBadges();
        toast('Request deleted.', 'info');
      });
    }));
}

function openReqDetail(id) {
  // Always re-read from storage first
  refreshDataFromStorage();
  const r = state.requests.find(x => x.id === id);
  if (!r) { console.warn('[ADMIN] Request not found:', id); return; }
  state.activeReqId = id;

  // Auto-advance status new → reviewing
  if (r.status === 'new') { r.status = 'reviewing'; saveRequests(); updateBadges(); }

  const body = getEl('reqDetailBody');
  if (body) body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-row"><span class="detail-label">Full Name</span><span class="detail-value">${esc(r.fullName||'—')}</span></div>
      <div class="detail-row"><span class="detail-label">Date Received</span><span class="detail-value">${fmtDate(r.date)}</span></div>
      <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${esc(r.email||'—')}</span></div>
      <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">${esc(r.phone||'—')}</span></div>
      <div class="detail-row"><span class="detail-label">Project Type</span><span class="detail-value">${esc(r.projectType||'—')}</span></div>
      <div class="detail-row"><span class="detail-label">Budget</span><span class="detail-value">${esc(r.budget||'—')}</span></div>
      <div class="detail-row"><span class="detail-label">Selected Design</span><span class="detail-value">${esc(r.selectedDesign||'Custom / Not specified')}</span></div>
      <div class="detail-row"><span class="detail-label">Timeline</span><span class="detail-value">${esc(r.timeline||'—')}</span></div>
      <div class="detail-row detail-full">
        <span class="detail-label">Requirements / Message</span>
        <div class="detail-message-box">${esc(r.requirements||'—')}</div>
      </div>
    </div>`;

  const sel = getEl('reqStatusChange');
  if (sel) {
    sel.innerHTML = ['new','reviewing','contacted','closed']
      .map(s => `<option value="${s}"${r.status===s?' selected':''}>${cap(s)}</option>`).join('');
  }
  openModal('reqDetailOverlay');
}

/* ═══════════════════════════════════════════════════════════
   19. MESSAGES LIST
   ═══════════════════════════════════════════════════════════ */
function renderMessagesList() {
  const searchVal    = (getEl('msgSearch')?.value || '').toLowerCase();
  const statusFilter = getEl('msgStatusFilter')?.value || '';
  const listEl       = getEl('messagesList');
  const emptyEl      = getEl('msgEmpty');
  if (!listEl) return;

  const list = [...state.messages].reverse().filter(m => {
    const ms  = !searchVal || (m.name||'').toLowerCase().includes(searchVal) || (m.email||'').toLowerCase().includes(searchVal);
    const mst = !statusFilter || m.status === statusFilter;
    return ms && mst;
  });

  listEl.innerHTML = '';
  if (emptyEl) emptyEl.classList.toggle('a-hidden', list.length > 0);
  if (!list.length) return;

  listEl.innerHTML = list.map(m => `
    <div class="message-card${m.status==='unread'?' unread':''}" data-msg-id="${esc(m.id)}" role="button" tabindex="0">
      <div class="message-card-header">
        <div class="message-from">
          <div class="msg-avatar">${esc((m.name||'?')[0].toUpperCase())}</div>
          <div>
            <div class="msg-name">${esc(m.name||'—')}</div>
            <div class="msg-email">${esc(m.email||'—')}</div>
          </div>
        </div>
        <div class="message-card-meta">
          <span class="badge-status ${esc(m.status)}">${esc(m.status)}</span>
          <span class="msg-date">${timeAgo(m.date)}</span>
        </div>
      </div>
      <div class="message-preview">${esc(m.message||'')}</div>
    </div>`).join('');

  listEl.querySelectorAll('.message-card').forEach(card =>
    card.addEventListener('click', () => openMsgDetail(card.dataset.msgId)));
}

function openMsgDetail(id) {
  refreshDataFromStorage();
  const m = state.messages.find(x => x.id === id);
  if (!m) { console.warn('[ADMIN] Message not found:', id); return; }
  state.activeMsgId = id;

  // Auto-mark as read
  if (m.status === 'unread') { m.status = 'read'; saveMessages(); updateBadges(); }

  const body = getEl('msgDetailBody');
  if (body) body.innerHTML = `
    <div class="detail-grid">
      <div class="detail-row"><span class="detail-label">From</span><span class="detail-value">${esc(m.name||'—')}</span></div>
      <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${fmtDate(m.date)}</span></div>
      <div class="detail-row detail-full"><span class="detail-label">Email</span><span class="detail-value">${esc(m.email||'—')}</span></div>
      <div class="detail-row detail-full">
        <span class="detail-label">Message</span>
        <div class="detail-message-box">${esc(m.message||'—')}</div>
      </div>
    </div>`;

  const sel = getEl('msgStatusChange');
  if (sel) sel.value = m.status;
  openModal('msgDetailOverlay');
}

/* ═══════════════════════════════════════════════════════════
   20. SETTINGS
   ═══════════════════════════════════════════════════════════ */
function syncSettingsUI() {
  const t  = document.documentElement.getAttribute('data-theme') || 'dark';
  const ck = getEl('settingsTheme');
  if (ck) ck.checked = (t === 'dark');
}

function initSettings() {
  // Settings theme checkbox
  getEl('settingsTheme')?.addEventListener('change', e => applyTheme(e.target.checked ? 'dark' : 'light'));

  // Topbar theme toggle button
  getEl('adminThemeToggle')?.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  // Compact sidebar
  getEl('compactSidebar')?.addEventListener('change', e => {
    const sidebar  = getEl('sidebar');
    const mainArea = document.querySelector('.admin-main');
    const w = e.target.checked ? '64px' : '';
    if (sidebar)  sidebar.style.width      = w;
    if (mainArea) mainArea.style.marginLeft = w;
  });

  // Change password form
  getEl('changePassForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const cur  = getEl('curPass')?.value  || '';
    const nw   = getEl('newPass')?.value  || '';
    const conf = getEl('confirmPass')?.value || '';
    const errEl= getEl('passChangeError');
    const sucEl= getEl('passChangeSuccess');
    if (errEl) errEl.classList.add('a-hidden');
    if (sucEl) sucEl.classList.add('a-hidden');

    const savedPass = DB.get(KEYS.adminPass, null) || ADMIN_CREDS.pass;
    if (cur !== savedPass)  { showSettingsErr('Current password is incorrect.'); return; }
    if (nw.length < 6)      { showSettingsErr('New password must be at least 6 characters.'); return; }
    if (nw !== conf)         { showSettingsErr('Passwords do not match.'); return; }
    DB.set(KEYS.adminPass, nw);
    if (sucEl) sucEl.classList.remove('a-hidden');
    getEl('changePassForm')?.reset();
    toast('Password updated!', 'success');

    function showSettingsErr(msg) {
      if (errEl) { errEl.textContent = msg; errEl.classList.remove('a-hidden'); }
    }
  });

  // Export all data as JSON
  getEl('exportAllData')?.addEventListener('click', () => {
    const data = {
      designs:    state.designs,
      requests:   state.requests,
      messages:   state.messages,
      exportDate: new Date().toISOString(),
    };
    downloadBlob(JSON.stringify(data, null, 2), 'arcform_data.json', 'application/json');
    toast('All data exported as JSON.', 'success');
  });

  // Reset / nuke all data
  getEl('nukeData')?.addEventListener('click', () => {
    showConfirm('Reset All Data', 'This will permanently delete all designs, requests, and messages and restore design defaults. Are you sure?', () => {
      [KEYS.designs, KEYS.requests, KEYS.messages].forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('arcform_demo_seeded'); // remove legacy flag if present
      loadAllData();
      renderDashboard();
      updateBadges();
      toast('All data reset to defaults.', 'info');
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   21. CSV / JSON EXPORT
   ═══════════════════════════════════════════════════════════ */
function exportCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}
function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════════════════
   22. DOMContentLoaded — wire all events
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[ADMIN] 🚀 Admin panel v3.0 initialising…');

  // Sync theme UI with stored preference
  const savedTheme = DB.get(KEYS.theme, 'light');
  applyTheme(typeof savedTheme === 'string' ? savedTheme : 'light');

  /* ── Confirm dialog ── */
  getEl('confirmOk')?.addEventListener('click',     () => { hideConfirm(); if (state.confirmCb) state.confirmCb(); });
  getEl('confirmCancel')?.addEventListener('click', hideConfirm);
  getEl('confirmClose')?.addEventListener('click',  hideConfirm);
  getEl('confirmOverlay')?.addEventListener('click', e => { if (e.target.id === 'confirmOverlay') hideConfirm(); });

  /* ── Request detail modal ── */
  getEl('reqStatusSave')?.addEventListener('click', () => {
    const r = state.requests.find(x => x.id === state.activeReqId);
    if (r) {
      r.status = getEl('reqStatusChange')?.value || r.status;
      saveRequests();
      renderRequestsTable();
      renderDashboard();
      updateBadges();
      toast('Status updated.', 'success');
    }
    closeModal('reqDetailOverlay');
  });
  getEl('reqDetailClose')?.addEventListener('click',    () => closeModal('reqDetailOverlay'));
  getEl('reqDetailCloseBtn')?.addEventListener('click', () => closeModal('reqDetailOverlay'));
  getEl('reqDetailOverlay')?.addEventListener('click', e => { if (e.target.id === 'reqDetailOverlay') closeModal('reqDetailOverlay'); });

  /* ── Message detail modal ── */
  getEl('msgStatusSave')?.addEventListener('click', () => {
    const m = state.messages.find(x => x.id === state.activeMsgId);
    if (m) {
      m.status = getEl('msgStatusChange')?.value || m.status;
      saveMessages();
      renderMessagesList();
      renderDashboard();
      updateBadges();
      toast('Status updated.', 'success');
    }
    closeModal('msgDetailOverlay');
  });
  getEl('msgDetailClose')?.addEventListener('click',    () => closeModal('msgDetailOverlay'));
  getEl('msgDetailCloseBtn')?.addEventListener('click', () => closeModal('msgDetailOverlay'));
  getEl('msgDetailOverlay')?.addEventListener('click', e => { if (e.target.id === 'msgDetailOverlay') closeModal('msgDetailOverlay'); });

  /* ── Escape key closes open modals ── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    ['reqDetailOverlay','msgDetailOverlay','confirmOverlay'].forEach(id => {
      const el = getEl(id);
      if (el && !el.classList.contains('a-hidden')) closeModal(id);
    });
  });

  /* ── Requests toolbar ── */
  getEl('reqSearch')?.addEventListener('input',        renderRequestsTable);
  getEl('reqStatusFilter')?.addEventListener('change', renderRequestsTable);
  getEl('refreshRequests')?.addEventListener('click', () => {
    refreshDataFromStorage(); renderRequestsTable(); renderDashboard(); updateBadges();
    toast('Requests refreshed.', 'info');
  });
  getEl('exportRequests')?.addEventListener('click', () => {
    refreshDataFromStorage();
    if (!state.requests.length) { toast('No requests to export.', 'error'); return; }
    const headers = ['ID','Name','Email','Phone','Project Type','Design','Budget','Timeline','Requirements','Status','Date'];
    exportCSV([headers, ...state.requests.map(r =>
      [r.id, r.fullName, r.email, r.phone, r.projectType, r.selectedDesign, r.budget, r.timeline, r.requirements, r.status, fmtDate(r.date)]
    )], 'arcform_requests.csv');
    toast('Requests exported.', 'success');
  });
  getEl('clearRequests')?.addEventListener('click', () => {
    if (!state.requests.length) { toast('No requests to clear.', 'error'); return; }
    showConfirm('Clear All Requests', 'Permanently delete all plan requests?', () => {
      state.requests = []; saveRequests(); renderRequestsTable(); renderDashboard(); updateBadges();
      toast('All requests cleared.', 'info');
    });
  });

  /* ── Messages toolbar ── */
  getEl('msgSearch')?.addEventListener('input',        renderMessagesList);
  getEl('msgStatusFilter')?.addEventListener('change', renderMessagesList);
  getEl('refreshMessages')?.addEventListener('click', () => {
    refreshDataFromStorage(); renderMessagesList(); renderDashboard(); updateBadges();
    toast('Messages refreshed.', 'info');
  });
  getEl('exportMessages')?.addEventListener('click', () => {
    refreshDataFromStorage();
    if (!state.messages.length) { toast('No messages to export.', 'error'); return; }
    const headers = ['ID','Name','Email','Message','Status','Date'];
    exportCSV([headers, ...state.messages.map(m =>
      [m.id, m.name, m.email, m.message, m.status, fmtDate(m.date)]
    )], 'arcform_messages.csv');
    toast('Messages exported.', 'success');
  });
  getEl('clearMessages')?.addEventListener('click', () => {
    if (!state.messages.length) { toast('No messages to clear.', 'error'); return; }
    showConfirm('Clear All Messages', 'Permanently delete all contact messages?', () => {
      state.messages = []; saveMessages(); renderMessagesList(); renderDashboard(); updateBadges();
      toast('All messages cleared.', 'info');
    });
  });

  /* ── Designs table filters ── */
  getEl('designTableSearch')?.addEventListener('input',  renderDesignsTable);
  getEl('designTableFilter')?.addEventListener('change', renderDesignsTable);

  /* ── Init subsystems ── */
  initDesignForm();
  initSettings();
  initLogin();
  initNavigation();
  initStorageSync();

  /* ── Auto-login if session active ── */
  if (!checkSession()) {
    console.log('[ADMIN] No active session — showing login screen');
  }

  console.log('[ADMIN] ✅ Init complete');
});