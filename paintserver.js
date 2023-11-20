const io = require("socket.io");
const Packet = require("./server_packet").Packet;
const Names = require("./names").names;
const crypto = require("crypto");
const fs = require("fs");

/* Room class. Pass settings object in the form: {
    max_clients: int,    //10
    anyone_write: bool,  //false
    anyone_join: bool,   //false
}*/

const isNumber = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};
const isInteger = function (n) {
  return !isNaN(parseInt(n, 10)) && isFinite(n);
};

const ServerName = "CollabBox";

const paint = {};

paint.Layer = function (name) {
  this.name = name;
};

function validate_position(pos) {
  for (const key in pos) {
    if (!(key === "x" || key === "y")) return false;
    if (!isInteger(pos[key])) return false;
  }
  return true;
}

function validate_points(points) {
  return points.every(validate_position);
}

paint.Document = function () {
  let history = [];
  let layers = [];

  const validate = function (dict, name, checktype) {
    const v = dict[name];
    let err = "";

    checktype.split(" ").forEach(function (t) {
      switch (t) {
        case "positive":
          if (v < 0) err = "value is not positive";
          break;
        case "number":
          if (!isNumber(v)) err = "value is not a number";
          break;
        case "integer":
          if (!isInteger(v)) err = "value is not an integer";
          break;
        case "layerid":
          if (layers[v] == null) err = "a layer with id does not exist";
          break;
        case "position":
          if (!validate_position(v)) err = "this value is an invalid position";
          break;
        case "points":
          if (!validate_points(v)) err = "this value is an invalid point list";
          break;
      }
    });
    if (err.length > 0) {
      throw new Error(
        `Invalid data ${v.toString()} for ${name}. \
        Expecting a "${checktype}" value, but ${err}`
      );
    }
  };

  this.DoCommand = function (command) {
    //const allowed_tools = ['Brush', 'Eraser', 'tool']
    switch (command.cmd) {
      case "new_layer":
        {
          const name = command.params.name || "Layer_" + (layers.length + 1);
          command.params.name = name;
          const l = new paint.Layer(name);
          layers.push(l);
        }
        break;
      case "image":
        //Image URL/key has already been validated
        validate(command, "layerid", "layerid");
        validate(command, "pos", "position");
        break;
      case "tool":
        if (layers[command.layerid] == null) throw "Invalid layerid";
        switch (command.name) {
          case "Brush":
            validate(command.data, "pos", "position");
            validate(command.data, "points", "points");
            validate(command.data, "lineWidth", "positive integer");
            break;
          case "Eraser":
            validate(command.data, "pos", "position");
            validate(command.data, "points", "points");
            validate(command.data, "lineWidth", "positive integer");
            validate(command.data, "alpha", "positive number");
            break;
          case "Line":
            validate(command.data, "pos", "position");
            validate(command.data, "pos2", "position");
            validate(command.data, "lineWidth", "positive integer");
            break;
          case "Shape":
            validate(command.data, "pos", "position");
            validate(command.data, "pos2", "position");
            validate(command.data, "strokeWidth", "positive integer");
            break;
          default:
            throw "Unidentified tool " + command.name;
        }
        break;
      default:
        return false;
    }
    command.id = history.length;
    history.push(command);
    return true;
  };

  this.getHistory = function () {
    return history;
  };

  this.Free = function () {
    history = null;
    layers = null;
  };
};

function quicklog(s, f) {
  const logpath = "/tmp/" + f + ".log";
  s = s.toString().replace(/\r\n|\r/g, "\n"); // hack
  const fd = fs.openSync(logpath, "a+", 0o666);
  fs.writeSync(fd, s + "\n");
  fs.closeSync(fd);
}

const one_hour = 1000 * 60 * 60;

