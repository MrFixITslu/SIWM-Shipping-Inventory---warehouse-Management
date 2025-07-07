


import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/types';
import { geminiService } from '@/services/geminiService';
import { ChatIcon, CloseIcon, PaperAirplaneIcon } from '@/constants';
import { LoadingSpinner } from '@/components/icons/LoadingSpinner';

const CHAT_SESSION_KEY = 'chatMessages';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load messages from sessionStorage on initial mount
  useEffect(() => {
    try {
      const storedMessages = sessionStorage.getItem(CHAT_SESSION_KEY);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
         setMessages([
          { 
            id: Date.now().toString(), 
            text: "Hello! I'm VisionBot, your AI assistant for Vision79 SIWM. How can I help you today?", 
            sender: 'ai', 
            timestamp: Date.now() 
          }
        ]);
      }
    } catch (error) {
      console.error("Could not parse chat history from session storage", error);
    }
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    // Don't save if it's just the initial greeting message
    if (messages.length > 1 || (messages.length === 1 && messages[0].sender !== 'ai')) {
        try {
            sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(messages));
        } catch (error) {
            console.error("Could not save chat history to session storage", error);
        }
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // Cleanup effect to cancel stream on component unmount or chat close
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (inputValue.trim() === '' || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const aiThinkingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: "",
      sender: 'ai',
      timestamp: Date.now(),
      isLoading: true,
    };
    setMessages(prev => [...prev, aiThinkingMessage]);
    scrollToBottom();

    try {
      let fullResponse = "";
      const stream = await geminiService.sendChatMessageStream(
        userMessage.text, 
        messages.filter(m => m.sender === 'user' || (m.sender === 'ai' && !m.isLoading)).slice(-10),
        signal // Pass the signal to the service
      );

      for await (const chunk of stream) {
        if (signal.aborted) {
            console.log("Stream reading aborted.");
            break;
        }
        fullResponse += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiThinkingMessage.id ? { ...msg, text: fullResponse, isLoading: true } : msg
          )
        );
        scrollToBottom();
      }
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiThinkingMessage.id ? { ...msg, text: fullResponse, isLoading: false } : msg
        )
      );

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Error sending message to Gemini:", error);
        const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: "Sorry, I encountered an error. Please try again.",
            sender: 'ai',
            timestamp: Date.now(),
        };
        setMessages(prev => prev.filter(msg => msg.id !== aiThinkingMessage.id));
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading, messages]);

  const toggleOpen = () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);

    if (!nextIsOpen && abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancel stream on close
      abortControllerRef.current = null;
    }
    
    if (nextIsOpen) {
      if (messages.length === 0) {
        setMessages([
          { 
            id: Date.now().toString(), 
            text: "Hello! I'm VisionBot, your AI assistant for Vision79 SIWM. How can I help you today?", 
            sender: 'ai', 
            timestamp: Date.now() 
          }
        ]);
      }
      setTimeout(() => inputRef.current?.focus(), 300); // Focus after transition
    }
  };

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition-transform duration-200 hover:scale-110 z-50"
        aria-label="Toggle Chatbot"
      >
        {isOpen ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 w-full max-w-sm h-[70vh] max-h-[500px] bg-white dark:bg-secondary-800 shadow-2xl rounded-lg flex flex-col transition-all duration-300 ease-in-out origin-bottom-right transform scale-100 opacity-100 z-40">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-200 dark:border-secondary-700">
            <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200">VisionBot Assistant</h3>
            <button onClick={toggleOpen} className="text-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-xl ${
                    msg.sender === 'user'
                      ? 'bg-primary-500 text-white rounded-br-none'
                      : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-800 dark:text-secondary-200 rounded-bl-none'
                  }`}
                >
                  {msg.isLoading && msg.sender === 'ai' ? (
                     <div className="flex items-center">
                        {msg.text.length === 0 && <LoadingSpinner className="w-4 h-4 mr-2 animate-spin-slow" />}
                        <p className="text-sm whitespace-pre-wrap blinking-cursor">{msg.text}</p>
                     </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  )}
                  <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-primary-200 text-right' : 'text-secondary-500 dark:text-secondary-400 text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-secondary-200 dark:border-secondary-700">
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask VisionBot..."
                className="flex-1 px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 transition-colors"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || inputValue.trim() === ''}
                className="p-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <PaperAirplaneIcon className="h-5 w-5 transform rotate-45" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;