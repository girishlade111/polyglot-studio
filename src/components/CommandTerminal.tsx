import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send } from 'lucide-react';

interface CommandTerminalProps {
  onCommand: (command: string) => void;
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({ onCommand }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      setHistory(prev => [...prev, command]);
      setHistoryIndex(-1);
      onCommand(command.trim());
      setCommand('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(history[newIndex]);
        }
      }
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
        <Terminal className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">Command Terminal</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg border border-gray-600 px-3 py-2">
          <span className="text-green-400 font-mono text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command (run, clear, download, theme dark|light, ai toggle)"
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 outline-none font-mono text-sm"
          />
          <button
            type="submit"
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Execute Command"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Commands: <span className="text-blue-400">run</span>, <span className="text-blue-400">clear</span>, <span className="text-blue-400">download</span>, <span className="text-blue-400">theme dark|light</span>, <span className="text-purple-400">ai toggle</span>
        </div>
      </form>
    </div>
  );
};

export default CommandTerminal;