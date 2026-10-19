import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  CheckCircle2, 
  QrCode, 
  Flame, 
  Truck, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Hand, 
  Search, 
  ScrollText, 
  FileCheck2, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles,
  RefreshCw,
  Mic
} from 'lucide-react';
import { sounds } from '../utils/audio';

export default function Navbar() {
  const { 
    currentUser, 
    setCurrentUser, 
    gloveMode, 
    setGloveMode, 
    soundEnabled, 
    setSoundEnabled,
    voiceAssistantOpen,
    setVoiceAssistantOpen,
    voiceListening,
    activeTab, 
    setActiveTab, 
    setSelectedWorkOrderId,
    resetToFactoryDemo,
    factoryData
  } = useApp();

  const [showDemoMenu, setShowDemoMenu] = useState(false);

  // Available roles per PRD Section 12
  const roles = [
    { name: "P. Sharma", role: "QA Floor Inspector", id: "EMP-QC-04" },
    { name: "S. Gupta", role: "Shift Supervisor", id: "EMP-SS-02" },
    { name: "Marcus Vance", role: "Quality Manager", id: "EMP-QM-001" },
    { name: "A. Patel", role: "Quality Engineer", id: "EMP-QE-01" },
    { name: "T. Baker", role: "Warehouse Lead", id: "EMP-WH-05" },
  ];

  // Demo scenarios to quickly demonstrate the 4+ core functionalities
  const demoScenarios = [
    {
      title: "1. Floor Inspection: Pass & Dual QR Scan",
      desc: "WO-2026-001: Station scan, live green tolerance computation, and signoff",
      tab: "floor-inspector",
      woId: "WO-2026-001",
      role: "QA Floor Inspector"
    },
    {
      title: "2. Out-of-Tolerance & Defect Photo Capture",
      desc: "WO-2026-003: Non-CTQ deviation triggers mandatory 2-photo workflow",
      tab: "floor-inspector",
      woId: "WO-2026-003",
      role: "QA Floor Inspector"
    },
    {
      title: "3. Supervisor Conditional Concession vs CTQ Freeze",
      desc: "Shift queue: Review measurements, test CTQ concession lock rule",
      tab: "supervisor-queue",
      woId: "WO-2026-003",
      role: "Shift Supervisor"
    },
    {
      title: "4. Automated Cooling Hold Countdown Interlock",
      desc: "WO-2026-002: Op 30 cooling hold active, Op 40 locked out in RED",
      tab: "travelers",
      woId: "WO-2026-002",
      role: "Shift Supervisor"
    },
    {
      title: "5. Pre-Dispatch Gatekeeper & Shipping Interlock",
      desc: "WO-2026-005: 3-rule automated clearance check, Gate Pass & QR label",
      tab: "shipping-gate",
      woId: "WO-2026-005",
      role: "Warehouse Lead"
    },
    {
      title: "6. Interactive CAD Blueprint Pinning Studio",
      desc: "Click CAD blueprint to place/inspect pins with CTQ flags",
      tab: "blueprint-studio",
      woId: "WO-2026-001",
      role: "Quality Engineer"
    },
    {
      title: "7. Forward & Backward Lineage Traceability",
      desc: "Query Heat #H-8042 or Part #SN-2026-9041 full birth certificate",
      tab: "traceability",
      woId: "WO-2026-001",
      role: "Quality Manager"
    }
  ];

  const handleSelectScenario = (sc) => {
    const userMatch = roles.find(r => r.role === sc.role) || roles[0];
    setCurrentUser(userMatch);
    setSelectedWorkOrderId(sc.woId);
    setActiveTab(sc.tab);
    setShowDemoMenu(false);
    sounds.playClick();
  };

  const toggleSound = () => {
    sounds.muted = soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  // Badge count for supervisor queue
  const pendingSupervisorCount = factoryData.workOrders.filter(
    wo => wo.overallStatus === 'AWAITING_SUPERVISOR_APPROVAL'
  ).length;

  const quarantinedCount = factoryData.workOrders.filter(
    wo => wo.overallStatus.includes('QUARANTINED')
  ).length;

  return (
    <header style={{ 
      background: 'linear-gradient(180deg, #0e1626 0%, #0a0e1a 100%)', 
      borderBottom: '1px solid var(--border-medium)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.6)'
    }}>
      {/* Top Bar: Brand, Plant Status, Role, Glove Mode, Quick Demos */}
      <div style={{
        maxWidth: 1540,
        margin: '0 auto',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand & Factory Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #06b6d4, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(6, 182, 212, 0.5)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Layers size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ 
                fontFamily: 'var(--font-heading)', 
                fontSize: 20, 
                fontWeight: 800, 
                letterSpacing: '0.04em',
                background: 'linear-gradient(90deg, #ffffff, #38bdf8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ZAPUZA Q-CORE
              </span>
              <span className="badge badge-cyan" style={{ fontSize: 10, padding: '2px 7px' }}>
                PRD v5.0
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }}></span>
              <span>Plant #01 • Main Machining Bay • Shift B (Active)</span>
            </div>
          </div>
        </div>

        {/* Action Controls & Switchers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          
          {/* Quick Demo Scenario Menu Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: 13 }}
              title="Launch instant end-to-end PRD demo flows"
            >
              <Sparkles size={16} />
              <span>Interactive Scenarios</span>
              <ChevronDown size={14} />
            </button>

            {showDemoMenu && (
              <div 
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 380,
                  backgroundColor: '#111827',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg), 0 0 30px rgba(0,0,0,0.8)',
                  zIndex: 1000,
                  overflow: 'hidden',
                  animation: 'slideUp 0.15s ease-out'
                }}
              >
                <div style={{ 
                  padding: '12px 16px', 
                  backgroundColor: 'rgba(6, 182, 212, 0.08)', 
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Select PRD Test Scenario
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>7 Scenarios</span>
                </div>
                <div style={{ maxHeight: 420, overflowY: 'auto', padding: 6 }}>
                  {demoScenarios.map((sc, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectScenario(sc)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        marginBottom: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-bright)' }}>
                          {sc.title}
                        </span>
                        <span className="badge badge-cyan" style={{ fontSize: 10 }}>{sc.role}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{sc.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Role Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Role:</span>
            <select
              value={currentUser.role}
              onChange={(e) => {
                const found = roles.find(r => r.role === e.target.value);
                if (found) {
                  setCurrentUser(found);
                  sounds.playClick();
                }
              }}
              style={{
                width: 'auto',
                padding: '7px 12px',
                fontSize: 12,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: 'var(--border-medium)',
                color: '#38bdf8',
                fontWeight: 600
              }}
            >
              {roles.map(r => (
                <option key={r.role} value={r.role} style={{ backgroundColor: '#111827', color: '#f8fafc' }}>
                  {r.role} ({r.name})
                </option>
              ))}
            </select>
          </div>

          {/* Glove-Friendly Mode Toggle */}
          <button
            onClick={() => {
              setGloveMode(!gloveMode);
              sounds.playClick();
            }}
            className={`btn ${gloveMode ? 'btn-warning' : 'btn-outline'}`}
            style={{ padding: '7px 13px', fontSize: 12 }}
            title="Toggle high-contrast large touch targets for shopfloor tablets"
          >
            <Hand size={15} />
            <span>{gloveMode ? 'Glove Mode: ON' : 'Glove Mode'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="btn btn-outline"
            style={{ padding: '7px 10px', fontSize: 12 }}
            title={soundEnabled ? 'Mute audio cues' : 'Enable audio feedback'}
          >
            {soundEnabled ? <Volume2 size={16} color="#34d399" /> : <VolumeX size={16} color="#ef4444" />}
          </button>

          {/* Voice Assistant Toggle */}
          <button
            onClick={() => {
              setVoiceAssistantOpen(!voiceAssistantOpen);
              sounds.playClick();
            }}
            className={`btn ${voiceAssistantOpen || voiceListening ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              padding: '7px 12px', 
              fontSize: 12, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              boxShadow: voiceListening ? '0 0 15px rgba(6, 182, 212, 0.7)' : 'none'
            }}
            title="Shopfloor AI Voice Assistant (Hands-Free Quality Control)"
          >
            <Mic size={15} color={voiceListening ? '#ef4444' : voiceAssistantOpen ? '#38bdf8' : 'currentColor'} />
            <span>Voice AI</span>
          </button>

          {/* Reset System State Button */}
          <button
            onClick={() => {
              if (window.confirm("Reset all factory data back to initial PRD demo baseline?")) {
                resetToFactoryDemo();
              }
            }}
            className="btn btn-outline"
            style={{ padding: '7px 10px', fontSize: 12 }}
            title="Reset to fresh demo data"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs - Comprehensive Coverage of All Modules */}
      <div style={{
        maxWidth: 1540,
        margin: '0 auto',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        overflowX: 'auto',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <button
          className={`nav-tab ${activeTab === 'floor-inspector' ? 'active' : ''}`}
          onClick={() => { setActiveTab('floor-inspector'); sounds.playClick(); }}
        >
          <QrCode size={16} />
          <span>Floor Inspector Tablet</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'blueprint-studio' ? 'active' : ''}`}
          onClick={() => { setActiveTab('blueprint-studio'); sounds.playClick(); }}
        >
          <Layers size={16} />
          <span>Blueprint Pinning Studio</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'supervisor-queue' ? 'active' : ''}`}
          onClick={() => { setActiveTab('supervisor-queue'); sounds.playClick(); }}
          style={{ position: 'relative' }}
        >
          <FileCheck2 size={16} />
          <span>Supervisor Queue</span>
          {pendingSupervisorCount > 0 && (
            <span style={{
              backgroundColor: '#f59e0b',
              color: '#000',
              fontWeight: 800,
              fontSize: 10,
              borderRadius: 10,
              padding: '1px 6px',
              marginLeft: 4
            }}>
              {pendingSupervisorCount}
            </span>
          )}
        </button>

        <button
          className={`nav-tab ${activeTab === 'travelers' ? 'active' : ''}`}
          onClick={() => { setActiveTab('travelers'); sounds.playClick(); }}
        >
          <Flame size={16} />
          <span>Job Travelers & Hold Timers</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'rejection-mrb' ? 'active' : ''}`}
          onClick={() => { setActiveTab('rejection-mrb'); sounds.playClick(); }}
        >
          <ShieldAlert size={16} />
          <span>MRB Rejection Holding Area</span>
          {quarantinedCount > 0 && (
            <span style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              fontWeight: 800,
              fontSize: 10,
              borderRadius: 10,
              padding: '1px 6px',
              marginLeft: 4
            }}>
              {quarantinedCount}
            </span>
          )}
        </button>

        <button
          className={`nav-tab ${activeTab === 'shipping-gate' ? 'active' : ''}`}
          onClick={() => { setActiveTab('shipping-gate'); sounds.playClick(); }}
        >
          <Truck size={16} />
          <span>Shipping Gate & Interlocks</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'traceability' ? 'active' : ''}`}
          onClick={() => { setActiveTab('traceability'); sounds.playClick(); }}
        >
          <Search size={16} />
          <span>Lineage & Traceability</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'audit-log' ? 'active' : ''}`}
          onClick={() => { setActiveTab('audit-log'); sounds.playClick(); }}
        >
          <ScrollText size={16} />
          <span>Tamper-Proof Audit Trail</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'shift-handover' ? 'active' : ''}`}
          onClick={() => { setActiveTab('shift-handover'); sounds.playClick(); }}
        >
          <RotateCcw size={16} />
          <span>Shift Handover</span>
        </button>
      </div>
    </header>
  );
}
