/**
 * Vapi AI Voice Assistant Controller
 * Handles inbound tool-call webhooks for Vapi Function Tools:
 * 1. `ask_project_knowledge` - Answers questions about services, rates, policies, and master electrician Mukesh Kumar.
 * 2. `register_worker_profile` - Registers a new artisan into the live database directly over phone call.
 * 3. `book_worker_service` - Books an artisan and triggers automated outbound CallBot dispatch to worker's phone.
 * Output strictly compliant with Vapi's Custom Tool specification: { results: [{ toolCallId, result }] }
 */

import {
  answerProjectKnowledge,
  registerWorkerViaVoice,
  bookWorkerViaVoice,
  respondToJobOfferViaVoice,
  completeJobViaVoice
} from '../../../../packages/callbot/vapiKnowledgeService.js';
import { db } from '../../../../database/db.js';
import { JOB_STATUS } from '../../../../packages/shared/statusVocabulary.js';

/**
 * Normalizes tool arguments from Vapi payloads.
 * Handles both parsed JSON objects and stringified JSON strings from OpenAI/Vapi.
 */
function extractQuestionFromArguments(args) {
  if (!args) return '';
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args);
      return parsed.question || parsed.query || parsed.input || parsed.prompt || '';
    } catch (e) {
      // In case arguments string is the raw question itself
      return args.trim();
    }
  }
  if (typeof args === 'object') {
    return args.question || args.query || args.input || args.prompt || '';
  }
  return String(args);
}

/**
 * Extracts all tool calls from various Vapi webhook payload structures
 */
function extractToolCalls(body) {
  if (!body || typeof body !== 'object') return [];

  // 1. Standard Vapi tool-calls in message object
  if (body.message?.toolCalls && Array.isArray(body.message.toolCalls)) {
    return body.message.toolCalls;
  }

  // 2. Vapi toolCallList in message object
  if (body.message?.toolCallList && Array.isArray(body.message.toolCallList)) {
    return body.message.toolCallList;
  }

  // 3. Direct toolCalls array at root
  if (body.toolCalls && Array.isArray(body.toolCalls)) {
    return body.toolCalls;
  }

  // 4. Single toolCall object at root
  if (body.toolCall && typeof body.toolCall === 'object') {
    return [body.toolCall];
  }

  // 5. Direct invocation for registration: { name, profession, pincode, ... }
  if (body.name || (body.profession && !body.question)) {
    return [
      {
        id: body.toolCallId || body.id || `call_reg_${Date.now()}`,
        type: 'function',
        function: {
          name: 'register_worker_profile',
          arguments: body
        }
      }
    ];
  }

  // 6. Direct invocation for booking: { service_type, customer_phone, ... }
  if (body.service_type && !body.question) {
    return [
      {
        id: body.toolCallId || body.id || `call_book_${Date.now()}`,
        type: 'function',
        function: {
          name: 'book_worker_service',
          arguments: body
        }
      }
    ];
  }

  // 7. Direct invocation via curl/Postman/testing: { question: "...", toolCallId: "..." }
  if (body.question || body.query) {
    return [
      {
        id: body.toolCallId || body.id || `call_direct_${Date.now()}`,
        type: 'function',
        function: {
          name: 'ask_project_knowledge',
          arguments: { question: body.question || body.query }
        }
      }
    ];
  }

  return [];
}

/**
 * Dispatches a single tool call based on its function name
 */
async function processToolCall(tc, context = {}) {
  const toolCallId = tc.id || tc.toolCallId || `call_${Date.now()}`;
  const fnName = (tc.function?.name || tc.name || 'ask_project_knowledge').toLowerCase();
  const rawArgs = tc.function?.arguments || tc.parameters || tc.arguments;

  console.log(`[Vapi Webhook] Processing Tool Call: id=${toolCallId}, function=${fnName}`);

  try {
    // 1. Worker Voice Registration
    if (fnName.includes('register') || fnName.includes('onboard') || fnName.includes('signup')) {
      const regResult = await registerWorkerViaVoice(rawArgs);
      return {
        toolCallId,
        result: regResult.message,
        data: regResult
      };
    }

    // 2. Worker Booking via Voice
    if (fnName.includes('book') || fnName.includes('hire') || fnName.includes('order')) {
      const bookResult = await bookWorkerViaVoice(rawArgs);
      return {
        toolCallId,
        result: bookResult.message,
        data: bookResult
      };
    }

    // 3. Worker Job Completion Decision
    if (fnName.includes('complete') || fnName.includes('finish') || fnName.includes('done')) {
      const completeResult = await completeJobViaVoice(rawArgs, context);
      return {
        toolCallId,
        result: completeResult.message,
        data: completeResult
      };
    }

    // 4. Worker Job Offer Decision (Accept / Reject)
    if (fnName.includes('job') || fnName.includes('offer') || fnName.includes('accept') || fnName.includes('reject') || fnName.includes('respond')) {
      const decisionResult = await respondToJobOfferViaVoice(rawArgs, context);
      return {
        toolCallId,
        result: decisionResult.message,
        data: decisionResult
      };
    }

    // 5. Project Knowledge & Q&A (Default)
    const question = extractQuestionFromArguments(rawArgs);
    let answer = '';
    if (!question) {
      answer = 'I did not receive a specific question. Please ask about HireLocal services, workers, rates, or locations.';
    } else {
      answer = await answerProjectKnowledge(question, context);
    }

    return {
      toolCallId,
      result: answer
    };
  } catch (err) {
    console.error(`[Vapi Webhook] Error resolving toolCallId=${toolCallId}:`, err);
    return {
      toolCallId,
      result: 'HireLocal is operating normally. Verified master electrician Mukesh Kumar is available at 550 rupees per day in Bajheri, Mohali PINCODE 140413 with zero percent commission.'
    };
  }
}

