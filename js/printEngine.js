/**
 * NALANDA ADVANCE HEALTHCARE HOSPITAL - ONE-CLICK DIRECT PRINTER & PDF ENGINE
 * Supports:
 * 1. A4 Official Hospital Letterhead Prescription & Medical Summary
 * 2. Compact Thermal / A5 (80mm) Reception Token Slips & Payment Receipts
 * 3. window.print() Direct Hardware Trigger + html2pdf.js PDF Generation
 */

window.PrintEngine = {
  // Ensure an active print target exists in the DOM
  ensurePrintArea: function() {
    let printArea = document.getElementById('activePrintArea');
    if (!printArea) {
      printArea = document.createElement('div');
      printArea.id = 'activePrintArea';
      document.body.appendChild(printArea);
    }
    return printArea;
  },

  // --------------------------------------------------------------------------
  // 1. GENERATE A4 OFFICIAL PRESCRIPTION
  // --------------------------------------------------------------------------
  generateA4PrescriptionHTML: function(rx, apt, settings) {
    settings = settings || (window.HospitalStore ? window.HospitalStore.getSettings() : {});
    const dateFormatted = rx.date || new Date().toISOString().slice(0,10);
    const vitals = rx.vitals || {};

    const medRows = (rx.medicines || []).map((m, idx) => `
      <tr>
        <td style="width: 40px; text-align: center; font-weight: 700;">${idx + 1}</td>
        <td style="font-weight: 700; color: #0b4f6c;">${m.name}</td>
        <td style="text-align: center; font-weight: 700; color: #0284c7;">${m.dosage || '1-0-1'}</td>
        <td style="color: #475569;">${m.timing || 'After Food'}</td>
        <td style="font-weight: 600;">${m.duration || '5 Days'}</td>
      </tr>
    `).join('');

    return `
      <div class="hospital-print-document a4-prescription-layout">
        <!-- Official Hospital Header Letterhead -->
        <div class="print-header">
          <div class="print-brand-left">
            <div class="print-logo-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
            <div>
              <div class="print-hospital-name">${settings.hospitalName || 'Nalanda Advance Healthcare Hospital'}</div>
              <div class="print-hospital-tagline">${settings.tagline || 'Advance Care, Compassionate Healing · Pvt Ltd'}</div>
              <div class="print-hospital-meta">
                ${settings.address || 'Bihar Sharif Police Line, Near Flyover, Nalanda, Bihar'}<br>
                Reg No: ${settings.regNo || 'REG-BR-NAL-2023-8942'} | Email: ${settings.email || 'nalandahospital@gmail.com'}
              </div>
            </div>
          </div>
          <div class="print-header-right">
            <strong>24/7 Emergency: ${settings.emergencyPhone || '+91 91557 64409'}</strong>
            OPD Hours: 9:00 AM – 6:00 PM<br>
            Multispecialty & Daycare Surgical Centre
          </div>
        </div>

        <!-- Patient Demographics Bar -->
        <div class="print-patient-bar">
          <div class="patient-field-item">
            <label>Patient Name</label>
            <span>${rx.patientName || (apt && apt.patientName) || 'Walk-In Patient'}</span>
          </div>
          <div class="patient-field-item">
            <label>UHID / Patient ID</label>
            <span>${rx.uhid || (apt && apt.uhid) || 'NAH-2026-TEMP'}</span>
          </div>
          <div class="patient-field-item">
            <label>Age / Gender / Blood</label>
            <span>${rx.ageGender || `${(apt && apt.age) || 35} Yrs / ${(apt && apt.gender) || 'M'}`} (${(apt && apt.bloodGroup) || 'B+'})</span>
          </div>
          <div class="patient-field-item">
            <label>Date & Time</label>
            <span>${dateFormatted} | ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <!-- Vitals Strip -->
        <div class="print-vitals-strip">
          <span class="vital-metric">BP: <strong>${vitals.bp || '120/80 mmHg'}</strong></span>
          <span style="color: #cbd5e1;">|</span>
          <span class="vital-metric">Pulse: <strong>${vitals.pulse || '76 bpm'}</strong></span>
          <span style="color: #cbd5e1;">|</span>
          <span class="vital-metric">Temp: <strong>${vitals.temp || '98.6°F'}</strong></span>
          <span style="color: #cbd5e1;">|</span>
          <span class="vital-metric">Weight: <strong>${vitals.weight || '65 kg'}</strong></span>
          <span style="color: #cbd5e1;">|</span>
          <span class="vital-metric">SpO2: <strong>${vitals.spo2 || '99%'}</strong></span>
        </div>

        <!-- Clinical Notes & Rx Symbol -->
        <div class="print-rx-body">
          <div class="clinical-section-block">
            <div class="clinical-block-title">Chief Symptoms & Clinical Diagnosis</div>
            <div class="clinical-block-content">
              <strong>Provisional Diagnosis:</strong> ${rx.diagnosis || (apt && apt.symptoms) || 'General Consultation / Clinical Evaluation'}<br>
              ${(apt && apt.symptoms) ? `<span style="font-size: 0.8rem; color: #64748b;">Chief Complaints: ${apt.symptoms}</span>` : ''}
            </div>
          </div>

          <div class="rx-symbol-line">
            ℞ <span>Prescribed Medications</span>
          </div>

          <table class="print-medicine-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Medicine / Brand Name</th>
                <th style="text-align: center;">Dosage (M-A-N)</th>
                <th>Timing</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              ${medRows || `
                <tr>
                  <td colspan="5" style="text-align:center; color:#64748b; padding:16px; font-weight:500;">No oral medications prescribed. Follow advised investigations & clinical care.</td>
                </tr>
              `}
            </tbody>
          </table>

          <div class="clinical-section-block">
            <div class="clinical-block-title">Advised Investigations & Diagnostic Tests</div>
            <div class="clinical-block-content">
              ${rx.investigations || 'Routine Vitals Monitoring, CBC if fever persists.'}
            </div>
          </div>

          <div class="clinical-section-block">
            <div class="clinical-block-title">Dietary & Follow-Up Advice</div>
            <div class="clinical-block-content">
              ${rx.followUp || 'Plenty of oral hydration. Follow up in OPD after 5 days or immediately SOS.'}
            </div>
          </div>
        </div>

        <!-- Footer Letterhead & Signatures -->
        <div class="print-footer">
          <div class="print-signature-row">
            <div class="qr-verification-box">
              <div class="mock-qr">
                DIGITAL<br>VERIFIED<br>SLIP
              </div>
              <div>
                <strong>Nalanda Digital OPD Portal</strong><br>
                Prescription ID: ${rx.rxId || 'RX-2026-LIVE'}<br>
                Scan or verify at booking.nalandahospital.com
              </div>
            </div>

            <div class="doctor-signature-box">
              <div class="doctor-sign-line"></div>
              <strong>${rx.doctorName || (apt && apt.doctorName) || 'Consulting Physician'}</strong><br>
              <span style="font-size:0.75rem; color:#64748b;">${rx.doctorTitle || 'MBBS, Specialist Medical Officer'}</span>
            </div>
          </div>

          <div class="print-disclaimer">
            * This is an official digital prescription issued under National Medical Commission guidelines. Substitute with generic equivalents if prescribed brand is unavailable. In case of emergency, contact +91 91557 64409 immediately.
          </div>
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 2. GENERATE COMPACT THERMAL / A5 TOKEN SLIP (80mm)
  // --------------------------------------------------------------------------
  generateThermalSlipHTML: function(apt, settings) {
    settings = settings || (window.HospitalStore ? window.HospitalStore.getSettings() : {});
    const dateFormatted = apt.date || new Date().toISOString().slice(0,10);
    const timeFormatted = apt.timeSlot || '10:00 AM';

    return `
      <div class="hospital-print-document thermal-receipt-layout">
        <div class="thermal-center">
          <div class="thermal-title">${settings.hospitalName || 'NALANDA HEALTHCARE'}</div>
          <div class="thermal-tagline">ADVANCE HOSPITAL · BIHAR SHARIF</div>
          <div style="font-size:10px;">Ph: ${settings.emergencyPhone || '+91 91557 64409'}</div>
        </div>

        <div class="thermal-divider"></div>

        <div class="thermal-token-badge">
          TOKEN: ${apt.tokenNo || '#OPD-01'}
        </div>

        <div class="thermal-row">
          <span>Date: ${dateFormatted}</span>
          <span>Time: ${timeFormatted}</span>
        </div>
        <div class="thermal-row">
          <span>UHID: ${apt.uhid || 'NAH-2026-1042'}</span>
          <span>Apt ID: ${(apt.id || '').slice(-6)}</span>
        </div>

        <div class="thermal-divider"></div>

        <div class="thermal-row">
          <span><strong>Patient:</strong></span>
          <span><strong>${apt.patientName}</strong></span>
        </div>
        <div class="thermal-row">
          <span>Age/Sex:</span>
          <span>${apt.age || '-'} Yrs / ${apt.gender || '-'}</span>
        </div>
        <div class="thermal-row">
          <span>Doctor:</span>
          <span>${apt.doctorName || 'Senior Consultant'}</span>
        </div>
        <div class="thermal-row">
          <span>Dept:</span>
          <span>${apt.dept || 'General OPD'}</span>
        </div>

        <div class="thermal-divider"></div>

        <div class="thermal-row">
          <span>Consultation Fee:</span>
          <span>₹${apt.fee || 400}</span>
        </div>
        <div class="thermal-row">
          <span>Payment Status:</span>
          <span><strong>${apt.paymentStatus || 'Paid'} (${apt.paymentMode || 'Cash'})</strong></span>
        </div>

        <div class="thermal-divider"></div>

        <div class="thermal-center" style="font-size:10px; margin-top:6px;">
          * Please proceed to Waiting Area 2.<br>
          * Keep this slip handy for your consultation.<br>
          Thank you for trusting Nalanda Healthcare!
        </div>
      </div>
    `;
  },

  // --------------------------------------------------------------------------
  // 3. TRIGGER INSTANT HARDWARE PRINTER (window.print)
  // --------------------------------------------------------------------------
  printNow: function(htmlContent) {
    const printArea = this.ensurePrintArea();
    printArea.innerHTML = htmlContent;

    // Small timeout ensures fonts and layout render cleanly before dialog triggers
    setTimeout(() => {
      window.print();
    }, 150);
  },

  printPrescription: function(rx, apt) {
    const html = this.generateA4PrescriptionHTML(rx, apt);
    this.printNow(html);
  },

  printTokenSlip: function(apt) {
    const html = this.generateThermalSlipHTML(apt);
    this.printNow(html);
  },

  // --------------------------------------------------------------------------
  // 4. ONE-CLICK PDF DOWNLOAD (using html2pdf.js)
  // --------------------------------------------------------------------------
  downloadPDF: function(htmlContent, filename) {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.innerHTML = htmlContent;
    document.body.appendChild(tempContainer);

    const opt = {
      margin:       [6, 6, 6, 6],
      filename:     filename || 'Nalanda-Hospital-Document.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(tempContainer).save().then(() => {
        document.body.removeChild(tempContainer);
      }).catch(err => {
        console.error("PDF generation error:", err);
        document.body.removeChild(tempContainer);
      });
    } else {
      // Fallback: trigger print
      alert("Note: PDF engine initializing, opening Print dialog where you can 'Save as PDF'.");
      this.printNow(htmlContent);
      document.body.removeChild(tempContainer);
    }
  },

  downloadPrescriptionPDF: function(rx, apt) {
    const html = this.generateA4PrescriptionHTML(rx, apt);
    const name = ((apt && apt.patientName) || (rx && rx.patientName) || 'Patient').replace(/\s+/g, '_');
    const uhid = (rx && rx.uhid) || (apt && apt.uhid) || 'Slip';
    this.downloadPDF(html, `${uhid}-${name}-Prescription.pdf`);
  },

  downloadTokenPDF: function(apt) {
    const html = this.generateThermalSlipHTML(apt);
    const name = (apt.patientName || 'Patient').replace(/\s+/g, '_');
    const token = (apt.tokenNo || 'Token').replace(/#/g, '');
    this.downloadPDF(html, `${token}-${name}-OPD-Slip.pdf`);
  }
};
