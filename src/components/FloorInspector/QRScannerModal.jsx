import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  QrCode, 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Camera, 
  Cpu, 
  FileText,
  AlertOctagon
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function QRScannerModal({ isOpen, onClose, onScanComplete }) {
  const { factoryData } = useApp();

  const [scannedStation, setScannedStation] = useState(null);
  const [scannedTraveler, setScannedTraveler] = useState(null);
  const [stationPmError, setStationPmError] = useState(null);

  if (!isOpen) return null;

  // Handle Scanning Station QR
  const handleScanStation = (machine) => {
    sounds.playClick();
    if (machine.pmStatus === 'OVERDUE') {
      sounds.playAlarm();
      setStationPmError(`PM OVERDUE LOCKOUT (PRD Section 2.2): Machine ${machine.name} preventive maintenance is overdue by 26 hours. Job selection is strictly disabled until signed off by Maintenance!`);
      setScannedStation(null);
      return;
    }

    setStationPmError(null);
    setScannedStation(machine);
    sounds.playPass();
  };

  // Handle Scanning Traveler Barcode
  const handleScanTraveler = (wo) => {
    sounds.playClick();
    setScannedTraveler(wo);
    sounds.playPass();
  };

  const handleConfirm = () => {
    if (scannedStation && scannedTraveler) {
      onScanComplete(scannedStation, scannedTraveler);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-content-lg" style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid #06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={22} color="#06b6d4" />
            </div>
            <div>
              <h2 style={{ fontSize: 18 }}>Physical Presence Dual QR Verification</h2>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                PRD Rule 5.1: Manual keyboard search disabled. Must scan workstation QR and traveler barcode.
              </span>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* PM Overdue Error Alert (PRD Section 2.2) */}
        {stationPmError && (
          <div style={{
            padding: 16,
            backgroundColor: 'var(--status-fail-bg)',
            border: '2px solid var(--status-fail-border)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            animation: 'pulseFail 1.5s infinite'
          }}>
            <AlertOctagon size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>
                MACHINE CALIBRATION LOCK ENGAGED
              </div>
              <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 4, lineHeight: 1.4 }}>
                {stationPmError}
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#f87171' }}>
                An automated alert has been dispatched to Maintenance Supervisor.
              </div>
            </div>
          </div>
        )}

        {/* Dual Verification Flow */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          
          {/* STEP 1: Scan Station QR */}
          <div style={{
            backgroundColor: scannedStation ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${scannedStation ? 'var(--status-pass-border)' : 'var(--border-medium)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-cyan">STEP 1: STATION QR</span>
              {scannedStation ? (
                <span className="badge badge-pass"><CheckCircle2 size={13} /> Verified</span>
              ) : (
                <span className="badge badge-warn">Awaiting Scan</span>
              )}
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Scan physical QR plate mounted on machine frame:
            </div>

            {/* Quick Simulate Buttons for Evaluation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {factoryData.machines.map((m) => {
                const isSelected = scannedStation?.id === m.id;
                const isOverdue = m.pmStatus === 'OVERDUE';
                return (
                  <button
                    key={m.id}
                    onClick={() => handleScanStation(m)}
                    className={`btn ${isSelected ? 'btn-success' : 'btn-outline'}`}
                    style={{
                      justifyContent: 'flex-start',
                      padding: '10px 12px',
                      fontSize: 12,
                      borderColor: isOverdue ? '#ef4444' : undefined
                    }}
                  >
                    <Scan size={14} color={isOverdue ? '#ef4444' : '#06b6d4'} />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: isOverdue ? '#f87171' : 'var(--text-muted)' }}>
                        {isOverdue ? '⚠️ PM OVERDUE (Click to test lockout)' : `✓ PM Valid (${m.pmInspector})`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Scan Traveler Barcode */}
          <div style={{
            backgroundColor: scannedTraveler ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${scannedTraveler ? 'var(--status-pass-border)' : 'var(--border-medium)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-cyan">STEP 2: TRAVELER BARCODE</span>
              {scannedTraveler ? (
                <span className="badge badge-pass"><CheckCircle2 size={13} /> Scanned</span>
              ) : (
                <span className="badge badge-warn">Awaiting Scan</span>
              )}
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Scan barcode printed on physical Job Traveler sheet:
            </div>

            {/* Quick Simulate Work Orders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {factoryData.workOrders.map((wo) => {
                const isSelected = scannedTraveler?.id === wo.id;
                return (
                  <button
                    key={wo.id}
                    onClick={() => handleScanTraveler(wo)}
                    className={`btn ${isSelected ? 'btn-success' : 'btn-outline'}`}
                    style={{
                      justifyContent: 'flex-start',
                      padding: '10px 12px',
                      fontSize: 12
                    }}
                  >
                    <FileText size={14} color="#38bdf8" />
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{wo.id} - {wo.partNumber}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        Qty: {wo.batchSize} pcs • Heat: {wo.heatNumber} • Status: {wo.overallStatus}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Physical presence locks ensure quality checks happen only at the workstation.
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} className="btn btn-outline">Cancel</button>
            <button
              onClick={handleConfirm}
              disabled={!scannedStation || !scannedTraveler}
              className="btn btn-primary"
            >
              <CheckCircle2 size={16} />
              <span>Unlock & Open Inspection Checklist</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
