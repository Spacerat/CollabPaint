
var paintserver = require("./paintserver");
var http = require('http');
var express = require('express');
var templater = require('ejs');
var fs = require('fs');

var app = express.createServer();

app.configure(function() {
    app.use(express.static(__dirname + '/static'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({key:"joe", secret:"lolwut"}));
    
    app.set("view engine", "html");
    app.set("view options", {layout: true});
    app.register( ".html", templater);
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

//Index, containing the collab box.
app.get('/paint/:id', function(req, res) {

	var roomname = req.params.id;

	//var painthead = templater.compile(fs.readFileSync('views/paint_head.html').toString());
	//var head = painthead({room: roomname});
	var head = templater.render(fs.readFileSync('views/paint_head.html').toString(), {locals: {room: roomname}});
    res.render('paint', {
    	pagetitle: roomname,
    	sitetitle: "CollabPaint",
    	head: head
    });
});

app.on('data', function(chunk) {
	console.log(chunk);
});


app.post('/paint/:id/upload', function(req, res) {
	var size = req.headers['content-length'];
	
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

app.listen(8765);
paintserver.Server(app);

