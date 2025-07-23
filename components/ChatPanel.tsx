import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { BotIcon, MessageSquareIcon } from './icons';

interface ChatPanelProps {
    chatHistory: ChatMessage[];
    onSendMessage: (message: string) => void;
    isStreaming: boolean;
    streamingContent: string;
    t: any; // Translation object
}

const ChatPanel: React.FC<ChatPanelProps> = ({ chatHistory, onSendMessage, isStreaming, streamingContent, t }) => {
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory, streamingContent]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isStreaming) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const lastMessage = chatHistory[chatHistory.length - 1];
    const displayStreamingContent = isStreaming && lastMessage?.role === 'model' ? streamingContent : '';

    return (
        <div className="flex flex-col h-full bg-slate-800/80">
            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                <MessageSquareIcon />
                <h3 className="text-lg font-bold text-slate-100">{t.chatPanelTitle}</h3>
            </div>
            <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                {chatHistory.length === 0 && (
                    <div className="text-center text-slate-400 p-4 bg-slate-900/50 rounded-lg">{t.chatWelcome}</div>
                )}
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0"><BotIcon/></div>}
                        <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                            <pre className="whitespace-pre-wrap break-words font-sans text-sm">
                                {msg.content}
                                {index === chatHistory.length -1 && msg.role === 'model' && isStreaming && <span className="inline-block w-2 h-4 bg-blue-400 animate-pulse ml-1" />}
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-slate-700">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={isStreaming ? "..." : t.chatPlaceholder}
                        disabled={isStreaming}
                        className="flex-grow p-2 bg-slate-900 border border-slate-600 rounded-md text-slate-200 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md font-semibold transition-colors"
                    >
                        {t.sendMessage}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatPanel;