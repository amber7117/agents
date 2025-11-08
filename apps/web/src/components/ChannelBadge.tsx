import React from 'react';

interface ChannelBadgeProps {
  channel: 'WA' | 'TG' | 'WEB';
  size?: 'sm' | 'md' | 'lg';
}

const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, size = 'md' }) => {
  const sizeMap = {
    sm: { fontSize: '10px', padding: '2px 6px' },
    md: { fontSize: '12px', padding: '4px 8px' },
    lg: { fontSize: '14px', padding: '6px 12px' },
  };

  const colorMap = {
    WA: { bg: '#25D366', color: '#fff' },
    TG: { bg: '#0088cc', color: '#fff' },
    WEB: { bg: '#6366f1', color: '#fff' },
  };

  const iconMap = {
    WA: '📱',
    TG: '✈️',
    WEB: '💬',
  };

  const labelMap = {
    WA: 'WhatsApp',
    TG: 'Telegram',
    WEB: 'Web',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: colorMap[channel].bg,
        color: colorMap[channel].color,
        borderRadius: '4px',
        fontWeight: '600',
        ...sizeMap[size],
      }}
      title={labelMap[channel]}
    >
      <span>{iconMap[channel]}</span>
      <span>{channel}</span>
    </span>
  );
};

export default ChannelBadge;
