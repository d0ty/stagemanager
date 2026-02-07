import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePermissions } from '@/components/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function ProgramChat({ programId }) {
  const { can } = usePermissions();
  const [user, setUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
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

  const { data: messages } = useQuery({
    queryKey: ['program-chat', programId],
    queryFn: () => base44.entities.ChatMessage.filter({ program_id: programId }),
    refetchInterval: 1000,
    initialData: []
  });

  const { data: allStaff } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.Staff.list(),
    initialData: []
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.ChatMessage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['program-chat', programId]);
      setNewMessage('');
    }
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.ChatMessage.update(id, { deleted: true }),
    onSuccess: () => queryClient.invalidateQueries(['program-chat', programId])
  });

  const undeleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.ChatMessage.update(id, { deleted: false }),
    onSuccess: () => queryClient.invalidateQueries(['program-chat', programId])
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, 100);
  }, []);

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
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
    const beforeMention = newMessage.substring(0, mentionPosition);
    const afterMention = newMessage.substring(mentionPosition + 1 + mentionSearch.length);
    setNewMessage(beforeMention + '@' + mentionName + ' ' + afterMention);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Extract mentions from message
    const mentionRegex = /@(\S+)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(newMessage)) !== null) {
      const mentionedName = match[1];
      const staff = allStaff.find(s => s.mention_name?.toLowerCase() === mentionedName.toLowerCase());
      if (staff?.login_email) {
        mentions.push(staff.login_email);
      }
    }

    sendMessageMutation.mutate({
      message: newMessage,
      sender_name: user.full_name,
      sender_email: user.email,
      program_id: programId,
      mentioned_users: mentions
    });
  };

  const filteredStaff = allStaff.filter(s => {
    if (!s.login_email || !s.mention_name) return false;
    const search = mentionSearch.toLowerCase();
    return s.mention_name.toLowerCase().includes(search) || s.name.toLowerCase().includes(search);
  });

  const reversedMessages = [...messages].reverse();

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="w-5 h-5 text-indigo-600" />
          Program Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {reversedMessages.map((msg) => {
              const isOwnMessage = user && msg.sender_email === user.email;
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
                <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[70%] ${
                    msg.deleted 
                      ? 'bg-slate-50 border border-slate-200 text-slate-400 italic' 
                      : isMentioned && !isOwnMessage
                        ? 'bg-yellow-50 border-2 border-yellow-300 text-slate-900 shadow-md'
                        : isOwnMessage 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-100 text-slate-900'
                  } rounded-lg p-3 shadow-sm`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${
                        msg.deleted ? 'text-slate-400' :
                        isMentioned && !isOwnMessage ? 'text-slate-600' :
                        isOwnMessage ? 'text-indigo-100' : 'text-slate-600'
                      }`}>
                        {msg.sender_name}
                      </span>
                      <span className={`text-[10px] ${
                        msg.deleted ? 'text-slate-400' :
                        isMentioned && !isOwnMessage ? 'text-slate-500' :
                        isOwnMessage ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
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
            })}
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
              value={newMessage}
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
              rows={1}
            />
            <Button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 text-white">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
        )}
      </CardContent>
    </Card>
  );
}