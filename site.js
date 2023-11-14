var paintserver = require("./paintserver");
var express = require("express");
var http = require("http");
var ejs = require("ejs");
var fs = require("fs");
var partials = require("express-partials");
var bodyParser = require("body-parser");
var session = require("express-session");
var PORT = process.env.PORT || 8080;
var app = express();

app.use(partials());
app.use(express.static(__dirname + "/static"));
app.use(bodyParser.raw());
app.use(
  session({
    key: "joe",
    secret: "lolwut",
    resave: false,
    saveUninitialized: true,
  })
);

app.set("view engine", "html");
app.set("view options", { layout: true });
app.engine(".html", ejs.renderFile);

////
//Web Pages
////

app.get("/", function (req, res) {
  var head = ejs.render(fs.readFileSync("views/index_head.html").toString());
  res.render("index", {
    sitetitle: "CollabPaint",
    pagetitle: "",
    head: head,
  });
});

app.get("/rooms", function (req, res) {
  var accept = req.header("Accept");
  if (accept.indexOf("json") != -1 || accept.indexOf("javascript") != -1) {
    res.send(JSON.stringify(paintserver.getPublicRooms()));
  } else {
    res.partial("room_list", { rooms: paintserver.getPublicRooms() });
  }
});

function paintRoom(hidden) {
  return function paintRoom(req, res, next) {
    req.roomname = req.params.id;
    if (hidden) req.roomname = "hidden: " + req.roomname;
    var template = fs.readFileSync("views/paint_head.html").toString();
    req.painthead = ejs.render(template, { room: req.roomname });
    next();
  };
}
//Index, containing the collab box.
app.get("/paint/:id", paintRoom(false), function (req, res) {
  res.render("paint", {
    pagetitle: req.roomname,
    sitetitle: "CollabPaint",
    head: req.painthead,
  });
});
app.get("/hidden/:id", paintRoom(true), function (req, res) {
  res.render("paint", {
    pagetitle: req.roomname,
    sitetitle: "CollabPaint",
    head: req.painthead,
  });
});

app.on("data", function (chunk) {
  console.log(chunk);
});

app.post("/paint/:id/upload", function (req, res) {
  var size = req.headers["content-length"];
  if (size > 1048576) {
    res.send("Image too large.", 403);
  }

  var buf = Buffer.alloc(parseInt(size, 10));
  var pos = 0;

  //req.setEncoding('binary');
  req.on("data", function (chunk) {
    chunk.copy(buf, pos);
    pos += chunk.length;
  });
  req.on("end", function () {
    paintserver.uploadImage(req, req.params.id, buf, function (status, url) {
      if (status === 200) {
        res.status(200).send(JSON.stringify(url));
      } else {
        res.send(status);
      }
    });
  });
});

var server = http.Server(app);
paintserver.Server(server);
server.listen(PORT);
console.log("Running at http://localhost:" + PORT);
