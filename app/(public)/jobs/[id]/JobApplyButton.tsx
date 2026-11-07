'use client';

import { useEffect, useState } from 'react';
import { createApplicationApi } from '../../../../src/utils/api';

export function JobApplyButton({ jobId }: { jobId: string }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  // True once React is attached to this server-rendered button; browser tests wait for it before clicking.
  useEffect(() => setReady(true), []);

  const apply = async () => {
    setBusy(true);
    const result = await createApplicationApi(jobId);
    setMessage(result ? 'Application submitted.' : 'Could not submit. Sign in as a worker and try again.');
    setBusy(false);
  };

  return (
    <div>
      <button type="button" className="btn btn-worker mt-4 w-full" onClick={apply} disabled={busy} data-testid="job-apply" data-ready={ready}>
        {busy ? 'Submitting…' : 'Apply now'}
      </button>
      {message && <p role="status" className="mt-2 text-sm text-[var(--sk-body)]">{message}</p>}
    </div>
  );
}