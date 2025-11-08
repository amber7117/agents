import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

// 类型定义
interface UserModule {
  waEnabled: boolean;
  tgEnabled: boolean;
  aiEnabled: boolean;
  flowEnabled: boolean;
}

interface ApiKeysStatus {
  [key: string]: boolean;
}

interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
}

interface AIProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  apiKeyLabel: string;
  models: AIModel[];
}

interface AIConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  apiKey: string;
}

// AI 提供商和模型配置
const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: '领先的AI研究公司，提供GPT系列模型',
    website: 'https://openai.com',
    apiKeyLabel: 'OpenAI API Key',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: '最新的多模态模型，支持文本、图像和音频',
        maxTokens: 128000,
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.015
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        description: '更快、更便宜的GPT-4版本',
        maxTokens: 128000,
        inputCostPer1k: 0.01,
        outputCostPer1k: 0.03
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: '强大的大型语言模型',
        maxTokens: 8192,
        inputCostPer1k: 0.03,
        outputCostPer1k: 0.06
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: '快速、经济的模型',
        maxTokens: 16385,
        inputCostPer1k: 0.001,
        outputCostPer1k: 0.002
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'AI安全公司，专注于有用、无害、诚实的AI',
    website: 'https://anthropic.com',
    apiKeyLabel: 'Anthropic API Key',
    models: [
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        description: '最新的Claude模型，平衡了智能和速度',
        maxTokens: 200000,
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        description: '最强大的Claude模型',
        maxTokens: 200000,
        inputCostPer1k: 0.015,
        outputCostPer1k: 0.075
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        description: '最快速、最经济的Claude模型',
        maxTokens: 200000,
        inputCostPer1k: 0.00025,
        outputCostPer1k: 0.00125
      }
    ]
  },
  {
    id: 'google',
    name: 'Google',
    description: 'Google的Gemini AI模型系列',
    website: 'https://ai.google.dev',
    apiKeyLabel: 'Google AI API Key',
    models: [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: '最先进的多模态模型',
        maxTokens: 2097152,
        inputCostPer1k: 0.0035,
        outputCostPer1k: 0.0105
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: '快速、轻量级的多模态模型',
        maxTokens: 1048576,
        inputCostPer1k: 0.000075,
        outputCostPer1k: 0.0003
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: '文本和代码生成的最佳性能',
        maxTokens: 32768,
        inputCostPer1k: 0.0005,
        outputCostPer1k: 0.0015
      }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '中国领先的AI公司，专注于推理和代码生成',
    website: 'https://deepseek.com',
    apiKeyLabel: 'DeepSeek API Key',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        description: '通用对话模型',
        maxTokens: 32768,
        inputCostPer1k: 0.00014,
        outputCostPer1k: 0.00028
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        description: '专业的代码生成模型',
        maxTokens: 16384,
        inputCostPer1k: 0.00014,
        outputCostPer1k: 0.00028
      }
    ]
  },
  {
    id: 'xai',
    name: 'xAI',
    description: 'Elon Musk的xAI公司开发的Grok模型',
    website: 'https://x.ai',
    apiKeyLabel: 'xAI API Key',
    models: [
      {
        id: 'grok-beta',
        name: 'Grok Beta',
        description: '具有实时信息访问能力的AI模型',
        maxTokens: 131072,
        inputCostPer1k: 0.005,
        outputCostPer1k: 0.015
      }
    ]
  }
];

// 默认配置
const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: '你是一个有用的AI助手，请用中文回答问题。',
  apiKey: ''
};

// 消息类型
type MessageType = 'success' | 'error' | 'info';

interface MessageState {
  text: string;
  type: MessageType;
}

// 样式常量
const containerStyle = {
  padding: '24px',
  maxWidth: '1000px',
  margin: '0 auto',
  minHeight: '100vh',
  backgroundColor: '#fafafa'
};

const sectionStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e0e0e0'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  marginBottom: '8px'
};

const buttonStyle = {
  padding: '12px 24px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'background-color 0.2s',
  marginRight: '12px'
};

const secondaryButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#6c757d'
};

