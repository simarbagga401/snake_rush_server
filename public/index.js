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
    res.send("Snake Rush Server Speaking...");
});
const server = app.listen(8000, () => console.log(" App Running on PORT 8000"));
const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:5500",
        methods: ["GET", "POST"],
    },
});
let rooms = [];
let clients = [];
io.sockets.on("connection", (connection) => {
    console.log("New Connection :- ", connection.id);
    const room_id = uuid_1.v4();
    rooms.push({
        room_id,
        clients: [connection.id],
    });
    clients.push({
        client_id: connection.id,
        room_id,
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
    connection.on("outgoing_chat", ({ client_id, room_id, chat, }) => {
        let room = rooms.find((r) => r.room_id === room_id);
        // let is_client_in_room = room?.clients.includes(client_id);
        let payload = {
            client_id,
            chat,
        };
        room === null || room === void 0 ? void 0 : room.clients.forEach((c) => {
            if (c != client_id)
                connection.to(c).emit("incomming_chat", payload);
        });
    });
    connection.on("snake_pos_client", ({ room_id, client_id, x, y, }) => {
        let room = rooms.find((r) => r.room_id === room_id);
        // let is_client_in_room = room?.clients.includes(client_id);
        let payload = { x, y };
        room === null || room === void 0 ? void 0 : room.clients.forEach((c) => {
            if (c != client_id)
                connection.to(c).emit("snake_pos_server", payload);
        });
        //disconnection too
    });
    connection.on("disconnect", () => {
        var _a;
        console.log(connection.id + "  Disconnected");
        let room_id = (_a = clients.find((c) => c.client_id === connection.id)) === null || _a === void 0 ? void 0 : _a.room_id;
        let room = rooms.find((r) => r.room_id == room_id);
        //Remove User From Room
        // room?.clients
    });
});
