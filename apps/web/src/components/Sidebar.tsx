import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { tokenStore } from '../store';

// Metronic 风格的颜色配置
const metronicTheme = {
  colors: {
    primary: '#009EF7',
    success: '#50CD89',
    info: '#7239EA',
    warning: '#FFC700',
    danger: '#F1416C',
    white: '#FFFFFF',
    gray100: '#F9F9F9',
    gray200: '#F4F4F4',
    gray300: '#E1E3EA',
    gray400: '#B5B5C3',
    gray500: '#A1A5B7',
    gray600: '#7E8299',
    gray700: '#5E6278',
    gray800: '#3F4254',
    gray900: '#181C32',
  },
  fonts: {
    family: 'Inter, Helvetica, "sans-serif"',
  }
};

export function Sidebar() {
  const nav = useNavigate();
  const location = useLocation();
  const [isAIGroupExpanded, setIsAIGroupExpanded] = useState(true);
  const [isChannelGroupExpanded, setIsChannelGroupExpanded] = useState(true);

  const basicMenuItems = [
    { 
      path: '/dashboard', 
      icon: '📊', 
      label: 'Dashboard',
      description: '数据概览'
    },
    { 
      path: '/chat', 
      icon: '💬', 
      label: 'Chat',
      description: '消息管理'
    },
  ];

  const channelMenuItems = [
    { 
      path: '/channels', 
      icon: '📡', 
      label: 'Channels',
      description: '渠道配置'
    },
    { 
      path: '/settings/widget', 
      icon: '🔌', 
      label: 'Web Widget',
      description: '网页插件'
    },
  ];

  const aiMenuItems = [
    { 
      path: '/agent-management', 
      icon: '🤖', 
      label: 'AI Agents',
      description: '智能体'
    },
    { 
      path: '/ai', 
      icon: '⚙️', 
      label: 'AI Settings',
      description: 'AI 配置'
    },
  ];

  const systemMenuItems = [
    { 
      path: '/settings', 
      icon: '🔧', 
      label: 'Settings',
      description: '系统设置'
    },
  ];

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      tokenStore.token = null;
      localStorage.removeItem('token');
      nav('/login');
    }
  };

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      backgroundColor: metronicTheme.colors.white,
      borderRight: `1px solid ${metronicTheme.colors.gray300}`,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '0 0 30px rgba(0, 0, 0, 0.08)',
      fontFamily: metronicTheme.fonts.family,
    }}>
      {/* Logo 区域 */}
      <div style={{
        padding: '24px 20px',
        borderBottom: `1px solid ${metronicTheme.colors.gray200}`,
        backgroundColor: metronicTheme.colors.white,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* 品牌图标 */}
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${metronicTheme.colors.primary} 0%, #0077CC 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: `0 4px 16px ${metronicTheme.colors.primary}30`,
          }}>
            💬
          </div>
          
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '18px',
              fontWeight: '700',
              color: metronicTheme.colors.gray900,
              margin: 0,
              lineHeight: 1.2,
            }}>
              WA Business
            </h1>
            <p style={{
              fontSize: '11px',
              color: metronicTheme.colors.gray500,
              margin: '2px 0 0 0',
              fontWeight: '500',
              letterSpacing: '0.3px',
            }}>
              Desk Platform
            </p>
          </div>
        </div>
      </div>

      {/* 菜单区域 */}
      <nav style={{
        flex: 1,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        overflowY: 'auto',
      }}>
        {/* 基础功能菜单 */}
        <div style={{
          padding: '12px 12px 8px 12px',
          fontSize: '10px',
          fontWeight: '700',
          color: metronicTheme.colors.gray500,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          主要功能
        </div>

        {basicMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                border: 'none',
                borderRadius: '8px',
                background: isActive 
                  ? `linear-gradient(90deg, ${metronicTheme.colors.primary}15 0%, ${metronicTheme.colors.primary}08 100%)`
                  : 'transparent',
                color: isActive 
                  ? metronicTheme.colors.primary
                  : metronicTheme.colors.gray700,
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                position: 'relative',
                minHeight: '42px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
                  e.currentTarget.style.color = metronicTheme.colors.gray900;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = metronicTheme.colors.gray700;
                }
              }}
            >
              {/* 图标 */}
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              
              {/* 文本 */}
              <div style={{ flex: 1 }}>
                <div style={{ lineHeight: '1.3' }}>
                  {item.label}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: isActive ? metronicTheme.colors.primary : metronicTheme.colors.gray500,
                  lineHeight: '1.2',
                }}>
                  {item.description}
                </div>
              </div>

              {/* 活动指示器 */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '3px',
                  height: '60%',
                  backgroundColor: metronicTheme.colors.primary,
                  borderRadius: '0 3px 3px 0',
                }} />
              )}
            </button>
          );
        })}

        {/* AI 功能组 */}
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => setIsAIGroupExpanded(!isAIGroupExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 12px 8px 12px',
              fontSize: '10px',
              fontWeight: '700',
              color: metronicTheme.colors.gray500,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>AI 智能</span>
            <span style={{
              fontSize: '10px',
              transform: isAIGroupExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}>
              ▶
            </span>
          </button>

          {/* AI 菜单项 */}
          <div style={{
            maxHeight: isAIGroupExpanded ? '300px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
          }}>
            {aiMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => nav(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px 10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: isActive 
                      ? `linear-gradient(90deg, ${metronicTheme.colors.info}15 0%, ${metronicTheme.colors.info}08 100%)`
                      : 'transparent',
                    color: isActive 
                      ? metronicTheme.colors.info
                      : metronicTheme.colors.gray700,
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    position: 'relative',
                    minHeight: '42px',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
                      e.currentTarget.style.color = metronicTheme.colors.gray900;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = metronicTheme.colors.gray700;
                    }
                  }}
                >
                  {/* 图标 */}
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  
                  {/* 文本 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ lineHeight: '1.3' }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isActive ? metronicTheme.colors.info : metronicTheme.colors.gray500,
                      lineHeight: '1.2',
                    }}>
                      {item.description}
                    </div>
                  </div>

                  {/* 活动指示器 */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '60%',
                      backgroundColor: metronicTheme.colors.info,
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 渠道管理组 */}
        <div style={{ marginTop: '8px' }}>
          <button
            onClick={() => setIsChannelGroupExpanded(!isChannelGroupExpanded)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 12px 8px 12px',
              fontSize: '10px',
              fontWeight: '700',
              color: metronicTheme.colors.gray500,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>渠道管理</span>
            <span style={{
              fontSize: '10px',
              transform: isChannelGroupExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}>
              ▶
            </span>
          </button>

          {/* 渠道菜单项 */}
          <div style={{
            maxHeight: isChannelGroupExpanded ? '300px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
          }}>
            {channelMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => nav(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px 10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    background: isActive 
                      ? `linear-gradient(90deg, ${metronicTheme.colors.success}15 0%, ${metronicTheme.colors.success}08 100%)`
                      : 'transparent',
                    color: isActive 
                      ? metronicTheme.colors.success
                      : metronicTheme.colors.gray700,
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    position: 'relative',
                    minHeight: '42px',
                    marginBottom: '2px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
                      e.currentTarget.style.color = metronicTheme.colors.gray900;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = metronicTheme.colors.gray700;
                    }
                  }}
                >
                  {/* 图标 */}
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  
                  {/* 文本 */}
                  <div style={{ flex: 1 }}>
                    <div style={{ lineHeight: '1.3' }}>
                      {item.label}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isActive ? metronicTheme.colors.success : metronicTheme.colors.gray500,
                      lineHeight: '1.2',
                    }}>
                      {item.description}
                    </div>
                  </div>

                  {/* 活动指示器 */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '60%',
                      backgroundColor: metronicTheme.colors.success,
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 系统设置 */}
        <div style={{ marginTop: '16px' }}>
          <div style={{
            padding: '12px 12px 8px 12px',
            fontSize: '10px',
            fontWeight: '700',
            color: metronicTheme.colors.gray500,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            系统设置
          </div>

          {systemMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => nav(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  border: 'none',
                  borderRadius: '8px',
                  background: isActive 
                    ? `linear-gradient(90deg, ${metronicTheme.colors.warning}15 0%, ${metronicTheme.colors.warning}08 100%)`
                    : 'transparent',
                  color: isActive 
                    ? metronicTheme.colors.warning
                    : metronicTheme.colors.gray700,
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  position: 'relative',
                  minHeight: '42px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
                    e.currentTarget.style.color = metronicTheme.colors.gray900;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = metronicTheme.colors.gray700;
                  }
                }}
              >
                {/* 图标 */}
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                
                {/* 文本 */}
                <div style={{ flex: 1 }}>
                  <div style={{ lineHeight: '1.3' }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: isActive ? metronicTheme.colors.warning : metronicTheme.colors.gray500,
                    lineHeight: '1.2',
                  }}>
                    {item.description}
                  </div>
                </div>

                {/* 活动指示器 */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '60%',
                    backgroundColor: metronicTheme.colors.warning,
                    borderRadius: '0 3px 3px 0',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 底部用户区域 */}
      <div style={{
        padding: '15px',
        borderTop: `1px solid ${metronicTheme.colors.gray200}`,
      }}>
        {/* 用户信息卡片 */}
        <div style={{
          backgroundColor: metronicTheme.colors.gray100,
          borderRadius: '10px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '10px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = metronicTheme.colors.gray200;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
        }}
        >
          {/* 用户头像 */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${metronicTheme.colors.primary} 0%, ${metronicTheme.colors.info} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: 'white',
            fontWeight: '700',
          }}>
            👤
          </div>
          
          {/* 用户信息 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: metronicTheme.colors.gray900,
              lineHeight: '1.3',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              管理员
            </div>
            <div style={{
              fontSize: '10px',
              color: metronicTheme.colors.success,
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              lineHeight: '1.2',
            }}>
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: metronicTheme.colors.success,
              }} />
              在线
            </div>
          </div>

          {/* 在线状态指示器 */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: metronicTheme.colors.success,
          }} />
        </div>

        {/* 退出按钮 */}
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: `${metronicTheme.colors.danger}10`,
            color: metronicTheme.colors.danger,
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${metronicTheme.colors.danger}20`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `${metronicTheme.colors.danger}10`;
          }}
        >
          <span style={{ fontSize: '14px' }}>🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}
