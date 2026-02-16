import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "./types";

export async function listChatMessages(limit = 100): Promise<ChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_message")
    .select("*")
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function createChatMessage(
  msg: Omit<ChatMessage, "id">,
): Promise<ChatMessage> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_message")
    .insert(msg as Record<string, unknown>)
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function updateChatMessage(
  id: number,
  updates: Partial<ChatMessage>,
): Promise<ChatMessage> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("chat_message")
    .update(updates as Record<string, unknown>)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ChatMessage;
}

export async function createChatMentions(
  messageId: number,
  mentionedIds: string[],
): Promise<void> {
  const supabase = createClient();
  const rows = mentionedIds.map((mentioned) => ({
    message: messageId,
    mentioned,
  }));
  const { error } = await supabase
    .from("chat_mentions")
    .insert(rows as Record<string, unknown>[]);
  if (error) throw error;
}
