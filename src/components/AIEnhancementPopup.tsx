import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Copy, 
  Undo2, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  EyeOff,
  Download,
  BarChart3,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  Shield,
  Accessibility,
  Wrench
} from 'lucide-react';
import { AIEnhancement, CodeComparison, EditorLanguage, AICodeSuggestion } from '../types';
import { geminiEnhancementService } from '../services/geminiEnhancementService';

interface AIEnhancementPopupProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: EditorLanguage;
  onApplyChanges: (enhancedCode: string) => void;
  onApplyPartial?: (suggestions: AICodeSuggestion[]) => void;
  onUndo?: () => void;
}

const AIEnhancementPopup: React.FC<AIEnhancementPopupProps> = ({
  isOpen,
  onClose,
  code,
  language,
  onApplyChanges,
  onApplyPartial,
  onUndo
}) => {
  const [enhancement, setEnhancement] = useState<AIEnhancement | null>(null);
  const [comparison, setComparison] = useState<CodeComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified' | 'suggestions'>('side-by-side');
  const [showDifferences, setShowDifferences] = useState(true);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'suggestions' | 'comparison'>('overview');

  useEffect(() => {
    if (isOpen && code.trim()) {
      enhanceCode();
    }
  }, [isOpen, code, language]);

  const enhanceCode = async () => {
    if (!geminiEnhancementService.isConfigured()) {
      setError('Gemini API key not configured. Please check your environment variables.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEnhancement(null);
    setComparison(null);
    setSelectedSuggestions(new Set());

    try {
      const result = await geminiEnhancementService.enhanceCode(code, language);
      setEnhancement(result);
      
      const comp = geminiEnhancementService.generateComparison(result.originalCode, result.enhancedCode);
      setComparison(comp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enhance code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyChanges = () => {
    if (enhancement) {
      onApplyChanges(enhancement.enhancedCode);
      onClose();
    }
  };

  const handleApplyPartialSuggestions = () => {
    if (enhancement && onApplyPartial) {
      const selectedSuggestionsList = enhancement.suggestions.filter(s => selectedSuggestions.has(s.id));
      onApplyPartial(selectedSuggestionsList);
      onClose();
    }
  };

  const toggleSuggestion = (suggestionId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(suggestionId)) {
      newSelected.delete(suggestionId);
    } else {
      newSelected.add(suggestionId);
    }
    setSelectedSuggestions(newSelected);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getLanguageColor = (lang: EditorLanguage) => {
    switch (lang) {
      case 'html': return 'text-orange-400';
      case 'css': return 'text-blue-400';
      case 'javascript': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'accessibility': return <Accessibility className="w-4 h-4 text-blue-400" />;
      case 'security': return <Shield className="w-4 h-4 text-red-400" />;
      case 'best-practice': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'maintainability': return <Wrench className="w-4 h-4 text-purple-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-900/20 border-red-700';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'low': return 'text-green-400 bg-green-900/20 border-green-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  const renderCodeBlock = (code: string, title: string, isEnhanced = false) => (
    <div className="flex-1 min-w-0">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-600 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">{title}</h4>
        <div className="flex items-center gap-2">
          {isEnhanced && enhancement && (
            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
              {enhancement.confidence}% confidence
            </span>
          )}
          <button
            onClick={() => copyToClipboard(code)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="bg-gray-900 p-4 h-80 overflow-auto">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap">
          <code className={isEnhanced ? 'text-green-300' : ''}>{code}</code>
        </pre>
      </div>
    </div>
  );

  const renderSuggestions = () => {
    if (!enhancement?.suggestions.length) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-medium text-gray-200">
            Individual Suggestions ({enhancement.suggestions.length})
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              {selectedSuggestions.size} selected
            </span>
            <button
              onClick={() => setSelectedSuggestions(new Set(enhancement.suggestions.map(s => s.id)))}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedSuggestions(new Set())}
              className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {enhancement.suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                selectedSuggestions.has(suggestion.id)
                  ? 'border-blue-500 bg-blue-900/20'
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500'
              }`}
              onClick={() => toggleSuggestion(suggestion.id)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={selectedSuggestions.has(suggestion.id)}
                    onChange={() => toggleSuggestion(suggestion.id)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getSuggestionIcon(suggestion.type)}
                    <h5 className="text-sm font-medium text-gray-200">{suggestion.title}</h5>
                    <span className={`text-xs px-2 py-1 rounded border ${getImpactColor(suggestion.impact)}`}>
                      {suggestion.impact} impact
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-3">{suggestion.description}</p>
                  
                  {suggestion.code && (
                    <div className="bg-gray-900 rounded p-3 border border-gray-700">
                      <pre className="text-xs text-green-300 overflow-x-auto">
                        <code>{suggestion.code}</code>
                      </pre>
                    </div>
                  )}
                  
                  {suggestion.lineNumber && (
                    <div className="mt-2 text-xs text-gray-500">
                      Line {suggestion.lineNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (!comparison) return null;

    return (
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{comparison.stats.linesAdded}</div>
          <div className="text-xs text-gray-400">Lines Added</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{comparison.stats.linesModified}</div>
          <div className="text-xs text-gray-400">Lines Modified</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{comparison.stats.linesRemoved}</div>
          <div className="text-xs text-gray-400">Lines Removed</div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-200">AI Code Enhancement</h2>
            <span className={`text-sm uppercase font-mono px-2 py-1 rounded bg-gray-700 ${getLanguageColor(language)}`}>
              {language}
            </span>
            {enhancement && (
              <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded">
                {enhancement.confidence}% confidence
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'suggestions' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Suggestions
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  activeTab === 'comparison' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Comparison
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">Analyzing and enhancing your {language} code...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h3 className="text-red-200 font-medium">Enhancement Failed</h3>
              </div>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={enhanceCode}
                className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {enhancement && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Improvements Summary */}
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                    <h3 className="text-lg font-medium text-gray-200 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      Improvements Made
                    </h3>
                    <ul className="space-y-2 mb-4">
                      {enhancement.improvements.map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-gray-900 rounded p-3 border border-gray-700">
                      <p className="text-sm text-gray-400">{enhancement.explanation}</p>
                    </div>
                  </div>

                  {/* Statistics */}
                  {renderStats()}
                </div>
              )}

              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && renderSuggestions()}

              {/* Comparison Tab */}
              {activeTab === 'comparison' && (
                <div className="space-y-4">
                  {/* View Mode Toggle */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-200">Code Comparison</h3>
                    <div className="flex items-center gap-1 bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('side-by-side')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          viewMode === 'side-by-side' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4 inline mr-1" />
                        Side by Side
                      </button>
                      <button
                        onClick={() => setViewMode('unified')}
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          viewMode === 'unified' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Unified
                        <ChevronRight className="w-4 h-4 inline ml-1" />
                      </button>
                    </div>
                  </div>

                  {/* Code Comparison */}
                  <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
                    {viewMode === 'side-by-side' ? (
                      <div className="flex">
                        {renderCodeBlock(enhancement.originalCode, 'Original Code')}
                        <div className="w-px bg-gray-600"></div>
                        {renderCodeBlock(enhancement.enhancedCode, 'Enhanced Code', true)}
                      </div>
                    ) : (
                      <div>
                        {renderCodeBlock(enhancement.enhancedCode, 'Enhanced Code', true)}
                      </div>
                    )}
                  </div>

                  {/* Differences */}
                  {comparison && showDifferences && (
                    <div className="bg-gray-800 rounded-lg border border-gray-600">
                      <div className="px-4 py-2 border-b border-gray-600 flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-300">
                          Changes ({comparison.differences.length})
                        </h4>
                        <button
                          onClick={() => setShowDifferences(false)}
                          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4 max-h-40 overflow-auto">
                        {comparison.differences.map((diff, index) => (
                          <div key={index} className="mb-2 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                diff.type === 'addition' ? 'bg-green-600 text-white' :
                                diff.type === 'deletion' ? 'bg-red-600 text-white' :
                                'bg-yellow-600 text-white'
                              }`}>
                                {diff.type.toUpperCase()}
                              </span>
                              <span className="text-gray-400">Line {diff.lineNumber}</span>
                            </div>
                            <div className="bg-gray-900 p-2 rounded border-l-4 border-l-gray-600">
                              <code className="text-gray-300">{diff.content}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {enhancement && (
          <div className="bg-gray-800 px-6 py-4 border-t border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {copiedToClipboard && (
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Copied to clipboard!
                </span>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <BarChart3 className="w-4 h-4" />
                <span>{enhancement.improvements.length} improvements</span>
                {enhancement.suggestions.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{enhancement.suggestions.length} suggestions</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {onUndo && (
                <button
                  onClick={onUndo}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
                >
                  <Undo2 className="w-4 h-4" />
                  Undo Last Change
                </button>
              )}
              
              {selectedSuggestions.size > 0 && onApplyPartial && (
                <button
                  onClick={handleApplyPartialSuggestions}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Apply Selected ({selectedSuggestions.size})
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleApplyChanges}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                Apply All Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIEnhancementPopup;