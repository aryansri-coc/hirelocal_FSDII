import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startTestServer, stopTestServer, apiRequest } from './testHelper.js';
import { parseIntent } from '../../../packages/callbot/stateMachine.js';
import { LOCALIZED_SCRIPTS } from '../../../packages/callbot/dialogueEngine.js';
import { CALLBOT_INTENTS, JOB_STATUS } from '../../../packages/shared/statusVocabulary.js';

describe('Multilingual AI CallBot Dialogue Engine & Telephony API', () => {
  let customerToken = '';
  let testJobId = '';

  before(async () => {
    await startTestServer();

    // Authenticate customer to create a job for CallBot testing
    const custLogin = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { phone: '9876543210', otp: '123456' }
    });
    customerToken = custLogin.data.data.token;

    const jobRes = await apiRequest('/api/jobs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        worker_id: 'wrk_3',
        service_type: 'Electrician',
        address: 'Govindpura, Bhopal',
        required_date: '2026-11-20',
        description: 'CallBot acceptance test',
        estimated_cost: 500
      }
    });
    testJobId = jobRes.data.data.job.job_id;
  });

  after(async () => {
    await stopTestServer();
  });

  test('parseIntent should correctly identify voice words and DTMF digits in Hindi & English', () => {
    // Hindi intents
    assert.equal(parseIntent('1', 'hi').intent, CALLBOT_INTENTS.ACCEPT);
    assert.equal(parseIntent('हाँ बिल्कुल', 'hi').intent, CALLBOT_INTENTS.ACCEPT);
    assert.equal(parseIntent('स्वीकार', 'hi').intent, CALLBOT_INTENTS.ACCEPT);
    assert.equal(parseIntent('2', 'hi').intent, CALLBOT_INTENTS.REJECT);
    assert.equal(parseIntent('नहीं', 'hi').intent, CALLBOT_INTENTS.REJECT);
    assert.equal(parseIntent('3', 'hi').intent, CALLBOT_INTENTS.REPEAT);

    // English intents
    assert.equal(parseIntent('1', 'en').intent, CALLBOT_INTENTS.ACCEPT);
    assert.equal(parseIntent('yes accept', 'en').intent, CALLBOT_INTENTS.ACCEPT);
    assert.equal(parseIntent('2', 'en').intent, CALLBOT_INTENTS.REJECT);
    assert.equal(parseIntent('decline', 'en').intent, CALLBOT_INTENTS.REJECT);
  });

  test('LOCALIZED_SCRIPTS should provide scripts in Hindi, English, Marathi, Telugu', () => {
    assert.ok(LOCALIZED_SCRIPTS.hi);
    assert.ok(LOCALIZED_SCRIPTS.en);
    assert.ok(LOCALIZED_SCRIPTS.mr);
    assert.ok(LOCALIZED_SCRIPTS.te);
    assert.match(LOCALIZED_SCRIPTS.hi.welcome, /HireLocal/);
    assert.match(LOCALIZED_SCRIPTS.en.welcome, /HireLocal/);
  });

  test('POST /api/callbot/session/start should initiate an outbound call session', async () => {
    const res = await apiRequest('/api/callbot/session/start', {
      method: 'POST',
      body: {
        job_id: testJobId,
        worker_id: 'wrk_3',
        mode: 'job_notification',
        language: 'hi'
      }
    });

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(res.data.sessionId);
    assert.ok(res.data.step.speechText);
  });

  test('POST /api/callbot/session/step should process DTMF 1 and transition job to ACCEPTED', async () => {
    const startRes = await apiRequest('/api/callbot/session/start', {
      method: 'POST',
      body: {
        job_id: testJobId,
        worker_id: 'wrk_3',
        mode: 'job_notification',
        language: 'hi'
      }
    });

    const sessionId = startRes.data.sessionId;

    const stepRes = await apiRequest('/api/callbot/session/step', {
      method: 'POST',
      body: {
        sessionId,
        input: '1' // DTMF 1: Accept
      }
    });

    assert.equal(stepRes.status, 200);
    assert.equal(stepRes.data.success, true);
    assert.ok(stepRes.data.step.speechText);

    // Verify job in database has transitioned to ACCEPTED
    const jobRes = await apiRequest(`/api/jobs/${testJobId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.equal(jobRes.data.data.status, JOB_STATUS.ACCEPTED);
  });

  test('GET /api/callbot/logs should list telephony call logs', async () => {
    const res = await apiRequest('/api/callbot/logs');

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.ok(Array.isArray(res.data.data));
  });
});
