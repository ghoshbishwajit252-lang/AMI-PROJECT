// Industrial Shopfloor Speech Recognition & Speech Synthesis Engine
// Designed for rugged tablet hands-free quality control operations

class VoiceEngine {
  constructor() {
    this.recognition = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.isListening = false;
    this.language = 'en-US'; // 'en-US' or 'bn-BD'
    this.voice = null;
    this.muted = false;
    this.recognitionSupported = false;
    this.activeUtterance = null;

    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = this.language;
        this.recognitionSupported = true;
      }
    }
  }

  setLanguage(lang) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  // Text-To-Speech (Spoken Audio Feedback)
  speak(text, priority = false) {
    if (this.muted || !this.synth || !text) return;

    try {
      if (priority || this.synth.speaking) {
        this.synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.language;
      utterance.rate = 1.05; // Slightly faster for industrial efficiency
      utterance.pitch = 1.0;

      // Select high quality voice if available
      const voices = this.synth.getVoices ? this.synth.getVoices() : [];
      if (voices.length > 0) {
        const langPrefix = this.language.slice(0, 2);
        const matchVoice = voices.find(v => v.lang.startsWith(langPrefix)) || voices.find(v => v.lang.startsWith('en'));
        if (matchVoice) {
          utterance.voice = matchVoice;
        }
      }

      this.activeUtterance = utterance;
      this.synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error or autoplay block:", e);
    }
  }

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Auditory Voice Announcements for Key Quality Events
  announceMeasurement(dimName, value, unit, isPass, isCTQ) {
    const valText = `${value} ${unit || 'millimeters'}`;
    let message = '';
    if (isPass) {
      message = `${dimName} measured ${valText}. Within tolerance. Passed.`;
    } else if (isCTQ) {
      message = `Critical alert! ${dimName} measured ${valText}. Out of specification. Critical To Quality freeze active!`;
    } else {
      message = `Warning. ${dimName} measured ${valText}. Out of tolerance. Defect photo required.`;
    }
    this.speak(message, true);
  }

  announceStatus(statusText) {
    this.speak(statusText, true);
  }

  // Speech-To-Text (Microphone Listener)
  startListening({ onResult, onError, onEnd, onInterim }) {
    if (!this.recognitionSupported || !this.recognition) {
      if (onError) onError(new Error("Web Speech Recognition is not supported in this browser. You can use the Quick Voice Action buttons."));
      return false;
    }

    try {
      this.recognition.lang = this.language;
      this.isListening = true;

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (interimTranscript && onInterim) {
          onInterim(interimTranscript);
        }

        if (finalTranscript && onResult) {
          onResult(finalTranscript.trim());
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        if (onError) onError(event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err) {
      this.isListening = false;
      if (onError) onError(err);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
    }
    this.isListening = false;
  }

  // Natural Language Command Parser for Manufacturing Operations
  parseCommand(text) {
    if (!text) return null;
    const lower = text.toLowerCase().trim();

    // 1. Navigation Commands
    if (lower.includes('floor inspector') || lower.includes('inspector') || lower.includes('tablet')) {
      return { type: 'NAVIGATE', tab: 'floor-inspector', feedback: 'Navigating to Floor Inspector Tablet.' };
    }
    if (lower.includes('blueprint') || lower.includes('cad') || lower.includes('pinning')) {
      return { type: 'NAVIGATE', tab: 'blueprint-studio', feedback: 'Opening Blueprint CAD Pinning Studio.' };
    }
    if (lower.includes('supervisor') || lower.includes('approval') || lower.includes('queue')) {
      return { type: 'NAVIGATE', tab: 'supervisor-queue', feedback: 'Opening Shift Supervisor Approval Queue.' };
    }
    if (lower.includes('traveler') || lower.includes('timer') || lower.includes('cooling')) {
      return { type: 'NAVIGATE', tab: 'travelers', feedback: 'Opening Digital Job Traveler & Cooling Timers.' };
    }
    if (lower.includes('mrb') || lower.includes('rejection') || lower.includes('quarantine')) {
      return { type: 'NAVIGATE', tab: 'rejection-mrb', feedback: 'Opening MRB Rejection & Quarantine Bay.' };
    }
    if (lower.includes('shipping') || lower.includes('gate') || lower.includes('dispatch')) {
      return { type: 'NAVIGATE', tab: 'shipping-gate', feedback: 'Opening Pre-Dispatch Shipping Gatekeeper.' };
    }
    if (lower.includes('traceability') || lower.includes('genealogy') || lower.includes('lineage')) {
      return { type: 'NAVIGATE', tab: 'traceability', feedback: 'Opening Forward & Backward Traceability Engine.' };
    }
    if (lower.includes('audit') || lower.includes('log')) {
      return { type: 'NAVIGATE', tab: 'audit-log', feedback: 'Opening Immutable Cryptographic Audit Log.' };
    }
    if (lower.includes('handover') || lower.includes('shift')) {
      return { type: 'NAVIGATE', tab: 'shift-handover', feedback: 'Opening Digital Shift Handover Protocol.' };
    }

    // 2. Glove Mode Toggle
    if (lower.includes('glove mode') || lower.includes('gloves')) {
      return { type: 'TOGGLE_GLOVE', feedback: 'Toggled Glove-Friendly High Contrast Mode.' };
    }

    // 3. Audio Mute Toggle
    if (lower.includes('mute') || lower.includes('silence') || lower.includes('quiet')) {
      return { type: 'SET_MUTE', muted: true, feedback: 'Voice and sound muted.' };
    }
    if (lower.includes('unmute') || lower.includes('sound on') || lower.includes('voice on')) {
      return { type: 'SET_MUTE', muted: false, feedback: 'Voice audio activated.' };
    }

    // 4. Camera / Dual QR Scanner Actions
    if (lower.includes('take photo') || lower.includes('camera') || lower.includes('defect photo')) {
      return { type: 'OPEN_CAMERA', feedback: 'Opening Defect Photo Capture modal.' };
    }
    if (lower.includes('scan') || lower.includes('qr') || lower.includes('barcode')) {
      return { type: 'SCAN_QR', feedback: 'Opening Dual QR Station & Traveler Scanner.' };
    }

    // 5. Submit Inspection Action
    if (lower.includes('submit') || lower.includes('complete inspection') || lower.includes('send to supervisor')) {
      return { type: 'SUBMIT_INSPECTION', feedback: 'Submitting floor inspection for supervisor approval.' };
    }

    // 6. Read / Voice Readout of Job Status
    if (lower.includes('read status') || lower.includes('what is the status') || lower.includes('job status') || lower.includes('tell status')) {
      return { type: 'READ_STATUS', feedback: 'Reading current work order status.' };
    }
    if (lower.includes('read dimensions') || lower.includes('read checklist') || lower.includes('checklist')) {
      return { type: 'READ_CHECKLIST', feedback: 'Reading inspection checklist parameters.' };
    }

    // 7. Measurement Value Entry: e.g. "Dimension 1 45.02", "set dim 1 to 45.2", "point 2 is 120", "pin 3 is 24.5"
    const dimRegex = /(?:dimension|dim|pin|point|parameter)\s*(\d+|one|two|three|four|five)[\s\w]*(?:to|is|=)?\s*(-?\d+(?:\.\d+)?)/i;
    const dimMatch = lower.match(dimRegex);
    if (dimMatch) {
      const dimNumStr = dimMatch[1];
      const valStr = dimMatch[2];
      const numMap = { one: 1, two: 2, three: 3, four: 4, five: 5 };
      const dimIndex = numMap[dimNumStr] || parseInt(dimNumStr, 10);
      return {
        type: 'SET_DIMENSION_VALUE',
        dimIndex: dimIndex,
        value: valStr,
        feedback: `Setting Dimension ${dimIndex} to ${valStr}.`
      };
    }

    // Check for direct numeric entry if user just says "45.02" or "set 45.02"
    const directNumMatch = lower.match(/^(?:set|enter|value|reading)?\s*(-?\d+(?:\.\d+)?)$/i);
    if (directNumMatch) {
      return {
        type: 'SET_CURRENT_DIMENSION_VALUE',
        value: directNumMatch[1],
        feedback: `Applying measurement ${directNumMatch[1]} to active dimension.`
      };
    }

    // Pass / Fail direct voice command
    if (lower === 'pass' || lower === 'conforming' || lower === 'ok' || lower === 'passed' || lower.includes('pass visual')) {
      return { type: 'SET_PASS_FAIL', value: '1', feedback: 'Marked dimension as Conforming (Pass).' };
    }
    if (lower === 'fail' || lower === 'non conforming' || lower === 'burr' || lower === 'failed' || lower.includes('fail visual')) {
      return { type: 'SET_PASS_FAIL', value: '0', feedback: 'Marked dimension as Non-Conforming (Fail).' };
    }

    // 8. Dictate Note: e.g. "note: burr detected on outer edge", "remark: tool calibrated today"
    if (lower.startsWith('note') || lower.startsWith('remark') || lower.startsWith('dictate') || lower.startsWith('comment')) {
      const noteContent = text.replace(/^(?:note|remark|dictate|comment)s?\s*(?:is|:)?\s*/i, '');
      return {
        type: 'APPEND_NOTE',
        content: noteContent,
        feedback: `Added remark: "${noteContent}"`
      };
    }

    // Default: Return as unrecognized command or general text
    return {
      type: 'GENERAL_TEXT',
      rawText: text,
      feedback: `Heard: "${text}". Say "Help" for list of commands.`
    };
  }
}

export const voiceEngine = new VoiceEngine();
