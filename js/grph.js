(function() {
  grph = {};


function grph_axis_categorical() {

  var scale = grph_scale_categorical();
  var width;
  var variable, height;

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "axis_categorical dummy")
    .attr("width", 0).attr("height", 0)
    .style("visibility", "hidden");
  var label_size_ = grph_label_size(dummy_);
  //if (horizontal_) scale_.label_size(label_size_.width);
  //else scale_.label_size(label_size_.height);
  

  function axis(g) {
    var ticks = axis.ticks();
    g.append("rect").attr("class", "background")
      .attr("width", axis.width()).attr("height", axis.height());
    g.selectAll(".tick").data(ticks).enter()
      .append("line").attr("class", "ticks")
      .attr("x1", axis.width() - settings("tick_length"))
      .attr("x2", axis.width())
      .attr("y1", scale.m).attr("y2", scale.m);
    g.selectAll(".ticklabel").data(ticks).enter()
      .append("text").attr("class", "ticklabel")
      .attr("x", axis.width() - settings("tick_length") - settings("tick_padding"))
      .attr("y", scale.m)
      .text(function(d) { return d;})
      .attr("text-anchor", "end")
      .attr("dy", "0.35em");
    g.append("line").attr("class", "axisline")
      .attr("x1", axis.width()).attr("x2", axis.width())
      .attr("y1", 0). attr("y2", axis.height());
  }

  axis.width = function(w) {
    if (arguments.length === 0) {
      if (width === undefined) {// TODO reset width_ when labels change
        var ticks = scale.ticks();
        var max_width = 0;
        for (var i = 0; i < ticks.length; ++i) {
          var lw = label_size_.width(ticks[i]);
          if (lw > max_width) max_width = lw;
        }
        width = max_width + settings("tick_length") + settings("tick_padding");  
      }
      return width;
    } else {
      width = w;
      return this;
    }
  };

  axis.height = function(h) {
    if (arguments.length === 0) {
      return height;
    } else {
      height = h;
      scale.range([0, h]);
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'string' || vschema.type == 'categorical' ||
      vschema.type == 'period';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable;
    } else {
      variable = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale.domain();
    } else {
      var d = data.map(function(d) { return d[variable];});
      // filter out duplicate values
      var domain = d.filter(function(value, index, self) {
        return self.indexOf(value) === index;
      });
      scale.domain(domain);
      return this;
    }
  };

  axis.ticks = function() {
    return scale.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable]).m;
    } else {
      return scale(v).m;
    }
  };

  axis.scale.l = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable]).l;
    } else {
      return scale(v).l;
    }
  };

  axis.scale.u = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable]).u;
    } else {
      return scale(v).u;
    }
  };

  axis.scale.w = function(v) {
    var r;
    if (typeof v == 'object') { 
      r = scale(v[variable]);
    } else {
      r = scale(v);
    }
    return r.u - r.l;
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.categorical = grph_axis_categorical();



function grph_axis_chloropleth() {

  var variable;
  var width, height;
  var scale = grph_scale_chloropleth();

  function axis(g) {
  }

  axis.width = function(w) {
    if (arguments.length === 0) {
      return width;
    } else {
      width = w;
      return this;
    }
  };

  axis.height = function(h) {
    if (arguments.length === 0) {
      return height;
    } else {
      height = h;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'number';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable;
    } else {
      variable = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale.domain();
    } else {
      if (variable === undefined) return this;
      scale.domain(d3.extent(data, function(d) { return d[variable];}));
      return this;
    }
  };

  axis.ticks = function() {
    return scale.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable]);
    } else {
      return scale(v);
    }
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.chloropleth = grph_axis_chloropleth();



function grph_axis_colour() {

  var scale = grph_scale_colour();
  var variable_;
  var width_, height_;

  function axis(g) {
  }

  axis.width = function(width) {
    if (arguments.length === 0) {
      return width_;
    } else {
      width_ = width;
      return this;
    }
  };

  axis.height = function(height) {
    if (arguments.length === 0) {
      return height_;
    } else {
      height_ = height;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == "categorical" || vschema.type == "period";
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale.domain();
    } else {
      if (variable_ === undefined) return this;
      var vschema = variable_schema(variable_, schema);
      var categories = [];
      if (vschema.type == "categorical") {
        categories = vschema.categories.map(function(d) { return d.name; });
      } else {
        var vals = data.map(function(d) { return d[variable_];}).sort();
        var prev;
        for (var i = 0; i < vals.length; ++i) {
          if (vals[i] != prev) categories.push("" + vals[i]);
          prev = vals[i];
        }
      }
      scale.domain(categories);
      return this;
    }
  };

  axis.ticks = function() {
    return scale.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return scale(v[variable_]);
    } else {
      return scale(v);
    }
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.colour = grph_axis_colour();



function grph_axis_linear(horizontal) {

  var scale_ = grph_scale_linear();
  var horizontal_ = horizontal;
  var variable_;
  var width_, height_;
  var origin_;
  var settings_ = {
    "tick_length" : 5,
    "tick_padding" : 2,
    "padding" : 4
  };

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "linearaxis dummy")
    .attr("width", 0).attr("height", 0)
    .style("visibility", "hidden");
  var label_size_ = grph_label_size(dummy_);
  if (horizontal_) scale_.label_size(label_size_.width);
  else scale_.label_size(label_size_.height);
  

  function axis(g) {
    var ticks = axis.ticks();
    g.append("rect").attr("class", "background")
      .attr("width", axis.width()).attr("height", axis.height());
    if (horizontal) {
      g.selectAll(".tick").data(ticks).enter()
        .append("line").attr("class", "tick")
        .attr("x1", scale_).attr("x2", scale_)
        .attr("y1", 0).attr("y2", settings_.tick_length);
      g.selectAll(".ticklabel").data(ticks).enter()
        .append("text").attr("class", "ticklabel")
        .attr("x", scale_).attr("y", settings_.tick_length + settings_.tick_padding)
        .text(function(d) { return d;})
        .attr("text-anchor", "middle")
        .attr("dy", "0.71em");
    } else {
      var w = axis.width();
      g.selectAll(".tick").data(ticks).enter()
        .append("line").attr("class", "tick")
        .attr("x1", w-settings_.tick_length).attr("x2", w)
        .attr("y1", scale_).attr("y2", scale_);
      g.selectAll(".ticklabel").data(ticks).enter()
        .append("text").attr("class", "ticklabel")
        .attr("x", settings_.padding).attr("y", scale_)
        .text(function(d) { return d;})
        .attr("text-anchor", "begin")
        .attr("dy", "0.35em");
    }
  }

  axis.width = function(width) {
    if (horizontal_) {
      // if horizontal the width is usually given; this defines the range of
      // the scale
      if (arguments.length === 0) {
        return width_;
      } else {
        width_ = width;
        scale_.range([0, width_]);
        return this;
      }
    } else {
      // if vertical the width is usually defined by the graph: the space it
      // needs to draw the tickmarks and labels etc. 
      if (arguments.length === 0) {
        if (width_ === undefined) {// TODO reset width_ when labels change
          var ticks = scale_.ticks();
          var w = 0;
          for (var i = 0; i < ticks.length; ++i) {
            var lw = label_size_.width(ticks[i]);
            if (lw > w) w = lw;
          }
          width_ = w + settings_.tick_length + settings_.tick_padding + settings_.padding;  
        }
        return width_;
      } else {
        width_ = width;
        return this;
      }
    }
  };

  axis.height = function(height) {
    if (horizontal_) {
      // if horizontal the width is usually defined by the graph: the space it
      // needs to draw the tickmarks and labels etc. 
      if (arguments.length === 0) {
        if (height_ === undefined) { // TODO reset height_ when labels change
          var ticks = scale_.ticks();
          var h = 0;
          for (var i = 0; i < ticks.length; ++i) {
            var lh = label_size_.height(ticks[i]);
            if (lh > h) h = lh;
          }
          height_ = h + settings_.tick_length + settings_.tick_padding + settings_.padding; 
        }
        return height_;
      } else {
        height_ = height;
        return this;
      }
    } else {
      // if vertical the width is usually given; this defines the range of
      // the scale
      if (arguments.length === 0) {
        return height_;
      } else {
        height_ = height;
        scale_.range([height_, 0]);
        return this;
      }
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'number';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale_.domain();
    } else {
      var range = d3.extent(data, function(d) { return d[variable_];});
      var vschema = variable_schema(variable_, schema);
      if (vschema.origin) origin_ = vschema.origin;
      if (origin_ !== undefined) {
        if (range[0] > origin_) range[0] = origin_;
        if (range[1] < origin_) range[1] = origin_;
      }
      scale_.domain(range).nice();
      return this;
    }
  };

  axis.origin = function(origin) {
    if (arguments.length === 0) {
      return origin_;
    } else {
      origin_ = origin;
      return this;
    }
  };

  axis.ticks = function() {
    return scale_.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return scale_(v[variable_]);
    } else {
      return scale_(v);
    }
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.linear = grph_axis_linear();



function grph_axis_region() {

  var variable_;
  var width_, height_;
  var map_loaded_;
  var map_;
  var index_ = {};

  function axis(g) {
  }

  axis.width = function(width) {
    if (arguments.length === 0) {
      return width_;
    } else {
      update_projection_ = update_projection_ || width_ != width;
      width_ = width;
      return this;
    }
  };

  axis.height = function(height) {
    if (arguments.length === 0) {
      return height_;
    } else {
      update_projection_ = update_projection_ || height_ != height;
      height_ = height;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'string';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };

  // Variable and function that keeps track of whether or not the map has 
  // finished loading. The method domain() loads the map. However, this happens
  // asynchronously. Therefore, it is possible (and often happens) that the map
  // has not yet loaded when scale() and transform() are called. The code 
  // calling these methods therefore needs to wait until the map has loaded. 
  var map_loading_ = false; 
  axis.map_loaded = function() {
    return !map_loading_;
  };

  function load_map(data, schema, callback) {
    if (variable_ === undefined) return ; // TODO
    var vschema = variable_schema(variable_, schema);
    if (vschema.map === undefined) return ; // TODO
    if (vschema.map == map_loaded_) return; 
    map_loading_ = true;
    // TODO handle errors in d3.json
    d3.json(vschema.map, function(json) {
      map_loaded_ = vschema.map;
      callback(json);
      map_loading_ = false;
    });
  }

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      //return scale.domain();
    } else {
      load_map(data, schema, function(map) {
        map_ = map;
        update_projection_ = true;
        // build index mapping region name on features 
        var vschema = variable_schema(variable_, schema);
        var regionid = vschema.regionid || "id";
        for (var feature in map_.features) {
          var name = map_.features[feature].properties[regionid];
          index_[name] = feature;
        }
      });
      return this;
    }
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable_]);
    } else {
      axis.update_projection();
      return path_(map_.features[index_[v]]);
    }
  };

  // The projection. Calculating the scale and translation of the projection 
  // takes time. Therefore, we only want to do that when necessary. 
  // update_projection_ keeps track of whether or not the projection needs 
  // recalculation
  var update_projection_ = true;
  // the projection
  var projection_ = d3.geo.transverseMercator()
    .rotate([-5.38720621, -52.15517440]).scale(1).translate([0,0]);
  var path_ = d3.geo.path().projection(projection_);
  // function that recalculates the scale and translation of the projection
  axis.update_projection = function() {
    if (update_projection_ && map_) {
      projection_.scale(1).translate([0,0]);
      path_ = d3.geo.path().projection(projection_);
      var bounds = path_.bounds(map_);
      var scale  = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / width_, 
                  (bounds[1][1] - bounds[0][1]) / height_);
      var transl = [(width_ - scale * (bounds[1][0] + bounds[0][0])) / 2, 
                  (height_ - scale * (bounds[1][1] + bounds[0][1])) / 2];
      projection_.scale(scale).translate(transl);
      update_projection_ = false;
    }
  };


  return axis;
}

// A function expecting two functions. The second function is called when the 
// first function returns true. When the first function does not return true
// we wait for 100ms and try again. 
var wait_for = function(m, f) {
  if (m()) {
    f();
  } else {
    setTimeout(function() { wait_for(m, f);}, 100);
  }
};

if (grph.axis === undefined) grph.axis = {};
grph.axis.linear = grph_axis_linear();



function grph_axis_size() {

  var variable_;
  var width, height;
  var scale = grph_scale_size();

  function axis(g) {
  }

  axis.width = function(w) {
    if (arguments.length === 0) {
      return width;
    } else {
      width = w;
      return this;
    }
  };

  axis.height = function(h) {
    if (arguments.length === 0) {
      return height;
    } else {
      height = h;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'number';
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable;
    } else {
      variable = v;
      return this;
    }
  };

  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return scale.domain();
    } else {
      if (variable === undefined) return this;
      scale.domain(d3.extent(data, function(d) { return d[variable];}));
      return this;
    }
  };

  axis.ticks = function() {
    return scale.ticks();
  };

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable]);
    } else {
      return scale(v);
    }
  };

  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.size = grph_axis_size();



