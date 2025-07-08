// src/components/MessageList.jsx
import React, { useEffect, useRef } from "react";

const MessageList = ({ messages }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-white rounded p-3 mb-3 shadow-inner">
      {messages.map((msg, index) => (
        <div key={msg.tempId || index} className="mb-2">
          <span className="font-bold">{msg.user}:</span>{" "}
          <span>{msg.text}</span>
          {msg.pending && <span className="text-sm text-gray-400 ml-2">(sending…)</span>}
        </div>
      ))}
      <div ref={scrollRef} />
    </div>
  );
};

export default MessageList;
