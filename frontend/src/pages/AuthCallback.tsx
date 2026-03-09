import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleCallback } from '../auth/ias';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback()
      .then((returnPath) => navigate(returnPath, { replace: true }))
      .catch((err: Error) => setError(err.message));
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#bb0000' }}>
        Authentication failed: {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '4rem', textAlign: 'center', color: '#6e7e8e' }}>
      Completing sign-in…
    </div>
  );
}
