/**
 * Bhashini AI Integration Service (MeitY - Government of India)
 * Provides state-of-the-art Indian language models for:
 * 1. ASR (Automatic Speech Recognition / Speech-to-Text)
 * 2. TTS (Text-to-Speech)
 * 3. NMT (Neural Machine Translation)
 * Supports 22 scheduled Indian languages (Hindi, Marathi, Telugu, Tamil, Bengali, etc.)
 */

// In-memory cache for pipeline inference endpoints and service IDs
const pipelineCache = new Map();

const BHASHINI_AUTH_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const DEFAULT_INFERENCE_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
const DEFAULT_PIPELINE_ID = '64392f96daac500b55c543cd';

const DRAVIDIAN_LANGS = ['te', 'ta', 'kn', 'ml'];

/**
 * Returns default curated AI4Bharat service ID for TTS by language
 */
export function getCuratedTtsServiceId(language = 'hi') {
  const lang = (language || 'hi').toLowerCase();
  if (DRAVIDIAN_LANGS.includes(lang)) {
    return 'ai4bharat/indic-tts-coqui-dravidian-gpu--t4';
  }
  if (lang === 'en') {
    return 'ai4bharat/indic-tts-coqui-misc-gpu--t4';
  }
  return 'ai4bharat/indic-tts-coqui-indo_aryan-gpu--t4';
}

/**
 * Returns default curated AI4Bharat service ID for ASR by language
 */
export function getCuratedAsrServiceId(language = 'hi') {
  const lang = (language || 'hi').toLowerCase();
  if (lang === 'hi') {
    return 'ai4bharat/conformer-hi-gpu--t4';
  }
  if (DRAVIDIAN_LANGS.includes(lang)) {
    return 'ai4bharat/conformer-multilingual-dravidian-gpu--t4';
  }
  if (lang === 'en') {
    return 'ai4bharat/whisper-medium-en--gpu--t4';
  }
  return 'ai4bharat/conformer-multilingual-indo_aryan-gpu--t4';
}

/**
 * Returns default curated AI4Bharat service ID for Translation
 */
export function getCuratedNmtServiceId() {
  return 'ai4bharat/indictrans-v2-all-gpu--t4';
}

/**
 * Returns whether Bhashini credentials are configured
 */
export function isBhashiniConfigured() {
  const inferenceKey = process.env.BHASHINI_INFERENCE_KEY;
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  return Boolean(inferenceKey || (userId && apiKey));
}

/**
 * Discovers pipeline inference endpoint and service IDs for specified language and tasks
 * With instant fallback to direct Dhruva inference using curated AI4Bharat service IDs
 */
export async function getBhashiniPipelineConfig(language = 'hi') {
  const userId = process.env.BHASHINI_USER_ID;
  const apiKey = process.env.BHASHINI_API_KEY;
  const inferenceKey = process.env.BHASHINI_INFERENCE_KEY;
  const pipelineId = process.env.BHASHINI_PIPELINE_ID || DEFAULT_PIPELINE_ID;

  if (!inferenceKey && (!userId || !apiKey)) {
    throw new Error('Bhashini credentials missing. Please set BHASHINI_INFERENCE_KEY or BHASHINI_USER_ID / BHASHINI_API_KEY in your .env file.');
  }

  const cacheKey = `${language}_${pipelineId}`;
  if (pipelineCache.has(cacheKey)) {
    const cached = pipelineCache.get(cacheKey);
    // Cache valid for 30 minutes
    if (Date.now() - cached.timestamp < 30 * 60 * 1000) {
      return cached.data;
    }
  }

  // Curated fallback config using direct Dhruva inference
  const directConfig = {
    inferenceEndpoint: DEFAULT_INFERENCE_URL,
    inferenceApiKey: {
      name: 'Authorization',
      value: inferenceKey || apiKey
    },
    serviceIds: {
      tts: getCuratedTtsServiceId(language),
      asr: getCuratedAsrServiceId(language),
      translation: getCuratedNmtServiceId()
    },
    language
  };

  // If ULCA auth credentials are provided, attempt dynamic discovery
  if (userId && apiKey && userId !== apiKey) {
    try {
      const payload = {
        pipelineTasks: [
          {
            taskType: 'asr',
            config: { language: { sourceLanguage: language } }
          },
          {
            taskType: 'tts',
            config: { language: { sourceLanguage: language } }
          },
          {
            taskType: 'translation',
            config: { language: { sourceLanguage: 'en', targetLanguage: language } }
          }
        ],
        pipelineRequestConfig: {
          pipelineId
        }
      };

      const response = await fetch(BHASHINI_AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'userID': userId,
          'ulcaApiKey': apiKey
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const inferenceEndpoint = data.pipelineInferenceAPIEndPoint?.callbackUrl || DEFAULT_INFERENCE_URL;
        const authKey = data.pipelineInferenceAPIEndPoint?.inferenceApiKey || {
          name: 'Authorization',
          value: inferenceKey || apiKey
        };

        const discoveredServiceIds = {};
        if (Array.isArray(data.pipelineResponseConfig)) {
          data.pipelineResponseConfig.forEach((cfg) => {
            const task = cfg.taskType;
            const firstConfig = cfg.config && cfg.config[0];
            if (firstConfig) {
              discoveredServiceIds[task] = firstConfig.serviceId;
            }
          });
        }

        const dynamicResult = {
          inferenceEndpoint,
          inferenceApiKey: authKey,
          serviceIds: {
            tts: discoveredServiceIds.tts || directConfig.serviceIds.tts,
            asr: discoveredServiceIds.asr || directConfig.serviceIds.asr,
            translation: discoveredServiceIds.translation || directConfig.serviceIds.translation
          },
          language
        };

        pipelineCache.set(cacheKey, { timestamp: Date.now(), data: dynamicResult });
        return dynamicResult;
      }
    } catch (discoveryErr) {
      console.warn('[Bhashini] Dynamic discovery failed, falling back to direct Dhruva inference:', discoveryErr.message);
    }
  }

  pipelineCache.set(cacheKey, { timestamp: Date.now(), data: directConfig });
  return directConfig;
}

