import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, Send, Maximize2, Minimize2, Copy, Download, Settings } from 'lucide-react';
import { TerminalOutput, TerminalState } from '../types';
import { TerminalCommandProcessor } from '../utils/terminalCommands';

interface EnhancedTerminalProps {
  onCommand?: (command: string) => void;
  onCodeChange: (html: string, css: string, js: string) => void;
  onThemeChange: (theme: 'dark' | 'light') => void;
  onSnippetSave: (name: string, html: string, css: string, js: string) => void;
  onSnippetLoad: (name: string) => void;
  getCurrentCode: () => { html: string; css: string; javascript: string };
  getSnippets: () => any[];
}

const EnhancedTerminal: React.FC<EnhancedTerminalProps> = ({
  onCommand,
  onCodeChange,
  onThemeChange,
  onSnippetSave,
  onSnippetLoad,
  getCurrentCode,
  getSnippets,
}) => {
  const [command, setCommand] = useState('');
  const [outputs, setOutputs] = useState<TerminalOutput[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const commandProcessor = useRef<TerminalCommandProcessor>();

  // Initialize terminal state
  const [terminalState] = useState<TerminalState>(() => {
    const saved = localStorage.getItem('polyglot-terminal-state');
    const defaultState: TerminalState = {
      currentDirectory: '/',
      commandHistory: [],
      fileSystem: {
        'README.md': {
          name: 'README.md',
          type: 'file',
          content: '# Welcome to Polyglot Studio\n\nThis is your virtual file system!',
          size: 45,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        'projects': {
          name: 'projects',
          type: 'directory',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        }
      },
      npmPackages: JSON.parse(localStorage.getItem('polyglot-npm-packages') || '{}'),
      environment: {
        USER: 'polyglot-developer',
        HOME: '/',
        PATH: '/usr/local/bin:/usr/bin:/bin',
        SHELL: '/bin/polyglot-shell',
        TERM: 'polyglot-terminal',
        NODE_ENV: 'development',
      },
    };
    
    return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
  });

  // Initialize command processor
  useEffect(() => {
    commandProcessor.current = new TerminalCommandProcessor(terminalState, {
      onCodeChange,
      onThemeChange,
      onSnippetSave,
      onSnippetLoad,
      getCurrentCode,
      getSnippets,
    });

    // Add welcome message
    setOutputs([{
      id: 'welcome',
      type: 'info',
      message: `🚀 Welcome to Polyglot Studio Terminal v1.0.0
Type 'help' for available commands or start coding!
Current directory: ${terminalState.currentDirectory}`,
      timestamp: new Date().toISOString(),
    }]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [outputs, autoScroll]);

  // Save terminal state
  useEffect(() => {
    localStorage.setItem('polyglot-terminal-state', JSON.stringify(terminalState));
  }, [terminalState]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const trimmedCommand = command.trim();
    
    // Add command to history
    setCommandHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);
    
    // Add command to output
    const commandOutput: TerminalOutput = {
      id: Date.now().toString(),
      type: 'system',
      message: `$ ${trimmedCommand}`,
      timestamp: new Date().toISOString(),
    };

    // Process command
    if (trimmedCommand === 'clear') {
      setOutputs([]);
    } else {
      const results = commandProcessor.current?.processCommand(trimmedCommand) || [];
      setOutputs(prev => [...prev, commandOutput, ...results]);
    }

    // Update terminal state
    terminalState.commandHistory.push(trimmedCommand);
    
    // Clear input
    setCommand('');
    
    // Call external handler if provided
    onCommand?.(trimmedCommand);
  }, [command, onCommand]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCommand('');
        } else {
          setHistoryIndex(newIndex);
          setCommand(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple autocomplete for common commands
      const commonCommands = ['help', 'clear', 'run', 'download', 'npm install', 'npm list', 'ls', 'cd', 'pwd'];
      const matches = commonCommands.filter(cmd => cmd.startsWith(command));
      if (matches.length === 1) {
        setCommand(matches[0]);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  }, [command, commandHistory, historyIndex, handleSubmit]);

  const copyOutput = () => {
    const text = outputs.map(output => 
      output.type === 'system' ? output.message : `[${output.type.toUpperCase()}] ${output.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      setOutputs(prev => [...prev, {
        id: Date.now().toString(),
        type: 'success',
        message: '📋 Terminal output copied to clipboard',
        timestamp: new Date().toISOString(),
      }]);
    });
  };

  const exportLogs = () => {
    const logs = outputs.map(output => ({
      timestamp: output.timestamp,
      type: output.type,
      message: output.message,
    }));
    
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `terminal-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getOutputColor = (type: TerminalOutput['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'system': return 'text-purple-400';
      default: return 'text-gray-300';
    }
  };

  const getOutputIcon = (type: TerminalOutput['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'system': return '$';
      default: return '•';
    }
  };

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : 'relative'
    }`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-medium text-gray-300">Enhanced Terminal</h3>
          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">
            {terminalState.currentDirectory}
          </span>
          {outputs.length > 0 && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              {outputs.length} lines
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={copyOutput}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Copy Output"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={exportLogs}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Export Logs"
          >
            <Download className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 p-3">
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
            <button
              onClick={() => setOutputs([])}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setCommandHistory([])}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs transition-colors"
            >
              Clear History
            </button>
          </div>
        </div>
      )}

      {/* Output Area */}
      <div 
        ref={outputRef}
        className={`bg-black p-4 font-mono text-sm overflow-y-auto ${
          isExpanded ? 'h-[calc(100vh-200px)]' : 'h-64'
        }`}
      >
        {outputs.length === 0 ? (
          <div className="text-gray-500 italic">
            Terminal ready. Type 'help' for available commands...
          </div>
        ) : (
          <div className="space-y-1">
            {outputs.map((output) => (
              <div key={output.id} className="flex items-start gap-2">
                <span className="text-gray-500 text-xs mt-0.5 flex-shrink-0">
                  {new Date(output.timestamp).toLocaleTimeString()}
                </span>
                <span className="flex-shrink-0 mt-0.5">
                  {getOutputIcon(output.type)}
                </span>
                <pre className={`flex-1 whitespace-pre-wrap ${getOutputColor(output.type)}`}>
                  {output.message}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="bg-gray-800 border-t border-gray-700 p-3">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm flex-shrink-0">
            {terminalState.currentDirectory}$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command... (Tab for autocomplete, ↑↓ for history, Ctrl+Enter to execute)"
            className="flex-1 bg-transparent text-gray-200 placeholder-gray-500 outline-none font-mono text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors flex-shrink-0"
            title="Execute Command (Enter or Ctrl+Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-4">
          <span>💡 Quick commands:</span>
          <button 
            onClick={() => setCommand('help')}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            help
          </button>
          <button 
            onClick={() => setCommand('run')}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            run
          </button>
          <button 
            onClick={() => setCommand('npm list')}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            npm list
          </button>
          <button 
            onClick={() => setCommand('status')}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            status
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedTerminal;