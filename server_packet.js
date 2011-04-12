
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
    this.newMember = function(client) {
        data.new_member = {};
        return this;
    };

    //accept_join, inform a client that their request to join has been accepted.
    this.acceptJoin = function(is_newroom) {
        data.accept_join = true;
        data.new_room = is_newroom;
        return this;
    };

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
