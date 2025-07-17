import { AIHelpRequest, AIHelpResponse, AIMessage, CodeBlock, AIModel } from '../types';

// Mock AI service - replace with actual API integration
export class AIHelpService {
  private apiEndpoint = '/api/ai-help'; // Replace with your actual endpoint
  private apiKey = import.meta.env.VITE_AI_API_KEY || '';

  /**
   * Send a help request to the AI service
   */
  async sendHelpRequest(request: AIHelpRequest): Promise<AIHelpResponse> {
    try {
      // For demo purposes, we'll simulate the API call
      // Replace this with actual API integration
      return await this.simulateAIResponse(request);
      
      // Uncomment and modify for real API integration:
      /*
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error('AI Help Service Error:', error);
      throw new Error(`Failed to get AI assistance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simulate AI response for demo purposes
   */
  private async simulateAIResponse(request: AIHelpRequest): Promise<AIHelpResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const responses = this.generateContextualResponse(request);
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      id: Date.now().toString(),
      content: randomResponse.content,
      codeBlocks: randomResponse.codeBlocks,
      suggestions: randomResponse.suggestions,
      timestamp: new Date().toISOString(),
      model: request.model,
    };
  }

  /**
   * Generate contextual responses based on user input and code
   */
  private generateContextualResponse(request: AIHelpRequest) {
    const { userPrompt, htmlCode, cssCode, jsCode } = request;
    const prompt = userPrompt.toLowerCase();

    // Analyze the code and prompt to provide relevant responses
    if (prompt.includes('error') || prompt.includes('fix') || prompt.includes('bug')) {
      return this.getErrorFixResponses(htmlCode, cssCode, jsCode);
    }
    
    if (prompt.includes('responsive') || prompt.includes('mobile')) {
      return this.getResponsiveDesignResponses();
    }
    
    if (prompt.includes('navbar') || prompt.includes('navigation')) {
      return this.getNavbarResponses();
    }
    
    if (prompt.includes('animation') || prompt.includes('animate')) {
      return this.getAnimationResponses();
    }
    
    if (prompt.includes('optimize') || prompt.includes('performance')) {
      return this.getOptimizationResponses();
    }

    if (prompt.includes('style') || prompt.includes('css') || prompt.includes('design')) {
      return this.getStylingResponses();
    }

    // Default helpful responses
    return this.getGeneralHelpResponses();
  }

  private getErrorFixResponses(html: string, css: string, js: string) {
    const responses = [];

    // Check for common issues
    if (js.includes('console.log') && !js.includes('document.')) {
      responses.push({
        content: "I notice you're using console.log but might not be interacting with the DOM. Here's how to properly select and manipulate elements:",
        codeBlocks: [
          {
            id: 'dom-fix',
            language: 'javascript' as const,
            code: `// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    // Select elements safely
    const button = document.querySelector('#myButton');
    const output = document.querySelector('#output');
    
    if (button && output) {
        button.addEventListener('click', function() {
            output.textContent = 'Button clicked!';
            console.log('Button interaction successful');
        });
    }
});`,
            title: 'DOM Interaction Fix',
            description: 'Proper way to interact with DOM elements'
          }
        ],
        suggestions: [
          'Always check if elements exist before manipulating them',
          'Use addEventListener instead of inline onclick',
          'Wait for DOM to load before running scripts'
        ]
      });
    }

    if (css.includes('display: flex') && !css.includes('align-items')) {
      responses.push({
        content: "I see you're using flexbox! Here are some improvements to make your layout more robust:",
        codeBlocks: [
          {
            id: 'flex-fix',
            language: 'css' as const,
            code: `.flex-container {
    display: flex;
    align-items: center;     /* Vertical alignment */
    justify-content: space-between; /* Horizontal alignment */
    gap: 1rem;              /* Consistent spacing */
    flex-wrap: wrap;        /* Responsive wrapping */
}

.flex-item {
    flex: 1;                /* Equal width items */
    min-width: 200px;       /* Minimum width for responsiveness */
}`,
            title: 'Improved Flexbox Layout',
            description: 'Better flexbox properties for robust layouts'
          }
        ],
        suggestions: [
          'Use gap property for consistent spacing',
          'Add flex-wrap for responsive behavior',
          'Consider align-items and justify-content for proper alignment'
        ]
      });
    }

    if (responses.length === 0) {
      responses.push({
        content: "I've analyzed your code and here are some general improvements and best practices:",
        codeBlocks: [
          {
            id: 'general-fix',
            language: 'javascript' as const,
            code: `// Add error handling
try {
    // Your code here
    const result = someFunction();
    console.log('Success:', result);
} catch (error) {
    console.error('Error occurred:', error.message);
}

// Use modern JavaScript features
const data = await fetch('/api/data')
    .then(response => response.json())
    .catch(error => console.error('Fetch error:', error));`,
            title: 'Error Handling Best Practices'
          }
        ],
        suggestions: [
          'Add try-catch blocks for error handling',
          'Use const/let instead of var',
          'Validate user inputs',
          'Check for null/undefined values'
        ]
      });
    }

    return responses;
  }

