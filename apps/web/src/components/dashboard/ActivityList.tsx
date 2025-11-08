// components/dashboard/ActivityList.tsx — Recent activity list component

import React from 'react';
import { metronicTheme } from '../../theme/metronic-theme';

export interface Activity {
  /** 活动图标 */
  icon: string;
  /** 活动标题 */
  title: string;
  /** 时间描述 */
  time: string;
  /** 活动类型（决定背景色） */
  type: 'success' | 'info' | 'primary' | 'warning' | 'danger';
}

export interface ActivityListProps {
  /** 活动列表 */
  activities: Activity[];
  /** 卡片标题 */
  title?: string;
  /** 是否显示"查看全部"按钮 */
  showViewAll?: boolean;
  /** "查看全部"点击事件 */
  onViewAll?: () => void;
}

export function ActivityList({
  activities,
  title = '最近活动',
  showViewAll = true,
  onViewAll,
}: ActivityListProps) {
  return (
    <div
      style={{
        backgroundColor: 'transparent',
        borderRadius: '12px',
        padding: '25px',
        border: `2px solid ${metronicTheme.colors.gray300}`,
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: metronicTheme.colors.gray900,
            margin: 0,
          }}
        >
          {title}
        </h3>
        {showViewAll && (
          <button
            onClick={onViewAll}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: `1px solid ${metronicTheme.colors.gray300}`,
              borderRadius: '6px',
              color: metronicTheme.colors.gray600,
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            查看全部
          </button>
        )}
      </div>

      {/* 活动列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {activities.map((activity, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              padding: '12px',
              backgroundColor: metronicTheme.colors.gray100,
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = metronicTheme.colors.gray200;
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = metronicTheme.colors.gray100;
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            {/* 图标 */}
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: `${metronicTheme.colors[activity.type]}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
              }}
            >
              {activity.icon}
            </div>

            {/* 内容 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: metronicTheme.colors.gray900,
                  margin: '0 0 4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {activity.title}
              </p>
              <p
                style={{
                  fontSize: '12px',
                  color: metronicTheme.colors.gray600,
                  margin: 0,
                }}
              >
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
