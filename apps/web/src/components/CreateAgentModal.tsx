import React, { useState } from 'react';
import { Select } from './ui/select';
import { Input } from './ui/input';
import { Button } from './ui/button';

export interface NewAgent {
  name: string;
  avatarUrl: string;
  color?: string;
  description?: string;
  role: string;
  character: string;
  expertise: string;
  language?: string;
  background?: string;
  prompt: string;
  responseStyle: string;
  constraints?: string;
  examples?: string[];
  tags?: string[];
  provider: string;
  model: string;
  temperature: number;
}

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: NewAgent) => void;
}

const PROVIDERS = [
  { value: 'OPENAI', label: 'OpenAI', model: 'gpt-4o-mini' },
  { value: 'DEEPSEEK', label: 'DeepSeek', model: 'deepseek-chat' },
  { value: 'ANTHROPIC', label: 'Anthropic', model: 'anthropic-model' },
  { value: 'GROK', label: 'Grok', model: 'grok-model' },
  { value: 'GEMINI', label: 'Google Gemini', model: 'gemini-model' },
];

const ROLES = [
  { value: 'owner', label: '主持人' },
  { value: 'participant', label: '参与者' },
];

const DEFAULT_AGENT: NewAgent = {
  name: '',
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=12345',
  color: 'blue',
  description: '',
  role: 'participant',
  character: '',
  expertise: '',
  language: '',
  background: '',
  prompt: '',
  responseStyle: '',
  constraints: '',
  examples: [],
  tags: [],
  provider: 'OPENAI',
  model: 'gpt-4o-mini',
  temperature: 0.7,
};

const fieldStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #6bd3db',
  borderRadius: '8px',
  fontSize: '14px',
  backgroundColor: 'rgba(255,255,255,0.1)',
  color: '#fff',
};

export default function CreateAgentModal({ isOpen, onClose, onSave }: CreateAgentModalProps) {
  const [formData, setFormData] = useState<NewAgent>({ ...DEFAULT_AGENT });

  if (!isOpen) return null;

  const handleChange = (field: keyof NewAgent, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.prompt.trim()) {
      alert('请填写智能体名称和 Prompt');
      return;
    }
    onSave(formData);
    setFormData({ ...DEFAULT_AGENT });
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1e1e1e',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          color: '#fff',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #333',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>创建智能体</h2>
          <Button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '22px',
              cursor: 'pointer',
              borderRadius: '8px',
              padding: '4px 8px',
            }}
          >
            ×
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Name */}
          <Field label="名称 *">
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="请输入智能体名称"
              style={fieldStyle}
              required
            />
          </Field>

          {/* Avatar */}
          <Field label="头像 URL">
            <Input
              type="text"
              value={formData.avatarUrl}
              onChange={(e) => handleChange('avatarUrl', e.target.value)}
              placeholder="https://api.dicebear.com/7.x/bottts/svg?seed=12345"
              style={fieldStyle}
            />
          </Field>

          {/* Role */}
          <Field label="角色">
            <select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              style={fieldStyle}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Character */}
          <Field label="性格特征">
            <Input
              type="text"
              value={formData.character}
              onChange={(e) => handleChange('character', e.target.value)}
              placeholder="例如：理性、开放、谨慎"
              style={fieldStyle}
            />
          </Field>

          {/* Expertise */}
          <Field label="专业领域">
            <Input
              type="text"
              value={formData.expertise}
              onChange={(e) => handleChange('expertise', e.target.value)}
              placeholder="客户服务, 技术支持"
              style={fieldStyle}
            />
          </Field>

          {/* Provider */}
          <Field label="AI 提供商">
            <select
              value={formData.provider}
              onChange={(e) => handleChange('provider', e.target.value)}
              style={fieldStyle}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Model */}
          <Field label="模型">
            <Input
              type="text"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="gpt-4, deepseek-chat..."
              style={fieldStyle}
            />
          </Field>

          {/* Temperature */}
          <Field label={`Temperature: ${formData.temperature}`}>
            <Input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </Field>

          {/* Prompt */}
          <Field label="Prompt *">
            <textarea
              value={formData.prompt}
              onChange={(e) => handleChange('prompt', e.target.value)}
              placeholder="输入智能体的系统提示词..."
              rows={5}
              style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit' }}
              required
            />
          </Field>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <Button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #555',
                borderRadius: '8px',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#007bff',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// small reusable field wrapper
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          fontWeight: 500,
          color: '#b0e0e6',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
