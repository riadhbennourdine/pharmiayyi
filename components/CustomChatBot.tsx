import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

const CustomChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistoryForApi = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model', // Gemini API expects 'user' or 'model'
        parts: msg.content,
      }));

      const response = await fetch('/api/custom-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if your API requires it
          // 'Authorization': `Bearer YOUR_AUTH_TOKEN`, 
        },
        body: JSON.stringify({ userMessage: input.trim(), chatHistory: chatHistoryForApi }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = { role: 'bot', content: data.response };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'bot', content: 'Désolé, une erreur est survenue. Veuillez réessayer.' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} style={msg.role === 'user' ? styles.userMessage : styles.botMessage}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={styles.loadingIndicator}>
            <div style={styles.spinner}></div>
            <span>Réflexion en cours...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Posez votre question..."
          style={styles.inputField}
          disabled={isLoading}
        />
        <button onClick={handleSendMessage} style={styles.sendButton} disabled={isLoading}>
          Envoyer
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '600px',
    width: '400px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: '10px',
    overflowY: 'auto',
    backgroundColor: '#f9f9f9',
  },
  userMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
    padding: '8px 12px',
    borderRadius: '15px',
    marginBottom: '8px',
    maxWidth: '80%',
    marginLeft: 'auto',
    wordBreak: 'break-word',
  },
  botMessage: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
    padding: '8px 12px',
    borderRadius: '15px',
    marginBottom: '8px',
    maxWidth: '80%',
    marginRight: 'auto',
    wordBreak: 'break-word',
  },
  loadingIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '8px 12px',
    borderRadius: '15px',
    marginBottom: '8px',
    maxWidth: '80%',
    marginRight: 'auto',
    backgroundColor: '#e0e0e0',
    color: '#555',
  },
  spinner: {
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #3498db',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    animation: 'spin 1s linear infinite',
    marginRight: '8px',
  },
  inputContainer: {
    display: 'flex',
    padding: '10px',
    borderTop: '1px solid #eee',
    backgroundColor: '#fff',
  },
  inputField: {
    flexGrow: 1,
    border: '1px solid #ddd',
    borderRadius: '20px',
    padding: '8px 15px',
    marginRight: '10px',
    fontSize: '14px',
  },
  sendButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  sendButtonHover: {
    backgroundColor: '#0056b3',
  },
};

export default CustomChatBot;