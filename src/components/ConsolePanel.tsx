import React from 'react';
import { Terminal, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ConsoleLog } from '../types';

interface ConsolePanelProps {
  logs: ConsoleLog[];
  onClear: () => void;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, onClear }) => {
  const getLogIcon = (type: ConsoleLog['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warn':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      default:
        return <Terminal className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogColor = (type: ConsoleLog['type']) => {
    switch (type) {
      case 'error':
        return 'text-red-300';
      case 'warn':
        return 'text-yellow-300';
      case 'info':
        return 'text-blue-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">Console</h3>
          {logs.length > 0 && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              {logs.length}
            </span>
          )}
        </div>
        <button
          onClick={onClear}
          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
          title="Clear Console"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-48 overflow-y-auto p-2 space-y-1 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic text-center py-8">
            Console output will appear here...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 py-1">
              {getLogIcon(log.type)}
              <div className="flex-1">
                <span className={getLogColor(log.type)}>{log.message}</span>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsolePanel;