import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/usePermissions';
import { format } from 'date-fns';
import { Send, MessageCircle, X, Minimize2, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FloatingChat() {
  const { can } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [selectedChat, setSelectedChat] = useState('general');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const lastMessageCountRef = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error('Failed to fetch user', e);
      }
    };
    fetchUser();
  }, []);

  const { data: allMessages } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date', 100),
    initialData: [],
    refetchInterval: 1000
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.Program.list('date'),
    initialData: []
  });

  const { data: allStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: []
  });

  const activePrograms = programs.filter(p => ['varakozo', 'tervezes', 'proba_alatt', 'vegeleges'].includes(p.status));
  
  const messages = selectedChat === 'general' 
    ? allMessages.filter(m => !m.program_id)
    : allMessages.filter(m => m.program_id === selectedChat);

  // Track unread messages - csak akkor, ha megemlítettek
  useEffect(() => {
    if (!isOpen && messages.length > lastMessageCountRef.current && user) {
      const newMessages = messages.slice(0, messages.length - lastMessageCountRef.current);
      const mentionedMessages = newMessages.filter(m => 
        m.mentioned_users?.includes(user.email) && m.sender_email !== user.email
      );
      if (mentionedMessages.length > 0) {
        setUnreadCount(prev => prev + mentionedMessages.length);
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, isOpen, user]);

  // Reset unread when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chat-messages']);
      setMessage('');
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.ChatMessage.update(id, { deleted: true }),
    onSuccess: () => queryClient.invalidateQueries(['chat-messages'])
  });

  const undeleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.ChatMessage.update(id, { deleted: false }),
    onSuccess: () => queryClient.invalidateQueries(['chat-messages'])
  });

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Check for @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.substring(lastAtIndex + 1);
      // Ha van szóköz a @ után, rejtsd el a listát
      if (searchText.includes(' ')) {
        setShowMentions(false);
      } else {
        // Egyébként mutasd a listát és szűrj
        setShowMentions(true);
        setMentionSearch(searchText);
        setMentionPosition(lastAtIndex);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (mentionName) => {
    const beforeMention = message.substring(0, mentionPosition);
    const afterMention = message.substring(mentionPosition + 1 + mentionSearch.length);
    setMessage(beforeMention + '@' + mentionName + ' ' + afterMention);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    // Extract mentions from message
    const mentionRegex = /@(\S+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      const mentionedName = match[1];
      const staff = allStaff.find(s => s.mention_name?.toLowerCase() === mentionedName.toLowerCase());
      if (staff?.login_email) {
        mentions.push(staff.login_email);
      }
    }

    const messageData = {
      message: message.trim(),
      sender_name: user.full_name,
      sender_email: user.email,
      mentioned_users: mentions
    };

    if (selectedChat !== 'general') {
      messageData.program_id = selectedChat;
    }

    sendMessageMutation.mutate(messageData);
  };

  const filteredStaff = allStaff.filter(s => {
    if (!s.login_email || !s.mention_name) return false;
    const search = mentionSearch.toLowerCase();
    return s.mention_name.toLowerCase().includes(search) || s.name.toLowerCase().includes(search);
  });

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 0);
    }
  }, [isOpen, isMinimized]);

  const sortedMessages = [...messages].reverse();
  const uniqueUsers = new Set(messages.map(m => m.sender_email)).size;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 w-6 h-6 flex items-center justify-center p-0 bg-red-500 text-white text-xs rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col z-50 transition-all ${
      isMinimized ? 'w-80 h-14' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="bg-indigo-600 text-white p-3 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="font-semibold">Chat</h3>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-indigo-700 p-1 rounded transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-indigo-700 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {!isMinimized && (
          <Select value={selectedChat} onValueChange={setSelectedChat}>
            <SelectTrigger className="bg-indigo-700 border-0 text-white h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Chat</SelectItem>
              {activePrograms.map(prog => (
                <SelectItem key={prog.id} value={prog.id}>
                  {prog.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {sortedMessages.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                  <p className="text-sm">Még nincsenek üzenetek</p>
                </div>
              ) : (
                sortedMessages.map((msg) => {
                  const isOwnMessage = msg.sender_email === user?.email;
                  const isMentioned = msg.mentioned_users?.includes(user?.email);

                  // Render message with highlighted mentions
                  const renderMessage = (text) => {
                    if (msg.deleted) return 'Törölt üzenet';

                    const parts = text.split(/(@\S+)/g);
                    return parts.map((part, i) => {
                      if (part.startsWith('@')) {
                        const mentionedName = part.slice(1);
                        const staff = allStaff.find(s => s.mention_name?.toLowerCase() === mentionedName.toLowerCase());
                        const isSelf = staff?.login_email === user?.email;
                        return (
                          <span 
                            key={i} 
                            className={`font-bold ${
                              isSelf 
                                ? 'bg-yellow-200 text-slate-900 px-1 rounded' 
                                : isOwnMessage ? 'text-indigo-100' : 'text-indigo-600'
                            }`}
                          >
                            {part}
                          </span>
                        );
                      }
                      return part;
                    });
                  };

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-2.5 ${
                          msg.deleted 
                            ? 'bg-slate-50 border border-slate-200 text-slate-400 italic' 
                            : isMentioned && !isOwnMessage
                              ? 'bg-yellow-50 border-2 border-yellow-300 text-slate-900 shadow-md'
                              : isOwnMessage
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-xs">
                            {msg.sender_name}
                          </span>
                          <span
                            className={`text-[10px] ${
                              msg.deleted ? 'text-slate-400' :
                              isMentioned && !isOwnMessage ? 'text-slate-500' :
                              isOwnMessage ? 'text-indigo-200' : 'text-slate-500'
                            }`}
                          >
                            {format(new Date(msg.created_date), 'HH:mm')}
                          </span>
                          {msg.deleted ? (
                            <button
                              onClick={() => undeleteMessageMutation.mutate(msg.id)}
                              className="text-[10px] underline hover:no-underline text-red-500 hover:text-red-600 border border-red-200 px-1.5 py-0.5 rounded"
                            >
                              visszavonás
                            </button>
                          ) : (
                            <button
                              onClick={() => deleteMessageMutation.mutate(msg.id)}
                              className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 border border-red-200 px-1.5 py-0.5 rounded"
                            >
                              törlés
                            </button>
                          )}
                        </div>
                        <p className="text-sm break-words">
                          {renderMessage(msg.message)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          {can('chat', 'send') && (
          <div className="border-t p-3 relative">
            {showMentions && filteredStaff.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-[999]">
                {filteredStaff.map(staff => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleMentionSelect(staff.mention_name)}
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2 border-b last:border-b-0"
                    >
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{staff.name}</span>
                      <span className="text-xs text-slate-500">@{staff.mention_name}</span>
                    </div>
                    </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                ref={inputRef}
                value={message}
                onChange={handleMessageChange}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Írj üzenetet... (@név említéshez)"
                className="flex-1 text-sm resize-none overflow-y-auto"
                style={{ height: '36px', maxHeight: '120px' }}
                disabled={!user}
                rows={1}
              />
              <Button
                type="submit"
                disabled={!message.trim() || !user}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
          )}
        </>
      )}
    </div>
  );
}