const Room = function (url, rooms) {
  const chat = [];

  let members = [];
  let doc = new paint.Document();
  const max_members = 255;

  const timeout_time = one_hour * 24;
  let timeout;
  let images = {};
  let closed = false;
  const timeout_func = function () {
    if (closed === true) {
      quicklog(
        "Attempt to close already closed room " + url + "!",
        "close_errors"
      );
      clearTimeout(timeout);
      return;
    }
    closed = true;

    members.forEach(function (c) {
      c.Disconnect("The room has timed out.");
    });

    //Delete room
    delete rooms[url];
    members = [];
    doc.Free();
    doc = null;
    images = null;

    fs.readdir(roomcacheurl, function (err, files) {
      if (!err) {
        files.forEach(function (file) {
          fs.unlinkSync(roomcacheurl + "/" + file);
        });
        fs.rmdirSync(roomcacheurl);
      } else {
        console.log(err);
      }
    });
    clearTimeout(timeout);
  };
  const extend_time = function (time) {
    time = time || timeout_time;
    clearTimeout(timeout);
    timeout = setTimeout(timeout_func, time);
  };

  const roomhash = crypto.createHash("md5");
  const roomcacheurl = "static/roomcache/" + roomhash.digest("hex");

  try {
    fs.mkdirSync(roomcacheurl, "0777");
  } catch (e) {
    if (e.code != "EEXIST") {
      throw e;
    }
  }

  this.member_count = 0;

  extend_time();

  doc.DoCommand({ cmd: "new_layer", params: {} });

  this.Chat = function (client, text) {
    chat.push({
      sender: client.info,
      text: text,
    });
    new Packet().Chat(client, text).broadcastToRoom(client.listener, this);
  };

  // Return the number of places left in the room.
  this.getRemainingSpace = function () {
    return max_members - members.length;
  };

  this.clientByName = function (name) {
    if (name === ServerName) return {};
    members.forEach(function (m) {
      if (m.info.name === name) return m;
    });
    return null;
  };

  this.clientById = function (id) {
    members.forEach(function (m) {
      if (m.info.id === id) return m;
    });
  };

  //Add a member to this room.
  this.addMember = function (client, newroom) {
    if (this.getRemainingSpace() === 0) {
      client.Disconnect("Room has no free spaces", this);
      return false;
    }
    //Broadcast info about this new member.
    this.member_count = members.length + 1;
    client.data.room = this;

    let t = 1;
    let newname = client.info.name;
    while (this.clientByName(newname) !== null) {
      newname = client.info.name + t;
      t += 1;
    }
    client.info.name = newname;

    new Packet().newMember(client, this).broadcastToRoom(client.listener, this);
    members.push(client);
    new Packet()
      .acceptJoin(client, newroom)
      .Set("history", doc.getHistory())
      .chatHistory(chat)
      .Send(client);

    extend_time();

    return true;
  };

  this.removeClient = function (client) {
    const newmembers = [];
    for (let i = 0; i < members.length; i++) {
      if (members[i] !== client) {
        newmembers.push(members[i]);
      }
    }
    members = newmembers;
    this.member_count = members.length;
    if (members.length === 0) {
      extend_time();
    }
  };

  this.DoCommand = function (command) {
    if (command.cmd === "image") {
      if (images[command.key] === undefined) {
        return false;
      } else {
        command.url = images[command.key].url;
      }
    }
    if (doc.DoCommand(command) === true) {
      extend_time();
      return true;
    }
  };

  this.addImage = function (req, buf, cb) {
    const hash = crypto.createHash("md5");
    hash.update(buf);
    const key = hash.digest("hex");
    const ext = req.headers["x-file-name"].substr(ext.lastIndexOf("."));

    if (images[key] !== undefined) {
      cb(images[key]);
    } else {
      const imgurl = roomcacheurl + "/" + key + ext;
      images[key] = {
        url: imgurl.substr(roomcacheurl.indexOf("/")),
        key: key,
      };

      fs.writeFile(imgurl, buf, "binary", function (err) {
        if (!err) {
          cb(images[key]);
        }
      });
    }
  };

  this.getMembers = function () {
    return members;
  };
  this.getMembersInfo = function () {
    const ret = [];
    for (let i = 0; i < members.length; i++) {
      ret.push(members[i].info);
    }
    return ret;
  };
};

/* Server class.
 */
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
    for (const i in rooms) {
      if (i.indexOf("hidden") !== 0) {
        pubrooms[i] = rooms[i];
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
        .broadcastToRoom(client.listener, client.data.room);

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
        .broadcastToRoom(client.listener, client.data.room);
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
          new Packet()
            .Set("command", cmd)
            .broadcastToRoom(client.listener, room);
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
              .broadcastToRoom(client.listener, room, client);
            new Packet().nameChange(client, old, true).Send(client);
            room.Chat(
              SRVclient,
              "* <em>" +
                old +
                "</em> has changed name to <em>" +
                client.info.name +
                "</em>"
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
