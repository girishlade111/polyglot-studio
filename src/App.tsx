import React, { useState, useCallback, useEffect } from 'react';
import { Code2, Moon, Sun, Download, Play, RotateCcw, Sparkles, Bot } from 'lucide-react';
import NavigationBar from './components/NavigationBar';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';
import ConsolePanel from './components/ConsolePanel';
import EnhancedTerminal from './components/EnhancedTerminal';
import SnippetManager from './components/SnippetManager';
import AISuggestionPanel from './components/AISuggestionPanel';
import GeminiCodeAssistant from './components/GeminiCodeAssistant';
import AIEnhancementPopup from './components/AIEnhancementPopup';
import AutoSaveIndicator from './components/AutoSaveIndicator';
import CodeHistoryPage from './components/history/CodeHistoryPage';
import SaveStatusIndicator from './components/ui/SaveStatusIndicator';
import Footer from './components/ui/Footer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useCodeHistory } from './hooks/useCodeHistory';
import { useAutoSave } from './hooks/useAutoSave';
import { useFileUpload } from './hooks/useFileUpload';
import { useAuth } from './hooks/useAuth';
import { useCodeFiles } from './hooks/useCodeFiles';
import { useTheme } from './hooks/useTheme';
import { useProjects } from './hooks/useProjects';
import { downloadAsZip } from './utils/downloadUtils';
import { generateAISuggestions } from './utils/aiSuggestions';
import { CodeSnippet, ConsoleLog, AISuggestion, EditorLanguage, AICodeSuggestion, CodeFile } from './types';
import { geminiEnhancementService } from './services/geminiEnhancementService';
import { useDebouncedEffect } from './hooks/useDebouncedEffect';

const defaultHTML = `<div class="container">
  <h1>Welcome to GB Coder</h1>
  <p>Start coding in HTML, CSS, and JavaScript!</p>
  <button onclick="greet()">Click me!</button>
</div>`;

const defaultCSS = `.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-align: center;
}

h1 {
  color: #2563eb;
  margin-bottom: 1rem;
}

button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

button:hover {
  background: #2563eb;
}`;

const defaultJS = `function greet() {
  console.log('Hello from GB Coder!');
  alert('Welcome to your code playground!');
}

// Try logging different types
console.log('String log');
console.warn('This is a warning');
console.error('This is an error');
console.info('This is info');

// Example of an object
const user = { name: 'Developer', language: 'JavaScript' };
console.log('User object:', user);`;

