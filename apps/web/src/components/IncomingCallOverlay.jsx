import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  MapPin,
  User,
  Calendar,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  X,
  Hash,
  Sparkles,
  Zap
} from 'lucide-react';

// Standard Telephone DTMF Frequencies (Hz)
const DTMF_FREQS = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
};

export default function IncomingCallOverlay({ onAnswerCall }) {
  const { user, worker, showToast } = useAuth();

  // Call Lifecycle: 'idle' | 'ringing' | 'connected' | 'completed' | 'declined'
  const [callState, setCallState] = useState('idle');
  const [incomingData, setIncomingData] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // In-Call state
  const [callSeconds, setCallSeconds] = useState(0);
  const [modelMessage, setModelMessage] = useState('');
  const [userTranscript, setUserTranscript] = useState('');
  const [isMicListening, setIsMicListening] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [decisionResult, setDecisionResult] = useState(null); // 'accepted' | 'declined'

  const dismissedSessionsRef = useRef(new Set());
  const ringAudioCtxRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const callTimerRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  // Play realistic telephone double-ring burst (400Hz + 450Hz)
  const startRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ringAudioCtxRef.current = ctx;

      const playBurst = () => {
        if (!ringAudioCtxRef.current || ringAudioCtxRef.current.state === 'closed') return;
        const now = ringAudioCtxRef.current.currentTime;

        const makeBeep = (startTime, duration) => {
          const osc1 = ringAudioCtxRef.current.createOscillator();
          const osc2 = ringAudioCtxRef.current.createOscillator();
          const gain = ringAudioCtxRef.current.createGain();

          osc1.frequency.value = 400;
          osc2.frequency.value = 450;

          gain.gain.setValueAtTime(0.09, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ringAudioCtxRef.current.destination);

          osc1.start(startTime);
          osc2.start(startTime);
          osc1.stop(startTime + duration);
          osc2.stop(startTime + duration);
        };

        makeBeep(now, 0.4);
        makeBeep(now + 0.6, 0.4);
      };

      playBurst();
      ringIntervalRef.current = setInterval(playBurst, 3000);
    } catch (e) {}
  };

  const stopRingtone = () => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringAudioCtxRef.current) {
      try {
        ringAudioCtxRef.current.close();
      } catch (e) {}
      ringAudioCtxRef.current = null;
    }
  };

  // Play DTMF Tone on Keypad press
  const playDtmfTone = (digit) => {
    const freqs = DTMF_FREQS[digit];
    if (!freqs) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  // Model Speech Synthesis (Hindi / Natural Voice)
  const speakTextAloud = (text) => {
    if (isAudioMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const hiVoice = voices.find((v) => v.lang.includes('hi') || v.name.includes('Hindi') || v.name.includes('India'));
      if (hiVoice) utterance.voice = hiVoice;

      utterance.onstart = () => setIsModelSpeaking(true);
      utterance.onend = () => {
        setIsModelSpeaking(false);
        // Automatically start listening for worker response after model finishes speaking
        startVoiceRecognition();
      };
      utterance.onerror = () => setIsModelSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsModelSpeaking(false);
    }
  };

  // Voice Recognition for Worker Response (Ola/Uber Driver Speech input)
  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
      }
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'hi-IN';

      rec.onstart = () => setIsMicListening(true);
      rec.onend = () => setIsMicListening(false);
      rec.onerror = () => setIsMicListening(false);

      rec.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join('')
          .toLowerCase()
          .trim();

        setUserTranscript(transcript);

        if (e.results[0].isFinal) {
          handleIncomingVoiceDecision(transcript);
        }
      };

      rec.start();
      speechRecognitionRef.current = rec;
    } catch (e) {
      setIsMicListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    setIsMicListening(false);
  };

  // Poll for incoming calls from backend every 2.5 seconds
  useEffect(() => {
    const checkIncoming = async () => {
      // Don't poll while already in active call
      if (callState === 'connected' || callState === 'completed' || callState === 'declined') return;

      try {
        const res = await api.getIncomingCall();
        if (res && res.success && res.hasIncomingCall && res.sessionId) {
          if (!dismissedSessionsRef.current.has(res.sessionId)) {
            setIncomingData(res);
            setSessionId(res.sessionId);
            if (callState !== 'ringing') {
              setCallState('ringing');
              startRingtone();
            }
            return;
          }
        }
        if (callState === 'ringing' && (!res || !res.hasIncomingCall)) {
          setCallState('idle');
          setIncomingData(null);
          stopRingtone();
        }
      } catch (e) {}
    };

    checkIncoming();
    const interval = setInterval(checkIncoming, 2500);
    return () => {
      clearInterval(interval);
      stopRingtone();
      stopVoiceRecognition();
    };
  }, [callState]);

  // Handle User Voice Decision
  const handleIncomingVoiceDecision = (phrase) => {
    const text = phrase.toLowerCase();
    // Affirmative keywords: haan, yes, pakka, accept, karenge, karunga, bilkul
    if (
      text.includes('हाँ') || text.includes('हा') || text.includes('haan') || text.includes('yes') ||
      text.includes('accept') || text.includes('karunga') || text.includes('karenge') ||
      text.includes('theek') || text.includes('bilkul') || text.includes('1')
    ) {
      handleAcceptCallStep('1');
    }
    // Negative keywords: nahi, no, reject, decline, nahi hoga, busy, radd
    else if (
      text.includes('नहीं') || text.includes('ना') || text.includes('nahi') || text.includes('no') ||
      text.includes('reject') || text.includes('decline') || text.includes('cancel') ||
      text.includes('busy') || text.includes('2')
    ) {
      handleRejectCallStep('2');
    }
  };

  // 1. Decline Call from Ringing screen
  const handleDeclineIncoming = () => {
    if (sessionId) {
      dismissedSessionsRef.current.add(sessionId);
    }
    stopRingtone();
    setCallState('idle');
    setIncomingData(null);
  };

  // 2. Answer Call (Ola/Uber Driver Answers)
  const handleAnswerCall = () => {
    stopRingtone();
    setCallState('connected');
    setCallSeconds(0);

    const job = incomingData?.job || {};
    const customer = incomingData?.customer || {};
    const workerName = incomingData?.workerName || 'मुकेश';
    const serviceName = job.service_type || 'इलेक्ट्रीशियन';
    const payout = job.estimated_cost || 550;
    const location = job.address || 'बाझेड़ी, मोहाली (140413)';

    // Initial prompt spoken by the AI Dispatcher Model
    const hindiGreeting = `नमस्ते ${workerName} जी! HireLocal से नया काम मिला है। ${location} में ${customer.name || 'आर्यन'} जी को ${serviceName} का काम करवाना है। दिहाड़ी ₹${payout} है। क्या आप यह काम स्वीकार करना चाहते हैं? काम स्वीकार करने के लिए 1 दबाएं या "हाँ" बोलें, मना करने के लिए 2 दबाएं।`;

    setModelMessage(hindiGreeting);
    speakTextAloud(hindiGreeting);

    // Call timer
    callTimerRef.current = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
  };

  // 3. Worker Accepts (DTMF 1 or Voice "हाँ")
  const handleAcceptCallStep = async (digit = '1') => {
    playDtmfTone(digit);
    stopVoiceRecognition();

    const acceptSpeech = 'धन्यवाद मुकेश जी! आपका काम स्वीकार हो गया है। कस्टमर आर्यन जी को सूचना भेज दी गई है। आपका दिन शुभ हो!';
    setModelMessage(acceptSpeech);
    speakTextAloud(acceptSpeech);
    setDecisionResult('accepted');
    setCallState('completed');

    try {
      await api.stepCallSession({
        sessionId,
        dtmfDigit: digit,
        input: '1',
        mode: 'job_notification',
        job_id: incomingData?.job?.job_id
      });
      if (showToast) {
        showToast('✓ Job Accepted! Mukesh Kumar is confirmed for Bajheri, Mohali (140413).', 'success');
      }
    } catch (e) {}

    // Auto close after 4 seconds
    setTimeout(() => {
      handleEndCallSession();
    }, 4500);
  };

  // 4. Worker Declines (DTMF 2 or Voice "नहीं")
  const handleRejectCallStep = async (digit = '2') => {
    playDtmfTone(digit);
    stopVoiceRecognition();

    const rejectSpeech = 'कोई बात नहीं मुकेश जी। आपकी असमर्थता दर्ज कर ली गई है। यह काम किसी अन्य कारीगर को भेजा जाएगा। धन्यवाद!';
    setModelMessage(rejectSpeech);
    speakTextAloud(rejectSpeech);
    setDecisionResult('declined');
    setCallState('completed');

    try {
      await api.stepCallSession({
        sessionId,
        dtmfDigit: digit,
        input: '2',
        mode: 'job_notification',
        job_id: incomingData?.job?.job_id
      });
    } catch (e) {}

    setTimeout(() => {
      handleEndCallSession();
    }, 4000);
  };

  // 5. Hang Up / End Call
  const handleEndCallSession = () => {
    stopRingtone();
    stopVoiceRecognition();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (sessionId) {
      dismissedSessionsRef.current.add(sessionId);
    }
    setCallState('idle');
    setIncomingData(null);
    setSessionId(null);
    setCallSeconds(0);
    setDecisionResult(null);
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (callState === 'idle' || !incomingData) return null;

  const job = incomingData.job || {};
  const customer = incomingData.customer || {};

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(10, 14, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      {/* OLA / UBER PHONE CONTAINER */}
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: '620px',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          borderRadius: '32px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1.5px rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '28px 22px 32px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Radial Backlight */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            background: callState === 'ringing'
              ? 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 70%)'
              : decisionResult === 'accepted'
              ? 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* 1. TOP STATUS PILL BAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: callState === 'ringing' ? '#38BDF8' : '#22C55E',
                boxShadow: `0 0 10px ${callState === 'ringing' ? '#38BDF8' : '#22C55E'}`,
                animation: 'pulse 1.5s infinite'
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8' }}>
              {callState === 'ringing' ? 'Incoming Voice Dispatch' : 'Active Voice Call'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: '#1E293B',
                color: '#38BDF8',
                padding: '4px 10px',
                borderRadius: '100px',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Radio size={11} className="hl-spin" />
              <span>AI Telephony</span>
            </span>
          </div>
        </div>

        {/* ========================================================
            SCREEN STATE A: INCOMING RINGING CALL (OLA / UBER STYLE)
            ======================================================== */}
        {callState === 'ringing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', margin: 'auto 0', position: 'relative', zIndex: 10 }}>
            {/* Animated Pulsing Rings */}
            <div
              style={{
                position: 'relative',
                width: '120px',
                height: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: '-18px',
                  borderRadius: '50%',
                  border: '2px solid rgba(56, 189, 248, 0.4)',
                  animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: '-36px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(56, 189, 248, 0.2)',
                  animation: 'ping 2.8s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}
              />
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#1E293B',
                  border: '3px solid #38BDF8',
                  boxShadow: '0 0 30px rgba(56, 189, 248, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38BDF8'
                }}
              >
                <PhoneCall size={44} strokeWidth={2.2} />
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', color: '#F8FAFC' }}>
              HireLocal Dispatch Bot
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94A3B8', margin: '0 0 20px' }}>
              Calling Mukesh Kumar (+91 98270-33445)
            </p>

            {/* Clean Uber-style Job Offer Card */}
            <div
              style={{
                width: '100%',
                backgroundColor: '#1E293B',
                borderRadius: '18px',
                padding: '16px 18px',
                border: '1px solid #334155',
                textAlign: 'left',
                boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  NEW WORK REQUEST
                </span>
                <span style={{ fontSize: '17px', fontWeight: 800, color: '#4ADE80' }}>
                  ₹{job.estimated_cost || 550} <span style={{ fontSize: '12px', color: '#94A3B8' }}>/ day</span>
                </span>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
                {job.service_type || 'Electrician Service'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#CBD5E1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#F45B0A" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.address || 'Bajheri, Mohali (140413)'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} color="#38BDF8" style={{ flexShrink: 0 }} />
                  <span>Customer: {customer.name || job.customer_name || 'Aryan'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN STATE B: ACTIVE CONNECTED CALL (OLA / UBER IN-CALL)
            ======================================================== */}
        {(callState === 'connected' || callState === 'completed') && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', position: 'relative', zIndex: 10, padding: '10px 0' }}>
            {/* Top In-Call Header */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', marginBottom: '2px' }}>
                HIRELOCAL AI DISPATCHER
              </div>
              <div style={{ fontSize: '13px', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                <span>Connected • {formatTime(callSeconds)}</span>
              </div>

              {/* Pulsing Audio Equalizer Waves */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '24px', marginTop: '10px' }}>
                {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7].map((heightScale, i) => (
                  <span
                    key={i}
                    style={{
                      width: '3.5px',
                      height: isModelSpeaking ? `${heightScale * 22}px` : isMicListening ? '14px' : '6px',
                      backgroundColor: isModelSpeaking ? '#38BDF8' : isMicListening ? '#4ADE80' : '#475569',
                      borderRadius: '4px',
                      transition: 'height 0.15s ease'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Model Dialogue Bubble (AI Speech) */}
            <div
              style={{
                backgroundColor: '#1E293B',
                borderRadius: '18px',
                padding: '16px 18px',
                border: '1.5px solid #334155',
                marginBottom: '16px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sparkles size={14} color="#38BDF8" />
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {decisionResult === 'accepted' ? 'CONFIRMATION' : 'DISPATCH PROMPT (HINDI)'}
                </span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, color: '#F1F5F9', fontWeight: 500 }}>
                {modelMessage}
              </p>
            </div>

            {/* Worker Response Area (Say or Tap) */}
            {callState === 'connected' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Voice Detection Indicator */}
                <div
                  style={{
                    backgroundColor: isMicListening ? 'rgba(34, 197, 94, 0.12)' : '#1E293B',
                    border: `1.5px solid ${isMicListening ? '#22C55E' : '#334155'}`,
                    borderRadius: '14px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isMicListening ? '#22C55E' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                      }}
                    >
                      <Mic size={14} />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: isMicListening ? '#4ADE80' : '#CBD5E1' }}>
                        {isMicListening ? 'Listening for your voice...' : 'Microphone Ready'}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#94A3B8' }}>
                        {userTranscript ? `Detected: "${userTranscript}"` : 'Say "हाँ" or "नहीं" aloud'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isMicListening) stopVoiceRecognition();
                      else startVoiceRecognition();
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      backgroundColor: '#334155',
                      color: '#F8FAFC',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isMicListening ? 'Pause Mic' : 'Start Mic'}
                  </button>
                </div>

                {/* 1-Tap Response Buttons (Ola / Uber Style Big Action Cards) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleAcceptCallStep('1')}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '16px',
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 8px 20px rgba(22, 163, 74, 0.4)',
                      transition: 'transform 0.1s ease'
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={18} />
                      <strong style={{ fontSize: '16px' }}>[ 1 ] हाँ (Accept)</strong>
                    </div>
                    <span style={{ fontSize: '12px', color: '#DCFCE7' }}>
                      स्वीकार करें • ₹{job.estimated_cost || 550}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRejectCallStep('2')}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '16px',
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 8px 20px rgba(220, 38, 38, 0.4)',
                      transition: 'transform 0.1s ease'
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <X size={18} />
                      <strong style={{ fontSize: '16px' }}>[ 2 ] नहीं (Decline)</strong>
                    </div>
                    <span style={{ fontSize: '12px', color: '#FEE2E2' }}>
                      मना करें (Reject)
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation Banner */}
            {callState === 'completed' && (
              <div
                style={{
                  backgroundColor: decisionResult === 'accepted' ? '#14532D' : '#7F1D1D',
                  borderRadius: '16px',
                  padding: '18px',
                  textAlign: 'center',
                  border: `2px solid ${decisionResult === 'accepted' ? '#22C55E' : '#EF4444'}`,
                  margin: '10px 0'
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', color: '#FFFFFF' }}>
                  {decisionResult === 'accepted' ? '✓ Job Accepted & Confirmed!' : 'Job Declined'}
                </div>
                <div style={{ fontSize: '13px', color: '#E2E8F0' }}>
                  {decisionResult === 'accepted'
                    ? 'Customer Aryan has been notified. Location: Bajheri, Mohali (140413).'
                    : 'Call ending. The work will be dispatched to an alternative worker.'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            BOTTOM UTILITY CONTROLS (HANG UP / ACCEPT BAR)
            ======================================================== */}
        {callState === 'ringing' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px', position: 'relative', zIndex: 10 }}>
            {/* Decline Button (Red Circular) */}
            <button
              type="button"
              onClick={handleDeclineIncoming}
              style={{
                padding: '16px',
                borderRadius: '20px',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.45)',
                transition: 'all 0.15s ease'
              }}
            >
              <PhoneOff size={20} />
              <span>Decline</span>
            </button>

            {/* Answer Button (Green Pulsing Circular) */}
            <button
              type="button"
              onClick={handleAnswerCall}
              style={{
                padding: '16px',
                borderRadius: '20px',
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 28px rgba(22, 163, 74, 0.6)',
                animation: 'pulse 1.8s infinite',
                transition: 'all 0.15s ease'
              }}
            >
              <PhoneCall size={22} />
              <span>Accept & Answer</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '16px', position: 'relative', zIndex: 10 }}>
            {/* End Call Button (Big Red Center Circle) */}
            <button
              type="button"
              onClick={handleEndCallSession}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(220, 38, 38, 0.5)',
                transition: 'transform 0.15s ease'
              }}
              title="Hang Up"
            >
              <PhoneOff size={26} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
