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
  const id = socket.handshake.query.id
  socket.join(id);

  socket.on('message', ({room, text}) => {
    socket.broadcast.to(room).emit('receive', {
      sender: id, text
    });
  });
});

http.listen(port, () => {
  console.log("Server is listening on ", port);
});
