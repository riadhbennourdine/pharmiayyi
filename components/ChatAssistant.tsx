
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getAssistantResponse } from '../services/geminiService';
import type { ChatMessage, CaseStudy } from '../types';
import { CommunicationIcon, ChevronRightIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';

interface ChatAssistantProps {
    caseContext: CaseStudy;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ caseContext }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "Bonjour ! Je suis PharmIA. Posez-moi des questions sur ce cas pour approfondir votre analyse." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (input.trim() === '' || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const modelResponse = await getAssistantResponse([...messages, newUserMessage], caseContext);
            const newModelMessage: ChatMessage = { role: 'model', content: modelResponse };
            setMessages(prev => [...prev, newModelMessage]);
        } catch (error) {
            console.error("Error fetching assistant response:", error);
            const errorMessage: ChatMessage = { role: 'model', content: "Désolé, une erreur est survenue. Veuillez réessayer." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, messages, caseContext]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg flex flex-col h-full max-h-[80vh]">
            <div className="p-4 border-b flex items-center bg-slate-50 rounded-t-lg">
                <CommunicationIcon className="h-6 w-6 text-teal-600 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800">Assistant PharmIA</h3>
            </div>
            <div className="flex-grow p-4 overflow-y-auto bg-slate-100/50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-xs xl:max-w-sm px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                {msg.role === 'model' && index === 0 && <SparklesIcon className="h-4 w-4 inline-block mr-1 text-amber-500" />}
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                             <div className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800">
                                <Spinner />
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t bg-white rounded-b-lg">
                <div className="flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Posez une question..."
                        className="flex-grow border rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || input.trim() === ''}
                        className="bg-teal-600 text-white p-3 flex items-center justify-center rounded-r-md hover:bg-teal-700 disabled:bg-slate-400"
                    >
                        {isLoading ? <Spinner /> : <ChevronRightIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatAssistant;