import React, { useState } from 'react';
import { Lightbulb, X, ChevronDown, ChevronRight, Sparkles, AlertTriangle, Zap, CheckCircle } from 'lucide-react';
import { AISuggestion } from '../types';

interface AISuggestionPanelProps {
  suggestions: AISuggestion[];
  onApplySuggestion?: (suggestion: AISuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
}

const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  suggestions,
  onApplySuggestion,
  onDismiss,
}) => {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSuggestions(newExpanded);
  };

  const getSeverityIcon = (severity: AISuggestion['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTypeIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'accessibility':
        return <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">A11Y</span>;
      case 'performance':
        return <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">PERF</span>;
      case 'best-practice':
        return <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">BEST</span>;
      case 'improvement':
        return <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded">IMPR</span>;
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'html':
        return 'text-orange-400';
      case 'css':
        return 'text-blue-400';
      case 'javascript':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div
        className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-medium text-gray-300">AI Suggestions</h3>
          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
            {suggestions.length}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {!isCollapsed && (
        <div className="max-h-80 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="border-b border-gray-700 last:border-b-0">
              <div
                className="p-4 hover:bg-gray-800 cursor-pointer transition-colors"
                onClick={() => toggleExpanded(suggestion.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {getSeverityIcon(suggestion.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-200 truncate">
                          {suggestion.title}
                        </h4>
                        <span className={`text-xs uppercase font-mono ${getLanguageColor(suggestion.language)}`}>
                          {suggestion.language}
                        </span>
                        {getTypeIcon(suggestion.type)}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {expandedSuggestions.has(suggestion.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    {onDismiss && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(suggestion.id);
                        }}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
                        title="Dismiss suggestion"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {expandedSuggestions.has(suggestion.id) && (
                <div className="px-4 pb-4 bg-gray-850">
                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-600">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      <code>{suggestion.code}</code>
                    </pre>
                  </div>
                  {onApplySuggestion && (
                    <div className="flex justify-end mt-3">
                      <button
                        onClick={() => onApplySuggestion(suggestion)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Lightbulb className="w-3 h-3" />
                        Apply Suggestion
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AISuggestionPanel;