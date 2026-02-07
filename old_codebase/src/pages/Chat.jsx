import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/usePermissions';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Send, MessageCircle, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Chat() {
  const { can } = usePermissions();
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
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

  // Fetch messages with auto-refresh every second
  const { data: messages } = useQuery({
    queryKey: ['chat-messages'],
    queryFn: () => base44.entities.ChatMessage.list('-created_date', 100),
    initialData: [],
    refetchInterval: 1000 // Auto refresh every second
  });

  const { data: allStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: []
  });

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

    sendMessageMutation.mutate({
      message: message.trim(),
      sender_name: user.full_name,
      sender_email: user.email,
      mentioned_users: mentions
    });
  };

  const filteredStaff = allStaff.filter(s => {
    if (!s.login_email || !s.mention_name) return false;
    const search = mentionSearch.toLowerCase();
    return s.mention_name.toLowerCase().includes(search) || s.name.toLowerCase().includes(search);
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, 100);
  }, []);

  // Reverse messages to show newest at bottom
  const sortedMessages = [...messages].reverse();

  // Get unique users count
  const uniqueUsers = new Set(messages.map(m => m.sender_email)).size;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-indigo-600" />
              Csapat Chat
            </h1>
            <p className="text-slate-500">Valós idejű kommunikáció a csapattal</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
            <Users className="w-4 h-4" />
            <span>{uniqueUsers} aktív felhasználó</span>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {sortedMessages.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                  <p className="text-lg font-medium">Még nincsenek üzenetek</p>
                  <p className="text-sm">Légy te az első, aki üzenetet küld!</p>
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
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.deleted 
                            ? 'bg-slate-50 border border-slate-200 text-slate-400 italic' 
                            : isMentioned && !isOwnMessage
                              ? 'bg-yellow-50 border-2 border-yellow-300 text-slate-900 shadow-md'
                              : isOwnMessage
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">
                            {msg.sender_name}
                          </span>
                          <span
                            className={`text-xs ${
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
                              className="text-xs underline hover:no-underline text-red-500 hover:text-red-600 border border-red-200 px-1.5 py-0.5 rounded"
                            >
                              visszavonás
                            </button>
                          ) : (
                            <button
                              onClick={() => deleteMessageMutation.mutate(msg.id)}
                              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 border border-red-200 px-1.5 py-0.5 rounded"
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

          {can('chat', 'send') && (
          <div className="border-t p-4 relative">
            {showMentions && filteredStaff.length > 0 && (
              <div className="absolute bottom-full left-4 right-4 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-[999]">
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
                className="flex-1 resize-none overflow-y-auto"
                style={{ height: '40px', maxHeight: '120px' }}
                disabled={!user}
                rows={1}
              />
              <Button
                type="submit"
                disabled={!message.trim() || !user}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}