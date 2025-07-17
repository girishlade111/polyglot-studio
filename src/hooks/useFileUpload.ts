import { useCallback, useState } from 'react';
import { EditorLanguage } from '../types';

interface FileUploadState {
  isUploading: boolean;
  uploadedFiles: Array<{
    name: string;
    language: EditorLanguage;
    size: number;
  }>;
  errors: string[];
}

interface UseFileUploadProps {
  onHtmlUpload?: (content: string, filename: string) => void;
  onCssUpload?: (content: string, filename: string) => void;
  onJsUpload?: (content: string, filename: string) => void;
  onMultipleUpload?: (files: Array<{
    language: EditorLanguage;
    content: string;
    filename: string;
  }>) => void;
}

export const useFileUpload = ({
  onHtmlUpload,
  onCssUpload,
  onJsUpload,
  onMultipleUpload
}: UseFileUploadProps) => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    uploadedFiles: [],
    errors: []
  });

  const detectLanguage = useCallback((filename: string): EditorLanguage | null => {
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

  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size (1MB limit)
    if (file.size > 1024 * 1024) {
      return { isValid: false, error: 'File too large (max 1MB)' };
    }

    // Check file type
    const language = detectLanguage(file.name);
    if (!language) {
      return { isValid: false, error: 'Unsupported file type' };
    }

    return { isValid: true };
  }, [detectLanguage]);

  const processFile = useCallback(async (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const language = detectLanguage(file.name)!;
    const content = await file.text();

    // Basic content validation
    if (!content.trim()) {
      throw new Error('File is empty');
    }

    return {
      language,
      content,
      filename: file.name,
      size: file.size
    };
  }, [validateFile, detectLanguage]);

  const uploadFiles = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    setUploadState(prev => ({ ...prev, isUploading: true, errors: [] }));

    try {
      const processedFiles = [];
      const errors = [];

      // Process all files
      for (let i = 0; i < files.length; i++) {
        try {
          const processed = await processFile(files[i]);
          processedFiles.push(processed);
        } catch (error) {
          errors.push(`${files[i].name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Update state with results
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadedFiles: processedFiles.map(f => ({
          name: f.filename,
          language: f.language,
          size: f.size
        })),
        errors
      }));

      // Call appropriate handlers
      if (processedFiles.length === 1) {
        const file = processedFiles[0];
        switch (file.language) {
          case 'html':
            onHtmlUpload?.(file.content, file.filename);
            break;
          case 'css':
            onCssUpload?.(file.content, file.filename);
            break;
          case 'javascript':
            onJsUpload?.(file.content, file.filename);
            break;
        }
      } else if (processedFiles.length > 1) {
        onMultipleUpload?.(processedFiles);
      }

      // Clear uploaded files after 3 seconds
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, uploadedFiles: [] }));
      }, 3000);

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        errors: [error instanceof Error ? error.message : 'Upload failed']
      }));
    }
  }, [processFile, onHtmlUpload, onCssUpload, onJsUpload, onMultipleUpload]);

  const clearErrors = useCallback(() => {
    setUploadState(prev => ({ ...prev, errors: [] }));
  }, []);

  const clearUploadedFiles = useCallback(() => {
    setUploadState(prev => ({ ...prev, uploadedFiles: [] }));
  }, []);

  return {
    uploadFiles,
    uploadState,
    clearErrors,
    clearUploadedFiles
  };
};