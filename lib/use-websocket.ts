import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./auth-context";

export interface WsMessage {
  type: string;
  refId?: string;
  payload: unknown;
  ts: number;
}

interface MessagePayload {
  id: string;
  roomId: string;
  senderId: string;
  body: string;
  attachmentKey: string | null;
  attachmentMeta: Record<string, unknown> | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
}

export type BusEvent =
  | { kind: "message.created"; message: MessagePayload; originUserId: string }
  | { kind: "message.edited"; message: MessagePayload }
  | { kind: "message.deleted"; messageId: string; roomId: string }
  | { kind: "message.read"; roomId: string; userId: string; messageId: string }
  | { kind: "user.typing"; roomId: string; userId: string }
  | { kind: "user.online"; userId: string }
  | { kind: "user.offline"; userId: string };

const MAX_RETRY_DELAY_MS = 30_000;
const HEARTBEAT_INTERVAL_MS = 20_000;

function parseEvent(msg: WsMessage): BusEvent | null {
  const p = msg.payload as Record<string, unknown>;
  switch (msg.type) {
    case "message.created":
      return { kind: "message.created", message: p as unknown as MessagePayload, originUserId: p.senderId as string };
    case "message.edited":
      return { kind: "message.edited", message: p as unknown as MessagePayload };
    case "message.deleted":
      return { kind: "message.deleted", messageId: p.messageId as string, roomId: p.roomId as string };
    case "message.read":
      return { kind: "message.read", roomId: p.roomId as string, userId: p.userId as string, messageId: p.messageId as string };
    case "user.typing":
      return { kind: "user.typing", roomId: p.roomId as string, userId: p.userId as string };
    case "presence.online":
      return { kind: "user.online", userId: p.userId as string };
    case "presence.offline":
      return { kind: "user.offline", userId: p.userId as string };
    default:
      return null;
  }
}

export function useWebSocket(roomIds: string[], onEvent?: (event: BusEvent) => void) {
  const { accessToken } = useAuth();
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const activeRef = useRef(false);

  const accessTokenRef = useRef(accessToken);
  const roomIdsRef = useRef(roomIds);
  const onEventRef = useRef(onEvent);
  accessTokenRef.current = accessToken;
  roomIdsRef.current = roomIds;
  onEventRef.current = onEvent;

  const pendingRef = useRef<Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>>(new Map());

  const subscribe = useCallback((ws: WebSocket, ids: string[]) => {
    if (ids.length > 0 && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "chat.subscribe", payload: { roomIds: ids } }));
    }
  }, []);

  const connect = useCallback(() => {
    const token = accessTokenRef.current;
    if (!token || !activeRef.current) return;

    const state = wsRef.current?.readyState;
    if (state === WebSocket.CONNECTING || state === WebSocket.OPEN) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const wsUrl = new URL("/ws", apiUrl);
    wsUrl.protocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
    wsUrl.searchParams.set("token", token);

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryCountRef.current = 0;
      subscribe(ws, roomIdsRef.current);
      heartbeatRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "presence.heartbeat", payload: {} }));
        }
      }, HEARTBEAT_INTERVAL_MS);
    };

    ws.onmessage = (rawEvent) => {
      try {
        const msg = JSON.parse(rawEvent.data as string) as WsMessage;
        if (msg.type === "ack") {
          const pending = pendingRef.current.get(msg.refId ?? "");
          if (pending) {
            clearTimeout(pending.timer);
            pending.resolve(msg.payload);
            pendingRef.current.delete(msg.refId ?? "");
          }
          return;
        }
        if (msg.type === "error") {
          const pending = pendingRef.current.get(msg.refId ?? "");
          if (pending) {
            clearTimeout(pending.timer);
            const payload = msg.payload as { message?: string } | undefined;
            pending.reject(new Error(payload?.message || "WS error"));
            pendingRef.current.delete(msg.refId ?? "");
          }
          return;
        }
        const busEvent = parseEvent(msg);
        if (busEvent) onEventRef.current?.(busEvent);
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      for (const pending of pendingRef.current.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error("WebSocket disconnected"));
      }
      pendingRef.current.clear();
      if (!activeRef.current) return;
      const delay = Math.min(1_000 * 2 ** retryCountRef.current, MAX_RETRY_DELAY_MS);
      retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
      retryTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => setConnected(false);
  }, [subscribe]);

  // Connect/disconnect lifecycle
  useEffect(() => {
    if (!accessToken) return;
    activeRef.current = true;
    retryCountRef.current = 0;
    connect();
    return () => {
      activeRef.current = false;
      if (retryTimeoutRef.current) { clearTimeout(retryTimeoutRef.current); retryTimeoutRef.current = null; }
      if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
      for (const pending of pendingRef.current.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error("WebSocket disconnected"));
      }
      pendingRef.current.clear();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [accessToken, connect]);

  // Re-subscribe when roomIds grow (new rooms discovered via polling)
  const prevIdsRef = useRef<string>("");
  useEffect(() => {
    const joined = [...roomIds].sort().join(",");
    if (joined === prevIdsRef.current) return;
    prevIdsRef.current = joined;
    if (wsRef.current?.readyState === WebSocket.OPEN && roomIds.length > 0) {
      subscribe(wsRef.current, roomIds);
    }
  }, [roomIds, subscribe]);

  const sendWs = useCallback((type: string, payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const sendWsRequest = useCallback((type: string, payload: unknown): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const ws = wsRef.current;
      if (ws?.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }
      const refId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timer = setTimeout(() => {
        if (pendingRef.current.has(refId)) {
          pendingRef.current.delete(refId);
          reject(new Error("WebSocket request timeout"));
        }
      }, 10000);
      pendingRef.current.set(refId, { resolve, reject, timer });
      ws.send(JSON.stringify({ type, payload, refId }));
    });
  }, []);

  return { connected, sendWs, sendWsRequest };
}