function App() {
  const [html, setHtml] = useState(defaultHTML);
  const [css, setCss] = useState(defaultCSS);
  const [javascript, setJavascript] = useState(defaultJS);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const { theme, isDark, setTheme } = useTheme();
  const [snippets, setSnippets] = useLocalStorage<CodeSnippet[]>('gb-coder-snippets', []);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [autoSaveEnabled, setAutoSaveEnabled] = useLocalStorage('gb-coder-autosave-enabled', true);
  const [showGeminiAssistant, setShowGeminiAssistant] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [currentView, setCurrentView] = useState<'editor' | 'history'>('editor');
  
  // AI Enhancement states
  const [aiPopupOpen, setAiPopupOpen] = useState(false);
  const [aiPopupLanguage, setAiPopupLanguage] = useState<EditorLanguage>('html');
  const [aiPopupCode, setAiPopupCode] = useState('');
  const [aiLoadingStates, setAiLoadingStates] = useState<Record<EditorLanguage, boolean>>({
    html: false,
    css: false,
    javascript: false
  });

  // Authentication and database hooks
  const { user } = useAuth();
  const { saveCodeFile } = useCodeFiles();
  const { projects, createProject, getProject, updateProject, deleteProject } = useProjects(user?.id);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Code history for undo/redo functionality
  const {
    saveState: saveCodeHistory,
    undo: undoCodeHistory,
    redo: redoCodeHistory,
    canUndo,
    canRedo,
    currentState,
  } = useCodeHistory({ html, css, javascript });

  // Auto-save functionality with Supabase integration
  const autoSave = useAutoSave({
    html,
    css,
    javascript,
    interval: 30000, // 30 seconds
    enabled: autoSaveEnabled,
  });

  // File upload functionality
  const fileUpload = useFileUpload({
    onHtmlUpload: (content, filename) => {
      saveCodeHistory({ html, css, javascript }, `Loaded ${filename}`);
      setHtml(content);
      console.log(`Loaded HTML from ${filename}`);
    },
    onCssUpload: (content, filename) => {
      saveCodeHistory({ html, css, javascript }, `Loaded ${filename}`);
      setCss(content);
      console.log(`Loaded CSS from ${filename}`);
    },
    onJsUpload: (content, filename) => {
      saveCodeHistory({ html, css, javascript }, `Loaded ${filename}`);
      setJavascript(content);
      console.log(`Loaded JavaScript from ${filename}`);
    },
    onMultipleUpload: (files) => {
      saveCodeHistory({ html, css, javascript }, `Loaded ${files.length} files`);
      
      files.forEach(file => {
        switch (file.language) {
          case 'html':
            setHtml(file.content);
            break;
          case 'css':
            setCss(file.content);
            break;
          case 'javascript':
            setJavascript(file.content);
            break;
        }
      });
      
      console.log(`Loaded ${files.length} files:`, files.map(f => f.filename).join(', '));
    }
  });

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate AI suggestions when code changes
  useEffect(() => {
    const generateSuggestions = () => {
      const htmlSuggestions = generateAISuggestions(html, 'html');
      const cssSuggestions = generateAISuggestions(css, 'css');
      const jsSuggestions = generateAISuggestions(javascript, 'javascript');
      
      const allSuggestions = [...htmlSuggestions, ...cssSuggestions, ...jsSuggestions]
        .filter(suggestion => !dismissedSuggestions.has(suggestion.id));
      
      setAiSuggestions(allSuggestions);
    };

    // Debounce suggestion generation
    const timeoutId = setTimeout(generateSuggestions, 1000);
    return () => clearTimeout(timeoutId);
  }, [html, css, javascript, dismissedSuggestions]);

  useDebouncedEffect(
    () => {
      if (
        html !== currentState.html ||
        css !== currentState.css ||
        javascript !== currentState.javascript
      ) {
        saveCodeHistory({ html, css, javascript });
      }
    },
    500,
    [html, css, javascript]
  );

  const handleConsoleLog = useCallback((log: ConsoleLog) => {
    setConsoleLogs(prev => [...prev, log]);
  }, []);

  const clearConsoleLogs = () => {
    setConsoleLogs([]);
  };

  const handleCommand = (command: string) => {
    const [cmd, ...args] = command.toLowerCase().split(' ');
    
    switch (cmd) {
      case 'run':
        setConsoleLogs([]);
        console.log('Preview refreshed');
        break;
      case 'clear':
        clearConsoleLogs();
        console.log('Console cleared');
        break;
      case 'download':
        downloadAsZip(html, css, javascript);
        console.log('Code downloaded as ZIP');
        break;
      case 'theme':
        const newTheme = args[0] === 'light' ? 'light' : 'dark';
        console.log(`Theme changed to ${newTheme}`);
        break;
      case 'history':
        setCurrentView('history');
        console.log('Switched to code history view');
        break;
      case 'editor':
        setCurrentView('editor');
        console.log('Switched to editor view');
        break;
      case 'ai':
        if (args[0] === 'toggle') {
          setShowAISuggestions(!showAISuggestions);
          console.log(`AI suggestions ${!showAISuggestions ? 'enabled' : 'disabled'}`);
        } else if (args[0] === 'assistant') {
          setShowGeminiAssistant(!showGeminiAssistant);
          console.log(`Gemini assistant ${!showGeminiAssistant ? 'opened' : 'closed'}`);
        } else {
          console.log('AI commands: ai toggle, ai assistant');
        }
        break;
      case 'autosave':
        if (args[0] === 'toggle') {
          setAutoSaveEnabled(!autoSaveEnabled);
          console.log(`Auto-save ${!autoSaveEnabled ? 'enabled' : 'disabled'}`);
        } else {
          console.log('Auto-save commands: autosave toggle');
        }
        break;
      default:
        console.log(`Unknown command: ${cmd}`);
        console.log('Available commands: run, clear, download, theme [dark|light], history, editor, ai toggle/assistant, autosave toggle');
    }
  };

  const saveSnippet = (
    name: string, 
    htmlCode: string, 
    cssCode: string, 
    jsCode: string,
    description?: string,
    tags?: string[],
    category?: string
  ) => {
    const snippet: CodeSnippet = {
      id: Date.now().toString(),
      name,
      description,
      html: htmlCode,
      css: cssCode,
      javascript: jsCode,
      createdAt: new Date().toISOString(),
      tags,
      category,
    };
    setSnippets(prev => [...prev, snippet]);
  };

  const updateSnippet = (id: string, updates: Partial<CodeSnippet>) => {
    setSnippets(prev => prev.map(snippet => 
      snippet.id === id 
        ? { ...snippet, ...updates, updatedAt: new Date().toISOString() }
        : snippet
    ));
  };

  const loadSnippet = (snippet: CodeSnippet) => {
    saveCodeHistory({ html, css, javascript }, `Loaded snippet: ${snippet.name}`);
    
    setHtml(snippet.html);
    setCss(snippet.css);
    setJavascript(snippet.javascript);
    setConsoleLogs([]);
  };

  const loadCodeFile = (codeFile: CodeFile) => {
    saveCodeHistory({ html, css, javascript }, `Loaded file: ${codeFile.title}`);
    
    switch (codeFile.language) {
      case 'html':
        setHtml(codeFile.code_content);
        break;
      case 'css':
        setCss(codeFile.code_content);
        break;
      case 'javascript':
        setJavascript(codeFile.code_content);
        break;
    }
    
    setCurrentView('editor');
    setConsoleLogs([]);
  };

  const loadSnippetByName = (name: string) => {
    const snippet = snippets.find(s => s.name === name);
    if (snippet) {
      loadSnippet(snippet);
    }
  };

  const deleteSnippet = (id: string) => {
    setSnippets(prev => prev.filter(s => s.id !== id));
  };

  const resetCode = () => {
    saveCodeHistory({ html, css, javascript }, 'Reset to default');
    
    setHtml(defaultHTML);
    setCss(defaultCSS);
    setJavascript(defaultJS);
    setConsoleLogs([]);
    setDismissedSuggestions(new Set());
  };

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    console.log(`Applied suggestion: ${suggestion.title}`);
    setDismissedSuggestions(prev => new Set([...prev, suggestion.id]));
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  // AI Enhancement handlers
  const handleAISuggest = (language: EditorLanguage) => {
    let code = '';
    switch (language) {
      case 'html':
        code = html;
        break;
      case 'css':
        code = css;
        break;
      case 'javascript':
        code = javascript;
        break;
    }

    if (!code.trim()) {
      console.log(`No ${language} code to enhance`);
      return;
    }

    setAiLoadingStates(prev => ({ ...prev, [language]: true }));
    setAiPopupLanguage(language);
    setAiPopupCode(code);
    setAiPopupOpen(true);
  };

  const handleAIEnhancementApply = (enhancedCode: string) => {
    saveCodeHistory({ html, css, javascript }, `AI enhanced ${aiPopupLanguage}`);

    switch (aiPopupLanguage) {
      case 'html':
        setHtml(enhancedCode);
        break;
      case 'css':
        setCss(enhancedCode);
        break;
      case 'javascript':
        setJavascript(enhancedCode);
        break;
    }

    setAiLoadingStates(prev => ({ ...prev, [aiPopupLanguage]: false }));
  };

  const handleAIPartialApply = (suggestions: AICodeSuggestion[]) => {
    saveCodeHistory({ html, css, javascript }, `AI applied ${suggestions.length} suggestions`);

    const currentCode = getCurrentCodeForLanguage(aiPopupLanguage);
    const enhancedCode = geminiEnhancementService.applyPartialSuggestions(currentCode, suggestions);
    
    switch (aiPopupLanguage) {
      case 'html':
        setHtml(enhancedCode);
        break;
      case 'css':
        setCss(enhancedCode);
        break;
      case 'javascript':
        setJavascript(enhancedCode);
        break;
    }

    setAiLoadingStates(prev => ({ ...prev, [aiPopupLanguage]: false }));
  };

  const handleAIPopupClose = () => {
    setAiPopupOpen(false);
    setAiLoadingStates(prev => ({ ...prev, [aiPopupLanguage]: false }));
  };

  const handleUndo = () => {
    const prevState = undoCodeHistory();
    if (prevState) {
      setHtml(prevState.html);
      setCss(prevState.css);
      setJavascript(prevState.javascript);
    }
  };

  const handleRedo = () => {
    const nextState = redoCodeHistory();
    if (nextState) {
      setHtml(nextState.html);
      setCss(nextState.css);
      setJavascript(nextState.javascript);
    }
  };

  const getCurrentCode = () => ({ html, css, javascript });
  const getSnippets = () => snippets;

  const getCurrentCodeForLanguage = (language: EditorLanguage): string => {
    switch (language) {
      case 'html': return html;
      case 'css': return css;
      case 'javascript': return javascript;
      default: return '';
    }
  };

  const handleManualSave = async () => {
    const { error } = await autoSave.manualSave();
    if (error) {
      console.error('Save failed:', error);
    } else {
      console.log('Code saved successfully');
    }
  };

  // Render history view
  if (currentView === 'history') {
    return (
      <div className={`min-h-screen flex flex-col transition-colors ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <NavigationBar
          onAutoSaveToggle={() => setAutoSaveEnabled(!autoSaveEnabled)}
          onSnippetsToggle={() => setShowSnippets(!showSnippets)}
          onRun={() => handleCommand('run')}
          onReset={resetCode}
          onImport={fileUpload.uploadFiles}
          onExport={() => downloadAsZip(html, css, javascript)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onAIAssistantToggle={() => setShowGeminiAssistant(!showGeminiAssistant)}
          onAISuggestionsToggle={() => setShowAISuggestions(!showAISuggestions)}
          canUndo={canUndo}
          canRedo={canRedo}
          autoSaveEnabled={autoSaveEnabled}
          aiAssistantOpen={showGeminiAssistant}
          aiSuggestionsOpen={showAISuggestions}
        />
        <div className="flex-1">
          <CodeHistoryPage onLoadCode={loadCodeFile} />
        </div>
        <Footer />
      </div>
    );
  }

  // Render main editor view
  return (
    <div className={`min-h-screen flex flex-col transition-colors ${
      isDark ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Navigation Bar */}
      <NavigationBar
        onAutoSaveToggle={() => setAutoSaveEnabled(!autoSaveEnabled)}
        onSnippetsToggle={() => setShowSnippets(!showSnippets)}
        onRun={() => handleCommand('run')}
        onReset={resetCode}
        onImport={fileUpload.uploadFiles}
        onExport={() => downloadAsZip(html, css, javascript)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onAIAssistantToggle={() => setShowGeminiAssistant(!showGeminiAssistant)}
        onAISuggestionsToggle={() => setShowAISuggestions(!showAISuggestions)}
        canUndo={canUndo}
        canRedo={canRedo}
        autoSaveEnabled={autoSaveEnabled}
        aiAssistantOpen={showGeminiAssistant}
        aiSuggestionsOpen={showAISuggestions}
      />

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : showGeminiAssistant ? 'grid-cols-3' : 'grid-cols-2'} h-full`}>
          {/* Left Panel - Editors */}
          <div className="space-y-4">
            <EditorPanel
              title="HTML"
              language="html"
              value={html}
              onChange={setHtml}
              icon={<Code2 className="w-4 h-4 text-orange-400" />}
              onAISuggest={() => handleAISuggest('html')}
              isAILoading={aiLoadingStates.html}
            />
            
            <EditorPanel
              title="CSS"
              language="css"
              value={css}
              onChange={setCss}
              icon={<Code2 className="w-4 h-4 text-blue-400" />}
              onAISuggest={() => handleAISuggest('css')}
              isAILoading={aiLoadingStates.css}
            />
            
            <EditorPanel
              title="JavaScript"
              language="javascript"
              value={javascript}
              onChange={setJavascript}
              icon={<Code2 className="w-4 h-4 text-yellow-400" />}
              onAISuggest={() => handleAISuggest('javascript')}
              isAILoading={aiLoadingStates.javascript}
            />
          </div>

          {/* Middle Panel - Preview and Console */}
          <div className="space-y-4">
            <div className="h-96">
              <PreviewPanel
                html={html}
                css={css}
                javascript={javascript}
                onConsoleLog={handleConsoleLog}
              />
            </div>
            
            <ConsolePanel
              logs={consoleLogs}
              onClear={clearConsoleLogs}
            />

            {/* AI Suggestions Panel */}
            {showAISuggestions && aiSuggestions.length > 0 && (
              <AISuggestionPanel
                suggestions={aiSuggestions}
                onApplySuggestion={handleApplySuggestion}
                onDismiss={handleDismissSuggestion}
              />
            )}

            {/* Snippets Panel */}
            {showSnippets && (
              <SnippetManager
                snippets={snippets}
                onSave={saveSnippet}
                onLoad={loadSnippet}
                onDelete={deleteSnippet}
                onUpdate={updateSnippet}
                currentCode={{ html, css, javascript }}
              />
            )}
          </div>

          {/* Right Panel - Gemini Assistant */}
          {showGeminiAssistant && (
            <div className="space-y-4">
              <GeminiCodeAssistant
                currentCode={{ html, css, javascript }}
                onCodeUpdate={({ html, css, javascript }) => {
                  setHtml(html);
                  setCss(css);
                  setJavascript(javascript);
                }}
                onClose={() => setShowGeminiAssistant(false)}
              />
            </div>
          )}
        </div>

        {/* Enhanced Terminal */}
        <div className="mt-6">
          <EnhancedTerminal
            onCommand={handleCommand}
            onCodeChange={(html, css, js) => {
              setHtml(html);
              setCss(css);
              setJavascript(js);
            }}
            onThemeChange={setTheme}
            onSnippetSave={saveSnippet}
            onSnippetLoad={loadSnippetByName}
            getCurrentCode={getCurrentCode}
            getSnippets={getSnippets}
          />
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* AI Enhancement Popup */}
      <AIEnhancementPopup
        isOpen={aiPopupOpen}
        onClose={handleAIPopupClose}
        code={aiPopupCode}
        language={aiPopupLanguage}
        onApplyChanges={handleAIEnhancementApply}
        onApplyPartial={handleAIPartialApply}
        onUndo={canUndo ? handleUndo : undefined}
      />
    </div>
  );
}

export default App;