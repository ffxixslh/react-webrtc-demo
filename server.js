const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());

// 初始化 io 实例
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = {};

// 创建 socket 连接
io.on("connection", (socket) => {
  if (!users[socket.id]) {
    users[socket.id] = socket.id;
  }

  console.log("users", users)

  io.of("/").emit("allUsers", users)

  // 发送 socket id
  socket.emit("me", socket.id);

  // 断开连接
  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
    delete users[socket.id];
  });

  socket.on("callUser", (data) => {
    // 将数据传递给接受方
    io.to(data.userToCall).emit("hey", {
      signal: data.signalData,
      from: data.from,
      // to: data.name,
    });
  });

  socket.on("acceptCall", (data) => {
    // 将数据传递给发起方
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

server.listen(9000, () => {
  console.log("Server running at http://localhost:9000");
});
