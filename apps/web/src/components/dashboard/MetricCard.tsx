// components/dashboard/MetricCard.tsx — Dashboard metric card with Metronic outline style

import React from 'react';
import { metronicTheme } from '../../theme/metronic-theme';

export interface MetricCardProps {
  /** 卡片标题 */
  title: string;
  /** 主要数值 */
  value: string | number;
  /** 图标 emoji */
  icon: string;
  /** 主题颜色（primary, success, info, warning, danger） */
  color: keyof typeof metronicTheme.colors;
  /** 徽章文本（如："+12% 本月"） */
  badge?: string;
  /** 徽章类型 */
  badgeType?: keyof typeof metronicTheme.colors;
  /** 是否已加载（控制动画） */
  isLoaded?: boolean;
  /** 动画延迟（秒） */
  animationDelay?: number;
  /** 动画方向 */
  animationDirection?: 'left' | 'right';
}

export function MetricCard({
  title,
  value,
  icon,
  color,
  badge,
  badgeType = 'success',
  isLoaded = false,
  animationDelay = 0,
  animationDirection = 'left',
}: MetricCardProps) {
  const cardColor = metronicTheme.colors[color];
  const badgeColor = metronicTheme.colors[badgeType];

  return (
    <div
      style={{
        backgroundColor: 'transparent',
        borderRadius: '12px',
        padding: '25px',
        border: `2px solid ${cardColor}`,
        position: 'relative',
        overflow: 'hidden',
        animationName: isLoaded ? (animationDirection === 'left' ? 'slideInLeft' : 'slideInRight') : 'none',
        animationDuration: '0.8s',
        animationTimingFunction: 'ease-out',
        animationDelay: `${animationDelay}s`,
        animationFillMode: 'both',
        transform: isLoaded 
          ? 'translateX(0)' 
          : animationDirection === 'left' 
            ? 'translateX(-30px)' 
            : 'translateX(30px)',
        opacity: isLoaded ? 1 : 0,
        transition: 'all 0.8s ease-out',
      }}
    >
      {/* 装饰性背景 */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '80px',
          height: '80px',
          background: `${cardColor}15`,
          borderRadius: '50%',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        {/* 图标 */}
        <div
          style={{
            width: '50px',
            height: '50px',
            background: 'transparent',
            border: `2px solid ${cardColor}`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: cardColor,
            animationName: isLoaded ? 'float' : 'none',
            animationDuration: '3s',
            animationTimingFunction: 'ease-in-out',
            animationDelay: `${animationDelay + 0.2}s`,
            animationIterationCount: 'infinite',
          }}
        >
          {icon}
        </div>

        {/* 徽章 */}
        {badge && (
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: `1px solid ${badgeColor}`,
              borderRadius: '6px',
              fontSize: '11px',
              color: badgeColor,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {badge}
          </div>
        )}
      </div>

      {/* 数值和标题 */}
      <div>
        <h3
          style={{
            fontSize: '32px',
            fontWeight: '700',
            color: metronicTheme.colors.gray900,
            margin: '0 0 8px',
            lineHeight: '1',
            animationName: isLoaded ? 'pulse' : 'none',
            animationDuration: '2s',
            animationTimingFunction: 'ease-in-out',
            animationDelay: `${animationDelay + 0.8}s`,
            animationIterationCount: 'infinite',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: metronicTheme.colors.gray600,
            margin: 0,
            fontWeight: '500',
          }}
        >
          {title}
        </p>
      </div>
    </div>
  );
}
