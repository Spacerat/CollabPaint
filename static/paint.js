//Console.log fix
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

//Classes
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
	var strokeStyle = data.strokeStyle || data.fgcol;
	
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
	this.size = Paint.ui.slider(1, 100, 20);
	this.shadow = Paint.ui.slider(0, 100, 0);
	this.elements = [
		Paint.ui.label("Size:", "strong")
		,this.size
		//,new Paint.ui.label("Shadow:", "strong")
		//,this.shadow
	];
	this.cursor = "crosshair";
};

Paint.tools.Line = function(data) {
	this.name = "Line";
	var pos = data.pos;
	var pos2 = data.pos2;
	var lineWidth = data.lineWidth || Paint.settings.Line.size.getValue();
	var strokeStyle = data.strokeStyle || data.fgcol;
	
	this.Render = function(layer) {
		var ctx = layer.canvasElm.getContext("2d");
		if (!(pos && pos2)) return;
		ctx.beginPath();
		ctx.moveTo(pos.x, pos.y);
		ctx.lineTo(pos2.x, pos2.y);
		ctx.closePath();
		ctx.lineCap = "butt";
		ctx.lineJoin = "miter";
		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = strokeStyle;
		ctx.stroke();
	}
	
	this.MouseMove = function(pos, layer) {
		if (!pos) return;
		pos2 = pos;
		layer.Clear();
		this.Render(layer);
	}
	
	this.getData = function() {
		return {
			pos: pos,
			pos2: pos2,
			lineWidth: lineWidth,
			strokeStyle: strokeStyle
		};
	}	
};
Paint.tools.Line.UI = function() {
	this.size = Paint.ui.slider(1, 100, 5);
	this.elements = [
		Paint.ui.label("Size:", "strong")
		,this.size
	];
	this.cursor = "crosshair";
};

function drawEllipse(ctx, x, y, w, h) {
  var kappa = .5522848;
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
}

Paint.tools.Shape = function(data) {
	this.name = "Shape";
	var pos = data.pos;
	var pos2 = data.pos2;
	var strokeWidth;
	
	if (data.strokeWidth !== undefined)
		strokeWidth = data.strokeWidth;
	else
		strokeWidth = Paint.settings.Shape.strokeWidth.getValue();
	var strokeStyle = data.strokeStyle || data.bgcol;
	var fillStyle = data.fillStyle || data.fgcol;
	var type = data.type || Paint.settings.Shape.Type.value;
	
	this.Render = function(layer) {
		var ctx = layer.canvasElm.getContext("2d");
		if (!(pos && pos2)) return;
		ctx.fillStyle = fillStyle;
		ctx.lineWidth = strokeWidth;
		ctx.strokeStyle = strokeStyle;
		switch (type) {
			case "Rectangle":

				ctx.fillRect(pos.x, pos.y,pos2.x-pos.x, pos2.y-pos.y);
				if (strokeWidth) ctx.strokeRect(pos.x, pos.y, pos2.x-pos.x, pos2.y-pos.y);
				break;
			case "Ellipse":
				drawEllipse(ctx, pos.x, pos.y, pos2.x-pos.x, pos2.y-pos.y);
				//ctx.save();
				//ctx.beginPath();
				//ctx.scale(1, (pos2.x - pos.x) / (pos2.y - pos.y));
				//ctx.arc((pos.x + pos2.x)/2, (pos.y + pos2.y)/2, Math.abs((pos2.x - pos.x)/2), 0, Math.PI * 2);
				//ctx.restore();
				ctx.fill();
				if (strokeWidth) ctx.stroke();
		}
	}
	
	this.MouseMove = function(pos, layer) {
		if (!pos) return;
		pos2 = pos;
		layer.Clear();
		this.Render(layer);
	}
	
	this.getData = function() {
		return {
			pos: pos,
			pos2: pos2,
			strokeWidth: strokeWidth,
			strokeStyle: strokeStyle,
			fillStyle: fillStyle,
			type: type
		};
	}	
	
}
Paint.tools.Shape.UI = function() {
	this.strokeWidth = Paint.ui.slider(0, 100, 5);
	this.Type = Paint.ui.Select(["Rectangle", "Ellipse"]);
	this.Mod = Paint.ui.slider(0,100,50);
	
	this.elements = [
		this.Type
		,Paint.ui.label("Outline size:", "strong")
		,this.strokeWidth
		
	];
}

Paint.ui.Select = function(items) {
	var elm = document.createElement("select");
	for (var i = 0;i<items.length;i++) {
		var opt = new Option(items[i], null);
		opt.value = items[i];
		elm.add(opt, null);
	}
	return elm;
}

Paint.ui.colourPicker = function(col, painter) {
	var elm = document.createElement('input');
	elm.style.width = "4em";
	var picker = new jscolor.color(elm, {});
	
	picker.fromString(col);
	elm.getArgb = function() {
		 var rgb = picker.rgb;
		 return "rgba("+(rgb[0]*255.0)+","+(rgb[1]*255.0)+","+(rgb[2]*255.0)+","+(Paint.settings.globals.opacity.getValue()/255.0)+")";	
	}
	
	picker.onShow = function() {
		var containerElm = document.getElementById("paint_canvas");
		var ctx = painter.getCurrentLayer().canvasElm.getContext("2d");
		var listener = function(evt) {
			if (evt.button === 2) {
				var pos = tools.getRelativeMousePos(evt, evt.target);
				pos.x += containerElm.scrollLeft;
				pos.y += containerElm.scrollTop;
				var data = ctx.getImageData(pos.x, pos.y, 1, 1).data;
				//TODO: this will cause problems with multiple layers.
				
				if (data[3] === 0) {
					picker.fromRGB(1, 1, 1);
					
				}
				else {
					picker.fromRGB(data[0]/255.0, data[1]/255.0, data[2]/255.0);
				}
			}
		}
		document.getElementById("layer_temp").addEventListener('mousedown', listener, false);
		picker.onHide = function() {
			document.getElementById("layer_temp").removeEventListener('mousedown', listener, false);
		}	
	}


	
	return elm;
	
}

Paint.ui.label = function(HTML, type) {
	type = type || "strong";
	var elm = document.createElement(type);
	elm.innerHTML = HTML;
	return elm;
}

Paint.ui.splitter = function() {
	var elm = document.createElement("span");
	elm.className = 'splitter';
	return elm;
}

Paint.ui.slider = function(min, max, value) {
	var elm = document.createElement("input");
	elm.type = "range";
	elm.min = min;
	elm.max = max || 100;
	elm.value = value;
	elm.getValue = function() {
		if (elm.value !== undefined) {
			return Math.max(elm.min,Math.min(parseInt(elm.value,10),elm.max));
		}
	}
	return elm;
}

