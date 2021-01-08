"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
const app = express_1.default();
app.use(cors_1.default());
app.get("/", (_, res) => {
    res.send("Hello There!");
});
const server = app.listen(8000, () => console.log(" App Running on PORT 8000"));
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:5500",
        methods: ["GET", "POST"],
    },
});
let rooms = [];
io.sockets.on("connection", (connection) => {
    console.log("New Connection :- ", connection.id);
    const room_id = uuid_1.v4();
    rooms.push({
        room_id,
        clients: [connection.id],
    });
    let payload = {
        client_id: connection.id,
        room_id,
    };
    connection.emit("game_init", payload);
    if (payload)
        console.log(payload);
    connection.on("enter_game_req", ({ client_id, room_id }) => {
        let payload;
        let room = rooms.find((r) => r.room_id === room_id);
        let room_creator = room === null || room === void 0 ? void 0 : room.clients[0];
        if (!room)
            payload = { client: "Requestor", err_msg: "Room Not Found" };
        else if (room.clients.length > 2)
            payload = { client: "Requestor", err_msg: "Room Limit Reached" };
        else {
            room.clients.push(client_id);
            payload = Object.assign({ client: "Requestor" }, room);
        }
        connection.emit("enter_game_res", payload);
        connection.to(room_creator).emit("enter_game_res", Object.assign({ client: "Creator" }, room));
    });
    // connection.on("");
    // connection.on("snake_pos_client", ({x,y}:{x:Number,y:Number}) => {
    //     let clients_in_game = games.forEach(c => )
    //     connection.broadcast.emit("snake_pos_server",{x,y})
    // })
    connection.on("outgoing_chat", ({ client_id, room_id, chat, }) => {
        let room = rooms.filter((r) => r.room_id === room_id);
        let is_client_in_room = room.clients.includes(client_id);
        let payload = {
            client_id,
            chat,
        };
        room.clients.forEach((c) => {
            if (c != room.clients[0])
                connection.to(c).emit("incomming_chat", payload);
        });
    });
});
