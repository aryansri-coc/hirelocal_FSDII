/**
 * Multilingual AI CallBot Dialogue Engine
 * Supports Hindi, English, Marathi, and Telugu.
 * Controls dialogue state transitions and text-to-speech output.
 */

import {
  CALLBOT_JOB_STATES,
  CALLBOT_REGISTRATION_STATES,
  CALLBOT_INTENTS
} from '../shared/statusVocabulary.js';
import { parseIntent } from './stateMachine.js';

export const LOCALIZED_SCRIPTS = {
  hi: {
    welcome: 'नमस्ते! HireLocal सेवा में आपका स्वागत है।',
    select_lang_prompt: 'कृपया अपनी भाषा चुनें। हिंदी के लिए 1 दबाएं, English के लिए 2 दबाएं।',
    greeting_worker: (name) => `नमस्ते ${name || 'साथी'} जी, HireLocal से आपके लिए एक नया काम उपलब्ध है।`,
    job_details: (job) =>
      `काम का विवरण इस प्रकार है: सेवा: ${job.service_type || 'कारीगर सेवा'}। तारीख: ${job.required_date || 'आगामी'}। इलाका: ${job.address || 'स्थानीय क्षेत्र'}। समस्या: ${job.description || 'मरम्मत कार्य'}।`,
    ask_decision:
      'यदि आप यह काम स्वीकार करना चाहते हैं, तो 1 दबाएं या "हाँ" बोलें। यदि आप अभी उपलब्ध नहीं हैं, तो 2 दबाएं या "नहीं" बोलें। दोबारा सुनने के लिए 3 दबाएं।',
    job_accepted:
      'धन्यवाद! आपने काम स्वीकार कर लिया है। ग्राहक का विवरण आपको SMS द्वारा भेज दिया गया है। कृपया समय पर संपर्क करें। शुभ दिन!',
    job_rejected:
      'कोई बात नहीं। हमने आपकी असमर्थता दर्ज कर ली है। आपके लिए जल्द ही दूसरा काम खोजा जाएगा। धन्यवाद!',
    repeat_prompt: 'मैं विवरण दोबारा सुना रहा हूँ:',
    invalid_input:
      'माफ़ कीजिये, हमें आपकी आवाज़ समझ नहीं आई। काम स्वीकार करने के लिए 1 दबाएं, मना करने के लिए 2 दबाएं।',
    registration_welcome: 'नमस्ते! HireLocal कारीगर पंजीकरण में आपका स्वागत है।',
    ask_name: 'कृपया बीप के बाद अपना पूरा नाम बोलें।',
    ask_profession: 'आपका मुख्य काम क्या है? जैसे इलेक्ट्रीशियन, प्लंबर, कारपेंटर या पेंटर?',
    ask_location: 'आप किस शहर या इलाके में काम करना चाहते हैं?',
    ask_experience: 'आपको इस काम का कितने वर्षों का अनुभव है? संख्या बोलें।',
    confirm_reg: (data) =>
      `आपका नाम ${data.name}, काम ${data.profession}, इलाका ${data.location}, और अनुभव ${data.experience} वर्ष है। क्या यह सही है? पुष्टि के लिए 1 दबाएं।`,
    reg_success: 'बधाई हो! आपका पंजीकरण HireLocal पर सफलतापूर्वक पूरा हो गया है। अब आपको नए काम के कॉल आएंगे।'
  },
  en: {
    welcome: 'Hello! Welcome to HireLocal voice assistant.',
    select_lang_prompt: 'Please select your language. Press 1 for Hindi, Press 2 for English.',
    greeting_worker: (name) => `Hello ${name || 'Worker'}, you have a new job request from HireLocal.`,
    job_details: (job) =>
      `Job Details: Service: ${job.service_type}. Date: ${job.required_date}. Location: ${job.address}. Description: ${job.description}.`,
    ask_decision:
      'To accept this job, press 1 or say "Accept". To reject, press 2 or say "Reject". To hear the details again, press 3.',
    job_accepted:
      'Thank you! You have accepted the job. Customer contact information is sent to your phone. Have a great day!',
    job_rejected:
      'Understood. You have declined this job. We will notify you when another job is available. Thank you!',
    repeat_prompt: 'Repeating job details:',
    invalid_input:
      'Sorry, we could not understand your response. Press 1 to Accept, or Press 2 to Reject.',
    registration_welcome: 'Welcome to HireLocal Worker Registration.',
    ask_name: 'Please speak your full name after the tone.',
    ask_profession: 'What is your primary trade? For example: Electrician, Plumber, Carpenter, AC Repair.',
    ask_location: 'Which city or neighborhood do you serve?',
    ask_experience: 'How many years of experience do you have? Please speak the number of years.',
    confirm_reg: (data) =>
      `Name: ${data.name}, Trade: ${data.profession}, Area: ${data.location}, Experience: ${data.experience} years. Is this correct? Press 1 to confirm.`,
    reg_success: 'Congratulations! Your profile has been registered on HireLocal. You will now receive job opportunities.'
  }
};

