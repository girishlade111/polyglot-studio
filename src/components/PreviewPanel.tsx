import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, ExternalLink } from 'lucide-react';
import { ConsoleLog } from '../types';

interface PreviewPanelProps {
  html: string;
  css: string;
  javascript: string;
  onConsoleLog: (log: ConsoleLog) => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  html, 
  css, 
  javascript, 
  onConsoleLog 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePreviewContent = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <style>
        body { 
            margin: 0; 
            padding: 16px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: white;
            color: #333;
        }
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        // Intercept console methods
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        
        const sendToParent = (type, message) => {
            window.parent.postMessage({
                type: 'console',
                level: type,
                message: message,
                timestamp: new Date().toISOString()
            }, '*');
        };
        
        console.log = (...args) => {
            originalConsole.log(...args);
            sendToParent('log', args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
        };
        
        console.error = (...args) => {
            originalConsole.error(...args);
            sendToParent('error', args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
        };
        
        console.warn = (...args) => {
            originalConsole.warn(...args);
            sendToParent('warn', args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
        };
        
        console.info = (...args) => {
            originalConsole.info(...args);
            sendToParent('info', args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '));
        };
        
        // Catch runtime errors
        window.addEventListener('error', (e) => {
            sendToParent('error', \`\${e.message} at \${e.filename}:\${e.lineno}\`);
        });
        
        try {
            ${javascript}
        } catch (error) {
            sendToParent('error', error.message);
        }
    </script>
</body>
</html>`;
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      const content = generatePreviewContent();
      iframeRef.current.srcdoc = content;
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  useEffect(() => {
    refreshPreview();
  }, [html, css, javascript]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        const log: ConsoleLog = {
          id: Date.now().toString(),
          type: event.data.level,
          message: event.data.message,
          timestamp: event.data.timestamp,
        };
        onConsoleLog(log);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConsoleLog]);

  const openInNewTab = () => {
    const content = generatePreviewContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Live Preview</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshPreview}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openInNewTab}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="relative h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-10">
            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          className="w-full h-full bg-white"
          title="Code Preview"
          sandbox="allow-scripts allow-same-origin"
          srcdoc={generatePreviewContent()}
        />
      </div>
    </div>
  );
};

export default PreviewPanel;