import { tokenStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { metronicTheme } from '../theme/metronic-theme';
import '../theme/metronic-animations.css';
import {
  DashboardHeader,
  MetricCard,
  ActivityList,
  QuickActions,
  type Activity,
  type QuickAction,
} from '../components/dashboard';

export default function Dashboard() {
  const nav = useNavigate();
  const [stats, setStats] = useState({
    totalChats: 1245,
    activeAgents: 8,
    channels: 3,
    todayMessages: 156,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    console.log('Dashboard mounted, checking token...');
    console.log('Token value:', tokenStore.token);
    console.log('Token exists:', !!tokenStore.token);

    if (!tokenStore.token) {
      console.log('No token found, redirecting to login');
      nav('/login');
      return;
    }

    console.log('Token valid, loading dashboard');
    setTimeout(() => setIsLoaded(true), 100);
  }, [nav]);

  const activities: Activity[] = [
    { icon: '💬', title: '新聊天会话开始', time: '2 分钟前', type: 'success' },
    { icon: '🤖', title: '智能体自动回复', time: '5 分钟前', type: 'info' },
    { icon: '📡', title: '渠道连接成功', time: '10 分钟前', type: 'primary' },
    { icon: '⚠️', title: '系统警告消息', time: '15 分钟前', type: 'warning' },
    { icon: '❌', title: 'API 调用失败', time: '20 分钟前', type: 'danger' },
  ];

  const quickActions: QuickAction[] = [
    {
      icon: '🤖',
      title: '创建新智能体',
      description: '设置智能对话助手',
      color: 'info',
      onClick: () => nav('/agent-management'),
    },
    {
      icon: '📡',
      title: '添加新渠道',
      description: '连接 WhatsApp 账号',
      color: 'success',
      onClick: () => nav('/channels'),
    },
    {
      icon: '💬',
      title: '查看聊天记录',
      description: '浏览历史对话',
      color: 'primary',
      onClick: () => nav('/chat'),
    },
    {
      icon: '📊',
      title: '分析报告',
      description: '查看详细数据',
      color: 'warning',
      onClick: () => { },
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: metronicTheme.colors.gray100,
        fontFamily: metronicTheme.fonts.family,
        padding: '30px',
      }}
    >
      <DashboardHeader
        title="仪表盘概览"
        subtitle="WhatsApp Business Desk 数据中心"
        icon="📊"
        isLoaded={isLoaded}
        actions={[
          {
            label: '生成报告',
            icon: '📈',
            variant: 'primary',
            onClick: () => { },
          },
          {
            label: '快速设置',
            icon: '⚙️',
            variant: 'success',
            onClick: () => { },
          },
        ]}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '25px',
          marginBottom: '30px',
        }}
      >
        <MetricCard
          title="总聊天数量"
          value={stats.totalChats}
          icon="💬"
          color="primary"
          badge="+12% 本月"
          badgeType="success"
          isLoaded={isLoaded}
          animationDelay={0.2}
          animationDirection="left"
        />

        <MetricCard
          title="智能体运行中"
          value={stats.activeAgents}
          icon="🤖"
          color="success"
          badge="活跃"
          badgeType="info"
          isLoaded={isLoaded}
          animationDelay={0.4}
          animationDirection="left"
        />

        <MetricCard
          title="连接的渠道"
          value={stats.channels}
          icon="📡"
          color="info"
          badge="在线"
          badgeType="success"
          isLoaded={isLoaded}
          animationDelay={0.6}
          animationDirection="right"
        />

        <MetricCard
          title="今日消息数"
          value={stats.todayMessages}
          icon="📨"
          color="warning"
          badge="今日"
          badgeType="warning"
          isLoaded={isLoaded}
          animationDelay={0.8}
          animationDirection="right"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '25px',
          animationName: isLoaded ? 'fadeInUp' : 'none',
          animationDuration: '0.8s',
          animationTimingFunction: 'ease-out',
          animationDelay: '1.0s',
          animationFillMode: 'both',
        }}
      >
        <ActivityList activities={activities} onViewAll={() => { }} />
        <QuickActions actions={quickActions} />
      </div>
    </div>
  );
}
