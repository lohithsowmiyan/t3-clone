import React from 'react';
import '../globals.css'; 
import MarkdownRenderer from "../markdown";// Ensure you have global styles for the chat component
const Chat = ({ isUser, message }) => {
  return (
    <div className={`chat ${isUser ? 'chat-user' : ''}`}>
     
    <MarkdownRenderer>
        {message.replace(/(\[.*?\])/g, "$1\n")}
    </MarkdownRenderer>

    </div>
  );
};

export default Chat;