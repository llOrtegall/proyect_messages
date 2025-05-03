import { ArrowLeftFromLine, MessageSquare } from 'lucide-react'
import { FormSendMessage } from '@/components/form-sendMessage'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/auth/AuthProvider'
import { Footer } from '@/components/footer'
import axios from 'axios'

const WS_URL = import.meta.env.VITE_WS_URL

interface Message {
	type: string
	content: string
	from: string
	to: string
}

interface UserChat {
	id: string
	username: string
}

interface MessageData {
	onlineUsers: UserChat[]
	messages: Message
}

export default function ChatApp() {
	const [ws, setWs] = useState<WebSocket | null>(null)
	const [onlinePeople, setOnlinePeople] = useState<UserChat[]>([])
	const [offlinePeople, setOfflinePeople] = useState<UserChat[]>([])
	const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
	const [messages, setMessages] = useState<Message[]>([])

	const { user } = useAuth()

	const messagesEndRef = useRef<HTMLDivElement>(null)

	const handleMessage = (e: MessageEvent) => {
		const messageData: MessageData = JSON.parse(e.data)

		if (messageData.onlineUsers) {
			if (user) {
				setOnlinePeople(messageData.onlineUsers.filter(u => u.id !== user.id))
			}
		} else if (messageData.messages) {
			setMessages(prev => [...prev, messageData.messages])
		}
	}

	const sendMessage = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const data = new FormData(e.currentTarget)
		const newMessage = data.get('newMessageText') as string

		if (ws && selectedContactId && user?.id && newMessage) {
			ws.send(JSON.stringify({
				type: 'message',
				content: newMessage,
				to: selectedContactId,
				from: user.id
			}));

			setMessages(prev => [...prev, {
				type: 'message',
				content: newMessage,
				to: selectedContactId,
				from: user.id
			}])
		}
		e.currentTarget.reset()
	}

	const connetToWs = () => {
		const ws = new WebSocket(WS_URL)
		setWs(ws)

		ws.addEventListener('message', handleMessage);
		ws.addEventListener('close', () => {
			console.log('Connection closed');
			setTimeout(() => {
				console.log('Try... Reconnecting...');
				connetToWs()
			}, 10000)
		})
	}

	// TODO: this is a ws connection, initialize it
	useEffect(() => {
		connetToWs()
	}, [])

	useEffect(() => {
		const div = messagesEndRef.current
		if (div) {
			div.scrollIntoView({ behavior: 'smooth', block: 'end' })
		}
	}, [messages])

	useEffect(() => {
		if (selectedContactId) {
			axios.get(`/messages/${selectedContactId}`)
				.then((response) => {
					setMessages(response.data)
				})
				.catch((error) => {
					console.error(error)
				})
		}
	}, [selectedContactId])

	useEffect(() => {
		axios.get('/people')
			.then((response) => {
				setOfflinePeople(response.data)
			})
			.catch((error) => {
				console.error(error)
			})
	}, [onlinePeople])

	return (
		<section className='h-screen flex'>

			<section className='w-3/12 bg-slate-100 p-2 h-screen'>
				<header className='flex items-center gap-2 text-blue-700 font-bold justify-center pt-2 pb-3 border-b-2 border-slate-200'>
					<MessageSquare />
					<h1>Chat App Ortega</h1>
				</header>

				<ul className='gap-2 py-2 h-[calc(80vh-50px)] overflow-y-auto'>
					{onlinePeople.map((user) => (
						<li
							onClick={() => setSelectedContactId(user.id)}
							className={`border-b px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-200 rounded-md 
							${selectedContactId === user.id ? 'bg-blue-200' : ''}`} key={user.id}>
							{
								user.id === selectedContactId && (
									<div className='w-1 h-8 rounded-md bg-blue-500'></div>
								)
							}
							<Avatar initialString={user.username[0]} id={user.id} online={true} />
							<span>{user.username}</span>
						</li>
					))}
					{offlinePeople.map((user) => (
						<li className='border-b px-4 py-2 flex items-center gap-2' key={user.id}>
							<Avatar initialString={user.username[0]} id={user.id} online={false} />
							<span>{user.username}</span>
						</li>
					))}
				</ul>

				<Footer username={user?.username || ""} />
			</section>

			<main className='w-9/12 bg-slate-200 p-2'>

				<div className='h-[90vh]'>
					{
						selectedContactId ? (
							<section className='relative h-full'>
								<ul className='overflow-y-auto absolute top-10 right-2 left-2 bottom-4 space-y-2'>
									{messages.map((message, index) => (
										<li
											key={index}
											className={`p-2 rounded-md max-w-[80%] ${message.from === user?.id
												? 'ml-auto bg-blue-700 text-white'
												: 'mr-auto bg-blue-200 text-black'
												}`}
										>
											{message.content}
										</li>
									))}
									<div ref={messagesEndRef}></div>
								</ul>
							</section>
						) : (
							<div className='text-center flex items-center justify-center h-full gap-2'>
								<ArrowLeftFromLine />
								<span>Select a contact to start a conversation</span>
							</div>
						)
					}
				</div>

				{
					!!selectedContactId && (
						<FormSendMessage onSubmit={sendMessage} />
					)
				}
			</main>
		</section>
	)
}
