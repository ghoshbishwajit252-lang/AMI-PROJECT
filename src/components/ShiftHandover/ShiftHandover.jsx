import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RotateCcw, CheckCircle2, UserCheck, AlertTriangle, Cpu, Wrench, ShieldCheck } from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function ShiftHandover() {
  const { factoryData, acknowledgeShiftHandover, currentUser } = useApp();

  return (
    <div style={{ maxWidth: 1540, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header */}
      <div className="card-glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(139, 92, 246, 0.4)'
            }}>
              <RotateCcw size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22 }}>Digital Shift Handover Logbook</h1>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                PRD Section 12.2: Formal station handover capturing active work orders, tool wear, scrap counts, and machine health before shift start.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Handover Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {factoryData.shiftHandovers.map(sh => (
          <div key={sh.id} className="card-glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: 4 }}>{sh.station}</span>
                <h3 style={{ fontSize: 18, color: '#fff' }}>{sh.outgoingShift} → {sh.incomingShift}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Outgoing Lead: <strong style={{ color: '#fff' }}>{sh.outgoingOperator}</strong> • Log Timestamp: {sh.timestamp}
                </div>
              </div>

              <div>
                {sh.acknowledged ? (
                  <span className="badge badge-pass" style={{ padding: '6px 12px', fontSize: 12 }}>
                    <CheckCircle2 size={13} /> Acknowledged by {sh.acknowledgedBy} ({sh.acknowledgedAt})
                  </span>
                ) : (
                  <span className="badge badge-warn" style={{ padding: '6px 12px', fontSize: 12 }}>
                    ⏳ Awaiting Incoming Worker Acknowledgment
                  </span>
                )}
              </div>
            </div>

            {/* Handover Metrics & Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parts Produced</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399', marginTop: 2 }}>{sh.partsProduced} pcs</div>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, fontSize: 13 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scrap Count</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: sh.scrapCount > 0 ? '#f87171' : '#34d399', marginTop: 2 }}>{sh.scrapCount} pcs</div>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, fontSize: 13, gridColumn: 'span 2' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Jobs Running</div>
                <div style={{ color: '#fff', marginTop: 4 }}>{sh.activeJobs}</div>
              </div>
            </div>

            {/* Tooling Wear & Machine Health Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                  <Wrench size={14} /> Tool Wear & Insert Status:
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {sh.toolWearNotes}
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                  <Cpu size={14} /> Machine Health & Lubrication:
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {sh.machineHealth}
                </div>
              </div>
            </div>

            {/* Acknowledge Action */}
            {!sh.acknowledged && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => acknowledgeShiftHandover(sh.id)}
                  className="btn btn-primary"
                >
                  <UserCheck size={16} />
                  <span>Digitally Acknowledge & Take Over Shift</span>
                </button>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}
