import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  FileText, 
  AlertOctagon, 
  Printer, 
  ExternalLink,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function ShippingGatekeeper() {
  const { 
    factoryData, 
    selectedWorkOrderId, 
    setSelectedWorkOrderId, 
    evaluateShippingClearance, 
    generateShippingGatePass,
    currentUser 
  } = useApp();

  const [activeWOId, setActiveWOId] = useState(selectedWorkOrderId);
  const [vehicleNumber, setVehicleNumber] = useState('KA-05-EX-4921');
  const [driverName, setDriverName] = useState('Ramesh Gowda');
  const [showInterlockModal, setShowInterlockModal] = useState(false);
  const [interlockReasons, setInterlockReasons] = useState([]);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [activeManifest, setActiveManifest] = useState(null);
  const [showCustomerCertificate, setShowCustomerCertificate] = useState(false);

  const activeWO = factoryData.workOrders.find(w => w.id === activeWOId) || factoryData.workOrders[0];
  const clearance = evaluateShippingClearance(activeWO);

  // Evaluate Rule A, B, C individually for visual display
  const ruleAIncomplete = activeWO.operations.filter(op => op.opNumber < 60 && op.status !== 'COMPLETED' && op.status !== 'APPROVED' && op.status !== 'CONCESSION_GRANTED');
  const ruleAPass = ruleAIncomplete.length === 0;

  const ruleBActiveHolds = activeWO.operations.filter(op => op.requiresHoldTimer && op.isHoldActive);
  const ruleBPass = ruleBActiveHolds.length === 0;

  const pdiOp = activeWO.operations.find(op => op.opNumber === 50);
  const ruleCPass = pdiOp && (pdiOp.status === 'APPROVED' || pdiOp.status === 'CONCESSION_GRANTED');

  const handleAttemptDispatch = () => {
    if (!clearance.isCleared) {
      sounds.playAlarm();
      setInterlockReasons(clearance.reasons);
      setShowInterlockModal(true);
      return;
    }

    const result = generateShippingGatePass(activeWO.id, { vehicleNumber, driverName });
    if (result.success) {
      setActiveManifest(result.manifest);
      setShowGatePassModal(true);
    }
  };

  return (
    <div style={{ maxWidth: 1540, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header Banner */}
      <div className="card-glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
            }}>
              <Truck size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22 }}>Pre-Dispatch Quality Clearance Gates & Shipping Interlocks</h1>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                PRD Section 10 & 11: 3-Rule automated quality gatekeeper, locked gate passes, and customer verification QR labels.
              </span>
            </div>
          </div>
        </div>

        {/* Work Order Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Evaluate Job:</span>
          <select
            value={activeWOId}
            onChange={(e) => {
              setActiveWOId(e.target.value);
              setSelectedWorkOrderId(e.target.value);
              sounds.playClick();
            }}
            style={{ width: 'auto', backgroundColor: '#111827', fontSize: 13, fontWeight: 600 }}
          >
            {factoryData.workOrders.map(wo => (
              <option key={wo.id} value={wo.id}>
                {wo.id} - {wo.partNumber} ({wo.overallStatus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3-Rule Automated Gatekeeping Matrix (PRD Section 10.1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Rule A Card */}
        <div 
          className="card-glass" 
          style={{ 
            padding: 20, 
            border: `2px solid ${ruleAPass ? 'var(--status-pass-border)' : 'var(--status-fail-border)'}`,
            backgroundColor: ruleAPass ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="badge badge-cyan">RULE A</span>
            {ruleAPass ? (
              <span className="badge badge-pass"><CheckCircle2 size={12} /> 100% COMPLETE</span>
            ) : (
              <span className="badge badge-fail"><Lock size={12} /> INCOMPLETE</span>
            )}
          </div>
          <h3 style={{ fontSize: 16 }}>Manufacturing Operations Sign-off</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
            100% of all required machining and manufacturing routing steps must be signed off by authorized operators.
          </p>
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: ruleAPass ? '#34d399' : '#f87171' }}>
            {ruleAPass ? "✓ All 5 prior operations complete & stamped." : `✗ Incomplete: ${ruleAIncomplete.map(o => `Op ${o.opNumber}`).join(', ')}`}
          </div>
        </div>

        {/* Rule B Card */}
        <div 
          className="card-glass" 
          style={{ 
            padding: 20, 
            border: `2px solid ${ruleBPass ? 'var(--status-pass-border)' : 'var(--status-fail-border)'}`,
            backgroundColor: ruleBPass ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="badge badge-cyan">RULE B</span>
            {ruleBPass ? (
              <span className="badge badge-pass"><CheckCircle2 size={12} /> HOLDS FULFILLED</span>
            ) : (
              <span className="badge badge-fail"><Lock size={12} /> HOLD ACTIVE</span>
            )}
          </div>
          <h3 style={{ fontSize: 16 }}>Process Aging & Cooling Holds</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
            All thermal cooling, stress relief, and chemical curing hold timers must reach zero with no outstanding quality holds.
          </p>
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: ruleBPass ? '#34d399' : '#f87171' }}>
            {ruleBPass ? "✓ No active process hold timers." : `✗ Mandatory cooling hold active on Op 30.`}
          </div>
        </div>

        {/* Rule C Card */}
        <div 
          className="card-glass" 
          style={{ 
            padding: 20, 
            border: `2px solid ${ruleCPass ? 'var(--status-pass-border)' : 'var(--status-fail-border)'}`,
            backgroundColor: ruleCPass ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span className="badge badge-cyan">RULE C</span>
            {ruleCPass ? (
              <span className="badge badge-pass"><CheckCircle2 size={12} /> APPROVED BY QUALITY</span>
            ) : (
              <span className="badge badge-fail"><Lock size={12} /> PENDING QA APPROVAL</span>
            )}
          </div>
          <h3 style={{ fontSize: 16 }}>Final PDI Checklist Approval</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
            Final Pre-Dispatch Inspection checklist must be signed and approved by Shift Supervisor or Quality Manager.
          </p>
          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: ruleCPass ? '#34d399' : '#f87171' }}>
            {ruleCPass ? "✓ PDI Checklist signed & approved." : `✗ Current state: ${pdiOp?.status || 'NOT_STARTED'}`}
          </div>
        </div>

      </div>

      {/* Dispatch Authorization & Gate Pass Generator Card */}
      <div className="card-glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 17 }}>Dispatch Manifest & Shipping Gate Pass Clearance</h3>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              PRD Section 10.2: Attempting to generate gate pass when rules fail triggers hardware interlock lockout.
            </span>
          </div>

          <span className={`badge ${clearance.isCleared ? 'badge-pass' : 'badge-fail'}`} style={{ fontSize: 13, padding: '6px 12px' }}>
            {clearance.isCleared ? 'GATE CLEARED • UNLOCKED' : 'ELECTRONIC INTERLOCK ENGAGED'}
          </span>
        </div>

        {/* Transport Details Form */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Transport Vehicle Number Plate
            </label>
            <input 
              type="text" 
              value={vehicleNumber} 
              onChange={(e) => setVehicleNumber(e.target.value)} 
              className="font-mono"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Authorized Transport Driver
            </label>
            <input 
              type="text" 
              value={driverName} 
              onChange={(e) => setDriverName(e.target.value)} 
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Customer PO Reference
            </label>
            <input 
              type="text" 
              readOnly 
              value={activeWO.customerPO} 
              className="font-mono"
            />
          </div>
        </div>

        {/* Generate / Print Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
          {activeWO.dispatchManifest ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  setActiveManifest(activeWO.dispatchManifest);
                  setShowGatePassModal(true);
                  sounds.playClick();
                }}
                className="btn btn-primary"
              >
                <Printer size={16} />
                <span>View / Reprint Gate Pass #{activeWO.dispatchManifest.gatePassNumber}</span>
              </button>

              <button
                onClick={() => {
                  setShowCustomerCertificate(true);
                  sounds.playClick();
                }}
                className="btn btn-outline"
              >
                <ExternalLink size={16} />
                <span>View Customer QR Certificate (CoC)</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleAttemptDispatch}
              className={`btn ${clearance.isCleared ? 'btn-success' : 'btn-danger'}`}
              style={{ padding: '12px 24px', fontSize: 14 }}
            >
              {clearance.isCleared ? <Unlock size={18} /> : <Lock size={18} />}
              <span>{clearance.isCleared ? 'Verify Rules & Generate Official Shipping Gate Pass' : 'Attempt Gate Pass Clearance (Test Interlock)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Electronic Shipping Interlock Lockout Screen (PRD Section 10.2) */}
      {showInterlockModal && (
        <div className="modal-backdrop">
          <div className="modal-content flash-red-interlock" style={{ padding: 28, border: '3px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                border: '2px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertOctagon size={34} color="#ef4444" />
              </div>

              <div style={{ flex: 1 }}>
                <span className="badge badge-fail" style={{ fontSize: 11, marginBottom: 6 }}>
                  PRD SECTION 10.2 HARD INTERLOCK
                </span>
                <h2 style={{ fontSize: 20, color: '#f87171', fontWeight: 800 }}>
                  ELECTRONIC SHIPPING INTERLOCK ENGAGED
                </h2>

                <p style={{ fontSize: 13, color: '#fca5a5', marginTop: 8, lineHeight: 1.5 }}>
                  Warehouse clerk gate pass print command was <strong>strictly intercepted and aborted</strong>. Zero defect escape protocol prevents generating shipping gate passes, packing slips, or QR labels until all conditions pass!
                </p>

                {/* List of Unfulfilled Rules */}
                <div style={{
                  marginTop: 14,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', textTransform: 'uppercase' }}>
                    Unfulfilled Pre-Dispatch Rules:
                  </div>
                  {interlockReasons.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#fff', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ color: '#ef4444', fontWeight: 800 }}>✕</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowInterlockModal(false)} className="btn btn-danger">
                    Acknowledge Shipping Interlock
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Shipping Gate Pass Modal (PRD Section 11) */}
      {showGatePassModal && activeManifest && (
        <div className="modal-backdrop">
          <div className="modal-content modal-content-lg" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={24} color="#10b981" />
                <h2 style={{ fontSize: 18 }}>Official Factory Dispatch Gate Pass & Packing Manifest</h2>
              </div>
              <button onClick={() => setShowGatePassModal(false)} className="btn btn-ghost" style={{ padding: 4 }}>✕</button>
            </div>

            {/* Official Pass Printable Document */}
            <div style={{
              backgroundColor: '#fff',
              color: '#000',
              padding: 24,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              {/* Document Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#000' }}>ZAPUZA TECHNOLOGIES LLP</h2>
                  <div style={{ fontSize: 12, color: '#555' }}>Plant #01 • Quality Assurance & Dispatch Division</div>
                  <div style={{ fontSize: 11, color: '#777' }}>ISO 9001:2015 & AS9100D Certified Manufacturing</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>GATE PASS CLEARED</div>
                  <div className="font-mono" style={{ fontSize: 13, fontWeight: 700 }}>Pass #: {activeManifest.gatePassNumber}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>Date: {activeManifest.issuedAt}</div>
                </div>
              </div>

              {/* Manifest Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 13 }}>
                <div>
                  <div><strong>Customer:</strong> {activeManifest.customer}</div>
                  <div><strong>Customer PO #:</strong> {activeManifest.customerPO}</div>
                  <div><strong>Vehicle No:</strong> {activeManifest.vehicleNumber}</div>
                  <div><strong>Driver:</strong> {activeManifest.driverName}</div>
                </div>
                <div>
                  <div><strong>Part No:</strong> {activeManifest.partNumber}</div>
                  <div><strong>Component:</strong> {activeManifest.partName}</div>
                  <div><strong>Raw Material Heat:</strong> #{activeManifest.heatNumber}</div>
                  <div><strong>Verified Quantity:</strong> {activeManifest.batchSize} Units</div>
                </div>
              </div>

              {/* Serial Numbers Box */}
              <div style={{ border: '1px solid #ccc', padding: 10, borderRadius: 4, fontSize: 11 }}>
                <strong>Assigned Component Serial Numbers:</strong>
                <div style={{ marginTop: 4, fontFamily: 'monospace', color: '#333' }}>
                  {activeManifest.serialNumbers.join(' • ')}
                </div>
              </div>

              {/* Customer QR Verification Stamp Section */}
              <div style={{
                border: '2px dashed #059669',
                backgroundColor: '#f0fdf4',
                padding: 14,
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>
                    CUSTOMER DIGITAL INSPECTION QR LABEL (PRD Sec 11.3)
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                    Scan QR code affixed to shipping crate to view live digital Certificate of Analysis (CoA) & mill certs.
                  </div>
                </div>

                <div 
                  onClick={() => setShowCustomerCertificate(true)}
                  style={{
                    backgroundColor: '#fff',
                    padding: 8,
                    border: '1px solid #059669',
                    borderRadius: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                  title="Click to view Customer Certificate of Analysis"
                >
                  <QrCode size={48} color="#059669" />
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#059669', marginTop: 2 }}>[VIEW COA]</span>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid #ccc', fontSize: 11 }}>
                <div>
                  <div>Quality Engineer Sign-off: <strong>M. Vance (QM)</strong></div>
                  <div style={{ color: '#777' }}>Stamp: QC-PASSED-CERTIFIED</div>
                </div>
                <div>
                  <div>Security Gate Officer: <strong>Verified & Cleared</strong></div>
                  <div style={{ color: '#777' }}>Exit Gate #02</div>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <button 
                onClick={() => { setShowGatePassModal(false); setShowCustomerCertificate(true); }}
                className="btn btn-outline"
              >
                <ExternalLink size={14} />
                <span>Open Digital Customer CoA Portal</span>
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowGatePassModal(false)} className="btn btn-outline">Close</button>
                <button onClick={() => window.print()} className="btn btn-primary">
                  <Printer size={16} />
                  <span>Print Gate Pass & Crate Labels</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Customer Certificate of Analysis / CoC Web Document (PRD Section 11.3) */}
      {showCustomerCertificate && (
        <div className="modal-backdrop">
          <div className="modal-content modal-content-xl" style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={24} color="#38bdf8" />
                <h2 style={{ fontSize: 18 }}>Customer Digital Inspection Certificate (Certificate of Analysis)</h2>
              </div>
              <button onClick={() => setShowCustomerCertificate(false)} className="btn btn-ghost" style={{ padding: 4 }}>✕</button>
            </div>

            <div style={{
              backgroundColor: '#0c1322',
              border: '1px solid #1e3a5f',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e3a5f', paddingBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, color: '#38bdf8' }}>CERTIFIED QUALITY REPORT & BIRTH CERTIFICATE</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Zapuza Technologies LLP • ISO 9001:2015 AS9100D</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-pass" style={{ fontSize: 12 }}>✓ CERTIFIED CONFORMING</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Heat Lot: #{activeWO.heatNumber}</div>
                </div>
              </div>

              {/* Chemical & Mechanical Specs from MTC */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>Certified Chemistry (MTC EN 10204 3.1)</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>Carbon (C): 0.17% (Specification: 0.14 - 0.20%)</div>
                    <div>Manganese (Mn): 1.45% (Specification: 1.30 - 1.60%)</div>
                    <div>Silicon (Si): 0.28% (Specification: 0.15 - 0.35%)</div>
                    <div>Phosphorus (P): 0.018% (Max: 0.025%)</div>
                  </div>
                </div>

                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>Mechanical Testing</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div>Yield Strength: 395 MPa (Min: 355 MPa)</div>
                    <div>Tensile Strength: 545 MPa (Spec: 490 - 630 MPa)</div>
                    <div>Hardness: 172 HBW</div>
                    <div>Heat Treatment: Case Hardened 58-62 HRC (Cooling Verified)</div>
                  </div>
                </div>
              </div>

              {/* Measured Dimensions */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 8 }}>100% Final Inspection Dimensional Record:</div>
                <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 6, overflow: 'hidden' }}>
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Nominal Spec</th>
                        <th>Actual Measured</th>
                        <th>Gauge ID</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Bearing Journal Ø</td>
                        <td>60.000 mm [+0.005, -0.010]</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>60.001 mm</td>
                        <td>MC-202 (Calibrated)</td>
                        <td><span className="badge badge-pass">PASS</span></td>
                      </tr>
                      <tr>
                        <td>Step Shoulder Ø</td>
                        <td>55.000 mm [±0.020]</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>54.995 mm</td>
                        <td>VC-104 (Calibrated)</td>
                        <td><span className="badge badge-pass">PASS</span></td>
                      </tr>
                      <tr>
                        <td>Keyway Slot Width</td>
                        <td>18.000 mm [+0.018, 0]</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>18.010 mm</td>
                        <td>VC-104 (Calibrated)</td>
                        <td><span className="badge badge-pass">PASS</span></td>
                      </tr>
                      <tr>
                        <td>Surface Roughness Ra</td>
                        <td>≤ 0.40 µm Ra</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>0.22 µm Ra</td>
                        <td>SR-11 (Calibrated)</td>
                        <td><span className="badge badge-pass">PASS</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', paddingTop: 10 }}>
                <span>Cryptographically Signed by Zapuza Q-CORE Security Engine</span>
                <span>Verification Hash: SHA256-8a90fbc291</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowCustomerCertificate(false)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
