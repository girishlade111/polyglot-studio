import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import CodeEditor from './CodeEditor';
import AISuggestButton from './AISuggestButton';
import { EditorLanguage } from '../types';

interface EditorPanelProps {
  title: string;
  language: EditorLanguage;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  onAISuggest?: () => void;
  isAILoading?: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  title,
  language,
  value,
  onChange,
  icon,
  onAISuggest,
  isAILoading = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-300">{title}</h3>
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded uppercase">
            {language}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isCollapsed ? 'rotate-180' : ''
          }`}
        />
      </div>
      {!isCollapsed && (
        <div className="relative">
          <div className="p-4">
            <CodeEditor
              language={language}
              value={value}
              onChange={onChange}
              height="300px"
            />
          </div>
          {onAISuggest && (
            <AISuggestButton
              language={language}
              onSuggest={onAISuggest}
              isLoading={isAILoading}
              hasContent={value.trim().length > 0}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EditorPanel;