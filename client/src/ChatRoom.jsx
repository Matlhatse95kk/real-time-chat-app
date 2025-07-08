import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

function ChatRoom({ username, room }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    // Join the room when the component mounts
    socket.emit('joinRoom', { room, username });

    // Set up event listeners
    socket.on('receiveMessage', (message) => {
      // Check if the message is for the current room
      if (message.room === room) {
        setMessages(prev => [...prev, message]);
      } else {
        // This message is for another room: increment unread count for that room
        // We will manage unread counts in the parent component, so we can lift state up.
        // We'll emit an event to the parent to update unread count for message.room
      }
    });

    socket.on('userJoined', ({ username, room: joinedRoom }) => {
      if (joinedRoom === room) {
        // Update the user list? We get updateUsers event anyway, so we can ignore
      }
    });

    socket.on('userLeft', ({ username, room: leftRoom }) => {
      if (leftRoom === room) {
        // Similarly, we get updateUsers
      }
    });

    socket.on('updateUsers', (userList) => {
      setUsers(userList);
    });

    socket.on('loadMessages', (initialMessages) => {
      setMessages(initialMessages);
    });

    socket.on('loadOlderMessages', (olderMessages) => {
      setMessages(prev => [...olderMessages, ...prev]);
      setIsLoading(false);
      // Check if we have more
      if (olderMessages.length < 10) {
        setHasMore(false);
      }
    });

    // Clean up: leave the room
    return () => {
      socket.emit('leaveRoom', { room, username });
    };
  }, [room, username]);

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      socket.emit('sendMessage', { room, username, text: newMessage }, (ack) => {
        if (ack.status === 'ok') {
          setNewMessage('');
        }
      });
    }
  };

  const loadOlderMessages = () => {
    if (messages.length > 0 && !isLoading && hasMore) {
      setIsLoading(true);
      const before = messages[0].timestamp;
      socket.emit('getOlderMessages', { room, before });
    }
  };

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll handler for loading older messages when at top
  const handleScroll = () => {
    if (messagesContainerRef.current.scrollTop === 0) {
      loadOlderMessages();
    }
  };

  return (
    <div className="chat-room">
      <h2>Room: {room}</h2>
      <div className="user-list">
        <h3>Users in this room:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
      <div 
        className="messages-container" 
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {isLoading && <div>Loading older messages...</div>}
        {messages.map((msg, index) => (
          <div key={index} className="message">
            <strong>{msg.user}: </strong>{msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatRoom;