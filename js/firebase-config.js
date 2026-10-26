/**
 * NALANDA ADVANCE HEALTHCARE HOSPITAL - MULTI-ROLE FIREBASE ENGINE
 * 1. Admin/Reception: Secured via Firebase Authentication and Realtime Database authorization
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

    // Seed default admin authorization in Realtime Database
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
  // 1. ADMIN AUTHENTICATION & MANAGEMENT (FIREBASE AUTH + RTDB)
  // --------------------------------------------------------------------------
  isAuthorizedAdminEmail: async (email) => {
    const normalized = (email || '').toLowerCase().trim();
    if (!normalized || !normalized.includes('@')) return false;
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

  addAdminUser: async ({ email, password, role }) => {
    email = (email || '').toLowerCase().trim();
    password = (password || '').trim();
    role = role || "Administrator / Reception";

    if (!email || !email.includes('@')) return { success: false, error: "Please enter a valid administrator email address." };
    if (!password || password.length < 6) return { success: false, error: "Password must be at least 6 characters long." };

    let authUser = null;
    if (fbAuth) {
      try {
        const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
        authUser = cred.user;
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.warn("User already exists in Firebase Auth; ensuring RTDB authorization.");
        } else {
          return { success: false, error: authErr.message || "Failed to create Firebase Authentication account." };
        }
      }
    }

    const key = emailToKey(email);
    const local = JSON.parse(localStorage.getItem('nah_authorized_admins') || '[]');
    if (!local.includes(email)) {
      local.push(email);
      localStorage.setItem('nah_authorized_admins', JSON.stringify(local));
    }

    if (fbDatabase) {
      try {
        await fbDatabase.ref(`admins/${key}`).set({
          email,
          role,
          uid: authUser ? authUser.uid : null,
          addedAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("RTDB admin authorization notice:", e);
      }
    }
    return { success: true, email };
  },

  addAdminEmail: async (email, password, role) => {
    return window.HospitalAuth.addAdminUser({ email, password: password || "admin123", role });
  },

  removeAdminEmail: async (email) => {
    email = (email || '').toLowerCase().trim();
    if (!email || email === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, error: "Primary administrator access cannot be removed." };
    }

    let local = JSON.parse(localStorage.getItem('nah_authorized_admins') || '[]');
    local = local.filter(e => e !== email);
    localStorage.setItem('nah_authorized_admins', JSON.stringify(local));

    if (fbDatabase) {
      try {
        const key = emailToKey(email);
        await fbDatabase.ref(`admins/${key}`).remove();
      } catch (e) {}
    }
    return { success: true };
  },

  loginAdminWithEmail: async (email, password) => {
    const norm = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!norm || !cleanPass) {
      return { success: false, error: "Please enter your administrator email and password." };
    }

    // 1. Verify authorization in Realtime Database / Authorized list
    const isAuth = await window.HospitalAuth.isAuthorizedAdminEmail(norm);
    if (!isAuth) {
      return { success: false, error: "Access Denied: This email is not authorized as a hospital administrator." };
    }

    // 2. Authenticate securely with Firebase Authentication
    let authUser = null;
    if (fbAuth) {
      try {
        const cred = await fbAuth.signInWithEmailAndPassword(norm, cleanPass);
        authUser = cred.user;
      } catch (err) {
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          return { success: false, error: "Incorrect administrator password. Please check your credentials." };
        } else if (err.code === 'auth/user-not-found') {
          // If authorized admin was added to RTDB, initialize their Firebase Auth credential with this password
          try {
            const newCred = await fbAuth.createUserWithEmailAndPassword(norm, cleanPass);
            authUser = newCred.user;
          } catch (initErr) {
            return { success: false, error: "Administrator account setup required: " + (initErr.message || "Failed to initialize credentials.") };
          }
        } else if (err.code === 'auth/too-many-requests') {
          return { success: false, error: "Access temporarily blocked due to multiple failed login attempts. Please try again later." };
        } else {
          return { success: false, error: err.message || "Authentication service failed." };
        }
      }
    }

    const user = {
      uid: authUser ? authUser.uid : ('admin-' + Date.now()),
      email: norm,
      role: (norm === PRIMARY_ADMIN_EMAIL.toLowerCase()) ? "Super Admin" : "Administrator",
      displayName: (authUser && authUser.displayName) ? authUser.displayName : norm.split('@')[0],
      loggedInAt: new Date().toISOString()
    };

    localStorage.setItem('nah_active_admin', JSON.stringify(user));
    return { success: true, user };
  },

  loginAdminWithGoogle: async () => {
    if (!fbAuth || !fbGoogleProvider) {
      return { success: false, error: "Firebase Authentication with Google is unavailable." };
    }
    try {
      const result = await fbAuth.signInWithPopup(fbGoogleProvider);
      const user = result.user;
      const email = (user && user.email) ? user.email.toLowerCase().trim() : '';
      if (!email) {
        return { success: false, error: "Unable to retrieve email from Google Account." };
      }

      const isAuth = await window.HospitalAuth.isAuthorizedAdminEmail(email);
      if (!isAuth) {
        await fbAuth.signOut().catch(() => {});
        return { success: false, error: "Access Denied: Google account (" + email + ") is not authorized as an administrator." };
      }

      const adminSession = {
        uid: user.uid,
        email,
        role: (email === PRIMARY_ADMIN_EMAIL.toLowerCase()) ? "Super Admin" : "Administrator",
        displayName: user.displayName || email.split('@')[0],
        photoURL: user.photoURL || null,
        loggedInAt: new Date().toISOString()
      };
      localStorage.setItem('nah_active_admin', JSON.stringify(adminSession));
      return { success: true, user: adminSession };
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return { success: false, error: "Google sign-in was cancelled." };
      }
      return { success: false, error: err.message || "Google sign-in failed." };
    }
  },

  getCurrentAdmin: () => {
    const raw = localStorage.getItem('nah_active_admin');
    return raw ? JSON.parse(raw) : null;
  },

  logoutAdmin: async () => {
    if (fbAuth) {
      await fbAuth.signOut().catch(() => {});
    }
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
  // 3. PATIENT AUTHENTICATION & MULTI-STORAGE (FIREBASE AUTH + RTDB)
  // --------------------------------------------------------------------------
  registerPatient: async (payload) => {
    let name = (payload.name || '').trim();
    let phone = (payload.phone || payload.mobile || '').replace(/\D/g, '');
    let email = (payload.email || '').trim().toLowerCase();
    let password = (payload.password || '').trim();

    if (!name) return { success: false, error: "Please enter your full name." };
    if (!phone || phone.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }
    if (!password || password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    let authUser = null;

    // CASE B: User provided BOTH email and phone number -> Use Firebase Authentication + RTDB
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { success: false, error: "Please enter a valid email address." };
      }

      if (fbAuth) {
        try {
          const cred = await fbAuth.createUserWithEmailAndPassword(email, password);
          authUser = cred.user;
          if (authUser && name) {
            await authUser.updateProfile({ displayName: name }).catch(() => {});
          }
        } catch (authErr) {
          if (authErr.code === 'auth/email-already-in-use') {
            try {
              const signCred = await fbAuth.signInWithEmailAndPassword(email, password);
              authUser = signCred.user;
            } catch (signErr) {
              return { success: false, error: "This email is already registered with a different password. Please sign in or use Forgot Password." };
            }
          } else if (authErr.code === 'auth/weak-password') {
            return { success: false, error: "Password is too weak. Please use at least 6 characters." };
          } else {
            console.warn("Firebase Auth Create Notice:", authErr.message);
          }
        }
      }
    }

    // CASE A (Phone only) & CASE B (Both Email and Phone): Save details in RTDB and LocalStorage
    const patient = {
      uid: authUser ? authUser.uid : ('pat-' + Date.now()),
      name,
      phone,
      mobile: phone,
      email: email || '',
      password, // Retained for phone/RTDB lookups
      authMethod: email ? 'firebase_auth_and_rtdb' : 'rtdb_phone_only',
      registeredAt: new Date().toISOString()
    };

    // Save in LocalStorage
    localStorage.setItem('nah_active_patient', JSON.stringify(patient));
    const registry = JSON.parse(localStorage.getItem('nah_all_patients') || '{}');
    registry[phone] = patient;
    if (email) registry[email] = patient;
    localStorage.setItem('nah_all_patients', JSON.stringify(registry));

    // Save in Firebase Realtime Database
    if (fbDatabase) {
      try {
        await fbDatabase.ref(`patients/${phone}`).set(patient);
        if (email) {
          const emailKey = emailToKey(email);
          await fbDatabase.ref(`patientsByEmail/${emailKey}`).set({
            phone,
            email,
            name,
            uid: patient.uid
          });
        }
      } catch (dbErr) {
        console.warn("RTDB patient save warning:", dbErr);
      }
    }

    return { 
      success: true, 
      patient,
      message: email 
        ? "Account created with Firebase Authentication & Realtime Database!" 
        : "Account created with phone in Realtime Database!" 
    };
  },

  loginPatient: async (emailOrPhone, password) => {
    const raw = (emailOrPhone || '').trim();
    const isEmail = raw.includes('@');
    const cleanPhone = raw.replace(/\D/g, '');
    const cleanPass = (password || '').trim();

    if (!raw || !cleanPass) {
      return { success: false, error: "Please enter your email or 10-digit mobile number and password." };
    }

    // --- STRATEGY 1: IF INPUT IS AN EMAIL ---
    if (isEmail) {
      const email = raw.toLowerCase();

      // 1A. Attempt Firebase Authentication
      let authUser = null;
      if (fbAuth) {
        try {
          const cred = await fbAuth.signInWithEmailAndPassword(email, cleanPass);
          authUser = cred.user;
        } catch (authErr) {
          console.warn("Firebase Auth Login Notice:", authErr.message);
        }
      }

      // 1B. Fetch profile from RTDB or LocalStorage
      let patient = null;
      if (fbDatabase) {
        try {
          const emailKey = emailToKey(email);
          const emailSnap = await fbDatabase.ref(`patientsByEmail/${emailKey}`).once('value');
          if (emailSnap.exists()) {
            const emailData = emailSnap.val();
            if (emailData && emailData.phone) {
              const patSnap = await fbDatabase.ref(`patients/${emailData.phone}`).once('value');
              if (patSnap.exists()) patient = patSnap.val();
            }
          }
        } catch(e) {}
      }

      if (!patient) {
        const registry = JSON.parse(localStorage.getItem('nah_all_patients') || '{}');
        for (const k in registry) {
          const p = registry[k];
          if (p && p.email && p.email.toLowerCase() === email) {
            patient = p;
            break;
          }
        }
      }

      if (authUser) {
        if (!patient) {
          patient = {
            uid: authUser.uid,
            name: authUser.displayName || email.split('@')[0],
            email: email,
            phone: '',
            mobile: '',
            registeredAt: new Date().toISOString()
          };
        }
        localStorage.setItem('nah_active_patient', JSON.stringify(patient));
        return { success: true, patient };
      }

      if (patient && patient.password === cleanPass) {
        localStorage.setItem('nah_active_patient', JSON.stringify(patient));
        return { success: true, patient };
      }

      return { success: false, error: "Invalid email or password. You can click 'Forgot Password?' to reset it." };
    }

    // --- STRATEGY 2: IF INPUT IS A PHONE NUMBER ---
    const phone = cleanPhone;
    if (phone.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number or registered email." };
    }

    let patient = null;

    // 2A. Check Firebase Realtime Database
    if (fbDatabase) {
      try {
        const snap = await fbDatabase.ref(`patients/${phone}`).once('value');
        if (snap.exists()) {
          patient = snap.val();
        }
      } catch(e) {}
    }

    // 2B. Check LocalStorage fallback
    if (!patient) {
      const registry = JSON.parse(localStorage.getItem('nah_all_patients') || '{}');
      if (registry[phone]) patient = registry[phone];
    }

    if (patient) {
      if (patient.password === cleanPass) {
        if (patient.email && fbAuth) {
          fbAuth.signInWithEmailAndPassword(patient.email, cleanPass).catch(() => {});
        }
        localStorage.setItem('nah_active_patient', JSON.stringify(patient));
        return { success: true, patient };
      } else {
        return { success: false, error: "Incorrect password for mobile " + phone + ". Click 'Forgot Password?' to reset." };
      }
    }

    return { success: false, error: "No account found with mobile " + phone + ". Please click 'Create Account' to sign up." };
  },

  sendPatientPasswordReset: async (emailOrPhone, optionalNewPass) => {
    const raw = (emailOrPhone || '').trim();
    if (!raw) return { success: false, error: "Please enter your registered email or 10-digit mobile number." };

    const isEmail = raw.includes('@');
    const cleanPhone = raw.replace(/\D/g, '');

    // 1. IF EMAIL WAS ENTERED: Use official Firebase Auth secure password reset
    if (isEmail) {
      const email = raw.toLowerCase();
      if (fbAuth) {
        try {
          await fbAuth.sendPasswordResetEmail(email);
          return {
            success: true,
            method: 'firebase_email',
            message: `Official Firebase password reset email sent to ${email}! Please check your inbox and follow the secure link.`
          };
        } catch (authErr) {
          if (authErr.code === 'auth/user-not-found') {
            return { success: false, error: "No account found with this email in Firebase Authentication." };
          }
          return { success: false, error: authErr.message || "Failed to send reset email." };
        }
      }
      return { success: false, error: "Firebase Authentication service not available." };
    }

    // 2. IF PHONE WAS ENTERED: Look up in RTDB
    const phone = cleanPhone;
    if (phone.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number or registered email." };
    }

    let patient = null;
    if (fbDatabase) {
      try {
        const snap = await fbDatabase.ref(`patients/${phone}`).once('value');
        if (snap.exists()) patient = snap.val();
      } catch(e) {}
    }
    if (!patient) {
      const registry = JSON.parse(localStorage.getItem('nah_all_patients') || '{}');
      if (registry[phone]) patient = registry[phone];
    }

    if (!patient) {
      return { success: false, error: "No account found with mobile number " + phone + "." };
    }

    // If patient has an email, send Firebase Auth reset email!
    if (patient.email && patient.email.includes('@') && !patient.email.endsWith('@patient.local')) {
      if (fbAuth) {
        try {
          await fbAuth.sendPasswordResetEmail(patient.email);
          const masked = patient.email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(1, b.length)) + c);
          return {
            success: true,
            method: 'firebase_email',
            message: `Official Firebase password reset link sent to your registered email (${masked})!`
          };
        } catch(e) {}
      }
    }

    // If phone-only account and new password was provided:
    if (optionalNewPass && optionalNewPass.length >= 6) {
      patient.password = optionalNewPass;
      patient.lastResetAt = new Date().toISOString();
      const registry = JSON.parse(localStorage.getItem('nah_all_patients') || '{}');
      registry[phone] = patient;
      localStorage.setItem('nah_all_patients', JSON.stringify(registry));
      if (fbDatabase) {
        try {
          await fbDatabase.ref(`patients/${phone}`).update({
            password: optionalNewPass,
            lastResetAt: new Date().toISOString()
          });
        } catch(e) {}
      }
      return {
        success: true,
        method: 'rtdb_phone',
        message: "Password updated successfully in hospital database. You can now sign in."
      };
    }

    return {
      success: true,
      needNewPass: true,
      message: "Mobile verified for " + (patient.name || 'Patient') + ". Please set your new password below."
    };
  },

  resetPatientPassword: async (emailOrPhone, newPassword) => {
    return window.HospitalAuth.sendPatientPasswordReset(emailOrPhone, newPassword);
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

  updatePatientProfile: async ({ name, email }) => {
    const current = window.HospitalAuth.getCurrentPatient();
    if (!current || current.isGuest) {
      return { success: false, error: "Please sign in to update your profile." };
    }
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanName) {
      return { success: false, error: "Full Name cannot be empty." };
    }
    const phone = current.phone || current.mobile;
    if (!phone) {
      return { success: false, error: "Patient mobile number missing." };
    }

    const updated = {
      ...current,
      name: cleanName,
      email: cleanEmail || current.email || ''
    };

    localStorage.setItem('nah_active_patient', JSON.stringify(updated));

    if (fbDatabase) {
      try {
        await fbDatabase.ref(`patients/${phone}`).update({
          name: cleanName,
          email: cleanEmail || '',
          updatedAt: new Date().toISOString()
        });

        if (cleanEmail) {
          const emailKey = cleanEmail.replace(/[@.]/g, '_');
          await fbDatabase.ref(`patientsByEmail/${emailKey}`).set({
            phone: phone,
            email: cleanEmail
          });
        }
      } catch (e) {
        console.warn("RTDB patient profile update notice:", e);
      }
    }

    return { success: true, patient: updated };
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