function grph_axis_split() {

  var variable_;
  var width_, height_;
  var domain_;
  var settings_ = {
  };

  function axis(g) {
  }

  axis.width = function(width) {
    if (arguments.length === 0) {
      return width_;
    } else {
      width_ = width;
      return this;
    }
  };

  axis.height = function(height) {
    if (arguments.length === 0) {
      return height_;
    } else {
      height_ = height;
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == "categorical" || vschema.type == "period";
  };

  axis.variable = function(v) {
    if (arguments.length === 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  };
 
  axis.domain = function(data, schema) {
    if (arguments.length === 0) {
      return domain_;
    } else {
      if (variable_ === undefined) return this;
      var vschema = variable_schema(variable_, schema);
      var categories = [];
      if (vschema.type == "categorical") {
        categories = vschema.categories.map(function(d) { return d.name; });
      } else {
        var vals = data.map(function(d) { return d[variable_];}).sort();
        var prev;
        for (var i = 0; i < vals.length; ++i) {
          if (vals[i] != prev) categories.push("" + vals[i]);
          prev = vals[i];
        }
      }
      domain_ = categories;
      return this;
    }
  };

  axis.ticks = function() {
    return domain_;
  };

  axis.scale = function(v) {
    return domain_.indexOf(v);
  };

  return axis;
}


function variable_schema(variable, schema) {
  for (var i = 0; i < schema.fields.length; i++) {
    if (schema.fields[i].name == variable) 
      return schema.fields[i];
  }
  return undefined;
}
  


function grph_generic_graph(axes, dispatch, type, graph_panel) {

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "dummy graph graph-" + type)
    .attr("width", 0).attr("height", 0)
    .style("visibility", "hidden");
  var label_size_ = grph_label_size(dummy_);


  var graph = grph_graph(axes, dispatch, function(g) {
    function nest_column(d) {
      return axes.column.variable() ? d[axes.column.variable()] : 1;
    }
    function nest_row(d) {
      return axes.row.variable() ? d[axes.row.variable()] : 1;
    }
    // setup axes
    for (var axis in axes) axes[axis].domain(graph.data(), graph.schema());
    // determine number of rows and columns
    var ncol = axes.column.variable() ? axes.column.ticks().length : 1;
    var nrow = axes.row.variable() ? axes.row.ticks().length : 1;
    // get labels and determine their height
    var vschemax = variable_schema(axes.x.variable(), schema);
    var xlabel = vschemax.title;
    var label_height = label_size_.height(xlabel) + settings('label_padding');
    var vschemay = variable_schema(axes.y.variable(), schema);
    var ylabel = vschemay.title;
    // set the width, height end domain of the x- and y-axes. We need some 
    // iterations for this, as the height of the y-axis depends of the height
    // of the x-axis, which depends on the labels of the x-axis, which depends
    // on the width of the x-axis, etc. 
    var rowlabel_width = axes.row.variable() ? 3*label_height : 0;
    var columnlabel_height = axes.column.variable() ? 3*label_height : 0;
    var w, h;
    for (var i = 0; i < 2; ++i) {
      w = graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height - rowlabel_width;
      w = (w - (ncol-1)*settings('sep')) / ncol;
      axes.x.width(w).domain(graph.data(), graph.schema());
      h = graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height - columnlabel_height;
      h = (h - (nrow-1)*settings('sep')) / nrow;
      axes.y.height(h).domain(graph.data(), graph.schema());
    }
    var l = axes.y.width() + settings('padding')[1] + label_height;
    var t  = settings('padding')[2] + columnlabel_height;
    // create group containing complete graph
    g = g.append("g").attr("class", "graph graph-" + type);
    // draw labels
    var ycenter = t + 0.5*(graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height);
    var xcenter = l + 0.5*(graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height);
    g.append("text").attr("class", "label label-y")
      .attr("x", settings('padding')[1]).attr("y", ycenter)
      .attr("text-anchor", "middle").text(ylabel)
      .attr("transform", "rotate(90 " + settings('padding')[1] + " " + ycenter + ")");
    g.append("text").attr("class", "label label-x")
      .attr("x", xcenter).attr("y", graph.height()-settings('padding')[0])
      .attr("text-anchor", "middle").text(xlabel);
    if (axes.row.variable()) {
      var xrow = graph.width() - settings('padding')[3] - label_height;
      var vschemarow = variable_schema(axes.row.variable(), schema);
      var rowlabel = vschemarow.title;
      g.append("text").attr("class", "label label-y")
        .attr("x", xrow).attr("y", ycenter)
        .attr("text-anchor", "middle").text(rowlabel)
        .attr("transform", "rotate(90 " + xrow + " " + ycenter + ")");
    }
    if (axes.column.variable()) {
      var vschemacolumn = variable_schema(axes.column.variable(), schema);
      var columnlabel = vschemacolumn.title;
      g.append("text").attr("class", "label label-y")
        .attr("x", xcenter).attr("y", settings("padding")[2]).attr("dy", "0.71em")
        .attr("text-anchor", "middle").text(columnlabel);
    }
    // create each of the panels
    var d = d3.nest().key(nest_column).key(nest_row).entries(graph.data());
    for (i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      t  = settings('padding')[2] + columnlabel_height;
      for (var j = 0; j < dj.length; ++j) {
        // draw x-axis
        if (j == (dj.length-1)) {
          g.append("g").attr("class", "axis axis-x")
            .attr("transform", "translate(" + l + "," + (t + h) + ")").call(axes.x);
        }
        // draw y-axis
        if (i === 0) {
          g.append("g").attr("class", "axis axis-y")
            .attr("transform", "translate(" + (l - axes.y.width()) + "," + t + ")")
            .call(axes.y);
        }
        // draw row labels
        if (i == (d.length-1) && axes.row.variable()) {
          var rowtick = axes.row.ticks()[i];
          var grow = g.append("g").attr("class", "axis axis-row")
            .attr("transform", "translate(" + (l + w) + "," + t + ")");
          grow.append("rect").attr("class", "background")
            .attr("width", label_height + 2*settings("tick_padding"))
            .attr("height", h);
          grow.append("text").attr("class", "ticklabel")
            .attr("x", 0).attr("y", h/2)
            .attr("transform", "rotate(90 " + 
              (label_height - settings("tick_padding")) + " " + h/2 + ")")
            .attr("text-anchor", "middle").attr("dy", "0.35em")
            .text(rowtick);
        }
        // draw column labels
        if (j === 0 && axes.column.variable()) {
          var columntick = axes.column.ticks()[i];
          var coltickh = label_height + 2*settings("tick_padding");
          var gcolumn = g.append("g").attr("class", "axis axis-column")
            .attr("transform", "translate(" + l + "," + (t - coltickh) + ")");
          gcolumn.append("rect").attr("class", "background")
            .attr("width", w)
            .attr("height", label_height + 2*settings("tick_padding"));
          gcolumn.append("text").attr("class", "ticklabel")
            .attr("x", w/2).attr("y", settings("tick_padding"))
            .attr("text-anchor", "middle").attr("dy", "0.71em")
            .text(columntick);
        }
        // draw box for graph
        var gr = g.append("g").attr("class", "panel")
          .attr("transform", "translate(" + l + "," + t + ")");
        gr.append("rect").attr("class", "background")
          .attr("width", w).attr("height", h);
        // draw grid
        var xticks = axes.x.ticks();
        gr.selectAll("line.gridx").data(xticks).enter().append("line")
          .attr("class", "grid gridx")
          .attr("x1", axes.x.scale).attr("x2", axes.x.scale)
          .attr("y1", 0).attr("y2", h);
        var yticks = axes.y.ticks();
        gr.selectAll("line.gridy").data(yticks).enter().append("line")
          .attr("class", "grid gridy")
          .attr("x1", 0).attr("x2", w)
          .attr("y1", axes.y.scale).attr("y2", axes.y.scale);
        // add crosshairs to graph
        var gcrossh = gr.append("g").classed("crosshairs", true);
        gcrossh.append("line").classed("hline", true).attr("x1", 0)
          .attr("y1", 0).attr("x2", axes.x.width()).attr("y2", 0)
          .style("visibility", "hidden");
        gcrossh.append("line").classed("vline", true).attr("x1", 0)
          .attr("y1", 0).attr("x2", 0).attr("y2", axes.y.height())
          .style("visibility", "hidden");
        // draw panel
        graph_panel(gr, dj[j].values);
        // next panel
        t += axes.y.height() + settings('sep');
      }
      l += axes.x.width() + settings('sep');
    }
    // finished drawing call ready event
    dispatch.ready.call(g);
  });

  return graph;
}


function grph_graph(axes, dispatch, graph) {

  var width, height;
  var data, schema;

  graph.axes = function() {
    return d3.keys(axes);
  };

  graph.width = function(w) {
    if (arguments.length === 0) {
      return width;
    } else {
      width = w;
      return this;
    }
  };

  graph.height = function(h) {
    if (arguments.length === 0) {
      return height;
    } else {
      height = h;
      return this;
    }
  };

  graph.accept = function(variables, axis) {
    if (arguments.length > 1) {
      if (axes[axis] === undefined) return false;
      return axes[axis].accept(variables, schema);
    } else {
      for (var i in axes) {
        if (variables[i] === undefined) {
          if (axes[i].required) return false;
        } else {
          var accept = axes[i].accept(variables[i], schema);
          if (!accept) return false;
        }
      }
      return true;
    }
  };

  graph.assign = function(variables) {
    for (var i in axes) axes[i].variable(variables[i]);
    return this;
  };

  graph.schema = function(s) {
    if (arguments.length === 0) {
      return schema;
    } else {
      schema = s;
      return this;
    }
  };

  graph.data = function(d, s) {
    if (arguments.length === 0) {
      return data;
    } else {
      data = d;
      if (arguments.length > 1) 
        graph.schema(s);
      return this;
    }
  };

  graph.dispatch = function() {
    return dispatch;
  };

  return graph;
}



function grph_graph_bar() {

  var axes = {
    'x' : grph_axis_linear(true).origin(0),
    'y' : grph_axis_categorical(),
    'colour': grph_axis_colour(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.x.required = true;
  axes.y.required = true;
  var dispatch = d3.dispatch("mouseover", "mouseout", "click", "ready");

  var graph = grph_generic_graph(axes, dispatch, "bar", function(g, data) {
    function nest_colour(d) {
      return axes.colour.variable() ? d[axes.colour.variable()] : 1;
    }
    function get_x(d) {
      var v = axes.x.scale(d);
      return v < axes.x.scale(origin) ? v : axes.x.scale(origin);
    }
    function get_width(d) {
      return Math.abs(axes.x.scale(d) - axes.x.scale(origin));
    }
    function get_y(d) {
      return axes.y.scale.l(d) + i*axes.y.scale.w(d)/ncolours;
    }
    function get_height(d) {
      return axes.y.scale.w(d)/ncolours;
    }

    var d = d3.nest().key(nest_colour).entries(data);
    var ncolours = d.length;
    var origin = axes.x.origin();
    for (var i = 0; i < d.length; ++i) {
      var colour = axes.colour.scale(d[i].key);
      g.selectAll("rect." + colour).data(d[i].values).enter().append("rect")
        .attr("class", "bar " + colour).attr("x", get_x)
        .attr("width", get_width).attr("y", get_y).attr("height", get_height);
    }
    g.append("line").attr("class", "origin")
      .attr("x1", axes.x.scale(origin))
      .attr("x2", axes.x.scale(origin))
      .attr("y1", 0).attr("y2", axes.y.height());
  });

  // when finished drawing graph; add event handlers 
  dispatch.on("ready", function() {
    // add hover events to the lines and points
    var self = this;
    this.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(self, variable, value, d);
    }).on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(self, variable, value, d);
    }).on("click", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.click.call(self, variable, value, d);
    });
  });

  // Local event handlers
  dispatch.on("mouseover", function(variable, value, d) {
    if (variable) {
      var classes = axes.colour.scale("" + value);
      var regexp = /\bcolour([0-9]+)\b/;
      var colour = regexp.exec(classes)[0];
      this.selectAll(".colour").classed("colourlow", true);
      this.selectAll("." + colour).classed({"colourhigh": true, "colourlow": false});
    }
    this.selectAll(".hline").attr("y1", axes.y.scale(d)).attr("y2", axes.y.scale(d))
      .style("visibility", "visible");
    this.selectAll(".vline").attr("x1", axes.x.scale(d)).attr("x2", axes.x.scale(d))
      .style("visibility", "visible");
  });
  dispatch.on("mouseout", function(variable, value, d) {
    this.selectAll(".colour").classed({"colourhigh": false, "colourlow": false});
    this.selectAll(".hline").style("visibility", "hidden");
    this.selectAll(".vline").style("visibility", "hidden");
  });

  // Tooltip
  // when d3.tip is loaded
  if (d3.tip !== undefined) {
    var tip = d3.tip().direction("se").attr('class', 'tip tip-bar').html(function(variable, value, d) { 
      var schema = graph.schema();
      var str = '';
      for (var field in schema.fields) {
        str += schema.fields[field].title + ': ' + d[schema.fields[field].name] + '</br>';
      }
      return str;
    });
    dispatch.on("ready.tip", function() {
      this.call(tip);
    });
    dispatch.on("mouseover.tip", function(variable, value, d) {
      tip.show(variable, value, d);
    });
    dispatch.on("mouseout.tip", function(variable, value, d) {
      tip.hide(variable, value, d);
    });
  }

  return graph;
}


function grph_graph_bubble() {

  var axes = {
    'x' : grph_axis_linear(true),
    'y' : grph_axis_linear(false),
    'object' : grph_axis_colour(),
    'size'   : grph_axis_size(),
    'colour' : grph_axis_colour(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.x.required = true;
  axes.y.required = true;
  axes.object.required = true;
  var dispatch = d3.dispatch("mouseover", "mouseout", "click", "ready");

  var graph = grph_generic_graph(axes, dispatch, "bubble", function(g, data) {
    function nest_object(d) {
      return axes.object.variable() ? d[axes.object.variable()] : 1;
    }
    function nest_colour(d) {
      return axes.colour.variable() ? d[axes.colour.variable()] : 1;
    }
    var d = d3.nest().key(nest_colour).entries(data);
    // draw bubbles 
    for (var i = 0; i < d.length; ++i) {
      g.selectAll("circle.bubble" + i).data(d[i].values).enter().append("circle")
        .attr("class", "bubble bubble" + i + " " + axes.colour.scale(d[i].key))
        .attr("cx", axes.x.scale).attr("cy", axes.y.scale)
        .attr("r", axes.size.scale);
    }
  });


  // when finished drawing graph; add event handlers 
  dispatch.on("ready", function() {
    // add hover events to the lines and points
    var self = this;
    this.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(self, variable, value, d);
    }).on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(self, variable, value, d);
    }).on("click", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.click.call(self, variable, value, d);
    });
  });

  // Local event handlers
  dispatch.on("mouseover", function(variable, value, d) {
    if (variable) {
      var classes = axes.colour.scale("" + value);
      var regexp = /\bcolour([0-9]+)\b/;
      var colour = regexp.exec(classes)[0];
      this.selectAll(".colour").classed("colourlow", true);
      this.selectAll("." + colour).classed({"colourhigh": true, "colourlow": false});
    }
    this.selectAll(".hline").attr("y1", axes.y.scale(d)).attr("y2", axes.y.scale(d))
      .style("visibility", "visible");
    this.selectAll(".vline").attr("x1", axes.x.scale(d)).attr("x2", axes.x.scale(d))
      .style("visibility", "visible");
  });
  dispatch.on("mouseout", function(variable, value, d) {
    this.selectAll(".colour").classed({"colourhigh": false, "colourlow": false});
    this.selectAll(".hline").style("visibility", "hidden");
    this.selectAll(".vline").style("visibility", "hidden");
  });

  // Tooltip
  // when d3.tip is loaded
  if (d3.tip !== undefined) {
    var tip = d3.tip().direction("se").attr('class', 'tip tip-bubble').html(function(variable, value, d) { 
      var schema = graph.schema();
      var str = '';
      for (var field in schema.fields) {
        str += schema.fields[field].title + ': ' + d[schema.fields[field].name] + '</br>';
      }
      return str;
    });
    dispatch.on("ready.tip", function() {
      this.call(tip);
    });
    dispatch.on("mouseover.tip", function(variable, value, d) {
      tip.show(variable, value, d);
    });
    dispatch.on("mouseout.tip", function(variable, value, d) {
      tip.hide(variable, value, d);
    });
  }


  return graph;
}



function grph_graph_line() {

  var axes = {
    'x' : grph_axis_linear(true),
    'y' : grph_axis_linear(false),
    'colour' : grph_axis_colour(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.x.required = true;
  axes.y.required = true;
  var dispatch = d3.dispatch("mouseover", "mouseout", "pointover", "pointout",
    "click", "ready");

  var graph = grph_generic_graph(axes, dispatch, "line", function(g, data) {
    function nest_colour(d) {
      return axes.colour.variable() ? d[axes.colour.variable()] : 1;
    }
    var d = d3.nest().key(nest_colour).entries(data);
    // draw lines 
    var line = d3.svg.line().x(axes.x.scale).y(axes.y.scale);
    for (var i = 0; i < d.length; ++i) {
      g.append("path").attr("d", line(d[i].values))
        .attr("class", axes.colour.scale(d[i].key))
        .datum(d[i]);
    }
    // draw points 
    for (i = 0; i < d.length; ++i) {
      var cls = "circle" + i;
      g.selectAll("circle.circle" + i).data(d[i].values).enter().append("circle")
        .attr("class", "circle" + i + " " + axes.colour.scale(d[i].key))
        .attr("cx", axes.x.scale).attr("cy", axes.y.scale)
        .attr("r", settings('point_size'));
    }
  });

  // when finished drawing graph; add event handlers 
  dispatch.on("ready", function() {
    // add hover events to the lines and points
    var self = this;
    this.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(self, variable, value, d);
      if (!d.key) dispatch.pointover.call(self, variable, value, d);
    }).on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(self, variable, value, d);
      if (!d.key) dispatch.pointout.call(self, variable, value, d);
    }).on("click", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.click.call(self, variable, value, d);
    });
  });
  // Local event handlers
  // Highlighting of selected line
  dispatch.on("mouseover", function(variable, value, d) {
    if (variable) {
      var classes = axes.colour.scale("" + value);
      var regexp = /\bcolour([0-9]+)\b/;
      var colour = regexp.exec(classes)[0];
      this.selectAll(".colour").classed("colourlow", true);
      this.selectAll("." + colour).classed({"colourhigh": true, "colourlow": false});
    }
  });
  dispatch.on("mouseout", function(variable, value, d) {
    this.selectAll(".colour").classed({"colourhigh": false, "colourlow": false});
  });
  // Show crosshairs when hovering over a point
  dispatch.on("pointover", function(variable, value, d) {
    this.selectAll(".hline").attr("y1", axes.y.scale(d)).attr("y2", axes.y.scale(d))
      .style("visibility", "visible");
    this.selectAll(".vline").attr("x1", axes.x.scale(d)).attr("x2", axes.x.scale(d))
      .style("visibility", "visible");
  });
  dispatch.on("pointout", function(variable, value, d) {
    this.selectAll(".hline").style("visibility", "hidden");
    this.selectAll(".vline").style("visibility", "hidden");
  });

  // Tooltip
  // when d3.tip is loaded
  if (d3.tip !== undefined) {
    var tip = d3.tip().direction("se").attr('class', 'tip tip-line').html(function(variable, value, d) { 
      var schema = graph.schema();
      var str = '';
      for (var field in schema.fields) {
        str += schema.fields[field].title + ': ' + d[schema.fields[field].name] + '</br>';
      }
      return str;
    });
    dispatch.on("ready.tip", function() {
      this.call(tip);
    });
    dispatch.on("pointover.tip", function(variable, value, d) {
      tip.show(variable, value, d);
    });
    dispatch.on("pointout.tip", function(variable, value, d) {
      tip.hide(variable, value, d);
    });
  }

  return graph;
}




