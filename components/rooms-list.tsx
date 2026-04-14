"use client";

import { useState, useEffect } from "react";
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
  const { user } = useAuth();

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
    if (room.kind === "direct") {
      return room.name || "Direct Message";
    }
    return room.name || "Unnamed Room";
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 border-r border-gray-300 bg-slate-900 text-slate-100">
      <div className="p-4 border-b border-gray-300">
        <h2 className="font-bold text-lg mb-3">Chats</h2>
        <button
          onClick={onCreateRoom}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition text-sm"
        >
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-gray-500 text-sm">Loading...</div>
        ) : rooms.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm">No chats yet. Create one!</div>
        ) : (
          <div className="space-y-1 p-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition ${
                  selectedRoomId === room.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-200 text-gray-900"
                }`}
              >
                <div className="font-medium text-sm">{getRoomName(room)}</div>
                {room.lastMessageAt && (
                  <div className={`text-xs mt-1 ${selectedRoomId === room.id ? "text-blue-100" : "text-gray-500"}`}>
                    {new Date(room.lastMessageAt).toLocaleDateString()}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-300 text-sm">
        <div className="font-medium">{user?.displayName}</div>
        <div className="text-gray-600 text-xs">{user?.email}</div>
      </div>
    </div>
  );
}
