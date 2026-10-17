import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileCheck2, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  Eye, 
  Filter, 
  UserCheck,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import ReviewModal from './ReviewModal';
import { sounds } from '../../utils/audio';

export default function ApprovalQueue() {
  const { factoryData, currentUser } = useApp();

  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL | PENDING | CONCESSION | APPROVED | REJECTED
  const [selectedWOForReview, setSelectedWOForReview] = useState(null);

  // Filter queue work orders
  const reviewableWOs = factoryData.workOrders.filter(wo => {
    if (filterStatus === 'PENDING') return wo.overallStatus === 'AWAITING_SUPERVISOR_APPROVAL';
    if (filterStatus === 'CONCESSION') return wo.hasConcession;
    if (filterStatus === 'APPROVED') return wo.overallStatus === 'READY_FOR_DISPATCH' || wo.overallStatus === 'DISPATCHED';
    if (filterStatus === 'REJECTED') return wo.overallStatus.includes('QUARANTINED') || wo.overallStatus.includes('MRB');
    return true;
  });

  const pendingCount = factoryData.workOrders.filter(w => w.overallStatus === 'AWAITING_SUPERVISOR_APPROVAL').length;

  return (
    <div style={{ maxWidth: 1540, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Top Queue Header */}
      <div className="card-glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileCheck2 size={22} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: 22 }}>Shift Supervisor Quality Approval Queue</h1>
            {pendingCount > 0 && (
              <span className="badge badge-warn" style={{ fontSize: 12 }}>
                {pendingCount} Awaiting Decision
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            PRD Section 6.1: Real-time decision stream for PDI checklists, dimensional verification, conditional concessions, and quarantine dispatches.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Jobs' },
            { id: 'PENDING', label: `Pending Review (${pendingCount})` },
            { id: 'APPROVED', label: 'Approved Cleared' },
            { id: 'CONCESSION', label: 'Concessions' },
            { id: 'REJECTED', label: 'Quarantine / Rejection' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setFilterStatus(f.id); sounds.playClick(); }}
              className={`btn ${filterStatus === f.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '7px 13px', fontSize: 12 }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table Card */}
      <div className="card-glass" style={{ overflow: 'hidden' }}>
        <table className="table-custom">
          <thead>
            <tr>
              <th>Work Order / Barcode</th>
              <th>Part & Heat Number</th>
              <th>Inspector & Submitted</th>
              <th>Dimensions Status</th>
              <th>CTQ Safeguard</th>
              <th>Queue Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviewableWOs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  No jobs currently match this filter.
                </td>
              </tr>
            ) : (
              reviewableWOs.map((wo) => {
                const insp = wo.inspectionData;
                const hasFailures = insp?.hasFailures;
                const hasCTQ = insp?.hasCTQFailures;

                let statusBadge = <span className="badge badge-cyan">{wo.overallStatus}</span>;
                if (wo.overallStatus === 'AWAITING_SUPERVISOR_APPROVAL') {
                  statusBadge = <span className="badge badge-warn" style={{ animation: 'pulseFail 2s infinite' }}>⏳ Pending Review</span>;
                } else if (wo.overallStatus === 'READY_FOR_DISPATCH' || wo.overallStatus === 'DISPATCHED') {
                  statusBadge = <span className="badge badge-pass">✓ Approved / Cleared</span>;
                } else if (wo.overallStatus.includes('QUARANTINED') || wo.overallStatus.includes('MRB')) {
                  statusBadge = <span className="badge badge-fail">⛔ Quarantined MRB</span>;
                }

                return (
                  <tr key={wo.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{wo.id}</div>
                      <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {wo.travelerBarcode}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{wo.partNumber}</div>
                      <div style={{ fontSize: 11, color: '#38bdf8' }}>
                        Heat Lot: <strong>{wo.heatNumber}</strong> • Qty: {wo.batchSize} pcs
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: 13 }}>{insp ? insp.inspectorId : 'N/A'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {insp?.submittedAt || 'Not submitted'}
                      </div>
                    </td>

                    <td>
                      {insp ? (
                        <div>
                          {hasFailures ? (
                            <span style={{ color: '#f87171', fontWeight: 600, fontSize: 12 }}>
                              ⚠️ Out of Spec Detected
                            </span>
                          ) : (
                            <span style={{ color: '#34d399', fontWeight: 600, fontSize: 12 }}>
                              ✓ 100% In-Tolerance
                            </span>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {Object.keys(insp.measurements || {}).length} Dimensions Checked
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pending Floor Inspection</span>
                      )}
                    </td>

                    <td>
                      {hasCTQ ? (
                        <span className="badge badge-ctq">
                          <AlertOctagon size={12} /> CTQ FAIL (LOCKED)
                        </span>
                      ) : (
                        <span className="badge badge-pass">
                          ✓ CTQ Conforming
                        </span>
                      )}
                    </td>

                    <td>{statusBadge}</td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedWOForReview(wo);
                          sounds.playClick();
                        }}
                        className={`btn ${wo.overallStatus === 'AWAITING_SUPERVISOR_APPROVAL' ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        <Eye size={14} />
                        <span>{wo.overallStatus === 'AWAITING_SUPERVISOR_APPROVAL' ? 'Review & Decide' : 'View Audit'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedWOForReview && (
        <ReviewModal
          workOrder={selectedWOForReview}
          onClose={() => setSelectedWOForReview(null)}
        />
      )}

    </div>
  );
}
