// components/dashboard/QuickActions.tsx — Quick action buttons component

import React from 'react';
import { metronicTheme } from '../../theme/metronic-theme';

export interface QuickAction {
  /** 操作图标 */
  icon: string;
  /** 操作标题 */
  title: string;
  /** 操作描述 */
  description: string;
  /** 主题颜色 */
  color: keyof typeof metronicTheme.colors;
  /** 点击事件 */
  onClick?: () => void;
}

export interface QuickActionsProps {
  /** 操作列表 */
  actions: QuickAction[];
  /** 卡片标题 */
  title?: string;
}

export function QuickActions({
  actions,
  title = '快速操作',
}: QuickActionsProps) {
  return (
    <div
      style={{
        backgroundColor: metronicTheme.colors.white,
        borderRadius: '12px',
        padding: '25px',
        boxShadow: metronicTheme.shadows.card,
        border: `1px solid ${metronicTheme.colors.gray300}`,
      }}
    >
      {/* 标题 */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: '600',
          color: metronicTheme.colors.gray900,
          margin: '0 0 20px',
        }}
      >
        {title}
      </h3>

      {/* 操作列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {actions.map((action, index) => {
          const actionColor = metronicTheme.colors[action.color];

          return (
            <button
              key={index}
              onClick={action.onClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '15px',
                backgroundColor: 'transparent',
                border: `1px solid ${metronicTheme.colors.gray300}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                fontFamily: metronicTheme.fonts.family,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${actionColor}08`;
                e.currentTarget.style.borderColor = `${actionColor}30`;
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = metronicTheme.colors.gray300;
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* 图标 */}
              <div
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '10px',
                  backgroundColor: `${actionColor}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                }}
              >
                {action.icon}
              </div>

              {/* 文本 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: metronicTheme.colors.gray900,
                    margin: '0 0 4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {action.title}
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: metronicTheme.colors.gray600,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
