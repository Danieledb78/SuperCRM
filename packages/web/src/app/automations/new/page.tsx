'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WorkflowBuilder from '@/components/automations/workflow-builder';

export default function NewAutomationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template');

  const [saving, setSaving] = useState(false);

  const handleSave = async (automation: any) => {
    setSaving(true);
    try {
      // TODO: Replace with actual API call
      console.log('Saving automation:', automation);

      // await fetch('/api/automations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(automation)
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      router.push('/automations');
    } catch (error) {
      console.error('Error saving automation:', error);
      alert('Errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <WorkflowBuilder
        templateId={templateId}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
