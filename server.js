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
  "http://localhost:5173"
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

const authRoutes = require("./routes/authRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const adminRoutes = require("./routes/adminRoutes");


app.use("/api/auth", authRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.post("/api/jira/create-ticket", async (req, res) => {
  const { summary, priority, collection, link, reporterEmail } = req.body;

  console.log("Incoming request data:", req.body);

  const authHeader = `Basic ${Buffer.from(
    `${process.env.JIRA_USER_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64")}`;
  console.log("Authorization Header:", authHeader);

  try {
    const response = await axios.post(
      `${process.env.JIRA_BASE_URL}/rest/api/3/issue`,
      {
        fields: {
          project: {
            key: process.env.JIRA_PROJECT_KEY,
          },
          summary,
          description: `Collection: ${collection}\nLink: ${link}`,
          issuetype: {
            name: "Task",
          },
          priority: {
            name: priority,
          },
          reporter: {
            emailAddress: reporterEmail,
          },
        },
      },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("JIRA response:", response.data);
    res.status(200).json({ ticketUrl: response.data.self });
  } catch (error) {
    console.error(
      "Error creating Jira ticket:",
      error.response ? error.response.data : error.message
    );
    res
      .status(500)
      .json({ message: "Failed to create Jira ticket", error: error.message });
  }
});

io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

global.io = io;
