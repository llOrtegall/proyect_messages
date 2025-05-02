import { Avatar } from "@/components/ui/avatar"
import { MessageSquare, SendHorizonal } from "lucide-react"
import { useEffect, useState } from "react"

const WS_URL = import.meta.env.VITE_WS_URL

interface UserChat {
	id: string
	username: string
}

interface MessageData {
	onlineUsers: UserChat[]
}

export default function ChatApp() {
	const [ws, setWs] = useState<WebSocket | null>(null)
	const [onlinePeople, setOnlinePeople] = useState<UserChat[]>([])
	const [selectedContactId, setSelectedContactId] = useState<string | null>(null)

	console.log(selectedContactId);

	const handleMessage = (e: MessageEvent) => {
		const messageData: MessageData = JSON.parse(e.data)

		if (messageData.onlineUsers) {
			setOnlinePeople(messageData.onlineUsers)
		}
	}

	// TODO: this is a ws connection, initialize it
	useEffect(() => {
		const ws = new WebSocket(WS_URL)
		setWs(ws)

		ws.addEventListener('message', handleMessage)
	}, [])

	return (
		<main className="h-screen flex">
			<section className="w-3/12 bg-slate-100 p-2">
				<header className="flex items-center gap-2 text-blue-700 font-bold justify-center pt-2 pb-3 border-b-2 border-slate-200">
					<MessageSquare />
					<h1>Chat App Ortega</h1>
				</header>

				<ul className="gap-2 py-2">
					{onlinePeople.map((user) => (
						<li
							onClick={() => setSelectedContactId(user.id)}
							className={`border-b px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-200 rounded-md ${selectedContactId === user.id ? 'bg-blue-200' : ''}`} key={user.id}>
							<Avatar initialString={user.username[0]} id={user.id} />
							<span>{user.username}</span>
						</li>
					))}
				</ul>


			</section>
			<section className="w-9/12 bg-slate-200 p-2">

				<div className="h-[calc(100vh-55px)] overflow-y-auto">
					messages with select person
				</div>

				<form className="flex gap-2">
					<input
						type="text"
						placeholder="Send message here"
						className="border border-slate-300 flex-grow bg-white px-2 rounded-md"
					/>
					<button type="submit"
						className="bg-blue-500 text-white rounded p-2">
						<SendHorizonal />
					</button>
				</form>
			</section>
		</main>
	)
}
