const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const http = require('http').createServer();

app.get('/', (req, res) => {
  console.log('req.headers.host', req.headers.host);
  res.send('Hello World!');
})

const options = {
  cors: {
    origin: process.env.CORS_WEB || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
};
const io = require('socket.io')(http, options);

io.on('connection', socket => {
  
  const { id, user: userJson } = socket.handshake.query;
  try {
    const user = JSON.parse(userJson);
    console.log(`A user connected ${user.email}`);
    socket.on("joinRoom", (room) => {
      console.log(`User conected to ${room}`);
      socket.join(room);
    });
  
    socket.on('message', ({room, message}) => {
      socket.to(room).emit('receive', {
        sender: userJson, message
      });
    });
  
    socket.on("typing", ({ room }) => {
      socket.to(room).emit("typing", "Someone is typing");
    });
  
    socket.on("stoppedTyping", ({ room }) => {
      socket.to(room).emit("stoppedTyping");
    });
  } catch (err) {
    console.log(err.message);
  }
});

http.listen(port, () => {
  console.log("Server is listening on ", port);
});
