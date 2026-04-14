"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient, type MessageDto, type RoomWithMembersDto } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { BusEvent } from "@/lib/use-websocket";

const sortAsc = (msgs: MessageDto[]) => [...msgs].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

interface ChatViewProps {
  roomId: string;
  connected: boolean;
  sendWs: (type: string, payload: unknown) => void;
  latestEvent: { event: BusEvent; seq: number } | null;
  onBack: () => void;
  onRoomDeleted?: () => void;
}

export function ChatView({ roomId, connected, sendWs, latestEvent, onBack, onRoomDeleted }: ChatViewProps) {
  const [room, setRoom] = useState<RoomWithMembersDto | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Handle incoming WS events forwarded from layout
  useEffect(() => {
    if (!latestEvent) return;
    const { event } = latestEvent;

    if (event.kind === "message.created" && event.message.roomId === roomId) {
      setMessages((prev) => prev.some((m) => m.id === event.message.id) ? prev : sortAsc([...prev, event.message]));
    } else if (event.kind === "message.edited" && event.message.roomId === roomId) {
      setMessages((prev) => prev.map((m) => m.id === event.message.id ? event.message : m));
    } else if (event.kind === "message.deleted" && event.roomId === roomId) {
      setMessages((prev) => prev.filter((m) => m.id !== event.messageId));
    } else if (event.kind === "user.typing" && event.roomId === roomId && event.userId !== user?.id) {
      setTyping((prev) => new Set(prev).add(event.userId));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping((prev) => { const s = new Set(prev); s.delete(event.userId); return s; });
      }, 3000);
    }
  }, [latestEvent, roomId, user?.id]);

  useEffect(() => {
    setMessages([]);
    setRoom(null);
    setEditingId(null);
    setError("");
    loadRoom();
    loadMessages();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (editingId) editInputRef.current?.focus();
  }, [editingId]);

  const loadRoom = async () => {
    try {
      const data = await apiClient.getRoom(roomId);
      setRoom(data);
    } catch { /* non-critical */ }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listMessages(roomId);
      setMessages(sortAsc(data));
    } catch {
      setError("No se pudieron cargar los mensajes");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const message = await apiClient.sendMessage(roomId, messageBody);
      setMessages((prev) => prev.some((m) => m.id === message.id) ? prev : sortAsc([...prev, message]));
      setMessageBody("");
    } catch {
      setError("No se pudo enviar el mensaje");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => sendWs("chat.typing", { roomId });

  const cancelEdit = () => { setEditingId(null); setEditBody(""); };

  const submitEdit = async (messageId: string) => {
    if (!editBody.trim()) return;
    try {
      const updated = await apiClient.editMessage(messageId, editBody.trim());
      setMessages((prev) => prev.map((m) => m.id === messageId ? updated : m));
      cancelEdit();
    } catch {
      setError("No se pudo editar el mensaje");
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await apiClient.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      setError("No se pudo borrar el mensaje");
    }
  };

  const handleDeleteRoom = async () => {
    const label = room?.kind === "dm" ? "esta conversación" : `el grupo "${room?.name}"`;
    if (!confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)) return;
    try {
      await apiClient.deleteRoom(roomId);
      onRoomDeleted?.();
    } catch {
      setError("No se pudo eliminar la conversación");
    }
  };

  const formatTime = (date: Date | string) =>
    new Date(date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  const roomTitle = room ? (room.kind === "dm" ? "Mensaje directo" : room.name ?? "Grupo") : "…";
  const roomSubtitle = room?.kind === "group" ? `${room.members.length} miembro${room.members.length !== 1 ? "s" : ""}` : null;
  const myMember = room?.members.find((m) => m.userId === user?.id);
  const canDeleteRoom = room?.kind === "dm" || myMember?.role === "owner";

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-100 transition text-lg leading-none">←</button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-slate-100 truncate">{roomTitle}</h2>
          {roomSubtitle && <p className="text-xs text-slate-400">{roomSubtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${connected ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
            {connected ? "conectado" : "sin conexión"}
          </div>
          {canDeleteRoom && (
            <button onClick={handleDeleteRoom} title="Eliminar conversación" className="text-slate-500 hover:text-red-400 transition text-sm px-1.5 py-0.5 rounded hover:bg-slate-800">
              🗑
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="text-center text-slate-500 text-sm pt-8">Cargando mensajes…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 text-sm pt-8">Sin mensajes aún. ¡Di algo!</div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === user?.id;
            const isEditing = editingId === msg.id;
            return (
              <div key={msg.id} className={`group flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
                {isOwn && !isEditing && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition mb-1">
                    <button onClick={() => { setEditingId(msg.id); setEditBody(msg.body); }} className="text-xs text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-700 transition" title="Editar">✎</button>
                    <button onClick={() => handleDelete(msg.id)} className="text-xs text-slate-500 hover:text-red-400 px-1.5 py-0.5 rounded hover:bg-slate-700 transition" title="Borrar">✕</button>
                  </div>
                )}
                <div className={`max-w-sm flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {isEditing ? (
                    <div className="flex gap-1 w-72">
                      <input ref={editInputRef} value={editBody} onChange={(e) => setEditBody(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") submitEdit(msg.id); if (e.key === "Escape") cancelEdit(); }}
                        className="flex-1 px-3 py-1.5 bg-slate-700 border border-blue-500 rounded-lg text-slate-100 text-sm focus:outline-none" />
                      <button onClick={() => submitEdit(msg.id)} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs transition">✓</button>
                      <button onClick={cancelEdit} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs transition">✕</button>
                    </div>
                  ) : (
                    <div className={`px-3 py-2 rounded-2xl ${isOwn ? "bg-blue-600 text-white rounded-br-sm" : "bg-slate-700 text-slate-100 rounded-bl-sm"}`}>
                      <p className="break-words text-sm leading-relaxed">{msg.body}</p>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-500 mt-0.5 px-1">
                    {formatTime(msg.createdAt)}{msg.editedAt && " · editado"}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {typing.size > 0 && <div className="px-4 py-1 text-xs text-slate-500 italic">Alguien está escribiendo…</div>}
      {error && <div className="mx-4 mb-2 px-3 py-2 bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg">{error}</div>}

      <form onSubmit={handleSend} className="px-4 py-3 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageBody}
            onChange={(e) => { setMessageBody(e.target.value); handleTyping(); }}
            placeholder="Escribe un mensaje…"
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={sending}
          />
          <button type="submit" disabled={!messageBody.trim() || sending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl transition text-sm font-medium">
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}
