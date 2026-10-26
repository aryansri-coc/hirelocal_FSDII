/**
 * Multilingual AI CallBot Dialogue Engine
 * Supports Hindi (hi), Indian English (en), Marathi (mr), and Telugu (te).
 * Implements State Machines for:
 * 1. Worker Inbound Voice Registration (Non-Smartphone Craftsman Onboarding)
 * 2. Worker Outbound Job Offer & Decision
 * 3. Customer Inbound Order Status Check & Confirmation
 */

import {
  CALLBOT_JOB_STATES,
  CALLBOT_REGISTRATION_STATES,
  CALLBOT_CUSTOMER_STATES,
  CALLBOT_INTENTS
} from '../shared/statusVocabulary.js';
import {
  parseIntent,
  parseProfession,
  parseLanguage,
  parseExperience
} from './stateMachine.js';

export const LOCALIZED_SCRIPTS = {
  hi: {
    welcome: 'नमस्ते! HireLocal सेवा में आपका स्वागत है।',
    select_lang_prompt: 'कृपया अपनी भाषा चुनें। हिंदी के लिए 1 दबाएं, English के लिए 2 दबाएं, मराठीसाठी 3 दाबा, తెలుగు కోసం 4 నొక్కండి।',
    greeting_worker: (name) => `नमस्ते ${name || 'साथी'} जी, HireLocal से आपके लिए एक नया काम उपलब्ध है।`,
    job_details: (job) =>
      `काम का विवरण: सेवा: ${job.service_type || 'कारीगर सेवा'}। तारीख: ${job.required_date || 'आगामी'}। इलाका: ${job.address || 'स्थानीय क्षेत्र'}। अनुमानित कमाई: ₹${job.estimated_cost || 700}। समस्या: ${job.description || 'मरम्मत कार्य'}।`,
    ask_decision:
      'काम स्वीकार करने के लिए 1 दबाएं या "हाँ" बोलें। मना करने के लिए 2 दबाएं या "नहीं" बोलें। दोबारा सुनने के लिए 3 दबाएं।',
    job_accepted:
      'धन्यवाद! आपने काम स्वीकार कर लिया है। ग्राहक का नाम और फ़ोन नंबर आपको SMS द्वारा भेज दिया गया है। कृपया समय पर संपर्क करें। शुभ दिन!',
    job_rejected:
      'कोई बात नहीं। हमने आपकी असमर्थता दर्ज कर ली है। आपके लिए जल्द ही दूसरा काम खोजा जाएगा। धन्यवाद!',
    repeat_prompt: 'मैं विवरण दोबारा सुना रहा हूँ:',
    invalid_input:
      'माफ़ कीजिये, हमें आपकी आवाज़ समझ नहीं आई। काम स्वीकार करने के लिए 1 दबाएं, मना करने के लिए 2 दबाएं।',

    // Worker Registration Scripts
    registration_welcome: 'नमस्ते! HireLocal कारीगर पंजीकरण सेवा में आपका स्वागत है। आप बिना स्मार्टफोन के सीधे फ़ोन कॉल से रजिस्टर कर सकते हैं।',
    ask_name: 'कृपया अपना पूरा नाम बोलें या कीपैड से टाइप करें।',
    ask_profession: 'आपका मुख्य काम क्या है? इलेक्ट्रीशियन के लिए 1, प्लंबर के लिए 2, कारपेंटर के लिए 3, पेंटर के लिए 4, एसी रिपेयर के लिए 5 दबाएं, या अपने काम का नाम बोलें।',
    ask_location: 'आप किस शहर या इलाके में काम करना चाहते हैं? जैसे भोपाल, एमपी नगर, या अपना 6 अंकों का पिनकोड बोलें।',
    ask_experience: 'आपको इस काम का कितने वर्षों का अनुभव है? संख्या बोलें या कीपैड पर दबाएं।',
    confirm_reg: (data) =>
      `आपका नाम ${data.name}, काम ${data.profession}, इलाका ${data.location}, और अनुभव ${data.experience} वर्ष दर्ज किया गया है। पुष्टि के लिए 1 दबाएं। दोबारा दर्ज करने के लिए 2 दबाएं।`,
    reg_success: 'बधाई हो! आपका पंजीकरण HireLocal पर सफलतापूर्वक पूरा हो गया है। अब नए काम की बुकिंग के कॉल सीधे आपके इस फ़ोन पर आएंगे। धन्यवाद!',

    // Customer Inbound Scripts
    customer_welcome: (name) => `नमस्ते ${name || 'ग्राहक'} जी! HireLocal सेवा में आपका स्वागत है।`,
    customer_order_status: (job) =>
      `आपकी ${job.service_type || 'सेवा'} की बुकिंग तारीख ${job.required_date || 'आगामी'} के लिए ${job.status === 'ACCEPTED' ? 'स्वीकृत हो चुकी है' : 'प्रक्रिया में है'}। नियुक्त कारीगर: ${job.worker_name || 'सर्च जारी है'}। पता: ${job.address || 'आपका पता'}।`,
    customer_ask_action:
      'यदि आप घर पर उपलब्ध रहेंगे और बुकिंग की पुष्टि करना चाहते हैं, तो 1 दबाएं। बुकिंग रद्द करने के लिए 2 दबाएं। दोबारा सुनने के लिए 3 दबाएं। सहायता के लिए 0 दबाएं।',
    customer_order_confirmed:
      'धन्यवाद! आपकी पुष्टि दर्ज कर ली गई है। कारीगर निर्धारित समय पर आपके पते पर पहुंचेंगे।',
    customer_order_cancelled:
      'आपकी बुकिंग रद्द कर दी गई है। HireLocal का उपयोग करने के लिए धन्यवाद।',
    customer_no_orders:
      'आपके नंबर पर कोई सक्रिय बुकिंग नहीं मिली है। नई सेवा बुक करने के लिए कृपया हमारी वेबसाइट पर जाएं या सहायता के लिए 0 दबाएं।'
  },

  en: {
    welcome: 'Hello! Welcome to HireLocal voice assistant.',
    select_lang_prompt: 'Please select your language. Press 1 for Hindi, Press 2 for English, Press 3 for Marathi, Press 4 for Telugu.',
    greeting_worker: (name) => `Hello ${name || 'Worker'}, you have a new job offer from HireLocal.`,
    job_details: (job) =>
      `Job Details: Service: ${job.service_type}. Date: ${job.required_date}. Location: ${job.address}. Payout: ₹${job.estimated_cost || 700}. Description: ${job.description}.`,
    ask_decision:
      'To accept this job, press 1 or say "Accept". To decline, press 2 or say "Decline". To repeat details, press 3.',
    job_accepted:
      'Thank you! You have accepted the job. Customer contact details have been sent to your phone via SMS. Have a great day!',
    job_rejected:
      'Understood. You have declined this job. We will notify you when another job is available. Thank you!',
    repeat_prompt: 'Repeating job details:',
    invalid_input:
      'Sorry, we did not understand your input. Press 1 to Accept, or Press 2 to Decline.',

    // Worker Registration Scripts
    registration_welcome: 'Welcome to HireLocal Worker Voice Registration. You can register without a smartphone directly over this call.',
    ask_name: 'Please speak your full name.',
    ask_profession: 'What is your primary trade? Press 1 for Electrician, 2 for Plumber, 3 for Carpenter, 4 for Painter, 5 for AC Repair, or speak your trade.',
    ask_location: 'Which city, locality, or 6-digit PIN code do you work in?',
    ask_experience: 'How many years of experience do you have? Please speak or press the number of years.',
    confirm_reg: (data) =>
      `Name: ${data.name}, Trade: ${data.profession}, Area: ${data.location}, Experience: ${data.experience} years. Is this correct? Press 1 to confirm, Press 2 to restart.`,
    reg_success: 'Congratulations! Your profile has been registered on HireLocal. You will now receive automated call offers for new jobs.',

    // Customer Inbound Scripts
    customer_welcome: (name) => `Hello ${name || 'Customer'}! Welcome to HireLocal.`,
    customer_order_status: (job) =>
      `Your booking for ${job.service_type} on ${job.required_date} is currently ${job.status}. Assigned craftsman: ${job.worker_name || 'Assigning soon'}. Address: ${job.address}.`,
    customer_ask_action:
      'To confirm you will be home, press 1. To cancel this booking, press 2. To repeat details, press 3. For support, press 0.',
    customer_order_confirmed:
      'Thank you! Your presence has been confirmed. The craftsman will arrive at the scheduled time.',
    customer_order_cancelled:
      'Your booking has been cancelled. Thank you for choosing HireLocal.',
    customer_no_orders:
      'No active orders found for your phone number. To book a new service, please visit our website or press 0 for support.'
  },

  mr: {
    welcome: 'नमस्कार! HireLocal सेवेत आपले स्वागत आहे.',
    select_lang_prompt: 'कृपया आपली भाषा निवडा. हिंदीसाठी 1 दाबा, English साठी 2 दाबा, मराठीसाठी 3 दाबा.',
    greeting_worker: (name) => `नमस्कार ${name || 'मित्र'} जी, HireLocal कडून आपल्यासाठी एक नवीन काम उपलब्ध आहे.`,
    job_details: (job) =>
      `कामाचा तपशील: सेवा: ${job.service_type}। तारीख: ${job.required_date}। ठिकाण: ${job.address}। मोबदला: ₹${job.estimated_cost || 700}।`,
    ask_decision:
      'काम स्वीकारण्यासाठी 1 दाबा किंवा "होय" म्हणा. नकार देण्यासाठी 2 दाबा. पुन्हा ऐकण्यासाठी 3 दाबा.',
    job_accepted:
      'धन्यवाद! आपण काम स्वीकारले आहे. ग्राहकाचा तपशील आपल्याला SMS द्वारे पाठवला आहे.',
    job_rejected:
      'ठीक आहे. आपल्यासाठी लवकरच दुसरे काम शोधले जाईल. धन्यवाद!',
    repeat_prompt: 'मी पुन्हा तपशील सांगत आहे:',
    invalid_input:
      'क्षमस्व, आपला प्रतिसाद समजला नाही. स्वीकारण्यासाठी 1 दाबा, नाकारण्यासाठी 2 दाबा.',
    registration_welcome: 'HireLocal कारागीर नोंदणी सेवेत आपले स्वागत आहे.',
    ask_name: 'कृपया आपले पूर्ण नाव सांगा.',
    ask_profession: 'आपले मुख्य काम काय आहे? इलेक्ट्रिशियनसाठी 1, प्लंबरसाठी 2, कारपेंटरसाठी 3, पेंटरसाठी 4 दाबा.',
    ask_location: 'आपण कोणत्या शहरात किंवा भागात काम करता?',
    ask_experience: 'आपल्याला या कामाचा किती वर्षांचा अनुभव आहे?',
    confirm_reg: (data) =>
      `नाव ${data.name}, काम ${data.profession}, ठिकाण ${data.location}, अनुभव ${data.experience} वर्षे. पुष्टीसाठी 1 दाबा.`,
    reg_success: 'अभिनंदन! HireLocal वर आपली नोंदणी पूर्ण झाली आहे. आता कामाचे कॉल थेट आपल्या फोनवर येतील.',
    customer_welcome: (name) => `नमस्कार ${name || 'ग्राहक'} जी! HireLocal मध्ये आपले स्वागत आहे.`,
    customer_order_status: (job) =>
      `आपली ${job.service_type} ची बुकिंग तारीख ${job.required_date} साठी नोंदवली आहे. कारागीर: ${job.worker_name || 'शोध सुरू आहे'}.`,
    customer_ask_action:
      'पुष्टीसाठी 1 दाबा. रद्द करण्यासाठी 2 दाबा. पुन्हा ऐकण्यासाठी 3 दाबा.',
    customer_order_confirmed: 'धन्यवाद! आपली पुष्टी नोंदवली गेली आहे.',
    customer_order_cancelled: 'आपली बुकिंग रद्द केली आहे.',
    customer_no_orders: 'आपल्या नंबरवर कोणतीही चालू बुकिंग आढळली नाही.'
  },

  te: {
    welcome: 'నమస్కారం! HireLocal సేవలకు స్వాగతం.',
    select_lang_prompt: 'దయచేసి మీ భాషను ఎంచుకోండి. హిందీ కోసం 1, ఇంగ్లీష్ కోసం 2, తెలుగు కోసం 4 నొక్కండి.',
    greeting_worker: (name) => `నమస్కారం ${name || 'మిత్రమా'} గారు, HireLocal నుండి మీకు కొత్త పని ఆఫర్ ఉంది.`,
    job_details: (job) =>
      `పని వివరాలు: సేవ: ${job.service_type}. తేదీ: ${job.required_date}. స్థలం: ${job.address}. చెల్లింపు: ₹${job.estimated_cost || 700}.`,
    ask_decision:
      'పనిని అంగీకరించడానికి 1 నొక్కండి. తిరస్కరించడానికి 2 నొక్కండి. మళ్లీ వినడానికి 3 నొక్కండి.',
    job_accepted:
      'ధన్యవాదాలు! మీరు పనిని అంగీకరించారు. కస్టమర్ వివరాలు SMS ద్వారా పంపబడ్డాయి.',
    job_rejected:
      'సరే, త్వరలో మీకు మరొక పని కేటాయిస్తాము. ధన్యవాదాలు!',
    repeat_prompt: 'వివరాలు మళ్లీ చెబుతున్నాము:',
    invalid_input:
      'క్షమించండి, మీ స్పందన అర్థం కాలేదు. అంగీకరించడానికి 1, తిరస్కరించడానికి 2 నొక్కండి.',
    registration_welcome: 'HireLocal కార్మికుల వాయిస్ రిజిస్ట్రేషన్‌కు స్వాగతం.',
    ask_name: 'దయచేసి మీ పూర్తి పేరు చెప్పండి.',
    ask_profession: 'మీ వృత్తి ఏమిటి? ఎలక్ట్రీషియన్ కోసం 1, ప్లంబర్ కోసం 2, కార్పెంటర్ కోసం 3, పెయింటర్ కోసం 4 నొక్కండి.',
    ask_location: 'మీరు ఏ ప్రాంతం లేదా నగరంలో పనిచేస్తారు?',
    ask_experience: 'మీకు ఎన్ని సంవత్సరాల అనుభవం ఉంది? సంఖ్య చెప్పండి.',
    confirm_reg: (data) =>
      `పేరు ${data.name}, వృత్తి ${data.profession}, ప్రాంతం ${data.location}, అనుభవం ${data.experience} సం||. నిర్ధారించడానికి 1 నొక్కండి.`,
    reg_success: 'అభినందనలు! HireLocal లో మీ రిజిస్ట్రేషన్ విజయవంతమైంది. ఇకపై నేరుగా ఫోన్ కాల్స్ వస్తాయి.',
    customer_welcome: (name) => `నమస్కారం ${name || 'కస్టమర్'} గారు!`,
    customer_order_status: (job) =>
      `మీ ${job.service_type} ఆర్డర్ తేదీ ${job.required_date} కు కేటాయించబడింది. కార్మికుడు: ${job.worker_name || 'కేటాయింపు జరుగుతోంది'}.`,
    customer_ask_action:
      'నిర్ధారించడానికి 1 నొక్కండి. రద్దు చేయడానికి 2 నొక్కండి.',
    customer_order_confirmed: 'ధన్యవాదాలు! మీ నిర్ధారణ పూర్తయింది.',
    customer_order_cancelled: 'మీ ఆర్డర్ రద్దు చేయబడింది.',
    customer_no_orders: 'మీ నంబర్ పై ఎటువంటి ఆర్డర్లు లేవు.'
  }
};