Paint.Toolbar = function(div_id, painter) {
	var divElm = document.getElementById(div_id);
	var fileElm = document.createElement("span");
	var toolsElm = document.createElement("select");
	var settingsElm = document.createElement("span");
	var toolSettingsElm = document.createElement("span");

	//Add the sections
	divElm.appendChild(fileElm);
	divElm.appendChild(Paint.ui.splitter());
	divElm.appendChild(toolsElm);
	divElm.appendChild(Paint.ui.splitter());
	divElm.appendChild(settingsElm);
	divElm.appendChild(Paint.ui.splitter())
	divElm.appendChild(toolSettingsElm);
	
	//Set up the 'file menu'
	(function() {
		var save = document.createElement("button");
		save.innerHTML = '<img src="/disk.png" alt="" /><span>Save</span>';
		save.onclick = function() {
			painter.Save();
		}
		fileElm.appendChild(save);
	})();
	
	//Set up the tool menu section
	for (var b in Paint.tools) {
		toolsElm.add(new Option(b),null);
	}
	toolsElm.onchange = function(evt){
		painter.setTool(this.value);
	}

	//Set up the global tools section
	var fgpicker = Paint.ui.colourPicker("#00F", painter);
	Paint.settings.globals.fgcolour = fgpicker;
	settingsElm.appendChild(fgpicker);

	var bgpicker = Paint.ui.colourPicker("#FFF", painter);
	Paint.settings.globals.bgcolour = bgpicker;
	settingsElm.appendChild(bgpicker);
	
	settingsElm.appendChild(Paint.ui.label("Opacity: "));
	Paint.settings.globals.opacity = Paint.ui.slider(0, 255, 255);
	settingsElm.appendChild(Paint.settings.globals.opacity);

	
	//Set up the tool-specific-options section
	this.setTool = function(toolname) {
		toolsElm.value = toolname;
		toolSettingsElm.innerHTML = "";
		if (!Paint.settings[toolname]) {
			Paint.settings[toolname] = new Paint.tools[toolname].UI();
		}
		if (Paint.settings[toolname].elements) {
			for (var i = 0;i<Paint.settings[toolname].elements.length;i++) {
				toolSettingsElm.appendChild(Paint.settings[toolname].elements[i]);
			}
		}
		painter.setCursor(Paint.settings[toolname].cursor || "auto");
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
		//this.canvasElm.width = parent.offsetWidth;
		//this.canvasElm.height = parent.offsetHeight;
	}
	this.Clear = function() {
		this.canvasElm.getContext("2d").clearRect(0, 0, this.canvasElm.width, this.canvasElm.height);
	}
	this.addHistory = function(command) {
		history.push(command);
	}
	
	this.Resize = function(w, h, painter) {
		this.canvasElm.width = w;
		this.canvasElm.height = h;
		if (painter) this.RenderHistory(painter);
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

	var MozillaFix = function() {
		$('#chat').height($('#chatcont').height());
		if ($.browser.mozilla) {
			$('#chat').width(Math.max(document.body.clientWidth - $('#rightgrabber').position().left - 13,50));
		}
	}
	
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
	};
	
	this.SetupChat = function() {
		$('#chatform').submit(function() {
			var txt = $('#chatinput').val();
			$('#chatinput').val("");
			if (!txt) return false;
			socket.send({chat: txt});
			return false;
		});
		
		var dragging = false;
		var dragoffset = 0;

		window.addEventListener('mousemove', function(evt) {
			if (dragging) {
				$('#rightpanel').width(document.body.clientWidth - evt.pageX - 13 + dragoffset );
				MozillaFix();
			}
		}, false);
		window.addEventListener('mouseup', function(evt) {
			dragging = false;
		}, false);
		$('#rightgrabber').mousedown(function(evt) {
			var pos = tools.getRelativeMousePos(evt, document.getElementById("rightpanel"));
			dragging = true;
			dragoffset = pos.x;
		});;
		if ($.browser.mozilla) {
			this.ProcessChat({
				sender: {name: "Joseph Atkins-Turkish"},
				text: "<span style='color: #800;'>Firefox user: I just thought I'd let you know how much effort I put in to making this stupid chat box usable for your browser. That is all.<span>"
			});
		}
		$(window).resize(function(evt){
			MozillaFix();
		});
		
		var usc = $("#usercount");
		var usrs = $('#users')
		usrs.toggle();
		usc.mouseover(function(evt) {

			usrs.toggle('fast');
		});
		usc.mousemove(function(evt) {
			var pos = usc.position();
			//pos.top += usc.height();
			usrs.offset(pos);
		});
		usrs.mouseleave(function(evt) {
			usrs.toggle('fast');
		});
	};

	
	this.ProcessChat = function(msg) {
		var elm = document.getElementById("chat");
		var doscroll = (elm.scrollTop === elm.scrollHeight);
		
		$('#chat').append(function() {
			var txt = msg.text;
			if (msg.sender) {
				return '<span class="chatname">'+msg.sender.name+":</span> " + txt + "<br/>";
			}
			else {
				return txt +"<br/>";
			}
		});
		MozillaFix();
		elm.scrollTop = elm.scrollHeight;
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
						alert("You have been rejected from the room: "+msg.reason);
						break;
					case 'member_count':
						//God damn you singular/plural.
						if (msg === 1) {
							$("#usercount").html(msg + " user&nbsp;");
						}
						else {
							$("#usercount").html(msg + " users");
						}
						break;
					case 'accept_join':
						$('#yourname').text("Your name: "+msg.info.name);
						break;
					case 'chat':
						that.ProcessChat(msg);
						break;
					case 'chathistory':
						for (var i = 0;i < msg.length; i++) {
							that.ProcessChat(msg[i]);
						}
						break;
					case 'name_change':
						if (msg.you === true) {
							$('#yourname').text("Your name: "+msg.client.name);
						}
						break;
					//TODO: handle these somehow?
					case 'new_room':
						break;
					case 'members':
						var html="<ul>";
						for (var i = 0;i < msg.length;i++) {
							html+='<li>'+msg[i].name+'</li>';
						}
						html+="</ul>"
						$('#users').html(html);
						break;
			
					case 'new_member':
						break;
					default: 
						console.log("Unknown message", msgname, msg);
						break;
				}
			}
		});
	};
	
	this.MouseDown = function(pos, button) {
		if (!current_tool && button !== 1) {
			var fgcol, bgcol, tcol;
			fgcol = Paint.settings.globals.fgcolour.getArgb();
			bgcol = Paint.settings.globals.bgcolour.getArgb();
			if (button === 2) {
				tcol = fgcol;
				fgcol = bgcol;
				bgcol = tcol;
			}
			current_tool = new Paint.tools[selected_tool]({pos: pos, fgcol: fgcol, bgcol: bgcol});
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
	
	this.getCurrentLayer = function() {return current_layer;};
	
	this.getSelectedTool = function() {
		return selected_tool;
	}
	
	this.setTool = function(toolname) {
		selected_tool = toolname;
		toolbar.setTool(toolname);
	}
	
	this.setCursor = function(curs) {
		canvas.getTempLayer().canvasElm.style.cursor = curs;
	}
	
	this.Save = function() {
		//TODO: Save all layers.
		window.open(current_layer.canvasElm.toDataURL());
	}
}

Paint.Canvas = function(object_id, painter) {
	var containerElm;
	var layersElm;
	var temp_layer = new Paint.Layer({name: "temp"});
	var that = this;
	var w = 1680;
	var h = 1050;
	
	this.Init = function() {
		containerElm = document.getElementById(object_id);
		layersElm = document.createElement("div");
		layersElm.id = 'layers';
		containerElm.appendChild(layersElm);
		temp_layer.Attach(layersElm);
		temp_layer.Resize(w, h);
		//containerElm.style.height = (window.innerHeight-tools.findAbsolutePosition(containerElm).y)+"px";
		var downEvent = function(evt) {
			//evt.preventDefault();
			var pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
			pos.x += containerElm.scrollLeft;
			pos.y += containerElm.scrollTop;
			painter.MouseDown(pos, evt.button);
		};
		var moveEvent = function(evt) {
			//evt.preventDefault();
			var pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
			pos.x += containerElm.scrollLeft;
			pos.y += containerElm.scrollTop;
			painter.MouseMove(pos);
			
		};
		var upEvent = function(evt) {
			//evt.preventDefault();
			var pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
			pos.x += containerElm.scrollLeft;
			pos.y += containerElm.scrollTop;
			painter.MouseUp(pos);
		};
		temp_layer.canvasElm.oncontextmenu = function() {return false;};
		var resizetimer;
		window.onresize = function(evt) {
			/*
			containerElm.style.height = (window.innerHeight-tools.findAbsolutePosition(containerElm).y)+"px";
			
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
			*/
		}
		if ('ontouchstart' in window) {
			document.addEventListener("touchstart", downEvent, false);
			document.body.addEventListener('touchmove',moveEvent , false);
			document.body.addEventListener('touchend', upEvent, false);
		}
		else {
			temp_layer.canvasElm.addEventListener('mousedown', downEvent, false);
			window.addEventListener('mousemove',moveEvent , false);
			window.addEventListener('mouseup', upEvent, false);
		}

	}
	
	this.AddLayer = function(layer) {
		layersElm.appendChild(layer.canvasElm);
		layer.Resize(w, h);
		layer.Clear();
		layersElm.removeChild(temp_layer.canvasElm);
		temp_layer.Attach(layersElm);
	}
	
	this.getTempLayer = function() {return temp_layer;};
}
