import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import axios from 'axios';
import './index.css';

axios.defaults.baseURL = import.meta.env.VITE_API_URL
axios.defaults.withCredentials = true

createRoot(document.getElementById('root')!).render(<App />)
