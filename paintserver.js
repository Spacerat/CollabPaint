
var io = require('socket.io');
var util = require('util');
var Packet = require('./server_packet').Packet;

/* Room class. Pass settings object in the form: {
    max_clients: int,    //10
    anyone_write: bool,  //false
    anyone_join: bool,   //false
}*/

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
	
}

var Room = function(url, rooms) {
	var chat = [];
	

    var members = [];
 	var doc = new paint.Document();   
    var max_members = 255;
    var timeout_time = 1000 * 60 * 60; 
    var timeout;
    var timeout_func = function() {
    	for (var c in members) {
    		members[c].Disconnect("The room has timed out.");
    	}
    	delete rooms[url];
    };
    var extend_time = function(time) {
    	time = time || timeout_time;
    	clearTimeout(timeout);
    	timeout = setTimeout(timeout_func, time);
    }
    
    this.member_count = 0;
    
    extend_time();
    
    doc.DoCommand({cmd: 'new_layer', params: {}});
    
 	this.Chat = function(client, text) {
 		chat.push({
			sender: client.info,
			text: text
		});
 	}
	   
    // Return the number of places left in the room.
    this.getRemainingSpace = function() {
        return max_members - members.length;
    };
    
    this.clientByName = function(name) {
        for (var i = 0;i < members.length; i++) {
        	if (name === members[i].info.name) {
        		return true;
        	}
        }
        return null;
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
        var p = new Packet().acceptJoin(client, newroom).Set('history', doc.getHistory()).chatHistory(chat).Send(client);
        members.push(client);
        
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
    		extend_time(1000 * 60 * 5);
    	}
    }
    
    this.DoCommand = function(command) {
    	doc.DoCommand(command);
    	extend_time();
    }
    
    this.getMembers = function() {
    	return members;
    }
};



/* Server class.
*/
this.Server = function(app) {
    var socket = io.listen(app);
    var rooms = {};
    
    
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
    
    socket.on('connection', function(client) {
    
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
        	name: "Anon"
        }
        
        
        client.on('disconnect', function() {
        	if (client.data && client.data.room) {
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
                }
                else {
                	//Otherwise connect to an existing room
		            room = rooms[data.connect.room];
		            room.addMember(client, false);
                }
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
             	if (msg.length > 600) {
            		msg = msg.substr(0, 597)+"...";
            	}           	
            	var htmlEntities = function(str) {
					return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
				};
				msg = htmlEntities(msg);

            	client.data.room.Chat(client, msg);
            	new Packet().Chat(client, msg).broadcastToRoom(client.listener, client.data.room);
            }
        });
            
    });
};


