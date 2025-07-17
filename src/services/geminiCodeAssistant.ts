import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiChatMessage, GeminiCodeBlock, CodeModificationRequest, GeminiChatRequest, EditorLanguage } from '../types';

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiCodeAssistant {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  /**
   * SYSTEM ROLE: Specialized code assistant integrated with Gemini API
   * Primary function: Help users with HTML, CSS, and JavaScript code generation and modifications
   */

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return API_KEY !== '' && API_KEY.length > 0;
  }

  /**
   * USER INTERACTION RULE 1: Code Generation
   * - Detect request type (HTML/CSS/JavaScript)
   * - Generate code via Gemini API
   * - Format output with line numbers
   * - Include descriptive comments
   * - Validate syntax before displaying
   */
  async generateCode(request: string, detectedType?: EditorLanguage): Promise<GeminiChatMessage> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    try {
      // Detect code type if not provided
      const codeType = detectedType || this.detectRequestType(request);
      
      const prompt = this.buildCodeGenerationPrompt(request, codeType);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const codeBlock = this.parseCodeResponse(text, codeType);
      
      // Validate syntax before displaying
      const validation = this.validateSyntax(codeBlock.code, codeType);
      codeBlock.validated = validation.isValid;
      codeBlock.syntaxError = validation.error;

      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: `[Code Type]: ${codeType.toUpperCase()}\n[Line Numbers]: Enabled\n[Validation]: ${validation.isValid ? 'PASSED' : 'FAILED' + (validation.error ? ` - ${validation.error}` : '')}`,
        timestamp: new Date().toISOString(),
        codeBlocks: [codeBlock]
      };
    } catch (error) {
      throw new Error(`Failed to generate ${detectedType || 'code'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * USER INTERACTION RULE 2: Code Modifications
   * Input sequence:
   * - Request line number
   * - Confirm action type: [INSERT] or [REPLACE]
   * - Preview changes
   * - Execute after user confirmation
   */
  async requestCodeModification(
    originalCode: string, 
    language: EditorLanguage, 
    totalLines: number
  ): Promise<{ prompt: string; awaitingInput: 'lineNumber' | 'action' | 'confirmation' }> {
    return {
      prompt: `Enter line number (1-${totalLines}): `,
      awaitingInput: 'lineNumber'
    };
  }

  /**
   * MODIFICATION PROMPTS: Handle modification workflow
   */
  async processModificationInput(
    input: string,
    step: 'lineNumber' | 'action' | 'confirmation',
    context: {
      originalCode: string;
      language: EditorLanguage;
      lineNumber?: number;
      action?: 'insert' | 'replace';
      newCode?: string;
    }
  ): Promise<{ 
    prompt?: string; 
    awaitingInput?: 'lineNumber' | 'action' | 'confirmation';
    modification?: CodeModificationRequest;
    error?: string;
  }> {
    
    switch (step) {
      case 'lineNumber':
        const lineNumber = parseInt(input.trim());
        const validation = this.validateLineNumber(context.originalCode, lineNumber);
        
        if (!validation.isValid) {
          return {
            error: validation.error,
            prompt: `Enter line number (1-${validation.maxLines}): `,
            awaitingInput: 'lineNumber'
          };
        }

        return {
          prompt: 'Select action: [1] Insert [2] Replace',
          awaitingInput: 'action'
        };

      case 'action':
        const actionInput = input.trim();
        let action: 'insert' | 'replace';
        
        if (actionInput === '1' || actionInput.toLowerCase() === 'insert') {
          action = 'insert';
        } else if (actionInput === '2' || actionInput.toLowerCase() === 'replace') {
          action = 'replace';
        } else {
          return {
            error: 'Invalid action. Please select [1] Insert or [2] Replace',
            prompt: 'Select action: [1] Insert [2] Replace',
            awaitingInput: 'action'
          };
        }

        // Generate code suggestion based on context
        const suggestion = await this.generateCodeSuggestion(
          context.originalCode,
          context.language,
          context.lineNumber!,
          action
        );

        return {
          prompt: `Preview changes:\n${suggestion}\n\nConfirm changes? (Y/N): `,
          awaitingInput: 'confirmation'
        };

      case 'confirmation':
        const confirm = input.trim().toLowerCase();
        
        if (confirm === 'y' || confirm === 'yes') {
          return {
            modification: {
              action: context.action!,
              lineNumber: context.lineNumber!,
              code: context.newCode!,
              language: context.language,
              confirmed: true
            }
          };
        } else {
          return {
            prompt: 'Modification cancelled. How else can I help you?'
          };
        }

      default:
        return { error: 'Invalid modification step' };
    }
  }

  /**
   * ERROR HANDLING: Validate line numbers
   */
  validateLineNumber(code: string, lineNumber: number): { isValid: boolean; maxLines: number; error?: string } {
    const lines = code.split('\n');
    const maxLines = lines.length;

    if (!Number.isInteger(lineNumber) || lineNumber < 1) {
      return {
        isValid: false,
        maxLines,
        error: 'Line number must be a positive integer'
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
   * ERROR HANDLING: Validate syntax
   */
  validateSyntax(code: string, language: EditorLanguage): { isValid: boolean; error?: string } {
    try {
      switch (language) {
        case 'html':
          return this.validateHTML(code);
        case 'css':
          return this.validateCSS(code);
        case 'javascript':
          return this.validateJavaScript(code);
        default:
          return { isValid: true };
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Syntax validation failed'
      };
    }
  }

  /**
   * CODE ORGANIZATION: Apply code modification
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
   * RESPONSE FORMAT: Get code with line numbers
   */
  getCodeWithLineNumbers(code: string): string {
    return code.split('\n').map((line, index) => {
      const lineNumber = (index + 1).toString().padStart(3, ' ');
      return `${lineNumber} | ${line}`;
    }).join('\n');
  }

  /**
   * Send general chat message
   */
  async sendMessage(request: GeminiChatRequest): Promise<GeminiChatMessage> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    try {
      const prompt = this.buildChatPrompt(request);
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
   * Detect request type from user input
   */
  private detectRequestType(request: string): EditorLanguage {
    const lowerRequest = request.toLowerCase();
    
    if (lowerRequest.includes('html') || lowerRequest.includes('markup') || 
        lowerRequest.includes('element') || lowerRequest.includes('tag')) {
      return 'html';
    }
    
    if (lowerRequest.includes('css') || lowerRequest.includes('style') || 
        lowerRequest.includes('design') || lowerRequest.includes('layout')) {
      return 'css';
    }
    
    if (lowerRequest.includes('javascript') || lowerRequest.includes('js') || 
        lowerRequest.includes('function') || lowerRequest.includes('script')) {
      return 'javascript';
    }
    
    // Default to HTML for general requests
    return 'html';
  }

  /**
   * Build prompt for code generation
   */
  private buildCodeGenerationPrompt(request: string, language: EditorLanguage): string {
    const systemRole = `You are a specialized code assistant integrated with the Gemini API. Your primary function is to help users with HTML, CSS, and JavaScript code generation and modifications.`;

    const languageInstructions = {
      html: `Generate semantic, accessible HTML5 code with:
- Proper document structure and semantic elements
- Accessibility attributes (alt, aria-label, role, etc.)
- SEO-friendly meta tags where appropriate
- Descriptive comments explaining key sections
- Clean, properly indented code`,
      css: `Generate modern, responsive CSS code with:
- CSS Grid or Flexbox for layouts
- CSS custom properties (variables) for consistency
- Mobile-first responsive design principles
- Modern CSS features and best practices
- Descriptive comments explaining styling choices`,
      javascript: `Generate modern, clean JavaScript code with:
- ES6+ syntax (const/let, arrow functions, async/await)
- Proper error handling and validation
- Event listeners and DOM manipulation best practices
- Descriptive comments explaining functionality
- Production-ready, optimized code`
    };

    return `${systemRole}

TASK: Generate ${language.toUpperCase()} code for the following request:
"${request}"

REQUIREMENTS:
${languageInstructions[language]}

RESPONSE FORMAT:
- Provide only the code with helpful comments
- Ensure code is production-ready
- Follow current best practices
- Make code maintainable and readable

Generate the ${language.toUpperCase()} code:`;
  }

  /**
   * Build prompt for general chat
   */
  private buildChatPrompt(request: GeminiChatRequest): string {
    const { message, currentCode, conversationHistory } = request;

    let prompt = `You are a specialized code assistant integrated with the Gemini API. Your primary function is to help users with HTML, CSS, and JavaScript code generation and modifications.

CURRENT PROJECT CODE:
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
      prompt += "CONVERSATION HISTORY:\n";
      conversationHistory.slice(-3).forEach(msg => {
        prompt += `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += "\n";
    }

    prompt += `USER REQUEST: ${message}

INSTRUCTIONS:
- Maintain professional communication
- Provide status updates after each operation
- If providing code, wrap in proper markdown code blocks
- Add comments explaining key sections
- Ensure code is production-ready and follows best practices
- If modifying existing code, explain changes and reasoning

Respond helpfully and professionally:`;

    return prompt;
  }

  /**
   * Parse code generation response
   */
  private parseCodeResponse(text: string, language: EditorLanguage): GeminiCodeBlock {
    // Try to extract code from markdown block first
    const codeBlockRegex = new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\`\`\``, 'i');
    const match = text.match(codeBlockRegex);
    
    let code = match ? match[1].trim() : text.trim();
    
    // If no markdown block found, try to clean up the response
    if (!match) {
      // Remove common prefixes
      code = code.replace(/^(Here's|Here is|Code:|Generated code:)/i, '').trim();
    }

    return {
      id: Date.now().toString(),
      language,
      code,
      title: `Generated ${language.toUpperCase()} Code`,
      description: `Production-ready ${language} code with comments`,
      lineNumbers: true
    };
  }

  /**
   * Parse general chat response
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
        const normalizedLang = language === 'js' ? 'javascript' : language as EditorLanguage;
        const validation = this.validateSyntax(code, normalizedLang);
        
        codeBlocks.push({
          id: `code-block-${blockIndex++}`,
          language: normalizedLang,
          code,
          lineNumbers: true,
          validated: validation.isValid,
          syntaxError: validation.error
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
   * Generate code suggestion for modification
   */
  private async generateCodeSuggestion(
    originalCode: string, 
    language: EditorLanguage, 
    lineNumber: number, 
    action: 'insert' | 'replace'
  ): Promise<string> {
    const lines = originalCode.split('\n');
    const contextStart = Math.max(0, lineNumber - 3);
    const contextEnd = Math.min(lines.length, lineNumber + 2);
    const context = lines.slice(contextStart, contextEnd).join('\n');

    const prompt = `Suggest appropriate ${language} code to ${action} at line ${lineNumber}.

Context around line ${lineNumber}:
\`\`\`${language}
${context}
\`\`\`

Provide a single line of ${language} code that would be appropriate to ${action} at this location:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      return `// ${action === 'insert' ? 'Insert' : 'Replace'} your ${language} code here`;
    }
  }

  /**
   * Validate HTML syntax
   */
  private validateHTML(code: string): { isValid: boolean; error?: string } {
    // Basic HTML validation
    const openTags = code.match(/<[^/][^>]*>/g) || [];
    const closeTags = code.match(/<\/[^>]*>/g) || [];
    
    // Check for basic structure
    if (code.trim() && !code.includes('<') && !code.includes('>')) {
      return { isValid: false, error: 'No HTML tags found' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate CSS syntax
   */
  private validateCSS(code: string): { isValid: boolean; error?: string } {
    // Basic CSS validation
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      return { isValid: false, error: 'Mismatched braces in CSS' };
    }
    
    return { isValid: true };
  }

  /**
   * Validate JavaScript syntax
   */
  private validateJavaScript(code: string): { isValid: boolean; error?: string } {
    try {
      // Basic syntax check using Function constructor
      new Function(code);
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'JavaScript syntax error' 
      };
    }
  }

  /**
   * Detect code type from content
   */
  detectCodeType(code: string): EditorLanguage | 'unknown' {
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
export const geminiCodeAssistant = new GeminiCodeAssistant();