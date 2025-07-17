import React, { useState, useEffect } from 'react';
import { Save, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AutoSaveIndicatorProps {
  lastSaveTime?: string;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaveTime,
  isEnabled,
  onToggle,
}) => {
  const [showSaved, setShowSaved] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update time ago display
  useEffect(() => {
    if (!lastSaveTime) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const saveTime = new Date(lastSaveTime);
      const diffMs = now.getTime() - saveTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);

      if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds}s ago`);
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes}m ago`);
      } else {
        setTimeAgo(saveTime.toLocaleTimeString());
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastSaveTime]);

  // Listen for autosave events
  useEffect(() => {
    const handleAutoSave = () => {
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    };

    window.addEventListener('autosave', handleAutoSave);
    return () => window.removeEventListener('autosave', handleAutoSave);
  }, []);

  const formatLastSaveTime = () => {
    if (!lastSaveTime) return 'Never';
    return timeAgo;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onToggle(!isEnabled)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
          isEnabled
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
        }`}
        title={`Auto-save is ${isEnabled ? 'enabled' : 'disabled'}`}
      >
        {showSaved ? (
          <CheckCircle className="w-4 h-4" />
        ) : isEnabled ? (
          <Save className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {showSaved ? 'Saved!' : isEnabled ? 'Auto-save' : 'Manual'}
        </span>
      </button>

      {isEnabled && lastSaveTime && (
        <div className="flex items-center gap-1 text-gray-400">
          <Clock className="w-3 h-3" />
          <span className="text-xs">
            {showSaved ? 'Just now' : formatLastSaveTime()}
          </span>
        </div>
      )}
    </div>
  );
};

export default AutoSaveIndicator;