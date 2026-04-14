"use client";

import { useState, useEffect, useRef } from "react";
import { apiClient, type MessageDto } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useWebSocket, type BusEvent } from "@/lib/use-websocket";

interface ChatViewProps {
  roomId: string;
  onBack: () => void;
}

export function ChatView({ roomId, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { connected } = useWebSocket(roomId, (event: BusEvent) => {
    if (event.kind === "message.created" && event.message.roomId === roomId) {
      setMessages((prev) => [...prev, event.message]);
    } else if (event.kind === "message.edited") {
      setMessages((prev) =>
        prev.map((m) => (m.id === event.message.id ? event.message : m))
      );
    } else if (event.kind === "message.deleted") {
      setMessages((prev) => prev.filter((m) => m.id !== event.messageId));
    } else if (event.kind === "user.typing") {
      setTyping((prev) => new Set(prev).add(event.userId));
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTyping((prev) => {
          const newSet = new Set(prev);
          newSet.delete(event.userId);
          return newSet;
        });
      }, 3000);
    }
  });

  useEffect(() => {
    loadMessages();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await apiClient.listMessages(roomId);
      setMessages(data);
    } catch (err) {
      console.error("Failed to load messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || sending) return;

    setSending(true);
    setError("");

    try {
      const message = await apiClient.sendMessage(roomId, messageBody);
      setMessages((prev) => [...prev, message]);
      setMessageBody("");
    } catch (err) {
      console.error("Failed to send message:", err);
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300">
        <button onClick={onBack} className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back
        </button>
        <div className="text-right">
          <h2 className="font-bold">Chat</h2>
          <div className={`text-xs ${connected ? "text-green-600" : "text-red-600"}`}>
            {connected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">No messages yet</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === user?.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <p className="break-words">{msg.body}</p>
                <p className={`text-xs mt-1 ${msg.senderId === user?.id ? "text-blue-100" : "text-gray-600"}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typing.size > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500">
          {Array.from(typing).join(", ")} is typing...
        </div>
      )}

      {/* Error */}
      {error && <div className="px-4 py-2 bg-red-50 text-red-700 text-sm">{error}</div>}

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-300">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!messageBody.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium px-4 py-2 rounded-lg transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
