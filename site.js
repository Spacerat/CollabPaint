
var paintserver = require("./paintserver");
var http = require('http');
var express = require('express');
var templater = require('ejs');

var app = express.createServer();

app.configure(function() {
    app.use(express.static(__dirname + '/static'));
    app.use(express.bodyParser());
    
    app.use(express.cookieParser());
    app.use(express.session({key:"joe", secret:"lolwut"}));
    
    app.set("view engine", "html");
    app.set("view options", {layout: false});
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

//Index, containing the collab box.
app.get('/paint/:id', function(req, res) {
    var roomname = req.params.id;
    res.render('paint', {room: roomname});
});

app.listen(8765);
paintserver.Server(app);