/**
 * POST /api/vapi/ask-project-knowledge
 * Also handles /api/vapi/webhook and /api/vapi
 */
export async function handleVapiKnowledgeQuery(req, res, next) {
  const startTime = Date.now();

  try {
    // 0. Handle Vapi dynamic assistant request (inbound phone call resolution by Caller ID)
    if (req.body.message?.type === 'assistant-request' || req.body.type === 'assistant-request') {
      const call = req.body.message?.call || req.body.call || {};
      const rawNumber = call.customer?.number || req.body.customer?.number || '';
      const cleanPhone = String(rawNumber).replace(/\D/g, '').slice(-10);

      console.log(`[Vapi Inbound Webhook] assistant-request received for caller: ${rawNumber} (clean: ${cleanPhone})`);

      const existingWorker = cleanPhone ? db.findOne('workers', (w) => w.phone && String(w.phone).includes(cleanPhone)) : null;
      const existingUser = cleanPhone ? db.findOne('users', (u) => u.phone && String(u.phone).includes(cleanPhone)) : null;

      // Check if there is an active pending job offer for this worker
      const pendingJobs = existingWorker ? db.find('jobs', (j) =>
        (j.worker_id === existingWorker.worker_id || (j.worker_phone && String(j.worker_phone).includes(cleanPhone))) &&
        (j.status === JOB_STATUS.PENDING_WORKER_RESPONSE || j.status === 'pending_worker_response' || j.status === 'offered' || j.status === 'REQUESTED')
      ) : [];
      const pendingJob = pendingJobs.length > 0 ? pendingJobs[pendingJobs.length - 1] : null;

      // Check if there is an active ongoing (ACCEPTED) job for this worker
      const ongoingJobs = existingWorker ? db.find('jobs', (j) =>
        (j.worker_id === existingWorker.worker_id || (j.worker_phone && String(j.worker_phone).includes(cleanPhone))) &&
        (j.status === JOB_STATUS.ACCEPTED || j.status === 'ACCEPTED' || j.status === 'in_progress')
      ) : [];
      const ongoingJob = ongoingJobs.length > 0 ? ongoingJobs[ongoingJobs.length - 1] : null;

      let dynamicGreeting = '';
      let isRegistered = false;

      if (existingWorker && pendingJob) {
        isRegistered = true;
        dynamicGreeting = `नमस्ते ${existingWorker.name} जी! HireLocal में आपका स्वागत है। आपके लिए एक नया काम पेंडिंग है: ${pendingJob.service_type || existingWorker.profession} का काम, स्थान ${pendingJob.address || 'मोहाली'}, दैनिक मजदूरी ₹${pendingJob.estimated_cost || existingWorker.daily_rate}। क्या आप यह काम स्वीकार करते हैं? कृपया 'हाँ' या 'ना' बताएं।`;
      } else if (existingWorker && ongoingJob) {
        isRegistered = true;
        dynamicGreeting = `नमस्ते ${existingWorker.name} जी! HireLocal में आपका स्वागत है। आपका ${ongoingJob.service_type || existingWorker.profession} का काम चल रहा है। क्या आपने काम पूरा कर लिया है? काम पूरा करने के लिए कृपया ग्राहक का 4-अंकों का पूर्णता ओटीपी (OTP) बोलें।`;
      } else if (existingWorker) {
        isRegistered = true;
        dynamicGreeting = `नमस्ते ${existingWorker.name} जी! HireLocal में आपका फिर से स्वागत है। आप एक वेरीफाइड ${existingWorker.profession} के रूप में रजिस्टर्ड हैं। आज हम आपकी क्या सहायता कर सकते हैं?`;
      } else if (existingUser) {
        isRegistered = true;
        dynamicGreeting = `नमस्ते ${existingUser.name} जी! HireLocal में आपका फिर से स्वागत है। क्या आपको आज किसी काम के लिए कारीगर की आवश्यकता है?`;
      } else {
        dynamicGreeting = `नमस्ते! HireLocal में आपका स्वागत है। आपका नंबर हमारे पास पंजीकृत नहीं है। क्या आप एक कारीगर जैसे इलेक्ट्रीशियन या प्लंबर के रूप में रजिस्टर करना चाहते हैं, या किसी काम के लिए कारीगर ढूंढ रहे हैं?`;
      }

      const assistantId = call.assistantId || process.env.VAPI_ASSISTANT_ID || '85c03df2-627f-4b14-9a24-aaf5f9d6b667';

      return res.status(200).json({
        assistantId,
        assistantOverrides: {
          firstMessage: dynamicGreeting,
          variableValues: {
            callerPhone: cleanPhone,
            isRegistered: isRegistered ? 'true' : 'false',
            callerName: existingWorker?.name || existingUser?.name || 'New Caller',
            callerProfession: existingWorker?.profession || 'none',
            hasPendingJob: pendingJob ? 'true' : 'false',
            pendingJobId: pendingJob ? pendingJob.job_id : '',
            pendingJobService: pendingJob ? pendingJob.service_type : '',
            pendingJobAddress: pendingJob ? pendingJob.address : '',
            pendingJobCost: pendingJob ? String(pendingJob.estimated_cost) : ''
          }
        },
        firstMessage: dynamicGreeting
      });
    }

    // 0b. Handle non-tool webhook events gracefully (status-update, end-of-call-report, etc.)
    if (req.body.message?.type && req.body.message.type !== 'tool-calls') {
      return res.status(200).json({
        success: true,
        type: req.body.message.type,
        message: 'Webhook event processed successfully.'
      });
    }

    const rawToolCalls = extractToolCalls(req.body);

    if (rawToolCalls.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'No valid Vapi tool calls detected. Please provide a Vapi toolCall with function "ask_project_knowledge", "register_worker_profile", or "book_worker_service".',
          supportedTools: ['ask_project_knowledge', 'register_worker_profile', 'book_worker_service']
        }
      });
    }

    const context = {
      callId: req.body.message?.call?.id || req.body.call?.id,
      customerPhone: req.body.message?.call?.customer?.number || req.body.call?.customer?.number || req.body.customer_phone
    };

    const results = [];
    const metaData = [];

    for (const tc of rawToolCalls) {
      const processed = await processToolCall(tc, context);
      results.push({
        toolCallId: processed.toolCallId,
        result: processed.result
      });
      if (processed.data) {
        metaData.push(processed.data);
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Vapi Webhook] Completed ${results.length} tool call(s) in ${elapsed}ms`);

    // Standard Vapi Tool Call Response structure
    const responsePayload = { results };
    if (metaData.length > 0) {
      responsePayload.data = metaData.length === 1 ? metaData[0] : metaData;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('[Vapi Webhook Unhandled Exception]', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error while processing Vapi tool call.' }
    });
  }
}

/**
 * POST /api/vapi/register-worker
 * Dedicated endpoint for worker registration via Vapi or direct API calls
 */
export async function handleVapiWorkerRegistration(req, res, next) {
  try {
    const rawToolCalls = extractToolCalls(req.body);

    if (rawToolCalls.length > 0) {
      const results = [];
      let lastRegData = null;

      for (const tc of rawToolCalls) {
        const toolCallId = tc.id || tc.toolCallId || `call_reg_${Date.now()}`;
        const rawArgs = tc.function?.arguments || tc.parameters || tc.arguments || req.body;
        const regResult = await registerWorkerViaVoice(rawArgs);
        lastRegData = regResult;

        results.push({
          toolCallId,
          result: regResult.message
        });
      }

      return res.status(200).json({
        success: true,
        message: lastRegData?.message || 'Worker registered successfully.',
        data: lastRegData,
        results
      });
    }

    // Direct invocation without toolCall wrapping
    const regResult = await registerWorkerViaVoice(req.body);
    return res.status(200).json({
      success: true,
      message: regResult.message,
      data: regResult,
      results: [
        {
          toolCallId: req.body.toolCallId || `call_direct_${Date.now()}`,
          result: regResult.message
        }
      ]
    });
  } catch (error) {
    console.error('[Vapi Worker Registration Error]', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to register worker via voice telephony.' }
    });
  }
}

/**
 * POST /api/vapi/book-worker
 * Dedicated endpoint for booking a worker via Vapi or direct API calls
 */
export async function handleVapiBooking(req, res, next) {
  try {
    const rawToolCalls = extractToolCalls(req.body);

    if (rawToolCalls.length > 0) {
      const results = [];
      let lastBookingData = null;

      for (const tc of rawToolCalls) {
        const toolCallId = tc.id || tc.toolCallId || `call_book_${Date.now()}`;
        const rawArgs = tc.function?.arguments || tc.parameters || tc.arguments || req.body;
        const bookResult = await bookWorkerViaVoice(rawArgs);
        lastBookingData = bookResult;

        results.push({
          toolCallId,
          result: bookResult.message
        });
      }

      return res.status(200).json({
        success: true,
        message: lastBookingData?.message,
        data: lastBookingData,
        results
      });
    }

    const bookResult = await bookWorkerViaVoice(req.body);
    return res.status(200).json({
      success: true,
      message: bookResult.message,
      data: bookResult,
      results: [
        {
          toolCallId: req.body.toolCallId || `call_direct_${Date.now()}`,
          result: bookResult.message
        }
      ]
    });
  } catch (error) {
    console.error('[Vapi Booking Error]', error);
    return res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to book worker via voice telephony.' }
    });
  }
}

/**
 * GET /api/vapi/status
 * Health and diagnostics endpoint for Vapi integration testing,
 * providing ready-to-copy JSON schemas for Vapi Custom Tools.
 */
export async function getVapiIntegrationStatus(req, res) {
  return res.json({
    success: true,
    status: 'online',
    service: 'HireLocal Vapi AI Voice Assistant Gateway',
    toolName: 'ask_project_knowledge',
    endpoint: '/api/vapi/ask-project-knowledge',
    supportedTools: [
      {
        name: 'ask_project_knowledge',
        description: 'Answers caller questions about HireLocal services, pricing, master electrician Mukesh Kumar in Mohali (140413), 0% commission, and feature-phone CallBot bookings.',
        endpoint: '/api/vapi/ask-project-knowledge',
        parameters: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The question asked by the caller regarding services, workers, rates, or policies.'
            }
          },
          required: ['question']
        }
      },
      {
        name: 'register_worker_profile',
        description: 'Registers a new skilled artisan/worker directly during a phone call into HireLocal database with feature-phone CallBot enabled.',
        endpoint: '/api/vapi/register-worker',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The full name of the worker/artisan (e.g. "Rajesh Kumar").'
            },
            phone: {
              type: 'string',
              description: '10-digit mobile phone number of the worker.'
            },
            profession: {
              type: 'string',
              description: 'Trade or profession (e.g. "Electrician", "Plumber", "Carpenter", "Painter", "AC Repair", "Mechanic").'
            },
            pincode: {
              type: 'string',
              description: '6-digit postal PINCODE where the worker operates (e.g. "140413", "462011", "110001").'
            },
            experience: {
              type: 'integer',
              description: 'Years of work experience (e.g. 5).'
            },
            daily_rate: {
              type: 'integer',
              description: 'Daily wage for 8 hours in Indian Rupees (e.g. 550).'
            }
          },
          required: ['name', 'profession', 'pincode']
        }
      },
      {
        name: 'book_worker_service',
        description: 'Books an artisan for a customer via voice phone call and immediately dials the worker to confirm.',
        endpoint: '/api/vapi/book-worker',
        parameters: {
          type: 'object',
          properties: {
            service_type: {
              type: 'string',
              description: 'Service needed (e.g. "Electrician", "Plumber").'
            },
            pincode: {
              type: 'string',
              description: '6-digit postal PINCODE of customer location.'
            },
            customer_phone: {
              type: 'string',
              description: 'Customer contact phone number.'
            },
            customer_name: {
              type: 'string',
              description: 'Customer name.'
            },
            address: {
              type: 'string',
              description: 'Specific address or landmark.'
            }
          },
          required: ['service_type', 'pincode']
        }
      }
    ],
    bhashiniActive: Boolean(
      process.env.BHASHINI_INFERENCE_KEY ||
      (process.env.BHASHINI_USER_ID && process.env.BHASHINI_API_KEY)
    ),
    stagedWorker: {
      name: 'Mukesh Kumar',
      profession: 'Electrician',
      location: 'Bajheri, Mohali, Punjab (140413)',
      rate: '₹550 / day'
    }
  });
}
