import React, { useState, useMemo } from 'react';
import { Calendar, Code, Search, Filter, Eye, Edit3, Trash2, Download } from 'lucide-react';
import { useCodeFiles } from '../../hooks/useCodeFiles';
import { CodeFile } from '../../lib/database.types';

interface CodeHistoryPageProps {
  onLoadCode?: (codeFile: CodeFile) => void;
}

const CodeHistoryPage: React.FC<CodeHistoryPageProps> = ({ onLoadCode }) => {
  const { codeFiles, loading, deleteCodeFile } = useCodeFiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'html' | 'css' | 'javascript'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'language'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const itemsPerPage = 10;

  // Filter and sort code files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = codeFiles.filter(file => {
      const matchesSearch = file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.code_content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLanguage = languageFilter === 'all' || file.language === languageFilter;
      return matchesSearch && matchesLanguage;
    });

    // Sort files
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'language':
          return a.language.localeCompare(b.language);
        default:
          return 0;
      }
    });

    return filtered;
  }, [codeFiles, searchQuery, languageFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);
  const paginatedFiles = filteredAndSortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLanguageColor = (language: string) => {
    switch (language) {
      case 'html': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'css': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'javascript': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleDelete = async (file: CodeFile) => {
    if (window.confirm(`Are you sure you want to delete "${file.title}"?`)) {
      await deleteCodeFile(file.id);
    }
  };

  const downloadFile = (file: CodeFile) => {
    const blob = new Blob([file.code_content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.title}.${file.language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Code History</h1>
          <p className="text-gray-600">View and manage your saved code files</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Language Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Languages</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="language">Sort by Language</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {paginatedFiles.length} of {filteredAndSortedFiles.length} files
          </p>
        </div>

        {/* Code Files List */}
        {paginatedFiles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Code className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No code files found</h3>
            <p className="text-gray-500">
              {searchQuery || languageFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start coding to see your saved files here'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {file.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getLanguageColor(file.language)}`}>
                        {file.language.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(file.created_at)}
                      </span>
                      <span>{file.code_content.length} characters</span>
                    </div>
                    
                    <div className="bg-gray-50 rounded p-3 max-h-32 overflow-hidden">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-4">
                        {file.code_content.substring(0, 200)}
                        {file.code_content.length > 200 && '...'}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedFile(file)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                      title="View full content"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {onLoadCode && (
                      <button
                        onClick={() => onLoadCode(file)}
                        className="p-2 hover:bg-blue-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                        title="Load into editor"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => downloadFile(file)}
                      className="p-2 hover:bg-green-100 rounded-lg text-gray-500 hover:text-green-600 transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(file)}
                      className="p-2 hover:bg-red-100 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-2 border rounded-lg ${
                  currentPage === i + 1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* File Preview Modal */}
        {selectedFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedFile.title}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedFile.language.toUpperCase()} • {formatDate(selectedFile.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
                <pre className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
                  {selectedFile.code_content}
                </pre>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                {onLoadCode && (
                  <button
                    onClick={() => {
                      onLoadCode(selectedFile);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Load into Editor
                  </button>
                )}
                <button
                  onClick={() => downloadFile(selectedFile)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeHistoryPage;