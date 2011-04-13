
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
	var allrooms = paintserver.getRooms();
	var rooms = {};
	for (var i in allrooms) {
		if (i.indexOf("hidden") !== 0) {
			rooms[i] = allrooms[i];
		}  
	}
	res.render('index', {
		sitetitle: "CollabPaint",
		pagetitle: "",
		head: "",
		rooms: rooms
	});
});

var painthead = templater.compile(fs.readFileSync('views/paint_head.html').toString());

//Index, containing the collab box.
app.get('/paint/:id', function(req, res) {

	var roomname = req.params.id;
	//var head = express.partial('paint_head', {locals: {room: roomname}});
	//res.partial('paint');
	
	var head = painthead({room: roomname});
    res.render('paint', {
    	pagetitle: roomname,
    	sitetitle: "CollabPaint",
    	head: head
    });
});

app.listen(8765);
paintserver.Server(app);

