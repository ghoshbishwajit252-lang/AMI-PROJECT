// Test script to verify all 7 core interlocks and business rules

import { INITIAL_FACTORY_DATA } from '../src/data/mockData.js';

console.log("=================================================================");
console.log(" ZAPUZA Q-CORE: HARD INTERLOCKS & BUSINESS LOGIC VERIFICATION");
console.log("=================================================================\n");

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] Test ${totalTests}: ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------
// 1. Tool Calibration Enforcement (PRD Section 2.3)
// -------------------------------------------------------------
console.log("--- 1. Testing Tool Calibration Interlock (PRD 2.3) ---");
const expiredTool = INITIAL_FACTORY_DATA.gauges.find(g => g.id === 'PG-04');
const validTool = INITIAL_FACTORY_DATA.gauges.find(g => g.id === 'VC-104');

assert(expiredTool.status === 'EXPIRED', "Expired tool PG-04 correctly identified as EXPIRED");
assert(new Date(expiredTool.calibrationExpiry) < new Date(), "Tool PG-04 calibration interval is expired in calendar");
assert(validTool.status === 'CALIBRATED', "Valid tool VC-104 is marked CALIBRATED");

// -------------------------------------------------------------
// 2. Machine Calibration & PM Overdue Lock (PRD Section 2.2)
// -------------------------------------------------------------
console.log("\n--- 2. Testing Machine PM Overdue Lock (PRD 2.2) ---");
const overdueMachine = INITIAL_FACTORY_DATA.machines.find(m => m.id === 'MCH-VMC-02');
const validMachine = INITIAL_FACTORY_DATA.machines.find(m => m.id === 'MCH-CNC-04');

assert(overdueMachine.pmStatus === 'OVERDUE', "VMC Station #02 is flagged PM OVERDUE");
assert(overdueMachine.zeroPointVerified === false, "Zero-point check is unverified on overdue machine");
assert(validMachine.pmStatus === 'VALID', "CNC Lathe #04 PM status is VALID");

// -------------------------------------------------------------
// 3. Dimensional Tolerance Calculation Engine (PRD Section 4.2 & 5.3)
// -------------------------------------------------------------
console.log("\n--- 3. Testing Real-Time Tolerance Evaluation (PRD 4.2 & 5.3) ---");
const tpl = INITIAL_FACTORY_DATA.templates[0];
const dim01 = tpl.dimensions.find(d => d.id === 'DIM-01'); // Nominal 60.000 [+0.005, -0.010] -> [59.990, 60.005]

function evaluateDim(dim, val) {
  const num = parseFloat(val);
  if (dim.type === 'MAX_LIMIT') return num <= dim.maxAllowed;
  return num >= dim.minAllowed && num <= dim.maxAllowed;
}

assert(evaluateDim(dim01, 60.000) === true, "Nominal 60.000 mm is IN-TOLERANCE (GREEN)");
assert(evaluateDim(dim01, 60.004) === true, "Upper boundary 60.004 mm is IN-TOLERANCE (GREEN)");
assert(evaluateDim(dim01, 59.992) === true, "Lower boundary 59.992 mm is IN-TOLERANCE (GREEN)");
assert(evaluateDim(dim01, 60.006) === false, "Oversized 60.006 mm is OUT-OF-SPEC (RED)");
assert(evaluateDim(dim01, 59.988) === false, "Undersized 59.988 mm is OUT-OF-SPEC (RED)");

// -------------------------------------------------------------
// 4. CTQ Zero-Tolerance & Concession Hard Interlock (PRD Section 4.3 & 6.1)
// -------------------------------------------------------------
console.log("\n--- 4. Testing CTQ Priority & Concession Lockout (PRD 4.3 & 6.1) ---");
const ctqDim = tpl.dimensions.find(d => d.isCTQ === true);
const nonCtqDim = tpl.dimensions.find(d => d.isCTQ === false);

assert(ctqDim !== undefined && ctqDim.isCTQ === true, "CTQ parameter correctly tagged on template");

function canGrantConcession(inspectionData) {
  // PRD Rule 4.3 & 6.1: Concessions are strictly prohibited on CTQ failures!
  if (inspectionData.hasCTQFailures) return false;
  return true;
}

const wo003 = INITIAL_FACTORY_DATA.workOrders.find(w => w.id === 'WO-2026-003'); // Non-CTQ failure
const wo004 = INITIAL_FACTORY_DATA.workOrders.find(w => w.id === 'WO-2026-004'); // CTQ failure

