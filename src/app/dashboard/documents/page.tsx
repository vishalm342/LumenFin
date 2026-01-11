import DocumentVault from '@/components/dashboard/DocumentVault';

export default function DocumentsPage() {
  return (
    <div className="h-full p-8 bg-[#020617]">
      <div className="h-full max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Document Vault</h1>
        <div className="h-[calc(100%-4rem)]">
          <DocumentVault />
        </div>
      </div>
    </div>
  );
}
