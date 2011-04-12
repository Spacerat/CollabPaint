
//Namespace
Paint = {tools: {}}

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
	var strokeStyle = data.strokeStyle || "black";
	
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

Paint.Layer = function(opts, id) {
	if (!opts) opts={};
	this.name = opts.name || 'New layer';
	this.canvasElm = document.createElement("canvas");
	this.canvasElm.className = 'canvas';
	this.canvasElm.id = "layer_"+this.name;
	this.id = id;
	this.Attach = function(parent) {
		parent.appendChild(this.canvasElm);
		this.canvasElm.width = parent.offsetWidth;
		this.canvasElm.height = parent.offsetHeight;
	}
	this.Clear = function() {
		this.canvasElm.getContext("2d").clearRect(0, 0, this.canvasElm.width, this.canvasElm.height);
	}
}

Paint.Painter = function() {
	var layers = [];
	var current_layer = null;
	var canvas;
	var that = this;
	var selected_tool = "Brush";
	var current_tool = null;
	var socket;
	
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
	
	this.ProcessCommand = function(command, socket) {
		switch (command.cmd) {
			case 'new_layer':
				this.AddLayer(command.params);
				break;
			case 'tool': 
				var tool = new Paint.tools[command.name](command.data);
				tool.Render(layers[command.layerid]);
				
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
							that.ProcessCommand(msg[i], socket);
						}
						break;
					case 'command':
						that.ProcessCommand(msg, socket);
						break;
					default: 
						console.log("Unknown message", msgname, msg);
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

		temp_layer.Attach(containerElm);
		
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
		
		if ('ontouchstart' in window) {
			containerElm.addEventListener("touchstart", downEvent, false);
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
		layer.canvasElm.width = temp_layer.canvasElm.width;
		layer.canvasElm.height = temp_layer.canvasElm.height;
	}
	
	this.getTempLayer = function() {return temp_layer;};
}