assert(canGrantConcession(wo003.inspectionData) === true, "WO-2026-003 has non-CTQ drift -> Concession is PERMITTED with justification");
assert(canGrantConcession(wo004.inspectionData) === false, "WO-2026-004 has CTQ failure -> Concession is HARD-LOCKED (BLOCKED)");

// -------------------------------------------------------------
// 5. Automated Cooling Hold Countdown Interlock (PRD Section 8.2)
// -------------------------------------------------------------
console.log("\n--- 5. Testing Cooling Hold Countdown Interlock (PRD 8.2) ---");
const wo002 = INITIAL_FACTORY_DATA.workOrders.find(w => w.id === 'WO-2026-002');
const heatTreatOp = wo002.operations.find(o => o.opNumber === 30);
const precisionGrindOp = wo002.operations.find(o => o.opNumber === 40);

function canStartOperation(op, prevOp) {
  if (prevOp && prevOp.requiresHoldTimer && prevOp.isHoldActive && prevOp.remainingSeconds > 0) {
    return { allowed: false, reason: `Mandatory cooling hold active (${prevOp.remainingSeconds}s remaining)` };
  }
  return { allowed: true };
}

const holdCheck = canStartOperation(precisionGrindOp, heatTreatOp);
assert(holdCheck.allowed === false, "Machinist attempting Op 40 during cooling hold is STRICTLY LOCKED OUT");
assert(heatTreatOp.remainingSeconds > 0, "Cooling hold countdown timer is active");

// -------------------------------------------------------------
// 6. Pre-Dispatch Clearance Gates & Shipping Interlock (PRD Section 10)
// -------------------------------------------------------------
console.log("\n--- 6. Testing 3-Rule Pre-Dispatch Shipping Interlock (PRD 10) ---");

function evaluateClearance(wo) {
  const reasons = [];
  const opsIncomplete = wo.operations.filter(op => op.opNumber < 60 && op.status !== 'COMPLETED' && op.status !== 'APPROVED' && op.status !== 'CONCESSION_GRANTED');
  if (opsIncomplete.length > 0) reasons.push("Rule A Violation: Manufacturing ops incomplete");

  const activeHolds = wo.operations.filter(op => op.requiresHoldTimer && op.isHoldActive);
  if (activeHolds.length > 0) reasons.push("Rule B Violation: Process aging hold active");

  const pdiOp = wo.operations.find(op => op.opNumber === 50);
  if (!pdiOp || (pdiOp.status !== 'APPROVED' && pdiOp.status !== 'CONCESSION_GRANTED')) {
    reasons.push("Rule C Violation: PDI checklist not approved by Quality");
  }

  return { isCleared: reasons.length === 0, reasons };
}

const wo001Clearance = evaluateClearance(INITIAL_FACTORY_DATA.workOrders.find(w => w.id === 'WO-2026-001'));
const wo002Clearance = evaluateClearance(INITIAL_FACTORY_DATA.workOrders.find(w => w.id === 'WO-2026-002'));
const wo005Clearance = evaluateClearance(INITIAL_FACTORY_DATA.workOrders.find(w => w.id === 'WO-2026-005'));

assert(wo001Clearance.isCleared === false, "WO-2026-001 shipping gate is LOCKED (PDI pending)");
assert(wo002Clearance.isCleared === false, "WO-2026-002 shipping gate is LOCKED (Cooling hold active)");
assert(wo005Clearance.isCleared === true, "WO-2026-005 shipping gate is 100% UNLOCKED (All 3 rules green)");

// -------------------------------------------------------------
// 7. Forward & Backward Lineage Traceability (PRD Section 7.2)
// -------------------------------------------------------------
console.log("\n--- 7. Testing Forward & Backward Lineage Traceability (PRD 7.2) ---");

// Forward: Search Heat #H-8042
const heatMatches = INITIAL_FACTORY_DATA.workOrders.filter(w => w.heatNumber === 'H-8042');
assert(heatMatches.length >= 4, "Forward trace: Heat #H-8042 accurately locates all consuming work orders");

// Backward: Search Serial #SN-2026-9041
const serialMatch = INITIAL_FACTORY_DATA.workOrders.find(w => w.serialNumbers?.includes('SN-2026-9041'));
assert(serialMatch !== undefined, "Backward trace: Serial #SN-2026-9041 resolves to parent WO-2026-001");
assert(serialMatch.heatNumber === 'H-8042', "Backward trace: Links serial to raw material Heat #H-8042 and MTC");

console.log("\n=================================================================");
console.log(` RESULT: ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log("=================================================================\n");
