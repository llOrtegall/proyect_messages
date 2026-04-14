"use client";

import { useState, useCallback } from "react";
import { type RoomDto } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface RoomsListProps {
  rooms: RoomDto[];
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: () => void;
  unreadCounts: Record<string, number>;
}

function getRoomName(room: RoomDto) {
  return room.kind === "dm" ? room.name || "Direct Message" : room.name || "Unnamed Group";
}

export function RoomsList({ rooms, selectedRoomId, onSelectRoom, onCreateRoom, unreadCounts }: RoomsListProps) {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const copyId = useCallback(() => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [user?.id]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={onCreateRoom}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-sm"
        >
          + Nueva conversación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="p-4 text-slate-500 text-sm">Sin conversaciones. ¡Crea una!</div>
        ) : (
          <div className="space-y-0.5 p-2">
            {rooms.map((room) => {
              const unread = unreadCounts[room.id] ?? 0;
              const isSelected = selectedRoomId === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition ${
                    isSelected ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 text-[9px] font-bold px-1 py-0.5 rounded ${
                      room.kind === "dm" ? "bg-blue-900/60 text-blue-400" : "bg-purple-900/60 text-purple-400"
                    }`}>
                      {room.kind === "dm" ? "DM" : "G"}
                    </span>
                    <span className="font-medium text-sm truncate flex-1">{getRoomName(room)}</span>
                    {unread > 0 && !isSelected && (
                      <span className="shrink-0 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                  {room.lastMessageAt && (
                    <div className={`text-xs mt-0.5 ml-6 ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                      {new Date(room.lastMessageAt).toLocaleString("es-ES", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700 text-sm space-y-1">
        <div className="font-medium text-slate-100">{user?.displayName}</div>
        <div className="text-slate-400 text-xs">{user?.email}</div>
        <button
          onClick={copyId}
          title="Copiar mi User ID"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition mt-1 w-full text-left"
        >
          <span className="font-mono truncate">{user?.id}</span>
          <span className="shrink-0">{copied ? "✓" : "⎘"}</span>
        </button>
      </div>
    </div>
  );
}
