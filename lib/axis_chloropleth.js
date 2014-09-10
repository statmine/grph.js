
function grph_axis_chloropleth() {

  var variable;
  var width, height;
  var scale = grph_scale_chloropleth();

  function axis(g) {
  }

  axis.width = function(w) {
    if (arguments.length == 0) {
      return width;
    } else {
      width = w;
      return this;
    }
  }

  axis.height = function(h) {
    if (arguments.length == 0) {
      return height;
    } else {
      height = h;
      return this;
    }
  }

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'number';
  }

  axis.variable = function(v) {
    if (arguments.length == 0) {
      return variable;
    } else {
      variable = v;
      return this;
    }
  }

  axis.domain = function(data, schema) {
    if (arguments.length == 0) {
      return scale.domain();
    } else {
      if (variable === undefined) return this;
      scale.domain(d3.extent(data, function(d) { return d[variable];}));
      return this;
    }
  }

  axis.ticks = function() {
    return scale.ticks();
  }

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable]);
    } else {
      return scale(v);
    }
  }

  return axis;
}
