'use client';

import React from 'react';
import { useSessionLifecycle } from '@/lib/hooks/useSessionLifecycle';
import { SiteAssistantWidget } from '@/components/chat/SiteAssistantWidget';

export function SessionLifecycleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useSessionLifecycle();

  return (
    <>
      {children}
      <SiteAssistantWidget />
    </>
  );
}
