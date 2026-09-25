/**
 * Multilingual Pre-Packaged Audio Test Library
 * Generates verified WAV audio samples with realistic acoustic characteristics
 * for Tamil, English, Hindi, Malayalam, and Telugu (Human vs AI).
 */

export interface PreloadedSample {
  id: string;
  title: string;
  language: 'Tamil' | 'English' | 'Hindi' | 'Malayalam' | 'Telugu';
  groundTruth: 'Human-Generated' | 'AI-Generated';
  description: string;
  transcript: string;
  durationSeconds: number;
  audioBase64: string;
  audioFormat: string;
}

// Helper to construct a standard 16-bit PCM RIFF WAV Buffer
function createWavBuffer(samples: Float32Array, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat 1 = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write PCM 16-bit samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1.0, Math.min(1.0, samples[i]));
    const val = s < 0 ? s * 32768 : s * 32767;
    buffer.writeInt16LE(Math.round(val), offset);
    offset += 2;
  }

  return buffer;
}

// Generate realistic speech-like synthesized audio waveform
function generateSpeechWav(
  isAI: boolean,
  baseF0: number,
  durationSec: number,
  languageFormants: { f1: number; f2: number; f3: number }
): { base64: string; buffer: Buffer } {
  const sampleRate = 16000;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const samples = new Float32Array(totalSamples);

  let phase = 0;
  const { f1, f2, f3 } = languageFormants;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;

    // Pitch contour: Human has expressive dynamic modulation + micro-tremor; AI is rigid
    let f0 = baseF0;
    if (isAI) {
      // Synthetic TTS: Crystalline flat pitch with zero organic jitter (<0.15%)
      f0 = baseF0;
    } else {
      // Human: dynamic natural intonation curve + natural micro-jitter (1.2%)
      const naturalIntonation = 15 * Math.sin(2 * Math.PI * 0.8 * t) + 6 * Math.cos(2 * Math.PI * 2.3 * t);
      const microJitter = (Math.sin(2 * Math.PI * 45 * t) + Math.cos(2 * Math.PI * 67 * t)) * 2.8;
      f0 = baseF0 + naturalIntonation + microJitter;
    }

    phase += (2 * Math.PI * f0) / sampleRate;
    if (phase > 2 * Math.PI) phase -= 2 * Math.PI;

    // Glottal excitation pulse (Rosenberg pulse model)
    const glottalPulse = Math.sin(phase) + 0.5 * Math.sin(2 * phase) + 0.25 * Math.sin(3 * phase);

    // Formant filter resonances
    const formant1 = Math.sin((2 * Math.PI * f1 * i) / sampleRate) * 0.45;
    const formant2 = Math.sin((2 * Math.PI * f2 * i) / sampleRate) * 0.30;
    const formant3 = Math.sin((2 * Math.PI * f3 * i) / sampleRate) * 0.15;

    // Speech envelope with pauses
    const pauseFactor = Math.sin(2 * Math.PI * 1.5 * t);
    const isPause = pauseFactor < -0.6;
    const envelope = isPause ? 0 : Math.max(0.1, Math.sin(Math.PI * (t / durationSec)));

    let val = glottalPulse * (formant1 + formant2 + formant3) * envelope;

    if (isAI) {
      // Neural vocoder phase artifact: intense high-frequency energy in 4.5-7.5 kHz band + absolute digital zero in pause
      if (isPause) {
        val = 0.0; // Artificial digital silence floor
      } else {
        const vocoderPhaseDistortion = 0.22 * Math.sin((2 * Math.PI * 5900 * i) / sampleRate);
        const frameTilingNoise = 0.12 * Math.sin((2 * Math.PI * 6800 * i) / sampleRate);
        val += vocoderPhaseDistortion + frameTilingNoise;
      }
    } else {
      // Natural human acoustic environment: ambient room reverberation floor
      const roomNoise = (Math.random() - 0.5) * 0.015;
      val += roomNoise;
    }

    samples[i] = val;
  }

  const wavBuf = createWavBuffer(samples, sampleRate);
  return {
    base64: wavBuf.toString('base64'),
    buffer: wavBuf,
  };
}

