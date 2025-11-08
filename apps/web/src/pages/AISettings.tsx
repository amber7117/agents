'use client';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { tokenStore } from '../store';

// Interfaces
interface MetronicTheme {
  colors: {
    primary: string;
    success: string;
    warning: string;
    danger: string;
    white: string;
    gray100: string;
    gray300: string;
    gray600: string;
    gray900: string;
  };
}

interface AIProvider {
  id: string;
  name: string;
  models: string[];
}

interface Channel {
  id: string;
  name: string;
  icon: string;
}

interface AIConfig {
  provider: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface User {
  email: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  color?: string;
  provider: string;
  model: string;
}

interface Binding {
  id: string;
  channel: string;
  userId?: string;
  user?: User;
  template?: Template;
  enabled: boolean;
  modelOverride?: string;
}

interface ConfigResponse {
  config: AIConfig;
  isGlobal: boolean;
}

interface BindingsResponse {
  bindings: Binding[];
}

interface TemplatesResponse {
  templates: Template[];
}

interface ConfigFormProps {
  config: AIConfig | null;
  setConfig: (config: AIConfig | null) => void;
}

interface ConfigTabProps {
  config: AIConfig | null;
  setConfig: (config: AIConfig | null) => void;
  onSave: () => void;
  saving: boolean;
}

interface BindingsTabProps {
  bindings: Binding[];
  templates: Template[];
  onCreate: () => void;
  onDelete: (id: string) => void;
}

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

// Metronic 主题颜色

// Metronic 风格的主题配置
const metronicTheme: MetronicTheme = {
  colors: {
    primary: '#009EF7',
    success: '#50CD89',
    warning: '#FFC700',
    danger: '#F1416C',
    white: '#FFFFFF',
    gray100: '#F9F9F9',
    gray300: '#E1E3EA',
    gray600: '#7E8299',
    gray900: '#181C32',
  },
};

// AI Providers 配置
const PROVIDERS: AIProvider[] = [
  { id: 'OPENAI', name: 'OpenAI', models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'DEEPSEEK', name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'ANTHROPIC', name: 'Anthropic', models: ['claude-3-5-sonnet', 'claude-3-haiku'] },
  { id: 'GOOGLE', name: 'Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
  { id: 'XAI', name: 'xAI', models: ['grok-beta'] },
];

const CHANNELS: Channel[] = [
  { id: 'WHATSAPP', name: 'WhatsApp', icon: '💬' },
  { id: 'TELEGRAM', name: 'Telegram', icon: '✈️' },
  { id: 'WEB', name: 'Web Widget', icon: '🌐' },
  { id: 'API', name: 'API', icon: '🔌' },
];

type ActiveTab = 'apikey' | 'global' | 'user' | 'bindings';

export default function AISettings(): JSX.Element {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('apikey');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // API Key 管理
  const [provider, setProvider] = useState<string>('OPENAI');
  const [apiKey, setApiKey] = useState<string>('');
  const [savedKeys, setSavedKeys] = useState<Record<string, boolean>>({});

  // 全局配置
  const [globalConfig, setGlobalConfig] = useState<AIConfig | null>(null);

  // 用户配置
  const [userConfig, setUserConfig] = useState<AIConfig | null>(null);

  // 绑定列表
  const [bindings, setBindings] = useState<Binding[]>([]);

  // 智能体模板列表
  const [templates, setTemplates] = useState<Template[]>([]);

  // 检查登录状态
  useEffect(() => {
    if (!tokenStore.token) {
      nav('/login');
      return;
    }
  }, [nav]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [activeTab]); const loadData = async (): Promise<void> => {
    setLoading(true);
    try {
      if (activeTab === 'apikey') {
        // 加载已保存的 API Keys
        const { data }: { data: { keys: Record<string, boolean> } } = await api.get('/ai/keys');
        setSavedKeys(data.keys || {});
      } else if (activeTab === 'global' || activeTab === 'user') {
        const { data }: { data: ConfigResponse } = await api.get('/ai/config');
        if (data.config) {
          if (data.isGlobal) {
            setGlobalConfig(data.config);
          } else {
            setUserConfig(data.config);
          }
        }
      } else if (activeTab === 'bindings') {
        const { data }: { data: BindingsResponse } = await api.get('/ai/bindings');
        setBindings(data.bindings || []);

        // 加载模板列表（智能体）
        const templatesRes: { data: TemplatesResponse } = await api.get('/ai/templates');
        setTemplates(templatesRes.data.templates || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (isGlobal: boolean): Promise<void> => {
    setSaving(true);
    try {
      const configToSave = isGlobal ? globalConfig : userConfig;
      await api.post('/ai/config', {
        ...configToSave,
        isGlobal,
      });
      alert('✅ 配置已保存');
    } catch (error) {
      alert('❌ 保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKey = async (): Promise<void> => {
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }

    setSaving(true);
    try {
      await api.post('/ai/key', { provider, apiKey });
      alert('✅ API Key 已保存');
      setApiKey('');
      loadData(); // 重新加载已保存的 keys
    } catch (error: any) {
      alert(`❌ ${error.response?.data?.message || '保存失败'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBinding = async (): Promise<void> => {
    // TODO: 实现创建绑定的逻辑
    alert('创建绑定功能开发中...');
  };

  const handleDeleteBinding = async (id: string): Promise<void> => {
    if (!window.confirm('确定要删除此绑定吗？')) return;

    try {
      await api.delete(`/ai/bindings/${id}`);
      alert('✅ 绑定已删除');
      loadData();
    } catch (error) {
      alert('❌ 删除失败');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: metronicTheme.colors.white,
      padding: '30px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: metronicTheme.colors.gray900,
            margin: '0 0 8px 0',
          }}>
            ⚙️ AI 设置中心
          </h1>
          <p style={{
            fontSize: '14px',
            color: metronicTheme.colors.gray600,
            margin: 0,
          }}>
            配置全局AI设置、用户个性化设置和智能体绑定
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
          borderBottom: `2px solid ${metronicTheme.colors.gray300}`,
        }}>
          {[
            { id: 'apikey', label: '🔑 API 密钥', desc: 'AI 供应商密钥' },
            { id: 'global', label: '🌐 全局设置', desc: '系统级配置' },
            { id: 'user', label: '👤 用户设置', desc: '个性化配置' },
            { id: 'bindings', label: '🔗 绑定管理', desc: '智能体绑定' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === tab.id ? metronicTheme.colors.primary : 'transparent',
                color: activeTab === tab.id ? metronicTheme.colors.white : metronicTheme.colors.gray600,
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s',
              }}
            >
              <div>{tab.label}</div>
              <div style={{ fontSize: '11px', opacity: 0.8 }}>{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: metronicTheme.colors.gray600 }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p>加载中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'apikey' && <ApiKeyTab provider={provider} setProvider={setProvider} apiKey={apiKey} setApiKey={setApiKey} savedKeys={savedKeys} onSave={handleSaveApiKey} saving={saving} />}
            {activeTab === 'global' && <GlobalConfigTab config={globalConfig} setConfig={setGlobalConfig} onSave={() => handleSaveConfig(true)} saving={saving} />}
            {activeTab === 'user' && <UserConfigTab config={userConfig} setConfig={setUserConfig} onSave={() => handleSaveConfig(false)} saving={saving} />}
            {activeTab === 'bindings' && <BindingsTab bindings={bindings} templates={templates} onCreate={handleCreateBinding} onDelete={handleDeleteBinding} />}
          </>
        )}
      </div>
    </div>
  );
}

// API Key 管理Tab
function ApiKeyTab({ provider, setProvider, apiKey, setApiKey, savedKeys, onSave, saving }: any): JSX.Element {
  const currentProvider = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* API Key 输入区域 */}
      <div style={{
        backgroundColor: metronicTheme.colors.white,
        border: `2px solid ${metronicTheme.colors.gray300}`,
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: metronicTheme.colors.gray900, marginBottom: '20px' }}>
          🔑 添加 AI 供应商 API Key
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Provider 选择 */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: metronicTheme.colors.gray900, marginBottom: '8px' }}>
              AI 供应商
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: `1px solid ${metronicTheme.colors.gray300}`,
                borderRadius: '8px',
                backgroundColor: metronicTheme.colors.white,
                color: metronicTheme.colors.gray900,
                cursor: 'pointer',
              }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 支持的模型列表（只读显示） */}
          <div style={{
            padding: '16px',
            backgroundColor: metronicTheme.colors.gray100,
            borderRadius: '8px',
            border: `1px solid ${metronicTheme.colors.gray300}`,
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: metronicTheme.colors.gray900, marginBottom: '8px' }}>
              📋 支持的模型
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {currentProvider.models.map((model) => (
                <span
                  key={model}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: metronicTheme.colors.white,
                    color: metronicTheme.colors.gray600,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    border: `1px solid ${metronicTheme.colors.gray300}`,
                  }}
                >
                  {model}
                </span>
              ))}
            </div>
          </div>

          {/* API Key 输入 */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: metronicTheme.colors.gray900, marginBottom: '8px' }}>
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入你的 API Key"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: `1px solid ${metronicTheme.colors.gray300}`,
                borderRadius: '8px',
                backgroundColor: metronicTheme.colors.white,
                color: metronicTheme.colors.gray900,
              }}
            />
          </div>

          {/* 保存按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onSave}
              disabled={saving || !apiKey.trim()}
              style={{
                padding: '12px 24px',
                backgroundColor: saving || !apiKey.trim() ? metronicTheme.colors.gray300 : metronicTheme.colors.primary,
                color: metronicTheme.colors.white,
                border: 'none',
                borderRadius: '8px',
                cursor: saving || !apiKey.trim() ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {saving ? '保存中...' : '💾 保存 API Key'}
            </button>
          </div>
        </div>
      </div>

      {/* 已保存的 Keys 列表 */}
      <div style={{
        backgroundColor: metronicTheme.colors.white,
        border: `2px solid ${metronicTheme.colors.gray300}`,
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: metronicTheme.colors.gray900, marginBottom: '20px' }}>
          ✅ 已配置的供应商
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {PROVIDERS.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: savedKeys[p.id] ? metronicTheme.colors.gray100 : metronicTheme.colors.white,
                border: `1px solid ${savedKeys[p.id] ? metronicTheme.colors.success : metronicTheme.colors.gray300}`,
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  fontSize: '20px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: savedKeys[p.id] ? metronicTheme.colors.success : metronicTheme.colors.gray300,
                  color: metronicTheme.colors.white,
                  borderRadius: '8px',
                  fontWeight: '600',
                }}>
                  {savedKeys[p.id] ? '✓' : '×'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: metronicTheme.colors.gray900 }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '12px', color: metronicTheme.colors.gray600 }}>
                    {savedKeys[p.id] ? 'API Key 已配置' : '未配置'}
                  </div>
                </div>
              </div>
              {savedKeys[p.id] && (
                <div style={{
                  padding: '6px 12px',
                  backgroundColor: metronicTheme.colors.success,
                  color: metronicTheme.colors.white,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}>
                  已启用
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 全局配置Tab
function GlobalConfigTab({ config, setConfig, onSave, saving }: ConfigTabProps): JSX.Element {
  // 如果没有配置，创建默认配置
  React.useEffect(() => {
    if (!config) {
      setConfig({
        provider: 'OPENAI',
        model: 'gpt-4o',
        systemPrompt: '你是一个专业、友好的 AI 助手。',
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      });
    }
  }, [config, setConfig]);

  if (!config) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: metronicTheme.colors.gray600 }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
        <p>正在初始化配置...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ConfigForm config={config} setConfig={setConfig} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: metronicTheme.colors.primary,
            color: metronicTheme.colors.white,
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {saving ? '保存中...' : '💾 保存全局配置'}
        </button>
      </div>
    </div>
  );
}

// 用户配置Tab
function UserConfigTab({ config, setConfig, onSave, saving }: ConfigTabProps): JSX.Element {
  // 如果没有配置，创建默认配置
  React.useEffect(() => {
    if (!config) {
      setConfig({
        provider: 'OPENAI',
        model: 'gpt-4o',
        systemPrompt: '你是一个专业、友好的 AI 助手。',
        temperature: 0.7,
        topP: 1,
        frequencyPenalty: 0,
        presencePenalty: 0,
      });
    }
  }, [config, setConfig]);

  if (!config) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: metronicTheme.colors.gray600 }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
        <p>正在初始化配置...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <ConfigForm config={config} setConfig={setConfig} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            backgroundColor: metronicTheme.colors.success,
            color: metronicTheme.colors.white,
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {saving ? '保存中...' : '💾 保存用户配置'}
        </button>
      </div>
    </div>
  );
}

// 绑定管理Tab
function BindingsTab({ bindings, templates, onCreate, onDelete }: BindingsTabProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* 可用智能体列表 */}
      <div style={{
        backgroundColor: metronicTheme.colors.white,
        border: `2px solid ${metronicTheme.colors.gray300}`,
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: metronicTheme.colors.gray900, margin: 0 }}>
            🤖 可用智能体列表
          </h3>
          <div style={{
            padding: '6px 12px',
            backgroundColor: metronicTheme.colors.primary,
            color: metronicTheme.colors.white,
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '600',
          }}>
            共 {templates.length} 个
          </div>
        </div>

        {templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: metronicTheme.colors.gray600 }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <p>暂无可用智能体</p>
            <p style={{ fontSize: '14px', color: metronicTheme.colors.gray600 }}>
              请前往「智能体管理」页面创建智能体
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {templates.map((template, index) => (
              <div
                key={template.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  backgroundColor: metronicTheme.colors.gray100,
                  border: `2px solid ${metronicTheme.colors.gray300}`,
                  borderRadius: '10px',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = metronicTheme.colors.white;
                  e.currentTarget.style.borderColor = metronicTheme.colors.primary;
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 158, 247, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
                  e.currentTarget.style.borderColor = metronicTheme.colors.gray300;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* 左侧：序号和智能体信息 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  {/* 序号 */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: metronicTheme.colors.primary,
                    color: metronicTheme.colors.white,
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                  }}>
                    {index + 1}
                  </div>

                  {/* 头像 */}
                  {template.avatarUrl ? (
                    <img
                      src={template.avatarUrl}
                      alt={template.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: `2px solid ${metronicTheme.colors.gray300}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: template.color || metronicTheme.colors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        border: `2px solid ${metronicTheme.colors.gray300}`,
                      }}
                    >
                      🤖
                    </div>
                  )}

                  {/* 智能体信息 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: metronicTheme.colors.gray900,
                      margin: '0 0 4px 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {template.name}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                      <span style={{ color: metronicTheme.colors.gray600 }}>
                        📊 {template.provider}
                      </span>
                      <span style={{ color: metronicTheme.colors.gray600 }}>•</span>
                      <span style={{ color: metronicTheme.colors.gray600 }}>
                        🔧 {template.model}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 右侧：描述和 ID */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px',
                }}>
                  {template.description && (
                    <span style={{
                      fontSize: '12px',
                      color: metronicTheme.colors.gray600,
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {template.description}
                    </span>
                  )}
                  <span style={{
                    fontSize: '11px',
                    color: metronicTheme.colors.gray600,
                    fontFamily: 'monospace',
                  }}>
                    ID: {template.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 当前绑定列表 */}
      <div style={{
        backgroundColor: metronicTheme.colors.white,
        border: `2px solid ${metronicTheme.colors.gray300}`,
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: metronicTheme.colors.gray900, margin: 0 }}>
            🔗 当前绑定 ({bindings.length})
          </h3>
          <button
            onClick={onCreate}
            style={{
              padding: '10px 20px',
              backgroundColor: metronicTheme.colors.primary,
              color: metronicTheme.colors.white,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            ➕ 创建绑定
          </button>
        </div>

        {bindings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: metronicTheme.colors.gray600 }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
            <p>暂无绑定，点击上方按钮创建...</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {bindings.map((binding: any) => (
              <div
                key={binding.id}
                style={{
                  backgroundColor: metronicTheme.colors.white,
                  border: `1px solid ${metronicTheme.colors.gray300}`,
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: metronicTheme.colors.gray900, margin: 0 }}>
                    {binding.template?.name || '未知智能体'}
                  </h4>
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: binding.enabled ? metronicTheme.colors.success : metronicTheme.colors.gray300,
                      color: metronicTheme.colors.white,
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {binding.enabled ? '启用' : '禁用'}
                  </span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: metronicTheme.colors.gray600, marginBottom: '4px' }}>
                    <strong>频道：</strong> {CHANNELS.find(c => c.id === binding.channel)?.name || '全部'}
                  </div>
                  <div style={{ fontSize: '13px', color: metronicTheme.colors.gray600, marginBottom: '4px' }}>
                    <strong>用户：</strong> {binding.userId ? binding.user?.email : '全局'}
                  </div>
                  {binding.modelOverride && (
                    <div style={{ fontSize: '13px', color: metronicTheme.colors.gray600 }}>
                      <strong>模型覆盖：</strong> {binding.modelOverride}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => onDelete(binding.id)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: metronicTheme.colors.danger,
                      color: metronicTheme.colors.white,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    🗑️ 删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 配置表单组件
function ConfigForm({ config, setConfig }: ConfigFormProps): JSX.Element {
  const updateConfig = (key: keyof AIConfig, value: string | number): void => {
    if (config) {
      setConfig({ ...config, [key]: value });
    }
  };

  const handleProviderChange = (newProvider: string): void => {
    if (config) {
      const provider = PROVIDERS.find(p => p.id === newProvider);
      if (provider) {
        // 切换供应商时，自动选择该供应商的第一个模型
        setConfig({
          ...config,
          provider: newProvider,
          model: provider.models[0]
        });
      }
    }
  };

  const currentProvider: AIProvider = PROVIDERS.find(p => p.id === config?.provider) || PROVIDERS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Provider & Model */}
      <div
        style={{
          backgroundColor: metronicTheme.colors.white,
          border: `1px solid ${metronicTheme.colors.gray300}`,
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: metronicTheme.colors.gray900, marginBottom: '16px' }}>
          🔑 模型与提供商
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', color: metronicTheme.colors.gray600, display: 'block', marginBottom: '8px' }}>
              AI 提供商
            </label>
            <select
              value={config?.provider || 'OPENAI'}
              onChange={(e) => handleProviderChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${metronicTheme.colors.gray300}`,
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {PROVIDERS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '14px', color: metronicTheme.colors.gray600, display: 'block', marginBottom: '8px' }}>
              模型
            </label>
            <select
              value={config?.model || currentProvider.models[0]}
              onChange={(e) => updateConfig('model', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: `1px solid ${metronicTheme.colors.gray300}`,
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {currentProvider.models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div
        style={{
          backgroundColor: metronicTheme.colors.white,
          border: `1px solid ${metronicTheme.colors.gray300}`,
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: metronicTheme.colors.gray900, marginBottom: '16px' }}>
          🪄 系统提示词
        </h3>
        <textarea
          value={config?.systemPrompt || ''}
          onChange={(e) => updateConfig('systemPrompt', e.target.value)}
          rows={5}
          style={{
            width: '100%',
            padding: '10px',
            border: `1px solid ${metronicTheme.colors.gray300}`,
            borderRadius: '8px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Parameters */}
      <div
        style={{
          backgroundColor: metronicTheme.colors.white,
          border: `1px solid ${metronicTheme.colors.gray300}`,
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: metronicTheme.colors.gray900, marginBottom: '16px' }}>
          🧠 模型参数
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <ParamSlider
            label="Temperature"
            value={config?.temperature || 0.7}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => updateConfig('temperature', v)}
          />
          <ParamSlider
            label="Top P"
            value={config?.topP || 1}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => updateConfig('topP', v)}
          />
          <ParamSlider
            label="频率惩罚"
            value={config?.frequencyPenalty || 0}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => updateConfig('frequencyPenalty', v)}
          />
          <ParamSlider
            label="存在惩罚"
            value={config?.presencePenalty || 0}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => updateConfig('presencePenalty', v)}
          />
        </div>
      </div>
    </div>
  );
}

// 参数滑块组件
function ParamSlider({ label, value, min, max, step, onChange }: ParamSliderProps): JSX.Element {
  return (
    <div>
      <label style={{ fontSize: '14px', color: metronicTheme.colors.gray600, display: 'block', marginBottom: '8px' }}>
        {label}: {value}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}
