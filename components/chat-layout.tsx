"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { apiClient, type RoomDto } from "@/lib/api-client";
import { useWebSocket, type BusEvent } from "@/lib/use-websocket";
import { RoomsList } from "./rooms-list";
import { UsersList } from "./users-list";
import { ChatView } from "./chat-view";
import { CreateDirectRoomModal } from "./create-direct-room-modal";

type Tab = "chats" | "users";

const ROOMS_POLL_INTERVAL = 5_000;

export function ChatLayout() {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tab, setTab] = useState<Tab>("chats");
  const [latestEvent, setLatestEvent] = useState<{ event: BusEvent; seq: number } | null>(null);

  const selectedRoomIdRef = useRef(selectedRoomId);
  selectedRoomIdRef.current = selectedRoomId;

  const seenMsgIds = useRef(new Set<string>());

  const { logout, user } = useAuth();
  const router = useRouter();
  const currentUserIdRef = useRef(user?.id);
  currentUserIdRef.current = user?.id;

  // Load + poll rooms
  const loadRooms = useCallback(async () => {
    try {
      const data = await apiClient.listRooms();
      setRooms(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadRooms();
    const id = setInterval(loadRooms, ROOMS_POLL_INTERVAL);
    return () => clearInterval(id);
  }, [loadRooms]);

  // Global WS — subscribed to ALL rooms at once
  const roomIds = rooms.map((r) => r.id);

  const handleGlobalEvent = useCallback((event: BusEvent) => {
    const activeRoom = selectedRoomIdRef.current;

    if (event.kind === "message.created") {
      const { id: msgId, roomId: msgRoomId, senderId } = event.message;

      // Update lastMessageAt in the sidebar and move room to top
      setRooms((prev) =>
        prev
          .map((r) => r.id === msgRoomId ? { ...r, lastMessageAt: new Date() } : r)
          .sort((a, b) => {
            const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return bt - at;
          })
      );

      // Badge: solo para rooms no activos, mensajes ajenos, sin duplicar
      if (msgRoomId !== activeRoom && senderId !== currentUserIdRef.current) {
        if (!seenMsgIds.current.has(msgId)) {
          seenMsgIds.current.add(msgId);
          setUnread((prev) => ({ ...prev, [msgRoomId]: (prev[msgRoomId] ?? 0) + 1 }));
        }
        return;
      }
    }

    // Forward to ChatView
    setLatestEvent({ event, seq: Date.now() });
  }, []);

  const { connected, sendWs, sendWsRequest } = useWebSocket(roomIds, handleGlobalEvent);

  // Select a room → clear its badge
  const selectRoom = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
    setUnread((prev) => ({ ...prev, [roomId]: 0 }));
  }, []);

  const handleRoomCreated = useCallback((roomId: string) => {
    loadRooms();
    selectRoom(roomId);
    setTab("chats");
  }, [loadRooms, selectRoom]);

  const handleRoomDeleted = useCallback(() => {
    setSelectedRoomId(null);
    loadRooms();
  }, [loadRooms]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r border-slate-700">
        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-slate-700">
          {(["chats", "users"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition relative ${
                t === "chats" && tab !== "chats" && Object.values(unread).some((v) => v > 0)
                  ? "text-blue-400"
                  : tab === t ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "chats" ? "Chats" : "Usuarios"}
              {t === "chats" && tab !== "chats" && Object.values(unread).some((v) => v > 0) && (
                <span className="absolute top-0.5 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === "chats" ? (
            <>
              <RoomsList
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onSelectRoom={selectRoom}
                onCreateRoom={() => setShowCreateModal(true)}
                unreadCounts={unread}
              />
              <div className="p-3 border-t border-slate-700">
                <button
                  onClick={handleLogout}
                  className="w-full bg-slate-800 hover:bg-red-900/60 hover:text-red-400 text-slate-400 font-medium py-2 rounded-lg transition text-sm"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          ) : (
            <UsersList onStartDm={handleRoomCreated} />
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {selectedRoomId ? (
          <ChatView
            roomId={selectedRoomId}
            connected={connected}
            sendWs={sendWs}
            sendWsRequest={sendWsRequest}
            latestEvent={latestEvent}
            onBack={() => setSelectedRoomId(null)}
            onRoomDeleted={handleRoomDeleted}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-500">
              <p className="text-lg font-semibold mb-1">Sin conversación activa</p>
              <p className="text-sm">Selecciona un chat o ve a Usuarios para iniciar uno</p>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDirectRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}
