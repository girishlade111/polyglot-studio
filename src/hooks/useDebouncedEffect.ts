import { useEffect, useRef } from 'react';

type Dependencies = any[];

export const useDebouncedEffect = (
  callback: () => void,
  delay: number,
  deps: Dependencies
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [callback, delay, ...deps]);
}; 