/* ============================================================
   ARCFORM — Main Website | script.js  v3.0
   FULLY FIXED & SYNCHRONIZED with admin.js
   ─────────────────────────────────────────────────────────────
   KEY FIX LOG:
   • Unified storage keys (same as admin.js)
   • Storage.push() safely appends without overwriting
   • Form saves EXACT field names admin.js expects:
       requests → { id, fullName, email, phone, projectType,
                    selectedDesign, budget, timeline,
                    requirements, status, date }
       messages → { id, name, email, message, status, date }
   • Theme uses key 'arcform_theme' — same as admin.js
   • themeIcon (#themeIcon) properly swapped on toggle
   • All DOM queries guarded with null-checks
   • DOMContentLoaded wraps ALL init code
   ============================================================ */
'use strict';

/* ═══════════════════════════════════════════════════════════
   1. SHARED CONSTANTS  (must match admin.js exactly)
   ═══════════════════════════════════════════════════════════ */
const STORAGE_KEYS = {
  designs:  'arcform_designs',
  requests: 'arcform_requests',   // admin reads this
  messages: 'arcform_messages',   // admin reads this
  saved:    'arcform_saved',
  theme:    'arcform_theme',      // ONE key shared with admin
};

/* ═══════════════════════════════════════════════════════════
   2. SAFE STORAGE  (never throws)
   ═══════════════════════════════════════════════════════════ */
const Storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null || raw === 'undefined' || raw === '') return fallback !== undefined ? fallback : null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[ARCFORM] Storage.get error:', key, e.message);
      return fallback !== undefined ? fallback : null;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('[ARCFORM] Storage.set error:', key, e.message); }
  },
  /** Safely append one item to a stored array */
  push(key, item) {
    const list = this.get(key, []);
    const arr  = Array.isArray(list) ? list : [];
    arr.push(item);
    this.set(key, arr);
    console.log('[ARCFORM] ✅ Saved to', key, '| id:', item.id, '| total:', arr.length);
    return arr;
  },
};

/* ═══════════════════════════════════════════════════════════
   3. HELPERS
   ═══════════════════════════════════════════════════════════ */