  private getResponsiveDesignResponses() {
    return [{
      content: "Here's how to make your design fully responsive with modern CSS techniques:",
      codeBlocks: [
        {
          id: 'responsive-css',
          language: 'css' as const,
          code: `/* Mobile-first responsive design */
.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

/* Responsive grid */
.grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
    .grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .container {
        padding: 2rem;
    }
}

/* Desktop and up */
@media (min-width: 1024px) {
    .grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Responsive typography */
.title {
    font-size: clamp(1.5rem, 4vw, 3rem);
    line-height: 1.2;
}`,
          title: 'Responsive CSS Framework',
          description: 'Mobile-first responsive design with CSS Grid'
        },
        {
          id: 'responsive-html',
          language: 'html' as const,
          code: `<meta name="viewport" content="width=device-width, initial-scale=1.0">

<div class="container">
    <h1 class="title">Responsive Title</h1>
    <div class="grid">
        <div class="card">Card 1</div>
        <div class="card">Card 2</div>
        <div class="card">Card 3</div>
    </div>
</div>`,
          title: 'Responsive HTML Structure'
        }
      ],
      suggestions: [
        'Use CSS Grid for complex layouts',
        'Implement mobile-first design approach',
        'Use clamp() for responsive typography',
        'Test on multiple device sizes'
      ]
    }];
  }

  private getNavbarResponses() {
    return [{
      content: "Here's a modern, responsive navigation bar with mobile menu:",
      codeBlocks: [
        {
          id: 'navbar-html',
          language: 'html' as const,
          code: `<nav class="navbar">
    <div class="nav-container">
        <div class="nav-logo">
            <a href="#" class="nav-logo-link">Your Logo</a>
        </div>
        
        <div class="nav-menu" id="nav-menu">
            <a href="#home" class="nav-link">Home</a>
            <a href="#about" class="nav-link">About</a>
            <a href="#services" class="nav-link">Services</a>
            <a href="#contact" class="nav-link">Contact</a>
        </div>
        
        <div class="nav-toggle" id="nav-toggle">
            <span class="bar"></span>
            <span class="bar"></span>
            <span class="bar"></span>
        </div>
    </div>
</nav>`,
          title: 'Responsive Navbar HTML'
        },
        {
          id: 'navbar-css',
          language: 'css' as const,
          code: `.navbar {
    background: #1a1a1a;
    padding: 1rem 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.nav-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-logo-link {
    color: #fff;
    font-size: 1.5rem;
    font-weight: bold;
    text-decoration: none;
}

.nav-menu {
    display: flex;
    gap: 2rem;
}

.nav-link {
    color: #fff;
    text-decoration: none;
    transition: color 0.3s ease;
}

.nav-link:hover {
    color: #3b82f6;
}

.nav-toggle {
    display: none;
    flex-direction: column;
    cursor: pointer;
}

.bar {
    width: 25px;
    height: 3px;
    background: #fff;
    margin: 3px 0;
    transition: 0.3s;
}

/* Mobile styles */
@media (max-width: 768px) {
    .nav-menu {
        position: fixed;
        left: -100%;
        top: 70px;
        flex-direction: column;
        background: #1a1a1a;
        width: 100%;
        text-align: center;
        transition: 0.3s;
        padding: 2rem 0;
    }
    
    .nav-menu.active {
        left: 0;
    }
    
    .nav-toggle {
        display: flex;
    }
    
    .nav-toggle.active .bar:nth-child(2) {
        opacity: 0;
    }
    
    .nav-toggle.active .bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
    }
    
    .nav-toggle.active .bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
    }
}`,
          title: 'Responsive Navbar CSS'
        },
        {
          id: 'navbar-js',
          language: 'javascript' as const,
          code: `document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        }
    });
});`,
          title: 'Navbar JavaScript Functionality'
        }
      ],
      suggestions: [
        'Use semantic HTML for better accessibility',
        'Add ARIA labels for screen readers',
        'Consider using CSS transforms for smooth animations',
        'Test navigation on mobile devices'
      ]
    }];
  }

