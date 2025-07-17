import React, { useCallback } from 'react';
import { EditorLanguage } from '../types';

interface FileUploadHandlerProps {
  onFileUpload: (language: EditorLanguage, content: string, filename: string) => void;
  onMultipleFilesUpload: (files: { language: EditorLanguage; content: string; filename: string }[]) => void;
}

export interface UploadedFile {
  language: EditorLanguage;
  content: string;
  filename: string;
  size: number;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({
  onFileUpload,
  onMultipleFilesUpload
}) => {
  const detectLanguageFromFile = useCallback((filename: string): EditorLanguage | null => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'html':
      case 'htm':
        return 'html';
      case 'css':
        return 'css';
      case 'js':
      case 'javascript':
        return 'javascript';
      default:
        return null;
    }
  }, []);

  const validateFileSize = useCallback((file: File): boolean => {
    const maxSize = 1024 * 1024; // 1MB
    return file.size <= maxSize;
  }, []);

  const validateFileContent = useCallback((content: string, language: EditorLanguage): boolean => {
    // Basic content validation
    if (!content.trim()) return false;
    
    switch (language) {
      case 'html':
        // Check for basic HTML structure or tags
        return content.includes('<') && content.includes('>');
      case 'css':
        // Check for CSS syntax (selectors, properties)
        return content.includes('{') && content.includes('}') || content.includes(':');
      case 'javascript':
        // Basic JS validation - allow any text for flexibility
        return true;
      default:
        return true;
    }
  }, []);

  const processFiles = useCallback(async (files: FileList): Promise<UploadedFile[]> => {
    const processedFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Validate file size
        if (!validateFileSize(file)) {
          errors.push(`${file.name}: File too large (max 1MB)`);
          continue;
        }

        // Detect language
        const language = detectLanguageFromFile(file.name);
        if (!language) {
          errors.push(`${file.name}: Unsupported file type`);
          continue;
        }

        // Read file content
        const content = await file.text();

        // Validate content
        if (!validateFileContent(content, language)) {
          errors.push(`${file.name}: Invalid ${language.toUpperCase()} content`);
          continue;
        }

        processedFiles.push({
          language,
          content,
          filename: file.name,
          size: file.size
        });

      } catch (error) {
        errors.push(`${file.name}: Failed to read file`);
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      console.warn('File upload errors:', errors);
      // You could show a toast notification here
    }

    return processedFiles;
  }, [detectLanguageFromFile, validateFileSize, validateFileContent]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    const processedFiles = await processFiles(files);
    
    if (processedFiles.length === 0) {
      console.warn('No valid files to upload');
      return;
    }

    if (processedFiles.length === 1) {
      const file = processedFiles[0];
      onFileUpload(file.language, file.content, file.filename);
    } else {
      onMultipleFilesUpload(processedFiles);
    }
  }, [processFiles, onFileUpload, onMultipleFilesUpload]);

  // This component doesn't render anything, it just provides the handler
  return null;
};

export default FileUploadHandler;
export type { UploadedFile };