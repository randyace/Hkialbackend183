import { useState } from 'react';
import { LoungeLayout, type LoungeLayoutSuite } from '../../app/components/LoungeLayout';
import { initialSuites } from '../LoungeLayout.fixture';

export function LoungeLayoutPreview() {
  const [suites, setSuites] = useState<LoungeLayoutSuite[]>(initialSuites);

  return (
    <LoungeLayout
      suites={suites}
      onSuitePositionChange={(id, position) =>
        setSuites((prev) => prev.map((s) => (s.id === id ? { ...s, position } : s)))
      }
      onSaveLayout={() => undefined}
      onResetLayout={() => setSuites(initialSuites)}
    />
  );
}
