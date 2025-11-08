// components/dashboard/DashboardHeader.tsx — Dashboard header with title and action buttons

import React from 'react';
import { metronicTheme } from '../../theme/metronic-theme';

export interface DashboardHeaderProps {
  /** 标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 图标 emoji */
  icon: string;
  /** 是否已加载（控制动画） */
  isLoaded?: boolean;
  /** 按钮配置 */
  actions?: {
    label: string;
    icon: string;
    variant: 'primary' | 'success' | 'outline';
    onClick?: () => void;
  }[];
}

export function DashboardHeader({
  title,
  subtitle,
  icon,
  isLoaded = false,
  actions = [],
}: DashboardHeaderProps) {
  return (
    <div
      style={{
        backgroundColor: 'transparent',
        borderRadius: '12px',
        padding: '25px 30px',
        marginBottom: '30px',
        border: `2px solid ${metronicTheme.colors.gray300}`,
        animationName: isLoaded ? 'fadeInUp' : 'none',
        animationDuration: '0.6s',
        animationTimingFunction: 'ease-out',
        animationFillMode: 'both',
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        opacity: isLoaded ? 1 : 0,
        transition: 'all 0.6s ease-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* 左侧：图标和标题 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              background: `linear-gradient(135deg, ${metronicTheme.colors.primary} 0%, ${metronicTheme.colors.info} 100%)`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: metronicTheme.shadows.button,
            }}
          >
            {icon}
          </div>
          <div>
            <h1
              style={{
                fontSize: '28px',
                fontWeight: '700',
                margin: '0 0 8px',
                color: metronicTheme.colors.gray900,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                color: metronicTheme.colors.gray600,
                fontSize: '14px',
                margin: 0,
                fontWeight: '500',
              }}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        {actions.length > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                style={{
                  padding: '12px 20px',
                  backgroundColor:
                    action.variant === 'primary'
                      ? `${metronicTheme.colors.primary}15`
                      : action.variant === 'success'
                      ? 'transparent'
                      : 'transparent',
                  border:
                    action.variant === 'primary'
                      ? `1px solid ${metronicTheme.colors.primary}30`
                      : action.variant === 'success'
                      ? `2px solid ${metronicTheme.colors.success}`
                      : `1px solid ${metronicTheme.colors.gray300}`,
                  borderRadius: '8px',
                  color:
                    action.variant === 'primary'
                      ? metronicTheme.colors.primary
                      : action.variant === 'success'
                      ? metronicTheme.colors.success
                      : metronicTheme.colors.gray700,
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: metronicTheme.fonts.family,
                }}
                onMouseEnter={(e) => {
                  if (action.variant === 'primary') {
                    e.currentTarget.style.backgroundColor = `${metronicTheme.colors.primary}25`;
                    e.currentTarget.style.borderColor = `${metronicTheme.colors.primary}50`;
                  } else if (action.variant === 'success') {
                    e.currentTarget.style.backgroundColor = `${metronicTheme.colors.success}10`;
                  } else {
                    e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
                  }
                }}
                onMouseLeave={(e) => {
                  if (action.variant === 'primary') {
                    e.currentTarget.style.backgroundColor = `${metronicTheme.colors.primary}15`;
                    e.currentTarget.style.borderColor = `${metronicTheme.colors.primary}30`;
                  } else {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
