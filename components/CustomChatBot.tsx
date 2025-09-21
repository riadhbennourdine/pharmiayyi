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
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isFirstQuestion, setIsFirstQuestion] = useState<boolean>(true);
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

      // Generate suggested questions after the first user message
      if (isFirstQuestion) {
        setIsFirstQuestion(false);
        let generatedSuggestions: string[] = [];
        if (context) {
          try {
            const parsedContext = JSON.parse(context);

            const suggestionMap: { [key: string]: string } = {
              "Évaluer la sévérité du coup de soleil": "Évaluation de la sévérité",
              "Soulager la douleur et favoriser la cicatrisation": "Traitement",
              "Prévenir le coup de soleil": "Prévention des coups de soleil",
              // Add more mappings as needed
            };

            if (parsedContext.keyPoints && parsedContext.keyPoints.length > 0) {
              generatedSuggestions = parsedContext.keyPoints.map((kp: string) => suggestionMap[kp] || kp);
            } else if (parsedContext.sections) {
              const sectionTitles = Object.values(parsedContext.sections).map((section: any) => section.title);
              generatedSuggestions = sectionTitles.map((title: string) => suggestionMap[title] || title);
            }
          } catch (e) {
            console.error("Error parsing context for suggested questions:", e);
          }
        }

        // Filter out empty or duplicate suggestions and limit to 2
        generatedSuggestions = Array.from(new Set(generatedSuggestions.filter(s => s.trim() !== ''))).slice(0, 2);

        if (generatedSuggestions.length === 0) {
          generatedSuggestions = [
            'Comment puis-je améliorer ma compréhension des mémofiches ?',
            'Quels sont les sujets les plus importants à réviser ?',
          ];
        }
        setSuggestedQuestions(generatedSuggestions);
      }

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

  const handleSuggestedQuestionClick = (question: string) => {
    setInput(question);
    // Trigger send message immediately
    handleSendMessage();
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
      {!isOpen && (
        <button onClick={toggleChat} style={styles.chatToggleButton}>
          <img src="https://pharmaconseilbmb.com/photos/site/bot.gif" alt="Chatbot Toggle" style={styles.chatToggleImage} />
        </button>
      )}

      {isOpen && (
        <>
          <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
              <h3 style={styles.headerTitle}>PharmIA Assistant</h3>
            </div>
            <div style={styles.messagesContainer}>
              {messages.map((msg, index) => (
              <div key={index}>
                {msg.role === 'user' ? (
                  <div style={styles.userMessage}>{msg.content}</div>
                ) : (
                  <div style={styles.botMessageContainer}>
                    <img src="https://pharmaconseilbmb.com/photos/site/23.png" alt="chatbot icon" style={styles.botIcon} />
                    <div style={styles.botMessage}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
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
            {suggestedQuestions.length > 0 && (
              <div style={styles.suggestedQuestionsContainer}>
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    style={styles.suggestedQuestionButton}
                    onClick={() => handleSuggestedQuestionClick(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
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
          <button onClick={toggleChat} style={styles.closeButton}>
            Fermer le Chat
          </button>
        </>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  chatbotWrapper: { // New style for the wrapper
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
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
  },
  closeButton: {
    backgroundColor: '#0D9488',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    width: '380px',
    marginTop: '10px',
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
  botMessageContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  botIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    marginRight: '10px',
  },
  botMessage: {
    backgroundColor: '#e6fffa',
    padding: '8px 12px',
    borderRadius: '15px',
    maxWidth: '80%',
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
    fontSize: '14px',
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
  suggestedQuestionsContainer: {
    padding: '10px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
  },
  suggestedQuestionButton: {
    backgroundColor: 'transparent',
    color: '#0D9488',
    border: 'none',
    borderRadius: '0',
    padding: '5px 0',
    cursor: 'pointer',
    fontSize: '14px',
    textAlign: 'left',
    width: '100%',
    transition: 'color 0.2s',
    '&:hover': {
      color: '#0A7C72',
      textDecoration: 'underline',
    },
  },
};

export default CustomChatBot;