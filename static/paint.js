
try {
	(function() {var a = console.log;})();
}
catch (e) {
	console = {
		log: function(object) {
			setTimeout(function() {
				throw new Error("log: "+JSON.stringify(object));
			},1);
		}
	}
}




//Namespaces
Paint = {
	tools: {}, 
	ui: {}, 
	settings: {
		globals: {}
	}
};

Paint.tools.Pointer = function(data) {

}
Paint.tools.Pointer.UI = function() {
	this.elements = [];
	this.cursor = "auto";
}

Paint.tools.Brush = function(data) {
	var points = data.points;
	var pos = data.pos;
	this.name = "Brush";
	
	if (points == null && pos == null) {
		throw "Error";
	}
	else if (points == null) {
		points = [];
		points.push(pos);
	}
	else {
		pos = points[0];
	}
	var lineWidth = data.lineWidth || Paint.settings.Brush.size.getValue();
	var strokeStyle = data.strokeStyle;
	if (!strokeStyle) {
		 var rgb = Paint.settings.globals.colour.rgb;
		 strokeStyle = "rgba("+(rgb[0]*255.0)+","+(rgb[1]*255.0)+","+(rgb[2]*255.0)+","+(Paint.settings.globals.opacity.getValue()/255.0)+")";
	}
	
	this.Render = function(layer) {
		var ctx = layer.canvasElm.getContext("2d");
		ctx.beginPath();
		ctx.moveTo(points[0].x, points[0].y);
		
		/*
		for (var i = 1; i < points.length; i+=2) {
			//ctx.moveTo(cx, cy);
			
			cx = cx + points[i-1].x;
			cy = cy + points[i-1].y;			
			
			var ctrlx = cx;
			var ctrly = cy;
			
			ctx.quadraticCurveTo(ctrlx, ctrly, cx + points[i].x, cy + points[i].y);
			cx = cx + points[i].x;
			cy = cy + points[i].y;
			
		}
		*/
		
		for (var i = 1; i < points.length; i++) {
			ctx.lineTo(points[i].x, points[i].y)		
		}
		
		ctx.moveTo(points[0].x, points[0].y);
		ctx.closePath();
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = strokeStyle;
		ctx.stroke();
	}
	
	this.MouseMove = function(pos, layer) {
		points.push(pos);
		layer.Clear();
		this.Render(layer);
	}
	
	this.MouseUp = function(){};
	
	this.getData = function() {
		return {
			pos: pos,
			lineWidth: lineWidth,
			strokeStyle: strokeStyle,
			points: points
		};
	}
}
Paint.tools.Brush.UI = function() {
	this.size = new Paint.ui.slider(1, 100, 20);
	this.shadow = new Paint.ui.slider(0, 100, 0);
	this.elements = [
		new Paint.ui.label("Size:", "strong")
		,this.size
		//,new Paint.ui.label("Shadow:", "strong")
		//,this.shadow
	];
	this.cursor = "crosshair";
};

Paint.ui.colourPicker = function(label) {
	var span = document.createElement("span");
	span.innerHTML = '<strong>'+label+'</strong>';
	var pickerElm = document.createElement('input');
	span.appendChild(pickerElm);
	var picker = new jscolor.color(pickerElm, {});
	parent.appendChild(span);
	this.getColour = function() {
		return "#"+picker.color.toString();
	}
}

Paint.ui.label = function(HTML, type) {
	type = type || "strong";
	this.elm = document.createElement(type);
	this.elm.innerHTML = HTML;
}

Paint.ui.slider = function(min, max, value) {
	this.elm = document.createElement("input");
	this.elm.type = "range";
	this.elm.min = min;
	this.elm.max = max || 100;
	this.elm.value = value;
	this.getValue = function() {
		if (this.elm.value !== undefined) {
			return Math.max(this.elm.min,Math.min(parseInt(this.elm.value,10),this.elm.max));
		}
	}
}

Paint.ui.splitter = function() {
	this.elm = document.createElement("span");
	this.elm.className = 'splitter';
}


