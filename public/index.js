"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = express_1.default();
app.use(cors_1.default());
app.get('/', (_, res) => {
    res.send("Hello There!");
});
const server = app.listen(8000, () => console.log(" App Running on PORT 8000"));
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:5500",
        methods: ["GET", "POST"],
    }
});
io.sockets.on('connection', (socket) => {
    console.log('New Connection', socket.id);
    socket.on('snake_position', ([X, Y]) => {
        console.log(`x : ${X} , y : ${Y}`);
    });
});
