import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Radio, 
  X, 
  ChevronUp, 
  Sparkles, 
  Compass, 
  Sliders, 
  HelpCircle, 
  Copy, 
  Check, 
  Activity,
  Layers,
  Languages
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export default function VoiceAssistantHUD() {
  const {
    voiceAssistantOpen,
    setVoiceAssistantOpen,
    voiceListening,
    setVoiceListening,
    voiceLanguage,
    setVoiceLanguage,
    lastVoiceEvent,
    soundEnabled,
    setSoundEnabled,
    handleVoiceCommand,
    speakText,
    voiceEngine,
    gloveMode
  } = useApp();

  const [interimText, setInterimText] = useState('');
  const [micSupported, setMicSupported] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [simulatedSpeechInput, setSimulatedSpeechInput] = useState('');
  const visualizerBars = [14, 28, 42, 65, 80, 52, 35, 70, 95, 60, 40, 20];

  const continuousRef = useRef(continuousMode);
  continuousRef.current = continuousMode;

  useEffect(() => {
    setMicSupported(voiceEngine.recognitionSupported);
  }, [voiceEngine]);

  // Toggle listening via Web Speech API
  const toggleListening = () => {
    if (voiceListening) {
      voiceEngine.stopListening();
      setVoiceListening(false);
      setInterimText('');
      sounds.playClick();
    } else {
      sounds.playClick();
      setInterimText('Listening for command...');
      const started = voiceEngine.startListening({
        onResult: (finalText) => {
          setInterimText('');
          handleVoiceCommand(finalText);
          if (continuousRef.current) {
            // Restart listening in continuous mode
            setTimeout(() => {
              if (continuousRef.current) toggleListening();
            }, 600);
          } else {
            setVoiceListening(false);
          }
        },
        onInterim: (text) => {
          setInterimText(text);
        },
        onError: (err) => {
          console.warn("Voice recognition warning:", err);
          setVoiceListening(false);
          setInterimText('');
        },
        onEnd: () => {
          if (!continuousRef.current) {
            setVoiceListening(false);
          }
        }
      });

      if (started) {
        setVoiceListening(true);
      } else {
        setVoiceListening(false);
        setInterimText('Microphone access unavailable. You can use Quick Voice buttons below.');
      }
    }
  };

  const handleSimulateCommand = (phrase) => {
    sounds.playClick();
    setInterimText(`Spoken: "${phrase}"`);
    handleVoiceCommand(phrase);
    setTimeout(() => setInterimText(''), 3000);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!simulatedSpeechInput.trim()) return;
    handleSimulateCommand(simulatedSpeechInput.trim());
    setSimulatedSpeechInput('');
  };

  const copyLastTranscript = () => {
    if (!lastVoiceEvent?.transcript) return;
    navigator.clipboard?.writeText(lastVoiceEvent.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Floating Docked Voice Trigger Badge (Always visible at bottom right) */}
      <div 
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Quick One-Tap Mic Toggle */}
        <button
          onClick={toggleListening}
          className="btn"
          style={{
            width: gloveMode ? 56 : 48,
            height: gloveMode ? 56 : 48,
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: voiceListening ? '#ef4444' : '#0284c7',
            color: '#fff',
            boxShadow: voiceListening 
              ? '0 0 25px rgba(239, 68, 68, 0.8), 0 4px 12px rgba(0,0,0,0.5)' 
              : '0 0 20px rgba(2, 132, 199, 0.6), 0 4px 12px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.4)',
            transition: 'all 0.2s',
            animation: voiceListening ? 'pulseFail 1.2s infinite' : 'none'
          }}
          title={voiceListening ? "Listening... (Tap to stop)" : "Hands-Free Voice Control (Tap to speak)"}
        >
          {voiceListening ? <Radio size={gloveMode ? 24 : 20} className="animate-spin" /> : <Mic size={gloveMode ? 24 : 20} />}
        </button>

        {/* Expand HUD Pill */}
        <button
          onClick={() => {
            setVoiceAssistantOpen(!voiceAssistantOpen);
            sounds.playClick();
          }}
          className="card-glass"
          style={{
            height: gloveMode ? 56 : 48,
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            border: '1px solid var(--border-medium)',
            borderRadius: 28,
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            boxShadow: 'var(--shadow-lg), 0 0 15px rgba(6, 182, 212, 0.25)',
            color: '#fff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: voiceListening ? '#ef4444' : '#10b981',
              boxShadow: voiceListening ? '0 0 8px #ef4444' : '0 0 8px #10b981'
            }}></span>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
              VOICE AI
            </span>
          </div>

          <span className="badge badge-cyan" style={{ fontSize: 10, padding: '2px 6px' }}>
            {voiceLanguage === 'en-US' ? 'EN' : 'বাংলা'}
          </span>

          <ChevronUp 
            size={16} 
            style={{ 
              transform: voiceAssistantOpen ? 'rotate(180deg)' : 'none', 
              transition: 'transform 0.2s' 
            }} 
          />
        </button>
      </div>

      {/* Expanded Voice Assistant HUD Panel */}
      {voiceAssistantOpen && (
        <div
          className="card-glass"
          style={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            width: gloveMode ? 440 : 400,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 120px)',
            zIndex: 9998,
            backgroundColor: 'rgba(10, 15, 29, 0.96)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl), 0 0 40px rgba(0,0,0,0.9), 0 0 20px rgba(6, 182, 212, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.15))',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(6, 182, 212, 0.4)'
              }}>
                <Sparkles size={18} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#fff' }}>
                  Zapuza Shopfloor Voice Assistant
                </h3>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  Hands-Free QC & Voice Navigation
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Language Switch */}
              <button
                onClick={() => {
                  const nextLang = voiceLanguage === 'en-US' ? 'bn-BD' : 'en-US';
                  setVoiceLanguage(nextLang);
                  speakText(nextLang === 'en-US' ? "Language set to English" : "ভাষা বাংলা করা হয়েছে", true);
                }}
                className="btn btn-outline"
                style={{ padding: '4px 8px', fontSize: 11 }}
                title="Toggle Language between English and Bengali"
              >
                <Languages size={13} />
                <span>{voiceLanguage === 'en-US' ? 'EN' : 'বাং'}</span>
              </button>

              {/* Sound Output Toggle */}
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                  sounds.playClick();
                }}
                className="btn btn-outline"
                style={{ padding: '4px 8px', fontSize: 11 }}
                title={soundEnabled ? "Mute Voice Output" : "Enable Voice Output"}
              >
                {soundEnabled ? <Volume2 size={14} color="#34d399" /> : <VolumeX size={14} color="#ef4444" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setVoiceAssistantOpen(false)}
                className="btn btn-outline"
                style={{ padding: '4px 8px', fontSize: 11 }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Active Listening Visualizer & Live Transcript */}
          <div style={{ padding: '16px 18px', backgroundColor: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-subtle)' }}>
            
            {/* Status indicator with animated bars */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: voiceListening ? '#ef4444' : '#64748b',
                  boxShadow: voiceListening ? '0 0 10px #ef4444' : 'none',
                  animation: voiceListening ? 'pulseFail 1s infinite' : 'none'
                }}></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: voiceListening ? '#f87171' : 'var(--text-muted)' }}>
                  {voiceListening ? 'LISTENING LIVE...' : 'MICROPHONE STANDBY'}
                </span>
              </div>

              {/* Hands-Free Continuous Mode Toggle */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={continuousMode}
                  onChange={(e) => {
                    setContinuousMode(e.target.checked);
                    sounds.playClick();
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span>Continuous Hands-Free</span>
              </label>
            </div>

            {/* Audio Wave Visualizer Simulation */}
            <div style={{
              height: 38,
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '0 12px'
            }}>
              {visualizerBars.map((height, i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: voiceListening ? `${Math.max(6, (height * (Math.sin(Date.now() / 150 + i) + 1.2)) / 2)}%` : '6%',
                    backgroundColor: voiceListening ? '#38bdf8' : '#334155',
                    borderRadius: 2,
                    transition: 'height 0.1s ease',
                    boxShadow: voiceListening ? '0 0 8px rgba(56, 189, 248, 0.6)' : 'none'
                  }}
                />
              ))}
            </div>

            {/* Live speech output / Interim transcription */}
            <div style={{ marginTop: 10, minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {interimText ? (
                <div style={{ fontSize: 13, color: '#38bdf8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Radio size={14} className="animate-spin" />
                  <span>"{interimText}"</span>
                </div>
              ) : lastVoiceEvent ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last Heard ({lastVoiceEvent.timestamp}):</span>
                    <button onClick={copyLastTranscript} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} title="Copy transcript">
                      {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>
                    "{lastVoiceEvent.transcript}"
                  </div>
                  {lastVoiceEvent.feedback && (
                    <div className="badge badge-pass" style={{ fontSize: 11, marginTop: 4 }}>
                      ✓ {lastVoiceEvent.feedback}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Click the red mic below or say: <em>"Set Dimension 1 to 45.02"</em>, <em>"Open Supervisor"</em>, <em>"Read Status"</em>
                </div>
              )}
            </div>

            {/* Primary Big Mic Trigger inside HUD */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={toggleListening}
                className={`btn ${voiceListening ? 'btn-danger' : 'btn-primary'}`}
                style={{ flex: 1, padding: '10px 14px', fontSize: 13, justifyContent: 'center' }}
              >
                {voiceListening ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{voiceListening ? 'Stop Listening' : 'Click to Speak (Microphone)'}</span>
              </button>

              <button
                onClick={() => speakText("Zapuza shopfloor voice assistant is ready. Say or click any command.", true)}
                className="btn btn-outline"
                style={{ padding: '10px 14px' }}
                title="Test Voice Audio Output"
              >
                <Volume2 size={16} />
              </button>
            </div>

            {!micSupported && (
              <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 8 }}>
                ℹ️ Browser speech recognition unavailable. Use the Instant Voice Simulator chips below to trigger voice commands!
              </div>
            )}
          </div>

          {/* Quick Command Chips & Voice Simulator */}
          <div style={{ padding: '14px 18px', overflowY: 'auto', maxHeight: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* Quick Type Simulator Input */}
            <form onSubmit={handleCustomSubmit} style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={simulatedSpeechInput}
                onChange={(e) => setSimulatedSpeechInput(e.target.value)}
                placeholder="Type or simulate voice command..."
                style={{ fontSize: 12, padding: '6px 10px', flex: 1 }}
              />
              <button type="submit" className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}>
                Run
              </button>
            </form>

            {/* Dimension Measurement Voice Commands */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sliders size={12} />
                <span>Hands-Free Measurement Entry</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Set Dim 1 to 45.02 mm (Pass)', cmd: 'set dimension 1 to 45.02' },
                  { label: 'Set Dim 2 to 120.0 mm (Pass)', cmd: 'set dimension 2 to 120.0' },
                  { label: 'Set Dim 3 to 25.4 mm (CTQ Fail)', cmd: 'set dimension 3 to 25.4' },
                  { label: 'Pass Visual Inspection', cmd: 'pass' },
                  { label: 'Fail Visual (Burr)', cmd: 'fail' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSimulateCommand(item.cmd)}
                    className="btn btn-outline"
                    style={{ fontSize: 11, padding: '4px 9px', borderRadius: 'var(--radius-sm)' }}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Voice Commands */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Compass size={12} />
                <span>Hands-Free Navigation</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Floor Inspector', cmd: 'open floor inspector' },
                  { label: 'Blueprint Studio', cmd: 'open blueprint studio' },
                  { label: 'Supervisor Queue', cmd: 'open supervisor queue' },
                  { label: 'Job Traveler', cmd: 'open traveler' },
                  { label: 'Shipping Gate', cmd: 'open shipping gate' },
                  { label: 'Traceability', cmd: 'open traceability' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSimulateCommand(item.cmd)}
                    className="btn btn-outline"
                    style={{ fontSize: 11, padding: '4px 9px', borderRadius: 'var(--radius-sm)' }}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action & Query Voice Commands */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={12} />
                <span>Status & Audio Queries</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Read Current Status', cmd: 'read status' },
                  { label: 'Read Checklist Parameters', cmd: 'read checklist' },
                  { label: 'Toggle Glove Mode', cmd: 'glove mode' },
                  { label: 'Take Defect Photo', cmd: 'take photo' },
                  { label: 'Submit Inspection', cmd: 'submit inspection' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSimulateCommand(item.cmd)}
                    className="btn btn-outline"
                    style={{ fontSize: 11, padding: '4px 9px', borderRadius: 'var(--radius-sm)' }}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Info */}
          <div style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(0,0,0,0.4)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Web Speech API SpeechRecognition & Synthesis</span>
            <span style={{ color: '#38bdf8' }}>Zapuza Industrial AI</span>
          </div>

        </div>
      )}
    </>
  );
}
