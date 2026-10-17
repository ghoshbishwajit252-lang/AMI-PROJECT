import React, { useRef } from 'react';
import { Crosshair, AlertTriangle } from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function BlueprintCanvas({ 
  blueprintUrl, 
  dimensions = [], 
  selectedDimId, 
  onSelectDim, 
  onAddPinCoord,
  readOnly = false,
  results = null // optional map of inspection results: { [dimId]: { pass: boolean, isCTQ: boolean } }
}) {
  const containerRef = useRef(null);

  const handleCanvasClick = (e) => {
    if (readOnly || !onAddPinCoord) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddPinCoord({ x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) });
    sounds.playClick();
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div 
        ref={containerRef}
        onClick={handleCanvasClick}
        className="blueprint-wrapper"
        style={{
          cursor: readOnly ? 'default' : 'crosshair',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        {/* CAD Blueprint Image */}
        <img 
          src={blueprintUrl || "/assets/blueprint_shaft_cad.jpg"} 
          alt="Engineering CAD Blueprint"
          className="blueprint-img"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />

        {/* Blueprint Overlay Grid & Technical Header */}
        <div style={{
          position: 'absolute',
          top: 12,
          left: 14,
          padding: '6px 12px',
          background: 'rgba(6, 17, 34, 0.88)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.6)'
        }}>
          <Crosshair size={14} color="#06b6d4" />
          <span>INTERACTIVE CAD VIEWER • DWG TS-4911-A (REV B)</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: '#94a3b8' }}>
            {readOnly ? 'Click pin to focus field' : 'Click drawing to place inspection pin'}
          </span>
        </div>

        {/* Render Coordinate Pins */}
        {dimensions.map((dim) => {
          const isSelected = selectedDimId === dim.id;
          const result = results ? results[dim.id] : null;

          let pinClass = 'pin-normal';
          if (dim.isCTQ) pinClass = 'pin-ctq';
          if (result) {
            pinClass = result.pass ? 'pin-pass' : 'pin-fail';
          }

          return (
            <div
              key={dim.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDim(dim.id);
                sounds.playClick();
              }}
              className={`blueprint-pin ${pinClass} ${isSelected ? 'active' : ''}`}
              style={{
                left: `${dim.pinX}%`,
                top: `${dim.pinY}%`,
              }}
              title={`${dim.pinNumber}. ${dim.name} (${dim.isCTQ ? 'CTQ' : 'Std'})`}
            >
              <span>{dim.pinNumber}</span>

              {/* Hover Tooltip with Dimensions */}
              <div className="pin-tooltip">
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {dim.isCTQ && <span style={{ color: '#ff9944' }}>[CTQ]</span>}
                  <span>Pin {dim.pinNumber}: {dim.name}</span>
                </div>
                <div style={{ color: '#94a3b8', marginTop: 2 }}>
                  {dim.type === 'TOLERANCE' && `${dim.nominal.toFixed(3)} mm [${dim.lowerTol >= 0 ? '+' : ''}${dim.lowerTol}, +${dim.upperTol}]`}
                  {dim.type === 'MAX_LIMIT' && `Max: ${dim.maxAllowed} ${dim.unit}`}
                  {dim.type === 'PASS_FAIL' && 'Visual Conformance'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
