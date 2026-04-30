import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./auth-context";

export interface WsMessage {
  type: string;
  id?: string;
  refId?: string;
  payload: unknown;
  ts: number;
}

export type BusEvent =
  | {
      kind: "message.created";
      message: {
        id: string;
        roomId: string;
        senderId: string;
        body: string;
        attachmentKey: string | null;
        attachmentMeta: Record<string, unknown> | null;
        editedAt: Date | null;
        deletedAt: Date | null;
        createdAt: Date;
      };
      refId?: string;
      originUserId: string;
    }
  | {
      kind: "message.edited";
      message: {
        id: string;
        roomId: string;
        senderId: string;
        body: string;
        attachmentKey: string | null;
        attachmentMeta: Record<string, unknown> | null;
        editedAt: Date | null;
        deletedAt: Date | null;
        createdAt: Date;
      };
    }
  | { kind: "message.deleted"; messageId: string; roomId: string }
  | { kind: "message.read"; roomId: string; userId: string; messageId: string }
  | { kind: "user.typing"; roomId: string; userId: string }
  | { kind: "user.online"; userId: string; roomId?: string }
  | { kind: "user.offline"; userId: string; roomId?: string };

const MAX_RETRY_DELAY_MS = 30_000;

export function useWebSocket(roomId: string | null, onEvent?: (event: BusEvent) => void) {
  const { accessToken } = useAuth();
  const [connected, setConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const activeRef = useRef(false);

  // Stable refs so connect() doesn't need them as deps
  const accessTokenRef = useRef(accessToken);
  const roomIdRef = useRef(roomId);
  const onEventRef = useRef(onEvent);
  accessTokenRef.current = accessToken;
  roomIdRef.current = roomId;
  onEventRef.current = onEvent;

  // Stable connect function — reads all mutable values from refs
  const connect = useCallback(() => {
    const token = accessTokenRef.current;
    const room = roomIdRef.current;
    if (!token || !room || !activeRef.current) return;

    const state = wsRef.current?.readyState;
    if (state === WebSocket.CONNECTING || state === WebSocket.OPEN) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || window.location.origin;
    const wsUrl = new URL("/ws", apiUrl);
    wsUrl.protocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
    wsUrl.searchParams.set("token", token);

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      retryCountRef.current = 0;
      ws.send(JSON.stringify({ type: "subscribe", payload: { roomId: room } }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        if (msg.payload && typeof msg.payload === "object" && "kind" in msg.payload) {
          onEventRef.current?.(msg.payload as BusEvent);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;
      if (!activeRef.current) return;
      // Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (cap)
      const delay = Math.min(1_000 * 2 ** retryCountRef.current, MAX_RETRY_DELAY_MS);
      retryCountRef.current = Math.min(retryCountRef.current + 1, 5);
      retryTimeoutRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => setConnected(false);
  }, []); // stable — no deps, reads from refs

  useEffect(() => {
    if (!accessToken || !roomId) return;

    activeRef.current = true;
    retryCountRef.current = 0;
    connect();

    return () => {
      activeRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [accessToken, roomId, connect]);

  const send = useCallback((event: BusEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "event", payload: event }));
    }
  }, []);

  return { connected, send };
}
