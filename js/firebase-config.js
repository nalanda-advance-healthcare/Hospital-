/**
 * NALANDA ADVANCE HEALTHCARE HOSPITAL - MULTI-ROLE FIREBASE ENGINE
 * 1. Admin/Reception: Default mohitk43131@gmail.com (Pass: moh45678) with RTDB verification
 * 2. Doctor: Account created by Admin with initial password; Doctor can change password later
 * 3. Patient: Account Sign-Up/Login or Freedom to use Guest Mode with Anti-Spam Protection
 */

const firebaseConfig = {
  apiKey: "AIzaSyDS_UoCbhInysD30Gaj1nKn5UYDusie0sg",
  authDomain: "hospital-e52f2.firebaseapp.com",
  projectId: "hospital-e52f2",
  storageBucket: "hospital-e52f2.firebasestorage.app",
  messagingSenderId: "320454178613",
  appId: "1:320454178613:web:1737433d61508fe1c03e7c",
  measurementId: "G-TDNBMXPMJ3",
  databaseURL: "https://hospital-e52f2-default-rtdb.firebaseio.com"
};

let fbApp = null;
let fbAuth = null;
let fbDatabase = null;
let fbGoogleProvider = null;
let isFirebaseReady = false;

const PRIMARY_ADMIN_EMAIL = "mohitk43131@gmail.com";
const PRIMARY_ADMIN_PASS = "moh45678";

try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      fbApp = firebase.initializeApp(firebaseConfig);
    } else {
      fbApp = firebase.app();
    }
    fbAuth = firebase.auth();
    fbDatabase = firebase.database();
    fbGoogleProvider = new firebase.auth.GoogleAuthProvider();
    isFirebaseReady = true;

    // Seed default admin in Realtime Database on start
    ensurePrimaryAdminInRTDB();
  }
} catch (err) {
  console.warn("Firebase Init Notice:", err);
}

function emailToKey(email) {
  return (email || '').toLowerCase().replace(/[@.]/g, '_');
}

function ensurePrimaryAdminInRTDB() {
  if (fbDatabase) {
    const key = emailToKey(PRIMARY_ADMIN_EMAIL);
    const adminRef = fbDatabase.ref(`admins/${key}`);
    adminRef.once('value').then(snap => {
      if (!snap.exists()) {
        adminRef.set({
          email: PRIMARY_ADMIN_EMAIL,
          role: "Super Admin",
          addedAt: new Date().toISOString()
        });
      }
    }).catch(e => console.warn(e));
  }
}

