import { Image } from 'lucide-react';
import axios from 'axios';

interface MessageProps {
  content: string;
  isFile: boolean;
  isOwnMessage: boolean;
  onClick?: () => void;
}

export function MessageComponent({ content, isFile, isOwnMessage, onClick }: MessageProps) {
  const messageClasses = isOwnMessage 
    ? 'bg-blue-700 text-white ml-auto' 
    : 'bg-blue-200 text-black mr-auto';

  const fileClasses = isOwnMessage 
    ? 'bg-blue-600 hover:bg-blue-800' 
    : 'bg-blue-300 hover:bg-blue-400';

  return (
    <li className={`p-3 rounded-lg max-w-[80%] ${messageClasses} transition-colors duration-200`}> 
      {isFile ? (
        <a 
          href={`${axios.defaults.baseURL}/uploads/${content}`} 
          target='_blank' 
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 p-2 rounded-md ${fileClasses} hover:shadow-md transition-all duration-200 cursor-pointer`}
          onClick={onClick}
        >
          <Image className="w-5 h-5" />
          <span className="truncate max-w-[200px]">{content}</span>
          <span className="text-xs text-gray-400">Open</span>
        </a>
      ) : (
        <span className="whitespace-pre-wrap break-words">{content}</span>
      )}
    </li>
  );
}
