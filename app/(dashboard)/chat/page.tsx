"use client";

import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { MessageCircle, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import Chat from "@/components/chat";

export default function ChatPage() {
  const { can } = usePermissions();
  const [activeUsers, setActiveUsers] = useState(0);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-8 h-8 text-indigo-600" />
              Csapat Chat
            </h1>
            <p className="text-slate-500">
              Valós idejű kommunikáció a csapattal
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
            <Users className="w-4 h-4" />
            <span>{activeUsers} aktív felhasználó</span>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        <Chat canSend={can("chat", "send")} onPresenceUpdate={setActiveUsers} />
      </Card>
    </div>
  );
}
