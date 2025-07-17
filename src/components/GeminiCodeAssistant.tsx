import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Copy, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Code, 
  X,
  Maximize2,
  Minimize2,
  Settings,
  Zap
} from 'lucide-react';
import { GeminiChatMessage, GeminiCodeBlock, CodeModificationRequest, EditorLanguage } from '../types';
import { geminiCodeAssistant } from '../services/geminiCodeAssistant';

interface GeminiCodeAssistantProps {
  currentCode: {
    html: string;
    css: string;
    javascript: string;
  };
  onCodeUpdate: (code: { html: string; css: string; javascript: string }) => void;
  onClose?: () => void;
}

const GeminiCodeAssistant: React.FC<GeminiCodeAssistantProps> = ({
  currentCode,
  onCodeUpdate,
  onClose
}) => {
  const [messages, setMessages] = useState<GeminiChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  
  // Modification workflow state
  const [modificationState, setModificationState] = useState<{
    isActive: boolean;
    step: 'lineNumber' | 'action' | 'confirmation';
    language: EditorLanguage;
    lineNumber?: number;
    action?: 'insert' | 'replace';
    originalCode?: string;
    newCode?: string;
  }>({ isActive: false, step: 'lineNumber', language: 'html' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKeyConfigured(geminiCodeAssistant.isConfigured());
    
    // Add welcome message
    if (geminiCodeAssistant.isConfigured()) {
      setMessages([{
        id: 'welcome',
        type: 'assistant',
        content: `🤖 **Gemini Code Assistant Ready**

I'm your specialized code assistant for HTML, CSS, and JavaScript. I can help you with:

• **Code Generation**: "Create a responsive navbar" or "Generate CSS grid layout"
• **Code Modifications**: "Modify line 15" or "Insert code at line 8"  
• **Debugging**: "Fix my JavaScript errors" or "Why isn't my CSS working?"
• **Optimization**: "Optimize my code for performance"

**Quick Commands:**
- "Give me HTML code for [description]"
- "Generate CSS for [description]"  
- "Create JavaScript for [description]"
- "Modify line [number]" (starts modification workflow)

How can I help you today?`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: GeminiChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let response: GeminiChatMessage;

      // Handle modification workflow
      if (modificationState.isActive) {
        const result = await geminiCodeAssistant.processModificationInput(
          inputMessage,
          modificationState.step,
          {
            originalCode: modificationState.originalCode || '',
            language: modificationState.language,
            lineNumber: modificationState.lineNumber,
            action: modificationState.action,
            newCode: modificationState.newCode
          }
        );

        if (result.error) {
          response = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `❌ **Error**: ${result.error}`,
            timestamp: new Date().toISOString()
          };
        } else if (result.modification) {
          // Apply the modification
          const modifiedCodeString = geminiCodeAssistant.applyCodeModification(
            modificationState.originalCode!,
            result.modification
          );
          
          const newCode = { ...currentCode };
          newCode[modificationState.language] = modifiedCodeString;
          onCodeUpdate(newCode);
          
          response = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `✅ **Code Modified Successfully**\n\nApplied ${result.modification.action} at line ${result.modification.lineNumber} in ${modificationState.language.toUpperCase()}.`,
            timestamp: new Date().toISOString()
          };
          
          setModificationState({ isActive: false, step: 'lineNumber', language: 'html' });
        } else {
          response = {
            id: Date.now().toString(),
            type: 'assistant',
            content: result.prompt || 'Please continue...',
            timestamp: new Date().toISOString()
          };
          
          // Update modification state for next step
          if (result.awaitingInput) {
            setModificationState(prev => ({ 
              ...prev, 
              step: result.awaitingInput!,
              ...(modificationState.step === 'lineNumber' && { lineNumber: parseInt(inputMessage) }),
              ...(modificationState.step === 'action' && { 
                action: inputMessage === '1' || inputMessage.toLowerCase() === 'insert' ? 'insert' : 'replace' 
              })
            }));
          }
        }
      } else {
        // Check if this is a modification request
        if (inputMessage.toLowerCase().includes('modify line') || inputMessage.toLowerCase().includes('change line')) {
          const lineMatch = inputMessage.match(/line\s+(\d+)/i);
          if (lineMatch) {
            const lineNumber = parseInt(lineMatch[1]);
            // Detect which language to modify based on context or ask user
            const language = detectLanguageFromContext(inputMessage) || 'html';
            const code = currentCode[language];
            
            const validation = geminiCodeAssistant.validateLineNumber(code, lineNumber);
            if (validation.isValid) {
              setModificationState({
                isActive: true,
                step: 'action',
                language,
                lineNumber,
                originalCode: code
              });
              
              response = {
                id: Date.now().toString(),
                type: 'assistant',
                content: `🔧 **Code Modification Mode**\n\nModifying ${language.toUpperCase()} at line ${lineNumber}\n\nSelect action: [1] Insert [2] Replace`,
                timestamp: new Date().toISOString()
              };
            } else {
              response = {
                id: Date.now().toString(),
                type: 'assistant',
                content: `❌ **Error**: ${validation.error}`,
                timestamp: new Date().toISOString()
              };
            }
          } else {
            response = {
              id: Date.now().toString(),
              type: 'assistant',
              content: `🔧 **Code Modification**\n\nPlease specify the line number. Example: "modify line 15"`,
              timestamp: new Date().toISOString()
            };
          }
        } else if (isCodeGenerationRequest(inputMessage)) {
          // Handle code generation
          const detectedType = detectLanguageFromRequest(inputMessage);
          response = await geminiCodeAssistant.generateCode(inputMessage, detectedType);
        } else {
          // Handle general chat
          response = await geminiCodeAssistant.sendMessage({
            message: inputMessage,
            currentCode,
            conversationHistory: messages.slice(-5) // Last 5 messages for context
          });
        }
      }

      setMessages(prev => [...prev, response]);
    } catch (error) {
      const errorMessage: GeminiChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ **Error**: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInsertCode = (codeBlock: GeminiCodeBlock) => {
    const newCode = { ...currentCode };
    newCode[codeBlock.language] = codeBlock.code;
    onCodeUpdate(newCode);
    
    // Add confirmation message
    const confirmMessage: GeminiChatMessage = {
      id: Date.now().toString(),
      type: 'assistant',
      content: `✅ **Code Inserted**\n\n${codeBlock.language.toUpperCase()} code has been inserted into the editor.`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, confirmMessage]);
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const detectLanguageFromContext = (message: string): EditorLanguage | null => {
    const lower = message.toLowerCase();
    if (lower.includes('html')) return 'html';
    if (lower.includes('css')) return 'css';
    if (lower.includes('javascript') || lower.includes('js')) return 'javascript';
    return null;
  };

  const detectLanguageFromRequest = (message: string): EditorLanguage => {
    const lower = message.toLowerCase();
    if (lower.includes('html') || lower.includes('markup') || lower.includes('element')) return 'html';
    if (lower.includes('css') || lower.includes('style') || lower.includes('design')) return 'css';
    if (lower.includes('javascript') || lower.includes('js') || lower.includes('function')) return 'javascript';
    return 'html'; // Default
  };

  const isCodeGenerationRequest = (message: string): boolean => {
    const lower = message.toLowerCase();
    return lower.includes('give me') || lower.includes('generate') || lower.includes('create') || 
           lower.includes('make') || lower.includes('build') || lower.includes('write');
  };

  const renderCodeBlock = (codeBlock: GeminiCodeBlock) => (
    <div key={codeBlock.id} className="mt-4 bg-gray-900 rounded-lg border border-gray-600 overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-600">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-gray-300">
            {codeBlock.title || `${codeBlock.language.toUpperCase()} Code`}
          </span>
          {codeBlock.validated !== undefined && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
              codeBlock.validated 
                ? 'bg-green-900 text-green-300' 
                : 'bg-red-900 text-red-300'
            }`}>
              {codeBlock.validated ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Validated
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Syntax Error
                </>
              )}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleCopyCode(codeBlock.code)}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Copy Code"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInsertCode(codeBlock)}
            className="p-1.5 hover:bg-blue-600 rounded text-gray-400 hover:text-white transition-colors"
            title="Insert into Editor"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {codeBlock.syntaxError && (
          <div className="mb-3 p-2 bg-red-900 border border-red-700 rounded text-red-300 text-sm">
            <strong>Syntax Error:</strong> {codeBlock.syntaxError}
          </div>
        )}
        
        <pre className="text-sm text-gray-300 overflow-x-auto">
          <code className={`language-${codeBlock.language}`}>
            {codeBlock.lineNumbers 
              ? geminiCodeAssistant.getCodeWithLineNumbers(codeBlock.code)
              : codeBlock.code
            }
          </code>
        </pre>
      </div>
    </div>
  );

  if (!apiKeyConfigured) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center">
        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Gemini API Key Required</h3>
        <p className="text-gray-400 mb-4">
          To use the Gemini Code Assistant, please add your API key to the environment variables.
        </p>
        <div className="bg-gray-800 rounded-lg p-4 text-left">
          <p className="text-sm text-gray-300 mb-2">Add to your .env file:</p>
          <code className="text-green-400 text-sm">VITE_GEMINI_API_KEY=your_api_key_here</code>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 border border-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : 'relative h-96'
    }`}>
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-300">Gemini Code Assistant</h3>
          {modificationState.isActive && (
            <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">
              Modification Mode
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className={`overflow-y-auto p-4 space-y-4 ${
        isExpanded ? 'h-[calc(100vh-200px)]' : 'h-64'
      }`}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-200 border border-gray-600'
              }`}
            >
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.codeBlocks?.map(renderCodeBlock)}
              </div>
              
              <div className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-gray-300">Generating response...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              modificationState.isActive 
                ? `${modificationState.step === 'lineNumber' ? 'Enter line number...' : 
                     modificationState.step === 'action' ? 'Select action (1 or 2)...' : 
                     'Confirm changes (Y/N)...'}`
                : "Ask me anything about your code..."
            }
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          💡 Try: "Create a responsive navbar", "Generate CSS grid", "Modify line 15", "Fix my JavaScript"
        </div>
      </div>
    </div>
  );
};

export default GeminiCodeAssistant;