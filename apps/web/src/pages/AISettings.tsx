import { useState, useEffect } from 'react';
import { api } from '../api';

interface AgentTemplate {
  id: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  systemPrompt: string;
}

interface UserAgentBinding {
  id: string;
  channel: string;
  enabled: boolean;
  modelOverride: string | null;
  template: AgentTemplate;
}

interface UserModule {
  waEnabled: boolean;
  tgEnabled: boolean;
  aiEnabled: boolean;
  flowEnabled: boolean;
}

const PROVIDERS = [
  { value: 'OPENAI', label: 'OpenAI (GPT-4, GPT-3.5)' },
  { value: 'DEEPSEEK', label: 'DeepSeek' },
  { value: 'ANTHROPIC', label: 'Anthropic (Claude)' },
  { value: 'GROK', label: 'Grok (xAI)' },
  { value: 'GEMINI', label: 'Google Gemini' },
];

export default function AISettings() {
  const [provider, setProvider] = useState('OPENAI');
  const [apiKey, setApiKey] = useState('');
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [binding, setBinding] = useState<UserAgentBinding | null>(null);
  const [modules, setModules] = useState<UserModule | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadTemplates();
    loadBinding();
    loadModules();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await api.get('/ai/templates');
      setTemplates(res.data.templates || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadBinding = async () => {
    try {
      const res = await api.get('/ai/bind/WA');
      setBinding(res.data.binding);
    } catch (error) {
      console.error('Failed to load binding:', error);
    }
  };

  const loadModules = async () => {
    try {
      const res = await api.get('/modules');
      setModules(res.data.modules);
    } catch (error) {
      console.error('Failed to load modules:', error);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      setMessage('Please enter an API key');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await api.post('/ai/key', { provider, apiKey });
      setMessage('✓ API key saved successfully');
      setApiKey('');
    } catch (error: any) {
      setMessage(`✗ ${error.response?.data?.message || 'Failed to save API key'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBindTemplate = async (templateId: string) => {
    setLoading(true);
    setMessage('');

    try {
      await api.post('/ai/bind', {
        channel: 'WA',
        templateId,
        enabled: true,
      });
      setMessage('✓ Template bound to WhatsApp successfully');
      await loadBinding();
    } catch (error: any) {
      setMessage(`✗ ${error.response?.data?.message || 'Failed to bind template'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAI = async () => {
    if (!modules) return;

    setLoading(true);
    setMessage('');

    try {
      const newValue = !modules.aiEnabled;
      await api.post('/modules', { aiEnabled: newValue });
      setMessage(`✓ AI ${newValue ? 'enabled' : 'disabled'} successfully`);
      await loadModules();
    } catch (error: any) {
      setMessage(`✗ ${error.response?.data?.message || 'Failed to update AI module'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>AI Settings</h1>

      {/* 消息提示 */}
      {message && (
        <div
          style={{
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: message.startsWith('✓') ? '#d4edda' : '#f8d7da',
            color: message.startsWith('✓') ? '#155724' : '#721c24',
            border: `1px solid ${message.startsWith('✓') ? '#c3e6cb' : '#f5c6cb'}`,
          }}
        >
          {message}
        </div>
      )}

      {/* API Key 设置 */}
      <section style={{ marginBottom: '40px' }}>
        <h2>API Credentials</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Enter your API key for the AI provider you want to use. Your key is encrypted and stored securely.
        </p>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <button
          onClick={handleSaveKey}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Saving...' : 'Save API Key'}
        </button>
      </section>

      {/* AI 模块开关 */}
      {modules && (
        <section style={{ marginBottom: '40px' }}>
          <h2>AI Module</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Enable or disable AI auto-reply for your account.
          </p>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={modules.aiEnabled}
              onChange={handleToggleAI}
              disabled={loading}
              style={{ marginRight: '10px', width: '20px', height: '20px' }}
            />
            <span style={{ fontWeight: 'bold' }}>
              AI Auto-Reply {modules.aiEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </section>
      )}

      {/* 当前绑定 */}
      {binding && (
        <section style={{ marginBottom: '40px' }}>
          <h2>Current WhatsApp Binding</h2>
          <div
            style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '4px',
              border: '1px solid #dee2e6',
            }}
          >
            <p>
              <strong>Template:</strong> {binding.template.name}
            </p>
            <p>
              <strong>Provider:</strong> {binding.template.provider}
            </p>
            <p>
              <strong>Model:</strong> {binding.modelOverride || binding.template.model}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span style={{ color: binding.enabled ? 'green' : 'red' }}>
                {binding.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </p>
          </div>
        </section>
      )}

      {/* AI 模板列表 */}
      <section>
        <h2>Available AI Templates</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Choose a template to use for WhatsApp auto-reply. Each template is optimized for different scenarios.
        </p>

        <div style={{ display: 'grid', gap: '15px' }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                padding: '15px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{template.name}</h3>
                  <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                    <strong>Provider:</strong> {template.provider} | <strong>Model:</strong>{' '}
                    {template.model} | <strong>Temperature:</strong> {template.temperature}
                  </p>
                  <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
                    {template.systemPrompt.substring(0, 150)}...
                  </p>
                </div>
                <button
                  onClick={() => handleBindTemplate(template.id)}
                  disabled={loading || binding?.template.id === template.id}
                  style={{
                    marginLeft: '15px',
                    padding: '8px 16px',
                    backgroundColor:
                      binding?.template.id === template.id ? '#28a745' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {binding?.template.id === template.id ? '✓ Active' : 'Bind to WhatsApp'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
