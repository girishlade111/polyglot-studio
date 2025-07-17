import { GoogleGenerativeAI } from '@google/generative-ai';
import { EditorLanguage, AIEnhancement, CodeComparison, AICodeSuggestion } from '../types';

// Initialize Gemini AI with the provided API key
const API_KEY = 'AIzaSyDK68voN4wRnCh95nrlu0m9vHbtJKOECqM';
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiEnhancementService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  /**
   * Enhance code using Gemini AI with comprehensive analysis
   * @param code - The original code to enhance
   * @param language - The programming language
   * @returns Promise with enhanced code and detailed analysis
   */
  async enhanceCode(code: string, language: EditorLanguage): Promise<AIEnhancement> {
    try {
      const prompt = this.buildEnhancementPrompt(code, language);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseEnhancementResponse(text, code, language);
    } catch (error) {
      console.error('Gemini Enhancement Service Error:', error);
      
      // Specific error handling for better user experience
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your Gemini API configuration.');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('API quota exceeded. Please try again later.');
        } else if (error.message.includes('model')) {
          throw new Error('Model not available. The service may be temporarily unavailable.');
        }
      }
      
      throw new Error(`Failed to enhance ${language} code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate real-time code analysis and suggestions
   */
  async analyzeCode(code: string, language: EditorLanguage): Promise<AICodeSuggestion[]> {
    try {
      const prompt = this.buildAnalysisPrompt(code, language);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAnalysisResponse(text, language);
    } catch (error) {
      console.error('Code analysis error:', error);
      return [];
    }
  }

  /**
   * Build comprehensive enhancement prompt for specific language
   */
  private buildEnhancementPrompt(code: string, language: EditorLanguage): string {
    const basePrompt = `You are an expert ${language.toUpperCase()} developer and code reviewer. Analyze and enhance the following code with modern best practices, performance optimizations, accessibility improvements, and security considerations.

Original ${language.toUpperCase()} code:
\`\`\`${language}
${code}
\`\`\`

IMPORTANT: Please provide your response in the following JSON format (ensure it's valid JSON). The "enhancedCode" field must contain ONLY the raw code as a plain string - do NOT include any markdown code blocks, backticks, or formatting. Just the plain code text:

{
  "enhancedCode": "the improved code here as a plain string without any markdown formatting or backticks",
  "improvements": ["specific improvement 1", "specific improvement 2", "etc"],
  "explanation": "detailed explanation of all changes made and why they improve the code",
  "confidence": 85,
  "suggestions": [
    {
      "id": "suggestion-1",
      "title": "Improvement Title",
      "description": "Detailed description of the improvement",
      "type": "performance|accessibility|best-practice|security|maintainability",
      "impact": "low|medium|high",
      "code": "specific code snippet for this improvement",
      "lineNumber": 5
    }
  ]
}

Focus on:`;

    switch (language) {
      case 'html':
        return `${basePrompt}
- Semantic HTML5 elements and proper document structure
- Accessibility (ARIA labels, alt attributes, proper form labels, keyboard navigation)
- SEO optimization (meta tags, structured data, heading hierarchy)
- Performance (lazy loading, resource hints, efficient markup)
- Modern HTML5 features and best practices
- Cross-browser compatibility
- Security considerations (CSP, data validation)

Ensure the enhanced HTML is production-ready, accessible, and follows current web standards.`;

      case 'css':
        return `${basePrompt}
- Modern CSS features (Grid, Flexbox, Custom Properties, Container Queries)
- Performance optimizations (efficient selectors, will-change, contain)
- Responsive design principles and mobile-first approach
- Accessibility (focus states, color contrast, reduced motion)
- Code organization and maintainability (logical grouping, comments)
- Browser compatibility and progressive enhancement
- CSS architecture best practices (BEM, utility classes)

Ensure the enhanced CSS is optimized, maintainable, and follows modern standards.`;

      case 'javascript':
        return `${basePrompt}
- Modern ES6+ syntax and features (async/await, destructuring, modules)
- Performance optimizations (debouncing, memoization, efficient algorithms)
- Error handling and edge cases (try-catch, input validation)
- Code readability and maintainability (clear naming, modular structure)
- Security best practices (XSS prevention, input sanitization)
- Memory leak prevention and cleanup
- Accessibility considerations (keyboard events, screen reader support)
- Modern JavaScript patterns and best practices

Ensure the enhanced JavaScript is secure, performant, and follows modern standards.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Build analysis prompt for real-time suggestions
   */
  private buildAnalysisPrompt(code: string, language: EditorLanguage): string {
    return `Analyze this ${language.toUpperCase()} code and provide specific improvement suggestions:

\`\`\`${language}
${code}
\`\`\`

Return a JSON array of suggestions:
[
  {
    "id": "unique-id",
    "title": "Brief improvement title",
    "description": "Detailed description",
    "type": "performance|accessibility|best-practice|security|maintainability",
    "impact": "low|medium|high",
    "code": "improved code snippet",
    "lineNumber": 5
  }
]

Focus on actionable, specific improvements that can be applied individually.`;
  }

  /**
   * Parse Gemini enhancement response into structured format
   */
  private parseEnhancementResponse(response: string, originalCode: string, language: EditorLanguage): AIEnhancement {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      
      // Try multiple extraction methods to handle different response formats
      let jsonString = this.extractJsonFromResponse(cleanResponse);
      
      if (!jsonString) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonString);
      
      // Validate required fields
      if (!parsed.enhancedCode) {
        throw new Error('Enhanced code not found in response');
      }
      
      // Additional cleaning of enhancedCode field to remove any remaining markdown
      let enhancedCode = parsed.enhancedCode;
      if (typeof enhancedCode === 'string') {
        // Remove any markdown code blocks that might have slipped through
        enhancedCode = enhancedCode.replace(/^```[\w]*\n?/gm, '');
        enhancedCode = enhancedCode.replace(/\n?```$/gm, '');
        enhancedCode = enhancedCode.trim();
      }
      
      return {
        id: Date.now().toString(),
        language,
        originalCode,
        enhancedCode: enhancedCode || originalCode,
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Code enhancement applied'],
        explanation: parsed.explanation || 'Code has been enhanced with best practices and modern standards.',
        confidence: parsed.confidence || 75,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse Gemini enhancement response:', error);
      console.log('Raw response:', response);
      
      // Fallback: return original code with error message
      return {
        id: Date.now().toString(),
        language,
        originalCode,
        enhancedCode: originalCode,
        improvements: ['Failed to parse AI response - please try again'],
        explanation: 'There was an error processing the AI enhancement. The response format may have been unexpected. Please try again.',
        confidence: 0,
        suggestions: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Extract JSON from various response formats
   */
  private extractJsonFromResponse(response: string): string | null {
    // Method 1: Try to extract from ```json code blocks
    const jsonBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    // Method 2: Try to extract from ``` code blocks (without language specifier)
    const codeBlockMatch = response.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const content = codeBlockMatch[1].trim();
      // Check if it looks like JSON (starts with { and ends with })
      if (content.startsWith('{') && content.endsWith('}')) {
        return content;
      }
    }

    // Method 3: Find JSON object boundaries
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonCandidate = jsonMatch[0];
      
      // Try to clean up common issues
      jsonCandidate = this.cleanJsonString(jsonCandidate);
      
      // Validate it's proper JSON by trying to parse a small portion
      try {
        // Test parse to see if it's valid
        JSON.parse('{"test": "value"}'); // Basic test
        return jsonCandidate;
      } catch {
        // If basic test fails, there might be an issue with the JSON structure
      }
    }

    // Method 4: Try to find and extract JSON more aggressively
    const lines = response.split('\n');
    let jsonStart = -1;
    let jsonEnd = -1;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('{') && jsonStart === -1) {
        jsonStart = i;
        braceCount = 1;
      } else if (jsonStart !== -1) {
        // Count braces to find the end of JSON
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        
        if (braceCount === 0) {
          jsonEnd = i;
          break;
        }
      }
    }

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonLines = lines.slice(jsonStart, jsonEnd + 1);
      const jsonString = jsonLines.join('\n');
      return this.cleanJsonString(jsonString);
    }

    return null;
  }

  /**
   * Clean JSON string from common formatting issues
   */
  private cleanJsonString(jsonString: string): string {
    // Remove any leading/trailing whitespace
    let cleaned = jsonString.trim();
    
    // Remove any markdown backticks that might have slipped through
    cleaned = cleaned.replace(/^`+|`+$/g, '');
    
    // Fix common JSON issues in AI responses
    // Replace single quotes with double quotes (but be careful with content)
    cleaned = cleaned.replace(/'/g, '"');
    
    // Fix trailing commas before closing braces/brackets
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Clean up any embedded code blocks within JSON string values
    // This handles cases where the AI might include backticks in the enhancedCode field
    cleaned = cleaned.replace(/"enhancedCode":\s*"([^"]*```[^"]*)"/, (match, codeContent) => {
      // Remove markdown code blocks from the code content
      const cleanedCode = codeContent
        .replace(/```[\w]*\n?/g, '')
        .replace(/\n?```/g, '')
        .replace(/"/g, '\\"'); // Escape quotes
      return `"enhancedCode": "${cleanedCode}"`;
    });
    
    // More aggressive cleaning for multiline code in JSON strings
    cleaned = cleaned.replace(/"enhancedCode":\s*"([\s\S]*?)"(?=\s*,\s*"|\s*})/g, (match, codeContent) => {
      // Clean the code content
      let cleanedCode = codeContent
        .replace(/```[\w]*\n?/g, '')
        .replace(/\n?```/g, '')
        .replace(/\\n/g, '\n')
        .replace(/(?<!\\)"/g, '\\"'); // Escape unescaped quotes
      
      return `"enhancedCode": "${cleanedCode}"`;
    });

    return cleaned;
  }

  /**
   * Parse analysis response for real-time suggestions
   */
  private parseAnalysisResponse(response: string, language: EditorLanguage): AICodeSuggestion[] {
    try {
      // Clean up response
      let cleanResponse = response.trim();
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*$/g, '');
      
      // Extract JSON array
      const arrayMatch = cleanResponse.match(/\[[\s\S]*\]/);
      if (!arrayMatch) {
        return [];
      }

      const parsed = JSON.parse(arrayMatch[0]);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to parse analysis response:', error);
      return [];
    }
  }

  /**
   * Generate detailed code comparison with differences highlighted
   */
  generateComparison(original: string, enhanced: string): CodeComparison {
    const originalLines = original.split('\n');
    const enhancedLines = enhanced.split('\n');
    const differences = [];
    let linesAdded = 0;
    let linesRemoved = 0;
    let linesModified = 0;

    // Simple diff algorithm - in production, use a more sophisticated library
    const maxLines = Math.max(originalLines.length, enhancedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const enhancedLine = enhancedLines[i] || '';

      if (originalLine !== enhancedLine) {
        if (!originalLine && enhancedLine) {
          differences.push({
            type: 'addition' as const,
            lineNumber: i + 1,
            content: enhancedLine,
            description: 'Added line',
            category: 'improvement'
          });
          linesAdded++;
        } else if (originalLine && !enhancedLine) {
          differences.push({
            type: 'deletion' as const,
            lineNumber: i + 1,
            content: originalLine,
            description: 'Removed line',
            category: 'optimization'
          });
          linesRemoved++;
        } else {
          differences.push({
            type: 'modification' as const,
            lineNumber: i + 1,
            content: enhancedLine,
            description: 'Modified line',
            category: 'improvement'
          });
          linesModified++;
        }
      }
    }

    return {
      original,
      enhanced,
      differences,
      stats: {
        linesAdded,
        linesRemoved,
        linesModified
      }
    };
  }

  /**
   * Apply partial suggestions to code
   */
  applyPartialSuggestions(originalCode: string, suggestions: AICodeSuggestion[]): string {
    const selectedSuggestions = suggestions.filter(s => s.selected);
    let enhancedCode = originalCode;

    // Sort by line number in descending order to avoid line number shifts
    selectedSuggestions.sort((a, b) => (b.lineNumber || 0) - (a.lineNumber || 0));

    selectedSuggestions.forEach(suggestion => {
      if (suggestion.lineNumber && suggestion.code) {
        const lines = enhancedCode.split('\n');
        lines[suggestion.lineNumber - 1] = suggestion.code;
        enhancedCode = lines.join('\n');
      }
    });

    return enhancedCode;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return API_KEY.length > 0 && API_KEY !== 'your-gemini-api-key-here';
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Hello, this is a test.');
      const response = await result.response;
      return !!response.text();
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get language-specific enhancement tips
   */
  getEnhancementTips(language: EditorLanguage): string[] {
    const tips = {
      html: [
        'Use semantic HTML5 elements for better accessibility',
        'Add proper alt attributes to images',
        'Include meta tags for SEO optimization',
        'Use proper heading hierarchy (h1-h6)',
        'Add ARIA labels for complex interactions'
      ],
      css: [
        'Use CSS Grid and Flexbox for modern layouts',
        'Implement mobile-first responsive design',
        'Use CSS custom properties for theming',
        'Optimize selectors for better performance',
        'Add focus states for accessibility'
      ],
      javascript: [
        'Use modern ES6+ syntax and features',
        'Implement proper error handling',
        'Add input validation and sanitization',
        'Use async/await for better readability',
        'Optimize for performance and memory usage'
      ]
    };

    return tips[language] || [];
  }
}

// Export singleton instance
export const geminiEnhancementService = new GeminiEnhancementService();