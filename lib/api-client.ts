const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ApiError {
  error: string;
  detail?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface RoomDto {
  id: string;
  kind: string;
  name: string | null;
  createdBy: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
}

export interface RoomWithMembersDto extends RoomDto {
  members: {
    userId: string;
    role: string;
    joinedAt: Date;
    lastReadMessageId: string | null;
    mutedUntil: Date | null;
  }[];
}

export interface MessageDto {
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

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    path: string,
    method: string,
    body?: unknown
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: "Unknown error",
      }));
      throw error;
    }

    return response.json();
  }

  // Auth
  register(email: string, password: string, displayName: string) {
    return this.request<AuthResponse>("/api/v1/auth/register", "POST", {
      email,
      password,
      displayName,
    });
  }

  login(email: string, password: string) {
    return this.request<AuthResponse>("/api/v1/auth/login", "POST", {
      email,
      password,
    });
  }

  async logout(accessToken: string) {
    const oldToken = this.accessToken;
    this.accessToken = accessToken;
    const promise = this.request("/api/v1/auth/logout", "POST", {});
    this.accessToken = oldToken;
    return promise;
  }

  async getMe() {
    const response = await this.request<{ user: PublicUser }>("/api/v1/auth/me", "GET");
    return response.user;
  }

  // Users
  async getUser(id: string) {
    const response = await this.request<{ user: PublicUser }>(
      `/api/v1/users/${id}`,
      "GET"
    );
    return response.user;
  }

  // Rooms
  async listRooms() {
    const response = await this.request<{ rooms: RoomDto[] }>("/api/v1/rooms", "GET");
    return response.rooms;
  }

  async getRoom(id: string) {
    const response = await this.request<{ room: RoomWithMembersDto }>(
      `/api/v1/rooms/${id}`,
      "GET"
    );
    return response.room;
  }

  async createDirectRoom(targetUserId: string) {
    const response = await this.request<{ room: RoomDto }>("/api/v1/rooms", "POST", {
      targetUserId,
    });
    return response.room;
  }

  async createGroupRoom(name: string, memberIds: string[] = []) {
    const response = await this.request<{ room: RoomDto }>("/api/v1/rooms", "POST", {
      name,
      memberIds,
    });
    return response.room;
  }

  addMember(roomId: string, userId: string, role: string = "member") {
    return this.request(`/api/v1/rooms/${roomId}/members`, "POST", {
      userId,
      role,
    });
  }

  removeMember(roomId: string, userId: string) {
    return this.request(`/api/v1/rooms/${roomId}/members`, "DELETE", {
      userId,
    });
  }

  // Messages
  async listMessages(roomId: string, before?: string, limit: number = 50) {
    const query = new URLSearchParams();
    if (before) query.append("before", before);
    query.append("limit", limit.toString());
    const response = await this.request<{ messages: MessageDto[] }>(
      `/api/v1/rooms/${roomId}/messages?${query}`,
      "GET"
    );
    return response.messages;
  }

  async sendMessage(roomId: string, body: string, attachmentKey?: string) {
    const response = await this.request<{ message: MessageDto }>(
      `/api/v1/rooms/${roomId}/messages`,
      "POST",
      {
        roomId,
        body,
        attachmentKey,
      }
    );
    return response.message;
  }

  async editMessage(messageId: string, body: string) {
    const response = await this.request<{ message: MessageDto }>(
      `/api/v1/messages/${messageId}`,
      "PATCH",
      {
        body,
      }
    );
    return response.message;
  }

  deleteMessage(messageId: string) {
    return this.request(`/api/v1/messages/${messageId}`, "DELETE");
  }
}

export const apiClient = new ApiClient();
