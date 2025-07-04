import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react';
import type { File, Message, MessageData, UserChat } from '@/types/interfaces';
import { ArrowLeftFromLine, MessageSquare } from 'lucide-react';
import { FormSendMessage } from '@/components/form-sendMessage';
import { MessageComponent } from '@/components/Message';
import { useWebSocket } from '@/hooks/useWebSokect';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/auth/AuthProvider';
import { Footer } from '@/components/footer';
import axios from 'axios';

const WS_URL = import.meta.env.VITE_WS_URL

export default function ChatApp() {
	const [onlinePeople, setOnlinePeople] = useState<UserChat[]>([])
	// const [offlinePeople, setOfflinePeople] = useState<UserChat[]>([])
	const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
	const [messages, setMessages] = useState<Message[]>([])
	const [notification, setNotification] = useState<{ from: string, count: number }[]>([])

	const { user } = useAuth()

	const messagesEndRef = useRef<HTMLDivElement>(null)

	const handleMessage = (e: MessageEvent) => {
		const messageData: MessageData = JSON.parse(e.data)

		// show online users and remove me
		if (messageData.type === 'onlineUsers' && messageData.data instanceof Array) {
			const removeMe = messageData.data.filter((u: UserChat) => user?.id !== u.id)
			setOnlinePeople(removeMe)
		}

		if (messageData.type === 'newMessage' && messageData.data instanceof Object) {
			const newMessage = messageData.data as Message
			setMessages(prev => [...prev, newMessage])

			setNotification(prev => {
				const index = prev.findIndex((n) => n.from === newMessage.from)
				if (index !== -1) {
					prev[index].count++
					return [...prev]
				}
				return [...prev, { from: newMessage.from, count: 1 }]
			})
		}

		if (messageData.type === 'newFile' && messageData.data instanceof Object) {
			const newFile = messageData.data as File
			setMessages(prev => [...prev, {
				from: newFile.from,
				to: newFile.to,
				content: newFile.name,
				file: true
			}])
		}
	}

	const handleSelectContact = (id: string) => {
		setSelectedContactId(id)
		setNotification(prev => prev.filter((n) => n.from !== id))
	}

	const ws = useWebSocket(WS_URL, handleMessage)

	useEffect(() => {
		const div = messagesEndRef.current
		if (div) {
			div.scrollIntoView({ behavior: 'smooth', block: 'end' })
		}
	}, [messages])

	const sendMessage = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const data = new FormData(e.currentTarget)
		const newMessage = data.get('newMessageText') as string

		if (ws && selectedContactId && user?.id && newMessage) {
			ws.send(JSON.stringify({
				type: 'newMessage',
				data: {
					content: newMessage,
					to: selectedContactId,
					from: user.id
				}
			}));

			setMessages(prev => [...prev, {
				content: newMessage,
				to: selectedContactId,
				from: user.id
			}])
		}
		e.currentTarget.reset()
	}

	const handlePressEsc = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			setSelectedContactId(null)
		}
	}

	const handleSendFile = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];

		if (!file) return
		const dateGenerated = Date.now();
		const extension = file.name.split('.').pop() || 'file';
		const nameFile = `${dateGenerated}.${extension}`;

		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = () => {
			ws?.send(JSON.stringify({
				type: 'newFile',
				data: {
					name: nameFile,
					content: reader.result,
					to: selectedContactId,
					from: user?.id,
					info: {
						type: file.type,
						size: file.size
					}
				}
			}));

			setMessages(prev => [...prev, {
				from: user?.id ?? '',
				to: selectedContactId ?? '',
				content: nameFile,
				file: true
			}])
		}

		// reset input file
		e.target.value = '';
	}

	useEffect(() => {
		document.addEventListener('keydown', handlePressEsc)
		return () => {
			document.removeEventListener('keydown', handlePressEsc)
		}
	}, [])

	useEffect(() => {
		if (selectedContactId) {
			axios.get('/messages', { params: { id: selectedContactId } })
				.then(res => {
					setMessages(res.data)
				})
				.catch(err => console.log(err))
		}
	}, [selectedContactId])

	return (
		<section className='h-screen flex'>

			<section className='w-3/12 bg-slate-100 p-2 h-screen'>
				<header className='flex items-center gap-2 text-blue-700 font-bold justify-center pt-2 pb-3 border-b-2 border-slate-200'>
					<MessageSquare />
					<h1>Chat App</h1>
				</header>

				<ul className='gap-2 py-2 h-[calc(80vh-50px)] overflow-y-auto'>
					{onlinePeople.map((user) => (
						<li
							onClick={() => handleSelectContact(user.id)}
							className={`border-b px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-200 rounded-md 
							${selectedContactId === user.id ? 'bg-blue-200' : ''}`} key={user.id}>
							{
								user.id === selectedContactId && (
									<div className='w-1 h-8 rounded-md bg-blue-500'></div>
								)
							}
							<Avatar initialString={user?.username[0] ?? 'U'} id={user?.id ?? ''} online={true} />
							<span>{user?.username}</span>

							{notification.find((n) => n.from === user?.id)?.count && (
								<span className='bg-green-500 border shadow-md borderbg-gray-700 text-white rounded-full size-6 flex items-center justify-center'>
									{notification.find((n) => n.from === user?.id)?.count}
								</span>
							)}

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
								<ul className='overflow-y-auto absolute top-10 right-2 left-2 bottom-4 space-y-4'>
									{messages.filter((message) => message.from === selectedContactId || message.to === selectedContactId).map((message, index) => (
										<MessageComponent
											key={index}
											content={message.content}
											isFile={message.file ?? false}
											isOwnMessage={message.from === user?.id}
										/>
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
						<FormSendMessage onSubmit={sendMessage} onSendFile={handleSendFile} />
					)
				}
			</main>
		</section>
	)
}
