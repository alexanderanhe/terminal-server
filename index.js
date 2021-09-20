const redis = require("redis");
const { promisify } = require("util");
const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 5000;
const server = express()
  .listen(PORT, () => console.log(`Server is listening on ${PORT}`));;

const options = {
  cors: {
    origin: process.env.CORS_WEB || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
};
const io = socketIO(server, options); // , options

// server.get('/', (req, res) => {
//   console.log('req.headers.host', req.headers.host);
//   res.send('Hello World!');
// });

const client = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PWD || "",
});
const redisGetAsync = promisify(client.get).bind(client);

const saveMessage = async (room, message) => {
  const data = await redisGetAsync(room);

  // the first message in the chat room
  if (!data) {
    return client.set(room, JSON.stringify([message]));
  }

  const json = JSON.parse(data);
  json.push(message);

  client.set(room, JSON.stringify(json));
};

io.on('connection', socket => {
  
  const { id, user: userJson } = socket.handshake.query;
  try {
    const user = JSON.parse(userJson);
    console.log(`A user connected ${user.email}`);
  
    socket.on("joinRoom", async (room) => {
      console.log(`User conected to ${room}`);
      socket.join(room);

      const messageData = await redisGetAsync(room);
      if (messageData) {
        // need to make sure that we are grabbing this history data on the frontend
        socket.emit("history", messageData);
      }
    });
  
    socket.on('message', ({room, message}) => {
      const messageContent = {
        sender: userJson, message
      };
      saveMessage(room, messageContent);

      socket.to(room).emit('receive', messageContent);
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

setInterval(() => io.emit('time', new Date().toTimeString()), 1000);
