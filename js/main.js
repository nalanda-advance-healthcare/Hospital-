/**
 * NALANDA ADVANCE HEALTHCARE HOSPITAL - SHARED CLIENT CONTROLLER
 * Modern, Minimalist Healthcare Client Controller
 * Multi-Theme Engine & Dynamic Hospital Logo Synchronizer
 */

// --------------------------------------------------------------------------
// 1. CURATED CLINICAL THEME PALETTES
// --------------------------------------------------------------------------
window.HOSPITAL_THEMES = {
  'navy-teal': {
    id: 'navy-teal',
    name: 'Clinical Navy & Healthcare Teal',
    badge: 'Default Clinical',
    description: 'Deep medical navy paired with calming clinical teal for comprehensive multi-specialty care.',
    primary: '#12304A',
    primaryHover: '#0c2133',
    secondary: '#168C8C',
    secondaryHover: '#127272',
    secondaryLight: '#e6f4f4',
    accentSoft: '#EAF3FA'
  },
  'ocean-sapphire': {
    id: 'ocean-sapphire',
    name: 'Ocean Sapphire & Sky Blue',
    badge: 'Modern Surgical',
    description: 'Crisp sapphire blue with vibrant sky cyan, ideal for advanced laparoscopic & surgery centers.',
    primary: '#0A3663',
    primaryHover: '#072647',
    secondary: '#0284C7',
    secondaryHover: '#0369A1',
    secondaryLight: '#E0F2FE',
    accentSoft: '#F0F9FF'
  },
  'emerald-wellness': {
    id: 'emerald-wellness',
    name: 'Emerald Healing & Mint Wellness',
    badge: 'Wellness & Holistic',
    description: 'Restorative deep botanical emerald with fresh herbal mint for healing, therapy & pediatric care.',
    primary: '#064E3B',
    primaryHover: '#022C22',
    secondary: '#059669',
    secondaryHover: '#047857',
    secondaryLight: '#D1FAE5',
    accentSoft: '#ECFDF5'
  },
  'royal-amethyst': {
    id: 'royal-amethyst',
    name: 'Royal Amethyst & Modern Violet',
    badge: 'Premium Specialty',
    description: 'Prestigious amethyst violet for specialized maternity, gynecology & luxury healthcare suites.',
    primary: '#2E1065',
    primaryHover: '#1E0A45',
    secondary: '#7C3AED',
    secondaryHover: '#6D28D9',
    secondaryLight: '#EDE9FE',
    accentSoft: '#F5F3FF'
  },
  'cardiac-crimson': {
    id: 'cardiac-crimson',
    name: 'Trauma Crimson & Cardiac Rose',
    badge: 'Emergency & Trauma',
    description: 'High-contrast emergency bordeaux and energetic cardiac rose for trauma & 24/7 critical care.',
    primary: '#4C0519',
    primaryHover: '#330210',
    secondary: '#E11D48',
    secondaryHover: '#BE123C',
    secondaryLight: '#FFE4E6',
    accentSoft: '#FFF1F2'
  },
  'slate-minimal': {
    id: 'slate-minimal',
    name: 'Executive Slate & Charcoal Platinum',
    badge: 'Executive Hi-Tech',
    primary: '#1E293B',
    primaryHover: '#0F172A',
    secondary: '#475569',
    secondaryHover: '#334155',
    secondaryLight: '#F1F5F9',
    accentSoft: '#F8FAFC',
    description: 'Understated executive charcoal with platinum gray for modern digital hospital workstations.'
  }
};

// Immediate pre-hydration theme application to eliminate screen flash
(function preHydrateTheme() {
  try {
    const raw = localStorage.getItem('nah_hospital_db_v4');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.settings) {
        const themeKey = data.settings.theme || 'navy-teal';
        const t = window.HOSPITAL_THEMES[themeKey] || window.HOSPITAL_THEMES['navy-teal'];
        if (t) {
          const root = document.documentElement;
          root.style.setProperty('--primary', t.primary);
          root.style.setProperty('--primary-hover', t.primaryHover);
          root.style.setProperty('--secondary', t.secondary);
          root.style.setProperty('--secondary-hover', t.secondaryHover);
          root.style.setProperty('--secondary-light', t.secondaryLight);
          root.style.setProperty('--accent-soft', t.accentSoft);
        }
      }
    }
  } catch (e) {}
})();

// --------------------------------------------------------------------------
// 2. THEME & LOGO RUNTIME DISPATCHERS
// --------------------------------------------------------------------------
window.applyHospitalTheme = function(themeKey) {
  const t = window.HOSPITAL_THEMES[themeKey] || window.HOSPITAL_THEMES['navy-teal'];
  if (!t) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', t.primary);
  root.style.setProperty('--primary-hover', t.primaryHover);
  root.style.setProperty('--secondary', t.secondary);
  root.style.setProperty('--secondary-hover', t.secondaryHover);
  root.style.setProperty('--secondary-light', t.secondaryLight);
  root.style.setProperty('--accent-soft', t.accentSoft);
  document.body.setAttribute('data-theme', t.id);
};

