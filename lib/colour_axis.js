
function grph_colour_axis() {

  var scale = grph_colour_scale();
  var variable_;
  var width_, height_;
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

  axis.assign = function(variable) {
    variable_ = variable;
    return this;
  }

  axis.variable = function() {
    return variable_;
  }

  axis.domain = function(data, schema) {
    if (arguments.length == 0) {
      return scale.domain();
    } else {
      if (variable_ === undefined) return this;
      var vschema = variable_schema(variable_, schema);
      var categories = vschema.categories.map(function(d) {
        return d.name; });
      scale.domain(categories);
      return this;
    }
  }

  axis.ticks = function() {
    return scale.ticks();
  }

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable_]);
    } else {
      return scale(v);
    }
  }

  return axis;
}
