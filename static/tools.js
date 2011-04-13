
//A set of handy, game independant classes and functions.
tools = new function() {

    this.randRange = function(minv, maxv) { 
        return Math.random()*(maxv - minv) + minv;
    };
    
    this.randRangeInt = function(minv, maxv) {
    	return Math.floor(this.randRange(minv, maxv+1))
    };

	this.findAbsolutePosition = function(obj) {
		var curleft = curtop = 0;
		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while (obj = obj.offsetParent);
		}
		return {x: curleft, y:curtop};
	};

	//Given a mouse event, find the mouse position relative to an element.
	this.getRelativeMousePos = function(e, element) {
		var x;
		var y;
		if (e.pageX || e.pageY) { 
		  x = e.pageX;
		  y = e.pageY;
		}
		else { 
		  x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft; 
		  y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop; 
		} 
		var abspos = this.findAbsolutePosition(element);
		x -= abspos.x;
		y -= abspos.y
		return {x: x, y:y};
	};
	

	this.Choose = function(list) {
		return list[this.randRangeInt(0, list.length-1)];
	};

}();
