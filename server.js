const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

// add firebase admin sdk for push notifications...
const admin = require("firebase-admin");

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

// Initialize Firebase Admin SDK
const serviceAccount = require(".//Firebase/candor-ivf-firebase-adminsdk-sihlp-e765ca511c.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Add a new endpoint to send push notifications
app.use(express.json());
app.post("/send-notification", (req, res) => {
  if (req.get("Content-Type") === "application/json") {
    // Handle raw JSON
    console.log("this is request application/json", req.body);
  } else {
    // Handle form-data
    console.log("this is request form data", req.body);
  }

  const { commonChatID, message, mobileNo, ReceiverIDIS, FCMTOKEN } = req.body;
  console.log("the request was successful here is fcm id", FCMTOKEN);
  // Retrieve the device token for the given userId from your database or storage

  // Send a push notification
  const payload = {
    notification: {
      title: "New Message",
      body: message,
      SOCKET: "true",
    },
  };

  admin
    .messaging()
    .sendToDevice(FCMTOKEN, payload)
    .then((response) => {
      console.log("Notification sent successfully:", response);
      res.status(200).json({ success: true });
    })
    .catch((error) => {
      console.error("Error sending notification:", error);
      res.status(500).json({ success: false });
    });
});
// push notification code above
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
