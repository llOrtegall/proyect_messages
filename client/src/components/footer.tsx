import { ButtonLogOut } from "./ButtonLogOut"

export const Footer = ({ username }: { username: string }) => {
	return (
		<footer className='flex flex-col gap-2 items-center justify-center'>
			<article>
				<h2>Welcome: <span className='font-bold'>{username}</span></h2>
			</article>
			<ButtonLogOut />
		</footer>
	)
}