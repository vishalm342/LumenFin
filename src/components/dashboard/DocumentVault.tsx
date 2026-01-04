'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UploadedDocument {
  id: string;
  name: string;
  status: 'uploading' | 'uploaded' | 'error';
  uploadedAt?: Date;
}

export default function DocumentVault() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load documents from localStorage on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('lumenfin_documents');
    if (savedDocs) {
      try {
        const parsed = JSON.parse(savedDocs);
        // Convert string dates back to Date objects and handle interrupted uploads
        const formatted = parsed.map((doc: any) => ({
          ...doc,
          status: doc.status === 'uploading' ? 'error' : doc.status,
          uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : undefined
        }));
        setDocuments(formatted);
      } catch (e) {
        console.error('Failed to parse saved documents', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save documents to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('lumenfin_documents', JSON.stringify(documents));
    }
  }, [documents, isLoaded]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setErrorMessage('');
    
    for (const file of acceptedFiles) {
      if (file.type !== 'application/pdf') {
        setErrorMessage('Only PDF files are supported. Please upload a PDF.');
        setTimeout(() => setErrorMessage(''), 5000);
        continue;
      }

      const tempId = `temp-${Date.now()}-${Math.random()}`;
      setDocuments(prev => [...prev, {
        id: tempId,
        name: file.name,
        status: 'uploading',
      }]);

      setIsUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        setDocuments(prev => prev.map(doc => 
          doc.id === tempId 
            ? { ...doc, status: 'uploaded' as const, uploadedAt: new Date() }
            : doc
        ));

      } catch (error) {
        console.error('Upload error:', error);
        setErrorMessage(`Failed to upload ${file.name}. Please try again.`);
        setTimeout(() => setErrorMessage(''), 5000);
        setDocuments(prev => prev.map(doc => 
          doc.id === tempId 
            ? { ...doc, status: 'error' as const }
            : doc
        ));
      } finally {
        setIsUploading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  return (
    <div className="bg-[#0f172a]/50 backdrop-blur-xl rounded-xl h-full border border-[#1e293b] flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-[#1e293b]/50">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-1">Document Vault</h2>
          <p className="text-xs text-slate-500">{documents.length} document{documents.length !== 1 ? 's' : ''} uploaded</p>
        </div>
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          <Button 
            size="sm"
            className="bg-[#10b981] hover:bg-[#059669] text-white"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload a file
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      )}

      {/* Document List */}
      <ScrollArea className="flex-1 p-6">
        {documents.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-[#10b981] bg-[#10b981]/10' 
                : 'border-[#1e293b] hover:border-slate-600'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 text-slate-500" size={48} />
            <p className="text-slate-400 mb-2">
              {isDragActive ? 'Drop files here...' : 'Drag & drop PDF files here'}
            </p>
            <p className="text-slate-500 text-sm">or click to browse</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center gap-4 p-4 bg-[#0f172a] rounded-xl border border-[#1e293b] hover:border-[#10b981]/50 hover:bg-[#0f172a]/80 transition-all"
              >
                <div className="p-2 bg-[#10b981]/10 rounded-lg">
                  <FileText className="text-[#10b981] flex-shrink-0" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{doc.name}</p>
                  {doc.uploadedAt && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === 'uploaded' && (
                    <>
                      <Badge className="bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/30">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    </>
                  )}
                  {doc.status === 'error' && (
                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  {doc.status === 'uploading' && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-[#10b981] animate-spin" />
                      <span className="text-xs text-slate-400">Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
