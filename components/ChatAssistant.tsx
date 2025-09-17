
import React, { useState, useEffect, useRef } from "react";
import * as icons from "./icons";
import { useAuth } from "./contexts/AuthContext";
import { useData } from "./contexts/DataContext";
import FlashcardDeck from "./FlashcardDeck";
import Spinner from "./Spinner";

interface ChatAssistantProps {
  onClose: () => void;
}

interface Message {
  sender: "user" | "bot";
  content: string;
  type?: "flashcard" | "text" | "json";
}

const isJsonString = (str: string) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { memoFiches } = useData();

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage: Message = { sender: "user", content: input };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:3000/api/chat/assistant",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({
            message: input,
            memoFiches: memoFiches.map((mf) => ({
              title: mf.title,
              sections: mf.sections.map((s) => ({
                title: s.title,
                content: s.content,
              })),
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch from assistant API");
      }

      const data = await response.json();
      let botMessage: Message;

      if (isJsonString(data.reply)) {
        botMessage = { sender: "bot", content: data.reply, type: "json" };
      } else {
        botMessage = { sender: "bot", content: data.reply };
      }
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        sender: "bot",
        content: "Désolé, une erreur est survenue. Veuillez réessayer.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const Message = ({ sender, content, type }: Message) => {
    const isBot = sender === "bot";
    const messageClass = isBot ? "bg-blue-200 self-start" : "bg-green-200 self-end";

    return (
      <div className={`p-3 rounded-lg max-w-[70%] ${messageClass} shadow-md`}>
        {type === "flashcard" ? (
          <FlashcardDeck flashcards={JSON.parse(content)} />
        ) : type === "json" ? (
          <pre className="text-gray-800 whitespace-pre-wrap text-xs">
            {JSON.stringify(JSON.parse(content), null, 2)}
          </pre>
        ) : (
          <p className="text-gray-800 whitespace-pre-wrap">{content}</p>
        )}
      </div>
    );
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 ${
        isOpen ? "w-96 h-[600px]" : "w-16 h-16"
      } bg-white rounded-full shadow-lg flex flex-col transition-all duration-300 ease-in-out`}
    >
      {!isOpen && (
        <div
          className="w-16 h-16 rounded-full overflow-hidden cursor-pointer shadow-lg"
          onClick={toggleChat}
        >
          <img src="https://pharmaconseilbmb.com/photos/site/bot.gif" alt="Chatbot" className="w-full h-full object-cover" />
        </div>
      )}
      {isOpen && (
        <>
          <div
            className="w-full h-16 bg-blue-600 text-white flex items-center justify-between p-4 rounded-t-lg cursor-pointer"
            onClick={toggleChat}
          >
            <h3 className="text-lg font-semibold">Assistant IA</h3>
            <button onClick={onClose} className="text-white">
              <icons.XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <Message key={index} sender={msg.sender} content={msg.content} type={msg.type} />
            ))}
            {isLoading && (
              <div className="flex justify-center items-center">
                <Spinner />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-4 flex items-center">
            <input
              type="text"
              className="flex-1 border rounded-lg p-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tapez votre message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Envoyer
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatAssistant;