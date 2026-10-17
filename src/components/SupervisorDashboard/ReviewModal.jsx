import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  X, 
  FileCheck2, 
  Wrench, 
  Camera, 
  Lock, 
  AlertOctagon, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function ReviewModal({ workOrder, onClose }) {
  const { factoryData, approveInspection, grantConcession, rejectToQuarantine, currentUser } = useApp();

  const [notes, setNotes] = useState('');
  const [showConcessionForm, setShowConcessionForm] = useState(false);
  const [concessionReasonCode, setConcessionReasonCode] = useState('CR-101: Minor Tool Wear Drift - Fits Secondary Assembly Envelope');
  const [engineeringJustification, setEngineeringJustification] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const template = factoryData.templates.find(t => t.partNumber === workOrder.partNumber) || factoryData.templates[0];
  const insp = workOrder.inspectionData;

  if (!insp) {
    return (
      <div className="modal-backdrop">
        <div className="modal-content" style={{ padding: 24 }}>
          <h3>No Inspection Data</h3>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>This work order has not yet been submitted by the floor inspector.</p>
          <button onClick={onClose} className="btn btn-outline" style={{ marginTop: 16 }}>Close</button>
        </div>
      </div>
    );
  }

  const hasCTQFailures = insp.hasCTQFailures;
  const hasFailures = insp.hasFailures;

  const handleApprove = () => {
    approveInspection(workOrder.id, notes || "All measurements verified conforming by shift supervisor.");
    onClose();
  };

  const handleExecuteConcession = (e) => {
    e.preventDefault();
    if (hasCTQFailures) {
      sounds.playAlarm();
      alert("HARD INTERLOCK (PRD Rule 4.3): Concessions are strictly prohibited on Critical-To-Quality (CTQ) items!");
      return;
    }
    if (!engineeringJustification.trim()) {
      alert("Mandatory: Engineering justification must be provided for concession release.");
      return;
    }
    const success = grantConcession(workOrder.id, concessionReasonCode, engineeringJustification);
    if (success) {
      onClose();
    }
  };

  const handleExecuteRejection = (e) => {
    e.preventDefault();
    rejectToQuarantine(workOrder.id, rejectionReason || "Dimensional non-conformance exceeding allowable limits.");
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-content-xl" style={{ padding: 28 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileCheck2 size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 20 }}>Supervisor Inspection Review: {workOrder.id}</h2>
                <span className="badge badge-cyan">{workOrder.partNumber}</span>
                {workOrder.hasConcession && <span className="badge badge-warn">CONCESSION LOT</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Heat Lot: <strong style={{ color: '#fff' }}>{workOrder.heatNumber}</strong> • Batch Size: {workOrder.batchSize} pcs • Inspector: {insp.inspectorId} ({insp.submittedAt})
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* CTQ Interlock Warning Banner if CTQ failed */}
        {hasCTQFailures && (
          <div style={{
            padding: 16,
            backgroundColor: 'var(--status-ctq-bg)',
            border: '2px solid var(--status-ctq-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'pulseCTQ 2s infinite'
          }}>
            <AlertOctagon size={26} color="#ff6b00" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ff9944' }}>
                ZERO-DEFECT CTQ SAFEGUARD ACTIVE (PRD Rule 4.3 & 6.1)
              </div>
              <div style={{ fontSize: 12, color: '#fff', marginTop: 2 }}>
                One or more Critical-to-Quality parameters failed tolerance limits. <strong>Conditional Concession is hard-locked by system rules.</strong> This lot must be routed to Rejection Quarantine for MRB disposition.
              </div>
            </div>
          </div>
        )}

        {/* Detailed Submitted Measurements Table */}
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={16} color="#06b6d4" />
            <span>Inspection Measurements vs Technical Blueprint Limits</span>
          </h3>

          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table className="table-custom">
              <thead>
                <tr>
                  <th>Pin # / Name</th>
                  <th>Nominal Target</th>
                  <th>Allowed Limits</th>
                  <th>Measured Reading</th>
                  <th>Deviation</th>
                  <th>Tool Used</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {template.dimensions.map((dim) => {
                  const m = insp.measurements[dim.id];
                  if (!m) return null;

                  const isPass = m.pass;
                  const isCTQ = dim.isCTQ;
                  const val = m.value;
                  const numVal = parseFloat(val);

                  let deviationText = 'Nominal';
                  if (dim.type === 'TOLERANCE' && !isNaN(numVal)) {
                    const diff = numVal - dim.nominal;
                    deviationText = `${diff >= 0 ? '+' : ''}${diff.toFixed(4)} mm`;
                  } else if (dim.type === 'MAX_LIMIT') {
                    deviationText = `Ra ${val}`;
                  } else if (dim.type === 'PASS_FAIL') {
                    deviationText = val === '1' ? 'Conforming' : 'Non-Conforming';
                  }

                  return (
                    <tr 
                      key={dim.id}
                      style={{ 
                        backgroundColor: !isPass ? (isCTQ ? 'rgba(255,107,0,0.1)' : 'rgba(239,68,68,0.08)') : undefined 
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: isCTQ ? '#ff6b00' : '#0284c7',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {dim.pinNumber}
                          </span>
                          <span style={{ fontWeight: 600 }}>{dim.name}</span>
                          {isCTQ && <span className="badge badge-ctq" style={{ fontSize: 9 }}>CTQ</span>}
                        </div>
                      </td>

                      <td className="font-mono">
                        {dim.type === 'TOLERANCE' ? `${dim.nominal.toFixed(3)} ${dim.unit}` : 'N/A'}
                      </td>

                      <td className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {dim.type === 'TOLERANCE' ? `[${dim.minAllowed.toFixed(3)} to ${dim.maxAllowed.toFixed(3)}]` : dim.type === 'MAX_LIMIT' ? `≤ ${dim.maxAllowed}` : 'Visual 100%'}
                      </td>

                      <td className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: isPass ? '#34d399' : '#f87171' }}>
                        {val} {dim.unit}
                      </td>

                      <td className="font-mono" style={{ fontSize: 11, color: isPass ? 'var(--text-secondary)' : '#f87171' }}>
                        {deviationText}
                      </td>

                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {m.toolUsed}
                      </td>

                      <td>
                        {isPass ? (
                          <span className="badge badge-pass" style={{ fontSize: 10 }}>✓ IN-TOL</span>
                        ) : (
                          <span className="badge badge-fail" style={{ fontSize: 10 }}>✗ OUT-OF-SPEC</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspector Remarks & Defect Evidence Photos Gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 16, marginBottom: 24 }}>
          
          {/* Remarks Card */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Inspector Floor Remarks:
            </span>
            <p style={{ marginTop: 6, fontSize: 13, color: '#f8fafc', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{insp.inspectorNotes || 'No specific remarks recorded.'}"
            </p>
          </div>

          {/* Photo Evidence Gallery */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={14} /> Attached Defect Photos ({insp.defectPhotos?.length || 0} attached):
            </span>
            <div style={{ display: 'flex', gap: 10, marginTop: 8, overflowX: 'auto' }}>
              {insp.defectPhotos && insp.defectPhotos.length > 0 ? (
                insp.defectPhotos.map((src, i) => (
                  <div key={i} style={{ width: 100, height: 75, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-medium)', flexShrink: 0 }}>
                    <img src={src} alt={`Defect proof ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No defect photos (100% conforming lot).</span>
              )}
            </div>
          </div>

        </div>

        {/* Conditional Concession Sub-Form */}
        {showConcessionForm && (
          <div style={{
            padding: 18,
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShieldAlert size={18} color="#f59e0b" />
              <h4 style={{ fontSize: 15, color: '#fbbf24' }}>Issue Official Conditional Concession Release (PRD Section 6.1)</h4>
            </div>

            <form onSubmit={handleExecuteConcession} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Mandatory Concession Reason Code:
                </label>
                <select 
                  value={concessionReasonCode} 
                  onChange={(e) => setConcessionReasonCode(e.target.value)}
                  style={{ backgroundColor: '#111827' }}
                >
                  <option value="CR-101: Minor Tool Wear Drift - Fits Secondary Assembly Envelope">CR-101: Minor Tool Wear Drift - Fits Secondary Assembly Envelope</option>
                  <option value="CR-102: Non-Functional Locator Step Permitted by Customer Drawing Note 4">CR-102: Non-Functional Locator Step Permitted by Customer Drawing Note 4</option>
                  <option value="CR-103: Material Hardness Upper Boundary Acceptable for Application">CR-103: Material Hardness Upper Boundary Acceptable for Application</option>
                  <option value="CR-104: Visual Surface Roughness Concession - Pre-Polishing Buffer">CR-104: Visual Surface Roughness Concession - Pre-Polishing Buffer</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Detailed Engineering Justification (Mandatory for Quality Audit):
                </label>
                <textarea 
                  rows={3} 
                  required
                  placeholder="Detail why this non-CTQ deviation does not compromise fit, form, or fatigue life..."
                  value={engineeringJustification}
                  onChange={(e) => setEngineeringJustification(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowConcessionForm(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-warning">
                  <CheckCircle size={16} />
                  <span>Authorize & Sign Concession Release</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rejection / Quarantine Sub-Form */}
        {showRejectionForm && (
          <div style={{
            padding: 18,
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '2px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            animation: 'slideUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertTriangle size={18} color="#ef4444" />
              <h4 style={{ fontSize: 15, color: '#f87171' }}>Reject & Dispatch to Digital Rejection Holding Area</h4>
            </div>

            <form onSubmit={handleExecuteRejection} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Rejection Reason & Non-Conformance Description:
                </label>
                <textarea 
                  rows={2} 
                  required
                  placeholder="State non-conformance details and instructions for Material Review Board (MRB)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowRejectionForm(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-danger">
                  <AlertOctagon size={16} />
                  <span>Execute Rejection & Route to Quarantine</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Decision Buttons */}
        {!showConcessionForm && !showRejectionForm && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 16,
            borderTop: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <button onClick={onClose} className="btn btn-outline">Back to Queue</button>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Option 1: Quarantine Rejection */}
              <button 
                onClick={() => setShowRejectionForm(true)}
                className="btn btn-danger"
              >
                <AlertTriangle size={16} />
                <span>Reject to Quarantine Holding Area</span>
              </button>

              {/* Option 2: Conditional Concession (STRICTLY BLOCKED IF CTQ FAILED) */}
              <button 
                onClick={() => {
                  if (hasCTQFailures) {
                    sounds.playAlarm();
                    alert("HARD INTERLOCK LOCKOUT (PRD Rule 4.3):\nConditional Concession is STRICTLY BLOCKED because this lot has an out-of-tolerance Critical-To-Quality (CTQ) parameter!\n\nCTQ items must be rejected to the Digital Rejection Holding Area.");
                    return;
                  }
                  setShowConcessionForm(true);
                  sounds.playClick();
                }}
                disabled={hasCTQFailures}
                className="btn btn-warning"
                title={hasCTQFailures ? "Blocked: CTQ items cannot be granted concessions" : "Issue conditional concession for non-CTQ slight drift"}
              >
                <ShieldAlert size={16} />
                <span>{hasCTQFailures ? '⛔ Concession Prohibited (CTQ)' : 'Grant Conditional Concession'}</span>
              </button>

              {/* Option 3: Standard Approval */}
              <button 
                onClick={handleApprove}
                disabled={hasCTQFailures}
                className="btn btn-success"
              >
                <CheckCircle size={16} />
                <span>Approve & Release Lot for Next Operation</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
