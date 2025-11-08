import { useState } from 'react';

interface FilterBarProps {
  onRoleChange: (role: string) => void;
  onExpertiseChange: (expertise: string) => void;
  onSearch: (query: string) => void;
  totalCount: {
    total: number;
    owners: number;
    participants: number;
  };
}

export default function FilterBar({
  onRoleChange,
  onExpertiseChange,
  onSearch,
  totalCount,
}: FilterBarProps) {
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedExpertise, setSelectedExpertise] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    onRoleChange(role);
  };

  const handleExpertiseChange = (expertise: string) => {
    setSelectedExpertise(expertise);
    onExpertiseChange(expertise);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  return (
    <div>
      {/* 搜索框 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', maxWidth: '600px' }}>
          <span
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '18px',
              color: '#999',
            }}
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="搜索智能体名称、性格特征..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '12px 48px 12px 48px',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4a90e2';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e0e0e0';
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: '4px',
            }}
          >
            <button
              style={{
                padding: '6px 12px',
                border: '1px solid #e0e0e0',
                backgroundColor: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>🎛</span>
              <span>筛选</span>
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #e0e0e0',
                backgroundColor: viewMode === 'grid' ? '#f5f5f5' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={viewMode === 'grid' ? '切换到列表视图' : '切换到网格视图'}
            >
              {viewMode === 'grid' ? '⊞' : '☰'}
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                width: '36px',
                height: '36px',
                border: '1px solid #e0e0e0',
                backgroundColor: viewMode === 'list' ? '#f5f5f5' : 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="列表视图"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* 筛选器和统计 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* 左侧筛选器 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* 角色筛选 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>角色:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'all', label: '全部' },
                { value: 'owner', label: '主持人' },
                { value: 'participant', label: '参与者' },
              ].map((role) => (
                <button
                  key={role.value}
                  onClick={() => handleRoleChange(role.value)}
                  style={{
                    padding: '6px 16px',
                    border: 'none',
                    backgroundColor: selectedRole === role.value ? '#1a1a1a' : '#f5f5f5',
                    color: selectedRole === role.value ? 'white' : '#666',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: selectedRole === role.value ? '500' : '400',
                    transition: 'all 0.2s',
                  }}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* 专长筛选 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>专长:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 'all', label: '全部' },
                { value: 'customer-service', label: '小姐服务' },
                { value: 'business', label: '创业战略' },
                { value: 'finance', label: '商业模式' },
                { value: 'implementation', label: '资源管理' },
                { value: 'growth', label: '增长策略' },
              ].map((expertise) => (
                <button
                  key={expertise.value}
                  onClick={() => handleExpertiseChange(expertise.value)}
                  style={{
                    padding: '6px 16px',
                    border: 'none',
                    backgroundColor:
                      selectedExpertise === expertise.value ? '#1a1a1a' : '#f5f5f5',
                    color: selectedExpertise === expertise.value ? 'white' : '#666',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: selectedExpertise === expertise.value ? '500' : '400',
                    transition: 'all 0.2s',
                  }}
                >
                  {expertise.label}
                </button>
              ))}
              <button
                style={{
                  padding: '6px 16px',
                  border: 'none',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                +108
              </button>
            </div>
          </div>
        </div>

        {/* 右侧统计 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', fontSize: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👥</span>
            <span style={{ color: '#666' }}>总计:</span>
            <span style={{ fontWeight: '600' }}>{totalCount.total} 个智能体</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👤</span>
            <span style={{ color: '#666' }}>主持人:</span>
            <span style={{ fontWeight: '600' }}>{totalCount.owners} 个</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🙋</span>
            <span style={{ color: '#666' }}>参与者:</span>
            <span style={{ fontWeight: '600' }}>{totalCount.participants} 个</span>
          </div>
        </div>
      </div>
    </div>
  );
}
