import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customersApi } from '../../api/customers';
import { useAuth } from '../../auth/AuthContext';
import './Onboarding.css';

type Step = 'register' | 'get-key' | 'first-call' | 'done';

export function Onboarding() {
  const { authenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('register');
  const [form, setForm] = useState({
    companyName: '', email: '', phone: '',
    address: '', city: '', country: '', taxId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await customersApi.register(form);
      setCustomerId(res.customerId);
      setStep('get-key');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS: { id: Step; label: string }[] = [
    { id: 'register', label: '1. Register' },
    { id: 'get-key', label: '2. Get API Key' },
    { id: 'first-call', label: '3. First API Call' },
    { id: 'done', label: '4. You\'re live!' },
  ];

  return (
    <div className="onboarding-page">
      <div className="ob-hero">
        <h1 className="dev-page-title">Get Started with TPAPI</h1>
        <p className="dev-page-subtitle">
          Go from zero to your first API call in 4 steps.
        </p>
      </div>

      <div className="ob-stepper">
        {STEPS.map(({ id, label }, i) => (
          <div key={id} className={`ob-step ${step === id ? 'active' : ''} ${STEPS.findIndex(s => s.id === step) > i ? 'done' : ''}`}>
            <div className="ob-step-dot">{STEPS.findIndex(s => s.id === step) > i ? '✓' : i + 1}</div>
            <span className="ob-step-label">{label}</span>
          </div>
        ))}
      </div>

      <div className="ob-content">
        {step === 'register' && (
          <div className="ob-card">
            <h2 className="ob-card-title">Register Your Company</h2>
            {!authenticated ? (
              <div className="ob-auth-gate">
                <p>Sign in with your SAP IAS account to register.</p>
                <button className="ob-primary-btn" onClick={() => navigate('/login')}>
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <form className="ob-form" onSubmit={handleRegister}>
                <div className="ob-form-grid">
                  {[
                    { key: 'companyName', label: 'Company Name', placeholder: 'Acme Corp' },
                    { key: 'email', label: 'Business Email', placeholder: 'you@acme.com', type: 'email' },
                    { key: 'phone', label: 'Phone', placeholder: '+1 555 000 0000' },
                    { key: 'taxId', label: 'Tax ID / VAT Number', placeholder: 'US123456789' },
                    { key: 'address', label: 'Address', placeholder: '123 Main St' },
                    { key: 'city', label: 'City', placeholder: 'Phoenix' },
                    { key: 'country', label: 'Country', placeholder: 'US' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key} className="ob-field">
                      <label>{label}</label>
                      <input
                        required
                        type={type ?? 'text'}
                        className="ob-input"
                        placeholder={placeholder}
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                {error && <div className="ob-error">{error}</div>}
                <button type="submit" className="ob-primary-btn" disabled={submitting}>
                  {submitting ? 'Registering…' : 'Register Company →'}
                </button>
              </form>
            )}
          </div>
        )}

        {step === 'get-key' && (
          <div className="ob-card">
            <h2 className="ob-card-title">Request an API Key</h2>
            <div className="ob-success-note">
              Company registered! Customer ID: <code>{customerId}</code>
            </div>
            <p className="ob-text">Head to the API Keys section to request credentials for your first API product.</p>
            <div className="ob-actions">
              <button className="ob-primary-btn" onClick={() => navigate('/devportal/keys')}>
                Go to API Keys →
              </button>
              <button className="ob-ghost-btn" onClick={() => setStep('first-call')}>
                I already have a key
              </button>
            </div>
          </div>
        )}

        {step === 'first-call' && (
          <div className="ob-card">
            <h2 className="ob-card-title">Make Your First API Call</h2>
            <p className="ob-text">Try the Product Catalog API — no order required:</p>
            <pre className="ob-code">{`curl https://api.tpapi.io/products \\
  -H "x-api-key: YOUR_API_KEY"
`}</pre>
            <p className="ob-text">Or use the interactive playground:</p>
            <div className="ob-actions">
              <button className="ob-primary-btn" onClick={() => navigate('/devportal/playground')}>
                Open Playground →
              </button>
              <button className="ob-ghost-btn" onClick={() => setStep('done')}>
                I made my first call!
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="ob-card ob-done-card">
            <div className="ob-done-icon">🎉</div>
            <h2 className="ob-card-title">You're live with TPAPI!</h2>
            <p className="ob-text">
              You can now place orders, check shipments, download invoices,
              and integrate the full O2C cycle via API.
            </p>
            <div className="ob-actions">
              <button className="ob-primary-btn" onClick={() => navigate('/devportal/apis')}>
                Explore All APIs
              </button>
              <button className="ob-ghost-btn" onClick={() => navigate('/portal')}>
                Go to Order Portal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