  private getAnimationResponses() {
    return [{
      content: "Here are some smooth, modern animations you can add to your project:",
      codeBlocks: [
        {
          id: 'css-animations',
          language: 'css' as const,
          code: `/* Fade in animation */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Slide in from left */
@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

/* Pulse animation */
@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}

/* Apply animations */
.fade-in {
    animation: fadeIn 0.6s ease-out;
}

.slide-in-left {
    animation: slideInLeft 0.8s ease-out;
}

.pulse {
    animation: pulse 2s infinite;
}

/* Hover effects */
.button {
    transition: all 0.3s ease;
    transform: translateY(0);
}

.button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Loading spinner */
.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}`,
          title: 'CSS Animations Collection'
        },
        {
          id: 'js-animations',
          language: 'javascript' as const,
          code: `// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe all elements with animation class
document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
});

// Smooth scroll to element
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Stagger animation for multiple elements
function staggerAnimation(selector, delay = 100) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('fade-in');
        }, index * delay);
    });
}`,
          title: 'JavaScript Animation Helpers'
        }
      ],
      suggestions: [
        'Use CSS transforms instead of changing layout properties',
        'Add will-change property for better performance',
        'Use Intersection Observer for scroll-triggered animations',
        'Keep animations under 300ms for better UX'
      ]
    }];
  }

  private getOptimizationResponses() {
    return [{
      content: "Here are key optimizations to improve your code's performance:",
      codeBlocks: [
        {
          id: 'css-optimization',
          language: 'css' as const,
          code: `/* Optimize CSS for performance */

/* Use efficient selectors */
.button { /* Good: class selector */ }
#header { /* Good: ID selector */ }
/* Avoid: div > ul > li > a (complex descendant selectors) */

/* Minimize repaints and reflows */
.optimized-element {
    /* Use transform instead of changing position */
    transform: translateX(100px);
    
    /* Use opacity instead of visibility */
    opacity: 0;
    
    /* Use will-change for animations */
    will-change: transform;
}

/* Efficient animations */
@keyframes slideIn {
    from {
        transform: translateX(-100%);
    }
    to {
        transform: translateX(0);
    }
}

/* Remove will-change after animation */
.animation-complete {
    will-change: auto;
}

/* Use contain for isolated components */
.isolated-component {
    contain: layout style paint;
}`,
          title: 'CSS Performance Optimizations'
        },
        {
          id: 'js-optimization',
          language: 'javascript' as const,
          code: `// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Efficient DOM manipulation
function updateMultipleElements(data) {
    // Use DocumentFragment for multiple DOM insertions
    const fragment = document.createDocumentFragment();
    
    data.forEach(item => {
        const element = document.createElement('div');
        element.textContent = item.text;
        element.className = item.className;
        fragment.appendChild(element);
    });
    
    // Single DOM insertion
    document.getElementById('container').appendChild(fragment);
}

// Lazy loading images
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Optimized event listeners
const optimizedScrollHandler = throttle(() => {
    // Scroll handling code
    console.log('Scroll event handled');
}, 16); // ~60fps

window.addEventListener('scroll', optimizedScrollHandler);`,
          title: 'JavaScript Performance Optimizations'
        }
      ],
      suggestions: [
        'Use debouncing for search inputs and API calls',
        'Implement lazy loading for images and content',
        'Minimize DOM manipulations by batching updates',
        'Use CSS transforms for animations instead of layout properties'
      ]
    }];
  }

  private getStylingResponses() {
    return [{
      content: "Here are modern CSS techniques to improve your styling:",
      codeBlocks: [
        {
          id: 'modern-css',
          language: 'css' as const,
          code: `:root {
    /* CSS Custom Properties (Variables) */
    --primary-color: #3b82f6;
    --secondary-color: #64748b;
    --accent-color: #f59e0b;
    --text-color: #1f2937;
    --bg-color: #ffffff;
    --border-radius: 0.5rem;
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --transition: all 0.3s ease;
}

/* Modern card component */
.card {
    background: var(--bg-color);
    border-radius: var(--border-radius);
    box-shadow: var(--shadow);
    padding: 1.5rem;
    transition: var(--transition);
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Modern button styles */
.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--border-radius);
    font-weight: 500;
    text-decoration: none;
    transition: var(--transition);
    cursor: pointer;
}

.btn-primary {
    background: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background: #2563eb;
    transform: translateY(-1px);
}

/* Gradient backgrounds */
.gradient-bg {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
}

/* Glass morphism effect */
.glass {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: var(--border-radius);
}

/* Modern grid layout */
.grid-auto-fit {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}`,
          title: 'Modern CSS Techniques'
        }
      ],
      suggestions: [
        'Use CSS custom properties for consistent theming',
        'Implement modern layout techniques like CSS Grid',
        'Add subtle animations and transitions',
        'Use modern effects like backdrop-filter for glass morphism'
      ]
    }];
  }

