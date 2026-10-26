import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  UserCheck,
  Briefcase,
  Users,
  ShieldCheck,
  Radio
} from 'lucide-react';

// DTMF Tone Frequencies for standard telephone keypads
const DTMF_FREQS = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
};

export default function CallBotSimulator({
  preselectedJob,
  isModal = false,
  onClose,
  initialMode = 'job_notification'
}) {
  const { showToast } = useAuth();

  const [callActive, setCallActive] = useState(false);
  const [callRinging, setCallRinging] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [language, setLanguage] = useState('hi');
  const [mode, setMode] = useState(initialMode || 'job_notification');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJob?.job_id || '');
  const [callLogs, setCallLogs] = useState([]);
  const [currentState, setCurrentState] = useState('IDLE');
  const [botMessage, setBotMessage] = useState('Press "Dial Call" to initiate an interactive voice session.');
  const [voiceInput, setVoiceInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [bhashiniActive, setBhashiniActive] = useState(false);
  const [useBhashini, setUseBhashini] = useState(true);

  const logsEndRef = useRef(null);
  const audioCtxRef = useRef(null);
  const recognitionRef = useRef(null);
  const bhashiniAudioRef = useRef(null);

  useEffect(() => {
    api.getBhashiniStatus()
      .then((res) => {
        if (res && res.configured) {
          setBhashiniActive(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api.getMyJobs().then((res) => {
      if (res.success && res.data && res.data.length > 0) {

        setAvailableJobs(res.data);
        if (!selectedJobId) {
          setSelectedJobId(res.data[0].job_id);
        }
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (preselectedJob?.job_id) {
      setSelectedJobId(preselectedJob.job_id);
    }
  }, [preselectedJob]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [callLogs]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isModal || !onClose) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, onClose]);

  // Play realistic DTMF telephone dual-tones using Web Audio API
  const playDtmfTone = (digit) => {
    if (!audioEnabled || typeof window === 'undefined') return;
    const freqs = DTMF_FREQS[digit];
    if (!freqs) return;

    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];

      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.14);
      osc2.stop(now + 0.14);
    } catch (e) {
      // AudioContext unavailable or blocked
    }
  };

  // Speech Synthesis (Bhashini Indic-TTS with Browser Fallback)
  const speakText = async (text) => {
    if (!audioEnabled || typeof window === 'undefined') return;

    // 1. Try Bhashini Indic-TTS if enabled and configured
    if (useBhashini && bhashiniActive) {
      try {
        setIsSpeaking(true);
        const res = await api.synthesizeBhashini({
          text,
          language,
          gender: 'female'
        });

        if (res && res.success && res.audioBase64) {
          if (bhashiniAudioRef.current) {
            bhashiniAudioRef.current.pause();
          }
          const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
          bhashiniAudioRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          await audio.play();
          return;
        }
      } catch (err) {
        console.warn('[CallBot] Bhashini Indic-TTS fallback to browser TTS:', err);
      }
    }

    // 2. Fallback to Browser Speech Synthesis (TTS)
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select accurate locale
      if (language === 'hi') utterance.lang = 'hi-IN';
      else if (language === 'mr') utterance.lang = 'mr-IN';
      else if (language === 'te') utterance.lang = 'te-IN';
      else utterance.lang = 'en-IN';

      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const matchVoice = voices.find((v) => v.lang.startsWith(language));
      if (matchVoice) utterance.voice = matchVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };


  // Browser Speech Recognition (STT Microphone Input)
  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Speech recognition is not supported in this browser. Please use text input or keypad.', 'info');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : language === 'te' ? 'te-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListeningMic(true);
    };

    recognition.onresult = (event) => {
      setIsListeningMic(false);
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setVoiceInput(transcript);
        handleSendInput(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListeningMic(false);
    };

    recognition.onend = () => {
      setIsListeningMic(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setIsListeningMic(false);
    }
  };

  const handleStartCall = async () => {
    setCallRinging(true);
    setCallLogs([]);
    setBotMessage('Connecting call via telephony gateway...');

    try {
      const payload = {
        job_id: mode === 'job_notification' || mode === 'customer_order' ? (selectedJobId || null) : null,
        language,
        mode
      };

      const res = await api.startCallSession(payload);
      if (res.success) {
        setTimeout(() => {
          setCallRinging(false);
          setCallActive(true);
          setSessionId(res.sessionId);
          setCurrentState(res.step?.nextState || 'ACTIVE');
          setBotMessage(res.step?.speechText || 'Connected');
          setCallLogs(res.conversationLog || []);
          if (res.step?.speechText) {
            speakText(res.step.speechText);
          }
        }, 900);
      }
    } catch (err) {
      setCallRinging(false);
      showToast(err.message || 'Call initialization failed', 'danger');
    }
  };

  const handleSendInput = async (inputVal) => {
    if (!sessionId || !callActive) return;

    try {
      const res = await api.stepCallSession({
        sessionId,
        input: inputVal,
        mode,
        language,
        job_id: selectedJobId || null,
        currentState
      });

      if (res.success) {
        setCurrentState(res.step?.nextState || 'COMPLETED');
        setBotMessage(res.step?.speechText || 'Thank you.');
        setCallLogs(res.conversationLog || []);
        if (res.step?.speechText) {
          speakText(res.step.speechText);
        }

        if (res.isComplete) {
          setTimeout(() => {
            setCallActive(false);
            showToast('Call completed successfully and database updated.', 'success');
          }, 4000);
        }
      }
    } catch (err) {
      if (err.message && (err.message.includes('ended') || err.message.includes('expired') || err.message.includes('not found'))) {
        setCallActive(false);
        setBotMessage('Call session ended. Click "Dial Outbound Call" to restart.');
        showToast('Call session ended. Please click "Dial Outbound Call" to start a new call.', 'info');
      } else {
        showToast(err.message || 'Step execution failed', 'danger');
      }
    }
  };

  const handleHangup = () => {
    setCallActive(false);
    setCallRinging(false);
    setIsSpeaking(false);
    if (bhashiniAudioRef.current) {
      try { bhashiniAudioRef.current.pause(); } catch (e) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setBotMessage('Call ended. Press "Dial Call" to initiate a new session.');
  };


  const content = (
    <div style={{ maxWidth: isModal ? '980px' : '960px', width: '100%', margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#F45B0A',
              backgroundColor: '#FFF1E8',
              padding: '3px 8px',
              borderRadius: '6px',
              textTransform: 'uppercase'
            }}>
              <Radio size={12} className={callActive ? 'hl-pulse' : ''} />
              AI Telephony Gateway
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>• PostgreSQL 18 Synced</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--dark)' }}>
            HireLocal Multilingual CallBot
          </h2>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <button
          type="button"
          disabled={callActive}
          onClick={() => setMode('job_notification')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: `1.5px solid ${mode === 'job_notification' ? '#2563EB' : 'var(--border)'}`,
            backgroundColor: mode === 'job_notification' ? '#EFF6FF' : 'var(--surface)',
            textAlign: 'left',
            cursor: callActive ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', color: mode === 'job_notification' ? '#1D4ED8' : 'var(--dark)' }}>
            <PhoneCall size={16} />
            <span>1. Outbound Worker Job Offer</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.3 }}>
            Calls craftsman phone with job details. Press 1 to Accept, 2 to Decline.
          </div>
        </button>

        <button
          type="button"
          disabled={callActive}
          onClick={() => setMode('registration')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: `1.5px solid ${mode === 'registration' ? '#16A34A' : 'var(--border)'}`,
            backgroundColor: mode === 'registration' ? '#EAF8EF' : 'var(--surface)',
            textAlign: 'left',
            cursor: callActive ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', color: mode === 'registration' ? '#15803D' : 'var(--dark)' }}>
            <UserCheck size={16} />
            <span>2. Worker Voice Registration</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.3 }}>
            2G workers register trade, name, rate & location without smartphone.
          </div>
        </button>

        <button
          type="button"
          disabled={callActive}
          onClick={() => setMode('customer_order')}
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            border: `1.5px solid ${mode === 'customer_order' ? '#7C3AED' : 'var(--border)'}`,
            backgroundColor: mode === 'customer_order' ? '#F5F3FF' : 'var(--surface)',
            textAlign: 'left',
            cursor: callActive ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '13.5px', color: mode === 'customer_order' ? '#6D28D9' : 'var(--dark)' }}>
            <Users size={16} />
            <span>3. Customer Order Confirmation</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.3 }}>
            Customer calls to check order status & confirm presence at home.
          </div>
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '20px',
        alignItems: 'start'
      }} className="callbot-grid">
        {/* Left Column: Settings & Live Dialogue Transcript */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Card */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                  Language / भाषा
                </label>
                <select
                  className="form-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={callActive}
                  style={{ fontSize: '13px' }}
                >
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="en">Indian English</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                </select>
              </div>

              {(mode === 'job_notification' || mode === 'customer_order') && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 700 }}>
                    Target Booking
                  </label>
                  <select
                    className="form-select"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    disabled={callActive}
                    style={{ fontSize: '13px' }}
                  >
                    {availableJobs.map((j) => (
                      <option key={j.job_id} value={j.job_id}>
                        {j.service_type} • {j.worker_name || 'Worker'} ({j.required_date})
                      </option>
                    ))}
                    {availableJobs.length === 0 && <option value="">Auto-matched Demo Order</option>}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  style={{ fontSize: '12px' }}
                >
                  {audioEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  <span>{audioEnabled ? 'Audio: On' : 'Audio: Muted'}</span>
                </button>

                <button
                  type="button"
                  className={`btn btn-sm ${useBhashini && bhashiniActive ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setUseBhashini(!useBhashini)}
                  title={bhashiniActive ? 'Using Bhashini Indic-TTS model' : 'Bhashini AI credentials in .env activate high-fidelity Indian voice'}
                  style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <span>🇮🇳</span>
                  <span>{bhashiniActive ? 'Bhashini AI: Active' : 'Bhashini AI: Ready'}</span>
                </button>
              </div>


              {!callActive && !callRinging ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartCall}
                  style={{ fontWeight: 700, padding: '0 20px', height: '42px', boxShadow: '0 4px 14px -3px rgba(244, 91, 10, 0.4)' }}
                >
                  <PhoneCall size={16} />
                  <span>Dial Outbound Call</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleHangup}
                  style={{ fontWeight: 700, padding: '0 20px', height: '42px' }}
                >
                  <PhoneOff size={16} />
                  <span>Hang Up</span>
                </button>
              )}
            </div>
          </div>

          {/* Transcript Box */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                Live Call Dialogue Transcript
              </h3>
              <span className="tag" style={{ fontSize: '11px', fontWeight: 700, backgroundColor: callActive ? '#EAF8EF' : 'var(--surface-alt)', color: callActive ? '#16A34A' : 'var(--text-muted)' }}>
                {callActive ? `State: ${currentState}` : 'IDLE'}
              </span>
            </div>

            <div style={{
              backgroundColor: '#FCFAF7',
              borderRadius: '12px',
              border: '1.5px solid var(--border)',
              padding: '16px',
              minHeight: '260px',
              maxHeight: '320px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {callLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: 'auto' }}>
                  No active call dialogue. Click "Dial Outbound Call" to test this flow.
                </div>
              ) : (
                callLogs.map((log, idx) => {
                  const isBot = log.speaker === 'bot';
                  return (
                    <div
                      key={idx}
                      style={{
                        alignSelf: isBot ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        backgroundColor: isBot ? '#FFFFFF' : '#EFF6FF',
                        border: `1px solid ${isBot ? '#ECE7E0' : '#BFDBFE'}`,
                        borderRadius: '10px',
                        padding: '10px 14px',
                        fontSize: '13px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isBot ? '#F45B0A' : '#2563EB', marginBottom: '3px' }}>
                        {isBot ? '🤖 HireLocal CallBot' : '👤 Worker / Caller'}
                      </div>
                      <div style={{ color: 'var(--dark)', lineHeight: 1.45 }}>
                        {log.message || log.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right Column: Phone Keypad Simulator */}
        <div className="card" style={{ padding: '22px 18px', textAlign: 'center' }}>
          <div style={{
            fontSize: '11.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            marginBottom: '10px'
          }}>
            Craftsman Phone Keypad (2G/GSM)
          </div>

          {/* Current Bot Speech Output Bubble */}
          <div style={{
            backgroundColor: callActive ? '#EFF6FF' : '#F8FAFC',
            border: `1.5px solid ${callActive ? '#93C5FD' : 'var(--border)'}`,
            borderRadius: '12px',
            padding: '12px',
            fontSize: '13px',
            color: 'var(--dark)',
            lineHeight: 1.4,
            marginBottom: '16px',
            minHeight: '75px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            position: 'relative'
          }}>
            {callRinging ? (
              <span style={{ color: '#2563EB', fontWeight: 700 }}>
                📞 Ringing worker standard phone (+91 98201 XXXXX)...
              </span>
            ) : (
              <span>{botMessage}</span>
            )}

            {/* Speaking animation indicator */}
            {isSpeaking && (
              <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '8px',
                display: 'flex',
                gap: '2px',
                alignItems: 'flex-end',
                height: '12px'
              }}>
                <span className="hl-eq-bar hl-eq-1" style={{ width: '2px', backgroundColor: '#2563EB' }} />
                <span className="hl-eq-bar hl-eq-2" style={{ width: '2px', backgroundColor: '#2563EB' }} />
                <span className="hl-eq-bar hl-eq-3" style={{ width: '2px', backgroundColor: '#2563EB' }} />
              </div>
            )}
          </div>

          {/* 3x4 DTMF Numeric Pad with Audio Beeps */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <button
                key={digit}
                type="button"
                className="btn btn-secondary"
                disabled={!callActive}
                onClick={() => {
                  playDtmfTone(digit);
                  handleSendInput(digit);
                }}
                style={{
                  height: '48px',
                  fontSize: '18px',
                  fontWeight: 800,
                  borderRadius: '10px',
                  backgroundColor: callActive ? '#FFFFFF' : 'var(--surface-alt)',
                  boxShadow: callActive ? '0 2px 5px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                {digit}
              </button>
            ))}
          </div>

          {/* Voice Input: Mic + Text Fallback */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Speech Voice Input
              </span>
              {isListeningMic && (
                <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700 }} className="hl-pulse">
                  Listening to mic...
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`btn ${isListeningMic ? 'btn-danger' : 'btn-secondary'}`}
                disabled={!callActive}
                onClick={startSpeechRecognition}
                title="Speak in Hindi/English using Microphone"
                style={{ width: '42px', height: '42px', padding: 0, flexShrink: 0 }}
              >
                {isListeningMic ? <Mic size={17} className="hl-pulse" /> : <Mic size={17} />}
              </button>

              <input
                className="form-input"
                placeholder="Or type speech (हाँ, 1, Bhopal)"
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                disabled={!callActive}
                style={{ height: '42px', fontSize: '12.5px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && voiceInput.trim()) {
                    handleSendInput(voiceInput.trim());
                    setVoiceInput('');
                  }
                }}
              />

              <button
                type="button"
                className="btn btn-primary"
                disabled={!callActive || !voiceInput.trim()}
                onClick={() => {
                  handleSendInput(voiceInput.trim());
                  setVoiceInput('');
                }}
                style={{ width: '42px', height: '42px', padding: 0, flexShrink: 0 }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '980px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border)'
        }}>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
