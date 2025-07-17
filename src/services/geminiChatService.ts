import { GoogleGenerativeAI } from '@google/generative-ai';
import { EditorLanguage } from '../types';

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  codeBlocks?: GeminiCodeBlock[];
  isLoading?: boolean;
}

export interface GeminiCodeBlock {
  id: string;
  language: 'html' | 'css' | 'javascript';
  code: string;
  title?: string;
  description?: string;
  lineNumbers?: boolean;
}

export interface CodeModificationRequest {
  action: 'replace' | 'insert';
  lineNumber: number;
  code: string;
  language: 'html' | 'css' | 'javascript';
}

export interface GeminiChatRequest {
  message: string;
  currentCode: {
    html: string;
    css: string;
    javascript: string;
  };
  conversationHistory?: GeminiChatMessage[];
}

export class GeminiChatService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return API_KEY !== '' && API_KEY.length > 0;
  }

  /**
   * Send a chat message to Gemini AI
   */
  async sendMessage(request: GeminiChatRequest): Promise<GeminiChatMessage> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    try {
      const prompt = this.buildPrompt(request);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseResponse(text);
    } catch (error) {
      console.error('Gemini Chat Service Error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          throw new Error('Invalid API key. Please check your VITE_GEMINI_API_KEY environment variable.');
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error('API quota exceeded. Please try again later or check your billing.');
        }
      }
      
      throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate code based on user request
   */
  async generateCode(request: string, language: 'html' | 'css' | 'javascript'): Promise<GeminiCodeBlock> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured.');
    }

    const prompt = this.buildCodeGenerationPrompt(request, language);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseCodeResponse(text, language);
    } catch (error) {
      throw new Error(`Failed to generate ${language} code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate line number for code modification
   */
  validateLineNumber(code: string, lineNumber: number): { isValid: boolean; maxLines: number; error?: string } {
    const lines = code.split('\n');
    const maxLines = lines.length;

    if (lineNumber < 1) {
      return {
        isValid: false,
        maxLines,
        error: 'Line number must be greater than 0'
      };
    }

    if (lineNumber > maxLines + 1) {
      return {
        isValid: false,
        maxLines,
        error: `Line number cannot exceed ${maxLines + 1} (current code has ${maxLines} lines)`
      };
    }

    return { isValid: true, maxLines };
  }

  /**
   * Apply code modification
   */
  applyCodeModification(originalCode: string, modification: CodeModificationRequest): string {
    const lines = originalCode.split('\n');
    const { action, lineNumber, code } = modification;

    // Convert to 0-based index
    const index = lineNumber - 1;

    if (action === 'replace') {
      if (index >= 0 && index < lines.length) {
        lines[index] = code;
      } else {
        throw new Error(`Cannot replace line ${lineNumber}: line does not exist`);
      }
    } else if (action === 'insert') {
      lines.splice(index, 0, code);
    }

    return lines.join('\n');
  }

  /**
   * Build prompt for general chat
   */
  private buildPrompt(request: GeminiChatRequest): string {
    const { message, currentCode, conversationHistory } = request;

    let prompt = `You are an expert web developer assistant specializing in HTML, CSS, and JavaScript. You help developers with code generation, debugging, optimization, and explanations.

Current project code:
HTML:
\`\`\`html
${currentCode.html}
\`\`\`

CSS:
\`\`\`css
${currentCode.css}
\`\`\`

JavaScript:
\`\`\`javascript
${currentCode.javascript}
\`\`\`

`;

    // Add conversation history for context
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += "Previous conversation:\n";
      conversationHistory.slice(-3).forEach(msg => {
        prompt += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += "\n";
    }

    prompt += `User request: ${message}

Please provide a helpful response. If you're providing code:
1. Always wrap code in proper markdown code blocks with language specification
2. Add comments explaining key sections
3. Ensure code is production-ready and follows best practices
4. If modifying existing code, explain what changes were made and why

Format your response clearly with explanations and code examples where appropriate.`;

    return prompt;
  }

  /**
   * Build prompt for code generation
   */
  private buildCodeGenerationPrompt(request: string, language: 'html' | 'css' | 'javascript'): string {
    const languageInstructions = {
      html: `Generate semantic, accessible HTML5 code. Include:
- Proper document structure
- Semantic elements (header, nav, main, section, article, footer)
- Accessibility attributes (alt, aria-label, etc.)
- Meta tags for SEO
- Comments explaining structure`,
      css: `Generate modern, responsive CSS code. Include:
- CSS Grid or Flexbox for layouts
- CSS custom properties (variables)
- Mobile-first responsive design
- Modern CSS features
- Comments explaining styling choices`,
      javascript: `Generate modern, clean JavaScript code. Include:
- ES6+ syntax (const/let, arrow functions, async/await)
- Proper error handling
- Event listeners and DOM manipulation
- Comments explaining functionality
- Best practices for performance`
    };

    return `You are an expert ${language.toUpperCase()} developer. Generate ${language} code based on this request: "${request}"

Requirements:
${languageInstructions[language]}

Provide only the code with helpful comments. Make it production-ready and follow current best practices.

Code:`;
  }

  /**
   * Parse Gemini response into structured format
   */
  private parseResponse(text: string): GeminiChatMessage {
    const codeBlocks: GeminiCodeBlock[] = [];
    
    // Extract code blocks from markdown
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let blockIndex = 0;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1]?.toLowerCase();
      const code = match[2].trim();

      if (language && ['html', 'css', 'javascript', 'js'].includes(language)) {
        codeBlocks.push({
          id: `code-block-${blockIndex++}`,
          language: language === 'js' ? 'javascript' : language as 'html' | 'css' | 'javascript',
          code,
          lineNumbers: true
        });
      }
    }

    // Remove code blocks from content for cleaner display
    const cleanContent = text.replace(codeBlockRegex, '').trim();

    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: cleanContent || text,
      timestamp: new Date().toISOString(),
      codeBlocks
    };
  }

  /**
   * Parse code generation response
   */
  private parseCodeResponse(text: string, language: 'html' | 'css' | 'javascript'): GeminiCodeBlock {
    // Try to extract code from markdown block first
    const codeBlockRegex = new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\`\`\``, 'i');
    const match = text.match(codeBlockRegex);
    
    let code = match ? match[1].trim() : text.trim();
    
    // If no markdown block found, try to clean up the response
    if (!match) {
      // Remove common prefixes
      code = code.replace(/^(Here's|Here is|Code:)/i, '').trim();
    }

    return {
      id: Date.now().toString(),
      language,
      code,
      title: `Generated ${language.toUpperCase()} Code`,
      lineNumbers: true
    };
  }

  /**
   * Get code with line numbers for display
   */
  getCodeWithLineNumbers(code: string): string {
    return code.split('\n').map((line, index) => {
      const lineNumber = (index + 1).toString().padStart(3, ' ');
      return `${lineNumber} | ${line}`;
    }).join('\n');
  }

  /**
   * Detect code type from content
   */
  detectCodeType(code: string): 'html' | 'css' | 'javascript' | 'unknown' {
    const trimmedCode = code.trim().toLowerCase();
    
    // HTML detection
    if (trimmedCode.includes('<html') || trimmedCode.includes('<!doctype') || 
        trimmedCode.includes('<div') || trimmedCode.includes('<span') ||
        trimmedCode.includes('<p>') || trimmedCode.includes('<h1')) {
      return 'html';
    }
    
    // CSS detection
    if (trimmedCode.includes('{') && trimmedCode.includes('}') && 
        (trimmedCode.includes(':') || trimmedCode.includes('@media') || 
         trimmedCode.includes('px') || trimmedCode.includes('rem'))) {
      return 'css';
    }
    
    // JavaScript detection
    if (trimmedCode.includes('function') || trimmedCode.includes('const ') ||
        trimmedCode.includes('let ') || trimmedCode.includes('var ') ||
        trimmedCode.includes('console.log') || trimmedCode.includes('=>')) {
      return 'javascript';
    }
    
    return 'unknown';
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
export const geminiChatService = new GeminiChatService();