window.applyHospitalLogo = function(logoUrl) {
  const valid = logoUrl && typeof logoUrl === 'string' && logoUrl.trim().length > 0;
  const emblems = document.querySelectorAll('.brand-emblem, [data-hospital-logo], .hospital-logo-container, .print-logo-circle');

  emblems.forEach(emblem => {
    if (valid) {
      emblem.classList.add('has-custom-logo');
      emblem.innerHTML = `<img src="${window.escapeHtml(logoUrl.trim())}" alt="Hospital Logo" class="dynamic-hospital-logo" style="width:100%; height:100%; object-fit:contain; border-radius:inherit; display:block;">`;
    } else {
      emblem.classList.remove('has-custom-logo');
      emblem.innerHTML = `
        <svg viewBox="0 0 24 24" class="icon" style="width:22px; height:22px; stroke:var(--secondary); stroke-width:2.2; fill:none;">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      `;
    }
  });

  document.querySelectorAll('img.hospital-logo-target').forEach(img => {
    if (valid) {
      img.src = logoUrl.trim();
      img.style.display = '';
    } else {
      img.style.display = 'none';
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  bindRealtimeHeaderSettings();
});

// --------------------------------------------------------------------------
// 3. SCROLL REVEAL OBSERVER
// --------------------------------------------------------------------------
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal-item');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

// --------------------------------------------------------------------------
// 4. DYNAMIC HOSPITAL SETTINGS BINDING
// --------------------------------------------------------------------------
function bindRealtimeHeaderSettings() {
  if (!window.HospitalStore) return;

  const updateUI = (data) => {
    const s = (data && data.settings) || {};

    // Dynamic Theme & Logo
    if (s.theme) window.applyHospitalTheme(s.theme);
    window.applyHospitalLogo(s.logoUrl || '');

    // Text bindings
    document.querySelectorAll('[data-bind="settings.hospitalName"]').forEach(el => el.textContent = s.hospitalName);
    document.querySelectorAll('[data-bind="settings.tagline"]').forEach(el => el.textContent = s.tagline);
    document.querySelectorAll('[data-bind="settings.emergencyPhone"]').forEach(el => {
      el.textContent = s.emergencyPhone;
      if (el.tagName === 'A') el.href = `tel:${(s.emergencyPhone || '').replace(/\s+/g, '')}`;
    });
    document.querySelectorAll('[data-bind="settings.email"]').forEach(el => {
      if (s.email) {
        el.textContent = s.email;
        if (el.tagName === 'A') el.href = `mailto:${s.email}`;
      }
    });
    document.querySelectorAll('[data-bind="settings.address"]').forEach(el => el.textContent = s.address);
    document.querySelectorAll('[data-bind="settings.announcement"]').forEach(el => el.textContent = s.announcement);
    document.querySelectorAll('[data-bind="settings.heroTitle"]').forEach(el => el.textContent = s.heroTitle);
    document.querySelectorAll('[data-bind="settings.heroSub"]').forEach(el => el.textContent = s.heroSub);
  };

  updateUI(HospitalStore.getData());
  HospitalStore.subscribe(updateUI);
}

// --------------------------------------------------------------------------
// 5. TOAST NOTIFICATIONS (WITH CLEAN SVG ICONS, NO EMOJIS)
// --------------------------------------------------------------------------
window.showToast = function(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container no-print';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'danger' ? 'toast-danger' : (type === 'success' ? 'toast-success' : (type === 'info' ? 'toast-info' : ''))}`;

  const iconSvg = type === 'danger'
    ? `<svg class="icon icon-md" style="color:var(--emergency);" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : (type === 'info' 
       ? `<svg class="icon icon-md" style="color:var(--secondary);" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
       : `<svg class="icon icon-md" style="color:var(--success);" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`);

  toast.innerHTML = `
    ${iconSvg}
    <div>${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(16px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
};

// --------------------------------------------------------------------------
// 6. GLOBAL REUSABLE MODAL (CLEAN CLINICAL CARD, NO EMOJIS)
// --------------------------------------------------------------------------
window.openModal = function(title, contentHTML) {
  let modal = document.getElementById('globalModalOverlay');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'globalModalOverlay';
    modal.className = 'modal-overlay no-print';
    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="globalModalTitle">Modal Title</h3>
          <button class="modal-close-btn" onclick="closeModal()" aria-label="Close modal">
            <svg class="icon" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body" id="globalModalContent"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  document.getElementById('globalModalTitle').textContent = title;
  document.getElementById('globalModalContent').innerHTML = contentHTML;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
};

window.closeModal = function() {
  const modal = document.getElementById('globalModalOverlay');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.toggleMobileNavMenu = function() {
  const drawer = document.getElementById('mobileNavDrawer');
  if (drawer) drawer.classList.toggle('active');
};

// Global XSS Sanitizer
window.escapeHtml = function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
