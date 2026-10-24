/**
 * NALANDA ADVANCE HEALTHCARE HOSPITAL - SHARED CLIENT CONTROLLER
 * Modern, Minimalist Healthcare Client Controller
 * Note: Doctor and Admin access links are strictly excluded from patient view.
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  bindRealtimeHeaderSettings();
});

// --------------------------------------------------------------------------
// 1. SCROLL REVEAL OBSERVER
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
// 2. DYNAMIC HOSPITAL SETTINGS BINDING
// --------------------------------------------------------------------------
function bindRealtimeHeaderSettings() {
  if (!window.HospitalStore) return;

  const updateUI = (data) => {
    const s = data.settings || {};
    document.querySelectorAll('[data-bind="settings.hospitalName"]').forEach(el => el.textContent = s.hospitalName);
    document.querySelectorAll('[data-bind="settings.emergencyPhone"]').forEach(el => {
      el.textContent = s.emergencyPhone;
      if (el.tagName === 'A') el.href = `tel:${s.emergencyPhone.replace(/\s+/g, '')}`;
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
// 3. TOAST NOTIFICATIONS (WITH CLEAN SVG ICONS, NO EMOJIS)
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
  toast.className = `toast ${type === 'danger' ? 'toast-danger' : (type === 'success' ? 'toast-success' : '')}`;

  const iconSvg = type === 'danger'
    ? `<svg class="icon icon-md" style="color:var(--emergency);" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
    : `<svg class="icon icon-md" style="color:var(--success);" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

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
// 4. GLOBAL REUSABLE MODAL (CLEAN CLINICAL CARD, NO EMOJIS)
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
