'use client';

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { api } from '../api';

// 💡 AI提供商和模型配置
const AI_PROVIDERS = {
  OPENAI: {
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    icon: '🤖'
  },
  DEEPSEEK: {
    name: 'DeepSeek',
    models: ['deepseek-chat', 'deepseek-coder'],
    icon: '🔬'
  },
  ANTHROPIC: {
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    icon: '🧠'
  },
  GEMINI: {
    name: 'Google Gemini',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    icon: '✨'
  },
  GROK: {
    name: 'xAI Grok',
    models: ['grok-beta'],
    icon: '🚀'
  }
};

const CHANNELS = {
  WA: { name: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
  TG: { name: 'Telegram', icon: '✈️', color: 'bg-blue-500' },
  WEB: { name: 'Web Widget', icon: '🌐', color: 'bg-purple-500' }
};

const REPLY_STYLES = [
  { value: 'friendly', label: '友好亲切' },
  { value: 'professional', label: '专业正式' },
  { value: 'humorous', label: '幽默风趣' },
  { value: 'concise', label: '简洁明了' },
  { value: 'detailed', label: '详细说明' }
];

export default function AISettings() {
  // 🔄 状态管理
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 🌐 全局配置
  const [globalConfig, setGlobalConfig] = useState({
    provider: 'OPENAI',
    model: 'gpt-4o',
    temperature: 0.7,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    maxTokens: 4096,
    systemPrompt: '你是一个友好且高效的AI助手，请用中文回答问题。',
    persona: '智能助手',
    replyStyle: 'friendly',
    language: 'zh-CN',
    dailyBudgetUSD: 1.00,
    enabled: true
  });

  // 👤 用户配置
  const [userConfig, setUserConfig] = useState({
    ...globalConfig,
    enabled: false
  });

  // 🧩 模块开关
  const [modules, setModules] = useState({
    aiEnabled: true,
    waEnabled: true,
    tgEnabled: false,
    flowEnabled: false,
    analytics: true
  });

  // 🤖 智能体绑定
  const [bindings, setBindings] = useState([]);
  const [agentTemplates, setAgentTemplates] = useState([]);

  // 🚀 初始化加载
  useEffect(() => {
    loadConfigs();
    loadBindings();
    loadAgentTemplates();
  }, []);

  // 📥 加载配置
  const loadConfigs = async () => {
    setLoading(true);
    try {
      // 加载全局配置
      const globalRes = await api.get('/ai/config?type=global');
      if (globalRes.data.config) {
        setGlobalConfig(globalRes.data.config);
      }

      // 加载用户配置
      const userRes = await api.get('/ai/config?type=user');
      if (userRes.data.config) {
        setUserConfig({ enabled: true, ...userRes.data.config });
      }

      // 加载模块配置
      const moduleRes = await api.get('/modules');
      if (moduleRes.data.modules) {
        setModules(moduleRes.data.modules);
      }

      showMessage('success', '配置加载成功');
    } catch (error) {
      console.error('加载配置失败:', error);
      showMessage('error', '加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 📥 加载智能体绑定
  const loadBindings = async () => {
    try {
      const res = await api.get('/ai/bindings');
      setBindings(res.data.bindings || []);
    } catch (error) {
      console.error('加载绑定失败:', error);
    }
  };

  // 📥 加载智能体模板
  const loadAgentTemplates = async () => {
    try {
      const res = await api.get('/ai/templates');
      setAgentTemplates(res.data.templates || []);
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  // 💾 保存配置
  const saveConfig = async (type: 'global' | 'user') => {
    setSaving(true);
    try {
      const config = type === 'global' ? globalConfig : userConfig;
      await api.post('/ai/config', { 
        config, 
        isGlobal: type === 'global' 
      });
      
      showMessage('success', `${type === 'global' ? '全局' : '用户'}配置保存成功`);
    } catch (error) {
      console.error('保存配置失败:', error);
      showMessage('error', '保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // 📝 消息提示
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 🔧 更新配置
  const updateConfig = (type: 'global' | 'user', key: string, value: any) => {
    if (type === 'global') {
      setGlobalConfig(prev => ({ ...prev, [key]: value }));
    } else {
      setUserConfig(prev => ({ ...prev, [key]: value }));
    }
  };

  // 📊 渲染参数滑块
  const renderSlider = (
    type: 'global' | 'user',
    label: string,
    key: string,
    min: number,
    max: number,
    step: number,
    description?: string
  ) => {
    const config = type === 'global' ? globalConfig : userConfig;
    const value = config[key as keyof typeof config] as number;

    return (
      <div className="space-y-2">
        <Label className="flex items-center justify-between">
          <span>{label}</span>
          <Badge variant="outline">{value}</Badge>
        </Label>
        <Slider
          value={[value]}
          onValueChange={([val]: number[]) => updateConfig(type, key, val)}
          min={min}
          max={max}
          step={step}
          className="w-full"
        />
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    );
  };

  // 🎨 渲染配置表单
  const renderConfigForm = (type: 'global' | 'user') => {
    const config = type === 'global' ? globalConfig : userConfig;
    const isUser = type === 'user';

    return (
      <div className="space-y-6">
        {/* 🔧 基础配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔧 基础配置
              {isUser && (
                <Switch
                  checked={userConfig.enabled}
                  onCheckedChange={(checked: boolean) => updateConfig('user', 'enabled', checked)}
                />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>AI提供商</Label>
                <Select
                  value={config.provider}
                  onValueChange={(value: string) => updateConfig(type, 'provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          {provider.icon} {provider.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>AI模型</Label>
                <Select
                  value={config.model}
                  onValueChange={(value: string) => updateConfig(type, 'model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS[config.provider as keyof typeof AI_PROVIDERS]?.models.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🧠 模型参数 */}
        <Card>
          <CardHeader>
            <CardTitle>🧠 模型参数</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderSlider(type, 'Temperature', 'temperature', 0, 2, 0.1, '控制回答的随机性')}
              {renderSlider(type, 'Top P', 'topP', 0, 1, 0.05, '控制词汇选择范围')}
              {renderSlider(type, 'Frequency Penalty', 'frequencyPenalty', 0, 2, 0.1, '减少重复词汇')}
              {renderSlider(type, 'Presence Penalty', 'presencePenalty', 0, 2, 0.1, '鼓励新话题')}
            </div>
            <div>
              <Label>最大Token数</Label>
              <Input
                type="number"
                value={config.maxTokens}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig(type, 'maxTokens', parseInt(e.target.value))}
                min={512}
                max={32768}
                step={256}
              />
            </div>
          </CardContent>
        </Card>

        {/* 🎭 个性化设置 */}
        <Card>
          <CardHeader>
            <CardTitle>🎭 个性化设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>系统提示词</Label>
              <Textarea
                value={config.systemPrompt}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateConfig(type, 'systemPrompt', e.target.value)}
                rows={4}
                placeholder="定义AI的行为和回答风格..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>AI角色/Persona</Label>
                <Input
                  value={config.persona}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig(type, 'persona', e.target.value)}
                  placeholder="例如：客服助理、技术顾问..."
                />
              </div>

              <div>
                <Label>回复风格</Label>
                <Select
                  value={config.replyStyle}
                  onValueChange={(value: string) => updateConfig(type, 'replyStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPLY_STYLES.map((style) => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 💰 预算控制 */}
        <Card>
          <CardHeader>
            <CardTitle>💰 预算控制</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label>每日预算 (USD)</Label>
              <Input
                type="number"
                value={config.dailyBudgetUSD}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateConfig(type, 'dailyBudgetUSD', parseFloat(e.target.value))}
                min={0.1}
                max={100}
                step={0.1}
              />
            </div>
          </CardContent>
        </Card>

        {/* 💾 保存按钮 */}
        <div className="flex justify-end">
          <Button
            onClick={() => saveConfig(type)}
            disabled={saving || (isUser && !userConfig.enabled)}
            className="min-w-[120px]"
          >
            {saving ? '保存中...' : `💾 保存${type === 'global' ? '全局' : '用户'}配置`}
          </Button>
        </div>
      </div>
    );
  };

  // 🤖 渲染绑定管理
  const renderBindingsManager = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              🤖 智能体绑定管理
              <Button className="flex items-center gap-2">
                ➕ 新增绑定
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bindings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🤖</div>
                <p>暂无智能体绑定</p>
                <p className="text-sm">点击上方按钮创建第一个绑定</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bindings.map((binding: any) => (
                  <div
                    key={binding.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch checked={binding.enabled} />
                        <div>
                          <h4 className="font-medium">{binding.template?.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {binding.channel && (
                              <Badge className={CHANNELS[binding.channel as keyof typeof CHANNELS]?.color}>
                                {CHANNELS[binding.channel as keyof typeof CHANNELS]?.icon} 
                                {CHANNELS[binding.channel as keyof typeof CHANNELS]?.name}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              优先级: {binding.priority || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">✏️ 编辑</Button>
                        <Button variant="outline" size="sm">🗑️ 删除</Button>
                      </div>
                    </div>

                    {/* 触发关键词 */}
                    {binding.triggerKeywords?.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-sm text-gray-500">触发关键词:</span>
                        {binding.triggerKeywords.map((keyword: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 🏠 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚙️ AI设置中心
          </h1>
          <p className="text-gray-600">
            配置AI提供商、模型参数和智能体绑定
          </p>
        </div>

        {/* 📢 消息提示 */}
        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' ? 'border-green-500 bg-green-50' :
            message.type === 'error' ? 'border-red-500 bg-red-50' :
            'border-blue-500 bg-blue-50'
          }`}>
            <AlertDescription>
              {message.type === 'success' && '✅ '}
              {message.type === 'error' && '❌ '}
              {message.type === 'info' && 'ℹ️ '}
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* 📑 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="global" className="flex items-center gap-2">
              🌐 全局设置
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              👤 用户设置
            </TabsTrigger>
            <TabsTrigger value="bindings" className="flex items-center gap-2">
              🤖 绑定管理
            </TabsTrigger>
          </TabsList>

          {/* 🌐 全局设置 */}
          <TabsContent value="global">
            <div className="mt-6">
              {renderConfigForm('global')}
            </div>
          </TabsContent>

          {/* 👤 用户设置 */}
          <TabsContent value="user">
            <div className="mt-6">
              <Alert className="mb-6">
                <AlertDescription>
                  ℹ️ 用户设置会覆盖全局设置。启用后，系统将优先使用您的个性化配置。
                </AlertDescription>
              </Alert>
              {renderConfigForm('user')}
            </div>
          </TabsContent>

          {/* 🤖 绑定管理 */}
          <TabsContent value="bindings">
            <div className="mt-6">
              <Alert className="mb-6">
                <AlertDescription>
                  ℹ️ 智能体绑定决定在不同渠道中使用哪个AI模板。可以设置触发关键词和优先级。
                </AlertDescription>
              </Alert>
              {renderBindingsManager()}
            </div>
          </TabsContent>
        </Tabs>

        {/* 🧩 模块开关（底部） */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🧩 模块开关</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={modules.aiEnabled}
                  onCheckedChange={(checked: boolean) => setModules(prev => ({ ...prev, aiEnabled: checked }))}
                />
                <Label>🤖 AI自动回复</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={modules.waEnabled}
                  onCheckedChange={(checked: boolean) => setModules(prev => ({ ...prev, waEnabled: checked }))}
                />
                <Label>💬 WhatsApp</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={modules.tgEnabled}
                  onCheckedChange={(checked: boolean) => setModules(prev => ({ ...prev, tgEnabled: checked }))}
                />
                <Label>✈️ Telegram</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={modules.analytics}
                  onCheckedChange={(checked: boolean) => setModules(prev => ({ ...prev, analytics: checked }))}
                />
                <Label>📊 数据分析</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}