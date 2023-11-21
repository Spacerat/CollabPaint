const crypto = require("crypto");
const fs = require("fs");
const Packet = require("./server_packet").Packet;

const { Document } = require("./document");
const { ServerName } = require("./ServerName");

const one_hour = 1000 * 60 * 60;

function quicklog(s, f) {
  const logpath = "/tmp/" + f + ".log";
  s = s.toString().replace(/\r\n|\r/g, "\n"); // hack
  const fd = fs.openSync(logpath, "a+", 0o666);
  fs.writeSync(fd, s + "\n");
  fs.closeSync(fd);
}

const Room = function (url, rooms) {
  const chat = [];

  let members = [];
  let doc = new Document();
  const max_members = 255;

  const timeout_time = one_hour * 24;
  let timeout;
  let images = {};
  let closed = false;
  const timeout_func = function () {
    if (closed === true) {
      quicklog(`Attempt to close already closed room ${url}!`, "close_errors");
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
    new Packet().Chat(client, text).broadcastToRoom(this);
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

    new Packet().newMember(client, this).broadcastToRoom(this);
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
    members = members.filter((member) => member !== client);
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
    return members.map((member) => member.info);
  };
};
exports.Room = Room;
