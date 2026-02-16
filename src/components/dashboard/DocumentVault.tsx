'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface UploadedDocument {
  fileName: string;
  chunkCount: number;
  uploadedAt: string;
}

export default function DocumentVault() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Polling fallback: Refresh list when component becomes visible or after upload timeout
  // This ensures the list updates even if the browser refreshed or the upload response was lost
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !isUploading) {
        console.log('📋 Tab became visible, refreshing document list...');
        fetchDocuments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchDocuments, isUploading]);

  const handleDelete = async (fileName: string) => {
    const toastId = toast.loading('Deleting document...');

    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });

      if (!response.ok) throw new Error('Delete failed');

      toast.success('Document removed', { id: toastId });

      // Update local state immediately
      setDocuments(prev => prev.filter(doc => doc.fileName !== fileName));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document', { id: toastId });
    }
  };

  const handleResetVault = async () => {
    const toastId = toast.loading('Resetting vault...');

    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAll: true }),
      });

      if (!response.ok) throw new Error('Reset failed');

      toast.success('Vault reset successfully', { id: toastId });

      // Refresh the file list
      fetchDocuments();
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Failed to reset vault', { id: toastId });
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF`);
        continue;
      }

      setIsUploading(true);
      const toastId = toast.loading(`Processing ${file.name}...`);

      try {
        const formData = new FormData();
        formData.append('file', file);

        console.log(`🚀 Starting upload: ${file.name}`);
        const response = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          // 1. Show Green Success Toast immediately
          toast.success(`${file.name} processed successfully!`, { id: toastId });
          console.log(`✅ Upload successful: ${file.name}`);

          // 2. FORCE REFRESH the document list (await to ensure it completes)
          console.log('🔄 Refreshing document list...');
          await fetchDocuments();
          console.log('✅ Document list refreshed');

          // 3. Reset Loading State (will also happen in finally, but explicit here for clarity)
          setIsUploading(false);
        } else {
          // Handle Error
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || `HTTP ${response.status}`;
          console.error(`❌ Upload failed: ${errorMessage}`);
          toast.error(`Upload failed: ${errorMessage}`, { id: toastId });
          setIsUploading(false);
        }

      } catch (error: any) {
        console.error('❌ Upload error:', error);
        toast.error(`Upload failed: ${error.message}`, { id: toastId });
      } finally {
        // CRITICAL: Always reset loading state, even if something goes wrong
        setIsUploading(false);
        console.log('🔓 Upload state reset');
      }
    }
  }, [fetchDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    maxFiles: 5,
    disabled: isUploading
  });

  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-xl h-full border border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-bold tracking-tight text-slate-200 mb-1">Document Vault</h2>
        <p className="text-sm text-slate-400">
          Upload financial reports (PDF) for AI analysis.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="p-6 pb-2">
        <div className="flex items-center justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetVault}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 text-xs"
            disabled={isUploading}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Reset Vault
          </Button>
        </div>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive
              ? 'border-[#10b981] bg-[#10b981]/10'
              : 'border-slate-800 hover:border-slate-600 hover:bg-slate-800/50'
            } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <Loader2 className="w-10 h-10 text-[#10b981] animate-spin" />
            ) : (
              <Upload className={`w-10 h-10 ${isDragActive ? 'text-[#10b981]' : 'text-slate-500'}`} />
            )}

            <div>
              <p className="text-slate-200 font-medium font-lg">
                {isUploading ? 'Processing...' : isDragActive ? 'Drop PDF now' : 'Drag & drop PDF here'}
              </p>
              {!isUploading && (
                <p className="text-sm text-slate-400 mt-1">or click to browse</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-2">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Uploaded Documents ({documents.length})
          </h3>
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.fileName}
                  className="group flex items-center gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800 hover:border-[#10b981]/30 transition-all"
                >
                  <div className="p-2 bg-[#10b981]/10 rounded-lg">
                    <FileText className="text-[#10b981] w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-200 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{doc.chunkCount} chunks</span>
                      <span>•</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(doc.fileName)}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
