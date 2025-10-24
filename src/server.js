import { createServer } from 'node:http'
import { Server } from "socket.io";
import next from 'next'

const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev, port })
const handler = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log(`a user connected with id: ${socket.id}`);

    socket.on("join_group", (data) => {
      const { groupName, userName } = data;
      socket.join(groupName);
      console.log(`User with ID: ${socket.id} joined group: ${groupName}`);
      socket.to(groupName).emit("user_joined", userName);

      socket.on("send_message", (msg) => {
        // Broadcast the message to all connected clients except the sender
        socket.to(groupName).emit("receive_message", msg);
      });
      
      socket.on("typing", () => {
        socket.to(groupName).emit("user_typing", userName);
      });
      socket.on("stop_typing", () => {
        socket.to(groupName).emit("user_stop_typing", userName);
      });
    });

  });
  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV
        }`);
    });
})