/**
 * Processes incoming input (voice transcript or DTMF digit) and advances the session.
 */
export function processJobCallStep(session, input) {
  const lang = session.language || 'hi';
  const script = LOCALIZED_SCRIPTS[lang] || LOCALIZED_SCRIPTS.hi;
  const parsed = parseIntent(input);

  session.logStep('worker', input || '[Silence / DTMF]', session.state);

  switch (session.state) {
    case CALLBOT_JOB_STATES.START_CALL:
    case CALLBOT_JOB_STATES.VERIFY_WORKER: {
      session.state = CALLBOT_JOB_STATES.INTRODUCE_JOB;
      const responseText = `${script.greeting_worker(session.workerName)} ${script.job_details(session.job)} ${script.ask_decision}`;
      session.logStep('bot', responseText, session.state);
      return {
        speechText: responseText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    case CALLBOT_JOB_STATES.INTRODUCE_JOB:
    case CALLBOT_JOB_STATES.ASK_DECISION: {
      if (parsed.intent === CALLBOT_INTENTS.ACCEPT) {
        session.state = CALLBOT_JOB_STATES.UPDATE_DATABASE;
        session.decision = 'ACCEPTED';
        session.status = 'completed';
        const responseText = script.job_accepted;
        session.logStep('bot', responseText, session.state);
        return {
          speechText: responseText,
          nextState: CALLBOT_JOB_STATES.END_CALL,
          action: 'EXECUTE_DECISION',
          decision: 'ACCEPTED',
          jobId: session.job?.job_id,
          isComplete: true
        };
      }

      if (parsed.intent === CALLBOT_INTENTS.REJECT) {
        session.state = CALLBOT_JOB_STATES.UPDATE_DATABASE;
        session.decision = 'REJECTED';
        session.status = 'completed';
        const responseText = script.job_rejected;
        session.logStep('bot', responseText, session.state);
        return {
          speechText: responseText,
          nextState: CALLBOT_JOB_STATES.END_CALL,
          action: 'EXECUTE_DECISION',
          decision: 'REJECTED',
          jobId: session.job?.job_id,
          isComplete: true
        };
      }

      if (parsed.intent === CALLBOT_INTENTS.REPEAT) {
        const responseText = `${script.repeat_prompt} ${script.job_details(session.job)} ${script.ask_decision}`;
        session.logStep('bot', responseText, session.state);
        return {
          speechText: responseText,
          nextState: session.state,
          action: 'LISTEN',
          isComplete: false
        };
      }

      // Retry handling
      session.retries += 1;
      if (session.retries >= session.maxRetries) {
        session.state = CALLBOT_JOB_STATES.END_CALL;
        session.status = 'failed';
        const timeoutMsg = lang === 'hi'
          ? 'प्रतिक्रिया न मिलने के कारण कॉल समाप्त की जा रही है।'
          : 'Call ended due to no valid response. Goodbye.';
        session.logStep('bot', timeoutMsg, session.state);
        return {
          speechText: timeoutMsg,
          nextState: CALLBOT_JOB_STATES.END_CALL,
          action: 'HANGUP',
          decision: 'NO_RESPONSE',
          isComplete: true
        };
      }

      const retryPrompt = `${script.invalid_input} ${script.ask_decision}`;
      session.logStep('bot', retryPrompt, session.state);
      return {
        speechText: retryPrompt,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    default: {
      return {
        speechText: 'Thank you.',
        nextState: CALLBOT_JOB_STATES.END_CALL,
        action: 'HANGUP',
        isComplete: true
      };
    }
  }
}
