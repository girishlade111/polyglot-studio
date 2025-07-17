import { AISuggestion, EditorLanguage } from '../types';

// AI suggestion patterns and rules
const htmlSuggestions = [
  {
    pattern: /<button[^>]*>.*<\/button>/gi,
    check: (match: string) => !match.includes('aria-label') && !match.includes('aria-describedby'),
    suggestion: {
      type: 'accessibility' as const,
      title: 'Add accessibility attributes',
      description: 'Consider adding aria-label or aria-describedby for better accessibility',
      code: `<!-- Add accessibility attributes like aria-label -->
<button aria-label="Descriptive button text">Click Me</button>`,
      severity: 'medium' as const,
    }
  },
  {
    pattern: /<img[^>]*>/gi,
    check: (match: string) => !match.includes('alt='),
    suggestion: {
      type: 'accessibility' as const,
      title: 'Missing alt attribute',
      description: 'Images should have alt attributes for screen readers',
      code: `<!-- Add alt attribute for accessibility -->
<img src="image.jpg" alt="Descriptive image text" />`,
      severity: 'high' as const,
    }
  },
  {
    pattern: /<form[^>]*>/gi,
    check: (match: string) => !match.includes('novalidate'),
    suggestion: {
      type: 'best-practice' as const,
      title: 'Form validation',
      description: 'Consider adding proper form validation attributes',
      code: `<!-- Add validation and accessibility -->
<form novalidate>
  <label for="email">Email:</label>
  <input type="email" id="email" required aria-describedby="email-error">
  <span id="email-error" class="error-message"></span>
</form>`,
      severity: 'medium' as const,
    }
  },
  {
    pattern: /<button[^>]*onclick/gi,
    check: () => true,
    suggestion: {
      type: 'best-practice' as const,
      title: 'Use event listeners instead of inline handlers',
      description: 'Consider using addEventListener for better separation of concerns',
      code: `<!-- Instead of onclick, use JavaScript event listeners -->
<button id="myButton">Click Me</button>
<script>
document.getElementById('myButton').addEventListener('click', function() {
  // Your functionality here
});
</script>`,
      severity: 'low' as const,
    }
  }
];

const cssSuggestions = [
  {
    pattern: /position:\s*fixed/gi,
    check: () => true,
    suggestion: {
      type: 'performance' as const,
      title: 'Fixed positioning performance',
      description: 'Fixed elements can cause performance issues. Consider using transform for animations',
      code: `/* Use transform for better performance */
.element {
  position: fixed;
  will-change: transform; /* Optimize for animations */
  transform: translateZ(0); /* Create new layer */
}`,
      severity: 'low' as const,
    }
  },
  {
    pattern: /color:\s*#[0-9a-f]{3,6}/gi,
    check: (match: string, fullCode: string) => {
      const colorRegex = /#([0-9a-f]{3,6})/gi;
      const colors = fullCode.match(colorRegex) || [];
      return colors.length > 5; // Suggest CSS variables if many colors
    },
    suggestion: {
      type: 'best-practice' as const,
      title: 'Use CSS custom properties',
      description: 'Consider using CSS variables for consistent color management',
      code: `:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --accent-color: #f59e0b;
}

.element {
  color: var(--primary-color);
  background: var(--secondary-color);
}`,
      severity: 'medium' as const,
    }
  },
  {
    pattern: /display:\s*flex/gi,
    check: (match: string, fullCode: string) => {
      const flexContext = fullCode.substring(Math.max(0, fullCode.indexOf(match) - 100), fullCode.indexOf(match) + 200);
      return !flexContext.includes('gap:') && !flexContext.includes('gap ');
    },
    suggestion: {
      type: 'improvement' as const,
      title: 'Consider using gap property',
      description: 'Use gap property for consistent spacing in flexbox layouts',
      code: `.flex-container {
  display: flex;
  gap: 1rem; /* Better than margins for spacing */
  align-items: center;
  justify-content: space-between;
}`,
      severity: 'low' as const,
    }
  }
];

const jsSuggestions = [
  {
    pattern: /document\.getElementById\(/gi,
    check: () => true,
    suggestion: {
      type: 'improvement' as const,
      title: 'Consider using querySelector',
      description: 'querySelector provides more flexibility and consistency',
      code: `// More flexible and consistent
const element = document.querySelector('#myId');
const elements = document.querySelectorAll('.myClass');

// Also consider error handling
const button = document.querySelector('#myButton');
if (button) {
  button.addEventListener('click', handleClick);
}`,
      severity: 'low' as const,
    }
  },
  {
    pattern: /addEventListener\s*\(\s*['"]click['"]/gi,
    check: (match: string, fullCode: string) => {
      const context = fullCode.substring(Math.max(0, fullCode.indexOf(match) - 200), fullCode.indexOf(match) + 200);
      return !context.includes('removeEventListener');
    },
    suggestion: {
      type: 'best-practice' as const,
      title: 'Consider cleanup for event listeners',
      description: 'Remember to remove event listeners to prevent memory leaks',
      code: `// Store reference for cleanup
const handleClick = (event) => {
  console.log('Button clicked!');
};

const button = document.querySelector('#myButton');
button.addEventListener('click', handleClick);

// Clean up when needed
// button.removeEventListener('click', handleClick);`,
      severity: 'medium' as const,
    }
  },
  {
    pattern: /console\.log\(/gi,
    check: () => true,
    suggestion: {
      type: 'best-practice' as const,
      title: 'Consider using different log levels',
      description: 'Use appropriate console methods for different types of output',
      code: `// Use appropriate log levels
console.log('General information');
console.info('Informational message');
console.warn('Warning message');
console.error('Error message');

// For debugging, consider:
console.group('Debug Group');
console.table(data); // For objects/arrays
console.time('Performance'); // Start timer
console.timeEnd('Performance'); // End timer
console.groupEnd();`,
      severity: 'low' as const,
    }
  },
  {
    pattern: /var\s+/gi,
    check: () => true,
    suggestion: {
      type: 'best-practice' as const,
      title: 'Use const/let instead of var',
      description: 'const and let provide better scoping and prevent common errors',
      code: `// Use const for values that don't change
const API_URL = 'https://api.example.com';
const config = { timeout: 5000 };

// Use let for values that will change
let counter = 0;
let currentUser = null;

// Avoid var due to function scoping issues`,
      severity: 'medium' as const,
    }
  }
];

export const generateAISuggestions = (code: string, language: EditorLanguage): AISuggestion[] => {
  const suggestions: AISuggestion[] = [];
  let suggestionPatterns: any[] = [];

  switch (language) {
    case 'html':
      suggestionPatterns = htmlSuggestions;
      break;
    case 'css':
      suggestionPatterns = cssSuggestions;
      break;
    case 'javascript':
      suggestionPatterns = jsSuggestions;
      break;
  }

  suggestionPatterns.forEach((pattern, index) => {
    const matches = code.match(pattern.pattern);
    if (matches) {
      matches.forEach((match, matchIndex) => {
        if (pattern.check(match, code)) {
          suggestions.push({
            id: `${language}-${index}-${matchIndex}`,
            language,
            ...pattern.suggestion,
          });
        }
      });
    }
  });

  // Remove duplicates based on title
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
    index === self.findIndex(s => s.title === suggestion.title)
  );

  return uniqueSuggestions.slice(0, 3); // Limit to 3 suggestions per language
};