import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_FACTORY_DATA } from '../data/mockData';
import { sounds } from '../utils/audio';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Load initial state from localStorage or fallback to default
  const [factoryData, setFactoryData] = useState(() => {
    try {
      const saved = localStorage.getItem('ZAPUZA_QCORE_STATE');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_FACTORY_DATA;
  });

  // Current active role
  const [currentUser, setCurrentUser] = useState({
    name: "Marcus Vance",
    role: "Quality Manager", // Quality Manager | Shift Supervisor | QA Floor Inspector | Quality Engineer | Warehouse Lead
    id: "EMP-QM-001",
  });

  // Glove-friendly shopfloor mode
  const [gloveMode, setGloveMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Active view tab:
  // 'blueprint-studio' | 'floor-inspector' | 'supervisor-queue' | 'travelers' | 'rejection-mrb' | 'shipping-gate' | 'traceability' | 'audit-log' | 'shift-handover'
  const [activeTab, setActiveTab] = useState('floor-inspector');

  // Currently selected Work Order in context
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('WO-2026-001');

  // Synchronize glove-friendly mode class with body
  useEffect(() => {
    if (gloveMode) {
      document.body.classList.add('glove-friendly-mode');
    } else {
      document.body.classList.remove('glove-friendly-mode');
    }
  }, [gloveMode]);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ZAPUZA_QCORE_STATE', JSON.stringify(factoryData));
    } catch {
      // Storage error
    }
  }, [factoryData]);

  // Active countdown timer interval for process aging / cooling holds
  useEffect(() => {
    const timer = setInterval(() => {
      setFactoryData(prev => {
        let changed = false;
        const updatedWOs = prev.workOrders.map(wo => {
          if (wo.overallStatus === 'HOLD_TIMER_ACTIVE') {
            const updatedOps = wo.operations.map(op => {
              if (op.requiresHoldTimer && op.isHoldActive && op.remainingSeconds > 0) {
                changed = true;
                const newRemaining = Math.max(0, op.remainingSeconds - 1);
                return {
                  ...op,
                  remainingSeconds: newRemaining,
                  isHoldActive: newRemaining > 0,
                  holdCompletedAt: newRemaining === 0 ? new Date().toISOString() : null,
                };
              }
              return op;
            });
            return {
              ...wo,
              operations: updatedOps,
              overallStatus: updatedOps.some(o => o.isHoldActive) ? 'HOLD_TIMER_ACTIVE' : 'IN_INSPECTION',
            };
          }
          return wo;
        });

        if (changed) {
          return { ...prev, workOrders: updatedWOs };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Helper to log immutable tamper-proof audit trail
  const logAudit = (action, details, prevValue = 'N/A', newValue = 'N/A') => {
    const newLog = {
      id: `AUD-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: `${currentUser.name} (${currentUser.role})`,
      role: currentUser.role,
      ipAddress: '192.168.10.42',
      deviceSerial: gloveMode ? 'RUGGED-TAB-QC04' : 'WS-STATION-PORTAL',
      action,
      details,
      prevValue: String(prevValue),
      newValue: String(newValue),
    };

    setFactoryData(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs],
    }));
  };

  // Reset entire system to factory demo state
  const resetToFactoryDemo = () => {
    localStorage.removeItem('ZAPUZA_QCORE_STATE');
    setFactoryData(INITIAL_FACTORY_DATA);
    setSelectedWorkOrderId('WO-2026-001');
    sounds.playClick();
    logAudit('SYSTEM_RESET', 'Factory database reset to Standard Initial Demo Seed.');
  };

  // Fast forward cooling hold timer for WO-2026-002 demo
  const completeHoldTimer = (workOrderId) => {
    setFactoryData(prev => ({
      ...prev,
      workOrders: prev.workOrders.map(wo => {
        if (wo.id === workOrderId) {
          const updatedOps = wo.operations.map(op => {
            if (op.requiresHoldTimer) {
              return {
                ...op,
                remainingSeconds: 0,
                isHoldActive: false,
                holdCompletedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              };
            }
            if (op.opNumber === 40 && op.status === 'LOCKED_HOLD_INTERLOCK') {
              return { ...op, status: 'IN_PROGRESS' };
            }
            return op;
          });
          return {
            ...wo,
            operations: updatedOps,
            overallStatus: 'IN_INSPECTION',
          };
        }
        return wo;
      }),
    }));
    logAudit('HOLD_TIMER_MANUAL_OVERRIDE', `Process cooling hold cleared for ${workOrderId}.`);
    sounds.playPass();
  };

  // Blueprint Studio: Add / Update Pin
  const updateBlueprintPin = (dimensionData) => {
    setFactoryData(prev => {
      const templates = prev.templates.map(tpl => {
        if (tpl.partNumber === 'TS-4911-A') {
          const existingIdx = tpl.dimensions.findIndex(d => d.id === dimensionData.id);
          let updatedDimensions;
          if (existingIdx >= 0) {
            updatedDimensions = [...tpl.dimensions];
            updatedDimensions[existingIdx] = dimensionData;
          } else {
            updatedDimensions = [...tpl.dimensions, dimensionData];
          }
          return { ...tpl, dimensions: updatedDimensions };
        }
        return tpl;
      });
      return { ...prev, templates };
    });
    logAudit('TEMPLATE_PIN_UPDATED', `Blueprint pin ${dimensionData.name} updated with tolerances [${dimensionData.lowerTol}, +${dimensionData.upperTol}].`);
  };

  // Blueprint Studio: Publish new revision (Rev B -> Rev C)
  const publishTemplateRevision = (partNumber, newRev, notes) => {
    setFactoryData(prev => ({
      ...prev,
      templates: prev.templates.map(tpl => {
        if (tpl.partNumber === partNumber) {
          return {
            ...tpl,
            revision: newRev,
            status: 'APPROVED_BY_QM',
            approvedBy: `${currentUser.name} (${currentUser.role})`,
          };
        }
        return tpl;
      }),
    }));
    logAudit('TEMPLATE_REVISION_PUBLISHED', `Part ${partNumber} bumped to ${newRev}. Notes: ${notes}`);
    sounds.playPass();
  };

  // Floor Inspector: Save completed inspection
  const submitInspection = (workOrderId, inspectionPayload) => {
    setFactoryData(prev => ({
      ...prev,
      workOrders: prev.workOrders.map(wo => {
        if (wo.id === workOrderId) {
          const overallStatus = inspectionPayload.hasCTQFailures 
            ? 'QUARANTINED_MRB' 
            : 'AWAITING_SUPERVISOR_APPROVAL';

          const updatedOps = wo.operations.map(op => {
            if (op.opNumber === 50) {
              return {
                ...op,
                status: inspectionPayload.hasCTQFailures ? 'REJECTED_QUARANTINED' : 'SUBMITTED_FOR_REVIEW',
                operator: inspectionPayload.inspectorId,
                signedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              };
            }
            return op;
          });

          return {
            ...wo,
            overallStatus,
            operations: updatedOps,
            inspectionData: inspectionPayload,
            quarantineDetails: inspectionPayload.hasCTQFailures ? {
              quarantinedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              floorLocation: 'Digital Rejection Holding Area - Bay 7 Bin R-12',
              quarantinedBy: 'Automated CTQ Interlock Lock',
              reason: 'Critical-To-Quality parameter breached drawing tolerance limits. Auto-frozen.',
              mrbDisposition: null,
            } : null,
          };
        }
        return wo;
      }),
    }));

    if (inspectionPayload.hasCTQFailures) {
      logAudit(
        'INSPECTION_SUBMITTED_CTQ_FREEZE',
        `Job ${workOrderId} failed CTQ parameter! Checklist auto-frozen and routed to Rejection Holding Area.`,
        'IN_PROGRESS',
        'QUARANTINED_MRB'
      );
      sounds.playAlarm();
    } else {
      logAudit(
        'INSPECTION_SUBMITTED_FOR_REVIEW',
        `Job ${workOrderId} inspection submitted by ${inspectionPayload.inspectorId}. Routed to Shift Supervisor approval queue.`,
        'IN_PROGRESS',
        'AWAITING_SUPERVISOR_APPROVAL'
      );
      sounds.playPass();
    }
  };

  // Supervisor Approval Actions
  const approveInspection = (workOrderId, notes) => {
    setFactoryData(prev => ({
      ...prev,
      workOrders: prev.workOrders.map(wo => {
        if (wo.id === workOrderId) {
          const updatedOps = wo.operations.map(op => {
            if (op.opNumber === 50) return { ...op, status: 'APPROVED' };
            if (op.opNumber === 60) return { ...op, status: 'PENDING_GATE_PASS' };
            return op;
          });
          return {
            ...wo,
            overallStatus: 'READY_FOR_DISPATCH',
            currentOp: 60,
            operations: updatedOps,
            supervisorDecision: {
              decision: 'APPROVED',
              decidedBy: `${currentUser.name} (${currentUser.role})`,
              decidedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              notes,
            },
          };
        }
        return wo;
      }),
    }));

    logAudit('SUPERVISOR_APPROVAL', `Work Order ${workOrderId} approved by supervisor. Lot cleared for packing & dispatch.`, 'AWAITING_APPROVAL', 'READY_FOR_DISPATCH');
    sounds.playPass();
  };

  // Supervisor Conditional Concession Action (ONLY if non-CTQ!)
  const grantConcession = (workOrderId, reasonCode, justification) => {
    const targetWO = factoryData.workOrders.find(w => w.id === workOrderId);
    if (targetWO?.inspectionData?.hasCTQFailures) {
      alert("HARD INTERLOCK ERROR: Conditional concessions are strictly prohibited on Critical-To-Quality (CTQ) dimensions by PRD Rule 4.3!");
      sounds.playAlarm();
      return false;
    }

    setFactoryData(prev => ({
      ...prev,
      workOrders: prev.workOrders.map(wo => {
        if (wo.id === workOrderId) {
          const updatedOps = wo.operations.map(op => {
            if (op.opNumber === 50) return { ...op, status: 'CONCESSION_GRANTED' };
            if (op.opNumber === 60) return { ...op, status: 'PENDING_GATE_PASS' };
            return op;
          });
          return {
            ...wo,
            overallStatus: 'READY_FOR_DISPATCH',
            currentOp: 60,
            operations: updatedOps,
            hasConcession: true,
            supervisorDecision: {
              decision: 'CONCESSION',
              decidedBy: `${currentUser.name} (${currentUser.role})`,
              decidedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              reasonCode,
              justification,
            },
          };
        }
        return wo;
      }),
    }));

    logAudit(
      'CONCESSION_GRANTED',
      `Work Order ${workOrderId} granted conditional concession. Reason Code: ${reasonCode}. Justification: ${justification}`,
      'AWAITING_APPROVAL',
      'CONCESSION_RELEASED'
    );
    sounds.playPass();
    return true;
  };

  // Supervisor Rejection / Quarantine
  const rejectToQuarantine = (workOrderId, reason) => {
    setFactoryData(prev => ({
      ...prev,
      workOrders: prev.workOrders.map(wo => {
        if (wo.id === workOrderId) {
          const updatedOps = wo.operations.map(op => {
            if (op.opNumber === 50) return { ...op, status: 'REJECTED_QUARANTINED' };
            if (op.opNumber === 60) return { ...op, status: 'LOCKED_REJECTED' };
            return op;
          });
          return {
            ...wo,
            overallStatus: 'QUARANTINED_MRB',
            operations: updatedOps,
            quarantineDetails: {
              quarantinedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
              floorLocation: 'Digital Rejection Holding Area - Quarantine Bay 02',
              quarantinedBy: `${currentUser.name} (${currentUser.role})`,
              reason,
              mrbDisposition: null,
            },
          };
        }
        return wo;
      }),
    }));

    logAudit('SUPERVISOR_REJECTION_QUARANTINE', `Work Order ${workOrderId} rejected and routed to Digital Rejection Holding Area. Reason: ${reason}`, 'AWAITING_APPROVAL', 'QUARANTINED_MRB');
    sounds.playAlarm();
  };

  // Material Review Board (MRB) 4-Way Disposition
  const executeMRBDisposition = (workOrderId, dispositionType, notes) => {
    // dispositionType: 'REWORK' | 'SCRAP' | 'RTV' | 'CUSTOMER_CONCESSION'
    setFactoryData(prev => ({
      ...prev,
      workOrders: prev.workOrders.map(wo => {
        if (wo.id === workOrderId) {
          return {
            ...wo,
            overallStatus: `MRB_${dispositionType}`,
            quarantineDetails: {
              ...wo.quarantineDetails,
              mrbDisposition: {
                type: dispositionType,
                decidedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
                decidedBy: `${currentUser.name} (${currentUser.role})`,
                notes,
              },
            },
          };
        }
        return wo;
      }),
    }));

    logAudit(
      'MRB_DISPOSITION_EXECUTED',
      `Work Order ${workOrderId} MRB disposition executed: ${dispositionType}. Notes: ${notes}`,
      'QUARANTINED_MRB',
      `MRB_${dispositionType}`
    );
    sounds.playPass();
  };

  // Shipping Clearance Gatekeeper Interlock Evaluation (PRD Section 10)
  const evaluateShippingClearance = (workOrder) => {
    const reasons = [];

    // Rule A: 100% of required operations signed off
    const opsIncomplete = workOrder.operations.filter(op => op.opNumber < 60 && op.status !== 'COMPLETED' && op.status !== 'APPROVED' && op.status !== 'CONCESSION_GRANTED');
    if (opsIncomplete.length > 0) {
      reasons.push(`Rule A Violation: Manufacturing operations not completed (${opsIncomplete.map(o => `Op ${o.opNumber}`).join(', ')})`);
    }

    // Rule B: Process aging and cooling holds fulfilled
    const activeHolds = workOrder.operations.filter(op => op.requiresHoldTimer && op.isHoldActive);
    if (activeHolds.length > 0) {
      reasons.push(`Rule B Violation: Process aging cooling hold active on Op 30 (${Math.ceil(activeHolds[0].remainingSeconds / 60)} min remaining)`);
    }

    // Rule C: Final PDI checklist signed and approved
    const pdiOp = workOrder.operations.find(op => op.opNumber === 50);
    if (!pdiOp || (pdiOp.status !== 'APPROVED' && pdiOp.status !== 'CONCESSION_GRANTED')) {
      reasons.push(`Rule C Violation: Final PDI Checklist is not signed and approved by Quality (Current state: ${pdiOp?.status || 'NOT_STARTED'})`);
    }

    // Check if quarantined
    if (workOrder.overallStatus.includes('QUARANTINED') || workOrder.overallStatus.includes('SCRAP')) {
      reasons.push(`Quarantine Interlock: Work Order is currently quarantined or condemned in Rejection Holding Area.`);
    }

    const isCleared = reasons.length === 0;
    return {
      isCleared,
      reasons,
    };
  };

  // Generate Shipping Gate Pass and Customer Verification QR
  const generateShippingGatePass = (workOrderId, transportDetails) => {
    const wo = factoryData.workOrders.find(w => w.id === workOrderId);
    const clearance = evaluateShippingClearance(wo);

    if (!clearance.isCleared) {
      sounds.playAlarm();
      return { success: false, reasons: clearance.reasons };
    }

    const gatePassNumber = `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const manifest = {
      gatePassNumber,
      issuedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      issuedBy: `${currentUser.name} (${currentUser.role})`,
      customerPO: wo.customerPO,
      customer: wo.customer,
      batchSize: wo.batchSize,
      heatNumber: wo.heatNumber,
      partNumber: wo.partNumber,
      partName: wo.partName,
      serialNumbers: wo.serialNumbers,
      vehicleNumber: transportDetails.vehicleNumber || 'KA-05-EX-4921',
      driverName: transportDetails.driverName || 'Ramesh Gowda',
      customerVerificationQr: `https://zapuza-qcore.cert/verify/${wo.id}/${gatePassNumber}`,
    };

    setFactoryData(prev => ({
      ...prev,
      workOrders: prev.workOrders.map(w => {
        if (w.id === workOrderId) {
          const updatedOps = w.operations.map(op => {
            if (op.opNumber === 60) return { ...op, status: 'COMPLETED', signedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) };
            return op;
          });
          return {
            ...w,
            overallStatus: 'DISPATCHED',
            operations: updatedOps,
            dispatchManifest: manifest,
          };
        }
        return w;
      }),
    }));

    logAudit('SHIPPING_GATE_PASS_GENERATED', `Gate Pass ${gatePassNumber} issued for ${workOrderId}. Shipping Interlocks verified green.`);
    sounds.playPass();
    return { success: true, manifest };
  };

  // Shift Handover: Acknowledge handover
  const acknowledgeShiftHandover = (handoverId) => {
    setFactoryData(prev => ({
      ...prev,
      shiftHandovers: prev.shiftHandovers.map(sh => {
        if (sh.id === handoverId) {
          return {
            ...sh,
            acknowledged: true,
            acknowledgedBy: currentUser.name,
            acknowledgedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          };
        }
        return sh;
      }),
    }));
    logAudit('SHIFT_HANDOVER_ACKNOWLEDGED', `Digital shift handover ${handoverId} acknowledged by ${currentUser.name}.`);
    sounds.playPass();
  };

  return (
    <AppContext.Provider
      value={{
        factoryData,
        currentUser,
        setCurrentUser,
        gloveMode,
        setGloveMode,
        soundEnabled,
        setSoundEnabled,
        activeTab,
        setActiveTab,
        selectedWorkOrderId,
        setSelectedWorkOrderId,
        logAudit,
        resetToFactoryDemo,
        completeHoldTimer,
        updateBlueprintPin,
        publishTemplateRevision,
        submitInspection,
        approveInspection,
        grantConcession,
        rejectToQuarantine,
        executeMRBDisposition,
        evaluateShippingClearance,
        generateShippingGatePass,
        acknowledgeShiftHandover,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
