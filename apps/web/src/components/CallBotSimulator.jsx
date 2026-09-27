import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { PhoneCall, PhoneOff, Volume2, VolumeX, Mic, Send, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function CallBotSimulator({ preselectedJob }) {
  const { showToast } = useAuth();

  const [callActive, setCallActive] = useState(false);
  const [callRinging, setCallRinging] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [language, setLanguage] = useState('hi');
  const [mode, setMode] = useState('job_notification');
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJob?.job_id || '');
  const [callLogs, setCallLogs] = useState([]);
  const [currentState, setCurrentState] = useState('IDLE');
  const [botMessage, setBotMessage] = useState('Press "Dial Call" to test the AI CallBot interactive voice agent.');
  const [voiceInput, setVoiceInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const logsEndRef = useRef(null);

  useEffect(() => {
    api.getMyJobs().then((res) => {
      if (res.success && res.data.length > 0) {
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

  const speakText = (text) => {
    if (!audioEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchVoice = voices.find((v) => v.lang.startsWith(language));
    if (matchVoice) utterance.voice = matchVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStartCall = async () => {
    setCallRinging(true);
    setCallLogs([]);
    setBotMessage('Connecting call via telephony gateway...');

    try {
      const payload = {
        job_id: selectedJobId || null,
        language,
        mode
      };

      const res = await api.startCallSession(payload);
      if (res.success) {
        setTimeout(() => {
          setCallRinging(false);
          setCallActive(true);
          setSessionId(res.sessionId);
          setCurrentState(res.step.nextState || 'INTRODUCE_JOB');
          setBotMessage(res.step.speechText);
          setCallLogs(res.conversationLog || []);
          speakText(res.step.speechText);
        }, 1000);
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
        input: inputVal
      });

      if (res.success) {
        setCurrentState(res.step.nextState);
        setBotMessage(res.step.speechText);
        setCallLogs(res.conversationLog || []);
        speakText(res.step.speechText);

        if (res.step.terminateCall) {
          setTimeout(() => {
            setCallActive(false);
            showToast('Call completed and hung up.', 'info');
          }, 3500);
        }
      }
    } catch (err) {
      showToast(err.message || 'Step failed', 'danger');
    }
  };

  const handleHangup = () => {
    setCallActive(false);
    setCallRinging(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setBotMessage('Call ended. Press "Dial Call" to initiate a new session.');
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
          AI CallBot Voice Center
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          HireLocal's automated telephony agent bridges non-smartphone workers via outbound voice calls with DTMF keypad and speech recognition.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '24px',
        alignItems: 'start'
      }} className="callbot-grid">
        {/* Left: Configuration & Transcript */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Call Controls Bar */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
              Telephony Settings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Language</label>
                <select
                  className="form-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={callActive}
                >
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="en">Indian English</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Scenario Mode</label>
                <select
                  className="form-select"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  disabled={callActive}
                >
                  <option value="job_notification">Job Dispatch & Confirmation</option>
                  <option value="registration">Worker Onboarding (Voice)</option>
                </select>
              </div>

              {mode === 'job_notification' && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Target Booking ID</label>
                  <select
                    className="form-select"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    disabled={callActive}
                  >
                    {availableJobs.map((j) => (
                      <option key={j.job_id} value={j.job_id}>
                        {j.service_type} - {j.worker_name || 'Worker'} ({j.required_date})
                      </option>
                    ))}
                    {availableJobs.length === 0 && <option value="">No bookings available</option>}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>{audioEnabled ? 'Voice Playback: On' : 'Voice Playback: Muted'}</span>
              </button>

              {!callActive && !callRinging ? (
                <button className="btn btn-primary" onClick={handleStartCall}>
                  <PhoneCall size={16} />
                  <span>Dial Call</span>
                </button>
              ) : (
                <button className="btn btn-danger" onClick={handleHangup}>
                  <PhoneOff size={16} />
                  <span>End Call</span>
                </button>
              )}
            </div>
          </div>

          {/* Transcript Logs */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                Live Call Dialogue Transcript
              </h3>
              <span className="tag">
                State: {currentState}
              </span>
            </div>

            <div style={{
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '16px',
              minHeight: '260px',
              maxHeight: '340px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {callLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', margin: 'auto' }}>
                  No active call dialogue. Click "Dial Call" to start the simulation.
                </div>
              ) : (
                callLogs.map((log, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: log.speaker === 'bot' ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                      backgroundColor: log.speaker === 'bot' ? 'var(--surface)' : 'var(--primary-light)',
                      border: `1px solid ${log.speaker === 'bot' ? 'var(--border)' : '#BFDBFE'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      fontSize: '13px'
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '2px' }}>
                      {log.speaker === 'bot' ? 'CallBot Voice' : 'Worker'}
                    </div>
                    <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {log.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>

        {/* Right: Phone Keypad Simulator */}
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Phone Keypad
          </div>

          {/* Current Bot Speech Output Bubble */}
          <div style={{
            backgroundColor: callActive ? 'var(--primary-light)' : 'var(--surface-alt)',
            border: `1px solid ${callActive ? '#BFDBFE' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            fontSize: '13px',
            color: 'var(--text-main)',
            lineHeight: 1.4,
            marginBottom: '18px',
            minHeight: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            {callRinging ? 'Ringing outbound worker phone...' : botMessage}
          </div>

          {/* 3x4 DTMF Numeric Pad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginBottom: '18px'
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <button
                key={digit}
                type="button"
                className="btn btn-secondary"
                disabled={!callActive}
                onClick={() => handleSendInput(digit)}
                style={{
                  height: '52px',
                  fontSize: '18px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {digit}
              </button>
            ))}
          </div>

          {/* Voice Input Alternative */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textAlign: 'left' }}>
              Voice Input (Hindi / English speech)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                className="form-input"
                placeholder="Type spoken response (e.g. हाँ, Yes, 1)"
                value={voiceInput}
                onChange={(e) => setVoiceInput(e.target.value)}
                disabled={!callActive}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && voiceInput) {
                    handleSendInput(voiceInput);
                    setVoiceInput('');
                  }
                }}
              />
              <button
                className="btn btn-primary"
                disabled={!callActive || !voiceInput}
                onClick={() => {
                  handleSendInput(voiceInput);
                  setVoiceInput('');
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .callbot-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
