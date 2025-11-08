import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { tokenStore } from '../store';
import AgentCard from '../components/AgentCard';
import AgentFilterBar from '../components/AgentFilterBar';
import CreateAgentModal, { NewAgent } from '../components/CreateAgentModal';

// 类型定义
interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  category?: string; // 保持与 AgentCard 一致
  tags: string[];
  isOwner?: boolean;
  isParticipant?: boolean;
  isFavorite?: boolean;
  tips?: string;
  suggestions?: string[];
}

interface AgentTemplate {
  id: string;
  name: string;
  provider: string;
  model: string;
  temperature: number;
  prompt: string; // 修正字段名
  description?: string;
  tags?: string[];
  avatarUrl?: string;
  color?: string;
  role?: string;
  character?: string;
  expertise?: string;
  language?: string;
  background?: string;
  responseStyle?: string;
  constraints?: string;
  examples?: string[];
}

type MessageType = 'success' | 'error' | 'info';

interface MessageState {
  text: string;
  type: MessageType;
}

export default function AgentManagement() {
  const nav = useNavigate();

  // State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>({ text: '', type: 'info' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedExpertise, setSelectedExpertise] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 检查登录状态
  useEffect(() => {
    if (!tokenStore.token) {
      nav('/login');
      return;
    }
  }, [nav]);

  // 消息提示工具函数
  const showMessage = useCallback((text: string, type: MessageType = 'info') => {
    setMessage({ text, type });

    if (type !== 'info') {
      setTimeout(() => {
        setMessage((prev) => (prev.text === text ? { text: '', type: 'info' } : prev));
      }, 3000);
    }
  }, []);

  // 加载模板数据
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ templates: AgentTemplate[] }>('/ai/templates');
      const loadedTemplates = res.data.templates || [];
      setTemplates(loadedTemplates);

      // 转换模板为智能体卡片格式
      const agentCards: Agent[] = loadedTemplates.map((template, index) => ({
        id: template.id,
        name: template.name,
        description: template.description || getDescriptionFromPrompt(template.prompt),
        avatar: template.avatarUrl || getAvatarForTemplate(index),
        color: template.color || getColorForTemplate(index),
        category: template.role || template.expertise || 'specialist', // Ensure category is always a string, with fallbacks
        tags: template.tags || extractTagsFromPrompt(template.prompt) || [], // Ensure tags is always an array
        isOwner: true, // 所有模板都是用户创建的
        isFavorite: false,
        tips: getTipsForTemplate(template),
        suggestions: getSuggestionsForTemplate(template),
      }));

      setAgents(agentCards);
      setFilteredAgents(agentCards);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showMessage('❌ 加载智能体失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // 初始化加载
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // 筛选逻辑
  useEffect(() => {
    let filtered = [...agents];

    // 角色筛选
    if (selectedRole === 'owner') {
      filtered = filtered.filter((agent) => agent.isOwner);
    } else if (selectedRole === 'participant') {
      filtered = filtered.filter((agent) => agent.isParticipant);
    }

    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.name.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query) ||
          agent.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredAgents(filtered);
  }, [agents, selectedRole, selectedExpertise, searchQuery]);

  // 创建新智能体
  const handleCreateAgent = async (newAgent: NewAgent) => {
    setLoading(true);
    try {
      const response = await api.post('/ai/templates', {
        name: newAgent.name,
        avatarUrl: newAgent.avatarUrl || null,
        color: newAgent.color || 'blue',
        description: newAgent.description || null,
        role: newAgent.role || null,
        character: newAgent.character || null,
        expertise: newAgent.expertise || null,
        language: newAgent.language || null,
        background: newAgent.background || null,
        prompt: newAgent.prompt,
        responseStyle: newAgent.responseStyle || null,
        constraints: newAgent.constraints || null,
        examples: newAgent.examples || [],
        tags: newAgent.tags || [],
        provider: newAgent.provider,
        model: newAgent.model,
        temperature: newAgent.temperature,
      });

      showMessage('✅ 智能体创建成功！', 'success');
      setIsCreateModalOpen(false); // 关闭模态框
      await loadTemplates(); // 重新加载列表
    } catch (error: any) {
      showMessage(`❌ ${error.response?.data?.message || '创建失败'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 编辑智能体
  const handleEditAgent = (agent: Agent) => {
    // TODO: 实现编辑逻辑
    console.log('编辑智能体:', agent);
    showMessage('编辑功能开发中...', 'info');
  };

  // 删除智能体
  const handleDeleteAgent = async (agentId: string) => {
    setLoading(true);
    try {
      await api.delete(`/ai/templates/${agentId}`);
      showMessage('✅ 智能体已删除', 'success');
      await loadTemplates();
    } catch (error: any) {
      showMessage(`❌ ${error.response?.data?.message || '删除失败'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // 收藏智能体
  const handleFavoriteAgent = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, isFavorite: !agent.isFavorite } : agent
      )
    );
    // TODO: 保存收藏状态到后端
  };

  // 统计数据
  const totalCount = {
    total: agents.length,
    owners: agents.filter((a) => a.isOwner).length,
    participants: agents.filter((a) => a.isParticipant).length,
  };

  // 渲染消息提示
  const renderMessage = () => {
    if (!message.text) return null;

    const styles = {
      success: {
        backgroundColor: '#d4edda',
        color: '#155724',
        borderColor: '#c3e6cb',
      },
      error: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderColor: '#f5c6cb',
      },
      info: {
        backgroundColor: '#d1ecf1',
        color: '#0c5460',
        borderColor: '#bee5eb',
      },
    };

    return (
      <div
        style={{
          padding: '12px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: '1px solid',
          fontWeight: '500',
          ...styles[message.type],
        }}
      >
        {message.text}
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#fafafa',
        padding: '32px',
      }}
    >
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700' }}>
              AI 智能体管理
            </h1>
            <p style={{ margin: 0, fontSize: '15px', color: '#666' }}>
              创建、管理和配置您的AI智能体，打造专属的智能团队
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1a1a1a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            <span style={{ fontSize: '18px' }}>✨</span>
            <span>创建智能体</span>
          </button>
        </div>

        {/* 消息提示 */}
        {renderMessage()}

        {/* 筛选栏 */}
        <FilterBar
          onRoleChange={setSelectedRole}
          onExpertiseChange={setSelectedExpertise}
          onSearch={setSearchQuery}
          totalCount={totalCount}
        />

        {/* 智能体网格 */}
        {loading && agents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p>加载中...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#999',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p>没有找到匹配的智能体</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRole('all');
                setSelectedExpertise('all');
              }}
              style={{
                marginTop: '16px',
                padding: '8px 20px',
                border: '1px solid #e0e0e0',
                backgroundColor: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              清除筛选
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(224px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEditAgent}
                onDelete={handleDeleteAgent}
                onFavorite={handleFavoriteAgent}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建智能体模态框 */}
      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateAgent}
      />
    </div>
  );
}

