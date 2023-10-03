const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Declare a Set to store online user IDs
const onlineUsers = new Set();

// Declare an object to store user IDs and their corresponding socket IDs
const userSockets = {};

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected to socket");

  // When a user connects, store their socket ID as online
  socket.on("user-connect", (userId) => {
    console.log("A user connected and id is", userId);

    // Store the user's socket ID in the userSockets object
    userSockets[userId] = socket.id;

    // Add the user ID to the Set of online users
    onlineUsers.add(userId);

    // Broadcast the updated list of online users to all connected clients
    io.emit("user-online", Array.from(onlineUsers));
  });

  socket.on("send-message", (message) => {
    console.log("Received message:", message);
    // Broadcast the message to all connected clients
    io.emit("message", message);
  });

  // When a user disconnects, remove them from the online users
  socket.on("disconnect", () => {
    console.log("a user disconnected");
    for (const userId of Object.keys(userSockets)) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId]; // Remove the user from the userSockets object
        onlineUsers.delete(userId); // Remove the user from the onlineUsers Set
        console.log(userId, "Is now offline");
        io.emit("user-offline", userId); // Broadcast that the user is offline
        break; // Break the loop after finding the user
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
