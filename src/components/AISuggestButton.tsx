import React, { useState } from 'react';
import { Sparkles, RefreshCw, Zap, Brain } from 'lucide-react';
import { EditorLanguage } from '../types';

interface AISuggestButtonProps {
  language: EditorLanguage;
  onSuggest: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  hasContent?: boolean;
}

const AISuggestButton: React.FC<AISuggestButtonProps> = ({
  language,
  onSuggest,
  isLoading = false,
  disabled = false,
  hasContent = true
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getLanguageConfig = (lang: EditorLanguage) => {
    switch (lang) {
      case 'html':
        return {
          gradient: 'from-orange-500 to-red-500',
          hoverGradient: 'from-orange-600 to-red-600',
          icon: <Brain className="w-4 h-4" />,
          label: 'AI Enhance HTML'
        };
      case 'css':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          hoverGradient: 'from-blue-600 to-cyan-600',
          icon: <Zap className="w-4 h-4" />,
          label: 'AI Enhance CSS'
        };
      case 'javascript':
        return {
          gradient: 'from-yellow-500 to-orange-500',
          hoverGradient: 'from-yellow-600 to-orange-600',
          icon: <Sparkles className="w-4 h-4" />,
          label: 'AI Enhance JS'
        };
      default:
        return {
          gradient: 'from-purple-500 to-pink-500',
          hoverGradient: 'from-purple-600 to-pink-600',
          icon: <Sparkles className="w-4 h-4" />,
          label: 'AI Enhance'
        };
    }
  };

  const config = getLanguageConfig(language);

  if (!hasContent) {
    return (
      <div className="absolute top-3 right-3 z-10">
        <div className="px-3 py-2 bg-gray-700 text-gray-400 text-sm rounded-lg border border-gray-600">
          <span className="hidden sm:inline">Add {language.toUpperCase()} code to enhance</span>
          <span className="sm:hidden">Add code</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onSuggest}
      disabled={disabled || isLoading || !hasContent}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        absolute top-3 right-3 z-10
        flex items-center gap-2 px-3 py-2
        bg-gradient-to-r ${isHovered ? config.hoverGradient : config.gradient}
        text-white text-sm font-medium
        rounded-lg shadow-lg border border-white/20
        transition-all duration-200 ease-in-out
        hover:shadow-xl hover:scale-105 hover:-translate-y-0.5
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
        backdrop-blur-sm
        ${isLoading ? 'animate-pulse' : ''}
        group
      `}
      title={`${config.label} - Analyze and improve your ${language.toUpperCase()} code with AI`}
    >
      <div className="relative">
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          config.icon
        )}
        
        {/* Animated sparkle effect */}
        {!isLoading && (
          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
          </div>
        )}
      </div>
      
      <span className="hidden sm:inline font-semibold">
        {isLoading ? 'Enhancing...' : 'AI Suggest'}
      </span>
      <span className="sm:hidden font-semibold">
        {isLoading ? '...' : 'AI'}
      </span>
      
      {/* Subtle glow effect */}
      <div className={`
        absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300
        bg-gradient-to-r ${config.gradient} blur-md -z-10
      `} />
    </button>
  );
};

export default AISuggestButton;