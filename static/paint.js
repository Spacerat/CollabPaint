



//Namespaces
Paint = {
	tools: {}, 
	ui: {}, 
	settings: {
		globals: {}
	}
};

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
	
	var lineWidth = data.lineWidth || "5";
	var strokeStyle = data.strokeStyle || ("#"+Paint.settings.globals.colour.toString());
	
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


Paint.tools.Brush.UI = function(parent) {
	//if (Paint.settings.brush)
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

Paint.ui.splitter = function(parent) {
	var sp = document.createElement("span");
	sp.className = 'splitter';
	parent.appendChild(sp);
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

Paint.Toolbar = function(div_id, painter) {
	var divElm = document.getElementById(div_id);
	var toolsElm = document.createElement("div");
	var settingsElm = document.createElement("div");
	var toolSettingsElm = document.createElement("div");
	toolsElm.style.display = 'inline';
	settingsElm.style.display = 'inline';
	toolSettingsElm.style.display = 'inline';
	
	divElm.appendChild(toolsElm);
	Paint.ui.splitter(divElm);
	divElm.appendChild(settingsElm);
	Paint.ui.splitter(divElm);
	divElm.appendChild(toolSettingsElm);
	
	var cpicker = document.createElement('input');
	Paint.settings.globals.colour = new jscolor.color(cpicker, {});
	Paint.settings.globals.colour.fromString("FF0000");
	settingsElm.appendChild(cpicker);
	
	for (var b in Paint.tools) {
		var toolElm = document.createElement("button");
		toolElm.innerHTML = b;
		toolsElm.appendChild(toolElm);
		toolElm.onclick = function() {
			painter.setTool(b);
		}
	}
	
	this.setTool = function(toolname) {
		toolSettingsElm.innerHTML = "";
		Paint.tools[toolname].UI(toolSettingsElm);
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
			current_tool.MouseMove(pos, canvas.getTempLayer());
		}
	}
	
	this.MouseUp = function(pos) {
		if (current_tool) {
			current_tool.MouseUp(pos);
			
			if (socket) {
				socket.send({'command': {
					cmd: 'tool',
					name: current_tool.name,
					data: current_tool.getData(),
					layerid: current_layer.id
				}});
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