/** HTML-escape a value for safe injection into innerHTML */
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
/** Safely get trimmed value of a form field by id */
function fval(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
/** Get the visible text of the selected option */
function selectedText(id) {
  const el = document.getElementById(id);
  if (!el || el.selectedIndex < 0) return '';
  return (el.options[el.selectedIndex] || {}).text || '';
}
/** Generate a unique id */
function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 99999)}`;
}

/* ═══════════════════════════════════════════════════════════
   4. DEFAULT DESIGN DATA
   ═══════════════════════════════════════════════════════════ */
const DEFAULT_DESIGNS = [
  { id:1, type:'bungalow',   published:true,  title:'The Savannah Retreat',   desc:'A refined single-storey bungalow blending open-plan living with serene outdoor spaces.',                              fullDesc:'The Savannah Retreat is a masterpiece of modern bungalow design. Featuring expansive open-plan living spaces, floor-to-ceiling windows, and seamless indoor-outdoor flow, this home is perfect for families seeking elegance and comfort on a single level.',            price:'₦18,500,000', budget:'budget', beds:'3',   baths:'2',   area:'210 m²',      floors:'1',  images:['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80','https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80'], features:['Open-plan living room','Master suite with walk-in wardrobe','Wrap-around veranda','Home office','Double garage','Solar-ready roofing','Modern kitchen island','Guest bedroom en-suite'],                                            floorPlan:'Ground floor: Open plan living, dining & kitchen, 3 bedrooms, 2 bathrooms, study, veranda',                                          createdAt:new Date(Date.now()-864e5*5).toISOString() },
  { id:2, type:'duplex',     published:true,  title:'The Meridian Twin',       desc:'An elegant semi-detached duplex with premium finishes and smart home features.',                                       fullDesc:'The Meridian Twin combines modern architectural flair with functional dual-unit living. Each unit boasts its own private entrance, outdoor terrace, and premium interior finishes — ideal for owner-occupiers or investment properties.',                                price:'₦34,000,000', budget:'mid',    beds:'4',   baths:'3',   area:'320 m²',      floors:'2',  images:['https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80','https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80'], features:['Private separate entrances','Rooftop terrace','Smart home wiring','Open-plan kitchen/dining','4 bedrooms per unit','Dedicated parking bays','Pre-installed solar panels','Intercom security system'],                        floorPlan:'Ground: Living, dining, kitchen, guest WC | First: 3 bedrooms + master suite with terrace',                                          createdAt:new Date(Date.now()-864e5*4).toISOString() },
  { id:3, type:'apartment',  published:true,  title:'Highrise Luxe 12',        desc:'Contemporary 12-storey apartment complex with panoramic city views and premium amenities.',                           fullDesc:'Highrise Luxe 12 redefines urban living. This 12-storey tower features 48 luxury apartments, a rooftop infinity pool, commercial ground floor, and a 3-level underground parking facility.',                                                                          price:'₦2.4B',       budget:'luxury', beds:'2–4', baths:'2–4', area:'85–220 m²/unit',floors:'12', images:['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80','https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80','https://images.unsplash.com/photo-1467533003447-e295ff1b0435?w=800&q=80'], features:['Rooftop infinity pool','Concierge service','3-level underground parking','Fitness centre','Commercial ground floor','CCTV & 24hr security','High-speed lifts x4','Generator backup'],                                          floorPlan:'Floors 1-2: Commercial/lobby | Floors 3-12: Residential (4 units/floor) | Roof: Pool & terrace',                                      createdAt:new Date(Date.now()-864e5*3).toISOString() },
  { id:4, type:'villa',      published:true,  title:'The Coral Grande',        desc:'A palatial 5-bedroom villa with infinity pool, home cinema, and resort-style grounds.',                               fullDesc:"The Coral Grande is the pinnacle of luxury residential design. Set on a generous plot, this villa features an infinity pool, professional home cinema, a chef's kitchen, wine cellar, and mature landscaped gardens.",                                                   price:'₦120,000,000',budget:'luxury', beds:'5',   baths:'5',   area:'650 m²',      floors:'2',  images:['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80','https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80'], features:['Infinity edge pool','Home cinema (12-seater)','Wine cellar',"Chef's kitchen",'Ensuite for all bedrooms','Smart home automation','Landscaped gardens','Gym & wellness room','Staff quarters','4-car garage'],                   floorPlan:'Ground: Reception, lounge, cinema, kitchen, guest suite | Upper: 4 bed suites | Grounds: Pool, gym, staff',                           createdAt:new Date(Date.now()-864e5*2).toISOString() },
  { id:5, type:'commercial', published:true,  title:'Nexus Office Tower',      desc:'A 10-storey Grade-A commercial tower designed for multinational and tech corporations.',                              fullDesc:'Nexus Office Tower offers 10 floors of premium Grade-A office space with stunning curtain-wall glazing, flexible floor plates, a 4-storey atrium lobby, and green building certification.',                                                                            price:'₦850,000,000',budget:'luxury', beds:'N/A', baths:'20+', area:'8,500 m²',    floors:'10', images:['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80','https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80'], features:['Grade-A specifications','LEED Green certification','Floor plates up to 850 m²','4-storey glass atrium','Raised access flooring','BMS integration','Conference suites','5-star lobby','3 basement parking levels','Retail ground floor'],     floorPlan:'B1-B3: 500 parking bays | GF: Retail & lobby | F1-F10: 850 m² flexible office plates',                                               createdAt:new Date(Date.now()-864e5).toISOString() },
  { id:6, type:'bungalow',   published:true,  title:'The Hillside Craftsman',  desc:'A charming 3-bedroom craftsman bungalow with exposed beams and a timeless aesthetic.',                               fullDesc:'The Hillside Craftsman draws inspiration from classic craftsman architecture, featuring exposed timber beams, wide covered porches, stone cladding, and warm natural materials.',                                                                                       price:'₦22,000,000', budget:'mid',    beds:'3',   baths:'2',   area:'195 m²',      floors:'1',  images:['https://images.unsplash.com/photo-1601084881623-cdf9a8ea242c?w=800&q=80','https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80','https://images.unsplash.com/photo-1598228723793-52759bba239c?w=800&q=80'], features:['Exposed timber beams','Wide covered veranda','Stone facade cladding','Vaulted living room','Farmhouse kitchen','Fireplace feature wall','Reading nook','Outdoor fire pit area'],                                  floorPlan:'Open living/dining/kitchen, master bedroom + 2 bedrooms, 2 bathrooms, utility, veranda',                                             createdAt:new Date(Date.now()-36e5*12).toISOString() },
  { id:7, type:'duplex',     published:true,  title:'The Urban Loft Duplex',   desc:'Industrial-chic duplex with double-height living spaces and polished concrete finishes.',                             fullDesc:'The Urban Loft Duplex brings New York warehouse aesthetics to contemporary West African urban living. Double-height ceilings, polished concrete floors, exposed brickwork, and steel-framed windows.',                                                                  price:'₦45,000,000', budget:'mid',    beds:'3',   baths:'2',   area:'280 m²',      floors:'2',  images:['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80','https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80','https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&q=80'], features:['Double-height living room','Polished concrete floors','Exposed brick feature walls','Steel-frame windows','Mezzanine office','Roof deck','Industrial kitchen','Open-tread staircase'],                                  floorPlan:'Ground: Open living/kitchen, guest suite | Upper: Mezzanine, 2 bedrooms, master bath | Roof: Deck',                                  createdAt:new Date(Date.now()-36e5*6).toISOString() },
  { id:8, type:'commercial', published:true,  title:'The Marketplace Hub',     desc:'A vibrant mixed-use commercial complex with retail, food court, and event spaces.',                                   fullDesc:'The Marketplace Hub is a dynamic mixed-use development combining retail shops, a 600-seat food court, flexible event hall, and upper-level office space — designed to become the commercial heart of its neighbourhood.',                                               price:'₦320,000,000',budget:'luxury', beds:'N/A', baths:'30+', area:'4,200 m²',    floors:'3',  images:['https://images.unsplash.com/photo-1519567770579-c2fc5f4b7679?w=800&q=80','https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&q=80','https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=80'], features:['40+ retail units','600-seat food court','Flexible event hall','Upper office floors','Central atrium sky-light','Ample surface parking','Accessible design','Modern security systems'],                                    floorPlan:'GF: Retail & food court | F1: Event hall & more retail | F2-F3: Commercial offices | Roof: Services',                                 createdAt:new Date().toISOString() },
];

/* ═══════════════════════════════════════════════════════════
   5. APP STATE
   ═══════════════════════════════════════════════════════════ */
let designs       = [];     // active designs (loaded from storage or defaults)
let savedDesigns  = [];     // array of saved design IDs
let activeFilter  = 'all';
let searchQuery   = '';
let budgetFilter  = '';
let bedroomFilter = '';
let modalSlideIdx = 0;
let autoSlideTimer= null;

/* ═══════════════════════════════════════════════════════════
   6. THEME  — key: 'arcform_theme' (same in admin.js)
   ═══════════════════════════════════════════════════════════ */
function applyTheme(theme) {
  const t = (theme === 'light') ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  Storage.set(STORAGE_KEYS.theme, t);
  // Update the icon inside #themeIcon span
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = (t === 'dark') ? '☀' : '◑';
  console.log('[ARCFORM] Theme set to:', t);
}

function initTheme() {
  const saved = Storage.get(STORAGE_KEYS.theme, 'light');
  applyTheme(typeof saved === 'string' ? saved : 'light');

  const btn = document.getElementById('themeToggle');
  if (!btn) { console.warn('[ARCFORM] #themeToggle not found'); return; }

  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

/* ═══════════════════════════════════════════════════════════
   7. DESIGN LOADER
   ═══════════════════════════════════════════════════════════ */
function loadDesigns() {
  const stored = Storage.get(STORAGE_KEYS.designs, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    console.log('[ARCFORM] Loaded', stored.length, 'designs from storage');
    return stored.filter(d => d.published !== false);
  }
  // First visit — seed defaults
  Storage.set(STORAGE_KEYS.designs, DEFAULT_DESIGNS);
  console.log('[ARCFORM] Seeded default designs');
  return DEFAULT_DESIGNS.filter(d => d.published !== false);
}

/* ═══════════════════════════════════════════════════════════
   8. NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function initNavigation() {
  const navbar     = document.getElementById('navbar');
  const hamburger  = document.getElementById('hamburger');
  const navLinksEl = document.getElementById('navLinks');

  if (!navbar) return;

  // Scroll: add 'scrolled' class, update active link, reveal animations
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateActiveNavLink();
    revealOnScroll();
  }, { passive: true });

  // Hamburger mobile toggle
  if (hamburger && navLinksEl) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinksEl.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });
    // Close menu when a link is clicked
    navLinksEl.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinksEl.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Smooth scroll for all #anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href   = this.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

function updateActiveNavLink() {
  const ids    = ['home','gallery','about','request','contact'];
  let   active = 'home';
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top < 140) active = id;
  });
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = (a.getAttribute('href') || '').replace('#', '');
    a.classList.toggle('active', href === active);
  });
}

/* ═══════════════════════════════════════════════════════════
   9. GALLERY — FILTER & RENDER
   ═══════════════════════════════════════════════════════════ */
function initGallery() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      renderCards();
    });
  });

  const si = document.getElementById('searchInput');
  const bf = document.getElementById('budgetFilter');
  const be = document.getElementById('bedroomFilter');
  if (si) si.addEventListener('input',  e => { searchQuery  = e.target.value.toLowerCase().trim(); renderCards(); });
  if (bf) bf.addEventListener('change', e => { budgetFilter  = e.target.value; renderCards(); });
  if (be) be.addEventListener('change', e => { bedroomFilter = e.target.value; renderCards(); });

  renderCards();
}

function getFiltered() {
  return designs.filter(d => {
    const matchType   = activeFilter === 'all' || d.type === activeFilter;
    const matchSearch = !searchQuery ||
      (d.title || '').toLowerCase().includes(searchQuery) ||
      (d.desc  || '').toLowerCase().includes(searchQuery) ||
      (d.type  || '').toLowerCase().includes(searchQuery);
    const matchBudget = !budgetFilter || d.budget === budgetFilter;
    const matchBeds   = (() => {
      if (!bedroomFilter) return true;
      const n = parseInt(d.beds);
      if (isNaN(n)) return true;
      if (bedroomFilter === '1') return n <= 2;
      if (bedroomFilter === '3') return n >= 3 && n <= 4;
      if (bedroomFilter === '5') return n >= 5;
      return true;
    })();
    return matchType && matchSearch && matchBudget && matchBeds;
  });
}

function renderCards() {
  const grid  = document.getElementById('designGrid');
  const noRes = document.getElementById('noResults');
  if (!grid) return;

  const filtered = getFiltered();
  grid.innerHTML  = '';
  if (noRes) noRes.classList.toggle('hidden', filtered.length > 0);
  if (!filtered.length) return;

  filtered.forEach((d, i) => {
    const isSaved = savedDesigns.includes(d.id);
    const card    = document.createElement('div');
    card.className = 'design-card fade-in';
    card.style.transitionDelay = `${i * 0.055}s`;
    card.innerHTML = `
      <div class="card-img-wrap">
        <div class="card-img" style="background-image:url('${esc(d.images[0])}')"></div>
        <span class="card-badge">${esc(d.type)}</span>
        <button class="card-save${isSaved?' saved':''}" data-id="${d.id}" type="button" aria-label="${isSaved?'Unsave':'Save'} design">${isSaved?'♥':'♡'}</button>
      </div>
      <div class="card-body">
        <div class="card-type">${esc(d.type)}</div>
        <div class="card-title">${esc(d.title)}</div>
        <div class="card-desc">${esc(d.desc)}</div>
        <div class="card-meta">
          <div class="card-meta-item"><span class="card-meta-label">Bedrooms</span><span class="card-meta-value">${esc(d.beds)}</span></div>
          <div class="card-meta-item"><span class="card-meta-label">Bathrooms</span><span class="card-meta-value">${esc(d.baths)}</span></div>
          <div class="card-meta-item"><span class="card-meta-label">Area</span><span class="card-meta-value">${esc(d.area)}</span></div>
          <div class="card-meta-item"><span class="card-meta-label">Floors</span><span class="card-meta-value">${esc(d.floors)}</span></div>
        </div>
        <div class="card-footer">
          <span class="card-price">${esc(d.price)}</span>
          <button class="btn btn-primary card-cta" type="button" data-id="${d.id}">View Details</button>
        </div>
      </div>`;

    card.querySelector('.card-cta') .addEventListener('click', e => { e.stopPropagation(); openModal(d.id); });
    card.querySelector('.card-save').addEventListener('click', e => { e.stopPropagation(); toggleSave(d.id, e.currentTarget); });
    card.addEventListener('click', () => openModal(d.id));
    grid.appendChild(card);
  });

  // Trigger fade-in on next frame
  requestAnimationFrame(() => {
    grid.querySelectorAll('.design-card.fade-in').forEach(c => c.classList.add('visible'));
  });
}

/** Global so inline onclick="resetFilters()" works */
window.resetFilters = function () {
  activeFilter = 'all'; searchQuery = ''; budgetFilter = ''; bedroomFilter = '';
  const si = document.getElementById('searchInput');  if (si) si.value = '';
  const bf = document.getElementById('budgetFilter'); if (bf) bf.value = '';
  const be = document.getElementById('bedroomFilter');if (be) be.value = '';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  const allBtn = document.querySelector('[data-filter="all"]');
  if (allBtn) allBtn.classList.add('active');
  renderCards();
};

/* ═══════════════════════════════════════════════════════════
   10. SAVE / BOOKMARK
   ═══════════════════════════════════════════════════════════ */
function toggleSave(id, btn) {
  const idx = savedDesigns.indexOf(id);
  const adding = idx === -1;
  if (adding) savedDesigns.push(id);
  else         savedDesigns.splice(idx, 1);
  btn.classList.toggle('saved', adding);
  btn.textContent = adding ? '♥' : '♡';
  btn.setAttribute('aria-label', (adding ? 'Unsave' : 'Save') + ' design');
  Storage.set(STORAGE_KEYS.saved, savedDesigns);
}

/* ═══════════════════════════════════════════════════════════
   11. MODAL
   ═══════════════════════════════════════════════════════════ */
function initModal() {
  const overlay  = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  if (!overlay) { console.warn('[ARCFORM] #modalOverlay not found'); return; }
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(id) {
  const d = designs.find(x => x.id === id);
  if (!d) { console.warn('[ARCFORM] Design not found:', id); return; }

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  if (!overlay || !content) return;

  modalSlideIdx = 0;
  clearInterval(autoSlideTimer);
  autoSlideTimer = null;

  const multi   = Array.isArray(d.images) && d.images.length > 1;
  const isSaved = savedDesigns.includes(d.id);

  const slidesHTML = (d.images || []).map((img, i) =>
    `<div class="slide-img${i===0?' active':''}" style="background-image:url('${esc(img)}')"></div>`).join('');

  const dotsHTML = multi
    ? (d.images || []).map((_,i) => `<span class="slider-dot${i===0?' active':''}" data-idx="${i}"></span>`).join('')
    : '';

  const featHTML = (d.features || []).map(f => `<div class="feature-item">${esc(f)}</div>`).join('');

  content.innerHTML = `
    <div class="modal-img-slider" id="modalSlider">
      ${slidesHTML}
      ${multi ? `
        <button class="slider-btn prev" id="sliderPrev" type="button">&#8249;</button>
        <button class="slider-btn next" id="sliderNext" type="button">&#8250;</button>
        <div class="slider-dots">${dotsHTML}</div>` : ''}
    </div>
    <div class="modal-header">
      <div class="modal-badge">${esc(d.type)}</div>
      <h2 class="modal-title">${esc(d.title)}</h2>
      <div class="modal-price">Starting from ${esc(d.price)}</div>
    </div>
    <p class="modal-desc">${esc(d.fullDesc)}</p>
    <div class="modal-specs">
      <div class="spec-item"><div class="spec-value">${esc(d.beds)}</div><div class="spec-label">Bedrooms</div></div>
      <div class="spec-item"><div class="spec-value">${esc(d.baths)}</div><div class="spec-label">Bathrooms</div></div>
      <div class="spec-item"><div class="spec-value">${esc(d.area)}</div><div class="spec-label">Total Area</div></div>
      <div class="spec-item"><div class="spec-value">${esc(d.floors)}</div><div class="spec-label">Floors</div></div>
    </div>
    <div class="modal-features"><h4>Key Features</h4><div class="features-grid">${featHTML}</div></div>
    <div class="modal-floor"><h4>Floor Plan Overview</h4><p style="font-size:.88rem;color:var(--text-secondary);line-height:1.65">${esc(d.floorPlan)}</p></div>
    <div class="modal-actions">
      <button class="btn btn-primary" id="modalReqBtn" type="button">Request This Plan &rarr;</button>
      <button class="btn btn-ghost modal-save-btn${isSaved?' saved':''}" data-id="${d.id}" type="button">${isSaved?'♥ Saved':'♡ Save Design'}</button>
    </div>`;

  // Slider
  if (multi) {
    document.getElementById('sliderNext').addEventListener('click', () => slideBy(1, d));
    document.getElementById('sliderPrev').addEventListener('click', () => slideBy(-1, d));
    content.querySelectorAll('.slider-dot').forEach(dot =>
      dot.addEventListener('click', () => slideTo(parseInt(dot.dataset.idx))));
    autoSlideTimer = setInterval(() => slideBy(1, d), 4000);
  }

  // Request button
  document.getElementById('modalReqBtn').addEventListener('click', () => {
    closeModal();
    prefillDesignSelect(d);
    const sect = document.getElementById('request');
    if (sect) {
      setTimeout(() => {
        window.scrollTo({ top: sect.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
      }, 80);
    }
  });

  // Save button inside modal
  const saveBtn = content.querySelector('.modal-save-btn');
  saveBtn.addEventListener('click', () => {
    toggleSave(d.id, saveBtn);
    const nowSaved = savedDesigns.includes(d.id);
    saveBtn.textContent = nowSaved ? '♥ Saved' : '♡ Save Design';
    // Sync card save button if visible
    const cardSave = document.querySelector(`.card-save[data-id="${d.id}"]`);
    if (cardSave) {
      cardSave.classList.toggle('saved', nowSaved);
      cardSave.textContent = nowSaved ? '♥' : '♡';
    }
  });

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
  clearInterval(autoSlideTimer);
  autoSlideTimer = null;
}

function slideBy(dir, d) {
  const len = (d.images || []).length;
  modalSlideIdx = (modalSlideIdx + dir + len) % len;
  slideTo(modalSlideIdx);
}
function slideTo(idx) {
  modalSlideIdx = idx;
  const slider = document.getElementById('modalSlider');
  if (!slider) return;
  slider.querySelectorAll('.slide-img') .forEach((s,i) => s.classList.toggle('active', i===idx));
  slider.querySelectorAll('.slider-dot').forEach((d,i) => d.classList.toggle('active', i===idx));
}

/* ═══════════════════════════════════════════════════════════
   12. DESIGN SELECT  (in request form)
   ═══════════════════════════════════════════════════════════ */
function populateDesignSelect() {
  const sel = document.getElementById('selectedDesign');
  if (!sel) return;
  // Remove all options except the first placeholder
  while (sel.options.length > 1) sel.remove(1);
  designs.forEach(d => {
    const opt = document.createElement('option');
    opt.value           = d.title;                    // store the design title as value
    opt.dataset.designId= String(d.id);
    opt.textContent     = `${d.title} (${d.type})`;
    sel.appendChild(opt);
  });
}

function prefillDesignSelect(d) {
  const sel = document.getElementById('selectedDesign');
  if (!sel) return;
  for (const opt of sel.options) {
    if (opt.dataset.designId && parseInt(opt.dataset.designId) === d.id) {
      sel.value = opt.value;
      return;
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   13. FORM VALIDATION
   ═══════════════════════════════════════════════════════════ */
const FORM_RULES = {
  request: [
    { id:'fullName',    errId:'fullNameError',    msg:'Please enter your full name (min 2 characters).',   test: v => v.trim().length >= 2 },
    { id:'email',       errId:'emailError',       msg:'Please enter a valid email address.',               test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { id:'phone',       errId:'phoneError',       msg:'Please enter a valid phone number.',                test: v => v.replace(/[\s\-+()\u00a0]/g,'').length >= 7 },
    { id:'projectType', errId:'projectTypeError', msg:'Please select a project type.',                    test: v => v !== '' },
    { id:'budget',      errId:'budgetError',      msg:'Please select a budget range.',                    test: v => v !== '' },
    { id:'requirements',errId:'requirementsError',msg:'Please describe your requirements (min 20 chars).', test: v => v.trim().length >= 20 },
  ],
  contact: [
    { id:'cName',    errId:'cNameError',    msg:'Your name is required.',              test: v => v.trim().length >= 2 },
    { id:'cEmail',   errId:'cEmailError',   msg:'A valid email address is required.',  test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    { id:'cMessage', errId:'cMessageError', msg:'Message must be at least 10 chars.',  test: v => v.trim().length >= 10 },
  ],
};

function validateForm(formKey) {
  let valid = true;
  (FORM_RULES[formKey] || []).forEach(({ id, errId, msg, test }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el) { console.warn('[ARCFORM] Missing field element:', id); return; }
    const ok = test(el.value);
    el.classList.toggle('error', !ok);
    if (err) err.textContent = ok ? '' : msg;
    if (!ok) valid = false;
  });
  return valid;
}

function clearFormErrors(formKey) {
  (FORM_RULES[formKey] || []).forEach(({ id, errId }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (el)  el.classList.remove('error');
    if (err) err.textContent = '';
  });
}

/* ═══════════════════════════════════════════════════════════
   14. REQUEST FORM
   ─────────────────────────────────────────────────────────
   Schema saved to 'arcform_requests':
   {
     id, fullName, email, phone, projectType,
     selectedDesign, budget, timeline,
     requirements, status:'new', date
   }
   admin.js reads ALL these exact field names.
   ═══════════════════════════════════════════════════════════ */
function initRequestForm() {
  const form = document.getElementById('requestForm');
  const succ = document.getElementById('formSuccess');
  if (!form) { console.warn('[ARCFORM] #requestForm not found'); return; }

  form.addEventListener('submit', e => {
    e.preventDefault();
    console.log('[ARCFORM] Request form submit triggered');

    if (!validateForm('request')) {
      console.log('[ARCFORM] Request form validation failed');
      return;
    }

    // Collect all fields — names must match exactly what admin.js expects
    const designSel = document.getElementById('selectedDesign');
    const designVal = designSel ? designSel.value.trim() : '';

    const entry = {
      id:             uid('req'),
      fullName:       fval('fullName'),                 // admin: r.fullName
      email:          fval('email'),                    // admin: r.email
      phone:          fval('phone'),                    // admin: r.phone
      projectType:    selectedText('projectType'),      // admin: r.projectType  (display text)
      selectedDesign: designVal,                        // admin: r.selectedDesign
      budget:         selectedText('budget'),           // admin: r.budget       (display text)
      timeline:       selectedText('timeline'),         // admin: r.timeline
      requirements:   fval('requirements'),             // admin: r.requirements
      status:         'new',                            // admin filters by this
      date:           new Date().toISOString(),         // admin: r.date
    };

    Storage.push(STORAGE_KEYS.requests, entry);
    console.log('[ARCFORM] ✅ Request saved:', entry);

    // Show loading state, then success
    const btn     = document.getElementById('submitBtn');
    const textEl  = document.getElementById('submitText');
    const spinner = document.getElementById('submitSpinner');
    if (btn)     btn.disabled = true;
    if (textEl)  textEl.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');

    setTimeout(() => {
      form.classList.add('hidden');
      if (succ) succ.classList.remove('hidden');
      if (btn)     btn.disabled = false;
      if (textEl)  textEl.classList.remove('hidden');
      if (spinner) spinner.classList.add('hidden');
    }, 1200);
  });
}

/** Global: called by inline onclick="resetForm()" */
window.resetForm = function () {
  const form = document.getElementById('requestForm');
  const succ = document.getElementById('formSuccess');
  if (!form || !succ) return;
  form.reset();
  form.classList.remove('hidden');
  succ.classList.add('hidden');
  clearFormErrors('request');
};

/* ═══════════════════════════════════════════════════════════
   15. CONTACT / FEEDBACK FORM
   ─────────────────────────────────────────────────────────
   Schema saved to 'arcform_messages':
   { id, name, email, message, status:'unread', date }
   admin.js reads ALL these exact field names.
   ═══════════════════════════════════════════════════════════ */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const succ = document.getElementById('contactSuccess');
  if (!form) { console.warn('[ARCFORM] #contactForm not found'); return; }

  form.addEventListener('submit', e => {
    e.preventDefault();
    console.log('[ARCFORM] Contact form submit triggered');

    if (!validateForm('contact')) {
      console.log('[ARCFORM] Contact form validation failed');
      return;
    }

    const entry = {
      id:      uid('msg'),
      name:    fval('cName'),     // admin: m.name
      email:   fval('cEmail'),    // admin: m.email
      message: fval('cMessage'),  // admin: m.message
      status:  'unread',          // admin filters by this
      date:    new Date().toISOString(),
    };

    Storage.push(STORAGE_KEYS.messages, entry);
    console.log('[ARCFORM] ✅ Message saved:', entry);

    setTimeout(() => {
      form.classList.add('hidden');
      if (succ) succ.classList.remove('hidden');
    }, 800);
  });
}

/* ═══════════════════════════════════════════════════════════
   16. SCROLL REVEAL ANIMATIONS
   ═══════════════════════════════════════════════════════════ */
function revealOnScroll() {
  document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 60) {
      el.classList.add('visible');
    }
  });
}

function initFadeIns() {
  document.querySelectorAll([
    '.about-grid', '.about-images', '.about-content',
    '.process-step', '.contact-card', '.contact-form-wrap',
    '.request-info', '.request-form-wrap', '.section-header',
  ].join(',')).forEach(el => el.classList.add('fade-in'));
  revealOnScroll();
}

/* ═══════════════════════════════════════════════════════════
   17. BOOT — wrapped in DOMContentLoaded
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[ARCFORM] 🚀 Initialising v3.0…');

  // Load data
  designs      = loadDesigns();
  savedDesigns = Storage.get(STORAGE_KEYS.saved, []);
  if (!Array.isArray(savedDesigns)) savedDesigns = [];

  // Init all modules
  initTheme();
  initNavigation();
  initGallery();
  initModal();
  populateDesignSelect();
  initRequestForm();
  initContactForm();
  initFadeIns();

  console.log('[ARCFORM] ✅ Ready | Designs:', designs.length);
});