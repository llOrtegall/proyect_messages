import { SendHorizonal, Paperclip } from 'lucide-react';
import { type FormEvent, type ChangeEvent } from 'react';

interface PropsForm {
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
	onSendFile: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const FormSendMessage = ({ onSubmit, onSendFile }: PropsForm) => {
	return (
		<form onSubmit={onSubmit} className='flex items-center gap-1 w-full'>
			<input
				type='text'
				name='newMessageText'
				required
				placeholder='Send message here'
				className='border border-slate-300 flex-grow bg-white px-4 rounded-md py-2 w-full'
			/>
			<button type='submit'
				className='bg-blue-500 hover:bg-blue-600 text-white rounded p-2 cursor-pointer'>
				<SendHorizonal />
			</button>

			<label htmlFor="file" className='bg-blue-500 text-white cursor-pointer p-2 rounded-md hover:bg-blue-700 flex items-center justify-center'>
				<Paperclip />
				<input type="file" id='file' className='hidden' onChange={onSendFile} />
			</label>
		</form>
	)
}