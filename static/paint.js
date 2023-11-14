//Namespaces
Paint = {
  tools: {},
  ui: {},
  settings: {
    globals: {},
  },
};

Paint.tools.Brush = function (data) {
  var points = data.points;
  var pos = data.pos;
  this.name = "Brush";

  if (points == null && pos == null) {
    throw "Error";
  } else if (points == null) {
    points = [];
    points.push(pos);
  } else {
    pos = points[0];
  }
  var lineWidth = data.lineWidth || Paint.settings.Brush.size.getValue();
  var strokeStyle = data.strokeStyle || data.fgcol;

  this.Render = function (layer) {
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
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.moveTo(points[0].x, points[0].y);
    ctx.closePath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  };

  this.MouseMove = function (pos, layer) {
    points.push(pos);
    layer.Clear();
    this.Render(layer);
  };

  this.MouseUp = function () {};

  this.getData = function () {
    return {
      pos: pos,
      lineWidth: lineWidth,
      strokeStyle: strokeStyle,
      points: points,
    };
  };
};
Paint.tools.Brush.UI = function () {
  this.size = Paint.ui.slider(1, 100, 20);
  this.shadow = Paint.ui.slider(0, 100, 0);
  this.elements = [
    Paint.ui.label("Size:", "strong"),
    this.size,
    //,new Paint.ui.label("Shadow:", "strong")
    //,this.shadow
  ];
  this.cursor = "crosshair";
};

Paint.tools.Eraser = function (data) {
  var points = data.points;
  var pos = data.pos;
  this.name = "Eraser";

  var alpha;
  if (data.alpha !== undefined) {
    alpha = data.alpha;
  } else {
    alpha = Paint.settings.globals.opacity.getValue() / 255.0;
  }
  if (points == null && pos == null) {
    throw "Error";
  } else if (points == null) {
    points = [];
    points.push(pos);
  } else {
    pos = points[0];
  }
  var lineWidth = data.lineWidth || Paint.settings.Eraser.size.getValue();

  this.Render = function (layer) {
    var ctx = layer.canvasElm.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.moveTo(points[0].x, points[0].y);
    ctx.closePath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth;
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0, 0, 0, 255)";
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  };

  this.MouseMove = function (pos, layer) {
    points.push(pos);
    layer.Clear();
    this.Render(layer);
  };

  this.MouseUp = function () {};

  this.getData = function () {
    return {
      pos: pos,
      lineWidth: lineWidth,
      points: points,
      alpha: alpha,
    };
  };
};
Paint.tools.Eraser.UI = function () {
  this.size = Paint.ui.slider(1, 100, 20);
  this.elements = [Paint.ui.label("Size:", "strong"), this.size];
  this.cursor = "crosshair";
};

Paint.tools.Line = function (data) {
  this.name = "Line";
  var pos = data.pos;
  var pos2 = data.pos2;
  var lineWidth = data.lineWidth || Paint.settings.Line.size.getValue();
  var strokeStyle = data.strokeStyle || data.fgcol;

  this.Render = function (layer) {
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
  };

  this.MouseMove = function (pos, layer) {
    if (!pos) return;
    pos2 = pos;
    layer.Clear();
    this.Render(layer);
  };

  this.getData = function () {
    return {
      pos: pos,
      pos2: pos2,
      lineWidth: lineWidth,
      strokeStyle: strokeStyle,
    };
  };
};
Paint.tools.Line.UI = function () {
  this.size = Paint.ui.slider(1, 100, 5);
  this.elements = [Paint.ui.label("Size:", "strong"), this.size];
  this.cursor = "crosshair";
};

//Classes
Paint.tools.Pointer = function () {};
Paint.tools.Pointer.UI = function () {
  this.elements = [];
  this.cursor = "auto";
};

/*
Paint.tools.Tube = function(data) {
	var points = data.points;
	var pos = data.pos;
	this.name = "Tube";
	
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
	var size = data.size || Paint.settings.Tube.size.getValue();
	var fill1 = data.fill1 || data.fgcol;
	var fill2 = data.fill2 || data.bgcol;
	var shrink;
	if (data.shrink !== undefined) shrink = data.shrink; else Paint.settings.Tube.shrink.getValue();
	
	this.Render = function(layer) {
		var ctx = layer.canvasElm.getContext("2d");

		var k = 0;
		var r = size;
		for (var i = 0; i < points.length; i++) {
			ctx.beginPath();
			ctx.arc(points[i].x, points[i].y, r, 0, Math.PI * 2);		
			r -= (shrink / 50.0);
			if (k === 0) {
				ctx.fillStyle = fill1;
			}
			else {
				ctx.fillStyle = fill2;
			}
			ctx.closePath();			
			ctx.fill();
			
			k = 1 - k;
		}

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
			fill1: fill1,
			fill2: fill2,
			shrink: shrink,
			size: size,
			points: points
		};
	}
}
Paint.tools.Tube.UI = function() {
	this.size = Paint.ui.slider(1, 100, 20);
	this.shrink = Paint.ui.slider(0, 100, 0);
	this.elements = [
		Paint.ui.label("Size:", "strong")
		,this.size
		,Paint.ui.label("Shrink:", "strong")
		,this.shrink
	];
	this.cursor = "crosshair";
};
*/

function drawEllipse(ctx, x, y, w, h) {
  var kappa = 0.5522848;
  var ox = (w / 2) * kappa; // control point offset horizontal
  var oy = (h / 2) * kappa; // control point offset vertical
  var xe = x + w; // x-end
  var ye = y + h; // y-end
  var xm = x + w / 2; // x-middle
  var ym = y + h / 2; // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
}

Paint.tools.Shape = function (data) {
  this.name = "Shape";
  var pos = data.pos;
  var pos2 = data.pos2;
  var strokeWidth;

  if (data.strokeWidth !== undefined) strokeWidth = data.strokeWidth;
  else strokeWidth = Paint.settings.Shape.strokeWidth.getValue();
  var strokeStyle = data.strokeStyle || data.bgcol;
  var fillStyle = data.fillStyle || data.fgcol;
  var type = data.type || Paint.settings.Shape.Type.value;

  this.Render = function (layer) {
    var ctx = layer.canvasElm.getContext("2d");
    if (!(pos && pos2)) return;
    ctx.fillStyle = fillStyle;
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeStyle;
    switch (type) {
      case "Rectangle":
        ctx.fillRect(pos.x, pos.y, pos2.x - pos.x, pos2.y - pos.y);
        if (strokeWidth)
          ctx.strokeRect(pos.x, pos.y, pos2.x - pos.x, pos2.y - pos.y);
        break;
      case "Ellipse":
        drawEllipse(ctx, pos.x, pos.y, pos2.x - pos.x, pos2.y - pos.y);
        ctx.fill();
        if (strokeWidth) ctx.stroke();
    }
  };

  this.MouseMove = function (pos, layer) {
    if (!pos) return;
    pos2 = pos;
    layer.Clear();
    this.Render(layer);
  };

  this.getData = function () {
    return {
      pos: pos,
      pos2: pos2,
      strokeWidth: strokeWidth,
      strokeStyle: strokeStyle,
      fillStyle: fillStyle,
      type: type,
    };
  };
};
Paint.tools.Shape.UI = function () {
  this.strokeWidth = Paint.ui.slider(0, 100, 5);
  this.Type = Paint.ui.Select(["Rectangle", "Ellipse"]);
  this.Mod = Paint.ui.slider(0, 100, 50);

  this.elements = [
    this.Type,
    Paint.ui.label("Outline size:", "strong"),
    this.strokeWidth,
  ];
};

Paint.ui.Select = function (items) {
  var elm = document.createElement("select");
  for (var i = 0; i < items.length; i++) {
    var opt = new Option(items[i], null);
    opt.value = items[i];
    elm.add(opt, null);
  }
  return elm;
};

Paint.ui.colourPicker = function (col, painter) {
  var elm = document.createElement("input");
  elm.style.width = "4em";
  var picker = new jscolor.color(elm, {});

  picker.fromString(col);
  elm.getArgb = function () {
    var rgb = picker.rgb;
    var alpha = Paint.settings.globals.opacity.getValue() / 255.0;
    const r = rgb[0] * 255.0;
    const g = rgb[1] * 255.0;
    const b = rgb[2] * 255.0;
    return `rgba(${r},${g},${b},${alpha})`;
  };

  picker.onShow = function () {
    var containerElm = document.getElementById("paint_canvas");
    var ctx = painter.getCurrentLayer().canvasElm.getContext("2d");
    var listener = function (evt) {
      if (evt.button === 2) {
        var pos = tools.getRelativeMousePos(evt, evt.target);
        pos.x += containerElm.scrollLeft;
        pos.y += containerElm.scrollTop;
        var data = ctx.getImageData(pos.x, pos.y, 1, 1).data;
        //TODO: this will cause problems with multiple layers.

        if (data[3] === 0) {
          picker.fromRGB(1, 1, 1);
        } else {
          picker.fromRGB(data[0] / 255.0, data[1] / 255.0, data[2] / 255.0);
        }
      }
    };
    document
      .getElementById("layer_temp")
      .addEventListener("mousedown", listener, false);
    picker.onHide = function () {
      document
        .getElementById("layer_temp")
        .removeEventListener("mousedown", listener, false);
    };
  };

  return elm;
};

Paint.ui.label = function (HTML, type) {
  type = type || "strong";
  var elm = document.createElement(type);
  elm.innerHTML = HTML;
  return elm;
};

Paint.ui.splitter = function () {
  var elm = document.createElement("span");
  elm.className = "splitter";
  return elm;
};

Paint.ui.slider = function (min, max, value) {
  var elm = document.createElement("input");
  try {
    elm.type = "range";
    elm.min = min;
    elm.max = max || 100;
  } catch (e) {}
  elm.value = value;
  elm.getValue = function () {
    if (elm.value !== undefined) {
      return Math.max(elm.min, Math.min(parseInt(elm.value, 10), elm.max));
    }
  };
  return elm;
};

Paint.Toolbar = function (div_id, painter) {
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
  divElm.appendChild(Paint.ui.splitter());
  divElm.appendChild(toolSettingsElm);

  //Set up the 'file menu'
  (function () {
    var save = document.createElement("button");
    save.innerHTML = '<img src="/disk.png" alt="" /><span>Save</span>';
    save.onclick = function () {
      painter.Save();
    };
    fileElm.appendChild(save);
  })();

  //Set up the tool menu section
  for (var b in Paint.tools) {
    toolsElm.add(new Option(b), null);
  }
  toolsElm.onchange = function (evt) {
    painter.setTool(this.value);
  };

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
  this.setTool = function (toolname) {
    toolsElm.value = toolname;
    toolSettingsElm.innerHTML = "";
    if (!Paint.settings[toolname]) {
      Paint.settings[toolname] = new Paint.tools[toolname].UI();
    }
    if (Paint.settings[toolname].elements) {
      for (var i = 0; i < Paint.settings[toolname].elements.length; i++) {
        toolSettingsElm.appendChild(Paint.settings[toolname].elements[i]);
      }
    }
    painter.setCursor(Paint.settings[toolname].cursor || "auto");
  };
};

Paint.Layer = function (opts, id) {
  if (!opts) opts = {};
  this.name = opts.name || "New layer";
  this.canvasElm = document.createElement("canvas");
  this.canvasElm.className = "canvas";
  this.canvasElm.id = "layer_" + this.name;
  this.id = id;
  var history = [];
  this.Attach = function (parent) {
    parent.appendChild(this.canvasElm);
    //this.canvasElm.width = parent.offsetWidth;
    //this.canvasElm.height = parent.offsetHeight;
  };
  this.Clear = function () {
    this.canvasElm
      .getContext("2d")
      .clearRect(0, 0, this.canvasElm.width, this.canvasElm.height);
  };
  this.addHistory = function (command) {
    history.push(command);
  };

  this.Resize = function (w, h, painter) {
    this.canvasElm.width = w;
    this.canvasElm.height = h;
    if (painter) this.RenderHistory(painter);
  };

  this.RenderHistory = function (painter) {
    for (var i = 0; i < history.length; i++) {
      painter.ProcessCommand(history[i]);
    }
  };
};

Paint.Painter = function () {
  var layers = [];
  var current_layer = null;
  var canvas;
  var that = this;
  var selected_tool = "";
  var current_tool = null;
  var socket;
  var toolbar = null;
  var last_sent_id;
  var images = {};

  var ChatFix = function () {
    $("#chatcont").height(
      $("#rightpanel").height() -
        $("#panelhead").height() -
        $("#chatform").height() -
        10
    );
    $("#chat").height($("#chatcont").height());
  };

  this.AddLayer = function (opts) {
    if (!opts) opts = {};
    if (!opts.name) opts.name = "Layer_" + (layers.length + 1);
    var l = new Paint.Layer(opts, layers.length);
    layers.push(l);
    canvas.AddLayer(l);
    if (layers.length === 1) {
      current_layer = l;
    }
  };

  this.CreateCanvas = function (object_id) {
    canvas = new Paint.Canvas(object_id, this);
    canvas.Init();
  };

  this.CreateToolbar = function (object_id) {
    toolbar = new Paint.Toolbar(object_id, this);
  };

  this.SetupChat = function () {
    $("#chatform").submit(function () {
      var txt = $("#chatinput").val();
      $("#chatinput").val("");
      if (!txt) return false;
      socket.send({ chat: txt });
      return false;
    });

    var dragging = false;
    var dragoffset = 0;

    window.addEventListener(
      "mousemove",
      function (evt) {
        if (dragging) {
          $("#rightpanel").width(
            document.body.clientWidth - evt.pageX - 13 + dragoffset
          );
          ChatFix();
        }
      },
      false
    );
    window.addEventListener(
      "mouseup",
      function (evt) {
        dragging = false;
      },
      false
    );
    $("#rightgrabber").mousedown(function (evt) {
      var pos = tools.getRelativeMousePos(
        evt,
        document.getElementById("rightpanel")
      );
      dragging = true;
      dragoffset = pos.x;
    });
    $(window).resize(function (evt) {
      ChatFix();
    });

    var usc = $("#usercount");
    var usrs = $("#users");
    usrs.toggle();
    usc.mouseover(function (evt) {
      usrs.toggle("fast");
    });
    usc.mousemove(function (evt) {
      var pos = usc.position();
      //pos.top += usc.height();
      usrs.offset(pos);
    });
    usrs.mouseleave(function (evt) {
      usrs.toggle("fast");
    });
  };

  this.ProcessChat = function (msg) {
    var elm = document.getElementById("chat");
    var doscroll = elm.scrollTop === elm.scrollHeight;

    $("#chat").append(function () {
      var txt = msg.text;
      if (msg.sender) {
        return (
          '<span class="chatname">' +
          msg.sender.name +
          ":</span> " +
          txt +
          "<br/>"
        );
      } else {
        return txt + "<br/>";
      }
    });
    ChatFix();
    elm.scrollTop = elm.scrollHeight;
  };

  this.ProcessCommand = function (command, is_new, socket) {
    switch (command.cmd) {
      case "new_layer":
        this.AddLayer(command.params);
        break;
      case "tool":
        var tool = new Paint.tools[command.name](command.data);
        tool.Render(layers[command.layerid]);
        if (is_new) {
          layers[command.layerid].addHistory(command);
        }
        if (command.rnd_id === last_sent_id) {
          last_sent_id = 0;
          canvas.getTempLayer().Clear();
        }
        break;
      case "image":
        var canv = layers[command.layerid];
        if (is_new) {
          layers[command.layerid].addHistory(command);
        }
        if (images[command.key] !== undefined) {
          if (images[command.key].complete) {
            var ctx = canv.canvasElm.getContext("2d");
            ctx.drawImage(images[command.key], command.pos.x, command.pos.y);
          }
        } else {
          var n = new Image();
          n.src = command.url;
          images[command.key] = n;
          n.onload = function () {
            canv.Clear();
            canv.RenderHistory(that);
          };
        }
        break;
      default:
        console.log("Unknown command", command);
    }
  };

  this.Connect = function (roomname) {
    this.room_name = roomname;
    socket = new io();
    socket.connect();
    socket.on("connect", function () {
      socket.send({
        connect: {
          room: roomname,
        },
      });
    });
    socket.on("message", function (data) {
      //Process network messages
      for (var msgname in data) {
        var msg = data[msgname];
        switch (msgname) {
          case "history":
            for (var i = 0; i < msg.length; i++) {
              that.ProcessCommand(msg[i], true, socket);
            }
            break;
          case "command":
            that.ProcessCommand(msg, true, socket);
            break;
          case "reject":
            alert("You have been rejected from the room: " + msg.reason);
            break;
          case "member_count":
            //God damn you singular/plural.
            if (msg === 1) {
              $("#usercount").html(msg + " user&nbsp;");
            } else {
              $("#usercount").html(msg + " users");
            }
            break;
          case "accept_join":
            $("#yourname").text("Your name: " + msg.info.name);
            break;
          case "chat":
            that.ProcessChat(msg);
            break;
          case "chathistory":
            for (var i = 0; i < msg.length; i++) {
              that.ProcessChat(msg[i]);
            }
            break;
          case "name_change":
            if (msg.you === true) {
              $("#yourname").text("Your name: " + msg.client.name);
            }
            break;
          //TODO: handle these somehow?
          case "new_room":
            break;
          case "members":
            var html = "<ul>";
            for (var i = 0; i < msg.length; i++) {
              html += "<li>" + msg[i].name + "</li>";
            }
            html += "</ul>";
            $("#users").html(html);
            break;

          case "new_member":
            break;
          default:
            console.log("Unknown message", msgname, msg);
            break;
        }
      }
    });
  };

  this.MouseDown = function (pos, button) {
    if (!current_tool && button !== 1) {
      var fgcol, bgcol, tcol;
      fgcol = Paint.settings.globals.fgcolour.getArgb();
      bgcol = Paint.settings.globals.bgcolour.getArgb();
      if (button === 2) {
        tcol = fgcol;
        fgcol = bgcol;
        bgcol = tcol;
      }
      current_tool = new Paint.tools[selected_tool]({
        pos: pos,
        fgcol: fgcol,
        bgcol: bgcol,
      });
    }
  };

  this.MouseMove = function (pos) {
    if (current_tool) {
      if (current_tool.MouseMove)
        current_tool.MouseMove(pos, canvas.getTempLayer());
    }
  };

  this.MouseUp = function (pos) {
    if (current_tool) {
      if (current_tool.MouseDown) current_tool.MouseUp(pos);
      if (current_tool.getData) {
        if (socket) {
          last_sent_id = tools.randRangeInt(1, 1000);
          socket.send({
            command: {
              cmd: "tool",
              name: current_tool.name,
              data: current_tool.getData(),
              layerid: current_layer.id,
              rnd_id: last_sent_id,
            },
          });
        }
      }
      current_tool = null;
    }
  };

  this.sendImageDrop = function (key, pos) {
    if (socket) {
      last_sent_id = tools.randRangeInt(1, 1000);
      socket.send({
        command: {
          cmd: "image",
          key: key,
          pos: pos,
          layerid: current_layer.id,
          rnd_id: last_sent_id,
        },
      });
    }
  };

  this.addImage = function (key, image) {
    images[key] = image;
  };

  this.getLayers = function () {
    return layers;
  };

  this.getCurrentLayer = function () {
    return current_layer;
  };

  this.getSelectedTool = function () {
    return selected_tool;
  };

  this.setTool = function (toolname) {
    selected_tool = toolname;
    toolbar.setTool(toolname);
  };

  this.setCursor = function (curs) {
    canvas.getTempLayer().canvasElm.style.cursor = curs;
  };

  this.Save = function () {
    //TODO: Save all layers.
    window.open(current_layer.canvasElm.toDataURL());
  };
};

Paint.ProgressBar = function (parent) {
  if (!parent) parent = document.body;
  var progbox = document.createElement("div");
  var progress = document.createElement("div");
  progbox.className = "progbox";
  progress.className = "progress";
  progbox.appendChild(progress);
  parent.appendChild(progbox);

  var pos = 0;
  var m = setInterval(function () {
    pos += 1;
    progress.style.backgroundPosition = pos + "px 0px";
  }, 50);

  this.setPercentage = function (p) {
    /*
		$(progress).animate({
			width: p+"%"
		}, 300);
		*/
    progress.style.width = p + "%";
  };
  this.setPercentage(0);

  this.setAbsolutePos = function (x, y) {
    progbox.style.position = "absolute";
    progbox.style.left = x + "px";
    progbox.style.top = y + "px";
    progbox.style.zIndex = "100";
  };
  this.setRelativePos = function (x, y) {
    progbox.style.position = "relative";
    progbox.style.left = x - progbox.offsetLeft + "px";
    progbox.style.top = y - progbox.offsetTop + "px";
    progbox.style.zIndex = "100";
  };
  this.Remove = function () {
    parent.removeChild(progbox);
    clearInterval(m);
  };
};

Paint.Canvas = function (object_id, painter) {
  var containerElm;
  var layersElm;
  var temp_layer = new Paint.Layer({ name: "temp" });
  var w = 1680;
  var h = 1050;

  this.Init = function () {
    containerElm = document.getElementById(object_id);
    layersElm = document.createElement("div");
    layersElm.id = "layers";
    containerElm.appendChild(layersElm);
    temp_layer.Attach(layersElm);
    temp_layer.Resize(w, h);
    var downEvent = function (evt) {
      //evt.preventDefault();
      var pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
      pos.x += containerElm.scrollLeft;
      pos.y += containerElm.scrollTop;
      painter.MouseDown(pos, evt.button);
    };
    var moveEvent = function (evt) {
      //evt.preventDefault();
      var pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
      pos.x += containerElm.scrollLeft;
      pos.y += containerElm.scrollTop;
      painter.MouseMove(pos);
    };
    var upEvent = function (evt) {
      //evt.preventDefault();
      var pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
      pos.x += containerElm.scrollLeft;
      pos.y += containerElm.scrollTop;
      painter.MouseUp(pos);
    };
    temp_layer.canvasElm.oncontextmenu = function () {
      if (painter.getSelectedTool() !== "Pointer") {
        return false;
      }
    };

    var resfunc = function () {
      containerElm.style.height =
        window.innerHeight - $(containerElm).offset().top + "px";
    };
    resfunc();
    $(window).resize(resfunc);
    $("#vertical_stretch").resize(resfunc);

    var tevent = function (func, preventdefault) {
      return function (evt) {
        if (preventdefault) evt.preventDefault();
        func(evt.touches[0]);
      };
    };
    temp_layer.canvasElm.addEventListener(
      "touchstart",
      tevent(downEvent, true),
      false
    );
    temp_layer.canvasElm.addEventListener(
      "touchmove",
      tevent(moveEvent, true),
      false
    );
    temp_layer.canvasElm.addEventListener("touchend", upEvent, false);

    temp_layer.canvasElm.addEventListener("mousedown", downEvent, false);
    window.addEventListener("mousemove", moveEvent, false);
    window.addEventListener("mouseup", upEvent, false);

    //Drag/drop file upload

    containerElm.addEventListener(
      "dragstart",
      function (evt) {
        console.log(evt);
        evt.stopPropagation();
        evt.preventDefault();
        return false;
      },
      false
    );
    containerElm.addEventListener(
      "dragover",
      function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = "copy";
        $(temp_layer.canvasElm).css("background", "#BBB").css("opacity", "0.5");
        temp_layer.Clear();
        var ctx = temp_layer.canvasElm.getContext("2d");
        var pa = ctx.globalAlpha;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black";
        ctx.font = "20pt Arial";
        ctx.fillText("Drop to upload", evt.layerX + 10, evt.layerY + 30);
        ctx.beginPath();
        ctx.moveTo(evt.layerX, evt.layerY);
        ctx.lineTo(evt.layerX + 200, evt.layerY);
        ctx.moveTo(evt.layerX, evt.layerY);
        ctx.lineTo(evt.layerX, evt.layerY + 200);
        ctx.closePath();
        ctx.stroke();

        ctx.globalAlpha = pa;
        return false;
      },
      false
    );
    var dragend = function (evt) {
      $(temp_layer.canvasElm).css("background", "none");
    };
    containerElm.addEventListener("dragend", dragend, false);
    containerElm.addEventListener("dragleave", dragend, false);

    var keycache = {};
    containerElm.addEventListener(
      "drop",
      function (evt) {
        temp_layer.Clear();
        evt.stopPropagation();
        evt.preventDefault();

        var pos = {
          x: evt.layerX,
          y: evt.layerY,
        };

        var file = evt.dataTransfer.files[0];
        if (file.fileSize > 1048576) {
          alert("File too large. Image uploads are limited to 1 MB.");
          return;
        }
        if (file.type.indexOf("image/") !== 0) {
          alert("Only images are supported.");
          return;
        }

        var loadedimage = null;
        var loadedkey = null;
        var computedhash = null;

        var cacheClientImage = function () {
          if (loadedkey && loadedimage && computedhash) {
            painter.addImage(loadedkey, loadedimage);
            keycache[computedhash] = loadedkey;
          }
        };

        var reader = new FileReader();
        var breader = new FileReader();
        if (reader) {
          reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
              loadedimage = img;
              cacheClientImage();
            };
            img.src = e.target.result;
          };
          breader.onload = function (e) {
            computedhash = b64_md5(e.target.result);
            if (keycache[computedhash] === undefined) {
              var xhr = new XMLHttpRequest();
              var up = xhr.upload;
              var uploadbar = new Paint.ProgressBar(containerElm);
              xhr.onload = function (xevt) {
                var obj = JSON.parse(xhr.responseText);
                loadedkey = obj.key;
                cacheClientImage();
                painter.sendImageDrop(obj.key, pos);
                uploadbar.Remove();
              };
              up.onprogress = function (pevt) {
                uploadbar.setPercentage((100 * pevt.loaded) / pevt.total);
              };
              xhr.open("post", painter.room_name + "/upload", true);
              xhr.setRequestHeader("X-File-Size", file.fileSize);
              xhr.setRequestHeader("X-File-Name", file.fileName);
              xhr.send(file);

              uploadbar.setRelativePos(pos.x, pos.y + 20);
            } else {
              painter.sendImageDrop(keycache[computedhash], pos);
            }
          };
          reader.readAsDataURL(file);
          breader.readAsBinaryString(file);
        }

        dragend();
        return false;
      },
      false
    );
  };

  this.AddLayer = function (layer) {
    layersElm.appendChild(layer.canvasElm);
    layer.Resize(w, h);
    layer.Clear();
    layersElm.removeChild(temp_layer.canvasElm);
    temp_layer.Attach(layersElm);
  };

  this.getTempLayer = function () {
    return temp_layer;
  };
};
