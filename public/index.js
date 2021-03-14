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
const server = app.listen(process.env.PORT || 8000, () => console.log(" App Running"));
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
        color: "green",
    });
    let payload = {
        client_id: connection.id,
        room_id,
    };
    connection.emit("game_init", payload);
    if (payload)
        console.log(payload);
    connection.on("enter_game_req", ({ client_id, room_id }) => {
        var _a;
        let payload;
        let room = find_room(room_id);
        let room_creator = room === null || room === void 0 ? void 0 : room.clients[0];
        if (!room)
            payload = { client: "Requestor", err_msg: "Room Not Found" };
        else if (room.clients.length > 2)
            payload = { client: "Requestor", err_msg: "Room Limit Reached" };
        else {
            let client_prev_room_id = (_a = find_client(client_id)) === null || _a === void 0 ? void 0 : _a.room_id;
            let prev_room = find_room(client_prev_room_id);
            let client = find_client(client_id);
            let room = find_room(room_id);
            if (prev_room && prev_room.clients.length < 1) {
                let room_index = rooms.indexOf(prev_room);
                rooms.splice(room_index, 1);
            }
            room === null || room === void 0 ? void 0 : room.clients.push(client_id);
            let index_of_client = room === null || room === void 0 ? void 0 : room.clients.indexOf(client_id);
            if (client) {
                client.room_id = room_id;
                if (index_of_client === 1)
                    client.color = "white";
                if (index_of_client === 2)
                    client.color = "blue";
            }
            payload = Object.assign({ client: "Requestor", client_color: client === null || client === void 0 ? void 0 : client.color }, room);
        }
        connection.emit("enter_game_res", payload);
        connection.to(room_creator).emit("enter_game_res", Object.assign({ client: "Creator" }, room));
    });
    connection.on("outgoing_chat", ({ room_id, client_id, chat, }) => {
        var _a;
        let room = find_room(room_id);
        let color = (_a = find_client(client_id)) === null || _a === void 0 ? void 0 : _a.color;
        let payload = {
            client_id,
            color,
            chat,
        };
        room === null || room === void 0 ? void 0 : room.clients.forEach((c) => {
            if (c != client_id)
                connection.to(c).emit("incomming_chat", payload);
        });
    });
    connection.on("snake_pos_client", ({ room_id, client_id, x, y, }) => {
        var _a;
        let room = find_room(room_id);
        let color = (_a = find_client(client_id)) === null || _a === void 0 ? void 0 : _a.color;
        let payload = { color, x, y };
        room === null || room === void 0 ? void 0 : room.clients.forEach((c) => {
            if (c != client_id)
                connection.to(c).emit("snake_pos_server", payload);
        });
    });
    connection.on("disconnect", () => {
        console.log(connection.id + "  Disconnected");
        let client = find_client(connection.id);
        let client_index = clients.indexOf(client);
        let room = find_room(client === null || client === void 0 ? void 0 : client.room_id);
        let room_index = rooms.indexOf(room);
        clients.splice(client_index, 1); // Remove Client Obj
        if (room && (room === null || room === void 0 ? void 0 : room.clients.length) == 1) {
            rooms.splice(room_index); // Remove Room if room
        }
        // disconnect socket req
    });
});
function find_room(room_id) {
    let room = rooms.find((r) => r.room_id === room_id);
    return room;
}
function find_client(client_id) {
    let client = clients.find((c) => c.client_id === client_id);
    return client;
}
//implement binary search
