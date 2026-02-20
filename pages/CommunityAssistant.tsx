import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Send, MapPin, Loader2, Bot, User, Sparkles, Navigation } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingChunks?: any[];
}

const CommunityAssistant: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hello ${currentUser?.name || 'neighbor'}! I'm your Community Assistant. I can help you find waste disposal sites, recycling centers, or answer questions about the neighborhood using Google Maps. What can I help you find today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        chatRef.current = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                tools: [{ googleMaps: {} }],
                systemInstruction: "You are a helpful assistant for the CWTNAS (Community Waste Tracking) system. Help residents find locations related to waste management and answer community queries.",
            }
        });
    } catch (e) {
        console.error("Failed to initialize AI", e);
    }
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    if (!chatRef.current) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Service Error: AI not initialized." }]);
        return;
    }

    const userText = input;
    setInput('');
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setIsLoading(true);

    try {
        const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userText });
        const modelText = response.text || "I found some information.";
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

        setMessages(prev => [...prev, { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: modelText,
            groundingChunks
        }]);
    } catch (error: any) {
        console.error("AI Error:", error);
        setMessages(prev => [...prev, { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            text: "I'm having trouble connecting. Please try again later." 
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const renderGroundingSource = (chunk: any, idx: number) => {
    if (chunk.web?.uri && chunk.web?.title) {
        return (
            <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" 
               className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold text-forest-600 hover:bg-forest-50 transition-colors shadow-sm">
                <Navigation size={12} />
                <span className="truncate max-w-[200px]">{chunk.web.title}</span>
            </a>
        );
    }
    if (chunk.maps?.uri && chunk.maps?.title) {
         return (
            <a key={idx} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" 
               className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold text-forest-600 hover:bg-forest-50 transition-colors shadow-sm">
                <MapPin size={12} />
                <span className="truncate max-w-[200px]">{chunk.maps.title}</span>
            </a>
        );
    }
    return null;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 h-[calc(100vh-5rem)] flex flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-forest-100 p-2 rounded-lg text-forest-600">
           <Sparkles size={24} />
        </div>
        <div>
           <h1 className="text-xl font-extrabold text-slate-800">Community Assistant</h1>
           <p className="text-slate-500 text-xs font-medium">Ask about locations & waste guidelines</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
           {messages.map((msg) => (
             <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center flex-shrink-0 text-white shadow-sm mt-1">
                        <Bot size={16} />
                    </div>
                )}
                
                <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                        ${msg.role === 'user' 
                          ? 'bg-slate-800 text-white rounded-br-none' 
                          : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'}`}>
                        {msg.text}
                    </div>

                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {msg.groundingChunks.map((chunk, idx) => renderGroundingSource(chunk, idx))}
                        </div>
                    )}
                </div>

                {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 shadow-sm mt-1">
                        <User size={16} />
                    </div>
                )}
             </div>
           ))}
           {isLoading && (
             <div className="flex gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center text-white mt-1">
                    <Bot size={16} />
                 </div>
                 <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-forest-600" />
                    <span className="text-xs text-slate-500 font-medium">Assistant is thinking...</span>
                 </div>
             </div>
           )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 bg-slate-50 text-slate-800 text-sm rounded-lg border border-slate-200 pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-forest-500 transition-all font-medium"
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 p-2 bg-forest-600 hover:bg-forest-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default CommunityAssistant;