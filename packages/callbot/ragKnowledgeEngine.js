/**
 * Hyperlocal RAG (Retrieval-Augmented Generation) & Multilingual Language Detection Engine
 * Powers the HireLocal CallBot with real-time knowledge retrieval and automated language matching.
 */

// 1. Multilingual Language Detection
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'hi';
  const str = text.trim().toLowerCase();

  // 1. Telugu Script
  if (/[\u0C00-\u0C7F]/.test(str)) {
    return 'te';
  }

  // 2. Devanagari Script (Hindi vs Marathi)
  if (/[\u0900-\u097F]/.test(str)) {
    // Unique Marathi character: ळ (U+0933)
    if (/[\u0933]/.test(str)) return 'mr';
    // Common Marathi function words in Devanagari
    if (/\b(आहे|नाही|होय|दाबा|करा|मी|आपले|नमस्कार|पाहिजे|कधी|कसे|मिळेल|मिळतील|सांगा|कॅन्सल)\b/i.test(str)) {
      return 'mr';
    }
    return 'hi';
  }

  // 3. Latin Script / Phonetic Detection
  // Telugu in Latin
  if (/\b(namaskaram|avunu|ledu|chesta|eppudu|ela|kavali|dhanyavadalu|dabbu|panulaki)\b/i.test(str)) {
    return 'te';
  }

  // Marathi in Latin
  if (/\b(namaskar|ahe|nahi|hoy|nako|karin|sangto|kiti|kuthe|kasa|miltil|kadhi)\b/i.test(str)) {
    return 'mr';
  }

  // English words and stop words
  const englishPattern = /\b(how|much|what|when|where|who|why|will|can|do|is|are|the|you|my|i|we|pay|paid|payout|money|earnings|cost|rate|address|job|worker|accept|decline|repeat|yes|no|hello|hi|please|rules|timing|safety|cancel|help|ok|okay|sure|confirm|login|status|details)\b/i;
  // Hindi in Latin (Hinglish)
  const hinglishPattern = /\b(haan|nahi|theek|accha|kab|kahan|kitna|paise|kamai|aunga|batao|karo|bhopal|shiksha|bijli|nal|mistri|namaste|sunao|kripya|chahiye|milega|milenge|mera|meri|kaam)\b/i;

  const englishMatches = (str.match(new RegExp(englishPattern, 'gi')) || []).length;
  const hinglishMatches = (str.match(new RegExp(hinglishPattern, 'gi')) || []).length;

  if (englishMatches > hinglishMatches) return 'en';
  if (hinglishMatches > 0) return 'hi';

  // Default to English if input contains pure English alphabet without Hindi markers
  if (/^[a-zA-Z0-9\s.,?!'-]+$/.test(str) && englishMatches > 0) {
    return 'en';
  }

  return 'hi';
}

// 2. Curated HireLocal Knowledge Base for RAG Retrieval (Devanagari + Latin Keywords)
export const KNOWLEDGE_BASE = [
  {
    topic: 'payout_earnings',
    keywords: [
      'payout', 'money', 'earnings', 'paise', 'kamai', 'kitna', 'rupaye', 'fee', 'rate', 'cost', 'pay', 'paid', 'commission',
      'पैसे', 'कमाई', 'मजदूरी', 'रुपये', 'कमीशन', 'पेमेंट', 'मोबदला', 'पगार', 'డబ్బులు', 'చెల్లింపు'
    ],
    answers: {
      hi: 'HireLocal पर कारीगरों को पूरी मजदूरी सीधे ग्राहक से काम खत्म होने पर नकद या UPI द्वारा मिलती है। HireLocal कारीगर से कोई कमीशन नहीं काटता।',
      en: 'On HireLocal, workers receive 100% of their earnings directly from the customer upon job completion via cash or UPI. We charge 0% commission from daily wage workers.',
      mr: 'HireLocal वर कारागिरांना कामाचा मोबदला थेट ग्राहकाकडून रोख किंवा UPI द्वारे मिळतो. आम्ही कोणतेही कमिशन कापत नाही.',
      te: 'HireLocal లో కార్మికులు పని పూర్తయిన తర్వాత కస్టమర్ నుండి నేరుగా నగదు లేదా UPI ద్వారా 100% చెల్లింపు పొందుతారు.'
    }
  },
  {
    topic: 'address_location',
    keywords: [
      'address', 'location', 'kahan', 'pata', 'thikana', 'area', 'pincode', 'where', 'place', 'doorstep',
      'पता', 'कहाँ', 'इलाका', 'पिनकोड', 'ठिकाण', 'कुठे', 'చిరునామా', 'ప్రాంతం'
    ],
    answers: {
      hi: 'काम का इलाका ग्राहक द्वारा बुकिंग के समय दर्ज किया जाता है। काम स्वीकार करने के बाद ग्राहक का सटीक पता और गूगल मैप लोकेशन आपको तुरंत SMS पर भेजी जाती है।',
      en: 'The service location is provided by the customer during booking. Once you accept the job, the exact doorstep address and landmark are dispatched immediately via SMS.',
      mr: 'कामाचे ठिकाण ग्राहकाने नोंदवलेले असते. काम स्वीकारल्यानंतर पूर्ण पत्ता आणि फोन नंबर आपल्याला SMS द्वारे मिळतो.',
      te: 'పని ప్రదేశం కస్టమర్ వివరాలలో ఉంటుంది. పని అంగీకరించిన వెంటనే పూర్తి చిరునామా మీకు SMS చేయబడుతుంది.'
    }
  },
  {
    topic: 'timing_hours',
    keywords: [
      'time', 'timing', 'samay', 'ghante', 'duration', 'when', 'hours', 'slot',
      'समय', 'कब', 'घंटे', 'तारीख', 'वेळ', 'कधी', 'సమయం', 'ఎప్పుడు'
    ],
    answers: {
      hi: 'HireLocal डे-बेस्ड बुकिंग मॉडल पर काम करता है। सामान्य स्लॉट: सुबह 9 से 12, दोपहर 12 से 4, या शाम 4 से 7। आप ग्राहक से बात करके समय में थोड़ा बदलाव भी कर सकते हैं।',
      en: 'HireLocal works on a day-based booking model with flexible slots: Morning (9 AM-12 PM), Afternoon (12 PM-4 PM), or Evening (4 PM-7 PM). You can coordinate directly with the customer.',
      mr: 'HireLocal दिवसाच्या आधारावर काम करते: सकाळ 9 ते 12, दुपार 12 ते 4, किंवा संध्याकाळ 4 ते 7. आपण ग्राहकाशी चर्चा करून वेळ ठरवू शकता.',
      te: 'HireLocal రోజువారీ బుకింగ్ పై పనిచేస్తుంది: ఉదయం 9-12, మధ్యాహ్నం 12-4, లేదా సాయంత్రం 4-7 సమయాలు అందుబాటులో ఉంటాయి.'
    }
  },
  {
    topic: 'reliability_rating',
    keywords: [
      'reliability', 'rating', 'score', 'trust', 'bharosa', 'cancelling', 'stars',
      'रेटिंग', 'भरोसा', 'विश्वसनीयता', 'स्कोअर', 'విశ్వసనీయత', 'రేటింగ్'
    ],
    answers: {
      hi: 'आपकी विश्वसनीयता (Reliability) स्वीकार किए गए और पूरे किए गए कामों के अनुपात पर आधारित है। समय पर काम पूरा करने से आपका स्कोर 100% रहता है और आपको ज़्यादा काम मिलते हैं।',
      en: 'Your reliability score reflects the ratio of completed jobs to accepted jobs. Completing assigned jobs on time maintains a 100% score and grants priority in future job dispatches.',
      mr: 'आपली विश्वसनीयता आपण स्वीकारलेली आणि पूर्ण केलेली कामे यावर अवलंबून असते. वेळेवर काम केल्यास 100% स्कोअर राहतो.',
      te: 'మీ విశ్వసనీయత స్కోర్ మీరు పూర్తి చేసిన పనులపై ఆధారపడి ఉంటుంది. సమయానికి పని చేయడం వల్ల మరిన్ని కొత్త పనులు లభిస్తాయి.'
    }
  },
  {
    topic: 'non_smartphone_support',
    keywords: [
      'smartphone', 'phone', 'app', 'feature phone', 'call', 'ivr', 'sms', 'keypad',
      'फ़ोन', 'स्मार्टफ़ोन', 'कॉल', 'कीपैड', 'साधा फोन', 'ఫోన్'
    ],
    answers: {
      hi: 'HireLocal विशेष रूप से बिना स्मार्टफोन वाले कारीगरों के लिए बनाया गया है। नए काम की सूचना, स्वीकृति और पंजीकरण सब कुछ सामान्य कीपैड फ़ोन कॉल और SMS द्वारा संभव है।',
      en: 'HireLocal is purpose-built for non-smartphone craftsmen. Job alerts, decisions (DTMF 1/2), and registrations work seamlessly over standard telephone calls and SMS without any internet app.',
      mr: 'HireLocal स्मार्टफोन नसलेल्या कारागिरांसाठी बनवले आहे. सर्व कामाचे कॉल आणि निर्णय साध्या कीपॅड फोनवरून सहज करता येतात.',
      te: 'HireLocal స్మార్ట్‌ఫోన్ లేని కార్మికుల కోసం ప్రత్యేకంగా రూపొందించబడింది. సాధారణ ఫోన్ కాల్స్ మరియు SMS ద్వారా అన్ని పనులు చేయవచ్చు.'
    }
  },
  {
    topic: 'cancellation_policy',
    keywords: [
      'cancel', 'cancellation', 'radd', 'emergency', 'leave',
      'रद्द', 'कैंसिल', 'कॅन्सल', 'రద్దు'
    ],
    answers: {
      hi: 'यदि किसी कारणवश आप काम नहीं कर सकते, तो कॉल पर 2 दबाएं या ऐप में कैंसिल करें। हमारी प्रणाली तुरंत नजदीकी दूसरे कारीगर को काम ऑफर कर देती है ताकि ग्राहक को परेशानी न हो।',
      en: 'If an emergency arises and you cannot attend, press 2 on the call or notify us. Our proximity engine automatically reassigns an alternative nearby worker.',
      mr: 'काही अडचण असल्यास आपण 2 दाबून नकार देऊ शकता. सिस्टम त्वरित दुसऱ्या जवळच्या कारागिराला काम देईल.',
      te: 'మీరు రాలేకపోతే 2 నొక్కండి. వ్యవస్థ వెంటనే దగ్గరలోని మరో కార్మికుడికి ఈ పనిని కేటాయిస్తుంది.'
    }
  }
];

// 3. RAG Retrieval Query Matcher
export function retrieveKnowledge(query, preferredLanguage = null) {
  if (!query || typeof query !== 'string') return null;

  const detectedLang = detectLanguage(query);
  const targetLang = preferredLanguage || detectedLang || 'hi';
  const cleanQuery = query.toLowerCase().trim();

  // Score each knowledge topic by keyword matches
  let bestMatch = null;
  let highestScore = 0;

  for (const item of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      if (cleanQuery.includes(kw.toLowerCase())) {
        score += kw.length >= 4 ? 2 : 1;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Minimum match threshold
  if (bestMatch && highestScore >= 1) {
    const answer = bestMatch.answers[targetLang] || bestMatch.answers.hi || bestMatch.answers.en;
    return {
      topic: bestMatch.topic,
      score: highestScore,
      detectedLanguage: detectedLang,
      targetLanguage: targetLang,
      answer
    };
  }

  return null;
}
