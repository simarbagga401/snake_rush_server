import express from 'express';
import cors from 'cors';
import socket from 'socket.io';
const app = express();
app.use(cors());
app.get('/', (_,res) => {
    res.send("Hello There!")
});

const server = app.listen(8000, () => console.log(" App Running on PORT 8000"));
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:5500",
        methods: ["GET", "POST"],
  }});
io.sockets.on('connection', (socket:any) => {
    console.log('New Connection', socket.id);
    socket.on('snake_position',([X,Y]:[X:number,Y:number]) => {
        console.log(`x : ${X} , y : ${Y}`);
    });
});