/**
 * 1. Process Outbound Job Offer Call to Worker
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
      const responseText = `${script.greeting_worker(session.workerName)} ${script.job_details(session.job || {})} ${script.ask_decision}`;
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
        const responseText = `${script.repeat_prompt} ${script.job_details(session.job || {})} ${script.ask_decision}`;
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
          : 'Call ended due to no response. Goodbye.';
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
        speechText: 'Thank you. Goodbye.',
        nextState: CALLBOT_JOB_STATES.END_CALL,
        action: 'HANGUP',
        isComplete: true
      };
    }
  }
}

/**
 * 2. Process Inbound Worker Voice Registration
 * Allows 2G / non-smartphone workers to register directly over phone call!
 */
export function processRegistrationCallStep(session, input) {
  let lang = session.language || 'hi';
  let script = LOCALIZED_SCRIPTS[lang] || LOCALIZED_SCRIPTS.hi;

  session.logStep('caller', input || '[Call Initiated]', session.state);

  switch (session.state) {
    case CALLBOT_REGISTRATION_STATES.START: {
      session.state = CALLBOT_REGISTRATION_STATES.SELECT_LANGUAGE;
      const speechText = `${script.registration_welcome} ${script.select_lang_prompt}`;
      session.logStep('bot', speechText, session.state);
      return {
        speechText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    case CALLBOT_REGISTRATION_STATES.SELECT_LANGUAGE: {
      const chosenLang = parseLanguage(input);
      session.language = chosenLang;
      lang = chosenLang;
      script = LOCALIZED_SCRIPTS[lang] || LOCALIZED_SCRIPTS.hi;

      session.state = CALLBOT_REGISTRATION_STATES.GET_NAME;
      const speechText = script.ask_name;
      session.logStep('bot', speechText, session.state);
      return {
        speechText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    case CALLBOT_REGISTRATION_STATES.GET_NAME: {
      const rawName = String(input || '').trim();
      session.registrationData.name = rawName && rawName.length > 1 ? rawName : 'कारीगर साथी';

      session.state = CALLBOT_REGISTRATION_STATES.GET_PROFESSION;
      const speechText = script.ask_profession;
      session.logStep('bot', speechText, session.state);
      return {
        speechText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    case CALLBOT_REGISTRATION_STATES.GET_PROFESSION: {
      const profession = parseProfession(input);
      session.registrationData.profession = profession;

      session.state = CALLBOT_REGISTRATION_STATES.GET_LOCATION;
      const speechText = script.ask_location;
      session.logStep('bot', speechText, session.state);
      return {
        speechText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    case CALLBOT_REGISTRATION_STATES.GET_LOCATION: {
      const rawLoc = String(input || '').trim();
      session.registrationData.location = rawLoc && rawLoc.length > 1 ? rawLoc : 'Bhopal (462011)';

      session.state = CALLBOT_REGISTRATION_STATES.GET_EXPERIENCE;
      const speechText = script.ask_experience;
      session.logStep('bot', speechText, session.state);
      return {
        speechText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    case CALLBOT_REGISTRATION_STATES.GET_EXPERIENCE: {
      const exp = parseExperience(input);
      session.registrationData.experience = exp;

      session.state = CALLBOT_REGISTRATION_STATES.CONFIRM_DETAILS;
      const speechText = script.confirm_reg(session.registrationData);
      session.logStep('bot', speechText, session.state);
      return {
        speechText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    case CALLBOT_REGISTRATION_STATES.CONFIRM_DETAILS: {
      const parsed = parseIntent(input);

      if (parsed.intent === CALLBOT_INTENTS.ACCEPT) {
        session.state = CALLBOT_REGISTRATION_STATES.REGISTRATION_COMPLETE;
        session.status = 'completed';
        const speechText = script.reg_success;
        session.logStep('bot', speechText, session.state);
        return {
          speechText,
          nextState: CALLBOT_REGISTRATION_STATES.REGISTRATION_COMPLETE,
          action: 'EXECUTE_REGISTRATION',
          registrationData: session.registrationData,
          isComplete: true
        };
      }

      if (parsed.intent === CALLBOT_INTENTS.REJECT) {
        // Restart registration on rejection
        session.state = CALLBOT_REGISTRATION_STATES.GET_NAME;
        const speechText = `${script.invalid_input} ${script.ask_name}`;
        session.logStep('bot', speechText, session.state);
        return {
          speechText,
          nextState: session.state,
          action: 'LISTEN',
          isComplete: false
        };
      }

      // Retry
      const speechText = script.confirm_reg(session.registrationData);
      session.logStep('bot', speechText, session.state);
      return {
        speechText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    default: {
      return {
        speechText: 'Registration ended. Goodbye.',
        nextState: CALLBOT_REGISTRATION_STATES.REGISTRATION_COMPLETE,
        action: 'HANGUP',
        isComplete: true
      };
    }
  }
}

/**
 * 3. Process Inbound Customer Call (Order Check & Confirmation)
 * Allows customers to call and check their active order or confirm their availability.
 */
export function processCustomerCallStep(session, input) {
  const lang = session.language || 'hi';
  const script = LOCALIZED_SCRIPTS[lang] || LOCALIZED_SCRIPTS.hi;
  const parsed = parseIntent(input);

  session.logStep('customer', input || '[Call Initiated]', session.state);

  switch (session.state) {
    case CALLBOT_CUSTOMER_STATES.START: {
      if (!session.job) {
        session.state = CALLBOT_CUSTOMER_STATES.END_CALL;
        const noOrderText = `${script.customer_welcome(session.customer?.name)} ${script.customer_no_orders}`;
        session.logStep('bot', noOrderText, session.state);
        return {
          speechText: noOrderText,
          nextState: CALLBOT_CUSTOMER_STATES.END_CALL,
          action: 'HANGUP',
          isComplete: true
        };
      }

      session.state = CALLBOT_CUSTOMER_STATES.CONFIRM_ORDER;
      const responseText = `${script.customer_welcome(session.customer?.name)} ${script.customer_order_status(session.job)} ${script.customer_ask_action}`;
      session.logStep('bot', responseText, session.state);
      return {
        speechText: responseText,
        nextState: CALLBOT_CUSTOMER_STATES.CONFIRM_ORDER,
        action: 'LISTEN',
        isComplete: false
      };
    }

    case CALLBOT_CUSTOMER_STATES.ORDER_STATUS:
    case CALLBOT_CUSTOMER_STATES.CONFIRM_ORDER: {
      if (parsed.intent === CALLBOT_INTENTS.ACCEPT) {
        session.state = CALLBOT_CUSTOMER_STATES.END_CALL;
        session.status = 'completed';
        const responseText = script.customer_order_confirmed;
        session.logStep('bot', responseText, session.state);
        return {
          speechText: responseText,
          nextState: CALLBOT_CUSTOMER_STATES.END_CALL,
          action: 'EXECUTE_CUSTOMER_CONFIRMATION',
          jobId: session.job?.job_id,
          isComplete: true
        };
      }

      if (parsed.intent === CALLBOT_INTENTS.REJECT || parsed.intent === CALLBOT_INTENTS.CANCEL) {
        session.state = CALLBOT_CUSTOMER_STATES.END_CALL;
        session.status = 'completed';
        const responseText = script.customer_order_cancelled;
        session.logStep('bot', responseText, session.state);
        return {
          speechText: responseText,
          nextState: CALLBOT_CUSTOMER_STATES.END_CALL,
          action: 'EXECUTE_CUSTOMER_CANCELLATION',
          jobId: session.job?.job_id,
          isComplete: true
        };
      }

      if (parsed.intent === CALLBOT_INTENTS.REPEAT) {
        const responseText = `${script.repeat_prompt} ${script.customer_order_status(session.job || {})} ${script.customer_ask_action}`;
        session.logStep('bot', responseText, session.state);
        return {
          speechText: responseText,
          nextState: session.state,
          action: 'LISTEN',
          isComplete: false
        };
      }

      if (parsed.intent === CALLBOT_INTENTS.HELP) {
        const responseText = lang === 'hi'
          ? 'कृपया प्रतीक्षा करें, आपकी कॉल हमारे सहायता केंद्र से जोड़ी जा रही है...'
          : 'Please hold while we connect you to customer support...';
        session.logStep('bot', responseText, session.state);
        return {
          speechText: responseText,
          nextState: CALLBOT_CUSTOMER_STATES.END_CALL,
          action: 'CONNECT_SUPPORT',
          isComplete: true
        };
      }

      // Retry prompt
      const retryText = `${script.invalid_input} ${script.customer_ask_action}`;
      session.logStep('bot', retryText, session.state);
      return {
        speechText: retryText,
        nextState: session.state,
        action: 'LISTEN',
        isComplete: false
      };
    }

    default: {
      return {
        speechText: 'Thank you for calling HireLocal.',
        nextState: CALLBOT_CUSTOMER_STATES.END_CALL,
        action: 'HANGUP',
        isComplete: true
      };
    }
  }
}
