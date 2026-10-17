import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import BlueprintCanvas from '../BlueprintStudio/BlueprintCanvas';
import QRScannerModal from './QRScannerModal';
import PhotoCaptureModal from './PhotoCaptureModal';
import { 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Camera, 
  Lock, 
  Unlock, 
  Wrench, 
  AlertOctagon, 
  Send,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function InspectorTablet() {
  const { 
    factoryData, 
    currentUser, 
    selectedWorkOrderId, 
    setSelectedWorkOrderId, 
    submitInspection,
    gloveMode 
  } = useApp();

  const [activeWO, setActiveWO] = useState(() => {
    return factoryData.workOrders.find(w => w.id === selectedWorkOrderId) || factoryData.workOrders[0];
  });

  // Track station verification state
  const [stationVerified, setStationVerified] = useState(false);
  const [activeStation, setActiveStation] = useState(factoryData.machines[0]);
  const [showQRModal, setShowQRModal] = useState(false);

  // Active template
  const template = factoryData.templates.find(t => t.partNumber === activeWO.partNumber) || factoryData.templates[0];

  // Selected Pin synchronization
  const [selectedPinId, setSelectedPinId] = useState(template.dimensions[0].id);

  // Measurements state: { [dimId]: { value: string, pass: boolean | null, toolUsed: string, isCTQ: boolean, errorMsg: string } }
  const [measurements, setMeasurements] = useState({});
  const [toolAssignments, setToolAssignments] = useState({});

  // Mandatory Defect Photos state
  const [defectPhotos, setDefectPhotos] = useState([]);
  const [photoModalConfig, setPhotoModalConfig] = useState(null); // { dimId, dimName, value, specLimits, isCTQ }
  const [expiredToolAlert, setExpiredToolAlert] = useState(null);
  const [inspectorNotes, setInspectorNotes] = useState('');

  // Sync activeWO when selectedWorkOrderId changes
  useEffect(() => {
    const found = factoryData.workOrders.find(w => w.id === selectedWorkOrderId);
    if (found) {
      setActiveWO(found);
      // If WO already has inspectionData, preload it
      if (found.inspectionData) {
        const loadedMeasurements = {};
        const loadedTools = {};
        Object.entries(found.inspectionData.measurements).forEach(([k, v]) => {
          loadedMeasurements[k] = {
            value: v.value !== undefined ? String(v.value) : '',
            pass: v.pass,
            toolUsed: v.toolUsed,
            isCTQ: v.isCTQ,
            errorMsg: v.errorMsg || '',
          };
          loadedTools[k] = v.toolUsed;
        });
        setMeasurements(loadedMeasurements);
        setToolAssignments(loadedTools);
        setDefectPhotos(found.inspectionData.defectPhotos || []);
        setInspectorNotes(found.inspectionData.inspectorNotes || '');
        setStationVerified(true);
      } else {
        // Initialize default tool assignments from template
        const defaults = {};
        template.dimensions.forEach(d => {
          defaults[d.id] = d.toolRequired;
        });
        setToolAssignments(defaults);
        setMeasurements({});
        setDefectPhotos([]);
        setInspectorNotes('');
        setStationVerified(false);
      }
    }
  }, [selectedWorkOrderId, factoryData.workOrders]);

  // When Dual QR is completed
  const handleScanComplete = (machine, wo) => {
    setActiveStation(machine);
    setSelectedWorkOrderId(wo.id);
    setActiveWO(wo);
    setStationVerified(true);
    sounds.playPass();
  };

  // Handle Tool Change with PRD Section 2.3 Expiry Interlock Check
  const handleToolChange = (dimId, gaugeId) => {
    const gauge = factoryData.gauges.find(g => g.id === gaugeId);
    if (gauge && gauge.status === 'EXPIRED') {
      sounds.playAlarm();
      setExpiredToolAlert({
        gaugeId: gauge.id,
        name: gauge.name,
        serial: gauge.serialNumber,
        expiry: gauge.calibrationExpiry,
        dimId
      });
      // Do not assign expired tool
      return;
    }
    setToolAssignments(prev => ({ ...prev, [dimId]: gaugeId }));
    sounds.playClick();
  };

  // Evaluate single measurement
  const evaluateValue = (dim, valStr) => {
    if (valStr === '' || valStr === undefined || valStr === null) {
      return { pass: null, errorMsg: '' };
    }

    if (dim.type === 'PASS_FAIL') {
      const isPass = valStr === '1' || valStr === 'PASS' || valStr === 1;
      return {
        pass: isPass,
        errorMsg: isPass ? '' : 'Visual non-conformance recorded'
      };
    }

    const num = parseFloat(valStr);
    if (isNaN(num)) {
      return { pass: null, errorMsg: 'Invalid numeric value' };
    }

    if (dim.type === 'MAX_LIMIT') {
      const isPass = num <= dim.maxAllowed;
      return {
        pass: isPass,
        errorMsg: isPass ? '' : `Exceeds max allowed ${dim.maxAllowed} ${dim.unit}`
      };
    }

    // Default: TOLERANCE
    const isPass = num >= dim.minAllowed && num <= dim.maxAllowed;
    let errorMsg = '';
    if (!isPass) {
      if (num < dim.minAllowed) {
        errorMsg = `Under lower limit by ${(dim.minAllowed - num).toFixed(4)} ${dim.unit}`;
      } else {
        errorMsg = `Over upper limit by ${(num - dim.maxAllowed).toFixed(4)} ${dim.unit}`;
      }
    }

    return { pass: isPass, errorMsg };
  };

  // Handle measurement input
  const handleInputChange = (dim, value) => {
    const evalResult = evaluateValue(dim, value);

    const updated = {
      ...measurements,
      [dim.id]: {
        value,
        pass: evalResult.pass,
        toolUsed: toolAssignments[dim.id] || dim.toolRequired,
        isCTQ: dim.isCTQ,
        errorMsg: evalResult.errorMsg,
      }
    };

    setMeasurements(updated);

    if (evalResult.pass === true) {
      sounds.playPass();
    } else if (evalResult.pass === false) {
      sounds.playFail();

      // Trigger Mandatory Defect Photo Capture Workflow (PRD Section 5.4)
      if (defectPhotos.length < 2) {
        setPhotoModalConfig({
          dimId: dim.id,
          dimensionName: dim.name,
          measuredValue: value,
          specLimits: dim.type === 'MAX_LIMIT' 
            ? `Max ${dim.maxAllowed}` 
            : `${dim.nominal} [${dim.lowerTol}, +${dim.upperTol}]`,
          isCTQ: dim.isCTQ
        });
      }
    }
  };

  // Check overall form readiness
  const totalDimensions = template.dimensions.length;
  const enteredDimensions = Object.values(measurements).filter(m => m.value !== '' && m.value !== undefined).length;
  const hasFailures = Object.values(measurements).some(m => m.pass === false);
  const hasCTQFailures = Object.values(measurements).some(m => m.isCTQ && m.pass === false);
  const photosRequiredAndMissing = hasFailures && defectPhotos.length < 2;
  const canSubmit = stationVerified && enteredDimensions === totalDimensions && !photosRequiredAndMissing;

  // Auto-Fill In-Spec Demo Preset
  const handleFillInSpecPreset = () => {
    const filled = {};
    template.dimensions.forEach(dim => {
      let val;
      if (dim.type === 'PASS_FAIL') val = '1';
      else if (dim.type === 'MAX_LIMIT') val = (dim.maxAllowed * 0.7).toFixed(2);
      else val = (dim.nominal + (dim.upperTol + dim.lowerTol) / 2).toFixed(3);

      filled[dim.id] = {
        value: String(val),
        pass: true,
        toolUsed: toolAssignments[dim.id] || dim.toolRequired,
        isCTQ: dim.isCTQ,
        errorMsg: '',
      };
    });
    setMeasurements(filled);
    sounds.playPass();
  };

  // Auto-Fill Non-CTQ Out of Tolerance Preset
  const handleFillNonCTQDriftPreset = () => {
    const filled = {};
    template.dimensions.forEach(dim => {
      if (dim.id === 'DIM-02') {
        // Non-CTQ Step Shoulder (Nominal 55.000, Max 55.020) -> 55.028 mm
        filled[dim.id] = {
          value: '55.028',
          pass: false,
          toolUsed: 'VC-104',
          isCTQ: false,
          errorMsg: 'Over upper limit by +0.008 mm'
        };
      } else {
        let val = dim.type === 'PASS_FAIL' ? '1' : dim.type === 'MAX_LIMIT' ? '0.28' : dim.nominal.toFixed(3);
        filled[dim.id] = {
          value: String(val),
          pass: true,
          toolUsed: toolAssignments[dim.id] || dim.toolRequired,
          isCTQ: dim.isCTQ,
          errorMsg: ''
        };
      }
    });
    setMeasurements(filled);
    setDefectPhotos([
      "/assets/defect_shaft_reading.jpg",
      "/assets/defect_shaft_reading.jpg"
    ]);
    sounds.playFail();
  };

  // Auto-Fill CTQ Critical Failure Preset
  const handleFillCTQFailurePreset = () => {
    const filled = {};
    template.dimensions.forEach(dim => {
      if (dim.id === 'DIM-01') {
        // CTQ Bearing Journal (Nominal 60.000, Max 60.005) -> 60.035 mm
        filled[dim.id] = {
          value: '60.035',
          pass: false,
          toolUsed: 'MC-202',
          isCTQ: true,
          errorMsg: 'CTQ CRITICAL: +0.030 mm oversized'
        };
      } else {
        let val = dim.type === 'PASS_FAIL' ? '1' : dim.type === 'MAX_LIMIT' ? '0.25' : dim.nominal.toFixed(3);
        filled[dim.id] = {
          value: String(val),
          pass: true,
          toolUsed: toolAssignments[dim.id] || dim.toolRequired,
          isCTQ: dim.isCTQ,
          errorMsg: ''
        };
      }
    });
    setMeasurements(filled);
    setDefectPhotos([
      "/assets/defect_shaft_reading.jpg",
      "/assets/defect_shaft_reading.jpg"
    ]);
    sounds.playAlarm();
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const payload = {
      inspectorId: `${currentUser.name} (${currentUser.role})`,
      submittedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      stationQr: activeStation.qrCode,
      travelerBarcode: activeWO.travelerBarcode,
      measurements,
      hasFailures,
      hasCTQFailures,
      defectPhotos,
      inspectorNotes: inspectorNotes || (hasFailures ? "Out of tolerance flagged during inspection." : "All dimensions nominal and verified."),
    };

    submitInspection(activeWO.id, payload);
  };

  return (
    <div style={{ maxWidth: 1540, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Tablet Top Status Bar */}
      <div className="card-glass" style={{ padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        
        {/* Physical Presence Lock Status (PRD Rule 5.1) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 'var(--radius-md)',
            backgroundColor: stationVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `2px solid ${stationVerified ? '#10b981' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {stationVerified ? <Unlock size={22} color="#10b981" /> : <Lock size={22} color="#ef4444" />}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 18 }}>Shopfloor Quality Inspector Tablet</h2>
              {stationVerified ? (
                <span className="badge badge-pass"><CheckCircle2 size={12} /> Station Verified</span>
              ) : (
                <span className="badge badge-fail"><Lock size={12} /> Physical Presence Locked</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              {stationVerified ? (
                <span>Station: <strong style={{ color: '#fff' }}>{activeStation.name}</strong> • Job: <strong style={{ color: '#38bdf8' }}>{activeWO.id}</strong> (Heat: {activeWO.heatNumber})</span>
              ) : (
                <span style={{ color: '#f87171' }}>PRD Rule 5.1: Dual QR scan mandatory before entering inspection data.</span>
              )}
            </div>
          </div>
        </div>

        {/* Scan & Fast Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowQRModal(true)} 
            className={`btn ${stationVerified ? 'btn-outline' : 'btn-primary'}`}
            style={{ fontSize: 13 }}
          >
            <QrCode size={16} />
            <span>{stationVerified ? 'Re-Scan Workstation' : 'Scan Station & Traveler QR'}</span>
          </button>

          {/* Quick Demo Pre-Fillers for fast presentation */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => { setStationVerified(true); handleFillInSpecPreset(); }}
              className="btn btn-outline"
              style={{ fontSize: 11, padding: '6px 10px', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.4)' }}
              title="Fast fill: 100% in-spec passing values"
            >
              ✓ Fill Passing
            </button>
            <button
              onClick={() => { setStationVerified(true); handleFillNonCTQDriftPreset(); }}
              className="btn btn-outline"
              style={{ fontSize: 11, padding: '6px 10px', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              title="Fast fill: Non-CTQ deviation (concession eligible)"
            >
              ⚠️ Fill Non-CTQ Drift
            </button>
            <button
              onClick={() => { setStationVerified(true); handleFillCTQFailurePreset(); }}
              className="btn btn-outline"
              style={{ fontSize: 11, padding: '6px 10px', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              title="Fast fill: CTQ Failure (freezes checklist & concession)"
            >
              ⛔ Fill CTQ Defect
            </button>
          </div>
        </div>

      </div>

      {/* Expired Tool Calibration Modal Alert (PRD Section 2.3) */}
      {expiredToolAlert && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: 24, border: '2px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertOctagon size={28} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, color: '#f87171' }}>Expired Tool Calibration Lockout</h2>
                <span className="badge badge-fail" style={{ marginTop: 4, marginBottom: 8 }}>
                  PRD Section 2.3 Hard Interlock
                </span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The selected gauge <strong style={{ color: '#fff' }}>{expiredToolAlert.name} ({expiredToolAlert.id})</strong> calibration interval expired on <strong style={{ color: '#f87171' }}>{expiredToolAlert.expiry}</strong>.
                </p>
                <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 8, padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                  The tablet has blocked measurement entry with this tool. Please return this tool to the tool crib and obtain a newly calibrated gauge!
                </p>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setExpiredToolAlert(null)} className="btn btn-danger">
                    Acknowledge & Select Calibrated Tool
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTQ Freeze Banner if CTQ failed (PRD Section 4.3) */}
      {hasCTQFailures && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: 'var(--status-ctq-bg)',
          border: '2px solid var(--status-ctq-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'pulseCTQ 2s infinite'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldAlert size={28} color="#ff6b00" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#ff9944' }}>
                CRITICAL-TO-QUALITY (CTQ) FAILURE DETECTED • CHECKLIST FROZEN
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-bright)', marginTop: 2 }}>
                PRD Rule 4.3: Out-of-spec CTQ entries freeze the checklist, strictly prevent conditional supervisor concessions, and send alerts to the Quality Head. Lot will route directly to Rejection Holding Area.
              </div>
            </div>
          </div>
          <span className="badge badge-ctq" style={{ fontSize: 12, padding: '4px 10px' }}>
            ZERO-DEFECT LOCK
          </span>
        </div>
      )}

      {/* Main Two-Column Layout: Blueprint on Left, Linear Step-by-Step Checklist on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(460px, 1.4fr) minmax(480px, 1.6fr)', gap: 20 }}>
        
        {/* Left: Interactive CAD Blueprint with Pin Highlighting */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-glass" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>
                PART CAD BLUEPRINT (DWG: {template.partNumber})
              </span>
              <span className="badge badge-cyan">Tap Pin To Jump to Field</span>
            </div>

            <BlueprintCanvas 
              blueprintUrl={template.blueprintUrl}
              dimensions={template.dimensions}
              selectedDimId={selectedPinId}
              onSelectDim={setSelectedPinId}
              readOnly={true}
              results={measurements}
            />

            {/* Quick Inspection Summary Pill Bar */}
            <div style={{ 
              marginTop: 12, 
              padding: '10px 14px', 
              backgroundColor: 'rgba(0,0,0,0.3)', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12
            }}>
              <div>
                Progress: <strong>{enteredDimensions} / {totalDimensions}</strong> Measured
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ color: '#34d399' }}>✓ In-Tolerance: {Object.values(measurements).filter(m => m.pass === true).length}</span>
                <span style={{ color: '#f87171' }}>✗ Out-of-Spec: {Object.values(measurements).filter(m => m.pass === false).length}</span>
                {hasFailures && (
                  <span style={{ color: defectPhotos.length >= 2 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                    📷 Photos: {defectPhotos.length}/2
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Defect Photos Gallery in Inspector View */}
          {defectPhotos.length > 0 && (
            <div className="card-glass" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Camera size={16} /> Attached Defect Proof Photos ({defectPhotos.length}/2 min)
                </span>
                <button 
                  onClick={() => setPhotoModalConfig({
                    dimId: 'MANUAL',
                    dimensionName: 'Non-Conformance Gallery',
                    measuredValue: 'N/A',
                    specLimits: 'PRD Rule 5.4'
                  })}
                  className="btn btn-outline"
                  style={{ fontSize: 11, padding: '4px 8px' }}
                >
                  + Add Photos
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {defectPhotos.map((p, i) => (
                  <div key={i} style={{ width: 110, height: 80, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-medium)', flexShrink: 0 }}>
                    <img src={p} alt={`Defect ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Linear Step-by-Step Locked Inspection Checklist (PRD Section 5.2) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div className="card-glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16 }}>Step-by-Step Parameter Entries</h3>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  PRD Rule 5.2: Sequential entry locked. Values reactively evaluate on keystroke.
                </span>
              </div>
              <span className={`badge ${enteredDimensions === totalDimensions ? 'badge-pass' : 'badge-warn'}`}>
                {enteredDimensions === totalDimensions ? 'All Points Entered' : `${totalDimensions - enteredDimensions} Pending`}
              </span>
            </div>

            {/* Linear Parameters Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {template.dimensions.map((dim, idx) => {
                const isSelected = selectedPinId === dim.id;
                const meas = measurements[dim.id] || { value: '', pass: null, toolUsed: toolAssignments[dim.id] || dim.toolRequired, isCTQ: dim.isCTQ, errorMsg: '' };
                const currentToolId = toolAssignments[dim.id] || dim.toolRequired;

                let rowBorder = 'var(--border-subtle)';
                let rowBg = 'rgba(255, 255, 255, 0.02)';

                if (meas.pass === true) {
                  rowBorder = 'var(--status-pass-border)';
                  rowBg = 'rgba(16, 185, 129, 0.05)';
                } else if (meas.pass === false) {
                  rowBorder = meas.isCTQ ? 'var(--status-ctq-border)' : 'var(--status-fail-border)';
                  rowBg = meas.isCTQ ? 'rgba(255, 107, 0, 0.09)' : 'rgba(239, 68, 68, 0.07)';
                }

                if (isSelected) {
                  rowBorder = 'var(--brand-cyan)';
                }

                return (
                  <div
                    key={dim.id}
                    onClick={() => { setSelectedPinId(dim.id); sounds.playClick(); }}
                    style={{
                      border: `1px solid ${rowBorder}`,
                      backgroundColor: rowBg,
                      borderRadius: 'var(--radius-md)',
                      padding: gloveMode ? 18 : 14,
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    {/* Dimension Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: dim.isCTQ ? '#ff6b00' : '#0284c7',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {dim.pinNumber}
                        </span>
                        <strong style={{ fontSize: 14 }}>{dim.name}</strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {dim.isCTQ && (
                          <span className="badge badge-ctq" style={{ fontSize: 10 }}>CTQ</span>
                        )}
                        {meas.pass === true && (
                          <span className="badge badge-pass" style={{ fontSize: 10 }}>✓ PASS</span>
                        )}
                        {meas.pass === false && (
                          <span className="badge badge-fail" style={{ fontSize: 10 }}>✗ OUT OF SPEC</span>
                        )}
                      </div>
                    </div>

                    {/* Specification Limit details */}
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        {dim.type === 'TOLERANCE' && (
                          <span>Target: <strong style={{ color: '#fff' }}>{dim.nominal.toFixed(3)} {dim.unit}</strong> (Limits: {dim.minAllowed.toFixed(3)} to {dim.maxAllowed.toFixed(3)})</span>
                        )}
                        {dim.type === 'MAX_LIMIT' && (
                          <span>Limit: <strong style={{ color: '#fff' }}>≤ {dim.maxAllowed} {dim.unit}</strong></span>
                        )}
                        {dim.type === 'PASS_FAIL' && (
                          <span>Requirement: <strong style={{ color: '#fff' }}>{dim.notes}</strong></span>
                        )}
                      </div>

                      {/* Tool Selector with Calibration Status */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Wrench size={13} color="var(--text-muted)" />
                        <select
                          value={currentToolId}
                          onChange={(e) => handleToolChange(dim.id, e.target.value)}
                          style={{
                            width: 'auto',
                            padding: '3px 8px',
                            fontSize: 11,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          {factoryData.gauges.map(g => (
                            <option key={g.id} value={g.id}>
                              {g.id} ({g.name.split(' ')[0]}) {g.status === 'EXPIRED' ? '⚠️ EXPIRED' : '✓'}
                            </option>
                          ))}
                          <option value="VISUAL">Visual</option>
                        </select>
                      </div>
                    </div>

                    {/* Input Field / Visual Toggle */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {dim.type === 'PASS_FAIL' ? (
                        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                          <button
                            type="button"
                            onClick={() => handleInputChange(dim, '1')}
                            className={`btn ${meas.value === '1' ? 'btn-success' : 'btn-outline'}`}
                            style={{ flex: 1, minHeight: gloveMode ? 52 : 40 }}
                          >
                            ✓ Conforming / Passed
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInputChange(dim, '0')}
                            className={`btn ${meas.value === '0' ? 'btn-danger' : 'btn-outline'}`}
                            style={{ flex: 1, minHeight: gloveMode ? 52 : 40 }}
                          >
                            ✗ Non-Conforming / Burr Detected
                          </button>
                        </div>
                      ) : (
                        <div style={{ width: '100%', position: 'relative' }}>
                          <input
                            type="number"
                            step="0.001"
                            disabled={!stationVerified}
                            value={meas.value || ''}
                            onChange={(e) => handleInputChange(dim, e.target.value)}
                            onFocus={() => setSelectedPinId(dim.id)}
                            placeholder={stationVerified ? `Enter reading in ${dim.unit}...` : "Locked (Scan Station QR first)"}
                            className={`font-mono ${meas.pass === true ? 'is-pass' : meas.pass === false ? 'is-fail' : ''}`}
                            style={{
                              fontSize: gloveMode ? 18 : 15,
                              fontWeight: 600,
                              padding: gloveMode ? '14px 16px' : '10px 14px'
                            }}
                          />
                          {meas.errorMsg && (
                            <div style={{ fontSize: 11, color: '#f87171', marginTop: 4, fontWeight: 600 }}>
                              {meas.errorMsg}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Photo capture button if out of spec */}
                      {meas.pass === false && (
                        <button
                          type="button"
                          onClick={() => setPhotoModalConfig({
                            dimId: dim.id,
                            dimensionName: dim.name,
                            measuredValue: meas.value,
                            specLimits: dim.type === 'MAX_LIMIT' ? `Max ${dim.maxAllowed}` : `${dim.nominal} [${dim.lowerTol}, +${dim.upperTol}]`,
                            isCTQ: dim.isCTQ
                          })}
                          className="btn btn-danger"
                          style={{ minHeight: gloveMode ? 52 : 40, padding: '0 14px' }}
                          title="Mandatory photo capture for non-conformance"
                        >
                          <Camera size={16} />
                          <span>Photo ({defectPhotos.length}/2)</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}

              {/* Inspector Remarks / Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Inspector Remarks & Tool Logbook Notes
                </label>
                <textarea
                  rows={2}
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  placeholder="Enter shopfloor observations, temperature compensation notes, or defect description..."
                />
              </div>

              {/* Submit Button with Dynamic Lock Explanation */}
              <div style={{
                paddingTop: 14,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
              }}>
                {!canSubmit && (
                  <div style={{ fontSize: 12, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Info size={14} />
                    <span>
                      {!stationVerified && "Must scan Station QR and Traveler Barcode to unlock submission."}
                      {stationVerified && enteredDimensions < totalDimensions && `Please complete remaining ${totalDimensions - enteredDimensions} dimensions.`}
                      {stationVerified && photosRequiredAndMissing && "PRD Rule 5.4: Minimum 2 defect photos required before submitting out-of-tolerance inspection."}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`btn ${hasCTQFailures ? 'btn-danger' : hasFailures ? 'btn-warning' : 'btn-success'}`}
                  style={{
                    padding: gloveMode ? '16px 24px' : '12px 20px',
                    fontSize: gloveMode ? 16 : 14,
                    fontWeight: 700
                  }}
                >
                  <Send size={18} />
                  <span>
                    {hasCTQFailures 
                      ? 'Submit & Route to Rejection Quarantine (CTQ Frozen)' 
                      : hasFailures 
                        ? 'Submit for Supervisor Concession Review' 
                        : 'Submit Completed Inspection (100% In-Spec)'}
                  </span>
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal 
        isOpen={showQRModal} 
        onClose={() => setShowQRModal(false)}
        onScanComplete={handleScanComplete}
      />

      {/* Mandatory Photo Capture Modal */}
      {photoModalConfig && (
        <PhotoCaptureModal 
          isOpen={true}
          dimensionName={photoModalConfig.dimensionName}
          measuredValue={photoModalConfig.measuredValue}
          specLimits={photoModalConfig.specLimits}
          isCTQ={photoModalConfig.isCTQ}
          existingPhotos={defectPhotos}
          onSavePhotos={(photos) => {
            setDefectPhotos(photos);
            setPhotoModalConfig(null);
          }}
          onClose={() => setPhotoModalConfig(null)}
        />
      )}

    </div>
  );
}
