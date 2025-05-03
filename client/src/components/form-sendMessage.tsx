import { SendHorizonal } from 'lucide-react'
import { FormEvent } from 'react'

interface PropsForm {
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export const FormSendMessage = ({ onSubmit }: PropsForm) => {
	return (
		<form className='flex gap-2' onSubmit={onSubmit}>
			<input
				type='text'
				name='newMessageText'
				required
				placeholder='Send message here'
				className='border border-slate-300 flex-grow bg-white px-2 rounded-md'
			/>
			<button type='submit'
				className='bg-blue-500 text-white rounded p-2'>
				<SendHorizonal />
			</button>
		</form>
	)
}