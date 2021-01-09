import express from "express";
import cors from "cors";
import { v4 as uuid } from "uuid";
const app = express();
app.use(cors());

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

export interface Room {
  room_id: string;
  clients: Array<string>;
}
export interface Client {
  client_id: string;
  room_id: string;
}
let rooms: Room[] = [];
let clients: Client[] = [];
io.sockets.on("connection", (connection: any) => {
  console.log("New Connection :- ", connection.id);
  const room_id: string = uuid();

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
  if (payload) console.log(payload);

  connection.on(
    "enter_game_req",
    ({ client_id, room_id }: { client_id: string; room_id: string }) => {
      let payload;
      let room = find_room(room_id);
      let room_creator = room?.clients[0];
      if (!room) payload = { client: "Requestor", err_msg: "Room Not Found" };
      else if (room.clients.length > 2)
        payload = { client: "Requestor", err_msg: "Room Limit Reached" };
      else {
        let client_prev_room_id = find_client(client_id)?.room_id;
        let prev_room = find_room(client_prev_room_id!);
        let client = find_client(client_id);
        let room = find_room(room_id);

        if (prev_room) {
          let room_index = rooms.indexOf(prev_room);
          rooms.splice(room_index, 1);
        }
        room?.clients.push(client_id);
        if (client) {
          client.room_id = room_id;
        }

        payload = {
          client: "Requestor",
          ...room,
        };
      }

      connection.emit("enter_game_res", payload);
      connection.to(room_creator).emit("enter_game_res", {
        client: "Creator",
        ...room,
      });
    }
  );

  connection.on(
    "outgoing_chat",
    ({
      client_id,
      room_id,
      chat,
    }: {
      client_id: string;
      room_id: string;
      chat: string;
    }) => {
      let room = find_room(room_id);
      // let is_client_in_room = room?.clients.includes(client_id);
      let payload = {
        client_id,
        chat,
      };
      room?.clients.forEach((c: string) => {
        if (c != client_id) connection.to(c).emit("incomming_chat", payload);
      });
    }
  );

  connection.on(
    "snake_pos_client",
    ({
      room_id,
      client_id,
      x,
      y,
    }: {
      room_id: string;
      client_id: string;
      x: number;
      y: number;
    }) => {
      let room = find_room(room_id);
      // let is_client_in_room = room?.clients.includes(client_id);
      let payload = { x, y };
      room?.clients.forEach((c: string) => {
        if (c != client_id) connection.to(c).emit("snake_pos_server", payload);
      });
    }
  );

  connection.on("disconnect", () => {
    console.log(connection.id + "  Disconnected");
    let client = find_client(connection.id);
    let client_index = clients.indexOf(client!);
    let room = find_room(client?.room_id!);
    let room_index = rooms.indexOf(room!);
    clients.splice(client_index, 1); // Remove Client Obj

    if (room && room?.clients.length < 1) {
      rooms.splice(room_index); // Remove Room
    }
  });
});

function find_room(room_id: string) {
  let room = rooms.find((r: Room) => r.room_id === room_id);
  return room;
}

function find_client(client_id: string) {
  let client = clients.find((c: Client) => c.client_id === client_id);
  return client;
}