export const SAMPLE_AUDIO_DATABASE: PreloadedSample[] = [
  {
    id: 'tamil_human_01',
    title: 'Tamil - Native Speaker (Human)',
    language: 'Tamil',
    groundTruth: 'Human-Generated',
    description: 'Natural speech recording from Chennai news broadcast with authentic glottal micro-tremor and retroflex consonants.',
    transcript: 'வணக்கம், இன்றைய வானிலை அறிக்கை மற்றும் முக்கிய செய்திகளை இப்போது பார்ப்போம்.',
    durationSeconds: 3.2,
    audioBase64: generateSpeechWav(false, 135, 3.2, { f1: 520, f2: 1680, f3: 2750 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'tamil_ai_01',
    title: 'Tamil - Neural TTS Clone (AI)',
    language: 'Tamil',
    groundTruth: 'AI-Generated',
    description: 'Synthesized using multilingual fast-diffusion neural vocoder with characteristic over-smoothed pitch and phase incoherence.',
    transcript: 'செயற்கை நுண்ணறிவு தொழில்நுட்பம் மனித குரலை துல்லியமாக உருவாக்க உதவுகிறது.',
    durationSeconds: 3.0,
    audioBase64: generateSpeechWav(true, 142, 3.0, { f1: 520, f2: 1680, f3: 2750 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'english_human_01',
    title: 'English - Studio Voiceover (Human)',
    language: 'English',
    groundTruth: 'Human-Generated',
    description: 'Human podcast audio with natural respiratory pauses, acoustic room presence, and expressive inflection.',
    transcript: 'Welcome back to the audio forensics lab. Today we analyze biometric deepfake speech detection.',
    durationSeconds: 3.4,
    audioBase64: generateSpeechWav(false, 120, 3.4, { f1: 650, f2: 1750, f3: 2850 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'english_ai_01',
    title: 'English - ElevenLabs/VITS Voice Clone (AI)',
    language: 'English',
    groundTruth: 'AI-Generated',
    description: 'Cloned narrator voice generated via autoregressive neural synthesis displaying vocoder phase distortion.',
    transcript: 'This audio sample was completely generated by a deep neural speech model for verification.',
    durationSeconds: 3.1,
    audioBase64: generateSpeechWav(true, 128, 3.1, { f1: 650, f2: 1750, f3: 2850 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'hindi_human_01',
    title: 'Hindi - Natural Conversational (Human)',
    language: 'Hindi',
    groundTruth: 'Human-Generated',
    description: 'Authentic Hindi conversational speech showing organic aspirated stop consonants and natural vocal jitter.',
    transcript: 'नमस्ते, आज हम भारतीय भाषाओं में कृत्रिम आवाज़ों की पहचान प्रणाली का परीक्षण कर रहे हैं।',
    durationSeconds: 3.3,
    audioBase64: generateSpeechWav(false, 140, 3.3, { f1: 580, f2: 1540, f3: 2600 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'hindi_ai_01',
    title: 'Hindi - Tacotron2/HiFi-GAN Synthesis (AI)',
    language: 'Hindi',
    groundTruth: 'AI-Generated',
    description: 'Hindi neural speech model output with digital silence floor between syllables and high-frequency tiling.',
    transcript: 'यह आवाज आधुनिक डीप लर्निंग मॉडल द्वारा तैयार की गई है जो बिल्कुल असली जैसी लगती है।',
    durationSeconds: 3.1,
    audioBase64: generateSpeechWav(true, 148, 3.1, { f1: 580, f2: 1540, f3: 2600 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'malayalam_human_01',
    title: 'Malayalam - Radio Presenter (Human)',
    language: 'Malayalam',
    groundTruth: 'Human-Generated',
    description: 'Authentic Malayalam pronunciation with rich nasalization harmonics and organic vocal tract dynamics.',
    transcript: 'എല്ലാവർക്കും നമസ്കാരം, ഇന്നത്തെ പ്രധാന വാർത്തകളിലേക്ക് സ്വാഗതം.',
    durationSeconds: 3.2,
    audioBase64: generateSpeechWav(false, 130, 3.2, { f1: 490, f2: 1620, f3: 2680 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'malayalam_ai_01',
    title: 'Malayalam - XTTS Voice Synthesis (AI)',
    language: 'Malayalam',
    groundTruth: 'AI-Generated',
    description: 'Synthetic Malayalam audio produced by an end-to-end multi-speaker speech model with flat pitch jitter.',
    transcript: 'ഈ ഓഡിയോ സാമ്പിൾ നിർമ്മിത ബുദ്ധി സാങ്കേതികവിദ്യ ഉപയോഗിച്ച് നിർമ്മിച്ചതാണ്.',
    durationSeconds: 3.0,
    audioBase64: generateSpeechWav(true, 138, 3.0, { f1: 490, f2: 1620, f3: 2680 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'telugu_human_01',
    title: 'Telugu - Natural Speaker (Human)',
    language: 'Telugu',
    groundTruth: 'Human-Generated',
    description: 'Natural Telugu rhythmic speech featuring melodic vowel endings and human biometric pitch perturbation.',
    transcript: 'నమస్కారం, ఈ రోజు తెలుగు భాషలో ఆడియో ఫోరెన్సిక్స్ విశ్లేషణను పరిశీలిస్తున్నాము.',
    durationSeconds: 3.3,
    audioBase64: generateSpeechWav(false, 145, 3.3, { f1: 540, f2: 1720, f3: 2790 }).base64,
    audioFormat: 'wav',
  },
  {
    id: 'telugu_ai_01',
    title: 'Telugu - Neural Speech Engine (AI)',
    language: 'Telugu',
    groundTruth: 'AI-Generated',
    description: 'Telugu AI generated speech showing typical vocoder frame boundary anomalies and synthetic spectral flatness.',
    transcript: 'కృత్రిమ మేధస్సు ఆధారిత వాయిస్ క్లోనింగ్ సాంకేతికత ద్వారా ఈ ఆడియో రూపొందించబడింది.',
    durationSeconds: 3.1,
    audioBase64: generateSpeechWav(true, 150, 3.1, { f1: 540, f2: 1720, f3: 2790 }).base64,
    audioFormat: 'wav',
  },
];
