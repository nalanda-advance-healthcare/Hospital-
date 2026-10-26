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

    // Insurance & Mediclaim bindings
    document.querySelectorAll('[data-bind="settings.tpaTitle"]').forEach(el => {
      el.textContent = s.tpaTitle || 'Insurance & Mediclaim Assistance';
    });
    document.querySelectorAll('[data-bind="settings.tpaSubtitle"]').forEach(el => {
      el.textContent = s.tpaSubtitle || 'Hassle-free documentation and claim support for leading health insurance providers.';
    });

    const tpaContainer = document.getElementById('dynamicTpaGrid');
    if (tpaContainer) {
      const rawPartners = s.tpaPartners !== undefined ? s.tpaPartners : 'Star Health, Care Health, HDFC ERGO, ICICI Lombard, Niva Bupa';
      const partners = rawPartners
        .split(/[,;\n]/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      if (partners.length > 0) {
        tpaContainer.innerHTML = partners.map(partner => `
          <div style="background:#fff; border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:18px 14px; text-align:center; font-weight:700; color:var(--primary); font-size:0.875rem; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:var(--shadow-xs);">
            <svg class="icon icon-sm" style="color:var(--secondary);" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <span>${window.escapeHtml(partner)}</span>
          </div>
        `).join('');
      } else {
        tpaContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align:center; padding:20px; color:var(--text-secondary); font-size:0.875rem;">
            Please contact our TPA and billing desk for current insurance empanelment details.
          </div>
        `;
      }
    }

    // Footer Copyright & Location bindings
    document.querySelectorAll('[data-bind="settings.footerCopyright"]').forEach(el => {
      el.textContent = s.footerCopyright || '© 2026 Nalanda Advance Healthcare Hospital Pvt Ltd. All rights reserved.';
    });
    document.querySelectorAll('[data-bind="settings.footerAddress"]').forEach(el => {
      el.textContent = s.footerAddress || 'Police Line, Near Flyover, Bihar Sharif, Nalanda, Bihar';
    });
    document.querySelectorAll('[data-bind="settings.contactTitle"]').forEach(el => {
      el.textContent = s.contactTitle || 'Get in Touch';
    });

    if (s.mapsUrl) {
      document.querySelectorAll('a[data-bind="settings.mapsUrl"]').forEach(el => el.href = s.mapsUrl);
    }
    if (s.mapsEmbedUrl) {
      document.querySelectorAll('iframe[data-bind="settings.mapsEmbedUrl"]').forEach(el => {
        if (el.src !== s.mapsEmbedUrl) el.src = s.mapsEmbedUrl;
      });
    }

    // Update patient auth nav state
    window.updateGlobalPatientNavState();
  };

  updateUI(HospitalStore.getData());
  HospitalStore.subscribe(updateUI);
}

// Global Patient Nav State Synchronizer
window.updateGlobalPatientNavState = function() {
  if (!window.HospitalAuth) return;
  const patient = HospitalAuth.getCurrentPatient();
  const topBtns = document.querySelectorAll('#patientTopAuthBtn, .patient-top-auth-btn');
  const navBtns = document.querySelectorAll('#patientNavAuthBtn, .patient-nav-auth-btn');
  const footerBtns = document.querySelectorAll('#patientFooterAuthBtn, .patient-footer-auth-btn');

  if (patient && !patient.isGuest) {
    const displayName = patient.name ? patient.name.split(' ')[0] : 'Patient';
    topBtns.forEach(btn => {
      btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> View Profile (${window.escapeHtml(displayName)})`;
      btn.setAttribute('title', 'View Profile: ' + patient.name);
    });
    navBtns.forEach(btn => {
      btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <span class="desktop-only-text">View Profile</span>`;
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      btn.setAttribute('title', 'View Profile: ' + patient.name);
    });
    footerBtns.forEach(btn => {
      btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> View Profile (${window.escapeHtml(displayName)})`;
    });
  } else {
    topBtns.forEach(btn => {
      btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Patient Portal`;
      btn.removeAttribute('title');
    });
    navBtns.forEach(btn => {
      btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> <span class="desktop-only-text">Patient Sign In</span>`;
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
      btn.removeAttribute('title');
    });
    footerBtns.forEach(btn => {
      btn.innerHTML = `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Patient Sign In / Register`;
    });
  }
};

window.addEventListener('storage', (e) => {
  if (e.key === 'nah_active_patient' || e.key === 'nah_guest_session') {
    window.updateGlobalPatientNavState();
  }
});

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