// 辅助函数
function getDescriptionFromPrompt(prompt: string): string {
  if (!prompt) return '智能助手';

  // 提取第一行作为描述
  const firstLine = prompt.split('\n')[0].trim();
  if (firstLine.length > 100) {
    return firstLine.substring(0, 100) + '...';
  }
  return firstLine || '智能助手';
}

function extractTagsFromPrompt(prompt: string): string[] {
  if (!prompt) return [];
  // 简单的标签提取逻辑，查找常见关键词
  const keywords = ['客服', '顾问', '助手', '专家', '分析师', '策略', '管理', '咨询', '服务', '销售'];
  return keywords.filter((k) => prompt.includes(k)).slice(0, 3);
}

function getAvatarForTemplate(index: number): string {
  const avatars = ['🤖', '👨‍💼', '👩‍💼', '🧑‍🔬', '👨‍🎓', '👩‍🎓', '🧙‍♂️', '🧙‍♀️'];
  return avatars[index % avatars.length];
}

function getColorForTemplate(index: number): string {
  const colors = [
    '#fce4ec',
    '#f3e5f5',
    '#e8eaf6',
    '#e3f2fd',
    '#e0f2f1',
    '#f1f8e9',
    '#fff9c4',
    '#ffe0b2',
  ];
  return colors[index % colors.length];
}

function getTipsForTemplate(template: AgentTemplate): string {
  // 根据模板类型生成相关提示
  if (template.prompt.includes('客服') || template.prompt.includes('顾问')) {
    return '专业服务，快速响应';
  } else if (template.prompt.includes('分析') || template.prompt.includes('数据')) {
    return '数据驱动，精准分析';
  } else if (template.prompt.includes('策略') || template.prompt.includes('规划')) {
    return '战略思维，前瞻规划';
  }
  return '智能助手，高效协作';
}

function getSuggestionsForTemplate(template: AgentTemplate): string[] {
  // 根据模板生成建议
  const suggestions = ['快速响应', '专业建议', '个性化服务'];

  if (template.prompt.includes('客服')) {
    return ['耐心服务', '问题解决', '用户满意'];
  } else if (template.prompt.includes('分析')) {
    return ['数据洞察', '趋势预测', '报告生成'];
  } else if (template.prompt.includes('策略')) {
    return ['战略规划', '决策支持', '风险评估'];
  }

  return suggestions;
}

// 与 AgentFilterBar 一致的导出
const FilterBar = AgentFilterBar;
