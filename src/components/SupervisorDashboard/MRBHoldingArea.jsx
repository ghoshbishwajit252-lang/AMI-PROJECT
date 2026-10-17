import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  Truck, 
  FileText, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function MRBHoldingArea() {
  const { factoryData, executeMRBDisposition, currentUser } = useApp();

  const [selectedWO, setSelectedWO] = useState(null);
  const [dispositionType, setDispositionType] = useState('REWORK');
  const [dispositionNotes, setDispositionNotes] = useState('');

  // Find all quarantined or MRB-handled work orders
  const quarantinedWOs = factoryData.workOrders.filter(
    w => w.overallStatus.includes('QUARANTINED') || w.overallStatus.includes('MRB')
  );

  const handleExecute = (e) => {
    e.preventDefault();
    if (!selectedWO) return;
    executeMRBDisposition(selectedWO.id, dispositionType, dispositionNotes || `${dispositionType} disposition authorized by MRB.`);
    setSelectedWO(null);
    setDispositionNotes('');
  };

  return (
    <div style={{ maxWidth: 1540, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Header */}
      <div className="card-glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={22} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: 22 }}>Digital Rejection Holding Area & MRB Portal</h1>
            <span className="badge badge-fail">{quarantinedWOs.length} Quarantined Lots</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            PRD Section 6.1 & 6.3: Downstream machines are electronically locked out from pulling quarantined lots until Material Review Board (MRB) execution.
          </p>
        </div>
      </div>

      {/* Quarantined Work Orders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 20 }}>
        {quarantinedWOs.length === 0 ? (
          <div className="card-glass" style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)' }}>
            ✓ No parts currently in Rejection Holding Area. All production lines conforming!
          </div>
        ) : (
          quarantinedWOs.map((wo) => {
            const q = wo.quarantineDetails;
            const isPendingMRB = !q?.mrbDisposition;

            return (
              <div 
                key={wo.id}
                className="card-glass"
                style={{
                  padding: 20,
                  border: isPendingMRB ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-medium)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  backgroundColor: isPendingMRB ? 'rgba(239, 68, 68, 0.05)' : undefined
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-fail" style={{ marginBottom: 4 }}>
                      <Lock size={11} /> DOWNSTREAM MACHINES LOCKED
                    </span>
                    <h3 style={{ fontSize: 17, color: '#fff' }}>{wo.id} - {wo.partNumber}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      Heat: <strong>{wo.heatNumber}</strong> • Batch: {wo.batchSize} pcs • Customer: {wo.customer}
                    </div>
                  </div>
                  <span className={`badge ${isPendingMRB ? 'badge-warn' : 'badge-pass'}`}>
                    {isPendingMRB ? 'Awaiting MRB' : wo.overallStatus}
                  </span>
                </div>

                {/* Location & Reason */}
                <div style={{ 
                  backgroundColor: 'rgba(0,0,0,0.3)', 
                  padding: '10px 12px', 
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171' }}>
                    <MapPin size={14} />
                    <span>Location: <strong>{q?.floorLocation || 'Quarantine Holding Bay'}</strong></span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Quarantined By: <strong>{q?.quarantinedBy || 'Quality System'}</strong> ({q?.quarantinedAt})
                  </div>
                  <div style={{ color: '#fff', fontStyle: 'italic', marginTop: 2 }}>
                    "{q?.reason || 'Critical non-conformance flag.'}"
                  </div>
                </div>

                {/* MRB Decision Status if already made */}
                {q?.mrbDisposition ? (
                  <div style={{ padding: '10px 12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                    <div style={{ fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} />
                      <span>MRB Disposition Executed: {q.mrbDisposition.type}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                      By: {q.mrbDisposition.decidedBy} ({q.mrbDisposition.decidedAt})
                    </div>
                    <div style={{ color: '#fff', marginTop: 2 }}>
                      {q.mrbDisposition.notes}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedWO(wo);
                      sounds.playClick();
                    }}
                    className="btn btn-danger"
                    style={{ marginTop: 'auto' }}
                  >
                    <span>Convene MRB & Execute 4-Way Disposition</span>
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MRB 4-Way Disposition Modal (PRD Section 6.3) */}
      {selectedWO && (
        <div className="modal-backdrop">
          <div className="modal-content modal-content-lg" style={{ padding: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={22} color="#ef4444" />
                <h2 style={{ fontSize: 18 }}>Material Review Board (MRB) Digital Disposition</h2>
              </div>
              <button onClick={() => setSelectedWO(null)} className="btn btn-ghost" style={{ padding: 4 }}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              PRD Section 6.3: Executing disposition for <strong>{selectedWO.id}</strong> (Part: {selectedWO.partNumber}, Heat: {selectedWO.heatNumber}, Qty: {selectedWO.batchSize} pcs).
            </p>

            <form onSubmit={handleExecute} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* 4 Disposition Options */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                {[
                  {
                    id: 'REWORK',
                    title: '1. Rework Order',
                    desc: 'Spawns corrective machining traveler to polish/re-turn within spec.',
                    icon: RotateCcw,
                    color: '#38bdf8'
                  },
                  {
                    id: 'SCRAP',
                    title: '2. Scrap Disposition',
                    desc: 'Permanently writes off material, logs scrap cost code, dumps to scrap bin.',
                    icon: Trash2,
                    color: '#ef4444'
                  },
                  {
                    id: 'RTV',
                    title: '3. Return to Vendor (RTV)',
                    desc: 'Routes raw material to dock, logs SNCR and issues vendor debit note.',
                    icon: Truck,
                    color: '#f59e0b'
                  },
                  {
                    id: 'CUSTOMER_CONCESSION',
                    title: '4. Customer Special Concession',
                    desc: 'Batch held pending formal written customer engineering waiver upload.',
                    icon: FileText,
                    color: '#c084fc'
                  },
                ].map((d) => {
                  const Icon = d.icon;
                  const isSelected = dispositionType === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => { setDispositionType(d.id); sounds.playClick(); }}
                      style={{
                        padding: 14,
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? d.color : 'var(--border-subtle)'}`,
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: d.color, fontWeight: 700, fontSize: 13 }}>
                        <Icon size={16} />
                        <span>{d.title}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>
                        {d.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Disposition Notes / Action plan */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  MRB Corrective Action Plan & Instructions:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    dispositionType === 'REWORK' 
                      ? "Specify rework steps: e.g. Rework Op 45 - Precision micro-polish bearing journal to 60.002 mm nominal."
                      : dispositionType === 'SCRAP'
                        ? "Enter scrap cost center #CC-401 and scrap bin confirmation serial."
                        : "Enter vendor RMA debit note / customer waiver details..."
                  }
                  value={dispositionNotes}
                  onChange={(e) => setDispositionNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                <button type="button" onClick={() => setSelectedWO(null)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={16} />
                  <span>Execute MRB Disposition ({dispositionType})</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
