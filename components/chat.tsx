import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  listChatMessages,
  createChatMessage,
  updateChatMessage,
  createChatMentions,
} from "@/lib/db/chat";
import { listStaff } from "@/lib/db/staff";
import type { ChatMessage, Staff } from "@/lib/db/types";

export default function Chat({
  canSend,
  program,
  onPresenceUpdate,
}: {
  canSend: boolean;
  program?: number;
  onPresenceUpdate?: (count: number) => void;
}) {
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
  } | null>(null);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(
    null,
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser({ id: user.id, email: user.email });
          const { data: staffData } = await supabase
            .from("staff")
            .select("*")
            .eq("id", user.id)
            .single();
          if (staffData) {
            setCurrentStaff(staffData as Staff);
          }
        }
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    };
    fetchUser();
  }, [supabase.auth]);

  const { data: allStaff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => listStaff(),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      message: string;
      mentionedStaffIds: string[];
    }) => {
      if (!currentUser) throw new Error("Not authenticated");
      const msg = await createChatMessage({
        message: data.message,
        sender: currentUser.id,
        deleted: false,
        program: program ?? null,
      });
      if (data.mentionedStaffIds.length > 0) {
        await createChatMentions(msg.id, data.mentionedStaffIds);
      }
      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      setMessage("");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id: number) => updateChatMessage(id, { deleted: true }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] }),
  });

  const undeleteMessageMutation = useMutation({
    mutationFn: (id: number) => updateChatMessage(id, { deleted: false }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] }),
  });

  const getStaffName = (staffId: string): string => {
    const staff = allStaff.find((s) => s.id === staffId);
    return staff?.name ?? "Ismeretlen";
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.substring(lastAtIndex + 1);
      if (searchText.includes(" ")) {
        setShowMentions(false);
      } else {
        setShowMentions(true);
        setMentionSearch(searchText);
        setMentionPosition(lastAtIndex);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (mentionName: string) => {
    const beforeMention = message.substring(0, mentionPosition);
    const afterMention = message.substring(
      mentionPosition + 1 + mentionSearch.length,
    );
    setMessage(beforeMention + "@" + mentionName + " " + afterMention);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    const mentionRegex = /@(\S+)/g;
    const mentionedStaffIds: string[] = [];
    let match;
    while ((match = mentionRegex.exec(message)) !== null) {
      const mentionedName = match[1];
      const staff = allStaff.find(
        (s) => s.mention_name?.toLowerCase() === mentionedName.toLowerCase(),
      );
      if (staff) {
        mentionedStaffIds.push(staff.id);
      }
    }

    sendMessageMutation.mutate({
      message: message,
      mentionedStaffIds,
    });
  };

  const filteredStaff = allStaff.filter((s) => {
    if (!s.mention_name) return false;
    const search = mentionSearch.toLowerCase();
    return (
      s.mention_name.toLowerCase().includes(search) ||
      (s.name?.toLowerCase().includes(search) ?? false)
    );
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const channelName = `chat-${program ? "program-" + program : "global"}`;
  useEffect(() => {
    listChatMessages(100, program).then(setMessages);

    const channel = supabase.channel(`${channelName}-changes`);
    const changes = channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_message",
          filter: `program=eq.${program ? program : "null"}`,
        },
        (payload) => {
          console.log(payload);
          if (payload.eventType == "INSERT")
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
          else if (payload.eventType == "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as ChatMessage) : msg,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(changes);
    };
  }, [supabase, messages, setMessages]);

  // Attach a scroll listener to the Radix ScrollArea viewport to track if user is near bottom
  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
    };

    viewport.addEventListener("scroll", handleScroll);
    return () => viewport.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll: always on initial load, otherwise only if user is near the bottom
  useEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;

    const sb = supabaseRef.current;
    const channel = sb.channel(`${channelName}-presence`, {
      config: { presence: { key: currentUser.id } },
    });
    presenceChannelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        if (onPresenceUpdate) onPresenceUpdate(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: currentUser.id });
        }
      });

    return () => {
      presenceChannelRef.current = null;
      sb.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const renderMessageText = (
    text: string,
    isOwnMessage: boolean,
    msgDeleted: boolean | null,
  ) => {
    if (msgDeleted) return <span className="italic">Törölt üzenet</span>;

    const parts = text.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const mentionedName = part.slice(1);
        const staff = allStaff.find(
          (s) => s.mention_name?.toLowerCase() === mentionedName.toLowerCase(),
        );
        const isSelf = staff?.id === currentUser?.id;
        return (
          <span
            key={i}
            className={`font-bold whitespace-pre-line ${
              isSelf
                ? "bg-yellow-200 text-slate-900 px-1 rounded"
                : isOwnMessage
                  ? "text-indigo-100"
                  : "text-indigo-600"
            }`}
          >
            {part}
          </span>
        );
      }
      return (
        <span key={i} className="whitespace-pre-line ">
          {part}
        </span>
      );
    });
  };

  return (
    <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
      <ScrollArea
        className="flex-1 overflow-hidden min-h-0"
        ref={(node) => {
          // Grab the Radix viewport element inside the ScrollArea root
          if (node) {
            const viewport = (node as HTMLElement).querySelector(
              '[data-slot="scroll-area-viewport"]',
            );
            scrollViewportRef.current = viewport as HTMLDivElement | null;
          }
        }}
      >
        <div className="p-6">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-lg font-medium">Még nincsenek üzenetek</p>
                <p className="text-sm">Légy te az első, aki üzenetet küld!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.sender === currentUser?.id;
                // Check if current user is mentioned via chat_mentions
                // For simplicity, check @mention_name in text
                const isMentioned =
                  currentStaff?.mention_name &&
                  msg.message
                    .toLowerCase()
                    .includes(`@${currentStaff.mention_name.toLowerCase()}`);

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} group`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.deleted
                          ? "bg-slate-50 border border-slate-200 text-slate-400 italic"
                          : isMentioned && !isOwnMessage
                            ? "bg-yellow-50 border-2 border-yellow-300 text-slate-900 shadow-md"
                            : isOwnMessage
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {getStaffName(msg.sender)}
                        </span>
                        <span
                          className={`text-xs ${
                            msg.deleted
                              ? "text-slate-400"
                              : isMentioned && !isOwnMessage
                                ? "text-slate-500"
                                : isOwnMessage
                                  ? "text-indigo-200"
                                  : "text-slate-500"
                          }`}
                        >
                          {/* chat_message doesn't have created_date in new schema, use id as proxy */}
                        </span>
                        {msg.deleted && isOwnMessage ? (
                          <button
                            onClick={() =>
                              undeleteMessageMutation.mutate(msg.id)
                            }
                            className="text-xs underline hover:no-underline text-red-500 hover:text-red-600 border border-red-200 px-1.5 py-0.5 rounded"
                          >
                            visszavonás
                          </button>
                        ) : (
                          isOwnMessage && (
                            <button
                              onClick={() =>
                                deleteMessageMutation.mutate(msg.id)
                              }
                              className="text-xs opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 border border-red-200 px-1.5 py-0.5 rounded"
                            >
                              törlés
                            </button>
                          )
                        )}
                      </div>
                      <p className="text-sm break-words">
                        {renderMessageText(
                          msg.message,
                          isOwnMessage,
                          msg.deleted,
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      {canSend && (
        <div className="border-t p-4 relative">
          {showMentions && filteredStaff.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-[999]">
              {filteredStaff.map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => handleMentionSelect(staff.mention_name ?? "")}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm flex items-center gap-2 border-b last:border-b-0"
                >
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                    {(staff.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{staff.name}</span>
                    <span className="text-xs text-slate-500">
                      @{staff.mention_name}
                    </span>
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
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Írj üzenetet... (@név említéshez)"
              className="flex-1 resize-none overflow-y-auto"
              style={{ height: "40px", maxHeight: "120px" }}
              disabled={!currentUser}
              rows={1}
            />
            <Button
              type="submit"
              disabled={!message.trim() || !currentUser}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </CardContent>
  );
}
