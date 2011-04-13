
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
    var text;
    
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
    var extend_time = function() {
    	clearTimeout(timeout);
    	timeout = setTimeout(timeout_func, timeout_time);
    }
    extend_time();
    
    doc.DoCommand({cmd: 'new_layer', params: {}});
    
    
    // Return the number of places left in the room.
    this.getRemainingSpace = function() {
        return max_members - members.length;
    };
    
    //Add a member to this room.
    this.addMember = function(client, newroom) {
        var i;
        if (this.getRemainingSpace() === 0) {
            client.Disconnect("Room has no free spaces",this);
            return false;
        }
        //Broadcast info about this new member.
        new Packet().newMember(client).broadcastToRoom(client.listener, this);
        var p = new Packet().acceptJoin(newroom).Set('history', doc.getHistory()).Send(client);
        members.push(client);
        extend_time();
        client.data.room = this;
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
    
    socket.on('connection', function(client) {
    
        client.Disconnect = function(reason, room) {
            if (reason) {
                new Packet().Reject(reason, room).Send(client);
            }
        	if (client.data && client.data.room) {
        		client.data.room.removeClient(client);
        	}
            client.connected = false;
            client.on('message',function(){}); //no clue if this works.
        };
        
        //Inline Client class!
        client.data = {
            room: null,
        };
        
        client.on('disconnect', function() {
        	if (client.data && client.data.room) {
        		client.data.room.removeClient(client);
        	}
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
            	var cmd = data.command;
            	var room = client.data.room;
            	room.DoCommand(cmd);
            	new Packet().Set('command', cmd).broadcastToRoom(client.listener, room);
            }
        });
            
    });
};


