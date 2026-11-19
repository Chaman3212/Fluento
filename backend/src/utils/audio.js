// Detect real audio container from magic bytes (never trust extension / client MIME).
export function sniffAudio(buf) {
  if (!buf || buf.length < 12) return null;
  const ascii = (s, e) => buf.toString('latin1', s, e);
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) return { mime: 'audio/webm', ext: 'webm' };
  if (ascii(0, 4) === 'OggS') return { mime: 'audio/ogg', ext: 'ogg' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return { mime: 'audio/wav', ext: 'wav' };
  if (ascii(4, 8) === 'ftyp') return { mime: 'audio/mp4', ext: 'm4a' };
  if (ascii(0, 3) === 'ID3') return { mime: 'audio/mpeg', ext: 'mp3' };
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return { mime: 'audio/mpeg', ext: 'mp3' };
  return null;
}

const FILLERS = /\b(um+|uh+|erm|er|ah+|hmm+|you know|i mean|like)\b/gi;

// Measured delivery metrics from word timestamps (Whisper verbose_json). Pure function.
export function computeAudioMetrics({ words = [], text = '', duration = 0 }) {
  const wordCount = words.length || (text.trim() ? text.trim().split(/\s+/).length : 0);
  const minutes = duration > 0 ? duration / 60 : 0;
  let pauseCount = 0; let longestPause = 0; let totalPause = 0;
  for (let i = 1; i < words.length; i++) {
    const gap = (words[i].start ?? 0) - (words[i - 1].end ?? 0);
    if (gap >= 0.7) { pauseCount++; totalPause += gap; longestPause = Math.max(longestPause, gap); }
  }
  const fillerMatches = text.match(FILLERS) || [];
  return {
    durationSeconds: Math.round(duration * 10) / 10,
    wordCount,
    wordsPerMinute: minutes > 0 ? Math.round(wordCount / minutes) : null,
    pauseCount,
    longestPauseSeconds: Math.round(longestPause * 10) / 10,
    totalPauseSeconds: Math.round(totalPause * 10) / 10,
    fillerWordCount: fillerMatches.length,
    hasWordTimestamps: words.length > 0,
  };
}
