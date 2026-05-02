"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, type RoomDto } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface RoomsListProps {
  selectedRoomId: string | null;
  onSelectRoom: (roomId: string) => void;
  onCreateRoom: () => void;
}

export function RoomsList({ selectedRoomId, onSelectRoom, onCreateRoom }: RoomsListProps) {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  const copyId = useCallback(() => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [user?.id]);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await apiClient.listRooms();
      setRooms(data);
    } catch (err) {
      console.error("Failed to load rooms:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRoomName = (room: RoomDto) => {
    if (room.kind === "dm") {
      return room.name || "Direct Message";
    }
    return room.name || "Unnamed Group";
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="font-bold text-lg mb-3 text-slate-100">Chats</h2>
        <button
          onClick={onCreateRoom}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-sm"
        >
          + Nueva conversación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-slate-500 text-sm">Cargando…</div>
        ) : rooms.length === 0 ? (
          <div className="p-4 text-slate-500 text-sm">Sin conversaciones. ¡Crea una!</div>
        ) : (
          <div className="space-y-0.5 p-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition ${
                  selectedRoomId === room.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-slate-800 text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {room.kind === "dm" ? "💬" : "👥"}
                  </span>
                  <span className="font-medium text-sm truncate">{getRoomName(room)}</span>
                </div>
                {room.lastMessageAt && (
                  <div className={`text-xs mt-0.5 ml-6 ${selectedRoomId === room.id ? "text-blue-100" : "text-slate-500"}`}>
                    {new Date(room.lastMessageAt).toLocaleDateString("es-ES")}
                  </div>
                )}
              </button>
            ))}
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
