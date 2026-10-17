import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BlueprintStudio from './components/BlueprintStudio/BlueprintStudio';
import InspectorTablet from './components/FloorInspector/InspectorTablet';
import ApprovalQueue from './components/SupervisorDashboard/ApprovalQueue';
import DigitalJobTraveler from './components/TravelerAndHoldTimer/DigitalJobTraveler';
import MRBHoldingArea from './components/SupervisorDashboard/MRBHoldingArea';
import ShippingGatekeeper from './components/ShippingGatekeeper/ShippingGatekeeper';
import TraceabilityEngine from './components/TraceabilityEngine/TraceabilityEngine';
import AuditTrail from './components/AuditTrail/AuditTrail';
import ShiftHandover from './components/ShiftHandover/ShiftHandover';
import { ShieldCheck, Cpu, HardDrive } from 'lucide-react';

function MainContent() {
  const { activeTab } = useApp();

  return (
    <main style={{ flex: 1, paddingBottom: 40 }}>
      {activeTab === 'floor-inspector' && <InspectorTablet />}
      {activeTab === 'blueprint-studio' && <BlueprintStudio />}
      {activeTab === 'supervisor-queue' && <ApprovalQueue />}
      {activeTab === 'travelers' && <DigitalJobTraveler />}
      {activeTab === 'rejection-mrb' && <MRBHoldingArea />}
      {activeTab === 'shipping-gate' && <ShippingGatekeeper />}
      {activeTab === 'traceability' && <TraceabilityEngine />}
      {activeTab === 'audit-log' && <AuditTrail />}
      {activeTab === 'shift-handover' && <ShiftHandover />}
    </main>
  );
}

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      padding: '16px 24px',
      backgroundColor: 'rgba(10, 13, 20, 0.95)',
      fontSize: 12,
      color: 'var(--text-secondary)'
    }}>
      <div style={{
        maxWidth: 1540,
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontWeight: 700, color: '#fff' }}>ZAPUZA TECHNOLOGIES LLP</span>
          <span>•</span>
          <span>Shopfloor Quality Assurance & Digital Traceability Operating System</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>ISO 9001:2015 & AS9100D Certified Architecture</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Cpu size={14} color="#06b6d4" />
            <span>Rugged Tablet Web Engine</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <HardDrive size={14} color="#8b5cf6" />
            <span>Zero Data Loss Offline Caching</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <MainContent />
        <Footer />
      </div>
    </AppProvider>
  );
}