// Global Auth & Multi-Role Engine
window.HospitalAuth = {
  isReady: () => isFirebaseReady && !!fbAuth,
  getPrimaryAdminEmail: () => PRIMARY_ADMIN_EMAIL,

  // --------------------------------------------------------------------------
  // 1. ADMIN AUTHENTICATION & MANAGEMENT
  // --------------------------------------------------------------------------
  isAuthorizedAdminEmail: async (email) => {
    const normalized = (email || '').toLowerCase().trim();
    if (normalized === PRIMARY_ADMIN_EMAIL.toLowerCase()) return true;

    const cachedAdmins = JSON.parse(localStorage.getItem('nah_authorized_admins') || '[]');
    if (cachedAdmins.includes(normalized)) return true;

    if (fbDatabase) {
      try {
        const key = emailToKey(normalized);
        const snap = await fbDatabase.ref(`admins/${key}`).once('value');
        if (snap.exists()) {
          cachedAdmins.push(normalized);
          localStorage.setItem('nah_authorized_admins', JSON.stringify(cachedAdmins));
          return true;
        }
      } catch (e) {}
    }
    return false;
  },

  getAuthorizedAdmins: async () => {
    let list = [PRIMARY_ADMIN_EMAIL];
    if (fbDatabase) {
      try {
        const snap = await fbDatabase.ref('admins').once('value');
        const val = snap.val();
        if (val) {
          Object.values(val).forEach(item => {
            if (item && item.email && !list.includes(item.email)) list.push(item.email);
          });
        }
      } catch (e) {}
    }
    const local = JSON.parse(localStorage.getItem('nah_authorized_admins') || '[]');
    local.forEach(em => { if (!list.includes(em)) list.push(em); });
    return list;
  },

  addAdminEmail: async (email) => {
    email = (email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) return { success: false, error: "Invalid email" };

    const local = JSON.parse(localStorage.getItem('nah_authorized_admins') || '[]');
    if (!local.includes(email)) {
      local.push(email);
      localStorage.setItem('nah_authorized_admins', JSON.stringify(local));
    }

    if (fbDatabase) {
      try {
        const key = emailToKey(email);
        await fbDatabase.ref(`admins/${key}`).set({
          email,
          role: "Administrator / Reception",
          addedAt: new Date().toISOString()
        });
      } catch (e) {}
    }
    return { success: true, email };
  },

  loginAdminWithEmail: async (email, password) => {
    const norm = (email || '').toLowerCase().trim();
    if (norm === PRIMARY_ADMIN_EMAIL.toLowerCase() && password === PRIMARY_ADMIN_PASS) {
      const user = { email: PRIMARY_ADMIN_EMAIL, role: "Super Admin", displayName: "Mohit (Super Admin)" };
      localStorage.setItem('nah_active_admin', JSON.stringify(user));
      return { success: true, user };
    }

    const isAuth = await window.HospitalAuth.isAuthorizedAdminEmail(norm);
    if (!isAuth) {
      return { success: false, error: "Access Denied: Email is not authorized as an administrator." };
    }

    const user = { email: norm, role: "Administrator / Reception", displayName: norm.split('@')[0] };
    localStorage.setItem('nah_active_admin', JSON.stringify(user));
    return { success: true, user };
  },

  getCurrentAdmin: () => {
    const raw = localStorage.getItem('nah_active_admin');
    return raw ? JSON.parse(raw) : null;
  },

  logoutAdmin: async () => {
    localStorage.removeItem('nah_active_admin');
    return { success: true };
  },

  // --------------------------------------------------------------------------
  // 2. DOCTOR AUTHENTICATION & PASSWORD CHANGE
  // --------------------------------------------------------------------------
  loginDoctor: async (email, password) => {
    const normEmail = (email || '').toLowerCase().trim();
    const doctors = window.HospitalStore ? HospitalStore.getDoctors() : [];
    
    const doc = doctors.find(d => (d.email && d.email.toLowerCase().trim() === normEmail) || (d.id === email));

    if (!doc) {
      return { success: false, error: "No doctor account found with this email. Please ask Admin/Reception to create your account." };
    }

    const savedPass = doc.password || "doctor123";
    if (password !== savedPass) {
      return { success: false, error: "Incorrect doctor password. Please verify or ask Admin." };
    }

    const docSession = {
      id: doc.id,
      name: doc.name,
      email: doc.email || normEmail,
      dept: doc.dept,
      photo: doc.photo
    };
    localStorage.setItem('nah_active_doctor', JSON.stringify(docSession));
    return { success: true, doctor: docSession };
  },

  changeDoctorPassword: async (doctorId, arg2, arg3) => {
    let newPassword = arg3 ? arg3 : arg2;
    let oldPassword = arg3 ? arg2 : null;

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." };
    }

    const doc = HospitalStore.getDoctorById(doctorId);
    if (!doc) return { success: false, error: "Doctor profile not found." };

    if (oldPassword && doc.password && oldPassword !== doc.password) {
      return { success: false, error: "Current password does not match." };
    }

    HospitalStore.updateDoctor(doctorId, { password: newPassword });
    // Update active doctor session
    const active = HospitalAuth.getCurrentDoctor();
    if (active && active.id === doctorId) {
      active.password = newPassword;
      localStorage.setItem('nah_active_doctor', JSON.stringify(active));
    }
    return { success: true };
  },

  getCurrentDoctor: () => {
    const raw = localStorage.getItem('nah_active_doctor');
    return raw ? JSON.parse(raw) : null;
  },

  logoutDoctor: async () => {
    localStorage.removeItem('nah_active_doctor');
    return { success: true };
  },

  // --------------------------------------------------------------------------
  // 3. PATIENT AUTHENTICATION & GUEST FREEDOM
  // --------------------------------------------------------------------------
  registerPatient: async (arg1, arg2, arg3, arg4) => {
    let name, email, phone, password;
    if (typeof arg1 === 'object') {
      name = arg1.name;
      email = arg1.email || (arg1.mobile ? `${arg1.mobile}@patient.local` : '');
      phone = arg1.mobile || arg1.phone;
      password = arg1.password;
    } else {
      name = arg1;
      email = arg2;
      phone = arg3;
      password = arg4;
    }

    const normEmail = (email || '').toLowerCase().trim();
    if (!name || !phone || !password) {
      return { success: false, error: "Please fill in all registration fields (Name, Mobile, Password)." };
    }

    const patient = {
      uid: 'pat-' + Date.now(),
      name,
      email: normEmail || `${phone}@patient.local`,
      phone,
      mobile: phone,
      password,
      registeredAt: new Date().toISOString()
    };

    localStorage.setItem('nah_active_patient', JSON.stringify(patient));
    return { success: true, patient };
  },

  loginPatient: async (emailOrPhone, password) => {
    const val = (emailOrPhone || '').trim().toLowerCase();
    
    // Check locally saved patient
    const saved = localStorage.getItem('nah_active_patient');
    if (saved) {
      const p = JSON.parse(saved);
      if (((p.email && p.email.toLowerCase() === val) || (p.phone && p.phone === val) || (p.mobile && p.mobile === val)) && p.password === password) {
        return { success: true, patient: p };
      }
    }

    // Fast login / registration for testing & convenience
    if (password && password.length >= 4) {
      const p = {
        uid: 'pat-' + Date.now(),
        name: val.split('@')[0],
        email: val.includes('@') ? val : `${val}@patient.local`,
        phone: !val.includes('@') ? val : '',
        mobile: !val.includes('@') ? val : ''
      };
      localStorage.setItem('nah_active_patient', JSON.stringify(p));
      return { success: true, patient: p };
    }

    return { success: false, error: "Invalid patient credentials." };
  },

  setGuestPatient: (name, phone) => {
    const guest = {
      isGuest: true,
      name: name || "Guest Patient",
      phone: phone || "",
      mobile: phone || ""
    };
    sessionStorage.setItem('nah_guest_session', JSON.stringify(guest));
    return guest;
  },

  getCurrentPatient: () => {
    const p = localStorage.getItem('nah_active_patient');
    if (p) return JSON.parse(p);
    const g = sessionStorage.getItem('nah_guest_session');
    if (g) return JSON.parse(g);
    return null;
  },

  logoutPatient: () => {
    localStorage.removeItem('nah_active_patient');
    sessionStorage.removeItem('nah_guest_session');
    return { success: true };
  },

  // --------------------------------------------------------------------------
  // 4. SPAM GUEST PROTECTION ENGINE
  // --------------------------------------------------------------------------
  validateGuestSubmission: (formData) => {
    formData = formData || {};
    // 1. Honeypot check (anti-bot hidden trap field)
    const trap = formData.hp_trap || formData.hpTrap;
    if (trap && trap.trim() !== '') {
      return { valid: false, error: "Bot detected via security trap." };
    }

    // 2. Strict Indian 10-digit mobile check
    const cleanMobile = (formData.mobile || formData.phone || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return { valid: false, error: "Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)." };
    }

    // 3. Optional Math verification challenge check if provided
    if (formData.mathExpected !== undefined && formData.mathAnswer !== undefined) {
      const userAnswer = parseInt(formData.mathAnswer);
      const expected = parseInt(formData.mathExpected);
      if (isNaN(userAnswer) || userAnswer !== expected) {
        return { valid: false, error: "Security verification answer is incorrect. Please solve the math check." };
      }
    }

    // 4. Rate-limiting check (max 3 guest bookings per 5 minutes per browser session)
    const now = Date.now();
    const guestSubmissions = JSON.parse(sessionStorage.getItem('nah_guest_attempts') || '[]');
    const recent = guestSubmissions.filter(ts => (now - ts) < 5 * 60 * 1000);

    if (recent.length >= 3) {
      return {
        valid: false,
        error: "Rate limit reached: Maximum 3 guest appointments allowed per 5 minutes to protect reception staff from spam. Please call hospital reception directly or login to your patient account."
      };
    }

    recent.push(now);
    sessionStorage.setItem('nah_guest_attempts', JSON.stringify(recent));
    return { valid: true };
  }
};
