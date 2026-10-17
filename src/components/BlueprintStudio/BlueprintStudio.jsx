import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import BlueprintCanvas from './BlueprintCanvas';
import { 
  Layers, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  FileCheck, 
  Sliders, 
  Crosshair, 
  Sparkles, 
  Wrench,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function BlueprintStudio() {
  const { factoryData, updateBlueprintPin, publishTemplateRevision, currentUser } = useApp();

  const template = factoryData.templates[0]; // TS-4911-A
  const [selectedDimId, setSelectedDimId] = useState(template.dimensions[0].id);
  const [showRevModal, setShowRevModal] = useState(false);
  const [revNotes, setRevNotes] = useState('');
  const [targetRev, setTargetRev] = useState('Rev C');

  const selectedDim = template.dimensions.find(d => d.id === selectedDimId) || template.dimensions[0];

  // Handle pin coordinate drop on canvas
  const handleAddPinCoord = (coord) => {
    const nextPinNum = template.dimensions.length + 1;
    const newDim = {
      id: `DIM-0${nextPinNum}`,
      pinNumber: nextPinNum,
      name: `Inspection Feature #${nextPinNum}`,
      pinX: coord.x,
      pinY: coord.y,
      type: "TOLERANCE",
      nominal: 25.000,
      upperTol: 0.050,
      lowerTol: -0.050,
      minAllowed: 24.950,
      maxAllowed: 25.050,
      unit: "mm",
      toolRequired: "VC-104",
      isCTQ: false,
      notes: "Newly pinned shopfloor inspection parameter."
    };
    updateBlueprintPin(newDim);
    setSelectedDimId(newDim.id);
  };

  const handleFieldChange = (field, value) => {
    let updated = { ...selectedDim, [field]: value };

    // Auto-calculate minAllowed / maxAllowed if tolerance changes
    if (field === 'nominal' || field === 'upperTol' || field === 'lowerTol') {
      const nom = field === 'nominal' ? parseFloat(value) || 0 : selectedDim.nominal;
      const up = field === 'upperTol' ? parseFloat(value) || 0 : selectedDim.upperTol;
      const low = field === 'lowerTol' ? parseFloat(value) || 0 : selectedDim.lowerTol;
      updated.minAllowed = parseFloat((nom + low).toFixed(4));
      updated.maxAllowed = parseFloat((nom + up).toFixed(4));
    }

    updateBlueprintPin(updated);
  };

  const handlePublishRevision = (e) => {
    e.preventDefault();
    publishTemplateRevision(template.partNumber, targetRev, revNotes || 'Engineering change order dimension tolerance update.');
    setShowRevModal(false);
    setRevNotes('');
  };

  return (
    <div style={{ maxWidth: 1540, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Studio Header Card */}
      <div className="card-glass" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 24 }}>Pre-Dispatch Inspection (PDI) Template Design Studio</h1>
            <span className="badge badge-cyan">{template.revision}</span>
            <span className="badge badge-pass">
              <CheckCircle size={12} /> QM Approved
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Part: <strong style={{ color: '#fff' }}>{template.partNumber} - {template.partName}</strong> | Customer: {template.customer} | Operation: {template.operationTarget}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => setShowRevModal(true)}
            className="btn btn-outline"
            style={{ fontSize: 13 }}
          >
            <Layers size={15} />
            <span>Bump Revision ({template.revision} → {targetRev})</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Blueprint Canvas on Left (65%), Parameters Editor on Right (35%) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(500px, 1.8fr) minmax(360px, 1.2fr)', gap: 24 }}>
        
        {/* Left: Interactive Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card-glass" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crosshair size={18} color="#06b6d4" />
                <h3 style={{ fontSize: 16 }}>Interactive Blueprint Pinning Canvas</h3>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>Total Pinned Points: <strong>{template.dimensions.length}</strong></span>
              </div>
            </div>

            <BlueprintCanvas 
              blueprintUrl={template.blueprintUrl}
              dimensions={template.dimensions}
              selectedDimId={selectedDimId}
              onSelectDim={setSelectedDimId}
              onAddPinCoord={handleAddPinCoord}
              readOnly={false}
            />

            <div style={{ 
              marginTop: 12, 
              padding: '10px 14px', 
              background: 'rgba(6, 182, 212, 0.05)', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-secondary)'
            }}>
              <span>💡 <strong>Click anywhere on the CAD drawing</strong> to drop a new inspection pin.</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#0284c7' }}></span> Standard Pin
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff6b00' }}></span> CTQ Pin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Inspection Parameters List & Active Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Quick Pin Selector Carousel */}
          <div className="card-glass" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
              Select Inspection Pin:
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {template.dimensions.map((dim) => (
                <button
                  key={dim.id}
                  onClick={() => {
                    setSelectedDimId(dim.id);
                    sounds.playClick();
                  }}
                  className={`btn ${selectedDimId === dim.id ? (dim.isCTQ ? 'btn-warning' : 'btn-primary') : 'btn-outline'}`}
                  style={{ 
                    padding: '6px 12px', 
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>Pin {dim.pinNumber}</span>
                  {dim.isCTQ && <span style={{ fontSize: 9, fontWeight: 800, backgroundColor: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: 3 }}>CTQ</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Active Parameter Configuration Form */}
          <div className="card-glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: 4 }}>PIN #{selectedDim.pinNumber}</span>
                <h3 style={{ fontSize: 17 }}>{selectedDim.name}</h3>
              </div>
              {selectedDim.isCTQ ? (
                <span className="badge badge-ctq">
                  <ShieldAlert size={13} /> CRITICAL-TO-QUALITY
                </span>
              ) : (
                <span className="badge badge-pass">Standard Inspection</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Feature Name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Inspection Feature Name
                </label>
                <input 
                  type="text" 
                  value={selectedDim.name} 
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </div>

              {/* Inspection Type Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                    Inspection Type
                  </label>
                  <select 
                    value={selectedDim.type} 
                    onChange={(e) => handleFieldChange('type', e.target.value)}
                  >
                    <option value="TOLERANCE">Dimension Plus/Minus</option>
                    <option value="MAX_LIMIT">Maximum Threshold (Ra / Runout)</option>
                    <option value="PASS_FAIL">Visual Conformance (Yes/No)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                    Measurement Unit
                  </label>
                  <input 
                    type="text" 
                    value={selectedDim.unit} 
                    onChange={(e) => handleFieldChange('unit', e.target.value)}
                  />
                </div>
              </div>

              {/* Dimension & Tolerances if type is TOLERANCE */}
              {selectedDim.type === 'TOLERANCE' && (
                <div style={{ 
                  padding: 14, 
                  background: 'rgba(0,0,0,0.25)', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>
                    TOLERANCE LIMITS CONFIGURATION
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                        Nominal Target ({selectedDim.unit})
                      </label>
                      <input 
                        type="number" 
                        step="0.001"
                        value={selectedDim.nominal} 
                        onChange={(e) => handleFieldChange('nominal', parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                        Upper (+) Tol
                      </label>
                      <input 
                        type="number" 
                        step="0.001"
                        value={selectedDim.upperTol} 
                        onChange={(e) => handleFieldChange('upperTol', parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                        Lower (-) Tol
                      </label>
                      <input 
                        type="number" 
                        step="0.001"
                        value={selectedDim.lowerTol} 
                        onChange={(e) => handleFieldChange('lowerTol', parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  {/* Calculated Allowed Band */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: 12, 
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <span>Min Allowed: <strong style={{ color: '#34d399' }}>{selectedDim.minAllowed.toFixed(3)}</strong></span>
                    <span>Max Allowed: <strong style={{ color: '#34d399' }}>{selectedDim.maxAllowed.toFixed(3)}</strong></span>
                  </div>
                </div>
              )}

              {/* Maximum Threshold config if MAX_LIMIT */}
              {selectedDim.type === 'MAX_LIMIT' && (
                <div style={{ padding: 14, background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    Maximum Allowable Threshold ({selectedDim.unit})
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={selectedDim.maxAllowed} 
                    onChange={(e) => handleFieldChange('maxAllowed', parseFloat(e.target.value) || 0)}
                    className="font-mono"
                  />
                </div>
              )}

              {/* Required Measuring Tool & Tool Calibration Verification */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Mandatory Measuring Tool (PRD Section 2.3)
                </label>
                <select 
                  value={selectedDim.toolRequired} 
                  onChange={(e) => handleFieldChange('toolRequired', e.target.value)}
                >
                  {factoryData.gauges.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.id}: {g.name} [{g.status === 'CALIBRATED' ? '✓ Calibrated' : '⚠️ EXPIRED'}]
                    </option>
                  ))}
                  <option value="VISUAL">VISUAL INSPECTION (No Tool)</option>
                </select>

                {/* Show calibration expiry alert if expired tool is selected */}
                {(() => {
                  const gauge = factoryData.gauges.find(g => g.id === selectedDim.toolRequired);
                  if (gauge && gauge.status === 'EXPIRED') {
                    return (
                      <div style={{
                        marginTop: 6,
                        padding: '8px 10px',
                        backgroundColor: 'var(--status-fail-bg)',
                        border: '1px solid var(--status-fail-border)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 11,
                        color: '#f87171'
                      }}>
                        <AlertOctagon size={14} />
                        <span><strong>Expired Tool Calibration:</strong> Calibration expired on {gauge.calibrationExpiry}. System will block measurement entry!</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* CTQ (Critical-To-Quality) Priority Toggle Switch (PRD Section 4.3) */}
              <div style={{
                padding: 14,
                backgroundColor: selectedDim.isCTQ ? 'var(--status-ctq-bg)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${selectedDim.isCTQ ? 'var(--status-ctq-border)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={16} color={selectedDim.isCTQ ? '#ff6b00' : 'var(--text-secondary)'} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: selectedDim.isCTQ ? '#ff9944' : 'var(--text-primary)' }}>
                      Critical-to-Quality (CTQ) Flag
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
                    PRD Rule 4.3: CTQ items carry strict zero-tolerance interlocks. Out-of-spec entries instantly freeze the checklist, send alerts to the Quality Head, and <strong>strictly prohibit conditional supervisor concessions</strong>.
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, flexShrink: 0, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedDim.isCTQ} 
                    onChange={(e) => handleFieldChange('isCTQ', e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: selectedDim.isCTQ ? '#ff6b00' : '#374151',
                    borderRadius: 24,
                    transition: '0.2s',
                  }}></span>
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    left: selectedDim.isCTQ ? 22 : 2,
                    width: 20,
                    height: 20,
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    transition: '0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.5)'
                  }}></span>
                </label>
              </div>

              {/* Engineering Drawing Notes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Blueprint Callout & Notes
                </label>
                <textarea 
                  rows={2}
                  value={selectedDim.notes || ''} 
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                />
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Bump Revision Modal */}
      {showRevModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>Bump PDI Template Revision</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              PRD Section 4.1: Whenever an engineering drawing changes, a new revision is created and requires Quality Manager re-approval before shopfloor deployment.
            </p>
            <form onSubmit={handlePublishRevision} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Target Revision Tag
                </label>
                <input 
                  type="text" 
                  value={targetRev} 
                  onChange={(e) => setTargetRev(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                  Engineering Change Justification
                </label>
                <textarea 
                  rows={3} 
                  value={revNotes} 
                  onChange={(e) => setRevNotes(e.target.value)}
                  placeholder="e.g. Tightened bearing journal tolerance per customer ECO-8812."
                  required 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowRevModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">Publish Revision</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