Paint.Toolbar = function(div_id, painter) {
	var divElm = document.getElementById(div_id);
	var toolsElm = document.createElement("div");
	var settingsElm = document.createElement("div");
	var toolSettingsElm = document.createElement("div");
	toolsElm.style.display = 'inline';
	settingsElm.style.display = 'inline';
	toolSettingsElm.style.display = 'inline';
	
	divElm.appendChild(toolsElm);
	divElm.appendChild(new Paint.ui.splitter().elm);
	divElm.appendChild(settingsElm);
	divElm.appendChild(new Paint.ui.splitter().elm)
	divElm.appendChild(toolSettingsElm);
	
	var cpicker = document.createElement('input');
	Paint.settings.globals.colour = new jscolor.color(cpicker, {});
	Paint.settings.globals.colour.fromString("FF0000");
	settingsElm.appendChild(cpicker);
	
	settingsElm.appendChild(new Paint.ui.label("Opacity").elm);
	Paint.settings.globals.opacity = new Paint.ui.slider(0, 255, 255);
	settingsElm.appendChild(Paint.settings.globals.opacity.elm);
	
	
	for (var b in Paint.tools) {
		var toolElm = document.createElement("button");
		toolElm.innerHTML = b;
		toolElm.name = b;
		toolsElm.appendChild(toolElm);
		toolElm.onclick = function() {
			painter.setTool(this.name);
			

		}
	}
	
	this.setTool = function(toolname) {
		toolSettingsElm.innerHTML = "";
		if (!Paint.settings[toolname]) {
			Paint.settings[toolname] = new Paint.tools[toolname].UI();
		}
		if (Paint.settings[toolname].elements) {
			for (var i = 0;i<Paint.settings[toolname].elements.length;i++) {
				toolSettingsElm.appendChild(Paint.settings[toolname].elements[i].elm);
			}
		}
		document.body.style.cursor = Paint.settings[toolname].cursor || "auto";
	}
}

Paint.Layer = function(opts, id) {
	if (!opts) opts={};
	this.name = opts.name || 'New layer';
	this.canvasElm = document.createElement("canvas");
	this.canvasElm.className = 'canvas';
	this.canvasElm.id = "layer_"+this.name;
	this.id = id;
	var history = [];
	this.Attach = function(parent) {
		parent.appendChild(this.canvasElm);
		this.canvasElm.width = parent.offsetWidth;
		this.canvasElm.height = parent.offsetHeight;
	}
	this.Clear = function() {
		this.canvasElm.getContext("2d").clearRect(0, 0, this.canvasElm.width, this.canvasElm.height);
	}
	this.addHistory = function(command) {
		history.push(command);
	}
	this.RenderHistory = function(painter) {
		for (var i=0;i<history.length;i++) {
			painter.ProcessCommand(history[i]);
		}
	}
}