function grph_graph_map() {

  var axes = {
    'region' : grph_axis_region(),
    'colour' : grph_axis_chloropleth(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.region.required = true;
  axes.colour.required = true;
  var dispatch = d3.dispatch("ready", "mouseover", "mouseout", "click");

  var graph = grph_graph(axes, dispatch, function(g) {
    function nest_column(d) {
      return axes.column.variable() ? d[axes.column.variable()] : 1;
    }
    function nest_row(d) {
      return axes.row.variable() ? d[axes.row.variable()] : 1;
    }
    // setup axes
    axes.region.domain(graph.data(), graph.schema());
    axes.colour.domain(graph.data(), graph.schema());
    axes.column.domain(graph.data(), graph.schema());
    axes.row.domain(graph.data(), graph.schema());
    // determine number of rows and columns
    var ncol = axes.column.variable() ? axes.column.ticks().length : 1;
    var nrow = axes.row.variable() ? axes.row.ticks().length : 1;
    // set the width, height end domain of the x- and y-axes
    var w = (graph.width() - settings("padding", "map")[1] - settings("padding", "map")[3] - 
      (ncol-1)*settings("sep", "map"))/ncol;
    var h = (graph.height() - settings("padding", "map")[0] - settings("padding", "map")[2] - 
      (nrow-1)*settings("sep", "map"))/nrow;
    var l = settings("padding", "map")[1];
    var t  = settings("padding", "map")[2];
    axes.region.width(w).height(h);
    // create group containing complete graph
    g = g.append("g").attr("class", "graph graph-map");
    // draw graphs
    wait_for(axes.region.map_loaded, function() {
      var d = d3.nest().key(nest_column).key(nest_row).entries(graph.data());
      for (var i = 0; i < d.length; ++i) {
        var dj = d[i].values;
        var t  = settings("padding", "map")[2];
        for (var j = 0; j < dj.length; ++j) {
          // draw box for graph
          var gr = g.append("g").attr("class", "map")
            .attr("transform", "translate(" + l + "," + t + ")");
          gr.append("rect").attr("class", "background")
            .attr("width", w).attr("height", h);
          // draw map
          gr.selectAll("path").data(dj[j].values).enter().append("path")
            .attr("d", axes.region.scale).attr("class", axes.colour.scale);
          // next line
          t += h + settings("sep", "map");
        }
        l += w + settings("sep", "map");
      }
      // add events to the lines
      g.selectAll("path").on("mouseover", function(d, i) {
        var region = d[axes.region.variable()];
        dispatch.mouseover.call(g, axes.region.variable(), region, d);
      }).on("mouseout", function(d, i) {
        var region = d[axes.region.variable()];
        dispatch.mouseout.call(g, axes.region.variable(), region, d);
      }).on("click", function(d, i) {
        var region = d[axes.region.variable()];
        dispatch.click.call(g, axes.region.variable(), region, d);
      });
      // finished drawing call ready event
      dispatch.ready.call(g);
    });
  });


  // Local event handlers
  dispatch.on("mouseover.graph", function(variable, value, d) {
    this.selectAll("path").classed("colourlow", true);
    this.selectAll("path").filter(function(d, i) {
      return d[variable] == value;
    }).classed({"colourhigh": true, "colourlow": false});
  });
  dispatch.on("mouseout.graph", function(variable, value, d) {
    this.selectAll("path").classed({"colourhigh": false, "colourlow": false});
  });
  
  // tooltip
  if (d3.tip !== undefined) {
    var tip = d3.tip().direction("se").attr('class', 'tip tip-map').html(function(variable, value, d) { 
      var schema = graph.schema();
      var str = '';
      for (var field in schema.fields) {
        str += schema.fields[field].title + ': ' + d[schema.fields[field].name] + '</br>';
      }
      return str;
    });
    dispatch.on("ready.tip", function() {
      this.call(tip);
    });
    dispatch.on("mouseover.tip", function(variable, value, d) {
      tip.show(variable, value, d);
    });
    dispatch.on("mouseout.tip", function(variable, value, d) {
      tip.hide(variable, value, d);
    });
  }

  return graph;
}



function grph_label_size(g) {

  // a svg or g element to which  we will be adding our label in order to
  // request it's size
  var g_ = g;
  // store previously calculated values; as the size of certain labels are 
  // requested again and again this greatly enhances performance
  var sizes_ = {};

  function label_size(label) {
    if (sizes_[label]) {
      return sizes_[label];
    }
    if (!g_) return [undefined, undefined];
    var text = g_.append("text").text(label);
    var bbox = text[0][0].getBBox();
    var size = [bbox.width*1.2, bbox.height*0.65]; // TODO why; and is this always correct
    //var size = horizontal_ ? text[0][0].getComputedTextLength() :
      //text[0][0].getBBox().height;
    text.remove();
    sizes_[label] = size;
    return size;
  }

  label_size.svg = function(g) {
    if (arguments.length === 0) {
      return g_;
    } else {
      g_ = g;
      return this;
    }
  };

  label_size.width = function(label) {
    var size = label_size(label);
    return size[0];
  };

  label_size.height = function(label) {
    var size = label_size(label);
    return size[1];
  };

  return label_size;
}



function grph_scale_categorical() {

  var domain;
  var range = [0, 1];

  function scale(v) {
    var i = domain.indexOf(v);
    if (i < 0) return {l: undefined, m:undefined, u:undefined};
    var bw = (range[1] - range[0]) / domain.length;
    var m = bw*(i + 0.5);
    var w = bw*(1 - settings("bar_padding"))*0.5;
    return {l:m-w, m:m, u:m+w};
  }

  scale.l = function(v) {
    return scale(v).l;
  };

  scale.m = function(v) {
    return scale(v).m;
  };

  scale.u = function(v) {
    return scale(v).u;
  };

  scale.domain = function(d) {
    if (arguments.length === 0) {
      return domain;
    } else {
      domain = d;
      return this;
    }
  };

  scale.range = function(r) {
    if (arguments.length === 0) {
      return range;
    } else {
      range = r;
      return this;
    }
  };

  scale.ticks = function() {
    return domain;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.categorical = grph_scale_categorical;



function grph_scale_chloropleth() {

  var domain;
  var baseclass = "chloro";
  var ncolours  = 9;

  function scale(v) {
    if (domain === undefined) {
      // assume we have only 1 colour
      return baseclass + " " + baseclass + "n1" + " " + baseclass + 1;
    }
    var range  = domain[1] - domain[0];
    var val    = Math.sqrt((v - domain[0])*0.9999) / Math.sqrt(range);
    var cat    = Math.floor(val*ncolours);
    // returns something like "chloro chloron10 chloro4"
    return baseclass + " " + baseclass + "n" + ncolours + " " + baseclass + (cat+1);
  }

  scale.domain = function(d) {
    if (arguments.length === 0) {
      return domain;
    } else {
      domain = d;
      return this;
    }
  };

  scale.range = function(r) {
    if (arguments.length === 0) {
      return baseclass;
    } else {
      baseclass = r;
      return this;
    }
  };

  scale.ticks = function() {
    var step = (domain[1] - domain[0])/ncolours;
    var t = domain[0];
    var ticks = [];
    for (var i = 0; i <= ncolours; ++i) {
      ticks.push(t);
      t += step;
    }
    return ticks;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.chloropleth = grph_scale_chloropleth();



function grph_scale_colour() {

  var domain;
  var range = "colour";
  var ncolours;

  function scale(v) {
    if (domain === undefined) {
      // assume we have only 1 colour
      return range + " " + range + "n1" + " " + range + 1;
    }
    var i = domain.indexOf(v);
    // returns something like "colour colourn10 colour4"
    return range + " " + range + "n" + ncolours + " " + range + (i+1);
  }

  scale.domain = function(d) {
    if (arguments.length === 0) {
      return domain;
    } else {
      domain = d;
      ncolours = d.length;
      return this;
    }
  };

  scale.range = function(r) {
    if (arguments.length === 0) {
      return range;
    } else {
      range = r;
      return this;
    }
  };

  scale.ticks = function() {
    return domain;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.colour = grph_scale_colour();



function grph_scale_linear() {

  var lscale = d3.scale.linear();
  var label_size_ = 20;
  var padding_ = 5;
  var nticks_ = 10;
  var ticks_;
  var inside_ = true;

  function scale(v) {
    return lscale(v);
  }

  scale.domain = function(d) {
    d = lscale.domain(d);
    if (arguments.length === 0) {
      return d;
    } else {
      return this;
    }
  };

  scale.range = function(r) {
    r = lscale.range(r);
    if (arguments.length === 0) {
      return r;
    } else {
      return this;
    }
  };

  scale.label_size = function(label_size) {
    if (arguments.length === 0) {
      return label_size_;
    } else {
      label_size_ = label_size;
      return this;
    }
  };

  function lsize(label) {
    var size = typeof(label_size_) == "function" ? label_size_(label) : label_size_;
    size += padding_;
    return size;
  }

  scale.nticks = function(n) {
    if (arguments.length === 0) {
      return nticks_;
    } else {
      nticks_ = n;
      return this;
    }
  };

  scale.inside = function(i) {
    if (arguments.length === 0) {
      return inside_;
    } else {
      inside_ = i ? true : false;
      return this;
    }
  };

  scale.nice = function() {
    var r = lscale.range();
    var d = lscale.domain();
    var l = Math.abs(r[1] - r[0]);
    var w = wilkinson_ii(d[0], d[1], nticks_, lsize, l);
    if (inside_) {
      var w1 = lsize(w.labels[0]);
      var w2 = lsize(w.labels[w.labels.length-1]);
      var pad = w1/2 + w2/2;
      w = wilkinson_ii(d[0], d[1], nticks_, lsize, l-pad);
      if (r[0] < r[1]) {
        lscale.range([r[0]+w1/2, r[1]-w2/2]);
      } else {
        lscale.range([r[0]-w1/2, r[1]+w2/2]);
      }
    }
    domain = [w.lmin, w.lmax];
    lscale.domain([w.lmin, w.lmax]);
    ticks_ = w.labels;
    return this;
  };

  scale.ticks = function() {
    if (ticks_ === undefined) return lscale.ticks(nticks_);
    return ticks_;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.linear = grph_scale_linear();



function grph_scale_size() {
  
  var max;
  var domain;

  function scale(v) {
    if (domain === undefined) {
      return settings("default_bubble");
    } else {
      var m = max === undefined ? settings("max_bubble") : max;
      return m * Math.sqrt(v)/Math.sqrt(domain[1]);
    }
  }

  scale.domain = function(d) {
    if (arguments.length === 0) {
      return domain;
    } else {
      domain = d3.extent(d);
      return this;
    }
  };

  scale.range = function(r) {
    if (arguments.length === 0) {
      return max === undefined ? settings("max_bubble") : max;
    } else {
      max = d3.max(r);
      return this;
    }
  };

  scale.ticks = function() {
    return undefined;
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.size = grph_scale_size();




var settings = function() {
  var s = {
    'default' : {
      'padding' : [2, 2, 2, 2],
      'label_padding' : 4,
      'sep' : 8,
      'point_size' : 4,
      'max_bubble' : 20,
      'default_bubble' : 5,
      'bar_padding' : 0.4,
      'tick_length' : 5,
      'tick_padding' : 2
    }
  };

  function get(setting, type) {
    if (arguments.length === 0) {
      return settings;
    } else if (arguments.length === 2) {
      if (s[type] !== undefined && s[type][setting] !== undefined) {
        return s[type][setting];
      } else {
        return s.default[setting];
      }
    } else {
      return s.default[setting];
    }
  }

  get.set = function(setting, a, b) {
    if (arguments.length === 2) {
      s.default[setting] = a;
      return this;
    } else if (arguments.length === 3) {
      if (s[a] === undefined) s[a] = {};
      s[a][setting] = b;
      return this;
    } else {
      throw new Error("Need at leat two arguments.");
    }
  };

  return get;
}();

grph.settings = settings;


// Format a numeric value:
// - Make sure it is rounded to the correct number of decimals (ndec)
// - Use the correct decimal separator (dec)
// - Add a thousands separator (grp)
format_numeric = function(label, unit, ndec, dec, grp) {
  if (isNaN(label)) return '';
  if (unit === undefined) unit = '';
  if (dec === undefined) dec = ',';
  if (grp === undefined) grp = ' ';
  // round number
  if (ndec !== undefined) {
    label = label.toFixed(ndec);
  } else {
    label = label.toString();
  }
  // Following based on code from 
  // http://www.mredkj.com/javascript/numberFormat.html
  x     = label.split('.');
  x1    = x[0];
  x2    = x.length > 1 ? dec + x[1] : '';
  if (grp !== '') {
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + grp + '$2');
    }
  }
  return(x1 + x2 + unit);
};



// ============================================================================
// ====                         WILKINSON ALGORITHM                        ====
// ============================================================================


function wilkinson_ii(dmin, dmax, m, calc_label_width, axis_width, mmin, mmax, Q, precision, mincoverage) {
  // ============================ SUBROUTINES =================================

  // The following routine checks for overlap in the labels. This is used in the 
  // Wilkinson labeling algorithm below to ensure that the labels do not overlap.
  function overlap(lmin, lmax, lstep, calc_label_width, axis_width, ndec) {
    var width_max = lstep*axis_width/(lmax-lmin);
    for (var l = lmin; (l - lmax) <= 1E-10; l += lstep) {
      var w  = calc_label_width(l, ndec);
      if (w > width_max) return(true);
    }
    return(false);
  }

  // Perform one iteration of the Wilkinson algorithm
  function wilkinson_step(min, max, k, m, Q, mincoverage) {
    // default values
    Q               = Q         || [10, 1, 5, 2, 2.5, 3, 4, 1.5, 7, 6, 8, 9];
    precision       = precision || [1,  0, 0, 0,  -1, 0, 0,  -1, 0, 0, 0, 0];
    mincoverage     = mincoverage || 0.8;
    m               = m || k;
    // calculate some stats needed in loop
    var intervals   = k - 1;
    var delta       = (max - min) / intervals;
    var base        = Math.floor(Math.log(delta)/Math.LN10);
    var dbase       = Math.pow(10, base);
    // calculate granularity; one of the terms in score
    var granularity = 1 - Math.abs(k-m)/m;
    // initialise end result
    var best;
    // loop through all possible label positions with given k
    for(var i = 0; i < Q.length; i++) {
      // calculate label positions
      var tdelta = Q[i] * dbase;
      var tmin   = Math.floor(min/tdelta) * tdelta;
      var tmax   = tmin + intervals * tdelta;
      // calculate the number of decimals
      var ndec   = (base + precision[i]) < 0 ? Math.abs(base + precision[i]) : 0;
      // if label positions cover range
      if (tmin <= min && tmax >= max) {
        // calculate roundness and coverage part of score
        var roundness = 1 - (i - (tmin <= 0 && tmax >= 0)) / Q.length;
        var coverage  = (max-min)/(tmax-tmin);
        // if coverage high enough
        if (coverage > mincoverage && !overlap(tmin, tmax, tdelta, calc_label_width, axis_width, ndec)) {
          // calculate score
          var tnice = granularity + roundness + coverage;
          // if highest score
          if ((best === undefined) || (tnice > best.score)) {
            best = {
                'lmin'  : tmin,
                'lmax'  : tmax,
                'lstep' : tdelta,
                'score' : tnice,
                'ndec'  : ndec
              };
          }
        }
      }
    }
    // return
    return (best);
  }

  // =============================== MAIN =====================================
  // default values
  dmin             = Number(dmin);
  dmax             = Number(dmax);
  if (Math.abs(dmin - dmax) < 1E-10) {
    dmin = 0.96*dmin;
    dmax = 1.04*dmax;
  }
  calc_label_width = calc_label_width || function() { return(0);};
  axis_width       = axis_width || 1;
  Q                = Q         || [10, 1, 5, 2, 2.5, 3, 4, 1.5, 7, 6, 8, 9];
  precision        = precision || [1,  0, 0, 0,  -1, 0, 0,  -1, 0, 0, 0, 0];
  mincoverage      = mincoverage || 0.8;
  mmin             = mmin || 2;
  mmax             = mmax || Math.ceil(6*m);
  // initilise end result
  var best = {
      'lmin'  : dmin,
      'lmax'  : dmax,
      'lstep' : (dmax - dmin),
      'score' : -1E8,
      'ndec'  : 0
    };
  // calculate number of decimal places
  var x = String(best.lstep).split('.');
  best.ndec = x.length > 1 ? x[1].length : 0;
  // loop though all possible numbers of labels
  for (var k = mmin; k <= mmax; k++) { 
    // calculate best label position for current number of labels
    var result = wilkinson_step(dmin, dmax, k, m, Q, mincoverage);
    // check if current result has higher score
    if ((result !== undefined) && ((best === undefined) || (result.score > best.score))) {
      best = result;
    }
  }
  // generate label positions
  var labels = [];
  for (var l = best.lmin; (l - best.lmax) <= 1E-10; l += best.lstep) {
    labels.push(l);
  }
  best.labels = labels;
  return(best);
}



  
  grph.line = grph_graph_line;
  grph.map = grph_graph_map;
  grph.bubble = grph_graph_bubble;
  grph.bar = grph_graph_bar;

  this.grph = grph;

}());


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJlZ2luLmpzIiwiYXhpc19jYXRlZ29yaWNhbC5qcyIsImF4aXNfY2hsb3JvcGxldGguanMiLCJheGlzX2NvbG91ci5qcyIsImF4aXNfbGluZWFyLmpzIiwiYXhpc19yZWdpb24uanMiLCJheGlzX3NpemUuanMiLCJheGlzX3NwbGl0LmpzIiwiZGF0YXBhY2thZ2UuanMiLCJnZW5lcmljX2dyYXBoLmpzIiwiZ3JhcGguanMiLCJncmFwaF9iYXIuanMiLCJncmFwaF9idWJibGUuanMiLCJncmFwaF9saW5lLmpzIiwiZ3JhcGhfbWFwLmpzIiwibGFiZWxfc2l6ZS5qcyIsInNjYWxlX2NhdGVnb3JpY2FsLmpzIiwic2NhbGVfY2hsb3JvcGxldGguanMiLCJzY2FsZV9jb2xvdXIuanMiLCJzY2FsZV9saW5lYXIuanMiLCJzY2FsZV9zaXplLmpzIiwic2V0dGluZ3MuanMiLCJ3aWxraW5zb24uanMiLCJlbmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdycGguanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG4gIGdycGggPSB7fTtcbiIsIlxuZnVuY3Rpb24gZ3JwaF9heGlzX2NhdGVnb3JpY2FsKCkge1xuXG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY2F0ZWdvcmljYWwoKTtcbiAgdmFyIHdpZHRoO1xuICB2YXIgdmFyaWFibGUsIGhlaWdodDtcblxuICB2YXIgZHVtbXlfID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwiYXhpc19jYXRlZ29yaWNhbCBkdW1teVwiKVxuICAgIC5hdHRyKFwid2lkdGhcIiwgMCkuYXR0cihcImhlaWdodFwiLCAwKVxuICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gIHZhciBsYWJlbF9zaXplXyA9IGdycGhfbGFiZWxfc2l6ZShkdW1teV8pO1xuICAvL2lmIChob3Jpem9udGFsXykgc2NhbGVfLmxhYmVsX3NpemUobGFiZWxfc2l6ZV8ud2lkdGgpO1xuICAvL2Vsc2Ugc2NhbGVfLmxhYmVsX3NpemUobGFiZWxfc2l6ZV8uaGVpZ2h0KTtcbiAgXG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gICAgdmFyIHRpY2tzID0gYXhpcy50aWNrcygpO1xuICAgIGcuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGF4aXMud2lkdGgoKSkuYXR0cihcImhlaWdodFwiLCBheGlzLmhlaWdodCgpKTtcbiAgICBnLnNlbGVjdEFsbChcIi50aWNrXCIpLmRhdGEodGlja3MpLmVudGVyKClcbiAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tzXCIpXG4gICAgICAuYXR0cihcIngxXCIsIGF4aXMud2lkdGgoKSAtIHNldHRpbmdzKFwidGlja19sZW5ndGhcIikpXG4gICAgICAuYXR0cihcIngyXCIsIGF4aXMud2lkdGgoKSlcbiAgICAgIC5hdHRyKFwieTFcIiwgc2NhbGUubSkuYXR0cihcInkyXCIsIHNjYWxlLm0pO1xuICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tsYWJlbFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcbiAgICAgIC5hdHRyKFwieFwiLCBheGlzLndpZHRoKCkgLSBzZXR0aW5ncyhcInRpY2tfbGVuZ3RoXCIpIC0gc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpXG4gICAgICAuYXR0cihcInlcIiwgc2NhbGUubSlcbiAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7fSlcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgIC5hdHRyKFwiZHlcIiwgXCIwLjM1ZW1cIik7XG4gICAgZy5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcImF4aXNsaW5lXCIpXG4gICAgICAuYXR0cihcIngxXCIsIGF4aXMud2lkdGgoKSkuYXR0cihcIngyXCIsIGF4aXMud2lkdGgoKSlcbiAgICAgIC5hdHRyKFwieTFcIiwgMCkuIGF0dHIoXCJ5MlwiLCBheGlzLmhlaWdodCgpKTtcbiAgfVxuXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIGlmICh3aWR0aCA9PT0gdW5kZWZpbmVkKSB7Ly8gVE9ETyByZXNldCB3aWR0aF8gd2hlbiBsYWJlbHMgY2hhbmdlXG4gICAgICAgIHZhciB0aWNrcyA9IHNjYWxlLnRpY2tzKCk7XG4gICAgICAgIHZhciBtYXhfd2lkdGggPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgdmFyIGx3ID0gbGFiZWxfc2l6ZV8ud2lkdGgodGlja3NbaV0pO1xuICAgICAgICAgIGlmIChsdyA+IG1heF93aWR0aCkgbWF4X3dpZHRoID0gbHc7XG4gICAgICAgIH1cbiAgICAgICAgd2lkdGggPSBtYXhfd2lkdGggKyBzZXR0aW5ncyhcInRpY2tfbGVuZ3RoXCIpICsgc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIik7ICBcbiAgICAgIH1cbiAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB3O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWlnaHQgPSBoO1xuICAgICAgc2NhbGUucmFuZ2UoWzAsIGhdKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdzdHJpbmcnIHx8IHZzY2hlbWEudHlwZSA9PSAnY2F0ZWdvcmljYWwnIHx8XG4gICAgICB2c2NoZW1hLnR5cGUgPT0gJ3BlcmlvZCc7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZSA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZCA9IGRhdGEubWFwKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVdO30pO1xuICAgICAgLy8gZmlsdGVyIG91dCBkdXBsaWNhdGUgdmFsdWVzXG4gICAgICB2YXIgZG9tYWluID0gZC5maWx0ZXIoZnVuY3Rpb24odmFsdWUsIGluZGV4LCBzZWxmKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmluZGV4T2YodmFsdWUpID09PSBpbmRleDtcbiAgICAgIH0pO1xuICAgICAgc2NhbGUuZG9tYWluKGRvbWFpbik7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIHNjYWxlKHZbdmFyaWFibGVdKS5tO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2NhbGUodikubTtcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5zY2FsZS5sID0gZnVuY3Rpb24odikge1xuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcbiAgICAgIHJldHVybiBzY2FsZSh2W3ZhcmlhYmxlXSkubDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNjYWxlKHYpLmw7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuc2NhbGUudSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXG4gICAgICByZXR1cm4gc2NhbGUodlt2YXJpYWJsZV0pLnU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KS51O1xuICAgIH1cbiAgfTtcblxuICBheGlzLnNjYWxlLncgPSBmdW5jdGlvbih2KSB7XG4gICAgdmFyIHI7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgciA9IHNjYWxlKHZbdmFyaWFibGVdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgciA9IHNjYWxlKHYpO1xuICAgIH1cbiAgICByZXR1cm4gci51IC0gci5sO1xuICB9O1xuXG4gIHJldHVybiBheGlzO1xufVxuXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xuZ3JwaC5heGlzLmNhdGVnb3JpY2FsID0gZ3JwaF9heGlzX2NhdGVnb3JpY2FsKCk7XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9heGlzX2NobG9yb3BsZXRoKCkge1xuXG4gIHZhciB2YXJpYWJsZTtcbiAgdmFyIHdpZHRoLCBoZWlnaHQ7XG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY2hsb3JvcGxldGgoKTtcblxuICBmdW5jdGlvbiBheGlzKGcpIHtcbiAgfVxuXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB3O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWlnaHQgPSBoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZSA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodmFyaWFibGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XG4gICAgICBzY2FsZS5kb21haW4oZDMuZXh0ZW50KGRhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVdO30pKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNjYWxlLnRpY2tzKCk7XG4gIH07XG5cbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXG4gICAgICByZXR1cm4gYXhpcy5zY2FsZSh2W3ZhcmlhYmxlXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMuY2hsb3JvcGxldGggPSBncnBoX2F4aXNfY2hsb3JvcGxldGgoKTtcblxuIiwiXG5mdW5jdGlvbiBncnBoX2F4aXNfY29sb3VyKCkge1xuXG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY29sb3VyKCk7XG4gIHZhciB2YXJpYWJsZV87XG4gIHZhciB3aWR0aF8sIGhlaWdodF87XG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGhfID0gd2lkdGg7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodF87XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIgfHwgdnNjaGVtYS50eXBlID09IFwicGVyaW9kXCI7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlXztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyaWFibGVfID0gdjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gc2NhbGUuZG9tYWluKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh2YXJpYWJsZV8gPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XG4gICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgaWYgKHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIpIHtcbiAgICAgICAgY2F0ZWdvcmllcyA9IHZzY2hlbWEuY2F0ZWdvcmllcy5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5uYW1lOyB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWxzID0gZGF0YS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV9dO30pLnNvcnQoKTtcbiAgICAgICAgdmFyIHByZXY7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFscy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGlmICh2YWxzW2ldICE9IHByZXYpIGNhdGVnb3JpZXMucHVzaChcIlwiICsgdmFsc1tpXSk7XG4gICAgICAgICAgcHJldiA9IHZhbHNbaV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNjYWxlLmRvbWFpbihjYXRlZ29yaWVzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNjYWxlLnRpY2tzKCk7XG4gIH07XG5cbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXG4gICAgICByZXR1cm4gc2NhbGUodlt2YXJpYWJsZV9dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNjYWxlKHYpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gYXhpcztcbn1cblxuaWYgKGdycGguYXhpcyA9PT0gdW5kZWZpbmVkKSBncnBoLmF4aXMgPSB7fTtcbmdycGguYXhpcy5jb2xvdXIgPSBncnBoX2F4aXNfY29sb3VyKCk7XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9heGlzX2xpbmVhcihob3Jpem9udGFsKSB7XG5cbiAgdmFyIHNjYWxlXyA9IGdycGhfc2NhbGVfbGluZWFyKCk7XG4gIHZhciBob3Jpem9udGFsXyA9IGhvcml6b250YWw7XG4gIHZhciB2YXJpYWJsZV87XG4gIHZhciB3aWR0aF8sIGhlaWdodF87XG4gIHZhciBvcmlnaW5fO1xuICB2YXIgc2V0dGluZ3NfID0ge1xuICAgIFwidGlja19sZW5ndGhcIiA6IDUsXG4gICAgXCJ0aWNrX3BhZGRpbmdcIiA6IDIsXG4gICAgXCJwYWRkaW5nXCIgOiA0XG4gIH07XG5cbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmVhcmF4aXMgZHVtbXlcIilcbiAgICAuYXR0cihcIndpZHRoXCIsIDApLmF0dHIoXCJoZWlnaHRcIiwgMClcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcbiAgaWYgKGhvcml6b250YWxfKSBzY2FsZV8ubGFiZWxfc2l6ZShsYWJlbF9zaXplXy53aWR0aCk7XG4gIGVsc2Ugc2NhbGVfLmxhYmVsX3NpemUobGFiZWxfc2l6ZV8uaGVpZ2h0KTtcbiAgXG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gICAgdmFyIHRpY2tzID0gYXhpcy50aWNrcygpO1xuICAgIGcuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGF4aXMud2lkdGgoKSkuYXR0cihcImhlaWdodFwiLCBheGlzLmhlaWdodCgpKTtcbiAgICBpZiAoaG9yaXpvbnRhbCkge1xuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCBzY2FsZV8pLmF0dHIoXCJ4MlwiLCBzY2FsZV8pXG4gICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcInkyXCIsIHNldHRpbmdzXy50aWNrX2xlbmd0aCk7XG4gICAgICBnLnNlbGVjdEFsbChcIi50aWNrbGFiZWxcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHNjYWxlXykuYXR0cihcInlcIiwgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIwLjcxZW1cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB3ID0gYXhpcy53aWR0aCgpO1xuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCB3LXNldHRpbmdzXy50aWNrX2xlbmd0aCkuYXR0cihcIngyXCIsIHcpXG4gICAgICAgIC5hdHRyKFwieTFcIiwgc2NhbGVfKS5hdHRyKFwieTJcIiwgc2NhbGVfKTtcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tsYWJlbFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgc2V0dGluZ3NfLnBhZGRpbmcpLmF0dHIoXCJ5XCIsIHNjYWxlXylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiYmVnaW5cIilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKTtcbiAgICB9XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICBpZiAoaG9yaXpvbnRhbF8pIHtcbiAgICAgIC8vIGlmIGhvcml6b250YWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZ2l2ZW47IHRoaXMgZGVmaW5lcyB0aGUgcmFuZ2Ugb2ZcbiAgICAgIC8vIHRoZSBzY2FsZVxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZHRoXyA9IHdpZHRoO1xuICAgICAgICBzY2FsZV8ucmFuZ2UoWzAsIHdpZHRoX10pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdmVydGljYWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZGVmaW5lZCBieSB0aGUgZ3JhcGg6IHRoZSBzcGFjZSBpdFxuICAgICAgLy8gbmVlZHMgdG8gZHJhdyB0aGUgdGlja21hcmtzIGFuZCBsYWJlbHMgZXRjLiBcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGlmICh3aWR0aF8gPT09IHVuZGVmaW5lZCkgey8vIFRPRE8gcmVzZXQgd2lkdGhfIHdoZW4gbGFiZWxzIGNoYW5nZVxuICAgICAgICAgIHZhciB0aWNrcyA9IHNjYWxlXy50aWNrcygpO1xuICAgICAgICAgIHZhciB3ID0gMDtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbHcgPSBsYWJlbF9zaXplXy53aWR0aCh0aWNrc1tpXSk7XG4gICAgICAgICAgICBpZiAobHcgPiB3KSB3ID0gbHc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdpZHRoXyA9IHcgKyBzZXR0aW5nc18udGlja19sZW5ndGggKyBzZXR0aW5nc18udGlja19wYWRkaW5nICsgc2V0dGluZ3NfLnBhZGRpbmc7ICBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd2lkdGhfO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2lkdGhfID0gd2lkdGg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChob3Jpem9udGFsXykge1xuICAgICAgLy8gaWYgaG9yaXpvbnRhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBkZWZpbmVkIGJ5IHRoZSBncmFwaDogdGhlIHNwYWNlIGl0XG4gICAgICAvLyBuZWVkcyB0byBkcmF3IHRoZSB0aWNrbWFya3MgYW5kIGxhYmVscyBldGMuIFxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaWYgKGhlaWdodF8gPT09IHVuZGVmaW5lZCkgeyAvLyBUT0RPIHJlc2V0IGhlaWdodF8gd2hlbiBsYWJlbHMgY2hhbmdlXG4gICAgICAgICAgdmFyIHRpY2tzID0gc2NhbGVfLnRpY2tzKCk7XG4gICAgICAgICAgdmFyIGggPSAwO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGlja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBsaCA9IGxhYmVsX3NpemVfLmhlaWdodCh0aWNrc1tpXSk7XG4gICAgICAgICAgICBpZiAobGggPiBoKSBoID0gbGg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGhlaWdodF8gPSBoICsgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZyArIHNldHRpbmdzXy5wYWRkaW5nOyBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiB2ZXJ0aWNhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBnaXZlbjsgdGhpcyBkZWZpbmVzIHRoZSByYW5nZSBvZlxuICAgICAgLy8gdGhlIHNjYWxlXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICAgIHNjYWxlXy5yYW5nZShbaGVpZ2h0XywgMF0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnbnVtYmVyJztcbiAgfTtcblxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZV8gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzY2FsZV8uZG9tYWluKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciByYW5nZSA9IGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlX107fSk7XG4gICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XG4gICAgICBpZiAodnNjaGVtYS5vcmlnaW4pIG9yaWdpbl8gPSB2c2NoZW1hLm9yaWdpbjtcbiAgICAgIGlmIChvcmlnaW5fICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKHJhbmdlWzBdID4gb3JpZ2luXykgcmFuZ2VbMF0gPSBvcmlnaW5fO1xuICAgICAgICBpZiAocmFuZ2VbMV0gPCBvcmlnaW5fKSByYW5nZVsxXSA9IG9yaWdpbl87XG4gICAgICB9XG4gICAgICBzY2FsZV8uZG9tYWluKHJhbmdlKS5uaWNlKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5vcmlnaW4gPSBmdW5jdGlvbihvcmlnaW4pIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG9yaWdpbl87XG4gICAgfSBlbHNlIHtcbiAgICAgIG9yaWdpbl8gPSBvcmlnaW47XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZV8udGlja3MoKTtcbiAgfTtcblxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcbiAgICAgIHJldHVybiBzY2FsZV8odlt2YXJpYWJsZV9dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNjYWxlXyh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMubGluZWFyID0gZ3JwaF9heGlzX2xpbmVhcigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfYXhpc19yZWdpb24oKSB7XG5cbiAgdmFyIHZhcmlhYmxlXztcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcbiAgdmFyIG1hcF9sb2FkZWRfO1xuICB2YXIgbWFwXztcbiAgdmFyIGluZGV4XyA9IHt9O1xuXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xuICB9XG5cbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aF87XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IHVwZGF0ZV9wcm9qZWN0aW9uXyB8fCB3aWR0aF8gIT0gd2lkdGg7XG4gICAgICB3aWR0aF8gPSB3aWR0aDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdXBkYXRlX3Byb2plY3Rpb25fIHx8IGhlaWdodF8gIT0gaGVpZ2h0O1xuICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdzdHJpbmcnO1xuICB9O1xuXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhcmlhYmxlXyA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgLy8gVmFyaWFibGUgYW5kIGZ1bmN0aW9uIHRoYXQga2VlcHMgdHJhY2sgb2Ygd2hldGhlciBvciBub3QgdGhlIG1hcCBoYXMgXG4gIC8vIGZpbmlzaGVkIGxvYWRpbmcuIFRoZSBtZXRob2QgZG9tYWluKCkgbG9hZHMgdGhlIG1hcC4gSG93ZXZlciwgdGhpcyBoYXBwZW5zXG4gIC8vIGFzeW5jaHJvbm91c2x5LiBUaGVyZWZvcmUsIGl0IGlzIHBvc3NpYmxlIChhbmQgb2Z0ZW4gaGFwcGVucykgdGhhdCB0aGUgbWFwXG4gIC8vIGhhcyBub3QgeWV0IGxvYWRlZCB3aGVuIHNjYWxlKCkgYW5kIHRyYW5zZm9ybSgpIGFyZSBjYWxsZWQuIFRoZSBjb2RlIFxuICAvLyBjYWxsaW5nIHRoZXNlIG1ldGhvZHMgdGhlcmVmb3JlIG5lZWRzIHRvIHdhaXQgdW50aWwgdGhlIG1hcCBoYXMgbG9hZGVkLiBcbiAgdmFyIG1hcF9sb2FkaW5nXyA9IGZhbHNlOyBcbiAgYXhpcy5tYXBfbG9hZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICFtYXBfbG9hZGluZ187XG4gIH07XG5cbiAgZnVuY3Rpb24gbG9hZF9tYXAoZGF0YSwgc2NoZW1hLCBjYWxsYmFjaykge1xuICAgIGlmICh2YXJpYWJsZV8gPT09IHVuZGVmaW5lZCkgcmV0dXJuIDsgLy8gVE9ET1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcbiAgICBpZiAodnNjaGVtYS5tYXAgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDsgLy8gVE9ET1xuICAgIGlmICh2c2NoZW1hLm1hcCA9PSBtYXBfbG9hZGVkXykgcmV0dXJuOyBcbiAgICBtYXBfbG9hZGluZ18gPSB0cnVlO1xuICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyBpbiBkMy5qc29uXG4gICAgZDMuanNvbih2c2NoZW1hLm1hcCwgZnVuY3Rpb24oanNvbikge1xuICAgICAgbWFwX2xvYWRlZF8gPSB2c2NoZW1hLm1hcDtcbiAgICAgIGNhbGxiYWNrKGpzb24pO1xuICAgICAgbWFwX2xvYWRpbmdfID0gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvL3JldHVybiBzY2FsZS5kb21haW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9hZF9tYXAoZGF0YSwgc2NoZW1hLCBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgbWFwXyA9IG1hcDtcbiAgICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdHJ1ZTtcbiAgICAgICAgLy8gYnVpbGQgaW5kZXggbWFwcGluZyByZWdpb24gbmFtZSBvbiBmZWF0dXJlcyBcbiAgICAgICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGVfLCBzY2hlbWEpO1xuICAgICAgICB2YXIgcmVnaW9uaWQgPSB2c2NoZW1hLnJlZ2lvbmlkIHx8IFwiaWRcIjtcbiAgICAgICAgZm9yICh2YXIgZmVhdHVyZSBpbiBtYXBfLmZlYXR1cmVzKSB7XG4gICAgICAgICAgdmFyIG5hbWUgPSBtYXBfLmZlYXR1cmVzW2ZlYXR1cmVdLnByb3BlcnRpZXNbcmVnaW9uaWRdO1xuICAgICAgICAgIGluZGV4X1tuYW1lXSA9IGZlYXR1cmU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIGF4aXMuc2NhbGUodlt2YXJpYWJsZV9dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXhpcy51cGRhdGVfcHJvamVjdGlvbigpO1xuICAgICAgcmV0dXJuIHBhdGhfKG1hcF8uZmVhdHVyZXNbaW5kZXhfW3ZdXSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFRoZSBwcm9qZWN0aW9uLiBDYWxjdWxhdGluZyB0aGUgc2NhbGUgYW5kIHRyYW5zbGF0aW9uIG9mIHRoZSBwcm9qZWN0aW9uIFxuICAvLyB0YWtlcyB0aW1lLiBUaGVyZWZvcmUsIHdlIG9ubHkgd2FudCB0byBkbyB0aGF0IHdoZW4gbmVjZXNzYXJ5LiBcbiAgLy8gdXBkYXRlX3Byb2plY3Rpb25fIGtlZXBzIHRyYWNrIG9mIHdoZXRoZXIgb3Igbm90IHRoZSBwcm9qZWN0aW9uIG5lZWRzIFxuICAvLyByZWNhbGN1bGF0aW9uXG4gIHZhciB1cGRhdGVfcHJvamVjdGlvbl8gPSB0cnVlO1xuICAvLyB0aGUgcHJvamVjdGlvblxuICB2YXIgcHJvamVjdGlvbl8gPSBkMy5nZW8udHJhbnN2ZXJzZU1lcmNhdG9yKClcbiAgICAucm90YXRlKFstNS4zODcyMDYyMSwgLTUyLjE1NTE3NDQwXSkuc2NhbGUoMSkudHJhbnNsYXRlKFswLDBdKTtcbiAgdmFyIHBhdGhfID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2plY3Rpb25fKTtcbiAgLy8gZnVuY3Rpb24gdGhhdCByZWNhbGN1bGF0ZXMgdGhlIHNjYWxlIGFuZCB0cmFuc2xhdGlvbiBvZiB0aGUgcHJvamVjdGlvblxuICBheGlzLnVwZGF0ZV9wcm9qZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHVwZGF0ZV9wcm9qZWN0aW9uXyAmJiBtYXBfKSB7XG4gICAgICBwcm9qZWN0aW9uXy5zY2FsZSgxKS50cmFuc2xhdGUoWzAsMF0pO1xuICAgICAgcGF0aF8gPSBkMy5nZW8ucGF0aCgpLnByb2plY3Rpb24ocHJvamVjdGlvbl8pO1xuICAgICAgdmFyIGJvdW5kcyA9IHBhdGhfLmJvdW5kcyhtYXBfKTtcbiAgICAgIHZhciBzY2FsZSAgPSAwLjk1IC8gTWF0aC5tYXgoKGJvdW5kc1sxXVswXSAtIGJvdW5kc1swXVswXSkgLyB3aWR0aF8sIFxuICAgICAgICAgICAgICAgICAgKGJvdW5kc1sxXVsxXSAtIGJvdW5kc1swXVsxXSkgLyBoZWlnaHRfKTtcbiAgICAgIHZhciB0cmFuc2wgPSBbKHdpZHRoXyAtIHNjYWxlICogKGJvdW5kc1sxXVswXSArIGJvdW5kc1swXVswXSkpIC8gMiwgXG4gICAgICAgICAgICAgICAgICAoaGVpZ2h0XyAtIHNjYWxlICogKGJvdW5kc1sxXVsxXSArIGJvdW5kc1swXVsxXSkpIC8gMl07XG4gICAgICBwcm9qZWN0aW9uXy5zY2FsZShzY2FsZSkudHJhbnNsYXRlKHRyYW5zbCk7XG4gICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSBmYWxzZTtcbiAgICB9XG4gIH07XG5cblxuICByZXR1cm4gYXhpcztcbn1cblxuLy8gQSBmdW5jdGlvbiBleHBlY3RpbmcgdHdvIGZ1bmN0aW9ucy4gVGhlIHNlY29uZCBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB0aGUgXG4vLyBmaXJzdCBmdW5jdGlvbiByZXR1cm5zIHRydWUuIFdoZW4gdGhlIGZpcnN0IGZ1bmN0aW9uIGRvZXMgbm90IHJldHVybiB0cnVlXG4vLyB3ZSB3YWl0IGZvciAxMDBtcyBhbmQgdHJ5IGFnYWluLiBcbnZhciB3YWl0X2ZvciA9IGZ1bmN0aW9uKG0sIGYpIHtcbiAgaWYgKG0oKSkge1xuICAgIGYoKTtcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB3YWl0X2ZvcihtLCBmKTt9LCAxMDApO1xuICB9XG59O1xuXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xuZ3JwaC5heGlzLmxpbmVhciA9IGdycGhfYXhpc19saW5lYXIoKTtcblxuIiwiXG5mdW5jdGlvbiBncnBoX2F4aXNfc2l6ZSgpIHtcblxuICB2YXIgdmFyaWFibGVfO1xuICB2YXIgd2lkdGgsIGhlaWdodDtcbiAgdmFyIHNjYWxlID0gZ3JwaF9zY2FsZV9zaXplKCk7XG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24odykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gd2lkdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZHRoID0gdztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVpZ2h0ID0gaDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdudW1iZXInO1xuICB9O1xuXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB2YXJpYWJsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyaWFibGUgPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzY2FsZS5kb21haW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHZhcmlhYmxlID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzO1xuICAgICAgc2NhbGUuZG9tYWluKGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlXTt9KSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIGF4aXMuc2NhbGUodlt2YXJpYWJsZV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2NhbGUodik7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBheGlzO1xufVxuXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xuZ3JwaC5heGlzLnNpemUgPSBncnBoX2F4aXNfc2l6ZSgpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfYXhpc19zcGxpdCgpIHtcblxuICB2YXIgdmFyaWFibGVfO1xuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xuICB2YXIgZG9tYWluXztcbiAgdmFyIHNldHRpbmdzXyA9IHtcbiAgfTtcblxuICBmdW5jdGlvbiBheGlzKGcpIHtcbiAgfVxuXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gd2lkdGhfO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aWR0aF8gPSB3aWR0aDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICB9IGVsc2Uge1xuICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09IFwiY2F0ZWdvcmljYWxcIiB8fCB2c2NoZW1hLnR5cGUgPT0gXCJwZXJpb2RcIjtcbiAgfTtcblxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZV8gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuIFxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZG9tYWluXztcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHZhcmlhYmxlXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcbiAgICAgIHZhciBjYXRlZ29yaWVzID0gW107XG4gICAgICBpZiAodnNjaGVtYS50eXBlID09IFwiY2F0ZWdvcmljYWxcIikge1xuICAgICAgICBjYXRlZ29yaWVzID0gdnNjaGVtYS5jYXRlZ29yaWVzLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkLm5hbWU7IH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIHZhbHMgPSBkYXRhLm1hcChmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlX107fSkuc29ydCgpO1xuICAgICAgICB2YXIgcHJldjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWxzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgaWYgKHZhbHNbaV0gIT0gcHJldikgY2F0ZWdvcmllcy5wdXNoKFwiXCIgKyB2YWxzW2ldKTtcbiAgICAgICAgICBwcmV2ID0gdmFsc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZG9tYWluXyA9IGNhdGVnb3JpZXM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkb21haW5fO1xuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIGRvbWFpbl8uaW5kZXhPZih2KTtcbiAgfTtcblxuICByZXR1cm4gYXhpcztcbn1cbiIsIlxuZnVuY3Rpb24gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2hlbWEuZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNjaGVtYS5maWVsZHNbaV0ubmFtZSA9PSB2YXJpYWJsZSkgXG4gICAgICByZXR1cm4gc2NoZW1hLmZpZWxkc1tpXTtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuICBcbiIsIlxuZnVuY3Rpb24gZ3JwaF9nZW5lcmljX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCB0eXBlLCBncmFwaF9wYW5lbCkge1xuXG4gIHZhciBkdW1teV8gPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcInN2Z1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJkdW1teSBncmFwaCBncmFwaC1cIiArIHR5cGUpXG4gICAgLmF0dHIoXCJ3aWR0aFwiLCAwKS5hdHRyKFwiaGVpZ2h0XCIsIDApXG4gICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgdmFyIGxhYmVsX3NpemVfID0gZ3JwaF9sYWJlbF9zaXplKGR1bW15Xyk7XG5cblxuICB2YXIgZ3JhcGggPSBncnBoX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBmdW5jdGlvbihnKSB7XG4gICAgZnVuY3Rpb24gbmVzdF9jb2x1bW4oZCkge1xuICAgICAgcmV0dXJuIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sdW1uLnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmVzdF9yb3coZCkge1xuICAgICAgcmV0dXJuIGF4ZXMucm93LnZhcmlhYmxlKCkgPyBkW2F4ZXMucm93LnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgLy8gc2V0dXAgYXhlc1xuICAgIGZvciAodmFyIGF4aXMgaW4gYXhlcykgYXhlc1theGlzXS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgLy8gZGV0ZXJtaW5lIG51bWJlciBvZiByb3dzIGFuZCBjb2x1bW5zXG4gICAgdmFyIG5jb2wgPSBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gYXhlcy5jb2x1bW4udGlja3MoKS5sZW5ndGggOiAxO1xuICAgIHZhciBucm93ID0gYXhlcy5yb3cudmFyaWFibGUoKSA/IGF4ZXMucm93LnRpY2tzKCkubGVuZ3RoIDogMTtcbiAgICAvLyBnZXQgbGFiZWxzIGFuZCBkZXRlcm1pbmUgdGhlaXIgaGVpZ2h0XG4gICAgdmFyIHZzY2hlbWF4ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMueC52YXJpYWJsZSgpLCBzY2hlbWEpO1xuICAgIHZhciB4bGFiZWwgPSB2c2NoZW1heC50aXRsZTtcbiAgICB2YXIgbGFiZWxfaGVpZ2h0ID0gbGFiZWxfc2l6ZV8uaGVpZ2h0KHhsYWJlbCkgKyBzZXR0aW5ncygnbGFiZWxfcGFkZGluZycpO1xuICAgIHZhciB2c2NoZW1heSA9IHZhcmlhYmxlX3NjaGVtYShheGVzLnkudmFyaWFibGUoKSwgc2NoZW1hKTtcbiAgICB2YXIgeWxhYmVsID0gdnNjaGVtYXkudGl0bGU7XG4gICAgLy8gc2V0IHRoZSB3aWR0aCwgaGVpZ2h0IGVuZCBkb21haW4gb2YgdGhlIHgtIGFuZCB5LWF4ZXMuIFdlIG5lZWQgc29tZSBcbiAgICAvLyBpdGVyYXRpb25zIGZvciB0aGlzLCBhcyB0aGUgaGVpZ2h0IG9mIHRoZSB5LWF4aXMgZGVwZW5kcyBvZiB0aGUgaGVpZ2h0XG4gICAgLy8gb2YgdGhlIHgtYXhpcywgd2hpY2ggZGVwZW5kcyBvbiB0aGUgbGFiZWxzIG9mIHRoZSB4LWF4aXMsIHdoaWNoIGRlcGVuZHNcbiAgICAvLyBvbiB0aGUgd2lkdGggb2YgdGhlIHgtYXhpcywgZXRjLiBcbiAgICB2YXIgcm93bGFiZWxfd2lkdGggPSBheGVzLnJvdy52YXJpYWJsZSgpID8gMypsYWJlbF9oZWlnaHQgOiAwO1xuICAgIHZhciBjb2x1bW5sYWJlbF9oZWlnaHQgPSBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gMypsYWJlbF9oZWlnaHQgOiAwO1xuICAgIHZhciB3LCBoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgKytpKSB7XG4gICAgICB3ID0gZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0IC0gcm93bGFiZWxfd2lkdGg7XG4gICAgICB3ID0gKHcgLSAobmNvbC0xKSpzZXR0aW5ncygnc2VwJykpIC8gbmNvbDtcbiAgICAgIGF4ZXMueC53aWR0aCh3KS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgICBoID0gZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncygncGFkZGluZycpWzBdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSAtIFxuICAgICAgICBheGVzLnguaGVpZ2h0KCkgLSBsYWJlbF9oZWlnaHQgLSBjb2x1bW5sYWJlbF9oZWlnaHQ7XG4gICAgICBoID0gKGggLSAobnJvdy0xKSpzZXR0aW5ncygnc2VwJykpIC8gbnJvdztcbiAgICAgIGF4ZXMueS5oZWlnaHQoaCkuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIH1cbiAgICB2YXIgbCA9IGF4ZXMueS53aWR0aCgpICsgc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSArIGxhYmVsX2hlaWdodDtcbiAgICB2YXIgdCAgPSBzZXR0aW5ncygncGFkZGluZycpWzJdICsgY29sdW1ubGFiZWxfaGVpZ2h0O1xuICAgIC8vIGNyZWF0ZSBncm91cCBjb250YWluaW5nIGNvbXBsZXRlIGdyYXBoXG4gICAgZyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJncmFwaCBncmFwaC1cIiArIHR5cGUpO1xuICAgIC8vIGRyYXcgbGFiZWxzXG4gICAgdmFyIHljZW50ZXIgPSB0ICsgMC41KihncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMF0gLSBzZXR0aW5ncygncGFkZGluZycpWzJdIC0gXG4gICAgICAgIGF4ZXMueC5oZWlnaHQoKSAtIGxhYmVsX2hlaWdodCk7XG4gICAgdmFyIHhjZW50ZXIgPSBsICsgMC41KihncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbM10gLSBcbiAgICAgICAgYXhlcy55LndpZHRoKCkgLSBsYWJlbF9oZWlnaHQpO1xuICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC15XCIpXG4gICAgICAuYXR0cihcInhcIiwgc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSkuYXR0cihcInlcIiwgeWNlbnRlcilcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dCh5bGFiZWwpXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSg5MCBcIiArIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gKyBcIiBcIiArIHljZW50ZXIgKyBcIilcIik7XG4gICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXhcIilcbiAgICAgIC5hdHRyKFwieFwiLCB4Y2VudGVyKS5hdHRyKFwieVwiLCBncmFwaC5oZWlnaHQoKS1zZXR0aW5ncygncGFkZGluZycpWzBdKVxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KHhsYWJlbCk7XG4gICAgaWYgKGF4ZXMucm93LnZhcmlhYmxlKCkpIHtcbiAgICAgIHZhciB4cm93ID0gZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbM10gLSBsYWJlbF9oZWlnaHQ7XG4gICAgICB2YXIgdnNjaGVtYXJvdyA9IHZhcmlhYmxlX3NjaGVtYShheGVzLnJvdy52YXJpYWJsZSgpLCBzY2hlbWEpO1xuICAgICAgdmFyIHJvd2xhYmVsID0gdnNjaGVtYXJvdy50aXRsZTtcbiAgICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC15XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCB4cm93KS5hdHRyKFwieVwiLCB5Y2VudGVyKVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQocm93bGFiZWwpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgeHJvdyArIFwiIFwiICsgeWNlbnRlciArIFwiKVwiKTtcbiAgICB9XG4gICAgaWYgKGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkpIHtcbiAgICAgIHZhciB2c2NoZW1hY29sdW1uID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMuY29sdW1uLnZhcmlhYmxlKCksIHNjaGVtYSk7XG4gICAgICB2YXIgY29sdW1ubGFiZWwgPSB2c2NoZW1hY29sdW1uLnRpdGxlO1xuICAgICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXlcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHhjZW50ZXIpLmF0dHIoXCJ5XCIsIHNldHRpbmdzKFwicGFkZGluZ1wiKVsyXSkuYXR0cihcImR5XCIsIFwiMC43MWVtXCIpXG4gICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dChjb2x1bW5sYWJlbCk7XG4gICAgfVxuICAgIC8vIGNyZWF0ZSBlYWNoIG9mIHRoZSBwYW5lbHNcbiAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2x1bW4pLmtleShuZXN0X3JvdykuZW50cmllcyhncmFwaC5kYXRhKCkpO1xuICAgIGZvciAoaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZGogPSBkW2ldLnZhbHVlcztcbiAgICAgIHQgID0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSArIGNvbHVtbmxhYmVsX2hlaWdodDtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgLy8gZHJhdyB4LWF4aXNcbiAgICAgICAgaWYgKGogPT0gKGRqLmxlbmd0aC0xKSkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMteFwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyAodCArIGgpICsgXCIpXCIpLmNhbGwoYXhlcy54KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IHktYXhpc1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMteVwiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAobCAtIGF4ZXMueS53aWR0aCgpKSArIFwiLFwiICsgdCArIFwiKVwiKVxuICAgICAgICAgICAgLmNhbGwoYXhlcy55KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IHJvdyBsYWJlbHNcbiAgICAgICAgaWYgKGkgPT0gKGQubGVuZ3RoLTEpICYmIGF4ZXMucm93LnZhcmlhYmxlKCkpIHtcbiAgICAgICAgICB2YXIgcm93dGljayA9IGF4ZXMucm93LnRpY2tzKClbaV07XG4gICAgICAgICAgdmFyIGdyb3cgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLXJvd1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAobCArIHcpICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xuICAgICAgICAgIGdyb3cuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIGxhYmVsX2hlaWdodCArIDIqc2V0dGluZ3MoXCJ0aWNrX3BhZGRpbmdcIikpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoKTtcbiAgICAgICAgICBncm93LmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgMCkuYXR0cihcInlcIiwgaC8yKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoOTAgXCIgKyBcbiAgICAgICAgICAgICAgKGxhYmVsX2hlaWdodCAtIHNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKSArIFwiIFwiICsgaC8yICsgXCIpXCIpXG4gICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKVxuICAgICAgICAgICAgLnRleHQocm93dGljayk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZHJhdyBjb2x1bW4gbGFiZWxzXG4gICAgICAgIGlmIChqID09PSAwICYmIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkpIHtcbiAgICAgICAgICB2YXIgY29sdW1udGljayA9IGF4ZXMuY29sdW1uLnRpY2tzKClbaV07XG4gICAgICAgICAgdmFyIGNvbHRpY2toID0gbGFiZWxfaGVpZ2h0ICsgMipzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKTtcbiAgICAgICAgICB2YXIgZ2NvbHVtbiA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJheGlzIGF4aXMtY29sdW1uXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArICh0IC0gY29sdGlja2gpICsgXCIpXCIpO1xuICAgICAgICAgIGdjb2x1bW4uYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpXG4gICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBsYWJlbF9oZWlnaHQgKyAyKnNldHRpbmdzKFwidGlja19wYWRkaW5nXCIpKTtcbiAgICAgICAgICBnY29sdW1uLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXG4gICAgICAgICAgICAuYXR0cihcInhcIiwgdy8yKS5hdHRyKFwieVwiLCBzZXR0aW5ncyhcInRpY2tfcGFkZGluZ1wiKSlcbiAgICAgICAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikuYXR0cihcImR5XCIsIFwiMC43MWVtXCIpXG4gICAgICAgICAgICAudGV4dChjb2x1bW50aWNrKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IGJveCBmb3IgZ3JhcGhcbiAgICAgICAgdmFyIGdyID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInBhbmVsXCIpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xuICAgICAgICBnci5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XG4gICAgICAgIC8vIGRyYXcgZ3JpZFxuICAgICAgICB2YXIgeHRpY2tzID0gYXhlcy54LnRpY2tzKCk7XG4gICAgICAgIGdyLnNlbGVjdEFsbChcImxpbmUuZ3JpZHhcIikuZGF0YSh4dGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJncmlkIGdyaWR4XCIpXG4gICAgICAgICAgLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUpXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieTJcIiwgaCk7XG4gICAgICAgIHZhciB5dGlja3MgPSBheGVzLnkudGlja3MoKTtcbiAgICAgICAgZ3Iuc2VsZWN0QWxsKFwibGluZS5ncmlkeVwiKS5kYXRhKHl0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImdyaWQgZ3JpZHlcIilcbiAgICAgICAgICAuYXR0cihcIngxXCIsIDApLmF0dHIoXCJ4MlwiLCB3KVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKTtcbiAgICAgICAgLy8gYWRkIGNyb3NzaGFpcnMgdG8gZ3JhcGhcbiAgICAgICAgdmFyIGdjcm9zc2ggPSBnci5hcHBlbmQoXCJnXCIpLmNsYXNzZWQoXCJjcm9zc2hhaXJzXCIsIHRydWUpO1xuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcImhsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIGF4ZXMueC53aWR0aCgpKS5hdHRyKFwieTJcIiwgMClcbiAgICAgICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcInZsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIDApLmF0dHIoXCJ5MlwiLCBheGVzLnkuaGVpZ2h0KCkpXG4gICAgICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgLy8gZHJhdyBwYW5lbFxuICAgICAgICBncmFwaF9wYW5lbChnciwgZGpbal0udmFsdWVzKTtcbiAgICAgICAgLy8gbmV4dCBwYW5lbFxuICAgICAgICB0ICs9IGF4ZXMueS5oZWlnaHQoKSArIHNldHRpbmdzKCdzZXAnKTtcbiAgICAgIH1cbiAgICAgIGwgKz0gYXhlcy54LndpZHRoKCkgKyBzZXR0aW5ncygnc2VwJyk7XG4gICAgfVxuICAgIC8vIGZpbmlzaGVkIGRyYXdpbmcgY2FsbCByZWFkeSBldmVudFxuICAgIGRpc3BhdGNoLnJlYWR5LmNhbGwoZyk7XG4gIH0pO1xuXG4gIHJldHVybiBncmFwaDtcbn1cbiIsIlxuZnVuY3Rpb24gZ3JwaF9ncmFwaChheGVzLCBkaXNwYXRjaCwgZ3JhcGgpIHtcblxuICB2YXIgd2lkdGgsIGhlaWdodDtcbiAgdmFyIGRhdGEsIHNjaGVtYTtcblxuICBncmFwaC5heGVzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzLmtleXMoYXhlcyk7XG4gIH07XG5cbiAgZ3JhcGgud2lkdGggPSBmdW5jdGlvbih3KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB3O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGdyYXBoLmhlaWdodCA9IGZ1bmN0aW9uKGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVpZ2h0ID0gaDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBncmFwaC5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZXMsIGF4aXMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmIChheGVzW2F4aXNdID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBheGVzW2F4aXNdLmFjY2VwdCh2YXJpYWJsZXMsIHNjaGVtYSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgaW4gYXhlcykge1xuICAgICAgICBpZiAodmFyaWFibGVzW2ldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAoYXhlc1tpXS5yZXF1aXJlZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBhY2NlcHQgPSBheGVzW2ldLmFjY2VwdCh2YXJpYWJsZXNbaV0sIHNjaGVtYSk7XG4gICAgICAgICAgaWYgKCFhY2NlcHQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9O1xuXG4gIGdyYXBoLmFzc2lnbiA9IGZ1bmN0aW9uKHZhcmlhYmxlcykge1xuICAgIGZvciAodmFyIGkgaW4gYXhlcykgYXhlc1tpXS52YXJpYWJsZSh2YXJpYWJsZXNbaV0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIGdyYXBoLnNjaGVtYSA9IGZ1bmN0aW9uKHMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZW1hID0gcztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBncmFwaC5kYXRhID0gZnVuY3Rpb24oZCwgcykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGF0YSA9IGQ7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIFxuICAgICAgICBncmFwaC5zY2hlbWEocyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgZ3JhcGguZGlzcGF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZGlzcGF0Y2g7XG4gIH07XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG4iLCJcbmZ1bmN0aW9uIGdycGhfZ3JhcGhfYmFyKCkge1xuXG4gIHZhciBheGVzID0ge1xuICAgICd4JyA6IGdycGhfYXhpc19saW5lYXIodHJ1ZSkub3JpZ2luKDApLFxuICAgICd5JyA6IGdycGhfYXhpc19jYXRlZ29yaWNhbCgpLFxuICAgICdjb2xvdXInOiBncnBoX2F4aXNfY29sb3VyKCksXG4gICAgJ2NvbHVtbicgOiBncnBoX2F4aXNfc3BsaXQoKSxcbiAgICAncm93JyA6IGdycGhfYXhpc19zcGxpdCgpXG4gIH07XG4gIGF4ZXMueC5yZXF1aXJlZCA9IHRydWU7XG4gIGF4ZXMueS5yZXF1aXJlZCA9IHRydWU7XG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJjbGlja1wiLCBcInJlYWR5XCIpO1xuXG4gIHZhciBncmFwaCA9IGdycGhfZ2VuZXJpY19ncmFwaChheGVzLCBkaXNwYXRjaCwgXCJiYXJcIiwgZnVuY3Rpb24oZywgZGF0YSkge1xuICAgIGZ1bmN0aW9uIG5lc3RfY29sb3VyKGQpIHtcbiAgICAgIHJldHVybiBheGVzLmNvbG91ci52YXJpYWJsZSgpID8gZFtheGVzLmNvbG91ci52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldF94KGQpIHtcbiAgICAgIHZhciB2ID0gYXhlcy54LnNjYWxlKGQpO1xuICAgICAgcmV0dXJuIHYgPCBheGVzLnguc2NhbGUob3JpZ2luKSA/IHYgOiBheGVzLnguc2NhbGUob3JpZ2luKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZ2V0X3dpZHRoKGQpIHtcbiAgICAgIHJldHVybiBNYXRoLmFicyhheGVzLnguc2NhbGUoZCkgLSBheGVzLnguc2NhbGUob3JpZ2luKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldF95KGQpIHtcbiAgICAgIHJldHVybiBheGVzLnkuc2NhbGUubChkKSArIGkqYXhlcy55LnNjYWxlLncoZCkvbmNvbG91cnM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGdldF9oZWlnaHQoZCkge1xuICAgICAgcmV0dXJuIGF4ZXMueS5zY2FsZS53KGQpL25jb2xvdXJzO1xuICAgIH1cblxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbG91cikuZW50cmllcyhkYXRhKTtcbiAgICB2YXIgbmNvbG91cnMgPSBkLmxlbmd0aDtcbiAgICB2YXIgb3JpZ2luID0gYXhlcy54Lm9yaWdpbigpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGNvbG91ciA9IGF4ZXMuY29sb3VyLnNjYWxlKGRbaV0ua2V5KTtcbiAgICAgIGcuc2VsZWN0QWxsKFwicmVjdC5cIiArIGNvbG91cikuZGF0YShkW2ldLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXIgXCIgKyBjb2xvdXIpLmF0dHIoXCJ4XCIsIGdldF94KVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIGdldF93aWR0aCkuYXR0cihcInlcIiwgZ2V0X3kpLmF0dHIoXCJoZWlnaHRcIiwgZ2V0X2hlaWdodCk7XG4gICAgfVxuICAgIGcuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJvcmlnaW5cIilcbiAgICAgIC5hdHRyKFwieDFcIiwgYXhlcy54LnNjYWxlKG9yaWdpbikpXG4gICAgICAuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShvcmlnaW4pKVxuICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieTJcIiwgYXhlcy55LmhlaWdodCgpKTtcbiAgfSk7XG5cbiAgLy8gd2hlbiBmaW5pc2hlZCBkcmF3aW5nIGdyYXBoOyBhZGQgZXZlbnQgaGFuZGxlcnMgXG4gIGRpc3BhdGNoLm9uKFwicmVhZHlcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSkub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcbiAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgaWYgKHZhcmlhYmxlKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGF4ZXMuY29sb3VyLnNjYWxlKFwiXCIgKyB2YWx1ZSk7XG4gICAgICB2YXIgcmVnZXhwID0gL1xcYmNvbG91cihbMC05XSspXFxiLztcbiAgICAgIHZhciBjb2xvdXIgPSByZWdleHAuZXhlYyhjbGFzc2VzKVswXTtcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuXCIgKyBjb2xvdXIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKGQpKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKGQpKVxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShkKSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShkKSlcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICB9KTtcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gIH0pO1xuXG4gIC8vIFRvb2x0aXBcbiAgLy8gd2hlbiBkMy50aXAgaXMgbG9hZGVkXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciB0aXAgPSBkMy50aXAoKS5kaXJlY3Rpb24oXCJzZVwiKS5hdHRyKCdjbGFzcycsICd0aXAgdGlwLWJhcicpLmh0bWwoZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7IFxuICAgICAgdmFyIHNjaGVtYSA9IGdyYXBoLnNjaGVtYSgpO1xuICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgZm9yICh2YXIgZmllbGQgaW4gc2NoZW1hLmZpZWxkcykge1xuICAgICAgICBzdHIgKz0gc2NoZW1hLmZpZWxkc1tmaWVsZF0udGl0bGUgKyAnOiAnICsgZFtzY2hlbWEuZmllbGRzW2ZpZWxkXS5uYW1lXSArICc8L2JyPic7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH0pO1xuICAgIGRpc3BhdGNoLm9uKFwicmVhZHkudGlwXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5jYWxsKHRpcCk7XG4gICAgfSk7XG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgICAgdGlwLnNob3codmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KTtcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICAgIHRpcC5oaWRlKHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZ3JhcGg7XG59XG4iLCJcbmZ1bmN0aW9uIGdycGhfZ3JhcGhfYnViYmxlKCkge1xuXG4gIHZhciBheGVzID0ge1xuICAgICd4JyA6IGdycGhfYXhpc19saW5lYXIodHJ1ZSksXG4gICAgJ3knIDogZ3JwaF9heGlzX2xpbmVhcihmYWxzZSksXG4gICAgJ29iamVjdCcgOiBncnBoX2F4aXNfY29sb3VyKCksXG4gICAgJ3NpemUnICAgOiBncnBoX2F4aXNfc2l6ZSgpLFxuICAgICdjb2xvdXInIDogZ3JwaF9heGlzX2NvbG91cigpLFxuICAgICdjb2x1bW4nIDogZ3JwaF9heGlzX3NwbGl0KCksXG4gICAgJ3JvdycgOiBncnBoX2F4aXNfc3BsaXQoKVxuICB9O1xuICBheGVzLngucmVxdWlyZWQgPSB0cnVlO1xuICBheGVzLnkucmVxdWlyZWQgPSB0cnVlO1xuICBheGVzLm9iamVjdC5yZXF1aXJlZCA9IHRydWU7XG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJjbGlja1wiLCBcInJlYWR5XCIpO1xuXG4gIHZhciBncmFwaCA9IGdycGhfZ2VuZXJpY19ncmFwaChheGVzLCBkaXNwYXRjaCwgXCJidWJibGVcIiwgZnVuY3Rpb24oZywgZGF0YSkge1xuICAgIGZ1bmN0aW9uIG5lc3Rfb2JqZWN0KGQpIHtcbiAgICAgIHJldHVybiBheGVzLm9iamVjdC52YXJpYWJsZSgpID8gZFtheGVzLm9iamVjdC52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5lc3RfY29sb3VyKGQpIHtcbiAgICAgIHJldHVybiBheGVzLmNvbG91ci52YXJpYWJsZSgpID8gZFtheGVzLmNvbG91ci52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbG91cikuZW50cmllcyhkYXRhKTtcbiAgICAvLyBkcmF3IGJ1YmJsZXMgXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICBnLnNlbGVjdEFsbChcImNpcmNsZS5idWJibGVcIiArIGkpLmRhdGEoZFtpXS52YWx1ZXMpLmVudGVyKCkuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJidWJibGUgYnViYmxlXCIgKyBpICsgXCIgXCIgKyBheGVzLmNvbG91ci5zY2FsZShkW2ldLmtleSkpXG4gICAgICAgIC5hdHRyKFwiY3hcIiwgYXhlcy54LnNjYWxlKS5hdHRyKFwiY3lcIiwgYXhlcy55LnNjYWxlKVxuICAgICAgICAuYXR0cihcInJcIiwgYXhlcy5zaXplLnNjYWxlKTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgLy8gd2hlbiBmaW5pc2hlZCBkcmF3aW5nIGdyYXBoOyBhZGQgZXZlbnQgaGFuZGxlcnMgXG4gIGRpc3BhdGNoLm9uKFwicmVhZHlcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSkub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcbiAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgaWYgKHZhcmlhYmxlKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGF4ZXMuY29sb3VyLnNjYWxlKFwiXCIgKyB2YWx1ZSk7XG4gICAgICB2YXIgcmVnZXhwID0gL1xcYmNvbG91cihbMC05XSspXFxiLztcbiAgICAgIHZhciBjb2xvdXIgPSByZWdleHAuZXhlYyhjbGFzc2VzKVswXTtcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuXCIgKyBjb2xvdXIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKGQpKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKGQpKVxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShkKSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShkKSlcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICB9KTtcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gIH0pO1xuXG4gIC8vIFRvb2x0aXBcbiAgLy8gd2hlbiBkMy50aXAgaXMgbG9hZGVkXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciB0aXAgPSBkMy50aXAoKS5kaXJlY3Rpb24oXCJzZVwiKS5hdHRyKCdjbGFzcycsICd0aXAgdGlwLWJ1YmJsZScpLmh0bWwoZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7IFxuICAgICAgdmFyIHNjaGVtYSA9IGdyYXBoLnNjaGVtYSgpO1xuICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgZm9yICh2YXIgZmllbGQgaW4gc2NoZW1hLmZpZWxkcykge1xuICAgICAgICBzdHIgKz0gc2NoZW1hLmZpZWxkc1tmaWVsZF0udGl0bGUgKyAnOiAnICsgZFtzY2hlbWEuZmllbGRzW2ZpZWxkXS5uYW1lXSArICc8L2JyPic7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH0pO1xuICAgIGRpc3BhdGNoLm9uKFwicmVhZHkudGlwXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5jYWxsKHRpcCk7XG4gICAgfSk7XG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgICAgdGlwLnNob3codmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KTtcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICAgIHRpcC5oaWRlKHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSk7XG4gIH1cblxuXG4gIHJldHVybiBncmFwaDtcbn1cblxuIiwiXG5mdW5jdGlvbiBncnBoX2dyYXBoX2xpbmUoKSB7XG5cbiAgdmFyIGF4ZXMgPSB7XG4gICAgJ3gnIDogZ3JwaF9heGlzX2xpbmVhcih0cnVlKSxcbiAgICAneScgOiBncnBoX2F4aXNfbGluZWFyKGZhbHNlKSxcbiAgICAnY29sb3VyJyA6IGdycGhfYXhpc19jb2xvdXIoKSxcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcbiAgfTtcbiAgYXhlcy54LnJlcXVpcmVkID0gdHJ1ZTtcbiAgYXhlcy55LnJlcXVpcmVkID0gdHJ1ZTtcbiAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2goXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcInBvaW50b3ZlclwiLCBcInBvaW50b3V0XCIsXG4gICAgXCJjbGlja1wiLCBcInJlYWR5XCIpO1xuXG4gIHZhciBncmFwaCA9IGdycGhfZ2VuZXJpY19ncmFwaChheGVzLCBkaXNwYXRjaCwgXCJsaW5lXCIsIGZ1bmN0aW9uKGcsIGRhdGEpIHtcbiAgICBmdW5jdGlvbiBuZXN0X2NvbG91cihkKSB7XG4gICAgICByZXR1cm4gYXhlcy5jb2xvdXIudmFyaWFibGUoKSA/IGRbYXhlcy5jb2xvdXIudmFyaWFibGUoKV0gOiAxO1xuICAgIH1cbiAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2xvdXIpLmVudHJpZXMoZGF0YSk7XG4gICAgLy8gZHJhdyBsaW5lcyBcbiAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKCkueChheGVzLnguc2NhbGUpLnkoYXhlcy55LnNjYWxlKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcbiAgICAgIGcuYXBwZW5kKFwicGF0aFwiKS5hdHRyKFwiZFwiLCBsaW5lKGRbaV0udmFsdWVzKSlcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBheGVzLmNvbG91ci5zY2FsZShkW2ldLmtleSkpXG4gICAgICAgIC5kYXR1bShkW2ldKTtcbiAgICB9XG4gICAgLy8gZHJhdyBwb2ludHMgXG4gICAgZm9yIChpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBjbHMgPSBcImNpcmNsZVwiICsgaTtcbiAgICAgIGcuc2VsZWN0QWxsKFwiY2lyY2xlLmNpcmNsZVwiICsgaSkuZGF0YShkW2ldLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImNpcmNsZVwiICsgaSArIFwiIFwiICsgYXhlcy5jb2xvdXIuc2NhbGUoZFtpXS5rZXkpKVxuICAgICAgICAuYXR0cihcImN4XCIsIGF4ZXMueC5zY2FsZSkuYXR0cihcImN5XCIsIGF4ZXMueS5zY2FsZSlcbiAgICAgICAgLmF0dHIoXCJyXCIsIHNldHRpbmdzKCdwb2ludF9zaXplJykpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gd2hlbiBmaW5pc2hlZCBkcmF3aW5nIGdyYXBoOyBhZGQgZXZlbnQgaGFuZGxlcnMgXG4gIGRpc3BhdGNoLm9uKFwicmVhZHlcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgICBpZiAoIWQua2V5KSBkaXNwYXRjaC5wb2ludG92ZXIuY2FsbChzZWxmLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICAgIGlmICghZC5rZXkpIGRpc3BhdGNoLnBvaW50b3V0LmNhbGwoc2VsZiwgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XG4gICAgICBkaXNwYXRjaC5jbGljay5jYWxsKHNlbGYsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSk7XG4gIH0pO1xuICAvLyBMb2NhbCBldmVudCBoYW5kbGVyc1xuICAvLyBIaWdobGlnaHRpbmcgb2Ygc2VsZWN0ZWQgbGluZVxuICBkaXNwYXRjaC5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICBpZiAodmFyaWFibGUpIHtcbiAgICAgIHZhciBjbGFzc2VzID0gYXhlcy5jb2xvdXIuc2NhbGUoXCJcIiArIHZhbHVlKTtcbiAgICAgIHZhciByZWdleHAgPSAvXFxiY29sb3VyKFswLTldKylcXGIvO1xuICAgICAgdmFyIGNvbG91ciA9IHJlZ2V4cC5leGVjKGNsYXNzZXMpWzBdO1xuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLmNsYXNzZWQoXCJjb2xvdXJsb3dcIiwgdHJ1ZSk7XG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5cIiArIGNvbG91cikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IHRydWUsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XG4gICAgfVxuICB9KTtcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICB9KTtcbiAgLy8gU2hvdyBjcm9zc2hhaXJzIHdoZW4gaG92ZXJpbmcgb3ZlciBhIHBvaW50XG4gIGRpc3BhdGNoLm9uKFwicG9pbnRvdmVyXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLmF0dHIoXCJ5MVwiLCBheGVzLnkuc2NhbGUoZCkpLmF0dHIoXCJ5MlwiLCBheGVzLnkuc2NhbGUoZCkpXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5hdHRyKFwieDFcIiwgYXhlcy54LnNjYWxlKGQpKS5hdHRyKFwieDJcIiwgYXhlcy54LnNjYWxlKGQpKVxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XG4gIH0pO1xuICBkaXNwYXRjaC5vbihcInBvaW50b3V0XCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gIH0pO1xuXG4gIC8vIFRvb2x0aXBcbiAgLy8gd2hlbiBkMy50aXAgaXMgbG9hZGVkXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciB0aXAgPSBkMy50aXAoKS5kaXJlY3Rpb24oXCJzZVwiKS5hdHRyKCdjbGFzcycsICd0aXAgdGlwLWxpbmUnKS5odG1sKGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkgeyBcbiAgICAgIHZhciBzY2hlbWEgPSBncmFwaC5zY2hlbWEoKTtcbiAgICAgIHZhciBzdHIgPSAnJztcbiAgICAgIGZvciAodmFyIGZpZWxkIGluIHNjaGVtYS5maWVsZHMpIHtcbiAgICAgICAgc3RyICs9IHNjaGVtYS5maWVsZHNbZmllbGRdLnRpdGxlICsgJzogJyArIGRbc2NoZW1hLmZpZWxkc1tmaWVsZF0ubmFtZV0gKyAnPC9icj4nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9KTtcbiAgICBkaXNwYXRjaC5vbihcInJlYWR5LnRpcFwiLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY2FsbCh0aXApO1xuICAgIH0pO1xuICAgIGRpc3BhdGNoLm9uKFwicG9pbnRvdmVyLnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICAgIHRpcC5zaG93KHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSk7XG4gICAgZGlzcGF0Y2gub24oXCJwb2ludG91dC50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgICB0aXAuaGlkZSh2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG4iLCJcblxuZnVuY3Rpb24gZ3JwaF9ncmFwaF9tYXAoKSB7XG5cbiAgdmFyIGF4ZXMgPSB7XG4gICAgJ3JlZ2lvbicgOiBncnBoX2F4aXNfcmVnaW9uKCksXG4gICAgJ2NvbG91cicgOiBncnBoX2F4aXNfY2hsb3JvcGxldGgoKSxcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcbiAgfTtcbiAgYXhlcy5yZWdpb24ucmVxdWlyZWQgPSB0cnVlO1xuICBheGVzLmNvbG91ci5yZXF1aXJlZCA9IHRydWU7XG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwicmVhZHlcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcImNsaWNrXCIpO1xuXG4gIHZhciBncmFwaCA9IGdycGhfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIGZ1bmN0aW9uKGcpIHtcbiAgICBmdW5jdGlvbiBuZXN0X2NvbHVtbihkKSB7XG4gICAgICByZXR1cm4gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGRbYXhlcy5jb2x1bW4udmFyaWFibGUoKV0gOiAxO1xuICAgIH1cbiAgICBmdW5jdGlvbiBuZXN0X3JvdyhkKSB7XG4gICAgICByZXR1cm4gYXhlcy5yb3cudmFyaWFibGUoKSA/IGRbYXhlcy5yb3cudmFyaWFibGUoKV0gOiAxO1xuICAgIH1cbiAgICAvLyBzZXR1cCBheGVzXG4gICAgYXhlcy5yZWdpb24uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIGF4ZXMuY29sb3VyLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICBheGVzLmNvbHVtbi5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgYXhlcy5yb3cuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIC8vIGRldGVybWluZSBudW1iZXIgb2Ygcm93cyBhbmQgY29sdW1uc1xuICAgIHZhciBuY29sID0gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGF4ZXMuY29sdW1uLnRpY2tzKCkubGVuZ3RoIDogMTtcbiAgICB2YXIgbnJvdyA9IGF4ZXMucm93LnZhcmlhYmxlKCkgPyBheGVzLnJvdy50aWNrcygpLmxlbmd0aCA6IDE7XG4gICAgLy8gc2V0IHRoZSB3aWR0aCwgaGVpZ2h0IGVuZCBkb21haW4gb2YgdGhlIHgtIGFuZCB5LWF4ZXNcbiAgICB2YXIgdyA9IChncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzFdIC0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzNdIC0gXG4gICAgICAobmNvbC0xKSpzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKSkvbmNvbDtcbiAgICB2YXIgaCA9IChncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVswXSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsyXSAtIFxuICAgICAgKG5yb3ctMSkqc2V0dGluZ3MoXCJzZXBcIiwgXCJtYXBcIikpL25yb3c7XG4gICAgdmFyIGwgPSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMV07XG4gICAgdmFyIHQgID0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzJdO1xuICAgIGF4ZXMucmVnaW9uLndpZHRoKHcpLmhlaWdodChoKTtcbiAgICAvLyBjcmVhdGUgZ3JvdXAgY29udGFpbmluZyBjb21wbGV0ZSBncmFwaFxuICAgIGcgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiZ3JhcGggZ3JhcGgtbWFwXCIpO1xuICAgIC8vIGRyYXcgZ3JhcGhzXG4gICAgd2FpdF9mb3IoYXhlcy5yZWdpb24ubWFwX2xvYWRlZCwgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2x1bW4pLmtleShuZXN0X3JvdykuZW50cmllcyhncmFwaC5kYXRhKCkpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBkaiA9IGRbaV0udmFsdWVzO1xuICAgICAgICB2YXIgdCAgPSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMl07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAvLyBkcmF3IGJveCBmb3IgZ3JhcGhcbiAgICAgICAgICB2YXIgZ3IgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwibWFwXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArIHQgKyBcIilcIik7XG4gICAgICAgICAgZ3IuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XG4gICAgICAgICAgLy8gZHJhdyBtYXBcbiAgICAgICAgICBnci5zZWxlY3RBbGwoXCJwYXRoXCIpLmRhdGEoZGpbal0udmFsdWVzKS5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBheGVzLnJlZ2lvbi5zY2FsZSkuYXR0cihcImNsYXNzXCIsIGF4ZXMuY29sb3VyLnNjYWxlKTtcbiAgICAgICAgICAvLyBuZXh0IGxpbmVcbiAgICAgICAgICB0ICs9IGggKyBzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKTtcbiAgICAgICAgfVxuICAgICAgICBsICs9IHcgKyBzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKTtcbiAgICAgIH1cbiAgICAgIC8vIGFkZCBldmVudHMgdG8gdGhlIGxpbmVzXG4gICAgICBnLnNlbGVjdEFsbChcInBhdGhcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoZywgYXhlcy5yZWdpb24udmFyaWFibGUoKSwgcmVnaW9uLCBkKTtcbiAgICAgIH0pLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChnLCBheGVzLnJlZ2lvbi52YXJpYWJsZSgpLCByZWdpb24sIGQpO1xuICAgICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHZhciByZWdpb24gPSBkW2F4ZXMucmVnaW9uLnZhcmlhYmxlKCldO1xuICAgICAgICBkaXNwYXRjaC5jbGljay5jYWxsKGcsIGF4ZXMucmVnaW9uLnZhcmlhYmxlKCksIHJlZ2lvbiwgZCk7XG4gICAgICB9KTtcbiAgICAgIC8vIGZpbmlzaGVkIGRyYXdpbmcgY2FsbCByZWFkeSBldmVudFxuICAgICAgZGlzcGF0Y2gucmVhZHkuY2FsbChnKTtcbiAgICB9KTtcbiAgfSk7XG5cblxuICAvLyBMb2NhbCBldmVudCBoYW5kbGVyc1xuICBkaXNwYXRjaC5vbihcIm1vdXNlb3Zlci5ncmFwaFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcInBhdGhcIikuY2xhc3NlZChcImNvbG91cmxvd1wiLCB0cnVlKTtcbiAgICB0aGlzLnNlbGVjdEFsbChcInBhdGhcIikuZmlsdGVyKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHJldHVybiBkW3ZhcmlhYmxlXSA9PSB2YWx1ZTtcbiAgICB9KS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogdHJ1ZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcbiAgfSk7XG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdXQuZ3JhcGhcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiBmYWxzZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcbiAgfSk7XG4gIFxuICAvLyB0b29sdGlwXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciB0aXAgPSBkMy50aXAoKS5kaXJlY3Rpb24oXCJzZVwiKS5hdHRyKCdjbGFzcycsICd0aXAgdGlwLW1hcCcpLmh0bWwoZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7IFxuICAgICAgdmFyIHNjaGVtYSA9IGdyYXBoLnNjaGVtYSgpO1xuICAgICAgdmFyIHN0ciA9ICcnO1xuICAgICAgZm9yICh2YXIgZmllbGQgaW4gc2NoZW1hLmZpZWxkcykge1xuICAgICAgICBzdHIgKz0gc2NoZW1hLmZpZWxkc1tmaWVsZF0udGl0bGUgKyAnOiAnICsgZFtzY2hlbWEuZmllbGRzW2ZpZWxkXS5uYW1lXSArICc8L2JyPic7XG4gICAgICB9XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH0pO1xuICAgIGRpc3BhdGNoLm9uKFwicmVhZHkudGlwXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy5jYWxsKHRpcCk7XG4gICAgfSk7XG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIudGlwXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgICAgdGlwLnNob3codmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KTtcbiAgICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICAgIHRpcC5oaWRlKHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gZ3JhcGg7XG59XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9sYWJlbF9zaXplKGcpIHtcblxuICAvLyBhIHN2ZyBvciBnIGVsZW1lbnQgdG8gd2hpY2ggIHdlIHdpbGwgYmUgYWRkaW5nIG91ciBsYWJlbCBpbiBvcmRlciB0b1xuICAvLyByZXF1ZXN0IGl0J3Mgc2l6ZVxuICB2YXIgZ18gPSBnO1xuICAvLyBzdG9yZSBwcmV2aW91c2x5IGNhbGN1bGF0ZWQgdmFsdWVzOyBhcyB0aGUgc2l6ZSBvZiBjZXJ0YWluIGxhYmVscyBhcmUgXG4gIC8vIHJlcXVlc3RlZCBhZ2FpbiBhbmQgYWdhaW4gdGhpcyBncmVhdGx5IGVuaGFuY2VzIHBlcmZvcm1hbmNlXG4gIHZhciBzaXplc18gPSB7fTtcblxuICBmdW5jdGlvbiBsYWJlbF9zaXplKGxhYmVsKSB7XG4gICAgaWYgKHNpemVzX1tsYWJlbF0pIHtcbiAgICAgIHJldHVybiBzaXplc19bbGFiZWxdO1xuICAgIH1cbiAgICBpZiAoIWdfKSByZXR1cm4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXTtcbiAgICB2YXIgdGV4dCA9IGdfLmFwcGVuZChcInRleHRcIikudGV4dChsYWJlbCk7XG4gICAgdmFyIGJib3ggPSB0ZXh0WzBdWzBdLmdldEJCb3goKTtcbiAgICB2YXIgc2l6ZSA9IFtiYm94LndpZHRoKjEuMiwgYmJveC5oZWlnaHQqMC42NV07IC8vIFRPRE8gd2h5OyBhbmQgaXMgdGhpcyBhbHdheXMgY29ycmVjdFxuICAgIC8vdmFyIHNpemUgPSBob3Jpem9udGFsXyA/IHRleHRbMF1bMF0uZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKCkgOlxuICAgICAgLy90ZXh0WzBdWzBdLmdldEJCb3goKS5oZWlnaHQ7XG4gICAgdGV4dC5yZW1vdmUoKTtcbiAgICBzaXplc19bbGFiZWxdID0gc2l6ZTtcbiAgICByZXR1cm4gc2l6ZTtcbiAgfVxuXG4gIGxhYmVsX3NpemUuc3ZnID0gZnVuY3Rpb24oZykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZ187XG4gICAgfSBlbHNlIHtcbiAgICAgIGdfID0gZztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBsYWJlbF9zaXplLndpZHRoID0gZnVuY3Rpb24obGFiZWwpIHtcbiAgICB2YXIgc2l6ZSA9IGxhYmVsX3NpemUobGFiZWwpO1xuICAgIHJldHVybiBzaXplWzBdO1xuICB9O1xuXG4gIGxhYmVsX3NpemUuaGVpZ2h0ID0gZnVuY3Rpb24obGFiZWwpIHtcbiAgICB2YXIgc2l6ZSA9IGxhYmVsX3NpemUobGFiZWwpO1xuICAgIHJldHVybiBzaXplWzFdO1xuICB9O1xuXG4gIHJldHVybiBsYWJlbF9zaXplO1xufVxuXG4iLCJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfY2F0ZWdvcmljYWwoKSB7XG5cbiAgdmFyIGRvbWFpbjtcbiAgdmFyIHJhbmdlID0gWzAsIDFdO1xuXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcbiAgICB2YXIgaSA9IGRvbWFpbi5pbmRleE9mKHYpO1xuICAgIGlmIChpIDwgMCkgcmV0dXJuIHtsOiB1bmRlZmluZWQsIG06dW5kZWZpbmVkLCB1OnVuZGVmaW5lZH07XG4gICAgdmFyIGJ3ID0gKHJhbmdlWzFdIC0gcmFuZ2VbMF0pIC8gZG9tYWluLmxlbmd0aDtcbiAgICB2YXIgbSA9IGJ3KihpICsgMC41KTtcbiAgICB2YXIgdyA9IGJ3KigxIC0gc2V0dGluZ3MoXCJiYXJfcGFkZGluZ1wiKSkqMC41O1xuICAgIHJldHVybiB7bDptLXcsIG06bSwgdTptK3d9O1xuICB9XG5cbiAgc2NhbGUubCA9IGZ1bmN0aW9uKHYpIHtcbiAgICByZXR1cm4gc2NhbGUodikubDtcbiAgfTtcblxuICBzY2FsZS5tID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBzY2FsZSh2KS5tO1xuICB9O1xuXG4gIHNjYWxlLnUgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHNjYWxlKHYpLnU7XG4gIH07XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb21haW4gPSBkO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gcmFuZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmdlID0gcjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkb21haW47XG4gIH07XG5cbiAgcmV0dXJuIHNjYWxlO1xufVxuXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XG5ncnBoLnNjYWxlLmNhdGVnb3JpY2FsID0gZ3JwaF9zY2FsZV9jYXRlZ29yaWNhbDtcblxuIiwiXG5mdW5jdGlvbiBncnBoX3NjYWxlX2NobG9yb3BsZXRoKCkge1xuXG4gIHZhciBkb21haW47XG4gIHZhciBiYXNlY2xhc3MgPSBcImNobG9yb1wiO1xuICB2YXIgbmNvbG91cnMgID0gOTtcblxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XG4gICAgaWYgKGRvbWFpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBhc3N1bWUgd2UgaGF2ZSBvbmx5IDEgY29sb3VyXG4gICAgICByZXR1cm4gYmFzZWNsYXNzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyBcIm4xXCIgKyBcIiBcIiArIGJhc2VjbGFzcyArIDE7XG4gICAgfVxuICAgIHZhciByYW5nZSAgPSBkb21haW5bMV0gLSBkb21haW5bMF07XG4gICAgdmFyIHZhbCAgICA9IE1hdGguc3FydCgodiAtIGRvbWFpblswXSkqMC45OTk5KSAvIE1hdGguc3FydChyYW5nZSk7XG4gICAgdmFyIGNhdCAgICA9IE1hdGguZmxvb3IodmFsKm5jb2xvdXJzKTtcbiAgICAvLyByZXR1cm5zIHNvbWV0aGluZyBsaWtlIFwiY2hsb3JvIGNobG9yb24xMCBjaGxvcm80XCJcbiAgICByZXR1cm4gYmFzZWNsYXNzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyBcIm5cIiArIG5jb2xvdXJzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyAoY2F0KzEpO1xuICB9XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb21haW4gPSBkO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYmFzZWNsYXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXNlY2xhc3MgPSByO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0ZXAgPSAoZG9tYWluWzFdIC0gZG9tYWluWzBdKS9uY29sb3VycztcbiAgICB2YXIgdCA9IGRvbWFpblswXTtcbiAgICB2YXIgdGlja3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBuY29sb3VyczsgKytpKSB7XG4gICAgICB0aWNrcy5wdXNoKHQpO1xuICAgICAgdCArPSBzdGVwO1xuICAgIH1cbiAgICByZXR1cm4gdGlja3M7XG4gIH07XG5cbiAgcmV0dXJuIHNjYWxlO1xufVxuXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XG5ncnBoLnNjYWxlLmNobG9yb3BsZXRoID0gZ3JwaF9zY2FsZV9jaGxvcm9wbGV0aCgpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfY29sb3VyKCkge1xuXG4gIHZhciBkb21haW47XG4gIHZhciByYW5nZSA9IFwiY29sb3VyXCI7XG4gIHZhciBuY29sb3VycztcblxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XG4gICAgaWYgKGRvbWFpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBhc3N1bWUgd2UgaGF2ZSBvbmx5IDEgY29sb3VyXG4gICAgICByZXR1cm4gcmFuZ2UgKyBcIiBcIiArIHJhbmdlICsgXCJuMVwiICsgXCIgXCIgKyByYW5nZSArIDE7XG4gICAgfVxuICAgIHZhciBpID0gZG9tYWluLmluZGV4T2Yodik7XG4gICAgLy8gcmV0dXJucyBzb21ldGhpbmcgbGlrZSBcImNvbG91ciBjb2xvdXJuMTAgY29sb3VyNFwiXG4gICAgcmV0dXJuIHJhbmdlICsgXCIgXCIgKyByYW5nZSArIFwiblwiICsgbmNvbG91cnMgKyBcIiBcIiArIHJhbmdlICsgKGkrMSk7XG4gIH1cblxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpbiA9IGQ7XG4gICAgICBuY29sb3VycyA9IGQubGVuZ3RoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gcmFuZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmdlID0gcjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkb21haW47XG4gIH07XG5cbiAgcmV0dXJuIHNjYWxlO1xufVxuXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XG5ncnBoLnNjYWxlLmNvbG91ciA9IGdycGhfc2NhbGVfY29sb3VyKCk7XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9zY2FsZV9saW5lYXIoKSB7XG5cbiAgdmFyIGxzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSAyMDtcbiAgdmFyIHBhZGRpbmdfID0gNTtcbiAgdmFyIG50aWNrc18gPSAxMDtcbiAgdmFyIHRpY2tzXztcbiAgdmFyIGluc2lkZV8gPSB0cnVlO1xuXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcbiAgICByZXR1cm4gbHNjYWxlKHYpO1xuICB9XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIGQgPSBsc2NhbGUuZG9tYWluKGQpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xuICAgIHIgPSBsc2NhbGUucmFuZ2Uocik7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiByO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgc2NhbGUubGFiZWxfc2l6ZSA9IGZ1bmN0aW9uKGxhYmVsX3NpemUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGxhYmVsX3NpemVfO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYWJlbF9zaXplXyA9IGxhYmVsX3NpemU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gbHNpemUobGFiZWwpIHtcbiAgICB2YXIgc2l6ZSA9IHR5cGVvZihsYWJlbF9zaXplXykgPT0gXCJmdW5jdGlvblwiID8gbGFiZWxfc2l6ZV8obGFiZWwpIDogbGFiZWxfc2l6ZV87XG4gICAgc2l6ZSArPSBwYWRkaW5nXztcbiAgICByZXR1cm4gc2l6ZTtcbiAgfVxuXG4gIHNjYWxlLm50aWNrcyA9IGZ1bmN0aW9uKG4pIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG50aWNrc187XG4gICAgfSBlbHNlIHtcbiAgICAgIG50aWNrc18gPSBuO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLmluc2lkZSA9IGZ1bmN0aW9uKGkpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGluc2lkZV87XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2lkZV8gPSBpID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLm5pY2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgciA9IGxzY2FsZS5yYW5nZSgpO1xuICAgIHZhciBkID0gbHNjYWxlLmRvbWFpbigpO1xuICAgIHZhciBsID0gTWF0aC5hYnMoclsxXSAtIHJbMF0pO1xuICAgIHZhciB3ID0gd2lsa2luc29uX2lpKGRbMF0sIGRbMV0sIG50aWNrc18sIGxzaXplLCBsKTtcbiAgICBpZiAoaW5zaWRlXykge1xuICAgICAgdmFyIHcxID0gbHNpemUody5sYWJlbHNbMF0pO1xuICAgICAgdmFyIHcyID0gbHNpemUody5sYWJlbHNbdy5sYWJlbHMubGVuZ3RoLTFdKTtcbiAgICAgIHZhciBwYWQgPSB3MS8yICsgdzIvMjtcbiAgICAgIHcgPSB3aWxraW5zb25faWkoZFswXSwgZFsxXSwgbnRpY2tzXywgbHNpemUsIGwtcGFkKTtcbiAgICAgIGlmIChyWzBdIDwgclsxXSkge1xuICAgICAgICBsc2NhbGUucmFuZ2UoW3JbMF0rdzEvMiwgclsxXS13Mi8yXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsc2NhbGUucmFuZ2UoW3JbMF0tdzEvMiwgclsxXSt3Mi8yXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGRvbWFpbiA9IFt3LmxtaW4sIHcubG1heF07XG4gICAgbHNjYWxlLmRvbWFpbihbdy5sbWluLCB3LmxtYXhdKTtcbiAgICB0aWNrc18gPSB3LmxhYmVscztcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aWNrc18gPT09IHVuZGVmaW5lZCkgcmV0dXJuIGxzY2FsZS50aWNrcyhudGlja3NfKTtcbiAgICByZXR1cm4gdGlja3NfO1xuICB9O1xuXG4gIHJldHVybiBzY2FsZTtcbn1cblxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xuZ3JwaC5zY2FsZS5saW5lYXIgPSBncnBoX3NjYWxlX2xpbmVhcigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfc2l6ZSgpIHtcbiAgXG4gIHZhciBtYXg7XG4gIHZhciBkb21haW47XG5cbiAgZnVuY3Rpb24gc2NhbGUodikge1xuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHNldHRpbmdzKFwiZGVmYXVsdF9idWJibGVcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBtID0gbWF4ID09PSB1bmRlZmluZWQgPyBzZXR0aW5ncyhcIm1heF9idWJibGVcIikgOiBtYXg7XG4gICAgICByZXR1cm4gbSAqIE1hdGguc3FydCh2KS9NYXRoLnNxcnQoZG9tYWluWzFdKTtcbiAgICB9XG4gIH1cblxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpbiA9IGQzLmV4dGVudChkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG1heCA9PT0gdW5kZWZpbmVkID8gc2V0dGluZ3MoXCJtYXhfYnViYmxlXCIpIDogbWF4O1xuICAgIH0gZWxzZSB7XG4gICAgICBtYXggPSBkMy5tYXgocik7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9O1xuXG4gIHJldHVybiBzY2FsZTtcbn1cblxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xuZ3JwaC5zY2FsZS5zaXplID0gZ3JwaF9zY2FsZV9zaXplKCk7XG5cbiIsIlxuXG52YXIgc2V0dGluZ3MgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHMgPSB7XG4gICAgJ2RlZmF1bHQnIDoge1xuICAgICAgJ3BhZGRpbmcnIDogWzIsIDIsIDIsIDJdLFxuICAgICAgJ2xhYmVsX3BhZGRpbmcnIDogNCxcbiAgICAgICdzZXAnIDogOCxcbiAgICAgICdwb2ludF9zaXplJyA6IDQsXG4gICAgICAnbWF4X2J1YmJsZScgOiAyMCxcbiAgICAgICdkZWZhdWx0X2J1YmJsZScgOiA1LFxuICAgICAgJ2Jhcl9wYWRkaW5nJyA6IDAuNCxcbiAgICAgICd0aWNrX2xlbmd0aCcgOiA1LFxuICAgICAgJ3RpY2tfcGFkZGluZycgOiAyXG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGdldChzZXR0aW5nLCB0eXBlKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgIGlmIChzW3R5cGVdICE9PSB1bmRlZmluZWQgJiYgc1t0eXBlXVtzZXR0aW5nXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBzW3R5cGVdW3NldHRpbmddO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHMuZGVmYXVsdFtzZXR0aW5nXTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHMuZGVmYXVsdFtzZXR0aW5nXTtcbiAgICB9XG4gIH1cblxuICBnZXQuc2V0ID0gZnVuY3Rpb24oc2V0dGluZywgYSwgYikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICBzLmRlZmF1bHRbc2V0dGluZ10gPSBhO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICBpZiAoc1thXSA9PT0gdW5kZWZpbmVkKSBzW2FdID0ge307XG4gICAgICBzW2FdW3NldHRpbmddID0gYjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWVkIGF0IGxlYXQgdHdvIGFyZ3VtZW50cy5cIik7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBnZXQ7XG59KCk7XG5cbmdycGguc2V0dGluZ3MgPSBzZXR0aW5ncztcbiIsIlxuLy8gRm9ybWF0IGEgbnVtZXJpYyB2YWx1ZTpcbi8vIC0gTWFrZSBzdXJlIGl0IGlzIHJvdW5kZWQgdG8gdGhlIGNvcnJlY3QgbnVtYmVyIG9mIGRlY2ltYWxzIChuZGVjKVxuLy8gLSBVc2UgdGhlIGNvcnJlY3QgZGVjaW1hbCBzZXBhcmF0b3IgKGRlYylcbi8vIC0gQWRkIGEgdGhvdXNhbmRzIHNlcGFyYXRvciAoZ3JwKVxuZm9ybWF0X251bWVyaWMgPSBmdW5jdGlvbihsYWJlbCwgdW5pdCwgbmRlYywgZGVjLCBncnApIHtcbiAgaWYgKGlzTmFOKGxhYmVsKSkgcmV0dXJuICcnO1xuICBpZiAodW5pdCA9PT0gdW5kZWZpbmVkKSB1bml0ID0gJyc7XG4gIGlmIChkZWMgPT09IHVuZGVmaW5lZCkgZGVjID0gJywnO1xuICBpZiAoZ3JwID09PSB1bmRlZmluZWQpIGdycCA9ICcgJztcbiAgLy8gcm91bmQgbnVtYmVyXG4gIGlmIChuZGVjICE9PSB1bmRlZmluZWQpIHtcbiAgICBsYWJlbCA9IGxhYmVsLnRvRml4ZWQobmRlYyk7XG4gIH0gZWxzZSB7XG4gICAgbGFiZWwgPSBsYWJlbC50b1N0cmluZygpO1xuICB9XG4gIC8vIEZvbGxvd2luZyBiYXNlZCBvbiBjb2RlIGZyb20gXG4gIC8vIGh0dHA6Ly93d3cubXJlZGtqLmNvbS9qYXZhc2NyaXB0L251bWJlckZvcm1hdC5odG1sXG4gIHggICAgID0gbGFiZWwuc3BsaXQoJy4nKTtcbiAgeDEgICAgPSB4WzBdO1xuICB4MiAgICA9IHgubGVuZ3RoID4gMSA/IGRlYyArIHhbMV0gOiAnJztcbiAgaWYgKGdycCAhPT0gJycpIHtcbiAgICB2YXIgcmd4ID0gLyhcXGQrKShcXGR7M30pLztcbiAgICB3aGlsZSAocmd4LnRlc3QoeDEpKSB7XG4gICAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgZ3JwICsgJyQyJyk7XG4gICAgfVxuICB9XG4gIHJldHVybih4MSArIHgyICsgdW5pdCk7XG59O1xuXG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gPT09PSAgICAgICAgICAgICAgICAgICAgICAgICBXSUxLSU5TT04gQUxHT1JJVEhNICAgICAgICAgICAgICAgICAgICAgICAgPT09PVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cbmZ1bmN0aW9uIHdpbGtpbnNvbl9paShkbWluLCBkbWF4LCBtLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBtbWluLCBtbWF4LCBRLCBwcmVjaXNpb24sIG1pbmNvdmVyYWdlKSB7XG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT0gU1VCUk9VVElORVMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgLy8gVGhlIGZvbGxvd2luZyByb3V0aW5lIGNoZWNrcyBmb3Igb3ZlcmxhcCBpbiB0aGUgbGFiZWxzLiBUaGlzIGlzIHVzZWQgaW4gdGhlIFxuICAvLyBXaWxraW5zb24gbGFiZWxpbmcgYWxnb3JpdGhtIGJlbG93IHRvIGVuc3VyZSB0aGF0IHRoZSBsYWJlbHMgZG8gbm90IG92ZXJsYXAuXG4gIGZ1bmN0aW9uIG92ZXJsYXAobG1pbiwgbG1heCwgbHN0ZXAsIGNhbGNfbGFiZWxfd2lkdGgsIGF4aXNfd2lkdGgsIG5kZWMpIHtcbiAgICB2YXIgd2lkdGhfbWF4ID0gbHN0ZXAqYXhpc193aWR0aC8obG1heC1sbWluKTtcbiAgICBmb3IgKHZhciBsID0gbG1pbjsgKGwgLSBsbWF4KSA8PSAxRS0xMDsgbCArPSBsc3RlcCkge1xuICAgICAgdmFyIHcgID0gY2FsY19sYWJlbF93aWR0aChsLCBuZGVjKTtcbiAgICAgIGlmICh3ID4gd2lkdGhfbWF4KSByZXR1cm4odHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybihmYWxzZSk7XG4gIH1cblxuICAvLyBQZXJmb3JtIG9uZSBpdGVyYXRpb24gb2YgdGhlIFdpbGtpbnNvbiBhbGdvcml0aG1cbiAgZnVuY3Rpb24gd2lsa2luc29uX3N0ZXAobWluLCBtYXgsIGssIG0sIFEsIG1pbmNvdmVyYWdlKSB7XG4gICAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgICBRICAgICAgICAgICAgICAgPSBRICAgICAgICAgfHwgWzEwLCAxLCA1LCAyLCAyLjUsIDMsIDQsIDEuNSwgNywgNiwgOCwgOV07XG4gICAgcHJlY2lzaW9uICAgICAgID0gcHJlY2lzaW9uIHx8IFsxLCAgMCwgMCwgMCwgIC0xLCAwLCAwLCAgLTEsIDAsIDAsIDAsIDBdO1xuICAgIG1pbmNvdmVyYWdlICAgICA9IG1pbmNvdmVyYWdlIHx8IDAuODtcbiAgICBtICAgICAgICAgICAgICAgPSBtIHx8IGs7XG4gICAgLy8gY2FsY3VsYXRlIHNvbWUgc3RhdHMgbmVlZGVkIGluIGxvb3BcbiAgICB2YXIgaW50ZXJ2YWxzICAgPSBrIC0gMTtcbiAgICB2YXIgZGVsdGEgICAgICAgPSAobWF4IC0gbWluKSAvIGludGVydmFscztcbiAgICB2YXIgYmFzZSAgICAgICAgPSBNYXRoLmZsb29yKE1hdGgubG9nKGRlbHRhKS9NYXRoLkxOMTApO1xuICAgIHZhciBkYmFzZSAgICAgICA9IE1hdGgucG93KDEwLCBiYXNlKTtcbiAgICAvLyBjYWxjdWxhdGUgZ3JhbnVsYXJpdHk7IG9uZSBvZiB0aGUgdGVybXMgaW4gc2NvcmVcbiAgICB2YXIgZ3JhbnVsYXJpdHkgPSAxIC0gTWF0aC5hYnMoay1tKS9tO1xuICAgIC8vIGluaXRpYWxpc2UgZW5kIHJlc3VsdFxuICAgIHZhciBiZXN0O1xuICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgcG9zc2libGUgbGFiZWwgcG9zaXRpb25zIHdpdGggZ2l2ZW4ga1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBRLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBjYWxjdWxhdGUgbGFiZWwgcG9zaXRpb25zXG4gICAgICB2YXIgdGRlbHRhID0gUVtpXSAqIGRiYXNlO1xuICAgICAgdmFyIHRtaW4gICA9IE1hdGguZmxvb3IobWluL3RkZWx0YSkgKiB0ZGVsdGE7XG4gICAgICB2YXIgdG1heCAgID0gdG1pbiArIGludGVydmFscyAqIHRkZWx0YTtcbiAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbnVtYmVyIG9mIGRlY2ltYWxzXG4gICAgICB2YXIgbmRlYyAgID0gKGJhc2UgKyBwcmVjaXNpb25baV0pIDwgMCA/IE1hdGguYWJzKGJhc2UgKyBwcmVjaXNpb25baV0pIDogMDtcbiAgICAgIC8vIGlmIGxhYmVsIHBvc2l0aW9ucyBjb3ZlciByYW5nZVxuICAgICAgaWYgKHRtaW4gPD0gbWluICYmIHRtYXggPj0gbWF4KSB7XG4gICAgICAgIC8vIGNhbGN1bGF0ZSByb3VuZG5lc3MgYW5kIGNvdmVyYWdlIHBhcnQgb2Ygc2NvcmVcbiAgICAgICAgdmFyIHJvdW5kbmVzcyA9IDEgLSAoaSAtICh0bWluIDw9IDAgJiYgdG1heCA+PSAwKSkgLyBRLmxlbmd0aDtcbiAgICAgICAgdmFyIGNvdmVyYWdlICA9IChtYXgtbWluKS8odG1heC10bWluKTtcbiAgICAgICAgLy8gaWYgY292ZXJhZ2UgaGlnaCBlbm91Z2hcbiAgICAgICAgaWYgKGNvdmVyYWdlID4gbWluY292ZXJhZ2UgJiYgIW92ZXJsYXAodG1pbiwgdG1heCwgdGRlbHRhLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBuZGVjKSkge1xuICAgICAgICAgIC8vIGNhbGN1bGF0ZSBzY29yZVxuICAgICAgICAgIHZhciB0bmljZSA9IGdyYW51bGFyaXR5ICsgcm91bmRuZXNzICsgY292ZXJhZ2U7XG4gICAgICAgICAgLy8gaWYgaGlnaGVzdCBzY29yZVxuICAgICAgICAgIGlmICgoYmVzdCA9PT0gdW5kZWZpbmVkKSB8fCAodG5pY2UgPiBiZXN0LnNjb3JlKSkge1xuICAgICAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICAgICAgICAnbG1pbicgIDogdG1pbixcbiAgICAgICAgICAgICAgICAnbG1heCcgIDogdG1heCxcbiAgICAgICAgICAgICAgICAnbHN0ZXAnIDogdGRlbHRhLFxuICAgICAgICAgICAgICAgICdzY29yZScgOiB0bmljZSxcbiAgICAgICAgICAgICAgICAnbmRlYycgIDogbmRlY1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyByZXR1cm5cbiAgICByZXR1cm4gKGJlc3QpO1xuICB9XG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBNQUlOID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgZG1pbiAgICAgICAgICAgICA9IE51bWJlcihkbWluKTtcbiAgZG1heCAgICAgICAgICAgICA9IE51bWJlcihkbWF4KTtcbiAgaWYgKE1hdGguYWJzKGRtaW4gLSBkbWF4KSA8IDFFLTEwKSB7XG4gICAgZG1pbiA9IDAuOTYqZG1pbjtcbiAgICBkbWF4ID0gMS4wNCpkbWF4O1xuICB9XG4gIGNhbGNfbGFiZWxfd2lkdGggPSBjYWxjX2xhYmVsX3dpZHRoIHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4oMCk7fTtcbiAgYXhpc193aWR0aCAgICAgICA9IGF4aXNfd2lkdGggfHwgMTtcbiAgUSAgICAgICAgICAgICAgICA9IFEgICAgICAgICB8fCBbMTAsIDEsIDUsIDIsIDIuNSwgMywgNCwgMS41LCA3LCA2LCA4LCA5XTtcbiAgcHJlY2lzaW9uICAgICAgICA9IHByZWNpc2lvbiB8fCBbMSwgIDAsIDAsIDAsICAtMSwgMCwgMCwgIC0xLCAwLCAwLCAwLCAwXTtcbiAgbWluY292ZXJhZ2UgICAgICA9IG1pbmNvdmVyYWdlIHx8IDAuODtcbiAgbW1pbiAgICAgICAgICAgICA9IG1taW4gfHwgMjtcbiAgbW1heCAgICAgICAgICAgICA9IG1tYXggfHwgTWF0aC5jZWlsKDYqbSk7XG4gIC8vIGluaXRpbGlzZSBlbmQgcmVzdWx0XG4gIHZhciBiZXN0ID0ge1xuICAgICAgJ2xtaW4nICA6IGRtaW4sXG4gICAgICAnbG1heCcgIDogZG1heCxcbiAgICAgICdsc3RlcCcgOiAoZG1heCAtIGRtaW4pLFxuICAgICAgJ3Njb3JlJyA6IC0xRTgsXG4gICAgICAnbmRlYycgIDogMFxuICAgIH07XG4gIC8vIGNhbGN1bGF0ZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXNcbiAgdmFyIHggPSBTdHJpbmcoYmVzdC5sc3RlcCkuc3BsaXQoJy4nKTtcbiAgYmVzdC5uZGVjID0geC5sZW5ndGggPiAxID8geFsxXS5sZW5ndGggOiAwO1xuICAvLyBsb29wIHRob3VnaCBhbGwgcG9zc2libGUgbnVtYmVycyBvZiBsYWJlbHNcbiAgZm9yICh2YXIgayA9IG1taW47IGsgPD0gbW1heDsgaysrKSB7IFxuICAgIC8vIGNhbGN1bGF0ZSBiZXN0IGxhYmVsIHBvc2l0aW9uIGZvciBjdXJyZW50IG51bWJlciBvZiBsYWJlbHNcbiAgICB2YXIgcmVzdWx0ID0gd2lsa2luc29uX3N0ZXAoZG1pbiwgZG1heCwgaywgbSwgUSwgbWluY292ZXJhZ2UpO1xuICAgIC8vIGNoZWNrIGlmIGN1cnJlbnQgcmVzdWx0IGhhcyBoaWdoZXIgc2NvcmVcbiAgICBpZiAoKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSAmJiAoKGJlc3QgPT09IHVuZGVmaW5lZCkgfHwgKHJlc3VsdC5zY29yZSA+IGJlc3Quc2NvcmUpKSkge1xuICAgICAgYmVzdCA9IHJlc3VsdDtcbiAgICB9XG4gIH1cbiAgLy8gZ2VuZXJhdGUgbGFiZWwgcG9zaXRpb25zXG4gIHZhciBsYWJlbHMgPSBbXTtcbiAgZm9yICh2YXIgbCA9IGJlc3QubG1pbjsgKGwgLSBiZXN0LmxtYXgpIDw9IDFFLTEwOyBsICs9IGJlc3QubHN0ZXApIHtcbiAgICBsYWJlbHMucHVzaChsKTtcbiAgfVxuICBiZXN0LmxhYmVscyA9IGxhYmVscztcbiAgcmV0dXJuKGJlc3QpO1xufVxuXG5cbiIsIiAgXG4gIGdycGgubGluZSA9IGdycGhfZ3JhcGhfbGluZTtcbiAgZ3JwaC5tYXAgPSBncnBoX2dyYXBoX21hcDtcbiAgZ3JwaC5idWJibGUgPSBncnBoX2dyYXBoX2J1YmJsZTtcbiAgZ3JwaC5iYXIgPSBncnBoX2dyYXBoX2JhcjtcblxuICB0aGlzLmdycGggPSBncnBoO1xuXG59KCkpO1xuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=