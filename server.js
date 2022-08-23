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

// 创建 socket 连接
io.on("connection", (socket) => {
  // 发送 socket id
  socket.emit("me", socket.id);

  // 断开连接
  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
  });

  socket.on("callRemote", (data) => {
    // 将数据传递给接受方
    io.to(data.userToCall).emit("remoteAnswer", {
      signal: data.signal,
      from: data.from,
      to: data.name,
    });
  });

  socket.on("callAnswer", (data) => {
    console.log('back end', data);
    // 将数据传递给发起方
    io.to(data.to).emit("callAccepted", data.signal);
  });
});

server.listen(9000, () => {
  console.log("Server running at http://localhost:9000");
});
