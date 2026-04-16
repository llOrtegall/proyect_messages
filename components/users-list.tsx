"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, type PublicUser } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

interface UserWithPresence extends PublicUser {
  isOnline: boolean;
}

interface UsersListProps {
  onStartDm: (roomId: string) => void;
}

export function UsersList({ onStartDm }: UsersListProps) {
  const [users, setUsers] = useState<UserWithPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const { user: me } = useAuth();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.listUsers();
      setUsers(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDm = async (userId: string) => {
    setStarting(userId);
    try {
      const room = await apiClient.createDirectRoom(userId);
      onStartDm(room.id);
    } catch {
      // silent
    } finally {
      setStarting(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 pt-2 pb-1">
        <span className="text-xs text-slate-500">{users.filter((u) => u.isOnline).length} conectado{users.filter((u) => u.isOnline).length !== 1 ? "s" : ""}</span>
        <button
          onClick={load}
          className="text-xs text-slate-500 hover:text-slate-300 transition"
          title="Recargar"
        >
          ↺
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-slate-500 text-sm">Cargando…</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-slate-500 text-sm">No hay otros usuarios registrados.</div>
        ) : (
          <div className="space-y-0.5 p-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-slate-800 group"
              >
                {/* Indicador online */}
                <span className={`shrink-0 w-2 h-2 rounded-full ${u.isOnline ? "bg-green-400" : "bg-slate-600"}`} />

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate">{u.displayName}</div>
                  <div className="text-xs text-slate-500 truncate">{u.email}</div>
                </div>

                <button
                  onClick={() => handleDm(u.id)}
                  disabled={starting === u.id}
                  title="Iniciar chat directo"
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg transition"
                >
                  {starting === u.id ? "…" : "DM"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {me && (
        <div className="p-4 border-t border-slate-700 text-sm space-y-0.5">
          <div className="text-slate-100 font-medium">{me.displayName} <span className="text-green-400 text-xs">● tú</span></div>
          <div className="text-slate-500 text-xs">{me.email}</div>
        </div>
      )}
    </div>
  );
}
