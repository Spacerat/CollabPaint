
var io = require('socket.io');
var util = require('util');
var Packet = require('./server_packet').Packet;
var crypto = require('crypto');
var fs = require('fs');

/* Room class. Pass settings object in the form: {
    max_clients: int,    //10
    anyone_write: bool,  //false
    anyone_join: bool,   //false
}*/

var ServerName = "CollabBox";

var paint = {};

paint.Layer = function(name) {
	this.name = name;
}

paint.Document = function() {
	var history = [];
	var layers = [];
	
	this.DoCommand = function(command) {

		switch (command.cmd) {
			case 'new_layer':
				var name = command.params.name || ("Layer_"+(layers.length+1));
				command.params.name = name;
				var l = new paint.Layer(name);
				layers.push(l);
				break;
			default:
				//TODO: Validate tool commands
				break;
		}
		command.id = history.length;
		history.push(command);
	}

	this.getHistory = function() {
		return history;
	}
	
	this.Free = function() {
		history = null;
		layers = null;
	}
	
}

var Room = function(url, rooms) {
	var chat = [];
	

    var members = [];
 	var doc = new paint.Document();   
    var max_members = 255;
    var timeout_time = 1000 * 60 * 60; 
    var timeout;
    var images = {};
    var timeout_func = function() {
    	for (var c in members) {
    		members[c].Disconnect("The room has timed out.");
    	}
    	//Delete room
    	delete rooms[url];
    	members = [];
    	doc.Free();
    	doc = null;
    	images = null;
    	fs.rmdir(roomcacheurl);
    	
    };
    var extend_time = function(time) {
    	time = time || timeout_time;
    	clearTimeout(timeout);
    	timeout = setTimeout(timeout_func, time);
    }
    
    var roomhash = crypto.createHash('md5');
    var roomcacheurl = 'static/roomcache/'+roomhash.digest('hex');
    fs.mkdir(roomcacheurl, '0777');
    
    this.member_count = 0;
    
    extend_time();
    
    doc.DoCommand({cmd: 'new_layer', params: {}});
    
 	this.Chat = function(client, text) {

 		chat.push({
			sender: client.info,
			text: text
		});
		new Packet().Chat(client, text).broadcastToRoom(client.listener, this);
 	}
	   
    // Return the number of places left in the room.
    this.getRemainingSpace = function() {
        return max_members - members.length;
    };
    
    this.clientByName = function(name) {
    	if (name === ServerName) return {};
        members.forEach(function(m) {
        	if (m.info.name === name) return m;
        });
        return null;
    }
    
    this.clientById = function(id) {
    	members.forEach(function(m) {
    		if (m.info.id === id) return m;
    	});
    }
    
    //Add a member to this room.
    this.addMember = function(client, newroom) {
        if (this.getRemainingSpace() === 0) {
            client.Disconnect("Room has no free spaces",this);
            return false;
        }
        //Broadcast info about this new member.
        this.member_count = members.length + 1;
        client.data.room = this;
        
        var t = 1;
        var newname = client.info.name;
		while (this.clientByName(newname) !== null) {
			newname = client.info.name + t;
			t+=1;
		}
		client.info.name = newname;
        
        new Packet().newMember(client, this).broadcastToRoom(client.listener, this);
        members.push(client);
        var p = new Packet().acceptJoin(client, newroom).Set('history', doc.getHistory()).chatHistory(chat).Send(client);
        
        
        extend_time();
        
        
        return true;
    };
    
    this.removeClient = function(client) {
    	var newmembers = [];
    	for (var i=0;i<members.length;i++) {
    		if (members[i] !== client) {
    			newmembers.push(members[i]);
    		}
    	}
    	members = newmembers;
    	this.member_count = members.length;
    	if (members.length === 0) {
    		extend_time();
    	}
    }
    
    this.DoCommand = function(command) {
    	
    	if (command.cmd === 'image') {
    		if (images[command.key] === undefined) {
    			return false;
    		}
    		else {
    			command.url = images[command.key].url;
    		}
    	}
    	doc.DoCommand(command);
    	extend_time();
    }
    
    this.addImage = function(req, buf, cb) {
		var hash = crypto.createHash('md5');
		hash.update(buf);
		var key = hash.digest('hex');
		var ext = req.headers['x-file-name'];
		ext = ext.substr(ext.lastIndexOf('.'));
		if (images[key] !== undefined) {
			cb(images[key]);
		}
		else {
			var imgurl = roomcacheurl +'/'+ key + ext;
			images[key] = {
				url: imgurl.substr(roomcacheurl.indexOf('/')),
				key: key
			}
			
			fs.writeFile(imgurl, buf, 'binary', function(err) {
				if (!err) {
					cb(images[key]);
				}
			});
		}
    }
    
    this.getMembers = function() {
    	return members;
    }
    this.getMembersInfo = function() {
    	var ret = [];
    	for (var i = 0;i<members.length;i++) {
    		ret.push(members[i].info);
    	}
    	return ret;
    }
};



/* Server class.
*/
this.Server = function(app) {
    var socket = io.listen(app);
    var rooms = {};
    
    fs.readdir('static/roomcache', function(err) {
    	if (err) {
    		fs.mkdir('static/roomcache', '0777');
    	}
    });
    
    this.getRooms = function() {return rooms;};
    
    this.getPublicRooms = function(list) {
		var pubrooms = {};
		for (var i in rooms) {
			if (i.indexOf("hidden") !== 0) {
				pubrooms[i] = rooms[i];
			}  
		}
		return pubrooms;
    }
    
    this.uploadImage = function(req, roomid, buf, callback) {
    	var room = rooms[roomid];
    	if (!room) {
    		callback(404);
    		return;
    	}
    	var clientid = req.headers['x-client-id'];
    	var client = room.clientById(clientid);
    	if (client) {
    		callback(403);
    		return;
    	}
    	room.addImage(req, buf, function(id){
    		callback(200, id);
    	});
    }
    
    socket.on('connection', function(client) {
    	var SRVclient = { 
    		info: {
        		name: '<span style="color: red">'+ServerName+'</span>'
        	},
        	listener: client.listener
        }; 
        client.Disconnect = function(reason, room) {
      
            if (reason) {
                new Packet().Reject(reason, room).Send(client);
            }
        	if (client.data && client.data.room) {
        		client.data.room.removeClient(client);
        	}
        	new Packet().memberLeft(client,  client.data.room, reason).broadcastToRoom(client.listener, client.data.room);
        	
            client.connected = false;
            client.on('message',function(){}); //no clue if this works.
        };
        
        //Inline Client class!
        client.data = {
            room: null,
        };
        client.info = {
        	name: "Anon",
        	id: client.listener.sessionId
        }
        
        client.on('disconnect', function() {
        	if (client.data && client.data.room) {
        		client.data.room.Chat(SRVclient, client.info.name+" has left.");
        		client.data.room.removeClient(client);
        	}
        	new Packet().memberLeft(client, client.data.room, "disconnected").broadcastToRoom(client.listener, client.data.room);
        	
        });
        
        client.on('message', function(data) {

            if (!client.connected) {
                return;
            }
            //Client has initiated the handshake procedure
            if ('connect' in data) {
                var room;
                if (client.data.room) {
                    client.Disconnect("You are already in a room.");
                    return;
                }
                
                if (!(data.connect.room in rooms)) {
                	 //Create a new room if needed exists
                    room = new Room(data.connect.room, rooms);
                    rooms[data.connect.room] = room;
                    room.addMember(client, true);
                    room.Chat(SRVclient,"Welcome to your new room! If you would like to change your name, simply type /name &lt;name&gt;");
                }
                else {
                	//Otherwise connect to an existing room
		            room = rooms[data.connect.room];
		            room.addMember(client, false);
                }
                
                room.Chat(SRVclient,client.info.name+" has joined");
            }
            if ('command' in data) {
            	//TODO: Validate commands.
            	var cmd = data.command;
            	var room = client.data.room;
            	room.DoCommand(cmd);
            	new Packet().Set('command', cmd).broadcastToRoom(client.listener, room);
            }
            if ('chat' in data) {
            	//TODO: Check that msg is a string.
            	var msg = data.chat;
            	var room = client.data.room;
            	if (!room) return;
            	
	        	var htmlEntities = function(str) {
					return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
				};

            	if (msg.indexOf('/name')===0) {
            		var name = msg.substring(msg.indexOf(" ")+1);
            		if (name.length > 20) {
            			new Packet().Chat(SRVclient, "Name too long").Send(client);
            		}
            		else if (client.data.room.clientByName(name)!==null) {
            			new Packet().Chat(SRVclient, "Name already taken").Send(client);
               		}
               		else {
               			var old = client.info.name;
               			client.info.name = htmlEntities(name);
               			new Packet().nameChange(client, old, false).broadcastToRoom(client.listener, room, client);
               			new Packet().nameChange(client, old, true).Send(client);
               			room.Chat(SRVclient,"* <em>"+old+"</em> has changed name to <em>"+client.info.name+'</em>');
               		}
            	}
            	else {
            	
		         	if (msg.length > 600) {
		        		msg = msg.substr(0, 597)+"...";
		        	}           	

					msg = htmlEntities(msg);

		        	room.Chat(client, msg);
		        	
            	}
            }
        });
            
    });
};


