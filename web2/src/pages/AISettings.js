import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api } from '../api';
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
    const [templates, setTemplates] = useState([]);
    const [binding, setBinding] = useState(null);
    const [modules, setModules] = useState(null);
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
        }
        catch (error) {
            console.error('Failed to load templates:', error);
        }
    };
    const loadBinding = async () => {
        try {
            const res = await api.get('/ai/bind/WA');
            setBinding(res.data.binding);
        }
        catch (error) {
            console.error('Failed to load binding:', error);
        }
    };
    const loadModules = async () => {
        try {
            const res = await api.get('/modules');
            setModules(res.data.modules);
        }
        catch (error) {
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
        }
        catch (error) {
            setMessage(`✗ ${error.response?.data?.message || 'Failed to save API key'}`);
        }
        finally {
            setLoading(false);
        }
    };
    const handleBindTemplate = async (templateId) => {
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
        }
        catch (error) {
            setMessage(`✗ ${error.response?.data?.message || 'Failed to bind template'}`);
        }
        finally {
            setLoading(false);
        }
    };
    const handleToggleAI = async () => {
        if (!modules)
            return;
        setLoading(true);
        setMessage('');
        try {
            const newValue = !modules.aiEnabled;
            await api.post('/modules', { aiEnabled: newValue });
            setMessage(`✓ AI ${newValue ? 'enabled' : 'disabled'} successfully`);
            await loadModules();
        }
        catch (error) {
            setMessage(`✗ ${error.response?.data?.message || 'Failed to update AI module'}`);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { style: { padding: '20px', maxWidth: '900px', margin: '0 auto' }, children: [_jsx("h1", { children: "AI Settings" }), message && (_jsx("div", { style: {
                    padding: '10px',
                    marginBottom: '20px',
                    borderRadius: '4px',
                    backgroundColor: message.startsWith('✓') ? '#d4edda' : '#f8d7da',
                    color: message.startsWith('✓') ? '#155724' : '#721c24',
                    border: `1px solid ${message.startsWith('✓') ? '#c3e6cb' : '#f5c6cb'}`,
                }, children: message })), _jsxs("section", { style: { marginBottom: '40px' }, children: [_jsx("h2", { children: "API Credentials" }), _jsx("p", { style: { color: '#666', marginBottom: '15px' }, children: "Enter your API key for the AI provider you want to use. Your key is encrypted and stored securely." }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "Provider" }), _jsx("select", { value: provider, onChange: (e) => setProvider(e.target.value), style: {
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                }, children: PROVIDERS.map((p) => (_jsx("option", { value: p.value, children: p.label }, p.value))) })] }), _jsxs("div", { style: { marginBottom: '15px' }, children: [_jsx("label", { style: { display: 'block', marginBottom: '5px', fontWeight: 'bold' }, children: "API Key" }), _jsx("input", { type: "password", value: apiKey, onChange: (e) => setApiKey(e.target.value), placeholder: "sk-...", style: {
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                } })] }), _jsx("button", { onClick: handleSaveKey, disabled: loading, style: {
                            padding: '10px 20px',
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                        }, children: loading ? 'Saving...' : 'Save API Key' })] }), modules && (_jsxs("section", { style: { marginBottom: '40px' }, children: [_jsx("h2", { children: "AI Module" }), _jsx("p", { style: { color: '#666', marginBottom: '15px' }, children: "Enable or disable AI auto-reply for your account." }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', cursor: 'pointer' }, children: [_jsx("input", { type: "checkbox", checked: modules.aiEnabled, onChange: handleToggleAI, disabled: loading, style: { marginRight: '10px', width: '20px', height: '20px' } }), _jsxs("span", { style: { fontWeight: 'bold' }, children: ["AI Auto-Reply ", modules.aiEnabled ? 'Enabled' : 'Disabled'] })] })] })), binding && (_jsxs("section", { style: { marginBottom: '40px' }, children: [_jsx("h2", { children: "Current WhatsApp Binding" }), _jsxs("div", { style: {
                            padding: '15px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6',
                        }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Template:" }), " ", binding.template.name] }), _jsxs("p", { children: [_jsx("strong", { children: "Provider:" }), " ", binding.template.provider] }), _jsxs("p", { children: [_jsx("strong", { children: "Model:" }), " ", binding.modelOverride || binding.template.model] }), _jsxs("p", { children: [_jsx("strong", { children: "Status:" }), ' ', _jsx("span", { style: { color: binding.enabled ? 'green' : 'red' }, children: binding.enabled ? 'Enabled' : 'Disabled' })] })] })] })), _jsxs("section", { children: [_jsx("h2", { children: "Available AI Templates" }), _jsx("p", { style: { color: '#666', marginBottom: '15px' }, children: "Choose a template to use for WhatsApp auto-reply. Each template is optimized for different scenarios." }), _jsx("div", { style: { display: 'grid', gap: '15px' }, children: templates.map((template) => (_jsx("div", { style: {
                                padding: '15px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                backgroundColor: '#fff',
                            }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'start' }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("h3", { style: { margin: '0 0 10px 0' }, children: template.name }), _jsxs("p", { style: { margin: '5px 0', color: '#666', fontSize: '14px' }, children: [_jsx("strong", { children: "Provider:" }), " ", template.provider, " | ", _jsx("strong", { children: "Model:" }), ' ', template.model, " | ", _jsx("strong", { children: "Temperature:" }), " ", template.temperature] }), _jsxs("p", { style: { margin: '10px 0 0 0', fontSize: '14px', color: '#666' }, children: [template.systemPrompt.substring(0, 150), "..."] })] }), _jsx("button", { onClick: () => handleBindTemplate(template.id), disabled: loading || binding?.template.id === template.id, style: {
                                            marginLeft: '15px',
                                            padding: '8px 16px',
                                            backgroundColor: binding?.template.id === template.id ? '#28a745' : '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            whiteSpace: 'nowrap',
                                        }, children: binding?.template.id === template.id ? '✓ Active' : 'Bind to WhatsApp' })] }) }, template.id))) })] })] }));
}
