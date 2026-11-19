import { describe, it, expect } from 'vitest';
import { sniffAudio, computeAudioMetrics } from '../src/utils/audio.js';

const pad = (b) => Buffer.concat([Buffer.from(b), Buffer.alloc(32)]);
describe('sniffAudio', () => {
  it('detects webm, ogg, wav, mp3, m4a', () => {
    expect(sniffAudio(pad([0x1a, 0x45, 0xdf, 0xa3])).ext).toBe('webm');
    expect(sniffAudio(pad(Buffer.from('OggS'))).ext).toBe('ogg');
    expect(sniffAudio(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE'), Buffer.alloc(8)])).ext).toBe('wav');
    expect(sniffAudio(pad(Buffer.from('ID3'))).ext).toBe('mp3');
    expect(sniffAudio(Buffer.concat([Buffer.alloc(4), Buffer.from('ftypM4A '), Buffer.alloc(8)])).ext).toBe('m4a');
  });
  it('rejects non-audio disguised content (e.g. an exe/html renamed to .mp3)', () => {
    expect(sniffAudio(Buffer.from('MZ\x90\x00 this is a windows executable'))).toBeNull();
    expect(sniffAudio(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull();
    expect(sniffAudio(Buffer.alloc(4))).toBeNull();
  });
});
describe('computeAudioMetrics', () => {
  it('measures pace, pauses and fillers from timestamps', () => {
    const words = [{ start: 0, end: 0.5 }, { start: 0.6, end: 1 }, { start: 2.2, end: 2.6 }, { start: 2.7, end: 3 }];
    const m = computeAudioMetrics({ words, text: 'Um I like went there you know', duration: 30 });
    expect(m.wordCount).toBe(4);
    expect(m.wordsPerMinute).toBe(8);
    expect(m.pauseCount).toBe(1);
    expect(m.longestPauseSeconds).toBe(1.2);
    expect(m.fillerWordCount).toBe(3);
  });
  it('handles no timestamps gracefully', () => {
    const m = computeAudioMetrics({ text: 'hello there friend', duration: 60 });
    expect(m.wordCount).toBe(3);
    expect(m.hasWordTimestamps).toBe(false);
  });
});
