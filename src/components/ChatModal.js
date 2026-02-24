import React from 'react';
import { User, X, Loader2, Send } from 'lucide-react';

const ChatModal = ({
  chatPartner,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  chatError,
  chatMessagesEndRef,
  authUser,
  closeChat,
  sendChatMessage
}) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '360px',
      maxHeight: '480px',
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 2000,
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <User size={18} />
          <span style={{ fontWeight: '600', fontSize: '14px' }}>{chatPartner.nickname}</span>
        </div>
        <X size={18} style={{ cursor: 'pointer', opacity: 0.9 }} onClick={closeChat} />
      </div>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minHeight: '250px',
        maxHeight: '320px',
        background: '#f8fafc'
      }}>
        {chatLoading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <div style={{ marginTop: '8px', fontSize: '13px' }}>Connecting...</div>
          </div>
        ) : chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 16px', fontSize: '13px' }}>
            No messages yet. Say hi to {chatPartner.nickname}!
          </div>
        ) : (
          chatMessages.map((msg, i) => {
            const isMe = msg.from === authUser?.uid;
            return (
              <div key={i} style={{
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '80%'
              }}>
                {!isMe && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px', marginLeft: '4px' }}>
                    {msg.nickname || chatPartner.nickname}
                  </div>
                )}
                <div style={{
                  padding: '8px 12px',
                  borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: isMe ? '#3b82f6' : '#fff',
                  color: isMe ? '#fff' : '#1e293b',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  border: isMe ? 'none' : '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                  {msg.text}
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  marginTop: '2px',
                  textAlign: isMe ? 'right' : 'left',
                  marginLeft: '4px',
                  marginRight: '4px'
                }}>
                  {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        {/* Scroll anchor */}
        <div ref={chatMessagesEndRef} />
      </div>

      {/* Error banner */}
      {chatError && (
        <div style={{
          padding: '6px 12px',
          background: '#fef2f2',
          color: '#dc2626',
          fontSize: '12px',
          textAlign: 'center',
          borderTop: '1px solid #fecaca'
        }}>
          {chatError}
        </div>
      )}

      {/* Chat Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        gap: '8px',
        background: '#fff'
      }}>
        <input
          type="text"
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
          placeholder="Type a message..."
          autoFocus
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            outline: 'none'
          }}
        />
        <button
          onClick={sendChatMessage}
          disabled={!chatInput.trim()}
          style={{
            background: chatInput.trim() ? '#3b82f6' : '#94a3b8',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: chatInput.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s'
          }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatModal;
