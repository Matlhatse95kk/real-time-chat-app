import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

let messages = [];
const PAGE_SIZE = 20;

/* GET /messages?roomId=abc&page=2  -> older messages  */
app.get("/messages", (req, res) => {
  const { roomId, page = 1 } = req.query;
  const roomMsgs = messages
    .filter((m) => m.roomId === roomId)
    .sort((a, b) => b.createdAt - a.createdAt); // newest first
  const slice = roomMsgs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  res.json(slice);
});

/* GET /messages/search?q=hello&roomId=abc  */
app.get("/messages/search", (req, res) => {
  const { q, roomId } = req.query;
  const result = messages.filter(
    (m) =>
      m.roomId === roomId &&
      m.text.toLowerCase().includes(q.toLowerCase())
  );
  res.json(result);
});

/** ─────────────────────────────────────────────────────────────
 *  SOCKET.IO SET‑UP
 * ──────────────────────────────────────────────────────────── */
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  // Ping‑pong for built‑in reconnection handling
  pingInterval: 10000,
  pingTimeout: 20000
});

/* Use a namespace for chat traffic */
const chat = io.of("/chat");

chat.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  /** User joins a room */
  socket.on("join-room", ({ roomId, user }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", { user, roomId });
    console.log(`${user} joined ${roomId}`);
  });

  /** Incoming chat message */
  socket.on("send-message", ({ roomId, user, text, tempId }) => {
    const message = {
      id: Date.now().toString(), // simple unique id
      tempId,                    // so the client can match delivery‑ack
      roomId,
      user,
      text,
      createdAt: Date.now()
    };
    messages.push(message);

    // broadcast to everyone else in the room
    socket.to(roomId).emit("new-message", message);

    // send delivery‑ack to sender only
    socket.emit("message-delivered", { tempId, realId: message.id });
  });

  /** Leave room manually (optional) */
  socket.on("leave-room", ({ roomId, user }) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", { user, roomId });
    console.log(`${user} left ${roomId}`);
  });

  /** Handle disconnect */
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    // Client sends leave‑room before disconnect in most cases,
    // so additional broadcast is not always needed.
  });
});

/** ─────────────────────────────────────────────────────────────
 *  START SERVER
 * ──────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Chat server running on port ${PORT}`);
});