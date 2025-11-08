import React, { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
  category?: string;
  tags: string[];
  isOwner?: boolean;
  isParticipant?: boolean;
  isFavorite?: boolean;
  viewCount?: number;
  tips?: string;
  suggestions?: string[];
}

interface AgentCardProps {
  agent: Agent;
  onEdit?: (agent: Agent) => void;
  onDelete?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onViewDetails?: (agent: Agent) => void;
}

// Metronic 风格的辅助函数
const getMetronicColors = () => ({
  primary: '#009EF7',
  success: '#50CD89',
  info: '#7239EA',
  warning: '#FFC700',
  danger: '#F1416C',
  dark: '#181C32',
  muted: '#A1A5B7',
  light: '#F9F9F9',
});

const getMetronicShadows = () => ({
  card: '0 0 50px 0 rgba(82, 63, 105, 0.15)',
  cardHover: '0 0 50px 0 rgba(82, 63, 105, 0.3)',
  button: '0 0 20px 0 rgba(76, 87, 125, 0.2)',
});

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onEdit,
  onDelete,
  onFavorite,
  onViewDetails,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(agent);
    }
    setShowMenu(false);
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(agent);
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('确定要删除这个智能体吗？')) {
      onDelete(agent.id);
    }
    setShowMenu(false);
  };

  const handleFavorite = () => {
    if (onFavorite) {
      onFavorite(agent.id);
    }
  };

  // 调整颜色亮度的辅助函数
  function adjustBrightness(color: string, percent: number): string {
    // 移除 # 符号
    const hex = color.replace('#', '');
    
    // 将十六进制转换为 RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 调整亮度
    const adjustedR = Math.max(0, Math.min(255, r + (r * percent / 100)));
    const adjustedG = Math.max(0, Math.min(255, g + (g * percent / 100)));
    const adjustedB = Math.max(0, Math.min(255, b + (b * percent / 100)));
    
    // 转换回十六进制
    const toHex = (n: number) => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(adjustedR)}${toHex(adjustedG)}${toHex(adjustedB)}`;
  }

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${agent.color} 0%, ${adjustBrightness(agent.color, 20)} 100%)`,
        borderRadius: '16px',
        padding: '18px',
        position: 'relative',
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        cursor: 'pointer',
      }}
      onClick={handleViewDetails}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* 右上角状态标签 */}
      <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
        {agent.isOwner && (
          <span
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#333',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            主持人
          </span>
        )}
        {agent.isParticipant && (
          <span
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '500',
              color: '#333',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            参与者
          </span>
        )}
      </div>

      {/* 左上角对话气泡图标 */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          width: '40px',
          height: '40px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}
      >
        💬
      </div>

      {/* 智能体头像和名称 */}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '14px', marginBottom: '12px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            marginRight: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            flexShrink: 0,
          }}
        >
          {agent.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: '0 0 2px 0',
              fontSize: '16px',
              fontWeight: '700',
              color: '#1a1a1a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {agent.name}
          </h3>
          <p style={{ 
            margin: 0, 
            fontSize: '12px', 
            color: 'rgba(26, 26, 26, 0.7)', 
            lineHeight: '1.3',
            fontWeight: '500'
          }}>
            {agent.description}
          </p>
        </div>
      </div>

      {/* 专长领域标签 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px' }}>⚡</span>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a1a1a' }}>
            专长领域
          </span>
        </div>
        {agent.tags && agent.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {agent.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                style={{
                  padding: '3px 8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  fontSize: '10px',
                  color: '#333',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 特色描述 */}
      {agent.tips && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>⭐</span>
            <span style={{ fontSize: '12px', color: 'rgba(26, 26, 26, 0.8)', fontWeight: '500' }}>
              {agent.tips}
            </span>
          </div>
        </div>
      )}

      {/* 建议/特长 */}
      {agent.suggestions && agent.suggestions.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>💡</span>
            <span style={{ fontSize: '12px', color: 'rgba(26, 26, 26, 0.8)', fontWeight: '500' }}>
              {agent.suggestions[0]}
            </span>
          </div>
        </div>
      )}

      {/* 底部查看详情按钮 */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 0',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'rgba(26, 26, 26, 0.7)',
            fontWeight: '500',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#1a1a1a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(26, 26, 26, 0.7)';
          }}
        >
          <span>👁</span>
          <span>点击查看详情</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFavorite();
            }}
            style={{
              width: '28px',
              height: '28px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              backgroundColor: agent.isFavorite 
                ? 'rgba(255, 215, 0, 0.2)' 
                : 'rgba(255, 255, 255, 0.3)',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = agent.isFavorite
                ? 'rgba(255, 215, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.5)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = agent.isFavorite
                ? 'rgba(255, 215, 0, 0.2)'
                : 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {agent.isFavorite ? '⭐' : '☆'}
          </button>

          {agent.isOwner && (
            <>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  style={{
                    width: '28px',
                    height: '28px',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  ⚙️
                </button>

                {showMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '8px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      minWidth: '120px',
                      zIndex: 10,
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit();
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left',
                        borderRadius: '8px 8px 0 0',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      ✏️ 编辑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left',
                        color: '#dc3545',
                        borderRadius: '0 0 8px 8px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      🗑️ 删除
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentCard;
