const io = require("socket.io");
const { Packet } = require("./server_packet");
const Names = require("./names").names;
const fs = require("fs");
const { Room } = require("./room");
const { ServerName } = require("./ServerName");

/* Server class */
this.Server = function (server) {
  const socket = io(server);
  const rooms = {};

  fs.readdir("static/roomcache", function (err) {
    if (err) {
      fs.mkdirSync("static/roomcache", "0777");
    }
  });

  this.getRooms = function () {
    return rooms;
  };

  this.getPublicRooms = function () {
    const pubrooms = {};
    for (const key in rooms) {
      if (key.indexOf("hidden") !== 0) {
        pubrooms[key] = rooms[key];
      }
    }
    return pubrooms;
  };

  this.uploadImage = function (req, roomid, buf, callback) {
    const room = rooms[roomid];
    if (!room) {
      callback(404);
      return;
    }
    const clientid = req.headers["x-client-id"];
    const client = room.clientById(clientid);
    if (client) {
      callback(403);
      return;
    }
    room.addImage(req, buf, function (id) {
      callback(200, id);
    });
  };

  socket.on("connection", function (client) {
    const SRVclient = {
      info: {
        name: '<span style="color: red">' + ServerName + "</span>",
      },
      listener: client.listener,
    };
    client.Disconnect = function (reason, room) {
      if (reason) {
        new Packet().Reject(reason, room).Send(client);
      }
      if (client.data && client.data.room) {
        client.data.room.removeClient(client);
      }
      new Packet()
        .memberLeft(client, client.data.room, reason)
        .broadcastToRoom(client.data.room);

      client.connected = false;
      client.on("message", function () {}); //no clue if this works.
    };

    //Inline Client class!
    client.data = {
      room: null,
    };
    client.info = {
      name: Names[Math.floor(Math.random() * Names.length)],
      id: client.id,
    };

    client.on("disconnect", function () {
      if (client.data && client.data.room) {
        client.data.room.Chat(SRVclient, client.info.name + " has left.");
        client.data.room.removeClient(client);
      }
      new Packet()
        .memberLeft(client, client.data.room, "disconnected")
        .broadcastToRoom(client.data.room);
    });

    client.on("message", function (data) {
      if (!client.connected) {
        return;
      }
      //Client has initiated the handshake procedure
      if ("connect" in data) {
        let room;
        if (client.data.room) {
          client.Disconnect("You are already in a room.");
          return;
        }

        if (!(data.connect.room in rooms)) {
          //Create a new room if needed exists
          room = new Room(data.connect.room, rooms);
          rooms[data.connect.room] = room;
          room.addMember(client, true);
          room.Chat(
            SRVclient,
            "Welcome to your new room! If you would like to change your name, simply type /name &lt;name&gt;"
          );
        } else {
          //Otherwise connect to an existing room
          room = rooms[data.connect.room];
          room.addMember(client, false);
        }

        room.Chat(SRVclient, client.info.name + " has joined");
      }
      if ("command" in data) {
        //TODO: Validate commands.
        const cmd = data.command;
        const room = client.data.room;
        try {
          room.DoCommand(cmd);
          new Packet().Set("command", cmd).broadcastToRoom(room);
        } catch (e) {
          console.log(e);
        }
      }
      if ("chat" in data) {
        //TODO: Check that msg is a string.
        let msg = data.chat;
        const room = client.data.room;
        if (!room) return;

        const htmlEntities = function (str) {
          return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        };

        if (msg.indexOf("/name") === 0) {
          const name = msg.substring(msg.indexOf(" ") + 1);
          if (name.length > 20) {
            new Packet().Chat(SRVclient, "Name too long").Send(client);
          } else if (client.data.room.clientByName(name) !== null) {
            new Packet().Chat(SRVclient, "Name already taken").Send(client);
          } else {
            const old = client.info.name;
            client.info.name = htmlEntities(name);
            new Packet()
              .nameChange(client, old, false)
              .broadcastToRoom(room, client);
            new Packet().nameChange(client, old, true).Send(client);
            room.Chat(
              SRVclient,
              `* <em>${old}</em> has changed name to <em>${client.info.name}</em>`
            );
          }
        } else {
          if (msg.length > 600) {
            msg = msg.substr(0, 597) + "...";
          }

          msg = htmlEntities(msg);

          room.Chat(client, msg);
        }
      }
    });
  });
};
