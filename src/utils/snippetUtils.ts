import { CodeSnippet } from '../types';

export const exportSnippetAsJSON = (snippet: CodeSnippet): void => {
  const dataStr = JSON.stringify(snippet, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${snippet.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const importSnippetFromJSON = (file: File): Promise<CodeSnippet> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const snippet = JSON.parse(content) as CodeSnippet;
        
        // Validate snippet structure
        if (!snippet.name || !snippet.html || !snippet.css || !snippet.javascript) {
          throw new Error('Invalid snippet format');
        }
        
        // Generate new ID and timestamp for imported snippet
        const importedSnippet: CodeSnippet = {
          ...snippet,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        resolve(importedSnippet);
      } catch (error) {
        reject(new Error('Failed to parse snippet file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

export const exportAllSnippets = (snippets: CodeSnippet[]): void => {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    snippets: snippets,
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `polyglot-snippets-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const searchSnippets = (snippets: CodeSnippet[], query: string): CodeSnippet[] => {
  if (!query.trim()) return snippets;
  
  const searchTerm = query.toLowerCase();
  
  return snippets.filter(snippet => 
    snippet.name.toLowerCase().includes(searchTerm) ||
    snippet.description?.toLowerCase().includes(searchTerm) ||
    snippet.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
    snippet.category?.toLowerCase().includes(searchTerm) ||
    snippet.html.toLowerCase().includes(searchTerm) ||
    snippet.css.toLowerCase().includes(searchTerm) ||
    snippet.javascript.toLowerCase().includes(searchTerm)
  );
};

export const sortSnippets = (snippets: CodeSnippet[], sortBy: 'name' | 'date' | 'updated'): CodeSnippet[] => {
  return [...snippets].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updated':
        const aUpdated = a.updatedAt || a.createdAt;
        const bUpdated = b.updatedAt || b.createdAt;
        return new Date(bUpdated).getTime() - new Date(aUpdated).getTime();
      default:
        return 0;
    }
  });
};

export const getSnippetStats = (snippets: CodeSnippet[]) => {
  const totalSnippets = snippets.length;
  const totalSize = snippets.reduce((acc, snippet) => 
    acc + snippet.html.length + snippet.css.length + snippet.javascript.length, 0
  );
  
  const categories = [...new Set(snippets.map(s => s.category).filter(Boolean))];
  const tags = [...new Set(snippets.flatMap(s => s.tags || []))];
  
  return {
    totalSnippets,
    totalSize,
    averageSize: totalSnippets > 0 ? Math.round(totalSize / totalSnippets) : 0,
    categories: categories.length,
    tags: tags.length,
  };
};