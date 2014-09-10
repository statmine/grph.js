

function grph_axis_chloropleth() {

  var variable_;
  var width_, height_;
  var range_;
  var baseclass = "chloro";
  var ncolours = 9;
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
    return vschema.type == 'number';
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
      return range_;
    } else {
      if (variable_ === undefined) return this;
      range_ = d3.extent(data, function(d) { return d[variable_];});
      return this;
    }
  }

  axis.ticks = function() {
    //return scale.ticks();
  }

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable_]);
    } else {
      var range  = range_[1] - range_[0];
      var val    = v - range_[0];
      var val    = Math.sqrt(val*0.9999) / Math.sqrt(range);
      var cat    = Math.floor(val*ncolours);
      // returns something like "chloro chloron10 chloro4"
      return baseclass + " " + baseclass + "n" + ncolours + " " + baseclass + (cat+1);
    }
  }

  return axis;
}
