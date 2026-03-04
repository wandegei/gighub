import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Search, MessageSquare, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Messages() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedConvo) {
      loadMessages();
    }
  }, [selectedConvo]);

  const loadData = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    
    const profiles = await base44.entities.Profile.filter({ user_email: userData.email });
    if (profiles.length > 0) setProfile(profiles[0]);
    
    const allMessages = await base44.entities.Message.filter({
      $or: [
        { sender_email: userData.email },
        { receiver_email: userData.email }
      ]
    }, '-created_date');
    
    const convos = {};
    allMessages.forEach(msg => {
      const otherEmail = msg.sender_email === userData.email ? msg.receiver_email : msg.sender_email;
      const otherName = msg.sender_email === userData.email ? msg.receiver_name : msg.sender_name;
      const convoId = msg.conversation_id || `${[msg.sender_email, msg.receiver_email].sort().join('-')}`;
      
      if (!convos[convoId]) {
        convos[convoId] = {
          id: convoId,
          otherEmail,
          otherName,
          lastMessage: msg.message,
          lastMessageTime: msg.created_date,
          unread: msg.receiver_email === userData.email && !msg.is_read ? 1 : 0
        };
      } else {
        if (msg.receiver_email === userData.email && !msg.is_read) {
          convos[convoId].unread++;
        }
      }
    });
    
    setConversations(Object.values(convos));
    setLoading(false);
  };

  const loadMessages = async () => {
    const allMessages = await base44.entities.Message.filter({
      $or: [
        { sender_email: user.email, receiver_email: selectedConvo.otherEmail },
        { sender_email: selectedConvo.otherEmail, receiver_email: user.email }
      ]
    }, 'created_date');
    
    setMessages(allMessages);
    
    const unreadMessages = allMessages.filter(m => m.receiver_email === user.email && !m.is_read);
    for (const msg of unreadMessages) {
      await base44.entities.Message.update(msg.id, { is_read: true });
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    setSending(true);
    
    const convoId = selectedConvo.id;
    await base44.entities.Message.create({
      conversation_id: convoId,
      sender_email: user.email,
      sender_name: profile?.full_name || 'User',
      receiver_email: selectedConvo.otherEmail,
      receiver_name: selectedConvo.otherName,
      message: newMessage,
      is_read: false
    });
    
    await base44.entities.Notification.create({
      user_email: selectedConvo.otherEmail,
      title: 'New Message',
      message: `${profile?.full_name || 'Someone'} sent you a message`,
      type: 'system',
      link: 'Messages'
    });
    
    setNewMessage('');
    setSending(false);
    loadMessages();
    loadData();
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#1E2430] rounded w-48 mb-6" />
          <div className="h-96 bg-[#1E2430] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-6">Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className={`card-dark p-4 overflow-y-auto ${selectedConvo ? 'hidden lg:block' : ''}`}>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input placeholder="Search messages..." className="input-dark pl-10" />
          </div>
          
          {conversations.length > 0 ? (
            <div className="space-y-2">
              {conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => setSelectedConvo(convo)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedConvo?.id === convo.id 
                      ? 'bg-[#FF6B3D]/10 border border-[#FF6B3D]' 
                      : 'hover:bg-[#0A0E1A]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">{convo.otherName}</span>
                    {convo.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#FF6B3D] text-xs flex items-center justify-center" style={{ color: 'black' }}>
                        {convo.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-1">{convo.lastMessage}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {format(new Date(convo.lastMessageTime), 'MMM d, h:mm a')}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No conversations yet</p>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className={`lg:col-span-2 card-dark flex flex-col ${!selectedConvo ? 'hidden lg:flex' : ''}`}>
          {selectedConvo ? (
            <>
              <div className="p-4 border-b border-[#1E2430] flex items-center gap-3">
                <button onClick={() => setSelectedConvo(null)} className="lg:hidden text-[#FF6B3D]">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center">
                  <span className="font-semibold" style={{ color: 'black' }}>
                    {selectedConvo.otherName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-white">{selectedConvo.otherName}</p>
                  <p className="text-sm text-gray-500">{selectedConvo.otherEmail}</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => {
                  const isSent = msg.sender_email === user.email;
                  return (
                    <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        isSent 
                          ? 'bg-gradient-to-r from-[#FF6B3D] to-[#FF5722]' 
                          : 'bg-[#151922]'
                      }`}>
                        <p style={{ color: isSent ? 'black' : 'white' }}>{msg.message}</p>
                        <p className={`text-xs mt-1 ${isSent ? 'text-black/70' : 'text-gray-500'}`}>
                          {format(new Date(msg.created_date), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="p-4 border-t border-[#1E2430]">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="input-dark resize-none"
                    rows={2}
                  />
                  <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="btn-primary">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}