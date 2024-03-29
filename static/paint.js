//Namespaces
Paint = {
  tools: {},
  ui: {},
  settings: {
    globals: {},
  },
};

Paint.tools.Brush = function (data) {
  let points = data.points;
  let pos = data.pos;
  this.name = "Brush";

  if (points == null && pos == null) {
    throw new Error("Error");
  } else if (points == null) {
    points = [];
    points.push(pos);
  } else {
    pos = points[0];
  }
  const lineWidth = data.lineWidth || Paint.settings.Brush.size.getValue();
  const strokeStyle = data.strokeStyle || data.fgcol;

  this.Render = function (layer) {
    const ctx = layer.canvasElm.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    /*
		for (const i = 1; i < points.length; i+=2) {
			//ctx.moveTo(cx, cy);
			
			cx = cx + points[i-1].x;
			cy = cy + points[i-1].y;			
			
			const ctrlx = cx;
			const ctrly = cy;
			
			ctx.quadraticCurveTo(ctrlx, ctrly, cx + points[i].x, cy + points[i].y);
			cx = cx + points[i].x;
			cy = cy + points[i].y;
			
		}
		*/

    for (let i = 1; i < points.length; i++) {
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

Paint.tools.Brush.icon = "🖌";
Paint.tools.Brush.UI = function () {
  this.size = Paint.ui.slider(1, 100, 20);
  this.shadow = Paint.ui.slider(0, 100, 0);
  this.elements = [
    Paint.ui.labelled(Paint.ui.label("Size:", "strong"), this.size),
    //,new Paint.ui.label("Shadow:", "strong")
    //,this.shadow
  ];
  this.cursor = "crosshair";
};

Paint.tools.Eraser = function (data) {
  let points = data.points;
  let pos = data.pos;
  this.name = "Eraser";

  const alpha = data.alpha ?? Paint.settings.globals.opacity.getValue() / 255.0;

  if (points == null && pos == null) {
    throw "Error";
  } else if (points == null) {
    points = [];
    points.push(pos);
  } else {
    pos = points[0];
  }
  const lineWidth = data.lineWidth || Paint.settings.Eraser.size.getValue();

  this.Render = function (layer, preview) {
    const ctx = layer.canvasElm.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.moveTo(points[0].x, points[0].y);
    ctx.closePath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineWidth;
    if (!preview) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0, 0, 0, 255)";
    } else {
      ctx.strokeStyle = "rgba(255, 255, 255, 255)";
    }

    ctx.globalAlpha = alpha;
    ctx.stroke();
    if (!preview) {
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;
  };

  this.MouseMove = function (pos, layer) {
    points.push(pos);
    layer.Clear();
    this.Render(layer, true);
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
Paint.tools.Eraser.icon = "⌫";
Paint.tools.Eraser.UI = function () {
  this.size = Paint.ui.slider(1, 100, 20);
  this.elements = [
    Paint.ui.labelled(Paint.ui.label("Size:", "strong"), this.size),
  ];
  this.cursor = "crosshair";
};

Paint.tools.Line = function (data) {
  this.name = "Line";
  let pos = data.pos;
  let pos2 = data.pos2;
  const lineWidth = data.lineWidth || Paint.settings.Line.size.getValue();
  const strokeStyle = data.strokeStyle || data.fgcol;

  this.Render = function (layer) {
    const ctx = layer.canvasElm.getContext("2d");
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
Paint.tools.Line.icon = "╱";
Paint.tools.Line.UI = function () {
  this.size = Paint.ui.slider(1, 100, 5);
  this.elements = [
    Paint.ui.labelled(Paint.ui.label("Size:", "strong"), this.size),
  ];
  this.cursor = "crosshair";
};

//Classes
Paint.tools.Pointer = function () {};
Paint.tools.Pointer.UI = function () {
  this.elements = [];
  this.cursor = "auto";
};
Paint.tools.Pointer.icon = "✥";

function drawEllipse(ctx, x, y, w, h) {
  const kappa = 0.5522848;
  const ox = (w / 2) * kappa; // control point offset horizontal
  const oy = (h / 2) * kappa; // control point offset vertical
  const xe = x + w; // x-end
  const ye = y + h; // y-end
  const xm = x + w / 2; // x-middle
  const ym = y + h / 2; // y-middle

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
  let pos = data.pos;
  let pos2 = data.pos2;
  const strokeWidth =
    data.strokeWidth ?? Paint.settings.Shape.strokeWidth.getValue();
  const strokeStyle = data.strokeStyle || data.bgcol;
  const fillStyle = data.fillStyle || data.fgcol;
  const type = data.type || Paint.settings.Shape.Type.value;

  this.Render = function (layer) {
    const ctx = layer.canvasElm.getContext("2d");
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
Paint.tools.Shape.icon = "◌";

Paint.tools.Shape.UI = function () {
  this.strokeWidth = Paint.ui.slider(0, 100, 5);
  this.Type = Paint.ui.Select(["Rectangle", "Ellipse"]);
  this.Mod = Paint.ui.slider(0, 100, 50);

  this.elements = [
    this.Type,
    Paint.ui.labelled(
      Paint.ui.label("Outline size:", "strong"),
      this.strokeWidth
    ),
  ];
};

Paint.ui.Select = function (items) {
  const elm = document.createElement("select");
  for (let i = 0; i < items.length; i++) {
    const opt = new Option(items[i], null);
    opt.value = items[i];
    elm.add(opt, null);
  }
  return elm;
};

Paint.ui.button = function ({ text, onClick, icon, title }) {
  // Create a button with text and a optional icon
  const elm = document.createElement("button");
  elm.innerHTML = text;
  elm.onclick = onClick;
  elm.title = title ?? text ?? undefined;
  if (icon) {
    // prepend the icon inside the button
    const iconElm = document.createElement("img");
    iconElm.src = icon;
    elm.prepend(iconElm);
  }
  return elm;
};

Paint.ui.colourPicker = function (col, painter) {
  const elm = document.createElement("input");
  elm.type = "color";
  elm.style.width = "4em";
  elm.value = col;
  console.log({ tools });
  elm.getArgb = function () {
    console.log({ tools });
    const rgb = tools.hexToRgb(elm.value);
    const alpha = Paint.settings.globals.opacity.getValue() / 255.0;
    const r = rgb.r;
    const g = rgb.g;
    const b = rgb.b;
    return `rgba(${r},${g},${b},${alpha})`;
  };
  elm.onShow = function () {
    const containerElm = document.getElementById("paint_canvas");
    const ctx = painter.getCurrentLayer().canvasElm.getContext("2d");
    const listener = function (evt) {
      if (evt.button === 2) {
        const pos = tools.getRelativeMousePos(evt, evt.target);
        pos.x += containerElm.scrollLeft;
        pos.y += containerElm.scrollTop;
        const data = ctx.getImageData(pos.x, pos.y, 1, 1).data;
        //TODO: this will cause problems with multiple layers.

        if (data[3] === 0) {
          elm.fromRGB(1, 1, 1);
        } else {
          elm.fromRGB(data[0] / 255.0, data[1] / 255.0, data[2] / 255.0);
        }
      }
    };
    document
      .getElementById("layer_temp")
      .addEventListener("mousedown", listener, false);
    elm.onHide = function () {
      document
        .getElementById("layer_temp")
        .removeEventListener("mousedown", listener, false);
    };
  };

  return elm;
};

Paint.ui.label = function (HTML, type) {
  type = type || "strong";
  const elm = document.createElement(type);
  elm.innerHTML = HTML;
  return elm;
};

Paint.ui.labelled = function (label, elm) {
  const div = document.createElement("div");
  div.className = "tool";
  div.appendChild(label);
  div.appendChild(elm);
  return div;
};

Paint.ui.div = function (elements) {
  const div = document.createElement("div");
  div.className = "tool";
  div.append(...elements);
  return div;
};

Paint.ui.slider = function (min, max, value) {
  const elm = document.createElement("input");
  try {
    elm.type = "range";
    elm.min = min;
    elm.max = max || 100;
  } catch (e) {
    // ignore the error
  }
  elm.value = value;
  elm.getValue = function () {
    if (elm.value !== undefined) {
      return Math.max(elm.min, Math.min(parseInt(elm.value, 10), elm.max));
    }
  };
  return elm;
};

Paint.Toolbar = function (div_id, painter) {
  const divElm = document.getElementById(div_id);
  const fileElm = document.createElement("div");
  const toolsElm = document.createElement("select");
  const settingsElm = document.createElement("div");
  settingsElm.id = "settings";
  const toolSettingsElm = document.createElement("div");
  toolSettingsElm.id = "toolSettings";

  //Add the sections
  settingsElm.appendChild(fileElm);

  //Set up the tool menu section

  const swapToolButton = Paint.ui.button({
    text: "✥",
    title: "Swap tool",
    onClick: function () {
      painter.swapTool();
    },
  });
  const toolsContainer = Paint.ui.div([toolsElm, swapToolButton]);

  settingsElm.appendChild(toolsContainer);
  divElm.appendChild(settingsElm);
  divElm.appendChild(toolSettingsElm);

  //Set up the 'file menu'

  fileElm.appendChild(
    Paint.ui.button({ text: "Save", onClick: painter.Save, icon: "/disk.png" })
  );

  for (const b in Paint.tools) {
    toolsElm.add(new Option(b), null);
  }
  toolsElm.onchange = function () {
    painter.setTool(this.value, "Pointer");
  };

  //Set up the global tools section

  const fgPicker = Paint.ui.colourPicker("#0000FF", painter);
  Paint.settings.globals.fgcolour = fgPicker;

  const bgPicker = Paint.ui.colourPicker("#FFFFFF", painter);
  Paint.settings.globals.bgcolour = bgPicker;

  // Color swap button
  const swapColorButton = Paint.ui.button({
    // swap unicode character
    text: "↔",
    title: "Swap colors",
    onClick: function () {
      const fg = fgPicker.value;
      fgPicker.value = bgPicker.value;
      bgPicker.value = fg;
    },
  });

  const colorsElm = Paint.ui.div([fgPicker, bgPicker, swapColorButton]);

  settingsElm.appendChild(colorsElm);

  Paint.settings.globals.opacity = Paint.ui.slider(0, 255, 255);

  settingsElm.appendChild(
    Paint.ui.labelled(
      Paint.ui.label("Opacity: "),
      Paint.settings.globals.opacity
    )
  );

  //Set up the tool-specific-options section
  this.setTool = function (toolname, swap_toolname) {
    toolsElm.value = toolname;
    toolSettingsElm.innerHTML = "";
    if (!Paint.settings[toolname]) {
      Paint.settings[toolname] = new Paint.tools[toolname].UI();
    }

    toolSettingsElm.append(...Paint.settings[toolname].elements);

    painter.setCursor(Paint.settings[toolname].cursor || "auto");
    swapToolButton.innerHTML = Paint.tools[swap_toolname].icon;
  };
};

Paint.Layer = function (opts, id) {
  if (!opts) opts = {};
  this.name = opts.name || "New layer";
  this.canvasElm = document.createElement("canvas");
  this.canvasElm.className = "canvas";
  this.canvasElm.id = "layer_" + this.name;
  this.id = id;
  const history = [];
  this.Attach = function (parent) {
    parent.appendChild(this.canvasElm);
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
    history.forEach((command) => painter.ProcessCommand(command));
  };
};

Paint.Painter = function () {
  const layers = [];
  let current_layer = null;
  let canvas;
  const that = this;
  let selected_tool = "";
  let swap_tool = "Pointer";
  let current_tool = null;
  let socket;
  let toolbar = null;
  let last_sent_id;
  const images = {};

  const ChatFix = function () {
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
    const l = new Paint.Layer(opts, layers.length);
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
      const txt = $("#chatinput").val();
      $("#chatinput").val("");
      if (!txt) return false;
      socket.send({ chat: txt });
      return false;
    });

    let dragging = false;
    let dragoffset = 0;

    function onMouseMove(evt) {
      if (dragging) {
        $("#rightpanel").width(
          document.body.clientWidth - evt.pageX - 13 + dragoffset
        );
        ChatFix();
      }
    }

    function onMouseUp() {
      dragging = false;
    }

    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("mouseup", onMouseUp, false);

    $("#rightgrabber").mousedown(function (evt) {
      const pos = tools.getRelativeMousePos(
        evt,
        document.getElementById("rightpanel")
      );
      dragging = true;
      dragoffset = pos.x;
    });
    $(window).resize(function () {
      ChatFix();
    });

    const usc = $("#usercount");
    const usrs = $("#users");
    usrs.toggle();
    usc.mouseover(function () {
      usrs.toggle("fast");
    });
    usc.mousemove(function () {
      const pos = usc.position();
      //pos.top += usc.height();
      usrs.offset(pos);
    });
    usrs.mouseleave(function () {
      usrs.toggle("fast");
    });
  };

  this.ProcessChat = function (msg) {
    const elm = document.getElementById("chat");

    $("#chat").append(function () {
      const txt = msg.text;
      if (msg.sender) {
        return `<span class="chatname">${msg.sender.name}:</span> ${txt}<br/>`;
      } else {
        return txt + "<br/>";
      }
    });
    ChatFix();
    elm.scrollTop = elm.scrollHeight;
  };

  this.ProcessCommand = function (command, is_new) {
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
            const ctx = canv.canvasElm.getContext("2d");
            ctx.drawImage(images[command.key], command.pos.x, command.pos.y);
          }
        } else {
          const n = new Image();
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
      for (const msgname in data) {
        const msg = data[msgname];
        switch (msgname) {
          case "history":
            msg.forEach((message) => that.ProcessCommand(message, true));
            break;
          case "command":
            that.ProcessCommand(msg, true);
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
            msg.forEach((msg) => that.ProcessChat(msg));
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
            $("#users").html(
              `<ul>${msg.map((m) => `<li>${m.name}</li>`).join("")}</ul>`
            );
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
      let fgcol, bgcol, tcol;
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

  this.swapTool = function () {
    that.setTool(swap_tool);
  };

  this.setTool = function (toolname) {
    // When switching to anything except the pointer, the swap
    // tool should always be pointer.
    // When switching to pointer, the swap tool should be whatever
    // the last tool was

    const last_tool = selected_tool;
    selected_tool = toolname;
    if (toolname === "Pointer") {
      swap_tool = last_tool;
    } else {
      swap_tool = "Pointer";
    }
    toolbar.setTool(toolname, swap_tool);
  };

  this.setCursor = function (curs) {
    canvas.getTempLayer().canvasElm.style.cursor = curs;
  };

  this.Save = function () {
    //TODO: Save all layers.
    const link = document.createElement("a");
    link.href = current_layer.canvasElm.toDataURL("image/png");
    link.download = "collabpaint.png";
    link.click();
  };
};

Paint.ProgressBar = function (parent) {
  if (!parent) parent = document.body;
  const progbox = document.createElement("div");
  const progress = document.createElement("div");
  progbox.className = "progbox";
  progress.className = "progress";
  progbox.appendChild(progress);
  parent.appendChild(progbox);

  let pos = 0;
  const m = setInterval(function () {
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
  let containerElm;
  let layersElm;
  const temp_layer = new Paint.Layer({ name: "temp" });
  const w = 1900;
  const h = 1060;

  this.Init = function () {
    containerElm = document.getElementById(object_id);
    layersElm = document.createElement("div");
    layersElm.id = "layers";
    containerElm.appendChild(layersElm);
    temp_layer.Attach(layersElm);
    temp_layer.Resize(w, h);
    const downEvent = function (evt) {
      const pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
      pos.x += containerElm.scrollLeft;
      pos.y += containerElm.scrollTop;
      painter.MouseDown(pos, evt.button);
    };
    const moveEvent = function (evt) {
      const pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
      pos.x += containerElm.scrollLeft;
      pos.y += containerElm.scrollTop;
      painter.MouseMove(pos);
    };
    const upEvent = function (evt) {
      //evt.preventDefault();
      const pos = tools.getRelativeMousePos(evt, temp_layer.canvasElm);
      pos.x += containerElm.scrollLeft;
      pos.y += containerElm.scrollTop;
      painter.MouseUp(pos);
    };

    temp_layer.canvasElm.oncontextmenu = function () {
      if (painter.getSelectedTool() !== "Pointer") {
        return false;
      }
    };

    const resfunc = function () {
      containerElm.style.height =
        window.innerHeight - $(containerElm).offset().top + "px";
    };
    resfunc();
    $(window).resize(resfunc);
    $("#vertical_stretch").resize(resfunc);

    const tevent = function (func, preventdefault) {
      return function (evt) {
        if (painter.getSelectedTool() == "Pointer") {
          return;
        }
        if (preventdefault) {
          evt.preventDefault();
        }
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

    // Toolbar hide hack
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("hide_ui") === "true") {
      $("#toolbar").hide();
    }

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
        const ctx = temp_layer.canvasElm.getContext("2d");
        const pa = ctx.globalAlpha;
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
    const dragend = function () {
      $(temp_layer.canvasElm).css("background", "none");
    };
    containerElm.addEventListener("dragend", dragend, false);
    containerElm.addEventListener("dragleave", dragend, false);

    const keycache = {};
    function onDrop(evt) {
      temp_layer.Clear();
      evt.stopPropagation();
      evt.preventDefault();

      const pos = {
        x: evt.layerX,
        y: evt.layerY,
      };

      const file = evt.dataTransfer.files[0];
      if (file.fileSize > 1048576) {
        alert("File too large. Image uploads are limited to 1 MB.");
        return;
      }
      if (file.type.indexOf("image/") !== 0) {
        alert("Only images are supported.");
        return;
      }

      let loadedimage = null;
      let loadedkey = null;
      let computedhash = null;

      const cacheClientImage = function () {
        if (loadedkey && loadedimage && computedhash) {
          painter.addImage(loadedkey, loadedimage);
          keycache[computedhash] = loadedkey;
        }
      };

      const reader = new FileReader();
      const breader = new FileReader();
      if (reader) {
        reader.onload = function (e) {
          const img = new Image();
          img.onload = function () {
            loadedimage = img;
            cacheClientImage();
          };
          img.src = e.target.result;
        };
        breader.onload = function (e) {
          computedhash = b64_md5(e.target.result);
          if (keycache[computedhash] === undefined) {
            const xhr = new XMLHttpRequest();
            const up = xhr.upload;
            const uploadbar = new Paint.ProgressBar(containerElm);
            xhr.onload = function () {
              const obj = JSON.parse(xhr.responseText);
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
    }
    containerElm.addEventListener("drop", onDrop, false);
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
