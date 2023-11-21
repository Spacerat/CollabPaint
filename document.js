/* Room class. Pass settings object in the form: {
    max_clients: int,    //10
    anyone_write: bool,  //false
    anyone_join: bool,   //false
}
*/

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function isInteger(n) {
  return !isNaN(parseInt(n, 10)) && isFinite(n);
}

function validate_position(pos) {
  for (const key in pos) {
    if (!(key === "x" || key === "y")) return false;
    if (!isInteger(pos[key])) return false;
  }
  return true;
}

function validate_points(points) {
  return points.every(validate_position);
}

class Layer {
  constructor(name) {
    this.name = name;
  }
}

class Document {
  constructor() {
    this.history = [];
    this.layers = [];
  }

  validate(dict, name, checktype) {
    const v = dict[name];
    let err = "";

    checktype.split(" ").forEach(function (t) {
      switch (t) {
        case "positive":
          if (v < 0) err = "value is not positive";
          break;
        case "number":
          if (!isNumber(v)) err = "value is not a number";
          break;
        case "integer":
          if (!isInteger(v)) err = "value is not an integer";
          break;
        case "layerid":
          if (this.layers[v] == null) err = "a layer with id does not exist";
          break;
        case "position":
          if (!validate_position(v)) err = "this value is an invalid position";
          break;
        case "points":
          if (!validate_points(v)) err = "this value is an invalid point list";
          break;
      }
    });
    if (err.length > 0) {
      throw new Error(
        `Invalid data ${v.toString()} for ${name}. \
          Expecting a "${checktype}" value, but ${err}`
      );
    }
  }

  DoCommand(command) {
    switch (command.cmd) {
      case "new_layer":
        {
          const name =
            command.params.name || "Layer_" + (this.layers.length + 1);
          command.params.name = name;
          const l = new Layer(name);
          this.layers.push(l);
        }
        break;
      case "image":
        //Image URL/key has already been validated
        this.validate(command, "layerid", "layerid");
        this.validate(command, "pos", "position");
        break;
      case "tool":
        if (this.layers[command.layerid] == null) throw "Invalid layerid";
        switch (command.name) {
          case "Brush":
            this.validate(command.data, "pos", "position");
            this.validate(command.data, "points", "points");
            this.validate(command.data, "lineWidth", "positive integer");
            break;
          case "Eraser":
            this.validate(command.data, "pos", "position");
            this.validate(command.data, "points", "points");
            this.validate(command.data, "lineWidth", "positive integer");
            this.validate(command.data, "alpha", "positive number");
            break;
          case "Line":
            this.validate(command.data, "pos", "position");
            this.validate(command.data, "pos2", "position");
            this.validate(command.data, "lineWidth", "positive integer");
            break;
          case "Shape":
            this.validate(command.data, "pos", "position");
            this.validate(command.data, "pos2", "position");
            this.validate(command.data, "strokeWidth", "positive integer");
            break;
          default:
            throw "Unidentified tool " + command.name;
        }
        break;
      default:
        return false;
    }
    command.id = this.history.length;
    this.history.push(command);
    return true;
  }

  getHistory() {
    return this.history;
  }

  Free() {
    this.history = null;
    this.layers = null;
  }
}

exports.Document = Document;
