/**
 * NALANDA ADVANCE HEALTHCARE HOSPITAL - CENTRAL STATE STORE
 * Manages Settings, Admins, Doctors (with accounts & passwords),
 * Patients, Bed Occupancy Tracker, and Appointments.
 */

const INITIAL_HOSPITAL_DATA = {
  settings: {
    hospitalName: "Nalanda Advance Healthcare Hospital",
    tagline: "Advance Care, Compassionate Healing · Pvt Ltd",
    regNo: "REG-BR-NAL-2023-8942",
    emergencyPhone: "+91 91557 64409",
    receptionPhone: "+91 91557 64409",
    email: "nalandahospital@gmail.com",
    address: "Bihar Sharif Police Line, Near Flyover, Nalanda, Bihar - 803101",
    mapsUrl: "https://maps.app.goo.gl/fKTir4ggG2cFCvSx6",
    announcement: "24/7 Emergency & Trauma Hospital · Ayushman Bharat (PM-JAY) & Cashless Empanelled",
    heroTitle: "ADVANCED SURGICAL & MEDICAL HEALTHCARE",
    heroSub: "Experience world-class surgical care, modular laminar OTs, and compassionate inpatient healing at the heart of Nalanda."
  },
  admins: ["mohitk43131@gmail.com"],
  doctors: [],
  procedures: [],
  appointments: [],
  prescriptions: [],
  leaveRequests: [],
  beds: [
    { id: "BED-01", name: "Daycare Suite 1", ward: "Daycare", bedNo: "Bed 1", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-02", name: "Daycare Suite 2", ward: "Daycare", bedNo: "Bed 2", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-03", name: "Daycare Suite 3", ward: "Daycare", bedNo: "Bed 3", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-04", name: "Daycare Suite 4", ward: "Daycare", bedNo: "Bed 4", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-05", name: "Trauma Resuscitation Bay", ward: "Emergency", bedNo: "ER-01", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-06", name: "Emergency Observation", ward: "Emergency", bedNo: "ER-02", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-07", name: "ICU Ventilator Bay 1", ward: "ICU", bedNo: "ICU-01", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-08", name: "ICU Ventilator Bay 2", ward: "ICU", bedNo: "ICU-02", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-09", name: "General Ward Bed M1", ward: "General Ward", bedNo: "M-01", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-10", name: "General Ward Bed M2", ward: "General Ward", bedNo: "M-02", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-11", name: "General Ward Bed F1", ward: "General Ward", bedNo: "F-01", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" },
    { id: "BED-12", name: "General Ward Bed F2", ward: "General Ward", bedNo: "F-02", status: "Available", patientName: "", uhid: "", admittedAt: "", doctorName: "", diagnosis: "" }
  ],
  tpaEmpanelments: [
    { name: "Star Health Insurance", type: "Cashless TPA" },
    { name: "Care Health Insurance", type: "Cashless TPA" },
    { name: "HDFC ERGO Health", type: "Cashless TPA" },
    { name: "ICICI Lombard General", type: "Cashless TPA" },
    { name: "Niva Bupa Health", type: "Cashless TPA" },
    { name: "Ayushman Bharat (PM-JAY)", type: "Govt Scheme" }
  ]
};

class HospitalStateStore {
  constructor() {
    this.storageKey = 'nah_hospital_db_v4';
    this.subscribers = [];
    this.data = this.loadLocal();

    window.addEventListener('storage', (e) => {
      if (e.key === this.storageKey && e.newValue) {
        try {
          this.data = JSON.parse(e.newValue);
          this.notifySubscribers('remote-storage');
        } catch (err) {}
      }
    });

    this.initFirebaseSync();
  }

  loadLocal() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_HOSPITAL_DATA,
          ...parsed,
          settings: { ...INITIAL_HOSPITAL_DATA.settings, ...(parsed.settings || {}) },
          beds: (parsed.beds && parsed.beds.length) ? parsed.beds : INITIAL_HOSPITAL_DATA.beds
        };
      }
    } catch (e) {}
    this.saveLocal(INITIAL_HOSPITAL_DATA);
    return JSON.parse(JSON.stringify(INITIAL_HOSPITAL_DATA));
  }

  saveLocal(data) {
    this.data = data;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    this.syncToFirebase(data);
    this.notifySubscribers('local-update');
  }

  initFirebaseSync() {
    if (typeof fbDatabase !== 'undefined' && fbDatabase) {
      const ref = fbDatabase.ref('hospitalData');
      ref.on('value', (snapshot) => {
        const val = snapshot.val();
        if (val) {
          this.data = {
            ...INITIAL_HOSPITAL_DATA,
            ...val,
            settings: { ...INITIAL_HOSPITAL_DATA.settings, ...(val.settings || {}) },
            beds: (val.beds && val.beds.length) ? val.beds : INITIAL_HOSPITAL_DATA.beds
          };
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
          this.notifySubscribers('firebase-sync');
        } else {
          ref.set(this.data);
        }
      });
    }
  }

  syncToFirebase(data) {
    if (typeof fbDatabase !== 'undefined' && fbDatabase) {
      try {
        fbDatabase.ref('hospitalData').set(data).catch(() => {});
      } catch (err) {}
    }
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers(source) {
    this.subscribers.forEach(cb => {
      try { cb(this.data, source); } catch (e) {}
    });
  }

  // --- API METHODS ---
  getData() { return this.data; }

  getSettings() { return this.data.settings || INITIAL_HOSPITAL_DATA.settings; }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveLocal(this.data);
    return this.data.settings;
  }

  // Doctors
  getDoctors() { return this.data.doctors || []; }

  getDoctorById(id) {
    return (this.data.doctors || []).find(d => d.id === id);
  }

  addDoctor(newDoctor) {
    if (!newDoctor.id) newDoctor.id = 'doc-' + Date.now();
    if (!newDoctor.password) newDoctor.password = "doctor123";
    if (!this.data.doctors) this.data.doctors = [];
    this.data.doctors.push(newDoctor);
    this.saveLocal(this.data);
    return newDoctor;
  }

  updateDoctor(doctorId, updates) {
    const idx = (this.data.doctors || []).findIndex(d => d.id === doctorId);
    if (idx !== -1) {
      this.data.doctors[idx] = { ...this.data.doctors[idx], ...updates };
      this.saveLocal(this.data);
      return this.data.doctors[idx];
    }
    return null;
  }

  updateDoctorStatus(doctorId, status) {
    return this.updateDoctor(doctorId, { status });
  }

  deleteDoctor(doctorId) {
    this.data.doctors = (this.data.doctors || []).filter(d => d.id !== doctorId);
    this.saveLocal(this.data);
  }

  // Bed Occupancy Tracker
  getBeds() { 
    if (!this.data.beds || this.data.beds.length === 0) {
      this.data.beds = JSON.parse(JSON.stringify(INITIAL_HOSPITAL_DATA.beds));
      this.saveLocal(this.data);
    }
    return this.data.beds; 
  }

  getBedById(id) {
    return (this.data.beds || []).find(b => b.id === id);
  }

  addBed(bedData) {
    if (!this.data.beds) this.data.beds = [];
    const count = this.data.beds.length + 1;
    if (!bedData.id) bedData.id = `BED-${String(count).padStart(2, '0')}`;
    if (!bedData.status) bedData.status = 'Available';
    if (!bedData.name) bedData.name = `${bedData.ward || 'Ward'} Bed ${count}`;
    this.data.beds.push(bedData);
    this.saveLocal(this.data);
    return bedData;
  }

  updateBed(bedId, updates) {
    const idx = (this.data.beds || []).findIndex(b => b.id === bedId);
    if (idx !== -1) {
      this.data.beds[idx] = { ...this.data.beds[idx], ...updates };
      this.saveLocal(this.data);
      return this.data.beds[idx];
    }
    return null;
  }

  updateBedStatus(bedId, status, patientName = "") {
    return this.updateBed(bedId, { status, patientName });
  }

  deleteBed(bedId) {
    this.data.beds = (this.data.beds || []).filter(b => b.id !== bedId);
    this.saveLocal(this.data);
  }

  // Appointments
  getAppointments() { return this.data.appointments || []; }

  getAppointmentById(id) {
    return (this.data.appointments || []).find(a => a.id === id);
  }

  addAppointment(apt) {
    if (!this.data.appointments) this.data.appointments = [];

    const todayStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const count = this.data.appointments.length + 1;

    if (!apt.id) apt.id = `APT-${todayStr}-${String(count).padStart(3, '0')}`;
    if (!apt.tokenNo) apt.tokenNo = `#OPD-${String(count).padStart(2, '0')}`;
    if (!apt.uhid) apt.uhid = `NAH-${new Date().getFullYear()}-${1000 + count}`;
    if (!apt.createdAt) apt.createdAt = new Date().toISOString();
    if (!apt.status) apt.status = "Confirmed";

    this.data.appointments.unshift(apt);
    this.saveLocal(this.data);
    return apt;
  }

  updateAppointment(id, updates) {
    const idx = (this.data.appointments || []).findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.appointments[idx] = { ...this.data.appointments[idx], ...updates };
      this.saveLocal(this.data);
      return this.data.appointments[idx];
    }
    return null;
  }

  deleteAppointment(id) {
    this.data.appointments = (this.data.appointments || []).filter(a => a.id !== id);
    this.saveLocal(this.data);
  }

  // Prescriptions
  getPrescriptions() { return this.data.prescriptions || []; }

  getPrescriptionByApt(aptId) {
    return (this.data.prescriptions || []).find(p => p.appointmentId === aptId);
  }

  savePrescription(rxData) {
    if (!this.data.prescriptions) this.data.prescriptions = [];
    if (!rxData.rxId) {
      const todayStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      const count = this.data.prescriptions.length + 1;
      rxData.rxId = `RX-${todayStr}-${String(count).padStart(3, '0')}`;
    }

    const idx = this.data.prescriptions.findIndex(p => p.appointmentId === rxData.appointmentId);
    if (idx !== -1) {
      this.data.prescriptions[idx] = { ...this.data.prescriptions[idx], ...rxData };
    } else {
      this.data.prescriptions.unshift(rxData);
    }

    if (rxData.appointmentId) {
      this.updateAppointment(rxData.appointmentId, { status: "Completed" });
    }

    this.saveLocal(this.data);
    return rxData;
  }

  // Procedures
  getProcedures() { return this.data.procedures || []; }

  addProcedure(proc) {
    if (!this.data.procedures) this.data.procedures = [];
    if (!proc.id) proc.id = 'proc-' + Date.now();
    this.data.procedures.push(proc);
    this.saveLocal(this.data);
    return proc;
  }

  deleteProcedure(id) {
    this.data.procedures = (this.data.procedures || []).filter(p => p.id !== id);
    this.saveLocal(this.data);
  }

  // Leaves
  getLeaveRequests() { return this.data.leaveRequests || []; }

  submitLeaveRequest(req) {
    if (!this.data.leaveRequests) this.data.leaveRequests = [];
    if (!req.id) req.id = 'leave-' + Date.now();
    if (!req.status) req.status = "Pending";
    if (!req.submittedAt) req.submittedAt = new Date().toISOString().slice(0, 10);
    this.data.leaveRequests.unshift(req);
    this.saveLocal(this.data);
    return req;
  }

  updateLeaveStatus(id, status) {
    const req = (this.data.leaveRequests || []).find(l => l.id === id);
    if (req) {
      req.status = status;
      if (req.doctorId) {
        if (status === "Approved") {
          this.updateDoctorStatus(req.doctorId, "leave");
        } else if (status === "Rejected" || status === "Revoked") {
          this.updateDoctorStatus(req.doctorId, "available");
        }
      }
      this.saveLocal(this.data);
      return req;
    }
    return null;
  }

  deleteLeaveRequest(id) {
    const req = (this.data.leaveRequests || []).find(l => l.id === id);
    if (req && req.status === "Approved" && req.doctorId) {
      this.updateDoctorStatus(req.doctorId, "available");
    }
    this.data.leaveRequests = (this.data.leaveRequests || []).filter(l => l.id !== id);
    this.saveLocal(this.data);
  }

  resetToCleanBlank() {
    this.saveLocal(JSON.parse(JSON.stringify(INITIAL_HOSPITAL_DATA)));
    return true;
  }
}

window.HospitalStore = new HospitalStateStore();
