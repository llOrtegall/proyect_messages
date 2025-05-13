import { WebSocket } from "ws";

export interface User {
  id: string;
  username: string;
}

export interface Message {
  from: string;
  content: string;
  to: string;
}

export interface File {
  name: string;
  type: string;
  size: number;
  content: string;
}

export interface DataWs {
  type: string
  data: Message | File
}

export interface SocketClient extends WebSocket {
  id?: string;
  username?: string;
  isAlive?: boolean;
  timer?: NodeJS.Timeout;
  deathTimer?: NodeJS.Timeout;
}
