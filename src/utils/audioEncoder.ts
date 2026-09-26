/**
 * Cross-platform Audio Recording and WAV Conversion Utility
 * Supports mobile iOS Safari, Android Chrome, and desktop browsers.
 */

// Converts an AudioBuffer into a standard 16-bit PCM RIFF WAV Blob
export function audioBufferToWavBlob(audioBuffer: AudioBuffer, targetSampleRate = 16000): Blob {
  const numChannels = 1;
  const inputChannelData = audioBuffer.getChannelData(0);

  // Resample to targetSampleRate if necessary
  const ratio = audioBuffer.sampleRate / targetSampleRate;
  const targetLength = Math.max(1, Math.round(inputChannelData.length / ratio));
  const samples = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const srcIndex = i * ratio;
    const i0 = Math.floor(srcIndex);
    const i1 = Math.min(inputChannelData.length - 1, i0 + 1);
    const frac = srcIndex - i0;
    samples[i] = (1 - frac) * inputChannelData[i0] + frac * inputChannelData[i1];
  }

  const bitsPerSample = 16;
  const byteRate = (targetSampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings to DataView
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt Subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data Subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM Samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1.0, Math.min(1.0, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, Math.round(val), true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

// Convert any Blob (WebM, Opus, MP4, AAC, etc.) to a standardized 16kHz WAV Blob
export async function convertBlobToWav(blob: Blob): Promise<Blob> {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    return blob; // Fallback to raw blob if Web Audio API is unavailable
  }

  const audioCtx = new AudioContextClass();
  try {
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(() => {});
    }
    const arrayBuffer = await blob.arrayBuffer();
    // Slice a copy to prevent WebKit detached buffer bug
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const wavBlob = audioBufferToWavBlob(audioBuffer, 16000);
    return wavBlob;
  } catch (err) {
    console.warn('AudioContext decoding fallback, proceeding with raw blob:', err);
    return blob;
  } finally {
    try {
      await audioCtx.close();
    } catch {}
  }
}

// Convert a Blob into Base64 string
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Find best supported MediaRecorder MIME type for mobile Safari, Android Chrome, and desktop
export function getOptimalRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';

  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/wav',
  ];

  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return '';
}
