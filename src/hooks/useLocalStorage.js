import { useEffect, useState } from 'react';
import { loadJSON, saveJSON } from '../lib/storage.js';

/** Estado React sincronizado com localStorage. */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => loadJSON(key, initial));
  useEffect(() => {
    saveJSON(key, value);
  }, [key, value]);
  return [value, setValue];
}
