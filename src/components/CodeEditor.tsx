import React from 'react';
import Editor from '@monaco-editor/react';
import { EditorLanguage } from '../types';

interface CodeEditorProps {
  language: EditorLanguage;
  value: string;
  onChange: (value: string) => void;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  language, 
  value, 
  onChange, 
  height = '300px' 
}) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const getLanguageForMonaco = (lang: EditorLanguage): string => {
    switch (lang) {
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'javascript':
        return 'javascript';
      default:
        return 'plaintext';
    }
  };

  return (
    <div className="h-full border border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={getLanguageForMonaco(language)}
        value={value}
        onChange={handleEditorChange}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;