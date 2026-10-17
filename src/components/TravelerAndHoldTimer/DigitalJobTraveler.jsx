import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Flame, 
  Clock, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Zap, 
  AlertOctagon, 
  ArrowRight, 
  Layers, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function DigitalJobTraveler() {
  const { 
    factoryData, 
    selectedWorkOrderId, 
    setSelectedWorkOrderId, 
    completeHoldTimer,
    currentUser 
  } = useApp();

  const [activeWOId, setActiveWOId] = useState(selectedWorkOrderId);
  const [interlockModal, setInterlockModal] = useState(null);

  const activeWO = factoryData.workOrders.find(w => w.id === activeWOId) || factoryData.workOrders[0];

  const formatTime = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return "00:00:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Attempt to scan into operation
  const handleAttemptOperation = (op, prevOp) => {
    // Check strict numerical sequence lock (PRD Section 7.1)
    if (prevOp && prevOp.status !== 'COMPLETED' && prevOp.status !== 'APPROVED' && prevOp.status !== 'CONCESSION_GRANTED') {
      sounds.playAlarm();
      setInterlockModal({
        type: 'SEQUENCE_LOCK',
        title: 'STRICT NUMERICAL SEQUENCE LOCKOUT',
        message: `PRD Rule 7.1: Operators cannot start Op ${op.opNumber} (${op.name}) because preceding Op ${prevOp.opNumber} (${prevOp.name}) is incomplete!`,
        action: 'Previous operation must be 100% finished and signed off.',
        isCritical: true,
      });
      return;
    }

    // Check automated process cooling hold timer interlock (PRD Section 8.2)
    if (prevOp && prevOp.requiresHoldTimer && prevOp.isHoldActive && prevOp.remainingSeconds > 0) {
      sounds.playAlarm();
      const remainingMin = Math.ceil(prevOp.remainingSeconds / 60);
      const remainingHr = Math.floor(remainingMin / 60);
      const remM = remainingMin % 60;
      const formattedRemain = `${remainingHr} hr ${remM} min remaining`;

      setInterlockModal({
        type: 'HOLD_INTERLOCK',
        title: `MANDATORY COOLING HOLD ACTIVE (${formattedRemain})`,
        message: `PRD Section 8.2 Hard Interlock: Job lot finished Heat Treatment Discharge, but parts are undergoing mandatory thermal cooling/stabilization. Machining before zero cooldown causes severe micro-cracking and dimensional distortion!`,
        remainingTime: formatTime(prevOp.remainingSeconds),
        action: 'Machining locked until countdown timer reaches 00:00:00.',
        isCritical: true,
      });
      return;
    }

    sounds.playPass();
    alert(`✓ Operation ${op.opNumber} (${op.name}) is authorized to start!`);
  };

  return (
    <div style={{ maxWidth: 1540, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Top Traveler Banner */}
      <div className="card-glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)'
            }}>
              <Flame size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22 }}>Digital Job Traveler & Sequential Routing Engine</h1>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                PRD Section 7 & 8: Sequential operation gatekeeping, process aging timers, and automated cooling interlocks.
              </span>
            </div>
          </div>
        </div>

        {/* Work Order Switcher for Demonstration */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select Traveler:</span>
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

      {/* Traveler Header Details */}
      <div className="card-glass" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Traveler Barcode</div>
          <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>{activeWO.travelerBarcode}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Component & Material</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{activeWO.partNumber} ({activeWO.partName})</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Raw Material Heat Lot</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>#{activeWO.heatNumber} (MTC Verified)</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Batch Size & PO</div>
          <div style={{ fontSize: 14, color: '#fff' }}>{activeWO.batchSize} Units • {activeWO.customerPO}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall Lot Status</div>
          <span className="badge badge-cyan" style={{ marginTop: 2 }}>{activeWO.overallStatus}</span>
        </div>
      </div>

      {/* Active Cooling Hold Highlight Banner if WO-2026-002 */}
      {activeWO.operations.some(o => o.requiresHoldTimer && o.isHoldActive) && (
        <div style={{
          padding: 20,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(139, 92, 246, 0.15))',
          border: '2px solid #f59e0b',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '2px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulseFail 1.5s infinite'
            }}>
              <Clock size={28} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>
                MANDATORY COOLING / PROCESS AGING HOLD IN PROGRESS (PRD Section 8.2)
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                Op 30 Heat Treatment Discharge cooling hold active. <strong>Op 40 Precision Grinding is locked out.</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Live Animated Countdown */}
            <div style={{
              backgroundColor: '#000',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Time Remaining</div>
              <div className="font-mono" style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.05em' }}>
                {formatTime(activeWO.operations.find(o => o.requiresHoldTimer)?.remainingSeconds)}
              </div>
            </div>

            {/* Test Helper: Override / Complete Hold Timer */}
            <button
              onClick={() => completeHoldTimer(activeWO.id)}
              className="btn btn-warning"
              style={{ fontSize: 12, padding: '10px 14px' }}
              title="Fast-forward cooling hold countdown to 0 for demo evaluation"
            >
              <Zap size={14} />
              <span>Fast-Forward Hold (Test)</span>
            </button>
          </div>
        </div>
      )}

      {/* Sequential Process Stepper List (PRD Section 7.1) */}
      <div className="card-glass" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 17, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#06b6d4" />
          <span>Sequential Manufacturing Routing (Strict Op-by-Op Locks)</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {activeWO.operations.map((op, idx) => {
            const prevOp = idx > 0 ? activeWO.operations[idx - 1] : null;
            const isCompleted = op.status === 'COMPLETED' || op.status === 'APPROVED' || op.status === 'CONCESSION_GRANTED';
            const isHoldActive = op.requiresHoldTimer && op.isHoldActive;
            const isNextEligible = prevOp ? (prevOp.status === 'COMPLETED' || prevOp.status === 'APPROVED' || prevOp.status === 'CONCESSION_GRANTED') && !isCompleted : !isCompleted;

            return (
              <div
                key={op.opNumber}
                style={{
                  backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.05)' : isHoldActive ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isCompleted ? 'var(--status-pass-border)' : isHoldActive ? '#f59e0b' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 18,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 16
                }}
              >
                {/* Op Number & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    backgroundColor: isCompleted ? '#10b981' : isHoldActive ? '#f59e0b' : '#1e293b',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    boxShadow: isCompleted ? '0 0 12px rgba(16, 185, 129, 0.4)' : undefined
                  }}>
                    {isCompleted ? <CheckCircle2 size={22} /> : `Op ${op.opNumber}`}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h4 style={{ fontSize: 16, color: '#fff' }}>{op.name}</h4>
                      {op.requiresHoldTimer && (
                        <span className="badge badge-warn" style={{ fontSize: 10 }}>
                          <Clock size={11} /> 4-Hr Cooling Hold
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Workstation: <strong style={{ color: '#38bdf8' }}>{op.workstation}</strong> • Target Cycle: {op.cycleTimeMin} min
                    </div>
                  </div>
                </div>

                {/* Operator Sign-off & Timestamps */}
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', minWidth: 180 }}>
                  {isCompleted ? (
                    <div>
                      <div style={{ color: '#34d399', fontWeight: 600 }}>✓ Signed & Cleared</div>
                      <div>Op: {op.operator}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{op.signedAt}</div>
                    </div>
                  ) : isHoldActive ? (
                    <div style={{ color: '#fbbf24', fontWeight: 600 }}>
                      ⏳ Cooling In Progress ({formatTime(op.remainingSeconds)})
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Awaiting Sign-off</div>
                  )}
                </div>

                {/* Interactive Scan / Action Button */}
                <div>
                  {isCompleted ? (
                    <span className="badge badge-pass" style={{ padding: '8px 14px' }}>
                      ✓ Operation Completed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAttemptOperation(op, prevOp)}
                      className={`btn ${isHoldActive ? 'btn-warning' : isNextEligible ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: 12, padding: '8px 14px' }}
                    >
                      {isHoldActive ? (
                        <>
                          <Clock size={14} />
                          <span>Hold Active</span>
                        </>
                      ) : isNextEligible ? (
                        <>
                          <Play size={14} />
                          <span>Scan & Begin Op {op.opNumber}</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          <span>Sequence Locked</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Interlock Locked Out Screen / Modal (PRD Section 8.2) */}
      {interlockModal && (
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
                  HARDWARE INTERLOCK ACTIVE
                </span>
                <h2 style={{ fontSize: 20, color: '#f87171', fontWeight: 800 }}>
                  {interlockModal.title}
                </h2>

                <p style={{ fontSize: 13, color: '#fca5a5', marginTop: 10, lineHeight: 1.5 }}>
                  {interlockModal.message}
                </p>

                {interlockModal.remainingTime && (
                  <div style={{ 
                    marginTop: 14, 
                    padding: '12px 16px', 
                    backgroundColor: 'rgba(0,0,0,0.6)', 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: 12, color: '#fff' }}>Remaining Cooling Time:</span>
                    <span className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: '#f87171' }}>
                      {interlockModal.remainingTime}
                    </span>
                  </div>
                )}

                <div style={{
                  marginTop: 14,
                  padding: 10,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 12,
                  color: '#f87171',
                  fontWeight: 600
                }}>
                  {interlockModal.action}
                </div>

                <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setInterlockModal(null)} className="btn btn-danger">
                    Acknowledge Lockout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
