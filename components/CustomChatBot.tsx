import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

interface CustomChatBotProps {
  context?: string; // Optional context for the chatbot
}

const CustomChatBot: React.FC<CustomChatBotProps> = ({ context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'bot', content: 'Bonjour ! Je suis votre assistant PharmIA. Comment puis-je vous aider aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false); // New state for chat visibility
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) { // Only scroll to bottom if chat is open
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistoryForApi = messages.slice(1).map(msg => ({ // Exclude the initial bot welcome message
        role: msg.role === 'user' ? 'user' : 'model', // Gemini API expects 'user' or 'model'
        parts: msg.content,
      }));

      const response = await fetch('/api/custom-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userMessage: input.trim(), chatHistory: chatHistoryForApi, context }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = { role: 'bot', content: data.response };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      let errorContent = 'Désolé, une erreur est survenue. Veuillez réessayer.';

      // Attempt to parse error response for more details
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          if (errorData.details) {
            errorContent = `Désolé, une erreur est survenue. Détails: ${errorData.details}`;
          } else if (errorData.error) {
            errorContent = `Désolé, une erreur est survenue. Détails: ${errorData.error}`;
          }
        } catch (jsonError) {
          console.error('Failed to parse error JSON:', jsonError);
          // Fallback to generic message
        }
      } else if (error instanceof Error) {
        errorContent = `Désolé, une erreur est survenue. Détails: ${error.message}`;
      }

      const errorMessage: ChatMessage = { role: 'bot', content: errorContent };
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

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div style={styles.chatbotWrapper}> {/* New wrapper div */}
      <button onClick={toggleChat} style={styles.chatToggleButton}>
        <img src="https://pharmaconseilbmb.com/photos/site/bot.gif" alt="Chatbot Toggle" style={styles.chatToggleImage} />
      </button>

      {isOpen && ( // Conditionally render chat container
        <div style={styles.chatContainer}>
          <div style={styles.chatHeader}>
            <h3 style={styles.headerTitle}>PharmIA Assistant</h3>
          </div>
          <div style={styles.messagesContainer}>
            {messages.map((msg, index) => (
              <div key={index} style={msg.role === 'user' ? styles.userMessage : styles.botMessage}>
                {msg.role === 'bot' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
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
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  chatbotWrapper: { // New style for the wrapper
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
  },
  chatToggleButton: { // New style for the toggle button
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    width: '80px', // Adjust size as needed
    height: '80px', // Adjust size as needed
    borderRadius: '50%',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', // Or any background color for the button
  },
  chatToggleImage: { // New style for the GIF
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 'calc(100vh - 180px)',
    height: '500px',
    width: '380px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    position: 'absolute', // Position the chat window relative to the wrapper
    bottom: '100px', // Adjust to be above the toggle button
    right: '0',
  },
  chatHeader: {
    backgroundColor: '#0D9488',
    color: 'white',
    padding: '10px',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    textAlign: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '16px',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: '10px',
    overflowY: 'auto',
    backgroundColor: '#f9f9f9',
  },
  userMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-end',
    padding: '8px 12px',
    borderRadius: '15px',
    marginBottom: '8px',
    maxWidth: '80%',
    marginLeft: 'auto',
    wordBreak: 'break-word',
    fontSize: '14px',
    lineHeight: '1.4',
  },
  botMessage: {
    backgroundColor: '#e6fffa',
    alignSelf: 'flex-start',
    padding: '8px 12px',
    borderRadius: '15px',
    marginBottom: '8px',
    maxWidth: '80%',
    marginRight: 'auto',
    wordBreak: 'break-word',
    fontSize: '14px',
    lineHeight: '1.4',
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
    borderTop: '3px solid #0D9488',
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
    backgroundColor: '#0D9488',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  },
  sendButtonHover: {
    backgroundColor: '#0a6b60',
  },
};

export default CustomChatBot;