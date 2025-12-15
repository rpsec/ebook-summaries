import React, { ChangeEvent, useState } from 'react';
import { Upload, AlertCircle, FileType } from 'lucide-react';
import { FileData } from '../types';

interface UploadZoneProps {
  onFileSelected: (data: FileData) => void;
  disabled: boolean;
}

const MAX_FILE_SIZE_MB = 20;

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelected, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    const name = file.name.toLowerCase();
    
    // Warn about MOBI
    if (name.endsWith('.mobi')) {
      setError("MOBI format is not supported directly. Please convert to EPUB or PDF.");
      return;
    }

    const validTypes = ['application/pdf', 'text/plain', 'application/epub+zip'];
    // Check mime type OR extension because some systems don't map .epub correctly
    const isValidType = validTypes.includes(file.type) || 
                        name.endsWith('.pdf') || 
                        name.endsWith('.txt') || 
                        name.endsWith('.epub');
    
    if (!isValidType) {
       setError("Please upload a PDF, EPUB, or TXT file.");
       return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const base64 = (e.target.result as string).split(',')[1]; // Remove data url prefix
        
        // Detect standard mime type, default to octet-stream if unknown, but logic in App.tsx handles extensions
        let mimeType = file.type;
        if (name.endsWith('.pdf')) mimeType = 'application/pdf';
        if (name.endsWith('.txt')) mimeType = 'text/plain';
        if (name.endsWith('.epub')) mimeType = 'application/epub+zip';

        onFileSelected({
          file,
          base64,
          mimeType,
        });
      }
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsDataURL(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 transition-all text-center group ${
          dragActive 
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 scale-[1.02]" 
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={!disabled ? handleDrag : undefined}
        onDragLeave={!disabled ? handleDrag : undefined}
        onDragOver={!disabled ? handleDrag : undefined}
        onDrop={!disabled ? handleDrop : undefined}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          onChange={handleChange}
          accept=".pdf,.txt,.epub"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full transition-colors ${dragActive ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50'}`}>
            <Upload className={`w-8 h-8 ${dragActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'}`} />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              Drop your Ebook here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              PDF, EPUB, or TXT supported
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 py-1 px-3 rounded-full w-fit mx-auto">
              <FileType className="w-3 h-3" />
              <span>MOBI users: Please convert to EPUB</span>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 flex items-start text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/30 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};