export default function AISettings() {
  // State
  const [config, setConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [savedKeys, setSavedKeys] = useState<ApiKeysStatus>({});
  const [modules, setModules] = useState<UserModule | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: '', type: 'info' });

  // 计算当前选择的提供商和模型
  const currentProvider = AI_PROVIDERS.find(p => p.id === config.provider);
  const currentModel = currentProvider?.models.find(m => m.id === config.model);

  // 消息提示工具函数
  const showMessage = useCallback((text: string, type: MessageType = 'info') => {
    setMessage({ text, type });
    
    if (type !== 'info') {
      setTimeout(() => {
        setMessage(prev => prev.text === text ? { text: '', type: 'info' } : prev);
      }, 3000);
    }
  }, []);

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      const res = await api.get<{ config: AIConfig }>('/ai/config');
      if (res.data.config) {
        setConfig({ ...DEFAULT_AI_CONFIG, ...res.data.config });
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
      showMessage('❌ 加载AI配置失败', 'error');
    }
  }, [showMessage]);

  // 数据加载函数
  const loadSavedKeys = useCallback(async () => {
    try {
      const res = await api.get<{ keys: ApiKeysStatus }>('/ai/keys');
      setSavedKeys(res.data.keys || {});
    } catch (error) {
      console.error('Failed to load saved keys:', error);
      showMessage('❌ 加载已保存密钥失败', 'error');
    }
  }, [showMessage]);

  const loadModules = useCallback(async () => {
    try {
      const res = await api.get<{ modules: UserModule }>('/modules');
      setModules(res.data.modules);
    } catch (error) {
      console.error('Failed to load modules:', error);
      showMessage('❌ 加载模块设置失败', 'error');
    }
  }, [showMessage]);

  // 初始化加载
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadConfig(),
          loadSavedKeys(),
          loadModules()
        ]);
      } catch (error) {
        console.error('Failed to initialize data:', error);
        showMessage('❌ 初始化数据失败', 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [loadConfig, loadSavedKeys, loadModules]);

  // 处理提供商变更
  const handleProviderChange = (providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setConfig(prev => ({
        ...prev,
        provider: providerId,
        model: provider.models[0].id,
        maxTokens: Math.min(prev.maxTokens, provider.models[0].maxTokens)
      }));
    }
  };

  // 处理模型变更
  const handleModelChange = (modelId: string) => {
    const model = currentProvider?.models.find(m => m.id === modelId);
    if (model) {
      setConfig(prev => ({
        ...prev,
        model: modelId,
        maxTokens: Math.min(prev.maxTokens, model.maxTokens)
      }));
    }
  };

  // 处理配置变更
  const handleConfigChange = (key: keyof AIConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // 保存配置
  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.post('/ai/config', { config });
      showMessage('✅ AI配置保存成功！', 'success');
    } catch (error: any) {
      showMessage(`❌ ${error.response?.data?.message || '保存配置失败'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // 保存API密钥
  const handleSaveApiKey = async () => {
    if (!config.apiKey.trim()) {
      showMessage('❌ 请输入API密钥', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.post('/ai/key', { provider: config.provider, apiKey: config.apiKey });
      showMessage(`✅ ${currentProvider?.name} API Key 保存成功！`, 'success');
      setConfig(prev => ({ ...prev, apiKey: '' }));
      await loadSavedKeys();
    } catch (error: any) {
      showMessage(`❌ ${error.response?.data?.message || '保存API密钥失败'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // 测试API连接
  const handleTestConnection = async () => {
    setSaving(true);
    try {
      await api.post('/ai/test', { provider: config.provider, model: config.model });
      showMessage('✅ API连接测试成功！', 'success');
    } catch (error: any) {
      showMessage(`❌ ${error.response?.data?.message || 'API连接测试失败'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // 切换AI模块状态
  const handleToggleAI = async () => {
    if (!modules) return;

    setLoading(true);
    try {
      const newValue = !modules.aiEnabled;
      await api.post('/modules', { aiEnabled: newValue });
      showMessage(`✅ AI ${newValue ? '已启用' : '已禁用'}`, 'success');
      await loadModules();
    } catch (error: any) {
      showMessage(`❌ ${error.response?.data?.message || '操作失败'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 渲染消息提示
  const renderMessage = () => {
    if (!message.text) return null;

    const styles = {
      success: {
        backgroundColor: '#d4edda',
        color: '#155724',
        borderColor: '#c3e6cb'
      },
      error: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderColor: '#f5c6cb'
      },
      info: {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        borderColor: '#bee5eb'
      }
    };

    return (
      <div
        style={{
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: '1px solid',
          fontWeight: '500',
          ...styles[message.type]
        }}
      >
        {message.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
        AI 设置
      </h1>
      <p style={{ margin: '0 0 32px 0', fontSize: '15px', color: '#666' }}>
        配置 AI 提供商、模型和参数。管理 API 密钥和自定义 AI 行为。
      </p>

      {renderMessage()}

      {/* AI 模块状态 */}
      <div style={sectionStyle}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
          AI 模块状态
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>AI 功能</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
              启用或禁用系统的 AI 功能
            </p>
          </div>
          <button
            onClick={handleToggleAI}
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: modules?.aiEnabled ? '#28a745' : '#dc3545',
              margin: 0
            }}
          >
            {modules?.aiEnabled ? '✅ 已启用' : '❌ 已禁用'}
          </button>
        </div>
      </div>

      {/* AI 提供商选择 */}
      <div style={sectionStyle}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
          AI 提供商
        </h2>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            选择 AI 提供商
          </label>
          <select
            value={config.provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            style={inputStyle}
          >
            {AI_PROVIDERS.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} - {provider.description}
              </option>
            ))}
          </select>
        </div>

        {currentProvider && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            marginBottom: '16px' 
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
              {currentProvider.name}
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
              {currentProvider.description}
            </p>
            <a 
              href={currentProvider.website} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: '14px', color: '#007bff' }}
            >
              访问官网 →
            </a>
          </div>
        )}

        {/* API 密钥 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            {currentProvider?.apiKeyLabel}
            {savedKeys[config.provider] && (
              <span style={{ color: '#28a745', marginLeft: '8px', fontSize: '14px' }}>
                ✓ 已保存
              </span>
            )}
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => handleConfigChange('apiKey', e.target.value)}
            placeholder={savedKeys[config.provider] ? "••••••••••••" : "输入 API 密钥"}
            style={inputStyle}
          />
          {savedKeys[config.provider] && (
            <small style={{ color: '#666', fontSize: '12px' }}>
              已保存 API Key，如需更换请输入新的密钥
            </small>
          )}
        </div>

        <button
          onClick={handleSaveApiKey}
          disabled={saving || !config.apiKey.trim()}
          style={buttonStyle}
        >
          {saving ? '保存中...' : '保存 API 密钥'}
        </button>

        <button
          onClick={handleTestConnection}
          disabled={saving || !savedKeys[config.provider]}
          style={secondaryButtonStyle}
        >
          {saving ? '测试中...' : '测试连接'}
        </button>
      </div>

      {/* AI 模型选择 */}
      {currentProvider && (
        <div style={sectionStyle}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
            AI 模型
          </h2>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              选择模型
            </label>
            <select
              value={config.model}
              onChange={(e) => handleModelChange(e.target.value)}
              style={inputStyle}
            >
              {currentProvider.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>

          {currentModel && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                {currentModel.name}
              </h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
                {currentModel.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>最大Token数：</strong>
                  <span style={{ fontSize: '14px' }}>{currentModel.maxTokens.toLocaleString()}</span>
                </div>
                <div>
                  <strong style={{ fontSize: '14px' }}>输入成本：</strong>
                  <span style={{ fontSize: '14px' }}>${currentModel.inputCostPer1k}/1K tokens</span>
                </div>
                <div>
                  <strong style={{ fontSize: '14px' }}>输出成本：</strong>
                  <span style={{ fontSize: '14px' }}>${currentModel.outputCostPer1k}/1K tokens</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI 参数配置 */}
      <div style={sectionStyle}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
          AI 参数配置
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Temperature (创造性): {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              0 = 确定性，2 = 创造性
            </small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              最大Token数
            </label>
            <input
              type="number"
              min="1"
              max={currentModel?.maxTokens || 8192}
              value={config.maxTokens}
              onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
              style={inputStyle}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              最大: {currentModel?.maxTokens?.toLocaleString() || '8,192'}
            </small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Top-P: {config.topP}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.topP}
              onChange={(e) => handleConfigChange('topP', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              控制词汇多样性
            </small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              频率惩罚: {config.frequencyPenalty}
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={config.frequencyPenalty}
              onChange={(e) => handleConfigChange('frequencyPenalty', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              减少重复内容
            </small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              存在惩罚: {config.presencePenalty}
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={config.presencePenalty}
              onChange={(e) => handleConfigChange('presencePenalty', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              鼓励新话题
            </small>
          </div>
        </div>

        {/* 系统提示词 */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            系统提示词
          </label>
          <textarea
            value={config.systemPrompt}
            onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
            rows={4}
            placeholder="输入系统提示词，定义AI的行为和角色..."
            style={{
              ...inputStyle,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            系统提示词将在每次对话开始时发送给AI，用于定义其角色和行为模式
          </small>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={saving}
          style={buttonStyle}
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
      </div>
    </div>
  );
}