// const express = require("express");
// const cors = require("cors");
// const bodyParser = require("body-parser");
// const dotenv = require("dotenv");
// const http = require("http");
// const { Server } = require("socket.io");

// dotenv.config();

// const app = express();
// const server = http.createServer(app);

// const allowedOrigins = [
//   "https://personal-collection-manager.web.app",
//   "http://localhost:5173",
// ];

// app.use(
//   cors({
//     origin: allowedOrigins,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     credentials: true,
//   })
// );

// const io = new Server(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"],
//   },
// });

// app.use(bodyParser.json());

// const authRoutes = require("./routes/authRoutes");
// const collectionRoutes = require("./routes/collectionRoutes");
// const userRoutes = require("./routes/userRoutes");
// const adminRoutes = require("./routes/adminRoutes");

// app.use("/api/auth", authRoutes);
// app.use("/api/collections", collectionRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/admin", adminRoutes);

// app.get("/", (req, res) => {
//   res.send("Server is running");
// });

// io.on("connection", (socket) => {
//   console.log("A user connected");
//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
// });

// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// app.use((req, res, next) => {
//   console.log(`Incoming request: ${req.method} ${req.url}`);
//   next();
// });

// global.io = io;

























const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "https://personal-collection-manager.web.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(bodyParser.json());

// Jira API Information
const JIRA_BASE_URL = 'https://mehedievo.atlassian.net/';
const JIRA_API_TOKEN = '***REMOVED***45A05438';
const JIRA_USER_EMAIL = 'mh264714@gmail.com';
const JIRA_PROJECT_KEY = 'SCRUM';

// Routes
const authRoutes = require("./routes/authRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Default route for server running
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Jira Ticket Creation Endpoint
app.post("/api/jira/create-ticket", async (req, res) => {
  const { summary, priority, collection, link } = req.body;

  try {
    // Make the POST request to Jira API to create a ticket
    const response = await axios.post(
      `${JIRA_BASE_URL}/rest/api/3/issue`,
      {
        fields: {
          project: {
            key: JIRA_PROJECT_KEY,
          },
          summary,
          description: `Collection: ${collection}\nLink: ${link}`,
          issuetype: {
            name: "Task",
          },
          priority: {
            name: priority, // High, Medium, Low
          },
          reporter: {
            emailAddress: JIRA_USER_EMAIL, // Use your Jira email for now (could be dynamic in the future)
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Respond with the ticket URL or success message
    res.status(200).json({ ticketUrl: response.data.self });
  } catch (error) {
    console.error("Error creating Jira ticket:", error.message);
    res.status(500).json({ message: "Failed to create Jira ticket", error: error.message });
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

global.io = io;