  private getGeneralHelpResponses() {
    return [{
      content: "I'm here to help you with your web development project! Here are some general tips and a useful code snippet:",
      codeBlocks: [
        {
          id: 'best-practices',
          language: 'javascript' as const,
          code: `// Modern JavaScript best practices
class WebApp {
    constructor() {
        this.init();
    }
    
    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.render();
        } catch (error) {
            this.handleError(error);
        }
    }
    
    async loadData() {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        this.data = await response.json();
    }
    
    setupEventListeners() {
        // Use event delegation for better performance
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn')) {
                this.handleButtonClick(e);
            }
        });
    }
    
    handleButtonClick(event) {
        const action = event.target.dataset.action;
        switch (action) {
            case 'save':
                this.saveData();
                break;
            case 'load':
                this.loadData();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }
    
    handleError(error) {
        console.error('Application error:', error);
        // Show user-friendly error message
        this.showNotification('Something went wrong. Please try again.', 'error');
    }
    
    showNotification(message, type = 'info') {
        // Implementation for showing notifications
        console.log(type.toUpperCase() + ': ' + message);
    }
}

// Initialize the app
new WebApp();`,
          title: 'Modern JavaScript Architecture'
        }
      ],
      suggestions: [
        'Use semantic HTML for better accessibility',
        'Implement proper error handling',
        'Use modern JavaScript features like async/await',
        'Follow the mobile-first design approach',
        'Test your code across different browsers'
      ]
    }];
  }

  /**
   * Get available AI models
   */
  getAvailableModels(): { id: AIModel; name: string; description: string }[] {
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable model for complex coding tasks'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient for most coding questions'
      },
      {
        id: 'claude-3',
        name: 'Claude 3',
        description: 'Excellent for code analysis and explanations'
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        description: 'Specialized in programming and code generation'
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Google\'s advanced AI for coding assistance'
      }
    ];
  }

  /**
   * Get prompt templates for quick actions
   */
  getPromptTemplates(): AIPromptTemplate[] {
    return [
      {
        id: 'fix-errors',
        name: 'Fix Errors',
        description: 'Identify and fix bugs in the code',
        prompt: 'Please analyze my code and fix any errors or bugs you find. Explain what was wrong and how you fixed it.',
        category: 'fix',
        icon: '🔧'
      },
      {
        id: 'optimize-performance',
        name: 'Optimize Performance',
        description: 'Improve code performance and efficiency',
        prompt: 'Please optimize my code for better performance. Focus on reducing load times, improving efficiency, and following best practices.',
        category: 'optimize',
        icon: '⚡'
      },
      {
        id: 'make-responsive',
        name: 'Make Responsive',
        description: 'Convert design to be mobile-friendly',
        prompt: 'Please make my design fully responsive for mobile, tablet, and desktop devices. Use modern CSS techniques.',
        category: 'enhance',
        icon: '📱'
      },
      {
        id: 'add-animations',
        name: 'Add Animations',
        description: 'Add smooth animations and transitions',
        prompt: 'Please add smooth, modern animations and transitions to improve the user experience. Use CSS animations and JavaScript where appropriate.',
        category: 'enhance',
        icon: '✨'
      },
      {
        id: 'explain-code',
        name: 'Explain Code',
        description: 'Get detailed explanation of how the code works',
        prompt: 'Please explain how my code works, including the purpose of each section and any important concepts or patterns used.',
        category: 'explain',
        icon: '📚'
      },
      {
        id: 'accessibility',
        name: 'Improve Accessibility',
        description: 'Make the code more accessible',
        prompt: 'Please improve the accessibility of my code by adding proper ARIA labels, semantic HTML, keyboard navigation, and other accessibility features.',
        category: 'enhance',
        icon: '♿'
      }
    ];
  }
}

// Export singleton instance
export const aiHelpService = new AIHelpService();

// Add missing interface for prompt templates
interface AIPromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  icon: string;
}