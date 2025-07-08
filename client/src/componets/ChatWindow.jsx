// src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from "react";
import socket from "../socket";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import OnlineUsers from "./OnlineUsers";

const ChatWindow = ({ username }) => {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const roomId = "general";

useEffect(() => {
    socket.connect();
    socket.emit("join-room", { roomId, user: username });

    socket.on("new-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("user-joined", ({ user }) => {
      setOnlineUsers((prev) => [...new Set([...prev, user])]);
    });

    socket.on("user-left", ({ user }) => {
      setOnlineUsers((prev) => prev.filter((u) => u !== user));
    });

    return () => {
      socket.emit("leave-room", { roomId, user: username });
      socket.disconnect();
    };
  }, [username]);

const handleSend = (text) => {
    const tempId = Date.now().toString();
    const message = {
      tempId,
      user: username,
      text,
      roomId,
    };

    setMessages((prev) => [...prev, { ...message, pending: true }]);

    socket.emit("send-message", message);
  };
return (
    <div className="flex h-screen bg-gray-100">
      <OnlineUsers users={onlineUsers} />
      <div className="flex flex-col flex-1 p-4">
        <h1 className="text-xl font-bold mb-2">Room: {roomId}</h1>
        <MessageList messages={messages} />
        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
};

export default ChatWindow;