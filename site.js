
var paintserver = require("./paintserver");
var express = require('express');
var http = require('http');
var templater = require('ejs');
var fs = require('fs');
var partials = require('express-partials');

var PORT = process.env.PORT || 8080;
var app = require('express')();
var server = http.Server(app);


app.configure(function() {
	app.use(partials());
    app.use(express.static(__dirname + '/static'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({key:"joe", secret:"lolwut"}));
    
    app.set("view engine", "html");
    app.set("view options", {layout: true});
    app.engine( ".html", templater.renderFile);
});
app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(express.logger());
});

app.configure('production', function(){
    app.use(express.errorHandler());
});
////
//Web Pages
////

app.get('/', function(req, res) {
	var head = templater.render(fs.readFileSync('views/index_head.html').toString());
	res.render('index', {
		sitetitle: "CollabPaint",
		pagetitle: "",
		head: head
	});
});

app.get('/rooms', function(req, res) {
	var accept = req.header('Accept');
	if (accept.indexOf('json') != -1 || accept.indexOf('javascript') != -1) {
		res.send(JSON.stringify(paintserver.getPublicRooms()));
	}
	else {
		res.partial('room_list', {rooms: paintserver.getPublicRooms()});
	}
});

function paintRoom(hidden) {
	return function paintRoom(req, res, next) {
		req.roomname = req.params.id;
		if (hidden) req.roomname="hidden: "+req.roomname;
		req.painthead = templater.render(fs.readFileSync('views/paint_head.html').toString(), {locals: {room: req.roomname}});	
		next();
	}
}
//Index, containing the collab box.
app.get('/paint/:id', paintRoom(false), function(req, res) {
    res.render('paint', {
    	pagetitle: req.roomname,
    	sitetitle: "CollabPaint",
    	head: req.painthead,
    });
});
app.get('/hidden/:id', paintRoom(true), function(req, res) {
    res.render('paint', {
    	pagetitle: req.roomname,
    	sitetitle: "CollabPaint",
    	head: req.painthead,
    });
});




app.on('data', function(chunk) {
	console.log(chunk);
});


app.post('/paint/:id/upload', function(req, res) {
	var size = req.headers['content-length'];
	if (size > 1048576) {
		res.send("Image too large.", 403);
	}
	var buf = new Buffer(parseInt(size, 10));
	var pos = 0;
	
	
	//req.setEncoding('binary');
	req.on('data', function(chunk) {
		chunk.copy(buf, pos);
		pos += chunk.length;
	});
	req.on('end', function() {
		paintserver.uploadImage(req, req.params.id, buf, function(status, url) {
			if (status === 200) {
				res.send(JSON.stringify(url), status);
			}
			else {
				res.send(status);
			}
		});
	});
});

server.listen(PORT);
paintserver.Server(server);

