/** Convert decoded microphone audio into 16-bit mono PCM WAV at 16 kHz. */
export function audioBufferToWav(buffer: AudioBuffer, targetRate = 16_000): Blob {
  const source = buffer.getChannelData(0);
  const ratio = buffer.sampleRate / targetRate;
  const length = Math.max(1, Math.floor(source.length / ratio));
  const samples = new Int16Array(length);

  for (let index = 0; index < length; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, source.length - 1);
    const fraction = position - left;
    const value = source[left] * (1 - fraction) + source[right] * fraction;
    samples[index] = Math.max(-1, Math.min(1, value)) * 0x7fff;
  }

  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const writeString = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) {
      view.setUint8(offset + index, text.charCodeAt(index));
    }
  };

  const dataBytes = samples.length * 2;
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataBytes, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataBytes, true);

  return new Blob([header, samples.buffer], { type: "audio/wav" });
}

/** Decode any browser-supported recording (webm/opus, mp4, wav) to PCM. */
export async function recordingToWav(blob: Blob): Promise<Blob> {
  const bytes = await blob.arrayBuffer();
  const AudioContextClass =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(bytes.slice(0));
    return audioBufferToWav(decoded);
  } finally {
    void context.close();
  }
}