Paint.Painter = function() {
	var layers = [];
	var current_layer = null;
	var canvas;
	var that = this;
	var selected_tool = "";
	var current_tool = null;
	var socket;
	var toolbar = null;
	var last_sent_id;
	
	this.AddLayer = function(opts) {
		if (!opts) opts = {};
		if (!opts.name) opts.name = "Layer_"+(layers.length+1);
		var l = new Paint.Layer(opts, layers.length);
		layers.push(l);
		canvas.AddLayer(l);
		if (layers.length === 1) {
			current_layer = l;
		}
	};
	
	this.CreateCanvas = function(object_id) {
		canvas = new Paint.Canvas(object_id, this);
		canvas.Init();
	};
	
	this.CreateToolbar = function(object_id) {
		toolbar = new Paint.Toolbar(object_id, this);
	}
	
	this.ProcessCommand = function(command, is_new, socket) {
		switch (command.cmd) {
			case 'new_layer':
				this.AddLayer(command.params);
				break;
			case 'tool': 
				var tool = new Paint.tools[command.name](command.data);
				tool.Render(layers[command.layerid]);
				if (is_new) {layers[command.layerid].addHistory(command);}
				if (command.rnd_id === last_sent_id) {
					last_sent_id = 0;
					canvas.getTempLayer().Clear();
				}
				break;
			default:
				console.log("Unknown command", command);
		}
	}
	
	this.Connect = function(roomname) {
		socket = new io.Socket(null);
		
		socket.connect();
		socket.on('connect', function() {
			socket.send({'connect': {
				room: roomname
			}});
		});
		socket.on('message', function(data) {
			//Process network messages
			for (var msgname in data) {
				var msg = data[msgname];
				switch (msgname) {
					case 'history':
						for (var i = 0; i<msg.length; i++) {
							that.ProcessCommand(msg[i], true, socket);
						}
						break;
					case 'command':
						that.ProcessCommand(msg, true,  socket);
						break;
					case 'reject':
						alert(msg.reason);
						break;
					default: 
						//console.log("Unknown message", msgname, msg);
						break;
				}
			}
		});
	};
	
	this.MouseDown = function(pos) {
		if (!current_tool) {
			current_tool = new Paint.tools[selected_tool]({pos: pos});
		}
	}
	
	this.MouseMove = function(pos) {
		if (current_tool) {
			if (current_tool.MouseMove) current_tool.MouseMove(pos, canvas.getTempLayer());
		}
	}
	
	this.MouseUp = function(pos) {
		if (current_tool) {
			if (current_tool.MouseDown) current_tool.MouseUp(pos);
			if (current_tool.getData) {
				if (socket) {
					last_sent_id = tools.randRangeInt(1,1000);
					socket.send({'command': {
						cmd: 'tool',
						name: current_tool.name,
						data: current_tool.getData(),
						layerid: current_layer.id,
						rnd_id: last_sent_id
					}});
				}
			}
			current_tool = null;
		}
	}
	
	this.getLayers = function(){return layers;};
	
	this.getSelectedTool = function() {
		return selected_tool;
	}
	
	this.setTool = function(toolname) {
		selected_tool = toolname;
		toolbar.setTool(toolname);
	}
}

Paint.Canvas = function(object_id, painter) {
	var containerElm;
	var layersElm;
	var temp_layer = new Paint.Layer({name: "temp"});
	var that = this;
	
	this.Init = function() {
		containerElm = document.getElementById(object_id);
		layersElm = document.createElement("div");
		layersElm.id = 'layers';
		containerElm.appendChild(layersElm);
		temp_layer.Attach(layersElm);
		
		var downEvent = function(evt) {
			//evt.preventDefault();
			var pos = tools.getRelativeMousePos(evt, containerElm);
			painter.MouseDown(pos);
		};
		var moveEvent = function(evt) {
			//evt.preventDefault();
			var pos = tools.getRelativeMousePos(evt, containerElm);
			painter.MouseMove(pos);
		};
		var upEvent = function(evt) {
			//evt.preventDefault();
			var pos = tools.getRelativeMousePos(evt, containerElm);
			painter.MouseUp(pos);
		};
		
		var resizetimer;
		window.onresize = function() {
			clearTimeout(resizetimer);
			resizetimer = setTimeout(function() {
				temp_layer.canvasElm.width = containerElm.offsetWidth;
				temp_layer.canvasElm.height = containerElm.offsetHeight;
				var layers = painter.getLayers();
				for (var i=0;i<layers.length;i++) {
					layers[i].canvasElm.width = containerElm.offsetWidth;
					layers[i].canvasElm.height = containerElm.offsetHeight;
					layers[i].RenderHistory(painter);
				}
			}, 10);
		}
		
		if ('ontouchstart' in window) {
			document.addEventListener("touchstart", downEvent, false);
			document.body.addEventListener('touchmove',moveEvent , false);
			document.body.addEventListener('touchend', upEvent, false);
		}
		else {
			containerElm.addEventListener('mousedown', downEvent, false);
			window.addEventListener('mousemove',moveEvent , false);
			window.addEventListener('mouseup', upEvent, false);
		}

	}
	
	this.AddLayer = function(layer) {
		layersElm.appendChild(layer.canvasElm);
		layer.canvasElm.width = containerElm.offsetWidth;
		layer.canvasElm.height = containerElm.offsetHeight;
		layer.Clear();
		layersElm.removeChild(temp_layer.canvasElm);
		temp_layer.Attach(layersElm);
	}
	
	this.getTempLayer = function() {return temp_layer;};
}