/**
 * Text-to-Speech (TTS) via Bhashini Indic-TTS
 * Converts text into natural Indian audio (returns base64 WAV audio)
 */
export async function synthesizeSpeechBhashini({ text, language = 'hi', gender = 'female' }) {
  if (!text || !text.trim()) {
    throw new Error('Text is required for Bhashini speech synthesis.');
  }

  const { inferenceEndpoint, inferenceApiKey, serviceIds } = await getBhashiniPipelineConfig(language);
  const ttsServiceId = serviceIds.tts || getCuratedTtsServiceId(language);

  const payload = {
    pipelineTasks: [
      {
        taskType: 'tts',
        config: {
          language: { sourceLanguage: language },
          serviceId: ttsServiceId,
          gender: gender || 'female',
          samplingRate: 22050
        }
      }
    ],
    inputData: {
      input: [
        { source: text }
      ]
    }
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (inferenceApiKey?.name && inferenceApiKey?.value) {
    headers[inferenceApiKey.name] = inferenceApiKey.value;
  }

  const response = await fetch(inferenceEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Bhashini TTS Error]', errText);
    throw new Error(`Bhashini TTS failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const audioContent = data.pipelineResponse?.[0]?.audio?.[0]?.audioContent;

  if (!audioContent) {
    throw new Error('Bhashini TTS returned empty audio stream.');
  }

  return {
    success: true,
    audioBase64: audioContent,
    format: 'wav',
    language,
    text
  };
}

/**
 * Automatic Speech Recognition (ASR / STT) via Bhashini
 * Transcribes spoken Indian audio (WAV/MP3 base64) into text
 */
export async function transcribeSpeechBhashini({ audioBase64, language = 'hi', audioFormat = 'wav' }) {
  if (!audioBase64) {
    throw new Error('Base64 audio content is required for Bhashini ASR transcription.');
  }

  const cleanBase64 = audioBase64.replace(/^data:audio\/\w+;base64,/, '').trim();
  const { inferenceEndpoint, inferenceApiKey, serviceIds } = await getBhashiniPipelineConfig(language);
  const asrServiceId = serviceIds.asr || getCuratedAsrServiceId(language);

  const payload = {
    pipelineTasks: [
      {
        taskType: 'asr',
        config: {
          language: { sourceLanguage: language },
          serviceId: asrServiceId,
          audioFormat: audioFormat || 'wav',
          samplingRate: 16000
        }
      }
    ],
    inputData: {
      audio: [
        { audioContent: cleanBase64 }
      ]
    }
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (inferenceApiKey?.name && inferenceApiKey?.value) {
    headers[inferenceApiKey.name] = inferenceApiKey.value;
  }

  const response = await fetch(inferenceEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Bhashini ASR Error]', errText);
    throw new Error(`Bhashini ASR failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const transcript = data.pipelineResponse?.[0]?.output?.[0]?.source || '';

  return {
    success: true,
    transcript,
    language
  };
}

/**
 * Neural Machine Translation (NMT) via Bhashini
 * Translates between Indian regional languages (e.g. Hindi -> Telugu, Marathi -> English)
 */
export async function translateTextBhashini({ text, sourceLang = 'en', targetLang = 'hi' }) {
  if (!text || !text.trim()) {
    return { success: true, translatedText: text };
  }

  const { inferenceEndpoint, inferenceApiKey, serviceIds } = await getBhashiniPipelineConfig(targetLang);
  const nmtServiceId = serviceIds.translation || getCuratedNmtServiceId();

  const payload = {
    pipelineTasks: [
      {
        taskType: 'translation',
        config: {
          language: {
            sourceLanguage: sourceLang,
            targetLanguage: targetLang
          },
          serviceId: nmtServiceId
        }
      }
    ],
    inputData: {
      input: [
        { source: text }
      ]
    }
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (inferenceApiKey?.name && inferenceApiKey?.value) {
    headers[inferenceApiKey.name] = inferenceApiKey.value;
  }

  const response = await fetch(inferenceEndpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Bhashini NMT Error]', errText);
    throw new Error(`Bhashini Translation failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const translatedText = data.pipelineResponse?.[0]?.output?.[0]?.target || text;

  return {
    success: true,
    translatedText,
    sourceLang,
    targetLang
  };
}
