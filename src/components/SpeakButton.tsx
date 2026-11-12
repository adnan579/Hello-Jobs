import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { Language } from '../types';
import type { TFunction } from '../data/translations';
import { playJobAudio, stopJobAudio } from '../utils/audioNarrator';

interface Props {
  /** A stable id for this piece of speech, so two buttons do not cut each other off. */
  id: string;
  text: string;
  lang: Language;
  t: TFunction;
  className?: string;
}

/**
 * A speaker button that reads one short text aloud in the worker's language. It sits next to the
 * text it reads, so a person who reads slowly can listen instead.
 */
export const SpeakButton: React.FC<Props> = ({ id, text, lang, t, className = '' }) => {
  const [playing, setPlaying] = useState(false);

  // Stop speaking when the button goes away or the text changes under it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: stop when the text or language changes
  useEffect(() => {
    return () => {
      stopJobAudio();
    };
  }, [text, lang]);

  const toggle = () => {
    if (playing) {
      stopJobAudio();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    playJobAudio(id, text, lang, () => setPlaying(true), () => setPlaying(false), () => setPlaying(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      className={`btn btn-secondary shrink-0 ${className}`}
    >
      {playing ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
      <span>{playing ? t('whStopListen') : t('whListen')}</span>
    </button>
  );
};
