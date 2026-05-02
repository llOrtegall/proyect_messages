"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api-client";

interface CreateDirectRoomModalProps {
  onClose: () => void;
  onCreated: (roomId: string) => void;
}

type Tab = "dm" | "group";

export function CreateDirectRoomModal({ onClose, onCreated }: CreateDirectRoomModalProps) {
  const [tab, setTab] = useState<Tab>("dm");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // DM state
  const [targetUserId, setTargetUserId] = useState("");

  // Group state
  const [groupName, setGroupName] = useState("");
  const [memberIdInput, setMemberIdInput] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const addMember = () => {
    const id = memberIdInput.trim();
    if (id && !memberIds.includes(id)) {
      setMemberIds((prev) => [...prev, id]);
    }
    setMemberIdInput("");
  };

  const removeMember = (id: string) => setMemberIds((prev) => prev.filter((m) => m !== id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "dm") {
        const room = await apiClient.createDirectRoom(targetUserId.trim());
        onCreated(room.id);
      } else {
        const room = await apiClient.createGroupRoom(groupName.trim(), memberIds);
        onCreated(room.id);
      }
      onClose();
    } catch (err: unknown) {
      const e = err as { detail?: string; error?: string };
      setError(e.detail || e.error || "Error al crear la conversación");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = tab === "dm" ? targetUserId.trim().length > 0 : groupName.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Nueva conversación</h2>

        {/* Tabs */}
        <div className="flex mb-5 bg-slate-900 rounded-lg p-1 gap-1">
          {(["dm", "group"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${
                tab === t
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t === "dm" ? "Mensaje directo" : "Grupo"}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "dm" ? (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">User ID del destinatario</label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Pega el UUID del otro usuario"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-1">
                El otro usuario puede copiar su ID desde el pie del sidebar.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del grupo</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej: Equipo backend"
                  maxLength={128}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Agregar miembros (opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberIdInput}
                    onChange={(e) => setMemberIdInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addMember(); } }}
                    placeholder="User ID"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={addMember}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition"
                  >
                    +
                  </button>
                </div>
                {memberIds.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {memberIds.map((id) => (
                      <li key={id} className="flex items-center justify-between bg-slate-900 rounded px-2 py-1 text-xs font-mono text-slate-300">
                        <span className="truncate">{id}</span>
                        <button
                          type="button"
                          onClick={() => removeMember(id)}
                          className="ml-2 text-slate-500 hover:text-red-400 transition shrink-0"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded-lg transition text-sm font-medium"
            >
              {loading ? "Creando..." : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
