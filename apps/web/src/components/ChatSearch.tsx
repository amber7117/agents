import { useState } from 'react';
import { chatHistoryManager } from '../utils/chatHistory';

interface SearchResult {
  contactId: string;
  message: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
}

export function ChatSearch({ 
  onSelectContact 
}: { 
  onSelectContact: (contactId: string) => void; 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    // 模拟搜索延迟
    setTimeout(() => {
      const results = chatHistoryManager.searchMessages(term);
      const formattedResults: SearchResult[] = results.map(msg => ({
        contactId: msg.from === 'me' ? 'unknown' : msg.from,
        message: msg.text,
        timestamp: msg.timestamp,
        direction: msg.direction
      }));
      
      setSearchResults(formattedResults);
      setShowResults(true);
      setIsSearching(false);
    }, 300);
  };

  const formatContactId = (contactId: string) => {
    if (contactId === 'unknown') return '我发送的消息';
    const phoneNumber = contactId.split('@')[0];
    if (phoneNumber.length > 10) {
      return `+${phoneNumber.slice(0, 3)} ${phoneNumber.slice(3, 6)} ${phoneNumber.slice(6)}`;
    }
    return phoneNumber;
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark style="background: rgba(102, 126, 234, 0.3); color: #667eea;">$1</mark>');
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* 搜索框 */}
      <div style={{ 
        position: 'relative',
        marginBottom: showResults ? '16px' : '0'
      }}>
        <input
          type="text"
          placeholder="搜索聊天记录..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px 12px 40px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        
        {/* 搜索图标 */}
        <div style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '16px',
          color: '#b3b3b3'
        }}>
          🔍
        </div>
        
        {/* 加载动画 */}
        {isSearching && (
          <div style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            <div className="loading" style={{ width: '16px', height: '16px' }}></div>
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {showResults && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          maxHeight: '300px',
          overflow: 'auto',
          zIndex: 10
        }}>
          {searchResults.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#808080',
              fontSize: '14px'
            }}>
              没有找到相关消息
            </div>
          ) : (
            <div>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '12px',
                color: '#b3b3b3'
              }}>
                找到 {searchResults.length} 条相关消息
              </div>
              
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (result.contactId !== 'unknown') {
                      onSelectContact(result.contactId);
                      setShowResults(false);
                      setSearchTerm('');
                    }
                  }}
                  style={{
                    padding: '12px 16px',
                    borderBottom: index < searchResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    cursor: result.contactId !== 'unknown' ? 'pointer' : 'default',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    if (result.contactId !== 'unknown') {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#b3b3b3',
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{formatContactId(result.contactId)}</span>
                    <span>
                      {new Date(result.timestamp).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div 
                    style={{
                      fontSize: '14px',
                      color: '#ffffff',
                      lineHeight: '1.4'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: highlightText(result.message, searchTerm)
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}