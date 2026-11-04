import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';

describe('Vapi AI Voice Assistant Integration API', () => {
  before(async () => {
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
  });

  test('GET /api/vapi/status should return Vapi integration diagnostics and tool schema', async () => {
    const res = await apiRequest('/api/vapi/status');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.status, 'online');
    assert.equal(res.data.toolName, 'ask_project_knowledge');
    assert.equal(res.data.endpoint, '/api/vapi/ask-project-knowledge');
    assert.ok(res.data.stagedWorker);
    assert.equal(res.data.stagedWorker.name, 'Mukesh Kumar');
  });

  test('POST /api/vapi/ask-project-knowledge should handle standard Vapi tool-calls payload and preserve toolCallId', async () => {
    const toolCallId = 'call_test_uber_vapi_123';
    const payload = {
      message: {
        type: 'tool-calls',
        toolCalls: [
          {
            id: toolCallId,
            type: 'function',
            function: {
              name: 'ask_project_knowledge',
              arguments: {
                question: 'What is the daily rate of the electrician in Mohali?'
              }
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.results), 'results should be an array');
    assert.equal(res.data.results.length, 1);
    assert.equal(res.data.results[0].toolCallId, toolCallId, 'toolCallId must be strictly preserved');

    const answer = res.data.results[0].result;
    assert.ok(typeof answer === 'string');
    assert.ok(answer.includes('550') || answer.includes('Mukesh') || answer.includes('rate'), 'Answer should mention 550 or Mukesh');
  });

  test('POST /api/vapi/ask-project-knowledge should handle stringified JSON arguments from OpenAI/Vapi', async () => {
    const toolCallId = 'call_str_args_456';
    const payload = {
      message: {
        toolCalls: [
          {
            id: toolCallId,
            type: 'function',
            function: {
              name: 'ask_project_knowledge',
              arguments: JSON.stringify({
                question: 'Who is the electrician available in Bajheri 140413?'
              })
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.results[0].toolCallId, toolCallId);
    assert.ok(res.data.results[0].result.includes('Mukesh'));
    assert.ok(res.data.results[0].result.includes('140413'));
  });

  test('POST /api/vapi/ask-project-knowledge should correctly answer in Hindi when asked in Hindi', async () => {
    const toolCallId = 'call_hindi_789';
    const payload = {
      message: {
        toolCalls: [
          {
            id: toolCallId,
            type: 'function',
            function: {
              name: 'ask_project_knowledge',
              arguments: {
                question: 'हायरलोकल पर कारीगरों को पैसे कैसे मिलते हैं और कमीशन कितना है?'
              }
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.results[0].toolCallId, toolCallId);
    const result = res.data.results[0].result;
    assert.ok(result.includes('कारीगर') || result.includes('कमीशन') || result.includes('हायरलोकल') || result.includes('शून्य'));
  });

  test('POST /api/vapi/ask-project-knowledge should answer direct curl/postman payload', async () => {
    const payload = {
      question: 'What is HireLocal and how does the callbot work?',
      toolCallId: 'call_manual_direct_999'
    };

    const res = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.results[0].toolCallId, 'call_manual_direct_999');
    assert.ok(res.data.results[0].result.includes('HireLocal'));
  });

  test('POST /api/vapi/ask-project-knowledge should reject completely empty payloads with 400', async () => {
    const res = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: {}
    });

    assert.equal(res.status, 400);
    assert.equal(res.data.success, false);
  });

  test('POST /api/vapi/webhook alias should work identically', async () => {
    const payload = {
      question: 'What trades are offered on HireLocal?'
    };

    const res = await apiRequest('/api/vapi/webhook', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.data.results));
    assert.ok(res.data.results[0].result.length > 20);
  });

  test('POST /api/vapi/register-worker should register a new worker via Vapi tool-call payload', async () => {
    const toolCallId = 'call_reg_voice_001';
    const payload = {
      message: {
        type: 'tool-calls',
        toolCalls: [
          {
            id: toolCallId,
            type: 'function',
            function: {
              name: 'register_worker_profile',
              arguments: {
                name: 'Rajesh Sharma',
                phone: '9876543210',
                profession: 'Electrician',
                pincode: '140413',
                experience: 8,
                daily_rate: 600
              }
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/register-worker', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.results));
    assert.equal(res.data.results[0].toolCallId, toolCallId);
    assert.ok(res.data.results[0].result.includes('Rajesh Sharma') || res.data.results[0].result.includes('140413'));

    // Verify worker exists in database and has non_smartphone communication
    assert.ok(res.data.data.worker_id);
    const workerCheck = await apiRequest(`/api/workers/${res.data.data.worker_id}`);
    assert.equal(workerCheck.status, 200);
    assert.equal(workerCheck.data.data.name, 'Rajesh Sharma');
    assert.equal(workerCheck.data.data.communication_type, 'non_smartphone');
  });

  test('POST /api/vapi/webhook should handle register_worker_profile transparently', async () => {
    const toolCallId = 'call_reg_via_webhook_002';
    const payload = {
      message: {
        toolCalls: [
          {
            id: toolCallId,
            type: 'function',
            function: {
              name: 'register_worker_profile',
              arguments: JSON.stringify({
                name: 'Amarjeet Singh',
                phone: '9812345678',
                profession: 'Plumber',
                pincode: '462011',
                experience: 6,
                daily_rate: 550
              })
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/webhook', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.results[0].toolCallId, toolCallId);
    assert.ok(res.data.results[0].result.includes('Amarjeet Singh') || res.data.results[0].result.includes('Plumber') || res.data.results[0].result.includes('462011'));
  });

  test('POST /api/vapi/book-worker should create job and dispatch CallBot to worker', async () => {
    const toolCallId = 'call_book_voice_003';
    const payload = {
      message: {
        toolCalls: [
          {
            id: toolCallId,
            type: 'function',
            function: {
              name: 'book_worker_service',
              arguments: {
                service_type: 'Electrician',
                pincode: '140413',
                customer_phone: '9876501234',
                customer_name: 'Aryan Customer'
              }
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/book-worker', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.results[0].toolCallId, toolCallId);
    assert.ok(res.data.results[0].result.includes('Electrician'));
    assert.ok(res.data.data.job_id);
  });

  test('POST /api/vapi/webhook should handle assistant-request and personalize greeting by Caller ID', async () => {
    // 1. Registered worker caller ID (Mukesh Kumar: 9827033445)
    const registeredPayload = {
      message: {
        type: 'assistant-request',
        call: {
          id: 'call_reg_lookup_001',
          customer: {
            number: '+919827033445'
          }
        }
      }
    };

    const regRes = await apiRequest('/api/vapi/webhook', {
      method: 'POST',
      body: registeredPayload
    });

    assert.equal(regRes.status, 200);
    assert.ok(regRes.data.assistantOverrides);
    assert.ok(regRes.data.assistantOverrides.firstMessage.includes('Mukesh') || regRes.data.assistantOverrides.firstMessage.includes('मुकेश'));
    assert.equal(regRes.data.assistantOverrides.variableValues.isRegistered, 'true');

    // 2. Unregistered caller ID (+919905817179)
    const unknownPayload = {
      message: {
        type: 'assistant-request',
        call: {
          id: 'call_unregistered_002',
          customer: {
            number: '+919905817179'
          }
        }
      }
    };

    const unkRes = await apiRequest('/api/vapi/webhook', {
      method: 'POST',
      body: unknownPayload
    });

    assert.equal(unkRes.status, 200);
    assert.ok(unkRes.data.assistantOverrides);
    assert.ok(unkRes.data.assistantOverrides.firstMessage.includes('रजिस्टर') || unkRes.data.assistantOverrides.firstMessage.includes('पंजीकृत'));
    assert.equal(unkRes.data.assistantOverrides.variableValues.isRegistered, 'false');
  });

  test('POST /api/vapi/ask-project-knowledge should answer caller registration status check', async () => {
    const payload = {
      message: {
        call: {
          customer: {
            number: '+919827033445'
          }
        },
        toolCalls: [
          {
            id: 'call_check_reg_001',
            type: 'function',
            function: {
              name: 'ask_project_knowledge',
              arguments: {
                question: 'Am I registered in HireLocal?'
              }
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.results[0].toolCallId, 'call_check_reg_001');
    assert.ok(res.data.results[0].result.includes('registered') || res.data.results[0].result.includes('Mukesh'));
  });

  test('POST /api/vapi/webhook should announce pending job offer on inbound call from worker', async () => {
    const { db } = await import('../../../database/db.js');
    const testJobId = `job_test_voice_${Date.now()}`;
    db.insert('jobs', {
      job_id: testJobId,
      customer_id: 'usr_customer_1',
      customer_name: 'Customer Test',
      customer_phone: '9876501234',
      worker_id: 'wrk_1',
      worker_name: 'Mukesh Kumar',
      worker_phone: '9827033445',
      service_type: 'Electrician',
      address: 'Bajheri, Mohali',
      estimated_cost: 550,
      status: 'PENDING_WORKER_RESPONSE',
      created_at: new Date().toISOString()
    });

    const payload = {
      message: {
        type: 'assistant-request',
        call: {
          id: 'call_pending_offer_001',
          customer: {
            number: '+919827033445'
          }
        }
      }
    };

    const res = await apiRequest('/api/vapi/webhook', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.ok(res.data.assistantOverrides);
    assert.ok(res.data.assistantOverrides.firstMessage.includes('पेंडिंग'));
    assert.ok(res.data.assistantOverrides.firstMessage.includes('स्वीकार'));
    assert.equal(res.data.assistantOverrides.variableValues.hasPendingJob, 'true');
    assert.equal(res.data.assistantOverrides.variableValues.pendingJobId, testJobId);
  });

  test('POST /api/vapi/ask-project-knowledge should transition pending job to ACCEPTED when worker says हाँ', async () => {
    const { db } = await import('../../../database/db.js');
    const worker = db.findOne('workers', (w) => w.phone === '9827033445');
    const testJobId = `job_test_accept_${Date.now()}`;
    db.insert('jobs', {
      job_id: testJobId,
      customer_id: 'usr_customer_1',
      customer_name: 'Customer Test',
      customer_phone: '9876501234',
      worker_id: worker?.worker_id || 'wrk_1',
      worker_name: worker?.name || 'Mukesh Kumar',
      worker_phone: '9827033445',
      service_type: 'Electrician',
      address: 'Bajheri, Mohali',
      estimated_cost: 550,
      status: 'PENDING_WORKER_RESPONSE',
      created_at: new Date().toISOString()
    });

    const payload = {
      message: {
        call: {
          id: 'call_voice_accept_session_1',
          customer: {
            number: '+919827033445'
          }
        },
        toolCalls: [
          {
            id: 'call_accept_tool_001',
            type: 'function',
            function: {
              name: 'ask_project_knowledge',
              arguments: {
                question: 'हाँ मैं काम स्वीकार करता हूँ'
              }
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.results[0].toolCallId, 'call_accept_tool_001');
    assert.ok(res.data.results[0].result.includes('स्वीकार कर लिया है'));

    const updatedJob = db.findById('jobs', 'job_id', testJobId);
    assert.equal(updatedJob.status, 'ACCEPTED');
  });

  test('POST /api/vapi/ask-project-knowledge should transition pending job to REJECTED when worker says नहीं मना है', async () => {
    const { db } = await import('../../../database/db.js');
    const worker = db.findOne('workers', (w) => w.phone === '9827033445');
    const testJobId = `job_test_reject_${Date.now()}`;
    db.insert('jobs', {
      job_id: testJobId,
      customer_id: 'usr_customer_1',
      customer_name: 'Customer Test',
      customer_phone: '9876501234',
      worker_id: worker?.worker_id || 'wrk_1',
      worker_name: worker?.name || 'Mukesh Kumar',
      worker_phone: '9827033445',
      service_type: 'Electrician',
      address: 'Bajheri, Mohali',
      estimated_cost: 550,
      status: 'PENDING_WORKER_RESPONSE',
      created_at: new Date().toISOString()
    });

    const payload = {
      message: {
        call: {
          id: 'call_voice_reject_session_1',
          customer: {
            number: '+919827033445'
          }
        },
        toolCalls: [
          {
            id: 'call_reject_tool_001',
            type: 'function',
            function: {
              name: 'ask_project_knowledge',
              arguments: {
                question: 'नहीं, यह काम मना है'
              }
            }
          }
        ]
      }
    };

    const res = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payload
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.results[0].toolCallId, 'call_reject_tool_001');
    assert.ok(res.data.results[0].result.includes('अस्वीकार'));

    const updatedJob = db.findById('jobs', 'job_id', testJobId);
    assert.ok(['REJECTED', 'PENDING_WORKER_RESPONSE'].includes(updatedJob.status));
    assert.notEqual(updatedJob.worker_id, worker?.worker_id, 'Job should be reassigned to alternative worker by auto-cascade');
  });

  test('POST /api/vapi/webhook should announce ongoing job completion prompt on inbound call when worker has active accepted job', async () => {
    const { db } = await import('../../../database/db.js');
    const testPhone = '9827088888';
    db.insert('workers', {
      worker_id: 'wrk_test_ongoing_phone',
      name: 'Ramesh Test',
      phone: testPhone,
      profession: 'Plumber',
      daily_rate: 600,
      communication_type: 'non_smartphone',
      verified: true
    });
    const testJobId = `job_test_ongoing_${Date.now()}`;
    db.insert('jobs', {
      job_id: testJobId,
      customer_id: 'usr_customer_1',
      customer_name: 'Customer Test',
      customer_phone: '9876501234',
      worker_id: 'wrk_test_ongoing_phone',
      worker_name: 'Ramesh Test',
      worker_phone: testPhone,
      service_type: 'Plumber',
      address: 'Bajheri, Mohali',
      estimated_cost: 600,
      status: 'ACCEPTED',
      created_at: new Date().toISOString()
    });

    const res = await apiRequest('/api/vapi/webhook', {
      method: 'POST',
      body: {
        message: {
          type: 'assistant-request',
          call: {
            id: 'call_ongoing_check_001',
            customer: {
              number: `+91${testPhone}`
            }
          }
        }
      }
    });

    assert.equal(res.status, 200);
    assert.ok(res.data.assistantOverrides);
    assert.ok(res.data.assistantOverrides.firstMessage.includes('काम चल रहा है') || res.data.assistantOverrides.firstMessage.includes('काम पूरा'));
  });

  test('POST /api/vapi/ask-project-knowledge should prompt for OTP and transition accepted job to COMPLETED when OTP matches', async () => {
    const { db } = await import('../../../database/db.js');
    const worker = db.findOne('workers', (w) => w.phone === '9827033445');
    const testJobId = `job_test_complete_otp_${Date.now()}`;
    db.insert('jobs', {
      job_id: testJobId,
      completion_otp: '4821',
      customer_id: 'usr_customer_1',
      customer_name: 'Customer Test',
      customer_phone: '9876501234',
      worker_id: worker?.worker_id || 'wrk_1',
      worker_name: worker?.name || 'Mukesh Kumar',
      worker_phone: '9827033445',
      service_type: 'Electrician',
      address: 'Bajheri, Mohali',
      estimated_cost: 550,
      status: 'ACCEPTED',
      created_at: new Date().toISOString()
    });

    // 1. Without OTP: Assistant prompts for customer's 4-digit OTP
    const payloadWithoutOtp = {
      message: {
        call: {
          id: 'call_voice_complete_session_otp_1',
          customer: { number: '+919827033445' }
        },
        toolCalls: [
          {
            id: 'call_complete_tool_prompt',
            type: 'function',
            function: {
              name: 'ask_project_knowledge',
              arguments: { question: 'काम पूरा हो गया है जी' }
            }
          }
        ]
      }
    };

    const res1 = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payloadWithoutOtp
    });

    assert.equal(res1.status, 200);
    assert.ok(res1.data.results[0].result.includes('ओटीपी') || res1.data.results[0].result.includes('OTP'));

    // 2. With OTP: Assistant verifies OTP and marks COMPLETED
    const payloadWithOtp = {
      message: {
        call: {
          id: 'call_voice_complete_session_otp_1',
          customer: { number: '+919827033445' }
        },
        toolCalls: [
          {
            id: 'call_complete_tool_verify',
            type: 'function',
            function: {
              name: 'ask_project_knowledge',
              arguments: { question: 'ओटीपी 4821' }
            }
          }
        ]
      }
    };

    const res2 = await apiRequest('/api/vapi/ask-project-knowledge', {
      method: 'POST',
      body: payloadWithOtp
    });

    assert.equal(res2.status, 200);
    assert.ok(res2.data.results[0].result.includes('पूरा दर्ज कर लिया गया है') || res2.data.results[0].result.includes('ओटीपी सत्यापित'));

    const updatedJob = db.findById('jobs', 'job_id', testJobId);
    assert.equal(updatedJob.status, 'COMPLETED');
  });
});
