import React from 'react';
import '../globals.css'; // Ensure you have global styles for the thread component
const Thread = ({ thread, onSelect, isSelected }) => (
  <div className={`thread ${isSelected ? "selected" : ""}`}
   onClick={() => onSelect(thread.id)}>
    <p>{thread.name || "New Chat"}</p>
  </div>
);

export default Thread;