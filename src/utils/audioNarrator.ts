import { Language } from '../types';

let currentUtterance: SpeechSynthesisUtterance | null = null;

export interface AudioPlaybackStatus {
  isPlaying: boolean;
  activeJobId: string | null;
}

export function playJobAudio(
  jobId: string,
  text: string,
  language: Language,
  onStart: () => void,
  onEnd: () => void,
  onError?: () => void
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis not supported on this browser.');
    onError?.();
    return false;
  }

  // Cancel any ongoing utterance
  stopJobAudio();

  const utterance = new SpeechSynthesisUtterance(text);
  currentUtterance = utterance;

  // Language mapping for standard Web Speech voices
  switch (language) {
    case 'hi':
      utterance.lang = 'hi-IN';
      break;
    case 'mr':
      utterance.lang = 'mr-IN';
      break;
    case 'ta':
      utterance.lang = 'ta-IN';
      break;
    case 'en':
    default:
      utterance.lang = 'en-IN';
      break;
  }

  utterance.rate = 0.95; // slightly deliberate for shop-floor clarity
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    onStart();
  };

  utterance.onend = () => {
    currentUtterance = null;
    onEnd();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error or interrupted:', e);
    currentUtterance = null;
    onEnd();
    onError?.();
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopJobAudio(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}
