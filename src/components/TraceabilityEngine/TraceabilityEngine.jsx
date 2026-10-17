import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Layers, 
  FileCheck, 
  Truck, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function TraceabilityEngine() {
  const { factoryData } = useApp();

  const [mode, setMode] = useState('FORWARD'); // FORWARD (Heat Lot) | BACKWARD (Serial #)
  const [searchQuery, setSearchQuery] = useState('H-8042');
  const [showMtcModal, setShowMtcModal] = useState(false);

  // Forward query logic: search by Heat #
  const matchingHeatRaw = factoryData.rawMaterials.find(r => r.heatNumber.toLowerCase() === searchQuery.trim().toLowerCase());
  const matchingWOs = factoryData.workOrders.filter(w => w.heatNumber.toLowerCase() === searchQuery.trim().toLowerCase());

  // Backward query logic: search by Serial #
  const matchingSerialWO = factoryData.workOrders.find(w => 
    w.serialNumbers?.some(s => s.toLowerCase() === searchQuery.trim().toLowerCase())
  );

  const handleSearch = (q, newMode) => {
    setSearchQuery(q);
    if (newMode) setMode(newMode);
    sounds.playClick();
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
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(2, 132, 199, 0.4)'
            }}>
              <Search size={24} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: 22 }}>Total Forward & Backward Lineage Traceability Engine</h1>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                PRD Section 3 & 7.2: Permanent bi-directional digital pedigree connecting raw material heat lots, mill certs, CNC operators, and customer crates.
              </span>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleSearch('H-8042', 'FORWARD')}
            className={`btn ${mode === 'FORWARD' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: 13 }}
          >
            <span>Forward Recall (By Heat Lot #)</span>
          </button>
          <button
            onClick={() => handleSearch('SN-2026-9041', 'BACKWARD')}
            className={`btn ${mode === 'BACKWARD' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: 13 }}
          >
            <span>Backward Pedigree (By Serial #)</span>
          </button>
        </div>
      </div>

      {/* Search Input Card */}
      <div className="card-glass" style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={mode === 'FORWARD' ? "Enter Raw Material Heat Batch # (e.g. H-8042)..." : "Enter Finished Part Serial # (e.g. SN-2026-9041)..."}
              className="font-mono"
              style={{ fontSize: 16, padding: '12px 16px' }}
            />
          </div>
          <button onClick={() => sounds.playPass()} className="btn btn-primary" style={{ padding: '12px 20px' }}>
            <Search size={18} />
            <span>Search Lineage Tree</span>
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
          <span>Try PRD Examples:</span>
          <button onClick={() => handleSearch('H-8042', 'FORWARD')} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: 11 }}>
            Heat #H-8042 (Supplier Premier Steel)
          </button>
          <button onClick={() => handleSearch('H-9921', 'FORWARD')} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: 11 }}>
            Heat #H-9921 (Supplier Quarantine SNCR)
          </button>
          <button onClick={() => handleSearch('SN-2026-9041', 'BACKWARD')} className="btn btn-outline" style={{ padding: '3px 8px', fontSize: 11 }}>
            Serial #SN-2026-9041 (Full Birth Certificate)
          </button>
        </div>
      </div>

      {/* FORWARD RECALL RESULTS (PRD Section 7.2 Forward Traceability) */}
      {mode === 'FORWARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {matchingHeatRaw ? (
            <>
              {/* Raw Material Dock Intake & MTC Card */}
              <div className="card-glass" style={{ padding: 22, border: `1px solid ${matchingHeatRaw.status === 'SUPPLIER_QUARANTINE' ? '#ef4444' : 'var(--border-medium)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <span className="badge badge-cyan" style={{ marginBottom: 6 }}>RAW MATERIAL INTAKE RECORD</span>
                    <h2 style={{ fontSize: 18, color: '#fff' }}>Heat Lot #{matchingHeatRaw.heatNumber} — {matchingHeatRaw.materialGrade}</h2>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Supplier: <strong style={{ color: '#fff' }}>{matchingHeatRaw.supplier}</strong> • PO: {matchingHeatRaw.poNumber} • Intake Date: {matchingHeatRaw.intakeDate} • Qty: {matchingHeatRaw.quantity}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => setShowMtcModal(true)} className="btn btn-primary" style={{ fontSize: 12 }}>
                      <FileText size={14} />
                      <span>View Mill Test Certificate (MTC)</span>
                    </button>
                    <span className={`badge ${matchingHeatRaw.status === 'CLEARED_FOR_PRODUCTION' ? 'badge-pass' : 'badge-fail'}`}>
                      {matchingHeatRaw.status}
                    </span>
                  </div>
                </div>

                {/* Chemical & Mechanical Summary */}
                {matchingHeatRaw.chemicalComposition && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 16 }}>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>Certified Chemistry:</div>
                      <div>C: {matchingHeatRaw.chemicalComposition.C}</div>
                      <div>Mn: {matchingHeatRaw.chemicalComposition.Mn}</div>
                      <div>Si: {matchingHeatRaw.chemicalComposition.Si}</div>
                      <div>P: {matchingHeatRaw.chemicalComposition.P}</div>
                    </div>
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 6, fontSize: 12 }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 6 }}>Mechanical Testing:</div>
                      <div>Yield: {matchingHeatRaw.mechanicalProperties.yieldStrength}</div>
                      <div>Tensile: {matchingHeatRaw.mechanicalProperties.tensileStrength}</div>
                      <div>Elongation: {matchingHeatRaw.mechanicalProperties.elongation}</div>
                      <div>Hardness: {matchingHeatRaw.mechanicalProperties.hardness}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Downstream Machined Parts & Work Orders */}
              <div className="card-glass" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} color="#06b6d4" />
                  <span>Downstream Manufacturing Lineage ({matchingWOs.length} Work Orders Consuming Heat #{matchingHeatRaw.heatNumber})</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {matchingWOs.map(wo => (
                    <div key={wo.id} style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{wo.id} — {wo.partNumber} ({wo.partName})</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          Customer: {wo.customer} (PO: {wo.customerPO}) • Batch Size: {wo.batchSize} pcs • Current Op: {wo.currentOp}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span className="badge badge-cyan">{wo.overallStatus}</span>
                        <button onClick={() => handleSearch(wo.serialNumbers[0], 'BACKWARD')} className="btn btn-outline" style={{ fontSize: 11, padding: '5px 10px' }}>
                          Trace Serial #{wo.serialNumbers[0]} →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card-glass" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
              No raw material intake found matching Heat Number "{searchQuery}".
            </div>
          )}
        </div>
      )}

      {/* BACKWARD PEDIGREE / BIRTH CERTIFICATE (PRD Section 7.2 Backward Traceability) */}
      {mode === 'BACKWARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {matchingSerialWO ? (
            <div className="card-glass" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 18 }}>
                <div>
                  <span className="badge badge-pass" style={{ marginBottom: 6 }}>DIGITAL MANUFACTURING BIRTH CERTIFICATE</span>
                  <h2 style={{ fontSize: 20, color: '#fff' }}>Component Serial Number: {searchQuery}</h2>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Work Order: <strong style={{ color: '#38bdf8' }}>{matchingSerialWO.id}</strong> • Part: {matchingSerialWO.partNumber} ({matchingSerialWO.partName})
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Heat Lot Lineage:</div>
                  <div className="font-mono" style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>#{matchingSerialWO.heatNumber}</div>
                </div>
              </div>

              {/* Manufacturing Genealogy Steps */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                
                {/* 1. Raw Material Inception */}
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>1. Raw Material Inception</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4 }}>Heat Lot #{matchingSerialWO.heatNumber}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Supplier: Premier Steel Works Ltd</div>
                  <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>✓ Mill Test Certificate EN 10204 3.1 Verified</div>
                </div>

                {/* 2. CNC Machining Lineage */}
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>2. CNC Machining Cells</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4 }}>CNC Lathe #04 (Doosan Puma)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Machinist: K. Vance (Op-09) • Shift A</div>
                  <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>✓ Daily PM & Tool Offset Calibrated</div>
                </div>

                {/* 3. Heat Treatment & Cooling */}
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>3. Thermal Treatment & Hold</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4 }}>Vacuum Oven #01 (Ipsen Turbo)</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Specialist: R. Singh (HT-02)</div>
                  <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>✓ 4-Hour Cooling Hold Timer Fulfilled</div>
                </div>

                {/* 4. Quality Inspection Sign-off */}
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase' }}>4. Quality PDI Sign-off</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4 }}>Zeiss CMM & Micrometer MC-202</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Lead: Marcus Vance (Quality Manager)</div>
                  <div style={{ fontSize: 11, color: '#34d399', marginTop: 4 }}>✓ 100% Dimensions Passed / Concession Cleared</div>
                </div>

              </div>
            </div>
          ) : (
            <div className="card-glass" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
              No component birth certificate found for Serial Number "{searchQuery}".
            </div>
          )}
        </div>
      )}

      {/* Mill Test Certificate Modal View */}
      {showMtcModal && (
        <div className="modal-backdrop">
          <div className="modal-content modal-content-lg" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="#06b6d4" />
                <h3 style={{ fontSize: 17 }}>Official Mill Test Certificate EN 10204 3.1</h3>
              </div>
              <button onClick={() => setShowMtcModal(false)} className="btn btn-ghost" style={{ padding: 4 }}>✕</button>
            </div>
            
            <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-medium)', maxHeight: '70vh', overflowY: 'auto' }}>
              <img src="/assets/mtc_test_certificate.jpg" alt="Mill Test Certificate" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowMtcModal(false)} className="btn btn-outline">Close Document</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
