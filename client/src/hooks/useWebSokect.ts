import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (WS_URL: string, handleMessage: (event: MessageEvent) => void) => {
	const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
	const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		let ws: WebSocket;

		const connectToWs = () => {
			ws = new WebSocket(WS_URL);
			wsRef.current = ws;
			setWsInstance(ws);

			const handleOpen = () => {
				console.log('Connected to WebSocket');
			};

			const handleClose = () => {
				console.log('Connection closed');
				reconnectTimeout.current = setTimeout(() => {
					console.log('Trying to reconnect...');
					connectToWs();
				}, 10000);
			};

			const handleError = (err: Event) => {
				console.error('WebSocket error', err);
				ws.close(); // Forzar cierre para reconectar
			};

			const handleMessageWrapper = (event: MessageEvent) => {
				handleMessage(event);
			};

			ws.addEventListener('open', handleOpen);
			ws.addEventListener('message', handleMessageWrapper);
			ws.addEventListener('close', handleClose);
			ws.addEventListener('error', handleError);

			// Cleanup cuando el componente se desmonta
			const cleanup = () => {
				if (reconnectTimeout.current) {
					clearTimeout(reconnectTimeout.current);
				}
				ws.removeEventListener('open', handleOpen);
				ws.removeEventListener('message', handleMessageWrapper);
				ws.removeEventListener('close', handleClose);
				ws.removeEventListener('error', handleError);
				ws.close();
			};

			return cleanup;
		};

		const cleanupFn = connectToWs();

		return () => {
			cleanupFn();
		};
	}, [WS_URL]);

	return wsInstance;
};
