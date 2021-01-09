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

interface Room {
  room_id: string;
  clients: Array<string>;
}
interface Client {
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
      let room = rooms.find((r) => r.room_id === room_id);
      let room_creator = room?.clients[0];
      if (!room) payload = { client: "Requestor", err_msg: "Room Not Found" };
      else if (room.clients.length > 2)
        payload = { client: "Requestor", err_msg: "Room Limit Reached" };
      else {
        room.clients.push(client_id);
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
      let room = rooms.find((r: Room) => r.room_id === room_id);
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
      room_id: String;
      client_id: String;
      x: Number;
      y: Number;
    }) => {
      let room = rooms.find((r: Room) => r.room_id === room_id);
      // let is_client_in_room = room?.clients.includes(client_id);
      let payload = { x, y };
      room?.clients.forEach((c: string) => {
        if (c != client_id) connection.to(c).emit("snake_pos_server", payload);
      });

      //disconnection too
    }
  );

  connection.on("disconnect", () => {
    console.log(connection.id + "  Disconnected");
    let room_id = clients.find((c) => c.client_id === connection.id)?.room_id;
    let room = rooms.find((r: Room) => r.room_id == room_id);
    //Remove User From Room
    // room?.clients
  });
});