import { useState } from 'react';
import type { ReactNode } from 'react';
import './AgeVerificationGate.css';

const STORAGE_KEY = 'tpapi_age_verified';

type Status = 'pending' | 'denied';

export function AgeVerificationGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status | 'verified'>(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true' ? 'verified' : 'pending';
  });

  if (status === 'verified') return <>{children}</>;

  const handleConfirm = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setStatus('verified');
  };

  const handleDeny = () => {
    setStatus('denied');
  };

  if (status === 'denied') {
    return (
      <div className="age-gate-page">
        <div className="age-gate-card">
          <div className="age-gate-icon age-gate-icon--denied">✕</div>
          <h1 className="age-gate-title">Access Restricted</h1>
          <p className="age-gate-body">
            You must be 18 years of age or older to access the TPAPI Order Portal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="age-gate-page">
      <div className="age-gate-card">
        <div className="age-gate-logo">
          <span className="age-gate-logo-mark">TP</span>
          <span className="age-gate-logo-text">TPAPI Portal</span>
        </div>

        <div className="age-gate-icon">18+</div>
        <h1 className="age-gate-title">Age Verification Required</h1>
        <p className="age-gate-body">
          By entering this site you confirm that you are <strong>18 years of age or older</strong>.
          Access is restricted to adults only.
        </p>

        <div className="age-gate-actions">
          <button className="age-gate-btn age-gate-btn--confirm" onClick={handleConfirm}>
            I am 18 or older — Enter
          </button>
          <button className="age-gate-btn age-gate-btn--deny" onClick={handleDeny}>
            I am under 18 — Exit
          </button>
        </div>

        <p className="age-gate-notice">
          This site uses a cookie to remember your age verification.
        </p>
      </div>
    </div>
  );
}
