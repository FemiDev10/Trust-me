// Data-driven copy helpers (cast size can change without touching screens).
import { CAST } from '../engine/index.js';

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
export const CAST_COUNT = CAST.length;
/** "Four" (capitalised); `lower` for mid-sentence. */
export const castWord = WORDS[CAST_COUNT] ?? String(CAST_COUNT);
export const castWordLower = castWord.toLowerCase();
