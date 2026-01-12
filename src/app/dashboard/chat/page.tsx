'use client';

import FinancialAnalysisChat from '@/components/dashboard/FinancialAnalysisChat';
import { useState } from 'react';

export default function ChatPage() {
  const [currentChatId, setCurrentChatId] = useState<string>('default');

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-[#020617] flex">
      <FinancialAnalysisChat 
        key={currentChatId}
        currentChatId={currentChatId} 
        onChatIdChange={setCurrentChatId} 
      />
    </div>
  );
}
