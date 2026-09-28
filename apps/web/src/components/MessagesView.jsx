import React, { useState } from 'react';
import {
  Search,
  Send,
  Phone,
  MapPin,
  Check,
  CheckCheck,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowLeft
} from 'lucide-react';

const INITIAL_CONVERSATIONS = [
  {
    id: 'conv_1',
    workerId: 'wrk_elec_1',
    name: 'Mukesh Sharma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    service: 'House Wiring & MCB',
    online: true,
    lastMessage: 'Namaste! I will reach your location tomorrow by 9:30 AM.',
    time: '10:45 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hello Mukesh ji, is tomorrow morning convenient for the MCB tripping issue?',
        time: '10:30 AM'
      },
      {
        id: 'm2',
        sender: 'worker',
        text: 'Namaste! Yes, tomorrow morning works well. I have tools and standard 16A/32A MCB units available.',
        time: '10:38 AM'
      },
      {
        id: 'm3',
        sender: 'user',
        text: 'Great, the location is Flat 402, Shalimar Heights, Govindpura.',
        time: '10:40 AM'
      },
      {
        id: 'm4',
        sender: 'worker',
        text: 'Namaste! I will reach your location tomorrow by 9:30 AM.',
        time: '10:45 AM'
      }
    ]
  },
  {
    id: 'conv_2',
    workerId: 'wrk_elec_2',
    name: 'Sunil Verma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    service: 'Fan Installation',
    online: false,
    lastMessage: 'All set for Wednesday afternoon appointment.',
    time: 'Yesterday',
    unreadCount: 0,
    messages: [
      {
        id: 'm1',
        sender: 'user',
        text: 'Hi Sunil, do I need to buy the downrod and regulator beforehand?',
        time: 'Yesterday 3:15 PM'
      },
      {
        id: 'm2',
        sender: 'worker',
        text: 'Please keep the fan box ready. I will bring standard anchor bolts and wiring.',
        time: 'Yesterday 3:20 PM'
      },
      {
        id: 'm3',
        sender: 'worker',
        text: 'All set for Wednesday afternoon appointment.',
        time: 'Yesterday 3:22 PM'
      }
    ]
  },
  {
    id: 'conv_3',
    workerId: 'wrk_elec_5',
    name: 'Rakesh Singh',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
    profession: 'Electrician',
    service: 'Switchboard Repair',
    online: true,
    lastMessage: 'Job completed. Thanks for the quick settlement!',
    time: 'Sep 26',
    unreadCount: 0,
    messages: [
      {
        id: 'm1',
        sender: 'worker',
        text: 'Job completed. Thanks for the quick settlement!',
        time: 'Sep 26 4:10 PM'
      }
    ]
  }
];

export default function MessagesView({ onFindWorker }) {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState('conv_1');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputMessage, setInputMessage] = useState('');

  const activeConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.service.toLowerCase().includes(q);
  });

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: `m_${Date.now()}`,
      sender: 'user',
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: newMessage.text,
            time: 'Just now',
            messages: [...c.messages, newMessage]
          };
        }
        return c;
      })
    );

    setInputMessage('');
  };

  const handleQuickPrompt = (text) => {
    setInputMessage(text);
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-main)',
      minHeight: 'calc(100vh - 68px)',
      padding: '24px 0 48px'
    }}>
      <div className="container">
        {/* Main Messenger Box */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px -4px rgba(21, 26, 36, 0.06)',
          display: 'grid',
          gridTemplateColumns: '340px 1fr',
          minHeight: '620px',
          height: 'calc(100vh - 160px)',
          maxHeight: '780px',
          overflow: 'hidden'
        }} className="hl-messenger-layout">
          {/* LEFT: Conversation List */}
          <aside style={{
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FCFAF7'
          }}>
            {/* Inbox Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: '#FFFFFF'
            }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 12px' }}>
                Messages
              </h2>

              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search workers or messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-main)',
                    fontSize: '13px',
                    color: 'var(--text-main)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Conversation Threads */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 18px',
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent'
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={conv.avatar}
                        alt={conv.name}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '12px',
                          objectFit: 'cover'
                        }}
                      />
                      {conv.online && (
                        <span style={{
                          position: 'absolute',
                          bottom: '-1px',
                          right: '-1px',
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--success)',
                          border: '2px solid #FFFFFF'
                        }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--text-main)',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {conv.name}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {conv.time}
                        </span>
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'var(--primary)', fontWeight: 600, marginBottom: '2px' }}>
                        {conv.service}
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {conv.lastMessage}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* RIGHT: Active Chat Window */}
          <main style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            position: 'relative'
          }}>
            {/* Active Chat Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={activeConv.avatar}
                  alt={activeConv.name}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    objectFit: 'cover'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                      {activeConv.name}
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: 'var(--success)'
                    }}>
                      <ShieldCheck size={12} />
                      <span>Verified</span>
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {activeConv.profession} •{' '}
                    <span style={{ color: activeConv.online ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>
                      {activeConv.online ? '🟢 Online' : 'Active today'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <a
                  href="tel:+917552400100"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <Phone size={14} />
                  <span>Call Worker</span>
                </a>
              </div>
            </div>

            {/* Message Thread Scroll Area */}
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              backgroundColor: '#FAF8F5',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Trust banner inside chat */}
              <div style={{
                textAlign: 'center',
                margin: '0 auto 10px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-pill)',
                backgroundColor: 'rgba(234, 229, 222, 0.6)',
                fontSize: '11.5px',
                color: 'var(--text-muted)'
              }}>
                🔒 Direct customer & artisan chat • HireLocal day-wage booking
              </div>

              {activeConv.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      alignSelf: isUser ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isUser ? 'var(--primary)' : '#FFFFFF',
                      color: isUser ? '#FFFFFF' : 'var(--text-main)',
                      fontSize: '13.5px',
                      lineHeight: 1.5,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      border: isUser ? 'none' : '1px solid var(--border)'
                    }}>
                      {msg.text}
                    </div>

                    <div style={{
                      fontSize: '10.5px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                      padding: '0 4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>{msg.time}</span>
                      {isUser && <CheckCheck size={12} color="var(--primary)" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Suggestion Chips */}
            <div style={{
              padding: '8px 20px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto'
            }}>
              {[
                'When will you reach?',
                'Please call before arriving',
                'Address details confirmed',
                'Do you need any parts from market?'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPrompt(chip)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Message Input Form */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '14px 20px',
                backgroundColor: '#FFFFFF',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <input
                type="text"
                placeholder={`Message ${activeConv.name.split(' ')[0]}...`}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-main)',
                  fontSize: '14px',
                  color: 'var(--text-main)',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: '11px 18px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>Send</span>
                <Send size={15} />
              </button>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
