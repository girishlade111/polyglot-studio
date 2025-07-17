import { useState, useEffect } from 'react';

// A custom event to notify of changes to local storage
const customEventName = 'onLocalStorageChange';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // Dispatch a custom event for in-page synchronization
      window.dispatchEvent(new CustomEvent(customEventName, { detail: { key, value: valueToStore } }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    // For changes in the same window
    const handleCustomEvent = (event: Event) => {
      const { key: changedKey, value } = (event as CustomEvent).detail;
      if (changedKey === key) {
        setStoredValue(value);
      }
    };
    
    // For changes in other tabs/windows
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
            console.error(`Error parsing storage event for key "${key}":`, error);
        }
      }
    };

    window.addEventListener(customEventName, handleCustomEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(customEventName, handleCustomEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}