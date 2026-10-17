import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ScrollText, ShieldCheck, Filter, Download, Lock, CheckCircle2 } from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function AuditTrail() {
  const { factoryData } = useApp();

  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = factoryData.auditLogs.filter(log => {
    if (filterAction !== 'ALL' && !log.action.includes(filterAction)) return false;
    if (searchTerm && !JSON.stringify(log).toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    sounds.playClick();
    const headers = ["Log ID", "Timestamp", "User ID", "Role", "IP Address", "Device Serial", "Action", "Details", "Previous Value", "New Value"];
    const rows = filteredLogs.map(l => [
      l.id, l.timestamp, `"${l.userId}"`, l.role, l.ipAddress, l.deviceSerial, l.action, `"${l.details}"`, `"${l.prevValue}"`, `"${l.newValue}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZAPUZA_AUDIT_TRAIL_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              background: 'linear-gradient(135deg, #10b981, #047857)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)'
            }}>
              <ScrollText size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 22 }}>Immutable Tamper-Proof Quality Audit Log</h1>
                <span className="badge badge-pass"><ShieldCheck size={12} /> Cryptographically Signed</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                PRD Section 13.3: Every measurement, supervisor sign-off, concession grant, and PIN modification is permanently logged with IP, device ID, and before/after diffs.
              </span>
            </div>
          </div>
        </div>

        <button onClick={exportCSV} className="btn btn-primary" style={{ fontSize: 13 }}>
          <Download size={15} />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card-glass" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 260 }}>
          <input 
            type="text" 
            placeholder="Search audit trail by user, action, IP, or part..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 360, fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'INSPECTION', label: 'Inspections' },
            { id: 'SUPERVISOR', label: 'Supervisor Approvals' },
            { id: 'CONCESSION', label: 'Concessions' },
            { id: 'HOLD', label: 'Hold Timers' },
            { id: 'SHIPPING', label: 'Shipping Interlocks' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setFilterAction(f.id); sounds.playClick(); }}
              className={`btn ${filterAction === f.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 12px', fontSize: 11 }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-glass" style={{ overflow: 'hidden' }}>
        <table className="table-custom">
          <thead>
            <tr>
              <th>Log ID & Timestamp</th>
              <th>User & Origin Device</th>
              <th>Action Event</th>
              <th>Event Description</th>
              <th>Previous State</th>
              <th>New State</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td>
                  <div className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>{log.id}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.timestamp}</div>
                </td>

                <td>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{log.userId}</div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    IP: {log.ipAddress} • {log.deviceSerial}
                  </div>
                </td>

                <td>
                  <span className="badge badge-cyan" style={{ fontSize: 10 }}>
                    {log.action}
                  </span>
                </td>

                <td style={{ maxWidth: 320, fontSize: 12, color: 'var(--text-primary)' }}>
                  {log.details}
                </td>

                <td className="font-mono" style={{ fontSize: 11, color: '#f87171' }}>
                  {log.prevValue}
                </td>

                <td className="font-mono" style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                  {log.newValue}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
