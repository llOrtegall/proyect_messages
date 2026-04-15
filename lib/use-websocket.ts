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

export function useWebSocket(roomId: string | null, onEvent?: (event: BusEvent) => void) {
  const { accessToken } = useAuth();
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (!accessToken || !roomId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = new URL("/ws", process.env.NEXT_PUBLIC_API_URL || window.location.origin);
    wsUrl.protocol = protocol;
    wsUrl.searchParams.set("token", accessToken);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      ws.send(
        JSON.stringify({
          type: "subscribe",
          payload: { roomId },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data);
        if (message.payload && typeof message.payload === "object" && "kind" in message.payload) {
          onEvent?.(message.payload as BusEvent);
        }
      } catch (e) {
        console.error("Failed to parse WS message:", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [accessToken, roomId, onEvent]);

  useEffect(() => {
    const disconnect = connect();
    return disconnect;
  }, [connect]);

  const send = useCallback((event: BusEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "event",
          payload: event,
        })
      );
    }
  }, []);

  return { connected, send };
}
