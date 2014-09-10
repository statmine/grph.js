
function grph_axis_split() {

  var variable_;
  var width_, height_;
  var domain_;
  var settings_ = {
  };

  function axis(g) {
  }

  axis.width = function(width) {
    if (arguments.length == 0) {
      return width_;
    } else {
      width_ = width;
      return this;
    }
  }

  axis.height = function(height) {
    if (arguments.length == 0) {
      return height_;
    } else {
      height_ = height;
      return this;
    }
  }

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'categorical';
  }

  axis.variable = function(v) {
    if (arguments.length == 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  }
 
  axis.domain = function(data, schema) {
    if (arguments.length == 0) {
      return domain_;
    } else {
      if (variable_ === undefined) return this;
      var vschema = variable_schema(variable_, schema);
      domain_ = vschema.categories.map(function(d) {
        return d.name; });
      return this;
    }
  }

  axis.ticks = function() {
    return domain_;
  }

  axis.scale = function(v) {
    return domain_.indexOf(v);
  }

  return axis;
}
