import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { tokenStore } from '../store';

interface Widget {
  id: string;
  publicKey: string;
  allowedOrigins: string;
  name: string;
  createdAt: string;
}

export default function SettingsWidget() {
  const navigate = useNavigate();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [embedCode, setEmbedCode] = useState('');
  const [origins, setOrigins] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 检查登录状态
  useEffect(() => {
    if (!tokenStore.token) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    fetchWidget();
  }, []);

  const fetchWidget = async () => {
    try {
      const res = await api.get('/widget');
      setWidget(res.data.widget);
      setEmbedCode(res.data.embedCode);
      setOrigins(res.data.widget.allowedOrigins || '');
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Widget 不存在，创建一个
        await createWidget();
      } else {
        console.error('Failed to fetch widget:', error);
        setMessage('Failed to load widget settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const createWidget = async () => {
    try {
      const res = await api.post('/widget');
      setWidget(res.data.widget);
      setEmbedCode(res.data.embedCode);
      setOrigins(res.data.widget.allowedOrigins || '');
    } catch (error) {
      console.error('Failed to create widget:', error);
    }
  };

  const saveOrigins = async () => {
    if (!widget) return;

    setSaving(true);
    setMessage('');

    try {
      const res = await api.post('/widget/origins', { allowedOrigins: origins });
      setWidget(res.data.widget);
      setMessage('Origins updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Failed to save origins:', error);
      setMessage(error.response?.data?.message || 'Failed to update origins');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setMessage('Copied to clipboard!');
      setTimeout(() => setMessage(''), 2000);
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/chat')}
          style={{
            padding: '8px 16px',
            background: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ← Back to Chat
        </button>
      </div>

      <h1 style={{ marginBottom: '10px' }}>LiveChat Widget Settings</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Configure your website live chat widget
      </p>

      {message && (
        <div
          style={{
            padding: '12px',
            background: message.includes('Failed') ? '#fee' : '#efe',
            color: message.includes('Failed') ? '#c33' : '#363',
            borderRadius: '6px',
            marginBottom: '20px',
          }}
        >
          {message}
        </div>
      )}

      {widget && (
        <>
          {/* Widget Key */}
          <div style={{ marginBottom: '30px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Widget Key</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <code
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                }}
              >
                {widget.publicKey}
              </code>
              <button
                onClick={() => copyToClipboard(widget.publicKey)}
                style={{
                  padding: '10px 20px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
          </div>

          {/* Allowed Origins */}
          <div style={{ marginBottom: '30px', padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Allowed Origins</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Enter allowed origins (comma-separated). Use * to allow all origins (not recommended for production).
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Example: http://localhost:3000, https://example.com
            </p>
            <textarea
              value={origins}
              onChange={(e) => setOrigins(e.target.value)}
              placeholder="http://localhost:3000, https://example.com"
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '14px',
                marginBottom: '10px',
              }}
            />
            <button
              onClick={saveOrigins}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: saving ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Origins'}
            </button>
          </div>

          {/* Embed Code */}
          <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Embed Code</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Copy this code and paste it into your website's HTML, just before the closing &lt;/body&gt; tag.
            </p>
            <div style={{ position: 'relative' }}>
              <pre
                style={{
                  padding: '15px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  marginBottom: '10px',
                }}
              >
                {embedCode}
              </pre>
              <button
                onClick={() => copyToClipboard(embedCode)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '8px 16px',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                Copy Code
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
