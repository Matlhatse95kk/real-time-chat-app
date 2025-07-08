// src/components/OnlineUsers.jsx
import React from "react";

const OnlineUsers = ({ users }) => {
  return (
    <div className="w-48 bg-white border-r p-3 shadow-md">
      <h2 className="font-semibold mb-2">Online Users</h2>
      <ul className="text-sm">
        {users.map((user, i) => (
          <li key={i} className="py-1 border-b last:border-b-0">{user}</li>
        ))}
      </ul>
    </div>
  );
};

export default OnlineUsers