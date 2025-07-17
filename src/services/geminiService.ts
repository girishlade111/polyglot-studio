import { GoogleGenerativeAI } from '@google/generative-ai';
import { EditorLanguage, AIEnhancement, CodeComparison } from '../types';

// Use the same API key as the enhancement service for consistency
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyDK68voN4wRnCh95nrlu0m9vHbtJKOECqM';
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  /**
   * Enhance code using Gemini AI
   * @param code - The original code to enhance
   * @param language - The programming language
   * @returns Promise with enhanced code and analysis
   */
  async enhanceCode(code: string, language: EditorLanguage): Promise<AIEnhancement> {
    try {
      const prompt = this.buildEnhancementPrompt(code, language);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseEnhancementResponse(text, code, language);
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // More specific error handling
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your VITE_GEMINI_API_KEY environment variable.');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('API quota exceeded. Please try again later or check your billing.');
        } else if (error.message.includes('model')) {
          throw new Error('Model not available. The service may be temporarily unavailable.');
        }
      }
      
      throw new Error(`Failed to enhance ${language} code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build enhancement prompt for specific language
   */
  private buildEnhancementPrompt(code: string, language: EditorLanguage): string {
    const basePrompt = `You are an expert ${language.toUpperCase()} developer. Analyze and enhance the following code with best practices, performance optimizations, accessibility improvements, and modern standards.

Original ${language.toUpperCase()} code:
\`\`\`${language}
${code}
\`\`\`

Please provide your response in the following JSON format (ensure it's valid JSON):
{
  "enhancedCode": "the improved code here",
  "improvements": ["list of specific improvements made"],
  "explanation": "detailed explanation of changes and why they were made"
}

Focus on:`;

    switch (language) {
      case 'html':
        return `${basePrompt}
- Semantic HTML elements
- Accessibility (ARIA labels, alt attributes, proper form labels)
- SEO optimization (meta tags, structured data)
- Performance (lazy loading, proper resource hints)
- Modern HTML5 features
- Proper document structure

Make sure the enhanced code is production-ready and follows current web standards.`;

      case 'css':
        return `${basePrompt}
- Modern CSS features (Grid, Flexbox, Custom Properties)
- Performance optimizations (efficient selectors, will-change)
- Responsive design principles
- Accessibility (focus states, color contrast)
- Code organization and maintainability
- Browser compatibility considerations

Make sure the enhanced CSS is optimized and follows modern best practices.`;

      case 'javascript':
        return `${basePrompt}
- Modern ES6+ syntax and features
- Performance optimizations
- Error handling and edge cases
- Code readability and maintainability
- Security best practices
- Memory leak prevention
- Async/await patterns where appropriate

Make sure the enhanced JavaScript is secure, performant, and follows modern standards.`;

      default:
        return basePrompt;
    }
  }

  /**
   * Parse Gemini response into structured format
   */
  private parseEnhancementResponse(response: string, originalCode: string, language: EditorLanguage): AIEnhancement {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = response.trim();
      
      // Remove markdown code block markers
      cleanResponse = cleanResponse.replace(/```json\s*/g, '');
      cleanResponse = cleanResponse.replace(/```\s*$/g, '');
      
      // Extract JSON from response (Gemini sometimes includes extra text)
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.enhancedCode) {
        throw new Error('Enhanced code not found in response');
      }
      
      return {
        id: Date.now().toString(),
        language,
        originalCode,
        enhancedCode: parsed.enhancedCode || originalCode,
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ['Code enhancement applied'],
        explanation: parsed.explanation || 'Code has been enhanced with best practices and modern standards.',
        confidence: 85,
        suggestions: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.log('Raw response:', response);
      
      // Fallback: return original code with error message
      return {
        id: Date.now().toString(),
        language,
        originalCode,
        enhancedCode: originalCode,
        improvements: ['Failed to parse AI response - please try again'],
        explanation: 'There was an error processing the AI enhancement. The response format may have been unexpected. Please try again with different code or check your internet connection.',
        confidence: 0,
        suggestions: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate code comparison with differences highlighted
   */
  generateComparison(original: string, enhanced: string): CodeComparison {
    const originalLines = original.split('\n');
    const enhancedLines = enhanced.split('\n');
    const differences = [];

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
            description: 'Added line'
          });
        } else if (originalLine && !enhancedLine) {
          differences.push({
            type: 'deletion' as const,
            lineNumber: i + 1,
            content: originalLine,
            description: 'Removed line'
          });
        } else {
          differences.push({
            type: 'modification' as const,
            lineNumber: i + 1,
            content: enhancedLine,
            description: 'Modified line'
          });
        }
      }
    }

    return {
      original,
      enhanced,
      differences,
      stats: {
        linesAdded: differences.filter(d => d.type === 'addition').length,
        linesRemoved: differences.filter(d => d.type === 'deletion').length,
        linesModified: differences.filter(d => d.type === 'modification').length
      }
    };
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return API_KEY !== 'your-gemini-api-key-here' && API_KEY.length > 0;
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
}

// Export singleton instance
export const geminiService = new GeminiService();