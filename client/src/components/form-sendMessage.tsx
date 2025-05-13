import { SendHorizonal, Paperclip } from 'lucide-react';
import { FormEvent } from 'react';

interface PropsForm {
	onSubmit: (e: FormEvent<HTMLFormElement>) => void;
	onSendFile: (e: FormEvent<HTMLInputElement>) => void;
}

export const FormSendMessage = ({ onSubmit, onSendFile }: PropsForm) => {
	return (
		<div className='flex items-center gap-1'>

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
			</form>

			<form>
				<label htmlFor="file" className='bg-blue-500 text-white cursor-pointer p-2 rounded-md hover:bg-blue-700 flex items-center justify-center'>
					<Paperclip />
					<input type="file" id='file' className='hidden' onChange={onSendFile}/>
				</label>
			</form>

		</div>
	)
}