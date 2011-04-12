
//A set of handy, game independant classes and functions.
tools = new function() {

    this.randRange = function(minv, maxv) { 
        return Math.random()*(maxv - minv) + minv;
    }
    
    this.randRangeInt = function(minv, maxv) {
    	return Math.floor(this.randRange(minv, maxv+1))
    }

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
		x -= element.offsetLeft;
		y -= element.offsetTop;
		return {x: x, y:y};
	}
	

	this.Choose = function(list) {
		return list[this.randRangeInt(0, list.length-1)];
	}

}();
