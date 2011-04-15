/* Packet class. 
    Example use of chaining: new Packet().acceptJoin().fullText(room).clientList(room).Send(client);
*/
this.Packet = function() {
    var data = {};

    //reject_join, sent to clients who have been rejected from a room for some @reason
    this.Reject = function(reason) {
        data.reject = {};
        data.reject.reason = reason;
        return this;
    };
    

    //new_member, inform room members of a new member.
    this.newMember = function(client, room) {
        data.new_member = client.info;

        data.member_count = room.member_count;
        data.members = room.getMembersInfo();
        return this;
    };
    
    this.memberLeft = function(client, room, reason) {
    	data.member_left = client.info;
	if (room) {
    		data.member_count = room.member_count;
    		data.members = room.getMembersInfo();
	}
    	return this;
    }

    //accept_join, inform a client that their request to join has been accepted.
    this.acceptJoin = function(client, is_newroom) {
        data.accept_join = {
        	info: client.info
        };
        data.new_room = is_newroom;
        data.member_count = client.data.room.member_count;
        data.members = client.data.room.getMembersInfo();
        return this;
    };

	this.nameChange = function(client, oldname, you) {
		data.name_change = {
			client: client.info,
			oldname: oldname,
			you: you
		}
		data.members = client.data.room.getMembersInfo();
		return this;
	}

	this.Chat = function(client, msg) {
		data.chat = {
			sender: client.info,
			text: msg
		}
		return this;
	}
	
	this.chatHistory = function(history) {
		data.chathistory = history;
		return this;
	}

	this.Set = function(name, ndata) {
		data[name] = ndata;
		return this;
	}
    ///////////////////////////////
    //Send this packet to a client;
    this.Send = function(client) {
        client.send(data);
    };


    //Send this packet to all clients other than @exclude
    this.Broadcast = function(socket, exclude) {
        if (exclude) {
            socket.broadcast(data, exclude.sessionId);
        }
        else {
            socket.broadcast(data);
        }
    };

    //Send this packet to all clients in @room other than @exclude
    this.broadcastToRoom = function(socket, room, exclude) {
        var i;
        var dest = room.getMembers();
        for (i in dest) {
            if (dest[i]!==exclude) {dest[i].send(data);}
        }
    };
};
