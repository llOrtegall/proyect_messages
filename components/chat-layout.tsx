"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { RoomsList } from "./rooms-list";
import { ChatView } from "./chat-view";
import { CreateDirectRoomModal } from "./create-direct-room-modal";

export function ChatLayout() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleRoomCreated = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Sidebar */}
      <div className="w-64 flex flex-col border-r">
        <RoomsList
          selectedRoomId={selectedRoomId}
          onSelectRoom={setSelectedRoomId}
          onCreateRoom={() => setShowCreateModal(true)}
        />
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {selectedRoomId ? (
          <ChatView roomId={selectedRoomId} onBack={() => setSelectedRoomId(null)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to Chat</h2>
              <p>Select a room or create a new one to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateDirectRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}
