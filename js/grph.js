(function() {
  grph = {};


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
    return vschema.type == 'categorical';
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
      var categories = vschema.categories.map(function(d) {
        return d.name; });
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
  var settings_ = {
    "tick_length" : 5,
    "tick_padding" : 2,
    "padding" : 4
  };

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "linearaxis dummy")
    .style("visibility", "invisible");
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
      scale_.domain(range).nice();
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

  var settings_ = {
  };

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
    return vschema.type == 'categorical';
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
      domain_ = vschema.categories.map(function(d) {
        return d.name; });
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
  var dispatch = d3.dispatch("mouseover", "mouseout", "click");

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "bubblegraph dummy")
    .style("visibility", "invisible");
  var label_size_ = grph_label_size(dummy_);

  var graph = grph_graph(axes, dispatch, function(g) {
    function nest_object(d) {
      return axes.object.variable() ? d[axes.object.variable()] : 1;
    }
    function nest_colour(d) {
      return axes.colour.variable() ? d[axes.colour.variable()] : 1;
    }
    function nest_column(d) {
      return axes.column.variable() ? d[axes.column.variable()] : 1;
    }
    function nest_row(d) {
      return axes.row.variable() ? d[axes.row.variable()] : 1;
    }
    // setup axes
    axes.colour.domain(graph.data(), graph.schema());
    //axes.object.domain(graph.data(), graph.schema()); TODO
    axes.size.domain(graph.data(), graph.schema());
    axes.column.domain(graph.data(), graph.schema());
    axes.row.domain(graph.data(), graph.schema());
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
    var w, h;
    for (var i = 0; i < 2; ++i) {
      w = graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height;
      w = (w - (ncol-1)*settings('sep')) / ncol;
      axes.x.width(w).domain(graph.data(), graph.schema());
      h = graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height;
      h = (h - (nrow-1)*settings('sep')) / nrow;
      axes.y.height(h).domain(graph.data(), graph.schema());
    }
    var l = axes.y.width() + settings('padding')[1] + label_height;
    var t  = settings('padding')[2];
    // draw labels
    var ycenter = t + 0.5*(graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height);
    var xcenter = l + 0.5*(graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height);
    g.append("text")
      .attr("x", settings('padding')[1]).attr("y", ycenter)
      .attr("text-anchor", "middle").text(ylabel)
      .attr("transform", "rotate(90 " + settings('padding')[1] + " " + ycenter + ")");
    g.append("text").attr("x", xcenter).attr("y", graph.height()-settings('padding')[0])
      .attr("text-anchor", "middle").text(xlabel);



    var d = d3.nest().key(nest_column).key(nest_row).key(nest_colour).entries(graph.data());

    for (i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      t  = settings('padding')[2];
      for (var j = 0; j < dj.length; ++j) {
        // draw x-axis
        if (j == (dj.length-1)) {
          g.append("g").attr("class", "xaxis")
            .attr("transform", "translate(" + l + "," + (t + h) + ")").call(axes.x);
        }
        // draw y-axis
        if (i === 0) {
          g.append("g").attr("class", "xaxis")
            .attr("transform", "translate(" + (l - axes.y.width()) + "," + t + ")")
            .call(axes.y);
        }
        // draw box for graph
        var gr = g.append("g").attr("class", "graph")
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
        // draw bubbles 
        var dk = dj[j].values;
        for (k = 0; k < dk.length; ++k) {
          var cls = "circle" + k;
          gr.selectAll("circle.bubble" + k).data(dk[k].values).enter().append("circle")
            .attr("class", "bubble bubble" + k + " " + axes.colour.scale(dk[k].key))
            .attr("cx", axes.x.scale).attr("cy", axes.y.scale)
            .attr("r", axes.size.scale);
        }
        // next line
        t += axes.y.height() + settings('sep');
      }
      l += axes.x.width() + settings('sep');
    }


    // add hover events to the lines and points
    g.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(g, variable, value, d);
    }).on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(g, variable, value, d);
    }).on("click", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.click.call(g, variable, value, d);
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
  // Show crosshairs when hovering over a point
  /*dispatch.on("pointover", function(variable, value, d) {
  });
  dispatch.on("pointout", function(variable, value, d) {
    this.selectAll(".hline").style("visibility", "hidden");
    this.selectAll(".vline").style("visibility", "hidden");
  });*/

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
    "click");

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "lineargraph dummy")
    .style("visibility", "invisible");
  var label_size_ = grph_label_size(dummy_);

  var graph = grph_graph(axes, dispatch, function(g) {
    function nest_colour(d) {
      return axes.colour.variable() ? d[axes.colour.variable()] : 1;
    }
    function nest_column(d) {
      return axes.column.variable() ? d[axes.column.variable()] : 1;
    }
    function nest_row(d) {
      return axes.row.variable() ? d[axes.row.variable()] : 1;
    }
    // setup axes
    axes.colour.domain(graph.data(), graph.schema());
    axes.column.domain(graph.data(), graph.schema());
    axes.row.domain(graph.data(), graph.schema());
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
    var w, h;
    for (var i = 0; i < 2; ++i) {
      w = graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height;
      w = (w - (ncol-1)*settings('sep')) / ncol;
      axes.x.width(w).domain(graph.data(), graph.schema());
      h = graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height;
      h = (h - (nrow-1)*settings('sep')) / nrow;
      axes.y.height(h).domain(graph.data(), graph.schema());
    }
    var l = axes.y.width() + settings('padding')[1] + label_height;
    var t  = settings('padding')[2];
    // draw labels
    var ycenter = t + 0.5*(graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height);
    var xcenter = l + 0.5*(graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height);
    g.append("text")
      .attr("x", settings('padding')[1]).attr("y", ycenter)
      .attr("text-anchor", "middle").text(ylabel)
      .attr("transform", "rotate(90 " + settings('padding')[1] + " " + ycenter + ")");
    g.append("text").attr("x", xcenter).attr("y", graph.height()-settings('padding')[0])
      .attr("text-anchor", "middle").text(xlabel);



    var d = d3.nest().key(nest_column).key(nest_row).key(nest_colour).entries(graph.data());

    for (i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      t  = settings('padding')[2];
      for (var j = 0; j < dj.length; ++j) {
        // draw x-axis
        if (j == (dj.length-1)) {
          g.append("g").attr("class", "xaxis")
            .attr("transform", "translate(" + l + "," + (t + h) + ")").call(axes.x);
        }
        // draw y-axis
        if (i === 0) {
          g.append("g").attr("class", "xaxis")
            .attr("transform", "translate(" + (l - axes.y.width()) + "," + t + ")")
            .call(axes.y);
        }
        // draw box for graph
        var gr = g.append("g").attr("class", "graph")
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
        // draw lines 
        var line = d3.svg.line().x(axes.x.scale).y(axes.y.scale);
        var dk = dj[j].values;
        for (var k = 0; k < dk.length; ++k) {
          gr.append("path").attr("d", line(dk[k].values))
            .attr("class", axes.colour.scale(dk[k].key))
            .datum(dk[k]);
        }
        // draw points 
        dk = dj[j].values;
        for (k = 0; k < dk.length; ++k) {
          var cls = "circle" + k;
          gr.selectAll("circle.circle" + k).data(dk[k].values).enter().append("circle")
            .attr("class", "circle" + k + " " + axes.colour.scale(dk[k].key))
            .attr("cx", axes.x.scale).attr("cy", axes.y.scale)
            .attr("r", settings('point_size'));
        }

        // next line
        t += axes.y.height() + settings('sep');
      }
      l += axes.x.width() + settings('sep');
    }


    // add hover events to the lines and points
    g.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(g, variable, value, d);
      if (!d.key) dispatch.pointover.call(g, variable, value, d);
    }).on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(g, variable, value, d);
      if (!d.key) dispatch.pointout.call(g, variable, value, d);
    }).on("click", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.click.call(g, variable, value, d);
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
  var dispatch = d3.dispatch("mouseover", "mouseout", "click");

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
    // draw graphs
    wait_for(axes.region.map_loaded, function() {
    var d = d3.nest().key(nest_column).key(nest_row).entries(graph.data());
    for (var i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      var t  = settings("padding", "map")[2];
      for (var j = 0; j < dj.length; ++j) {
        // draw box for graph
        var gr = svg.append("g").attr("class", "graph")
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
      'default_bubble' : 5
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

  this.grph = grph;

}());


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJlZ2luLmpzIiwiYXhpc19jaGxvcm9wbGV0aC5qcyIsImF4aXNfY29sb3VyLmpzIiwiYXhpc19saW5lYXIuanMiLCJheGlzX3JlZ2lvbi5qcyIsImF4aXNfc2l6ZS5qcyIsImF4aXNfc3BsaXQuanMiLCJkYXRhcGFja2FnZS5qcyIsImdyYXBoLmpzIiwiZ3JhcGhfYnViYmxlLmpzIiwiZ3JhcGhfbGluZS5qcyIsImdyYXBoX21hcC5qcyIsImxhYmVsX3NpemUuanMiLCJzY2FsZV9jaGxvcm9wbGV0aC5qcyIsInNjYWxlX2NvbG91ci5qcyIsInNjYWxlX2xpbmVhci5qcyIsInNjYWxlX3NpemUuanMiLCJzZXR0aW5ncy5qcyIsIndpbGtpbnNvbi5qcyIsImVuZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdycGguanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG4gIGdycGggPSB7fTtcbiIsIlxuZnVuY3Rpb24gZ3JwaF9heGlzX2NobG9yb3BsZXRoKCkge1xuXG4gIHZhciB2YXJpYWJsZTtcbiAgdmFyIHdpZHRoLCBoZWlnaHQ7XG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY2hsb3JvcGxldGgoKTtcblxuICBmdW5jdGlvbiBheGlzKGcpIHtcbiAgfVxuXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB3O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWlnaHQgPSBoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZSA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodmFyaWFibGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XG4gICAgICBzY2FsZS5kb21haW4oZDMuZXh0ZW50KGRhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVdO30pKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNjYWxlLnRpY2tzKCk7XG4gIH07XG5cbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXG4gICAgICByZXR1cm4gYXhpcy5zY2FsZSh2W3ZhcmlhYmxlXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMuY2hsb3JvcGxldGggPSBncnBoX2F4aXNfY2hsb3JvcGxldGgoKTtcblxuIiwiXG5mdW5jdGlvbiBncnBoX2F4aXNfY29sb3VyKCkge1xuXG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY29sb3VyKCk7XG4gIHZhciB2YXJpYWJsZV87XG4gIHZhciB3aWR0aF8sIGhlaWdodF87XG4gIHZhciBzZXR0aW5nc18gPSB7XG4gIH07XG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGhfID0gd2lkdGg7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodF87XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnY2F0ZWdvcmljYWwnO1xuICB9O1xuXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhcmlhYmxlXyA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodmFyaWFibGVfID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzO1xuICAgICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGVfLCBzY2hlbWEpO1xuICAgICAgdmFyIGNhdGVnb3JpZXMgPSB2c2NoZW1hLmNhdGVnb3JpZXMubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQubmFtZTsgfSk7XG4gICAgICBzY2FsZS5kb21haW4oY2F0ZWdvcmllcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIHNjYWxlKHZbdmFyaWFibGVfXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMuY29sb3VyID0gZ3JwaF9heGlzX2NvbG91cigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfYXhpc19saW5lYXIoaG9yaXpvbnRhbCkge1xuXG4gIHZhciBzY2FsZV8gPSBncnBoX3NjYWxlX2xpbmVhcigpO1xuICB2YXIgaG9yaXpvbnRhbF8gPSBob3Jpem9udGFsO1xuICB2YXIgdmFyaWFibGVfO1xuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xuICB2YXIgc2V0dGluZ3NfID0ge1xuICAgIFwidGlja19sZW5ndGhcIiA6IDUsXG4gICAgXCJ0aWNrX3BhZGRpbmdcIiA6IDIsXG4gICAgXCJwYWRkaW5nXCIgOiA0XG4gIH07XG5cbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmVhcmF4aXMgZHVtbXlcIilcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaW52aXNpYmxlXCIpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcbiAgaWYgKGhvcml6b250YWxfKSBzY2FsZV8ubGFiZWxfc2l6ZShsYWJlbF9zaXplXy53aWR0aCk7XG4gIGVsc2Ugc2NhbGVfLmxhYmVsX3NpemUobGFiZWxfc2l6ZV8uaGVpZ2h0KTtcbiAgXG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gICAgdmFyIHRpY2tzID0gYXhpcy50aWNrcygpO1xuICAgIGcuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGF4aXMud2lkdGgoKSkuYXR0cihcImhlaWdodFwiLCBheGlzLmhlaWdodCgpKTtcbiAgICBpZiAoaG9yaXpvbnRhbCkge1xuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCBzY2FsZV8pLmF0dHIoXCJ4MlwiLCBzY2FsZV8pXG4gICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcInkyXCIsIHNldHRpbmdzXy50aWNrX2xlbmd0aCk7XG4gICAgICBnLnNlbGVjdEFsbChcIi50aWNrbGFiZWxcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHNjYWxlXykuYXR0cihcInlcIiwgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIwLjcxZW1cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB3ID0gYXhpcy53aWR0aCgpO1xuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCB3LXNldHRpbmdzXy50aWNrX2xlbmd0aCkuYXR0cihcIngyXCIsIHcpXG4gICAgICAgIC5hdHRyKFwieTFcIiwgc2NhbGVfKS5hdHRyKFwieTJcIiwgc2NhbGVfKTtcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tsYWJlbFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgc2V0dGluZ3NfLnBhZGRpbmcpLmF0dHIoXCJ5XCIsIHNjYWxlXylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiYmVnaW5cIilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKTtcbiAgICB9XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICBpZiAoaG9yaXpvbnRhbF8pIHtcbiAgICAgIC8vIGlmIGhvcml6b250YWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZ2l2ZW47IHRoaXMgZGVmaW5lcyB0aGUgcmFuZ2Ugb2ZcbiAgICAgIC8vIHRoZSBzY2FsZVxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZHRoXyA9IHdpZHRoO1xuICAgICAgICBzY2FsZV8ucmFuZ2UoWzAsIHdpZHRoX10pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdmVydGljYWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZGVmaW5lZCBieSB0aGUgZ3JhcGg6IHRoZSBzcGFjZSBpdFxuICAgICAgLy8gbmVlZHMgdG8gZHJhdyB0aGUgdGlja21hcmtzIGFuZCBsYWJlbHMgZXRjLiBcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGlmICh3aWR0aF8gPT09IHVuZGVmaW5lZCkgey8vIFRPRE8gcmVzZXQgd2lkdGhfIHdoZW4gbGFiZWxzIGNoYW5nZVxuICAgICAgICAgIHZhciB0aWNrcyA9IHNjYWxlXy50aWNrcygpO1xuICAgICAgICAgIHZhciB3ID0gMDtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbHcgPSBsYWJlbF9zaXplXy53aWR0aCh0aWNrc1tpXSk7XG4gICAgICAgICAgICBpZiAobHcgPiB3KSB3ID0gbHc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdpZHRoXyA9IHcgKyBzZXR0aW5nc18udGlja19sZW5ndGggKyBzZXR0aW5nc18udGlja19wYWRkaW5nICsgc2V0dGluZ3NfLnBhZGRpbmc7ICBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd2lkdGhfO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2lkdGhfID0gd2lkdGg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChob3Jpem9udGFsXykge1xuICAgICAgLy8gaWYgaG9yaXpvbnRhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBkZWZpbmVkIGJ5IHRoZSBncmFwaDogdGhlIHNwYWNlIGl0XG4gICAgICAvLyBuZWVkcyB0byBkcmF3IHRoZSB0aWNrbWFya3MgYW5kIGxhYmVscyBldGMuIFxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaWYgKGhlaWdodF8gPT09IHVuZGVmaW5lZCkgeyAvLyBUT0RPIHJlc2V0IGhlaWdodF8gd2hlbiBsYWJlbHMgY2hhbmdlXG4gICAgICAgICAgdmFyIHRpY2tzID0gc2NhbGVfLnRpY2tzKCk7XG4gICAgICAgICAgdmFyIGggPSAwO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGlja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBsaCA9IGxhYmVsX3NpemVfLmhlaWdodCh0aWNrc1tpXSk7XG4gICAgICAgICAgICBpZiAobGggPiBoKSBoID0gbGg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGhlaWdodF8gPSBoICsgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZyArIHNldHRpbmdzXy5wYWRkaW5nOyBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiB2ZXJ0aWNhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBnaXZlbjsgdGhpcyBkZWZpbmVzIHRoZSByYW5nZSBvZlxuICAgICAgLy8gdGhlIHNjYWxlXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICAgIHNjYWxlXy5yYW5nZShbaGVpZ2h0XywgMF0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnbnVtYmVyJztcbiAgfTtcblxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZV8gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzY2FsZV8uZG9tYWluKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciByYW5nZSA9IGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlX107fSk7XG4gICAgICBzY2FsZV8uZG9tYWluKHJhbmdlKS5uaWNlKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZV8udGlja3MoKTtcbiAgfTtcblxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcbiAgICAgIHJldHVybiBzY2FsZV8odlt2YXJpYWJsZV9dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNjYWxlXyh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMubGluZWFyID0gZ3JwaF9heGlzX2xpbmVhcigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfYXhpc19yZWdpb24oKSB7XG5cbiAgdmFyIHZhcmlhYmxlXztcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcbiAgdmFyIG1hcF9sb2FkZWRfO1xuICB2YXIgbWFwXztcbiAgdmFyIGluZGV4XyA9IHt9O1xuXG4gIHZhciBzZXR0aW5nc18gPSB7XG4gIH07XG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdXBkYXRlX3Byb2plY3Rpb25fIHx8IHdpZHRoXyAhPSB3aWR0aDtcbiAgICAgIHdpZHRoXyA9IHdpZHRoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBoZWlnaHRfO1xuICAgIH0gZWxzZSB7XG4gICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSB1cGRhdGVfcHJvamVjdGlvbl8gfHwgaGVpZ2h0XyAhPSBoZWlnaHQ7XG4gICAgICBoZWlnaHRfID0gaGVpZ2h0O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ3N0cmluZyc7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlXztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyaWFibGVfID0gdjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICAvLyBWYXJpYWJsZSBhbmQgZnVuY3Rpb24gdGhhdCBrZWVwcyB0cmFjayBvZiB3aGV0aGVyIG9yIG5vdCB0aGUgbWFwIGhhcyBcbiAgLy8gZmluaXNoZWQgbG9hZGluZy4gVGhlIG1ldGhvZCBkb21haW4oKSBsb2FkcyB0aGUgbWFwLiBIb3dldmVyLCB0aGlzIGhhcHBlbnNcbiAgLy8gYXN5bmNocm9ub3VzbHkuIFRoZXJlZm9yZSwgaXQgaXMgcG9zc2libGUgKGFuZCBvZnRlbiBoYXBwZW5zKSB0aGF0IHRoZSBtYXBcbiAgLy8gaGFzIG5vdCB5ZXQgbG9hZGVkIHdoZW4gc2NhbGUoKSBhbmQgdHJhbnNmb3JtKCkgYXJlIGNhbGxlZC4gVGhlIGNvZGUgXG4gIC8vIGNhbGxpbmcgdGhlc2UgbWV0aG9kcyB0aGVyZWZvcmUgbmVlZHMgdG8gd2FpdCB1bnRpbCB0aGUgbWFwIGhhcyBsb2FkZWQuIFxuICB2YXIgbWFwX2xvYWRpbmdfID0gZmFsc2U7IFxuICBheGlzLm1hcF9sb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gIW1hcF9sb2FkaW5nXztcbiAgfTtcblxuICBmdW5jdGlvbiBsb2FkX21hcChkYXRhLCBzY2hlbWEsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHZhcmlhYmxlXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gOyAvLyBUT0RPXG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGVfLCBzY2hlbWEpO1xuICAgIGlmICh2c2NoZW1hLm1hcCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gOyAvLyBUT0RPXG4gICAgaWYgKHZzY2hlbWEubWFwID09IG1hcF9sb2FkZWRfKSByZXR1cm47IFxuICAgIG1hcF9sb2FkaW5nXyA9IHRydWU7XG4gICAgLy8gVE9ETyBoYW5kbGUgZXJyb3JzIGluIGQzLmpzb25cbiAgICBkMy5qc29uKHZzY2hlbWEubWFwLCBmdW5jdGlvbihqc29uKSB7XG4gICAgICBtYXBfbG9hZGVkXyA9IHZzY2hlbWEubWFwO1xuICAgICAgY2FsbGJhY2soanNvbik7XG4gICAgICBtYXBfbG9hZGluZ18gPSBmYWxzZTtcbiAgICB9KTtcbiAgfVxuXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2FkX21hcChkYXRhLCBzY2hlbWEsIGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICBtYXBfID0gbWFwO1xuICAgICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSB0cnVlO1xuICAgICAgICAvLyBidWlsZCBpbmRleCBtYXBwaW5nIHJlZ2lvbiBuYW1lIG9uIGZlYXR1cmVzIFxuICAgICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XG4gICAgICAgIHZhciByZWdpb25pZCA9IHZzY2hlbWEucmVnaW9uaWQgfHwgXCJpZFwiO1xuICAgICAgICBmb3IgKHZhciBmZWF0dXJlIGluIG1hcF8uZmVhdHVyZXMpIHtcbiAgICAgICAgICB2YXIgbmFtZSA9IG1hcF8uZmVhdHVyZXNbZmVhdHVyZV0ucHJvcGVydGllc1tyZWdpb25pZF07XG4gICAgICAgICAgaW5kZXhfW25hbWVdID0gZmVhdHVyZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXG4gICAgICByZXR1cm4gYXhpcy5zY2FsZSh2W3ZhcmlhYmxlX10pO1xuICAgIH0gZWxzZSB7XG4gICAgICBheGlzLnVwZGF0ZV9wcm9qZWN0aW9uKCk7XG4gICAgICByZXR1cm4gcGF0aF8obWFwXy5mZWF0dXJlc1tpbmRleF9bdl1dKTtcbiAgICB9XG4gIH07XG5cbiAgLy8gVGhlIHByb2plY3Rpb24uIENhbGN1bGF0aW5nIHRoZSBzY2FsZSBhbmQgdHJhbnNsYXRpb24gb2YgdGhlIHByb2plY3Rpb24gXG4gIC8vIHRha2VzIHRpbWUuIFRoZXJlZm9yZSwgd2Ugb25seSB3YW50IHRvIGRvIHRoYXQgd2hlbiBuZWNlc3NhcnkuIFxuICAvLyB1cGRhdGVfcHJvamVjdGlvbl8ga2VlcHMgdHJhY2sgb2Ygd2hldGhlciBvciBub3QgdGhlIHByb2plY3Rpb24gbmVlZHMgXG4gIC8vIHJlY2FsY3VsYXRpb25cbiAgdmFyIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IHRydWU7XG4gIC8vIHRoZSBwcm9qZWN0aW9uXG4gIHZhciBwcm9qZWN0aW9uXyA9IGQzLmdlby50cmFuc3ZlcnNlTWVyY2F0b3IoKVxuICAgIC5yb3RhdGUoWy01LjM4NzIwNjIxLCAtNTIuMTU1MTc0NDBdKS5zY2FsZSgxKS50cmFuc2xhdGUoWzAsMF0pO1xuICB2YXIgcGF0aF8gPSBkMy5nZW8ucGF0aCgpLnByb2plY3Rpb24ocHJvamVjdGlvbl8pO1xuICAvLyBmdW5jdGlvbiB0aGF0IHJlY2FsY3VsYXRlcyB0aGUgc2NhbGUgYW5kIHRyYW5zbGF0aW9uIG9mIHRoZSBwcm9qZWN0aW9uXG4gIGF4aXMudXBkYXRlX3Byb2plY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXBkYXRlX3Byb2plY3Rpb25fICYmIG1hcF8pIHtcbiAgICAgIHByb2plY3Rpb25fLnNjYWxlKDEpLnRyYW5zbGF0ZShbMCwwXSk7XG4gICAgICBwYXRoXyA9IGQzLmdlby5wYXRoKCkucHJvamVjdGlvbihwcm9qZWN0aW9uXyk7XG4gICAgICB2YXIgYm91bmRzID0gcGF0aF8uYm91bmRzKG1hcF8pO1xuICAgICAgdmFyIHNjYWxlICA9IDAuOTUgLyBNYXRoLm1heCgoYm91bmRzWzFdWzBdIC0gYm91bmRzWzBdWzBdKSAvIHdpZHRoXywgXG4gICAgICAgICAgICAgICAgICAoYm91bmRzWzFdWzFdIC0gYm91bmRzWzBdWzFdKSAvIGhlaWdodF8pO1xuICAgICAgdmFyIHRyYW5zbCA9IFsod2lkdGhfIC0gc2NhbGUgKiAoYm91bmRzWzFdWzBdICsgYm91bmRzWzBdWzBdKSkgLyAyLCBcbiAgICAgICAgICAgICAgICAgIChoZWlnaHRfIC0gc2NhbGUgKiAoYm91bmRzWzFdWzFdICsgYm91bmRzWzBdWzFdKSkgLyAyXTtcbiAgICAgIHByb2plY3Rpb25fLnNjYWxlKHNjYWxlKS50cmFuc2xhdGUodHJhbnNsKTtcbiAgICAgIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IGZhbHNlO1xuICAgIH1cbiAgfTtcblxuXG4gIHJldHVybiBheGlzO1xufVxuXG4vLyBBIGZ1bmN0aW9uIGV4cGVjdGluZyB0d28gZnVuY3Rpb25zLiBUaGUgc2Vjb25kIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIHRoZSBcbi8vIGZpcnN0IGZ1bmN0aW9uIHJldHVybnMgdHJ1ZS4gV2hlbiB0aGUgZmlyc3QgZnVuY3Rpb24gZG9lcyBub3QgcmV0dXJuIHRydWVcbi8vIHdlIHdhaXQgZm9yIDEwMG1zIGFuZCB0cnkgYWdhaW4uIFxudmFyIHdhaXRfZm9yID0gZnVuY3Rpb24obSwgZikge1xuICBpZiAobSgpKSB7XG4gICAgZigpO1xuICB9IGVsc2Uge1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IHdhaXRfZm9yKG0sIGYpO30sIDEwMCk7XG4gIH1cbn07XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMubGluZWFyID0gZ3JwaF9heGlzX2xpbmVhcigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfYXhpc19zaXplKCkge1xuXG4gIHZhciB2YXJpYWJsZV87XG4gIHZhciB3aWR0aCwgaGVpZ2h0O1xuICB2YXIgc2NhbGUgPSBncnBoX3NjYWxlX3NpemUoKTtcblxuICBmdW5jdGlvbiBheGlzKGcpIHtcbiAgfVxuXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB3O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWlnaHQgPSBoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZSA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodmFyaWFibGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XG4gICAgICBzY2FsZS5kb21haW4oZDMuZXh0ZW50KGRhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVdO30pKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNjYWxlLnRpY2tzKCk7XG4gIH07XG5cbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXG4gICAgICByZXR1cm4gYXhpcy5zY2FsZSh2W3ZhcmlhYmxlXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMuc2l6ZSA9IGdycGhfYXhpc19zaXplKCk7XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9heGlzX3NwbGl0KCkge1xuXG4gIHZhciB2YXJpYWJsZV87XG4gIHZhciB3aWR0aF8sIGhlaWdodF87XG4gIHZhciBkb21haW5fO1xuICB2YXIgc2V0dGluZ3NfID0ge1xuICB9O1xuXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xuICB9XG5cbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aF87XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZHRoXyA9IHdpZHRoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBoZWlnaHRfO1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWlnaHRfID0gaGVpZ2h0O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ2NhdGVnb3JpY2FsJztcbiAgfTtcblxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZV8gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuIFxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZG9tYWluXztcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHZhcmlhYmxlXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcbiAgICAgIGRvbWFpbl8gPSB2c2NoZW1hLmNhdGVnb3JpZXMubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQubmFtZTsgfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkb21haW5fO1xuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIGRvbWFpbl8uaW5kZXhPZih2KTtcbiAgfTtcblxuICByZXR1cm4gYXhpcztcbn1cbiIsIlxuZnVuY3Rpb24gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2hlbWEuZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNjaGVtYS5maWVsZHNbaV0ubmFtZSA9PSB2YXJpYWJsZSkgXG4gICAgICByZXR1cm4gc2NoZW1hLmZpZWxkc1tpXTtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuICBcbiIsIlxuZnVuY3Rpb24gZ3JwaF9ncmFwaChheGVzLCBkaXNwYXRjaCwgZ3JhcGgpIHtcblxuICB2YXIgd2lkdGgsIGhlaWdodDtcbiAgdmFyIGRhdGEsIHNjaGVtYTtcblxuICBncmFwaC5heGVzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzLmtleXMoYXhlcyk7XG4gIH07XG5cbiAgZ3JhcGgud2lkdGggPSBmdW5jdGlvbih3KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB3O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGdyYXBoLmhlaWdodCA9IGZ1bmN0aW9uKGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVpZ2h0ID0gaDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBncmFwaC5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZXMsIGF4aXMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmIChheGVzW2F4aXNdID09PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBheGVzW2F4aXNdLmFjY2VwdCh2YXJpYWJsZXMsIHNjaGVtYSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAodmFyIGkgaW4gYXhlcykge1xuICAgICAgICBpZiAodmFyaWFibGVzW2ldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAoYXhlc1tpXS5yZXF1aXJlZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBhY2NlcHQgPSBheGVzW2ldLmFjY2VwdCh2YXJpYWJsZXNbaV0sIHNjaGVtYSk7XG4gICAgICAgICAgaWYgKCFhY2NlcHQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9O1xuXG4gIGdyYXBoLmFzc2lnbiA9IGZ1bmN0aW9uKHZhcmlhYmxlcykge1xuICAgIGZvciAodmFyIGkgaW4gYXhlcykgYXhlc1tpXS52YXJpYWJsZSh2YXJpYWJsZXNbaV0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9O1xuXG4gIGdyYXBoLnNjaGVtYSA9IGZ1bmN0aW9uKHMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNjaGVtYTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZW1hID0gcztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBncmFwaC5kYXRhID0gZnVuY3Rpb24oZCwgcykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGF0YSA9IGQ7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIFxuICAgICAgICBncmFwaC5zY2hlbWEocyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgZ3JhcGguZGlzcGF0Y2ggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZGlzcGF0Y2g7XG4gIH07XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG4iLCJcbmZ1bmN0aW9uIGdycGhfZ3JhcGhfYnViYmxlKCkge1xuXG4gIHZhciBheGVzID0ge1xuICAgICd4JyA6IGdycGhfYXhpc19saW5lYXIodHJ1ZSksXG4gICAgJ3knIDogZ3JwaF9heGlzX2xpbmVhcihmYWxzZSksXG4gICAgJ29iamVjdCcgOiBncnBoX2F4aXNfY29sb3VyKCksXG4gICAgJ3NpemUnICAgOiBncnBoX2F4aXNfc2l6ZSgpLFxuICAgICdjb2xvdXInIDogZ3JwaF9heGlzX2NvbG91cigpLFxuICAgICdjb2x1bW4nIDogZ3JwaF9heGlzX3NwbGl0KCksXG4gICAgJ3JvdycgOiBncnBoX2F4aXNfc3BsaXQoKVxuICB9O1xuICBheGVzLngucmVxdWlyZWQgPSB0cnVlO1xuICBheGVzLnkucmVxdWlyZWQgPSB0cnVlO1xuICBheGVzLm9iamVjdC5yZXF1aXJlZCA9IHRydWU7XG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJjbGlja1wiKTtcblxuICB2YXIgZHVtbXlfID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwiYnViYmxlZ3JhcGggZHVtbXlcIilcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaW52aXNpYmxlXCIpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcblxuICB2YXIgZ3JhcGggPSBncnBoX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBmdW5jdGlvbihnKSB7XG4gICAgZnVuY3Rpb24gbmVzdF9vYmplY3QoZCkge1xuICAgICAgcmV0dXJuIGF4ZXMub2JqZWN0LnZhcmlhYmxlKCkgPyBkW2F4ZXMub2JqZWN0LnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmVzdF9jb2xvdXIoZCkge1xuICAgICAgcmV0dXJuIGF4ZXMuY29sb3VyLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sb3VyLnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmVzdF9jb2x1bW4oZCkge1xuICAgICAgcmV0dXJuIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sdW1uLnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmVzdF9yb3coZCkge1xuICAgICAgcmV0dXJuIGF4ZXMucm93LnZhcmlhYmxlKCkgPyBkW2F4ZXMucm93LnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgLy8gc2V0dXAgYXhlc1xuICAgIGF4ZXMuY29sb3VyLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICAvL2F4ZXMub2JqZWN0LmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTsgVE9ET1xuICAgIGF4ZXMuc2l6ZS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgYXhlcy5jb2x1bW4uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIGF4ZXMucm93LmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICAvLyBkZXRlcm1pbmUgbnVtYmVyIG9mIHJvd3MgYW5kIGNvbHVtbnNcbiAgICB2YXIgbmNvbCA9IGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBheGVzLmNvbHVtbi50aWNrcygpLmxlbmd0aCA6IDE7XG4gICAgdmFyIG5yb3cgPSBheGVzLnJvdy52YXJpYWJsZSgpID8gYXhlcy5yb3cudGlja3MoKS5sZW5ndGggOiAxO1xuICAgIC8vIGdldCBsYWJlbHMgYW5kIGRldGVybWluZSB0aGVpciBoZWlnaHRcbiAgICB2YXIgdnNjaGVtYXggPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy54LnZhcmlhYmxlKCksIHNjaGVtYSk7XG4gICAgdmFyIHhsYWJlbCA9IHZzY2hlbWF4LnRpdGxlO1xuICAgIHZhciBsYWJlbF9oZWlnaHQgPSBsYWJlbF9zaXplXy5oZWlnaHQoeGxhYmVsKSArIHNldHRpbmdzKCdsYWJlbF9wYWRkaW5nJyk7XG4gICAgdmFyIHZzY2hlbWF5ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMueS52YXJpYWJsZSgpLCBzY2hlbWEpO1xuICAgIHZhciB5bGFiZWwgPSB2c2NoZW1heS50aXRsZTtcbiAgICAvLyBzZXQgdGhlIHdpZHRoLCBoZWlnaHQgZW5kIGRvbWFpbiBvZiB0aGUgeC0gYW5kIHktYXhlcy4gV2UgbmVlZCBzb21lIFxuICAgIC8vIGl0ZXJhdGlvbnMgZm9yIHRoaXMsIGFzIHRoZSBoZWlnaHQgb2YgdGhlIHktYXhpcyBkZXBlbmRzIG9mIHRoZSBoZWlnaHRcbiAgICAvLyBvZiB0aGUgeC1heGlzLCB3aGljaCBkZXBlbmRzIG9uIHRoZSBsYWJlbHMgb2YgdGhlIHgtYXhpcywgd2hpY2ggZGVwZW5kc1xuICAgIC8vIG9uIHRoZSB3aWR0aCBvZiB0aGUgeC1heGlzLCBldGMuIFxuICAgIHZhciB3LCBoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgKytpKSB7XG4gICAgICB3ID0gZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0O1xuICAgICAgdyA9ICh3IC0gKG5jb2wtMSkqc2V0dGluZ3MoJ3NlcCcpKSAvIG5jb2w7XG4gICAgICBheGVzLngud2lkdGgodykuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgICAgaCA9IGdyYXBoLmhlaWdodCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMl0gLSBcbiAgICAgICAgYXhlcy54LmhlaWdodCgpIC0gbGFiZWxfaGVpZ2h0O1xuICAgICAgaCA9IChoIC0gKG5yb3ctMSkqc2V0dGluZ3MoJ3NlcCcpKSAvIG5yb3c7XG4gICAgICBheGVzLnkuaGVpZ2h0KGgpLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICB9XG4gICAgdmFyIGwgPSBheGVzLnkud2lkdGgoKSArIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gKyBsYWJlbF9oZWlnaHQ7XG4gICAgdmFyIHQgID0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXTtcbiAgICAvLyBkcmF3IGxhYmVsc1xuICAgIHZhciB5Y2VudGVyID0gdCArIDAuNSooZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncygncGFkZGluZycpWzBdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSAtIFxuICAgICAgICBheGVzLnguaGVpZ2h0KCkgLSBsYWJlbF9oZWlnaHQpO1xuICAgIHZhciB4Y2VudGVyID0gbCArIDAuNSooZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0KTtcbiAgICBnLmFwcGVuZChcInRleHRcIilcbiAgICAgIC5hdHRyKFwieFwiLCBzZXR0aW5ncygncGFkZGluZycpWzFdKS5hdHRyKFwieVwiLCB5Y2VudGVyKVxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KHlsYWJlbClcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSArIFwiIFwiICsgeWNlbnRlciArIFwiKVwiKTtcbiAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcInhcIiwgeGNlbnRlcikuYXR0cihcInlcIiwgZ3JhcGguaGVpZ2h0KCktc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSlcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dCh4bGFiZWwpO1xuXG5cblxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbHVtbikua2V5KG5lc3Rfcm93KS5rZXkobmVzdF9jb2xvdXIpLmVudHJpZXMoZ3JhcGguZGF0YSgpKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZGogPSBkW2ldLnZhbHVlcztcbiAgICAgIHQgID0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgLy8gZHJhdyB4LWF4aXNcbiAgICAgICAgaWYgKGogPT0gKGRqLmxlbmd0aC0xKSkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyAodCArIGgpICsgXCIpXCIpLmNhbGwoYXhlcy54KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IHktYXhpc1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAobCAtIGF4ZXMueS53aWR0aCgpKSArIFwiLFwiICsgdCArIFwiKVwiKVxuICAgICAgICAgICAgLmNhbGwoYXhlcy55KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IGJveCBmb3IgZ3JhcGhcbiAgICAgICAgdmFyIGdyID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImdyYXBoXCIpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xuICAgICAgICBnci5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XG4gICAgICAgIC8vIGRyYXcgZ3JpZFxuICAgICAgICB2YXIgeHRpY2tzID0gYXhlcy54LnRpY2tzKCk7XG4gICAgICAgIGdyLnNlbGVjdEFsbChcImxpbmUuZ3JpZHhcIikuZGF0YSh4dGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJncmlkIGdyaWR4XCIpXG4gICAgICAgICAgLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUpXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieTJcIiwgaCk7XG4gICAgICAgIHZhciB5dGlja3MgPSBheGVzLnkudGlja3MoKTtcbiAgICAgICAgZ3Iuc2VsZWN0QWxsKFwibGluZS5ncmlkeVwiKS5kYXRhKHl0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImdyaWQgZ3JpZHlcIilcbiAgICAgICAgICAuYXR0cihcIngxXCIsIDApLmF0dHIoXCJ4MlwiLCB3KVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKTtcbiAgICAgICAgLy8gYWRkIGNyb3NzaGFpcnMgdG8gZ3JhcGhcbiAgICAgICAgdmFyIGdjcm9zc2ggPSBnci5hcHBlbmQoXCJnXCIpLmNsYXNzZWQoXCJjcm9zc2hhaXJzXCIsIHRydWUpO1xuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcImhsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIGF4ZXMueC53aWR0aCgpKS5hdHRyKFwieTJcIiwgMClcbiAgICAgICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcInZsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIDApLmF0dHIoXCJ5MlwiLCBheGVzLnkuaGVpZ2h0KCkpXG4gICAgICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgLy8gZHJhdyBidWJibGVzIFxuICAgICAgICB2YXIgZGsgPSBkaltqXS52YWx1ZXM7XG4gICAgICAgIGZvciAoayA9IDA7IGsgPCBkay5sZW5ndGg7ICsraykge1xuICAgICAgICAgIHZhciBjbHMgPSBcImNpcmNsZVwiICsgaztcbiAgICAgICAgICBnci5zZWxlY3RBbGwoXCJjaXJjbGUuYnViYmxlXCIgKyBrKS5kYXRhKGRrW2tdLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJidWJibGUgYnViYmxlXCIgKyBrICsgXCIgXCIgKyBheGVzLmNvbG91ci5zY2FsZShka1trXS5rZXkpKVxuICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJjeVwiLCBheGVzLnkuc2NhbGUpXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgYXhlcy5zaXplLnNjYWxlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBuZXh0IGxpbmVcbiAgICAgICAgdCArPSBheGVzLnkuaGVpZ2h0KCkgKyBzZXR0aW5ncygnc2VwJyk7XG4gICAgICB9XG4gICAgICBsICs9IGF4ZXMueC53aWR0aCgpICsgc2V0dGluZ3MoJ3NlcCcpO1xuICAgIH1cblxuXG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xuICAgIGcuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoZywgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XG4gICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKGcsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbChnLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pO1xuXG4gIH0pO1xuXG5cbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcbiAgLy8gSGlnaGxpZ2h0aW5nIG9mIHNlbGVjdGVkIGxpbmVcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgaWYgKHZhcmlhYmxlKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGF4ZXMuY29sb3VyLnNjYWxlKFwiXCIgKyB2YWx1ZSk7XG4gICAgICB2YXIgcmVnZXhwID0gL1xcYmNvbG91cihbMC05XSspXFxiLztcbiAgICAgIHZhciBjb2xvdXIgPSByZWdleHAuZXhlYyhjbGFzc2VzKVswXTtcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuXCIgKyBjb2xvdXIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKGQpKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKGQpKVxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShkKSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShkKSlcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICB9KTtcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gIH0pO1xuICAvLyBTaG93IGNyb3NzaGFpcnMgd2hlbiBob3ZlcmluZyBvdmVyIGEgcG9pbnRcbiAgLypkaXNwYXRjaC5vbihcInBvaW50b3ZlclwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgfSk7XG4gIGRpc3BhdGNoLm9uKFwicG9pbnRvdXRcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgfSk7Ki9cblxuICByZXR1cm4gZ3JhcGg7XG59XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9ncmFwaF9saW5lKCkge1xuXG4gIHZhciBheGVzID0ge1xuICAgICd4JyA6IGdycGhfYXhpc19saW5lYXIodHJ1ZSksXG4gICAgJ3knIDogZ3JwaF9heGlzX2xpbmVhcihmYWxzZSksXG4gICAgJ2NvbG91cicgOiBncnBoX2F4aXNfY29sb3VyKCksXG4gICAgJ2NvbHVtbicgOiBncnBoX2F4aXNfc3BsaXQoKSxcbiAgICAncm93JyA6IGdycGhfYXhpc19zcGxpdCgpXG4gIH07XG4gIGF4ZXMueC5yZXF1aXJlZCA9IHRydWU7XG4gIGF4ZXMueS5yZXF1aXJlZCA9IHRydWU7XG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJwb2ludG92ZXJcIiwgXCJwb2ludG91dFwiLFxuICAgIFwiY2xpY2tcIik7XG5cbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmVhcmdyYXBoIGR1bW15XCIpXG4gICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImludmlzaWJsZVwiKTtcbiAgdmFyIGxhYmVsX3NpemVfID0gZ3JwaF9sYWJlbF9zaXplKGR1bW15Xyk7XG5cbiAgdmFyIGdyYXBoID0gZ3JwaF9ncmFwaChheGVzLCBkaXNwYXRjaCwgZnVuY3Rpb24oZykge1xuICAgIGZ1bmN0aW9uIG5lc3RfY29sb3VyKGQpIHtcbiAgICAgIHJldHVybiBheGVzLmNvbG91ci52YXJpYWJsZSgpID8gZFtheGVzLmNvbG91ci52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5lc3RfY29sdW1uKGQpIHtcbiAgICAgIHJldHVybiBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gZFtheGVzLmNvbHVtbi52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5lc3Rfcm93KGQpIHtcbiAgICAgIHJldHVybiBheGVzLnJvdy52YXJpYWJsZSgpID8gZFtheGVzLnJvdy52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIC8vIHNldHVwIGF4ZXNcbiAgICBheGVzLmNvbG91ci5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgYXhlcy5jb2x1bW4uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIGF4ZXMucm93LmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICAvLyBkZXRlcm1pbmUgbnVtYmVyIG9mIHJvd3MgYW5kIGNvbHVtbnNcbiAgICB2YXIgbmNvbCA9IGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBheGVzLmNvbHVtbi50aWNrcygpLmxlbmd0aCA6IDE7XG4gICAgdmFyIG5yb3cgPSBheGVzLnJvdy52YXJpYWJsZSgpID8gYXhlcy5yb3cudGlja3MoKS5sZW5ndGggOiAxO1xuICAgIC8vIGdldCBsYWJlbHMgYW5kIGRldGVybWluZSB0aGVpciBoZWlnaHRcbiAgICB2YXIgdnNjaGVtYXggPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy54LnZhcmlhYmxlKCksIHNjaGVtYSk7XG4gICAgdmFyIHhsYWJlbCA9IHZzY2hlbWF4LnRpdGxlO1xuICAgIHZhciBsYWJlbF9oZWlnaHQgPSBsYWJlbF9zaXplXy5oZWlnaHQoeGxhYmVsKSArIHNldHRpbmdzKCdsYWJlbF9wYWRkaW5nJyk7XG4gICAgdmFyIHZzY2hlbWF5ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMueS52YXJpYWJsZSgpLCBzY2hlbWEpO1xuICAgIHZhciB5bGFiZWwgPSB2c2NoZW1heS50aXRsZTtcbiAgICAvLyBzZXQgdGhlIHdpZHRoLCBoZWlnaHQgZW5kIGRvbWFpbiBvZiB0aGUgeC0gYW5kIHktYXhlcy4gV2UgbmVlZCBzb21lIFxuICAgIC8vIGl0ZXJhdGlvbnMgZm9yIHRoaXMsIGFzIHRoZSBoZWlnaHQgb2YgdGhlIHktYXhpcyBkZXBlbmRzIG9mIHRoZSBoZWlnaHRcbiAgICAvLyBvZiB0aGUgeC1heGlzLCB3aGljaCBkZXBlbmRzIG9uIHRoZSBsYWJlbHMgb2YgdGhlIHgtYXhpcywgd2hpY2ggZGVwZW5kc1xuICAgIC8vIG9uIHRoZSB3aWR0aCBvZiB0aGUgeC1heGlzLCBldGMuIFxuICAgIHZhciB3LCBoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMjsgKytpKSB7XG4gICAgICB3ID0gZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0O1xuICAgICAgdyA9ICh3IC0gKG5jb2wtMSkqc2V0dGluZ3MoJ3NlcCcpKSAvIG5jb2w7XG4gICAgICBheGVzLngud2lkdGgodykuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgICAgaCA9IGdyYXBoLmhlaWdodCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMl0gLSBcbiAgICAgICAgYXhlcy54LmhlaWdodCgpIC0gbGFiZWxfaGVpZ2h0O1xuICAgICAgaCA9IChoIC0gKG5yb3ctMSkqc2V0dGluZ3MoJ3NlcCcpKSAvIG5yb3c7XG4gICAgICBheGVzLnkuaGVpZ2h0KGgpLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICB9XG4gICAgdmFyIGwgPSBheGVzLnkud2lkdGgoKSArIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gKyBsYWJlbF9oZWlnaHQ7XG4gICAgdmFyIHQgID0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXTtcbiAgICAvLyBkcmF3IGxhYmVsc1xuICAgIHZhciB5Y2VudGVyID0gdCArIDAuNSooZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncygncGFkZGluZycpWzBdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSAtIFxuICAgICAgICBheGVzLnguaGVpZ2h0KCkgLSBsYWJlbF9oZWlnaHQpO1xuICAgIHZhciB4Y2VudGVyID0gbCArIDAuNSooZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0KTtcbiAgICBnLmFwcGVuZChcInRleHRcIilcbiAgICAgIC5hdHRyKFwieFwiLCBzZXR0aW5ncygncGFkZGluZycpWzFdKS5hdHRyKFwieVwiLCB5Y2VudGVyKVxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KHlsYWJlbClcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSArIFwiIFwiICsgeWNlbnRlciArIFwiKVwiKTtcbiAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcInhcIiwgeGNlbnRlcikuYXR0cihcInlcIiwgZ3JhcGguaGVpZ2h0KCktc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSlcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dCh4bGFiZWwpO1xuXG5cblxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbHVtbikua2V5KG5lc3Rfcm93KS5rZXkobmVzdF9jb2xvdXIpLmVudHJpZXMoZ3JhcGguZGF0YSgpKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZGogPSBkW2ldLnZhbHVlcztcbiAgICAgIHQgID0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgLy8gZHJhdyB4LWF4aXNcbiAgICAgICAgaWYgKGogPT0gKGRqLmxlbmd0aC0xKSkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyAodCArIGgpICsgXCIpXCIpLmNhbGwoYXhlcy54KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IHktYXhpc1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAobCAtIGF4ZXMueS53aWR0aCgpKSArIFwiLFwiICsgdCArIFwiKVwiKVxuICAgICAgICAgICAgLmNhbGwoYXhlcy55KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IGJveCBmb3IgZ3JhcGhcbiAgICAgICAgdmFyIGdyID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImdyYXBoXCIpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xuICAgICAgICBnci5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XG4gICAgICAgIC8vIGRyYXcgZ3JpZFxuICAgICAgICB2YXIgeHRpY2tzID0gYXhlcy54LnRpY2tzKCk7XG4gICAgICAgIGdyLnNlbGVjdEFsbChcImxpbmUuZ3JpZHhcIikuZGF0YSh4dGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJncmlkIGdyaWR4XCIpXG4gICAgICAgICAgLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUpXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieTJcIiwgaCk7XG4gICAgICAgIHZhciB5dGlja3MgPSBheGVzLnkudGlja3MoKTtcbiAgICAgICAgZ3Iuc2VsZWN0QWxsKFwibGluZS5ncmlkeVwiKS5kYXRhKHl0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImdyaWQgZ3JpZHlcIilcbiAgICAgICAgICAuYXR0cihcIngxXCIsIDApLmF0dHIoXCJ4MlwiLCB3KVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKTtcbiAgICAgICAgLy8gYWRkIGNyb3NzaGFpcnMgdG8gZ3JhcGhcbiAgICAgICAgdmFyIGdjcm9zc2ggPSBnci5hcHBlbmQoXCJnXCIpLmNsYXNzZWQoXCJjcm9zc2hhaXJzXCIsIHRydWUpO1xuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcImhsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIGF4ZXMueC53aWR0aCgpKS5hdHRyKFwieTJcIiwgMClcbiAgICAgICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcInZsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIDApLmF0dHIoXCJ5MlwiLCBheGVzLnkuaGVpZ2h0KCkpXG4gICAgICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgLy8gZHJhdyBsaW5lcyBcbiAgICAgICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpLngoYXhlcy54LnNjYWxlKS55KGF4ZXMueS5zY2FsZSk7XG4gICAgICAgIHZhciBkayA9IGRqW2pdLnZhbHVlcztcbiAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCBkay5sZW5ndGg7ICsraykge1xuICAgICAgICAgIGdyLmFwcGVuZChcInBhdGhcIikuYXR0cihcImRcIiwgbGluZShka1trXS52YWx1ZXMpKVxuICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBheGVzLmNvbG91ci5zY2FsZShka1trXS5rZXkpKVxuICAgICAgICAgICAgLmRhdHVtKGRrW2tdKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IHBvaW50cyBcbiAgICAgICAgZGsgPSBkaltqXS52YWx1ZXM7XG4gICAgICAgIGZvciAoayA9IDA7IGsgPCBkay5sZW5ndGg7ICsraykge1xuICAgICAgICAgIHZhciBjbHMgPSBcImNpcmNsZVwiICsgaztcbiAgICAgICAgICBnci5zZWxlY3RBbGwoXCJjaXJjbGUuY2lyY2xlXCIgKyBrKS5kYXRhKGRrW2tdLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjaXJjbGVcIiArIGsgKyBcIiBcIiArIGF4ZXMuY29sb3VyLnNjYWxlKGRrW2tdLmtleSkpXG4gICAgICAgICAgICAuYXR0cihcImN4XCIsIGF4ZXMueC5zY2FsZSkuYXR0cihcImN5XCIsIGF4ZXMueS5zY2FsZSlcbiAgICAgICAgICAgIC5hdHRyKFwiclwiLCBzZXR0aW5ncygncG9pbnRfc2l6ZScpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5leHQgbGluZVxuICAgICAgICB0ICs9IGF4ZXMueS5oZWlnaHQoKSArIHNldHRpbmdzKCdzZXAnKTtcbiAgICAgIH1cbiAgICAgIGwgKz0gYXhlcy54LndpZHRoKCkgKyBzZXR0aW5ncygnc2VwJyk7XG4gICAgfVxuXG5cbiAgICAvLyBhZGQgaG92ZXIgZXZlbnRzIHRvIHRoZSBsaW5lcyBhbmQgcG9pbnRzXG4gICAgZy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XG4gICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbChnLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgICAgaWYgKCFkLmtleSkgZGlzcGF0Y2gucG9pbnRvdmVyLmNhbGwoZywgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XG4gICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKGcsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgICBpZiAoIWQua2V5KSBkaXNwYXRjaC5wb2ludG91dC5jYWxsKGcsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbChnLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pO1xuXG4gIH0pO1xuXG5cbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcbiAgLy8gSGlnaGxpZ2h0aW5nIG9mIHNlbGVjdGVkIGxpbmVcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgaWYgKHZhcmlhYmxlKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGF4ZXMuY29sb3VyLnNjYWxlKFwiXCIgKyB2YWx1ZSk7XG4gICAgICB2YXIgcmVnZXhwID0gL1xcYmNvbG91cihbMC05XSspXFxiLztcbiAgICAgIHZhciBjb2xvdXIgPSByZWdleHAuZXhlYyhjbGFzc2VzKVswXTtcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuXCIgKyBjb2xvdXIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIH1cbiAgfSk7XG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiBmYWxzZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcbiAgfSk7XG4gIC8vIFNob3cgY3Jvc3NoYWlycyB3aGVuIGhvdmVyaW5nIG92ZXIgYSBwb2ludFxuICBkaXNwYXRjaC5vbihcInBvaW50b3ZlclwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKGQpKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKGQpKVxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShkKSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShkKSlcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICB9KTtcbiAgZGlzcGF0Y2gub24oXCJwb2ludG91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICB9KTtcblxuICByZXR1cm4gZ3JhcGg7XG59XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9ncmFwaF9tYXAoKSB7XG5cbiAgdmFyIGF4ZXMgPSB7XG4gICAgJ3JlZ2lvbicgOiBncnBoX2F4aXNfcmVnaW9uKCksXG4gICAgJ2NvbG91cicgOiBncnBoX2F4aXNfY2hsb3JvcGxldGgoKSxcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcbiAgfTtcbiAgYXhlcy5yZWdpb24ucmVxdWlyZWQgPSB0cnVlO1xuICBheGVzLmNvbG91ci5yZXF1aXJlZCA9IHRydWU7XG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJjbGlja1wiKTtcblxuICB2YXIgZ3JhcGggPSBncnBoX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBmdW5jdGlvbihnKSB7XG4gICAgZnVuY3Rpb24gbmVzdF9jb2x1bW4oZCkge1xuICAgICAgcmV0dXJuIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sdW1uLnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmVzdF9yb3coZCkge1xuICAgICAgcmV0dXJuIGF4ZXMucm93LnZhcmlhYmxlKCkgPyBkW2F4ZXMucm93LnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgLy8gc2V0dXAgYXhlc1xuICAgIGF4ZXMucmVnaW9uLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICBheGVzLmNvbG91ci5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgYXhlcy5jb2x1bW4uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIGF4ZXMucm93LmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICAvLyBkZXRlcm1pbmUgbnVtYmVyIG9mIHJvd3MgYW5kIGNvbHVtbnNcbiAgICB2YXIgbmNvbCA9IGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBheGVzLmNvbHVtbi50aWNrcygpLmxlbmd0aCA6IDE7XG4gICAgdmFyIG5yb3cgPSBheGVzLnJvdy52YXJpYWJsZSgpID8gYXhlcy5yb3cudGlja3MoKS5sZW5ndGggOiAxO1xuICAgIC8vIHNldCB0aGUgd2lkdGgsIGhlaWdodCBlbmQgZG9tYWluIG9mIHRoZSB4LSBhbmQgeS1heGVzXG4gICAgdmFyIHcgPSAoZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsxXSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVszXSAtIFxuICAgICAgKG5jb2wtMSkqc2V0dGluZ3MoXCJzZXBcIiwgXCJtYXBcIikpL25jb2w7XG4gICAgdmFyIGggPSAoZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMF0gLSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMl0gLSBcbiAgICAgIChucm93LTEpKnNldHRpbmdzKFwic2VwXCIsIFwibWFwXCIpKS9ucm93O1xuICAgIHZhciBsID0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzFdO1xuICAgIHZhciB0ICA9IHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsyXTtcbiAgICBheGVzLnJlZ2lvbi53aWR0aCh3KS5oZWlnaHQoaCk7XG4gICAgLy8gZHJhdyBncmFwaHNcbiAgICB3YWl0X2ZvcihheGVzLnJlZ2lvbi5tYXBfbG9hZGVkLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2x1bW4pLmtleShuZXN0X3JvdykuZW50cmllcyhncmFwaC5kYXRhKCkpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGRqID0gZFtpXS52YWx1ZXM7XG4gICAgICB2YXIgdCAgPSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMl07XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRqLmxlbmd0aDsgKytqKSB7XG4gICAgICAgIC8vIGRyYXcgYm94IGZvciBncmFwaFxuICAgICAgICB2YXIgZ3IgPSBzdmcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJncmFwaFwiKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbCArIFwiLFwiICsgdCArIFwiKVwiKTtcbiAgICAgICAgZ3IuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3KS5hdHRyKFwiaGVpZ2h0XCIsIGgpO1xuICAgICAgICAvLyBkcmF3IG1hcFxuICAgICAgICBnci5zZWxlY3RBbGwoXCJwYXRoXCIpLmRhdGEoZGpbal0udmFsdWVzKS5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgICAuYXR0cihcImRcIiwgYXhlcy5yZWdpb24uc2NhbGUpLmF0dHIoXCJjbGFzc1wiLCBheGVzLmNvbG91ci5zY2FsZSk7XG4gICAgICAgIC8vIG5leHQgbGluZVxuICAgICAgICB0ICs9IGggKyBzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKTtcbiAgICAgIH1cbiAgICAgIGwgKz0gdyArIHNldHRpbmdzKFwic2VwXCIsIFwibWFwXCIpO1xuICAgIH1cbiAgICAvLyBhZGQgZXZlbnRzIHRvIHRoZSBsaW5lc1xuICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3Zlci5jYWxsKGcsIGF4ZXMucmVnaW9uLnZhcmlhYmxlKCksIHJlZ2lvbiwgZCk7XG4gICAgfSkub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwoZywgYXhlcy5yZWdpb24udmFyaWFibGUoKSwgcmVnaW9uLCBkKTtcbiAgICB9KS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciByZWdpb24gPSBkW2F4ZXMucmVnaW9uLnZhcmlhYmxlKCldO1xuICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbChnLCBheGVzLnJlZ2lvbi52YXJpYWJsZSgpLCByZWdpb24sIGQpO1xuICAgIH0pO1xuXG4gICAgfSk7XG4gIH0pO1xuXG5cbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIuZ3JhcGhcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmNsYXNzZWQoXCJjb2xvdXJsb3dcIiwgdHJ1ZSk7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmZpbHRlcihmdW5jdGlvbihkLCBpKSB7XG4gICAgICByZXR1cm4gZFt2YXJpYWJsZV0gPT0gdmFsdWU7XG4gICAgfSkuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IHRydWUsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XG4gIH0pO1xuICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LmdyYXBoXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgIHRoaXMuc2VsZWN0QWxsKFwicGF0aFwiKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogZmFsc2UsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XG4gIH0pO1xuXG5cblxuXG4gIHJldHVybiBncmFwaDtcbn1cblxuIiwiXG5mdW5jdGlvbiBncnBoX2xhYmVsX3NpemUoZykge1xuXG4gIC8vIGEgc3ZnIG9yIGcgZWxlbWVudCB0byB3aGljaCAgd2Ugd2lsbCBiZSBhZGRpbmcgb3VyIGxhYmVsIGluIG9yZGVyIHRvXG4gIC8vIHJlcXVlc3QgaXQncyBzaXplXG4gIHZhciBnXyA9IGc7XG4gIC8vIHN0b3JlIHByZXZpb3VzbHkgY2FsY3VsYXRlZCB2YWx1ZXM7IGFzIHRoZSBzaXplIG9mIGNlcnRhaW4gbGFiZWxzIGFyZSBcbiAgLy8gcmVxdWVzdGVkIGFnYWluIGFuZCBhZ2FpbiB0aGlzIGdyZWF0bHkgZW5oYW5jZXMgcGVyZm9ybWFuY2VcbiAgdmFyIHNpemVzXyA9IHt9O1xuXG4gIGZ1bmN0aW9uIGxhYmVsX3NpemUobGFiZWwpIHtcbiAgICBpZiAoc2l6ZXNfW2xhYmVsXSkge1xuICAgICAgcmV0dXJuIHNpemVzX1tsYWJlbF07XG4gICAgfVxuICAgIGlmICghZ18pIHJldHVybiBbdW5kZWZpbmVkLCB1bmRlZmluZWRdO1xuICAgIHZhciB0ZXh0ID0gZ18uYXBwZW5kKFwidGV4dFwiKS50ZXh0KGxhYmVsKTtcbiAgICB2YXIgYmJveCA9IHRleHRbMF1bMF0uZ2V0QkJveCgpO1xuICAgIHZhciBzaXplID0gW2Jib3gud2lkdGgqMS4yLCBiYm94LmhlaWdodCowLjY1XTsgLy8gVE9ETyB3aHk7IGFuZCBpcyB0aGlzIGFsd2F5cyBjb3JyZWN0XG4gICAgLy92YXIgc2l6ZSA9IGhvcml6b250YWxfID8gdGV4dFswXVswXS5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSA6XG4gICAgICAvL3RleHRbMF1bMF0uZ2V0QkJveCgpLmhlaWdodDtcbiAgICB0ZXh0LnJlbW92ZSgpO1xuICAgIHNpemVzX1tsYWJlbF0gPSBzaXplO1xuICAgIHJldHVybiBzaXplO1xuICB9XG5cbiAgbGFiZWxfc2l6ZS5zdmcgPSBmdW5jdGlvbihnKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBnXztcbiAgICB9IGVsc2Uge1xuICAgICAgZ18gPSBnO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGxhYmVsX3NpemUud2lkdGggPSBmdW5jdGlvbihsYWJlbCkge1xuICAgIHZhciBzaXplID0gbGFiZWxfc2l6ZShsYWJlbCk7XG4gICAgcmV0dXJuIHNpemVbMF07XG4gIH07XG5cbiAgbGFiZWxfc2l6ZS5oZWlnaHQgPSBmdW5jdGlvbihsYWJlbCkge1xuICAgIHZhciBzaXplID0gbGFiZWxfc2l6ZShsYWJlbCk7XG4gICAgcmV0dXJuIHNpemVbMV07XG4gIH07XG5cbiAgcmV0dXJuIGxhYmVsX3NpemU7XG59XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9zY2FsZV9jaGxvcm9wbGV0aCgpIHtcblxuICB2YXIgZG9tYWluO1xuICB2YXIgYmFzZWNsYXNzID0gXCJjaGxvcm9cIjtcbiAgdmFyIG5jb2xvdXJzICA9IDk7XG5cbiAgZnVuY3Rpb24gc2NhbGUodikge1xuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gYXNzdW1lIHdlIGhhdmUgb25seSAxIGNvbG91clxuICAgICAgcmV0dXJuIGJhc2VjbGFzcyArIFwiIFwiICsgYmFzZWNsYXNzICsgXCJuMVwiICsgXCIgXCIgKyBiYXNlY2xhc3MgKyAxO1xuICAgIH1cbiAgICB2YXIgcmFuZ2UgID0gZG9tYWluWzFdIC0gZG9tYWluWzBdO1xuICAgIHZhciB2YWwgICAgPSBNYXRoLnNxcnQoKHYgLSBkb21haW5bMF0pKjAuOTk5OSkgLyBNYXRoLnNxcnQocmFuZ2UpO1xuICAgIHZhciBjYXQgICAgPSBNYXRoLmZsb29yKHZhbCpuY29sb3Vycyk7XG4gICAgLy8gcmV0dXJucyBzb21ldGhpbmcgbGlrZSBcImNobG9ybyBjaGxvcm9uMTAgY2hsb3JvNFwiXG4gICAgcmV0dXJuIGJhc2VjbGFzcyArIFwiIFwiICsgYmFzZWNsYXNzICsgXCJuXCIgKyBuY29sb3VycyArIFwiIFwiICsgYmFzZWNsYXNzICsgKGNhdCsxKTtcbiAgfVxuXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9tYWluID0gZDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJhc2VjbGFzcztcbiAgICB9IGVsc2Uge1xuICAgICAgYmFzZWNsYXNzID0gcjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGVwID0gKGRvbWFpblsxXSAtIGRvbWFpblswXSkvbmNvbG91cnM7XG4gICAgdmFyIHQgPSBkb21haW5bMF07XG4gICAgdmFyIHRpY2tzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbmNvbG91cnM7ICsraSkge1xuICAgICAgdGlja3MucHVzaCh0KTtcbiAgICAgIHQgKz0gc3RlcDtcbiAgICB9XG4gICAgcmV0dXJuIHRpY2tzO1xuICB9O1xuXG4gIHJldHVybiBzY2FsZTtcbn1cblxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xuZ3JwaC5zY2FsZS5jaGxvcm9wbGV0aCA9IGdycGhfc2NhbGVfY2hsb3JvcGxldGgoKTtcblxuIiwiXG5mdW5jdGlvbiBncnBoX3NjYWxlX2NvbG91cigpIHtcblxuICB2YXIgZG9tYWluO1xuICB2YXIgcmFuZ2UgPSBcImNvbG91clwiO1xuICB2YXIgbmNvbG91cnM7XG5cbiAgZnVuY3Rpb24gc2NhbGUodikge1xuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gYXNzdW1lIHdlIGhhdmUgb25seSAxIGNvbG91clxuICAgICAgcmV0dXJuIHJhbmdlICsgXCIgXCIgKyByYW5nZSArIFwibjFcIiArIFwiIFwiICsgcmFuZ2UgKyAxO1xuICAgIH1cbiAgICB2YXIgaSA9IGRvbWFpbi5pbmRleE9mKHYpO1xuICAgIC8vIHJldHVybnMgc29tZXRoaW5nIGxpa2UgXCJjb2xvdXIgY29sb3VybjEwIGNvbG91cjRcIlxuICAgIHJldHVybiByYW5nZSArIFwiIFwiICsgcmFuZ2UgKyBcIm5cIiArIG5jb2xvdXJzICsgXCIgXCIgKyByYW5nZSArIChpKzEpO1xuICB9XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb21haW4gPSBkO1xuICAgICAgbmNvbG91cnMgPSBkLmxlbmd0aDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHJhbmdlO1xuICAgIH0gZWxzZSB7XG4gICAgICByYW5nZSA9IHI7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZG9tYWluO1xuICB9O1xuXG4gIHJldHVybiBzY2FsZTtcbn1cblxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xuZ3JwaC5zY2FsZS5jb2xvdXIgPSBncnBoX3NjYWxlX2NvbG91cigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfbGluZWFyKCkge1xuXG4gIHZhciBsc2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKTtcbiAgdmFyIGxhYmVsX3NpemVfID0gMjA7XG4gIHZhciBwYWRkaW5nXyA9IDU7XG4gIHZhciBudGlja3NfID0gMTA7XG4gIHZhciB0aWNrc187XG4gIHZhciBpbnNpZGVfID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XG4gICAgcmV0dXJuIGxzY2FsZSh2KTtcbiAgfVxuXG4gIHNjYWxlLmRvbWFpbiA9IGZ1bmN0aW9uKGQpIHtcbiAgICBkID0gbHNjYWxlLmRvbWFpbihkKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcbiAgICByID0gbHNjYWxlLnJhbmdlKHIpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gcjtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLmxhYmVsX3NpemUgPSBmdW5jdGlvbihsYWJlbF9zaXplKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBsYWJlbF9zaXplXztcbiAgICB9IGVsc2Uge1xuICAgICAgbGFiZWxfc2l6ZV8gPSBsYWJlbF9zaXplO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGxzaXplKGxhYmVsKSB7XG4gICAgdmFyIHNpemUgPSB0eXBlb2YobGFiZWxfc2l6ZV8pID09IFwiZnVuY3Rpb25cIiA/IGxhYmVsX3NpemVfKGxhYmVsKSA6IGxhYmVsX3NpemVfO1xuICAgIHNpemUgKz0gcGFkZGluZ187XG4gICAgcmV0dXJuIHNpemU7XG4gIH1cblxuICBzY2FsZS5udGlja3MgPSBmdW5jdGlvbihuKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBudGlja3NfO1xuICAgIH0gZWxzZSB7XG4gICAgICBudGlja3NfID0gbjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS5pbnNpZGUgPSBmdW5jdGlvbihpKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBpbnNpZGVfO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnNpZGVfID0gaSA/IHRydWUgOiBmYWxzZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS5uaWNlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHIgPSBsc2NhbGUucmFuZ2UoKTtcbiAgICB2YXIgZCA9IGxzY2FsZS5kb21haW4oKTtcbiAgICB2YXIgbCA9IE1hdGguYWJzKHJbMV0gLSByWzBdKTtcbiAgICB2YXIgdyA9IHdpbGtpbnNvbl9paShkWzBdLCBkWzFdLCBudGlja3NfLCBsc2l6ZSwgbCk7XG4gICAgaWYgKGluc2lkZV8pIHtcbiAgICAgIHZhciB3MSA9IGxzaXplKHcubGFiZWxzWzBdKTtcbiAgICAgIHZhciB3MiA9IGxzaXplKHcubGFiZWxzW3cubGFiZWxzLmxlbmd0aC0xXSk7XG4gICAgICB2YXIgcGFkID0gdzEvMiArIHcyLzI7XG4gICAgICB3ID0gd2lsa2luc29uX2lpKGRbMF0sIGRbMV0sIG50aWNrc18sIGxzaXplLCBsLXBhZCk7XG4gICAgICBpZiAoclswXSA8IHJbMV0pIHtcbiAgICAgICAgbHNjYWxlLnJhbmdlKFtyWzBdK3cxLzIsIHJbMV0tdzIvMl0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbHNjYWxlLnJhbmdlKFtyWzBdLXcxLzIsIHJbMV0rdzIvMl0pO1xuICAgICAgfVxuICAgIH1cbiAgICBkb21haW4gPSBbdy5sbWluLCB3LmxtYXhdO1xuICAgIGxzY2FsZS5kb21haW4oW3cubG1pbiwgdy5sbWF4XSk7XG4gICAgdGlja3NfID0gdy5sYWJlbHM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGlja3NfID09PSB1bmRlZmluZWQpIHJldHVybiBsc2NhbGUudGlja3MobnRpY2tzXyk7XG4gICAgcmV0dXJuIHRpY2tzXztcbiAgfTtcblxuICByZXR1cm4gc2NhbGU7XG59XG5cbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcbmdycGguc2NhbGUubGluZWFyID0gZ3JwaF9zY2FsZV9saW5lYXIoKTtcblxuIiwiXG5mdW5jdGlvbiBncnBoX3NjYWxlX3NpemUoKSB7XG4gIFxuICB2YXIgbWF4O1xuICB2YXIgZG9tYWluO1xuXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcbiAgICBpZiAoZG9tYWluID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBzZXR0aW5ncyhcImRlZmF1bHRfYnViYmxlXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbSA9IG1heCA9PT0gdW5kZWZpbmVkID8gc2V0dGluZ3MoXCJtYXhfYnViYmxlXCIpIDogbWF4O1xuICAgICAgcmV0dXJuIG0gKiBNYXRoLnNxcnQodikvTWF0aC5zcXJ0KGRvbWFpblsxXSk7XG4gICAgfVxuICB9XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb21haW4gPSBkMy5leHRlbnQoZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBtYXggPT09IHVuZGVmaW5lZCA/IHNldHRpbmdzKFwibWF4X2J1YmJsZVwiKSA6IG1heDtcbiAgICB9IGVsc2Uge1xuICAgICAgbWF4ID0gZDMubWF4KHIpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfTtcblxuICByZXR1cm4gc2NhbGU7XG59XG5cbmlmIChncnBoLnNjYWxlID09PSB1bmRlZmluZWQpIGdycGguc2NhbGUgPSB7fTtcbmdycGguc2NhbGUuc2l6ZSA9IGdycGhfc2NhbGVfc2l6ZSgpO1xuXG4iLCJcblxudmFyIHNldHRpbmdzID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzID0ge1xuICAgICdkZWZhdWx0JyA6IHtcbiAgICAgICdwYWRkaW5nJyA6IFsyLCAyLCAyLCAyXSxcbiAgICAgICdsYWJlbF9wYWRkaW5nJyA6IDQsXG4gICAgICAnc2VwJyA6IDgsXG4gICAgICAncG9pbnRfc2l6ZScgOiA0LFxuICAgICAgJ21heF9idWJibGUnIDogMjAsXG4gICAgICAnZGVmYXVsdF9idWJibGUnIDogNVxuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBnZXQoc2V0dGluZywgdHlwZSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gc2V0dGluZ3M7XG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICBpZiAoc1t0eXBlXSAhPT0gdW5kZWZpbmVkICYmIHNbdHlwZV1bc2V0dGluZ10gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gc1t0eXBlXVtzZXR0aW5nXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBzLmRlZmF1bHRbc2V0dGluZ107XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzLmRlZmF1bHRbc2V0dGluZ107XG4gICAgfVxuICB9XG5cbiAgZ2V0LnNldCA9IGZ1bmN0aW9uKHNldHRpbmcsIGEsIGIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgcy5kZWZhdWx0W3NldHRpbmddID0gYTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgICAgaWYgKHNbYV0gPT09IHVuZGVmaW5lZCkgc1thXSA9IHt9O1xuICAgICAgc1thXVtzZXR0aW5nXSA9IGI7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmVlZCBhdCBsZWF0IHR3byBhcmd1bWVudHMuXCIpO1xuICAgIH1cbiAgfTtcblxuICByZXR1cm4gZ2V0O1xufSgpO1xuXG5ncnBoLnNldHRpbmdzID0gc2V0dGluZ3M7XG4iLCJcbi8vIEZvcm1hdCBhIG51bWVyaWMgdmFsdWU6XG4vLyAtIE1ha2Ugc3VyZSBpdCBpcyByb3VuZGVkIHRvIHRoZSBjb3JyZWN0IG51bWJlciBvZiBkZWNpbWFscyAobmRlYylcbi8vIC0gVXNlIHRoZSBjb3JyZWN0IGRlY2ltYWwgc2VwYXJhdG9yIChkZWMpXG4vLyAtIEFkZCBhIHRob3VzYW5kcyBzZXBhcmF0b3IgKGdycClcbmZvcm1hdF9udW1lcmljID0gZnVuY3Rpb24obGFiZWwsIHVuaXQsIG5kZWMsIGRlYywgZ3JwKSB7XG4gIGlmIChpc05hTihsYWJlbCkpIHJldHVybiAnJztcbiAgaWYgKHVuaXQgPT09IHVuZGVmaW5lZCkgdW5pdCA9ICcnO1xuICBpZiAoZGVjID09PSB1bmRlZmluZWQpIGRlYyA9ICcsJztcbiAgaWYgKGdycCA9PT0gdW5kZWZpbmVkKSBncnAgPSAnICc7XG4gIC8vIHJvdW5kIG51bWJlclxuICBpZiAobmRlYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbGFiZWwgPSBsYWJlbC50b0ZpeGVkKG5kZWMpO1xuICB9IGVsc2Uge1xuICAgIGxhYmVsID0gbGFiZWwudG9TdHJpbmcoKTtcbiAgfVxuICAvLyBGb2xsb3dpbmcgYmFzZWQgb24gY29kZSBmcm9tIFxuICAvLyBodHRwOi8vd3d3Lm1yZWRrai5jb20vamF2YXNjcmlwdC9udW1iZXJGb3JtYXQuaHRtbFxuICB4ICAgICA9IGxhYmVsLnNwbGl0KCcuJyk7XG4gIHgxICAgID0geFswXTtcbiAgeDIgICAgPSB4Lmxlbmd0aCA+IDEgPyBkZWMgKyB4WzFdIDogJyc7XG4gIGlmIChncnAgIT09ICcnKSB7XG4gICAgdmFyIHJneCA9IC8oXFxkKykoXFxkezN9KS87XG4gICAgd2hpbGUgKHJneC50ZXN0KHgxKSkge1xuICAgICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArIGdycCArICckMicpO1xuICAgIH1cbiAgfVxuICByZXR1cm4oeDEgKyB4MiArIHVuaXQpO1xufTtcblxuXG5cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vID09PT0gICAgICAgICAgICAgICAgICAgICAgICAgV0lMS0lOU09OIEFMR09SSVRITSAgICAgICAgICAgICAgICAgICAgICAgID09PT1cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuXG5mdW5jdGlvbiB3aWxraW5zb25faWkoZG1pbiwgZG1heCwgbSwgY2FsY19sYWJlbF93aWR0aCwgYXhpc193aWR0aCwgbW1pbiwgbW1heCwgUSwgcHJlY2lzaW9uLCBtaW5jb3ZlcmFnZSkge1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09IFNVQlJPVVRJTkVTID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIC8vIFRoZSBmb2xsb3dpbmcgcm91dGluZSBjaGVja3MgZm9yIG92ZXJsYXAgaW4gdGhlIGxhYmVscy4gVGhpcyBpcyB1c2VkIGluIHRoZSBcbiAgLy8gV2lsa2luc29uIGxhYmVsaW5nIGFsZ29yaXRobSBiZWxvdyB0byBlbnN1cmUgdGhhdCB0aGUgbGFiZWxzIGRvIG5vdCBvdmVybGFwLlxuICBmdW5jdGlvbiBvdmVybGFwKGxtaW4sIGxtYXgsIGxzdGVwLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBuZGVjKSB7XG4gICAgdmFyIHdpZHRoX21heCA9IGxzdGVwKmF4aXNfd2lkdGgvKGxtYXgtbG1pbik7XG4gICAgZm9yICh2YXIgbCA9IGxtaW47IChsIC0gbG1heCkgPD0gMUUtMTA7IGwgKz0gbHN0ZXApIHtcbiAgICAgIHZhciB3ICA9IGNhbGNfbGFiZWxfd2lkdGgobCwgbmRlYyk7XG4gICAgICBpZiAodyA+IHdpZHRoX21heCkgcmV0dXJuKHRydWUpO1xuICAgIH1cbiAgICByZXR1cm4oZmFsc2UpO1xuICB9XG5cbiAgLy8gUGVyZm9ybSBvbmUgaXRlcmF0aW9uIG9mIHRoZSBXaWxraW5zb24gYWxnb3JpdGhtXG4gIGZ1bmN0aW9uIHdpbGtpbnNvbl9zdGVwKG1pbiwgbWF4LCBrLCBtLCBRLCBtaW5jb3ZlcmFnZSkge1xuICAgIC8vIGRlZmF1bHQgdmFsdWVzXG4gICAgUSAgICAgICAgICAgICAgID0gUSAgICAgICAgIHx8IFsxMCwgMSwgNSwgMiwgMi41LCAzLCA0LCAxLjUsIDcsIDYsIDgsIDldO1xuICAgIHByZWNpc2lvbiAgICAgICA9IHByZWNpc2lvbiB8fCBbMSwgIDAsIDAsIDAsICAtMSwgMCwgMCwgIC0xLCAwLCAwLCAwLCAwXTtcbiAgICBtaW5jb3ZlcmFnZSAgICAgPSBtaW5jb3ZlcmFnZSB8fCAwLjg7XG4gICAgbSAgICAgICAgICAgICAgID0gbSB8fCBrO1xuICAgIC8vIGNhbGN1bGF0ZSBzb21lIHN0YXRzIG5lZWRlZCBpbiBsb29wXG4gICAgdmFyIGludGVydmFscyAgID0gayAtIDE7XG4gICAgdmFyIGRlbHRhICAgICAgID0gKG1heCAtIG1pbikgLyBpbnRlcnZhbHM7XG4gICAgdmFyIGJhc2UgICAgICAgID0gTWF0aC5mbG9vcihNYXRoLmxvZyhkZWx0YSkvTWF0aC5MTjEwKTtcbiAgICB2YXIgZGJhc2UgICAgICAgPSBNYXRoLnBvdygxMCwgYmFzZSk7XG4gICAgLy8gY2FsY3VsYXRlIGdyYW51bGFyaXR5OyBvbmUgb2YgdGhlIHRlcm1zIGluIHNjb3JlXG4gICAgdmFyIGdyYW51bGFyaXR5ID0gMSAtIE1hdGguYWJzKGstbSkvbTtcbiAgICAvLyBpbml0aWFsaXNlIGVuZCByZXN1bHRcbiAgICB2YXIgYmVzdDtcbiAgICAvLyBsb29wIHRocm91Z2ggYWxsIHBvc3NpYmxlIGxhYmVsIHBvc2l0aW9ucyB3aXRoIGdpdmVuIGtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgUS5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gY2FsY3VsYXRlIGxhYmVsIHBvc2l0aW9uc1xuICAgICAgdmFyIHRkZWx0YSA9IFFbaV0gKiBkYmFzZTtcbiAgICAgIHZhciB0bWluICAgPSBNYXRoLmZsb29yKG1pbi90ZGVsdGEpICogdGRlbHRhO1xuICAgICAgdmFyIHRtYXggICA9IHRtaW4gKyBpbnRlcnZhbHMgKiB0ZGVsdGE7XG4gICAgICAvLyBjYWxjdWxhdGUgdGhlIG51bWJlciBvZiBkZWNpbWFsc1xuICAgICAgdmFyIG5kZWMgICA9IChiYXNlICsgcHJlY2lzaW9uW2ldKSA8IDAgPyBNYXRoLmFicyhiYXNlICsgcHJlY2lzaW9uW2ldKSA6IDA7XG4gICAgICAvLyBpZiBsYWJlbCBwb3NpdGlvbnMgY292ZXIgcmFuZ2VcbiAgICAgIGlmICh0bWluIDw9IG1pbiAmJiB0bWF4ID49IG1heCkge1xuICAgICAgICAvLyBjYWxjdWxhdGUgcm91bmRuZXNzIGFuZCBjb3ZlcmFnZSBwYXJ0IG9mIHNjb3JlXG4gICAgICAgIHZhciByb3VuZG5lc3MgPSAxIC0gKGkgLSAodG1pbiA8PSAwICYmIHRtYXggPj0gMCkpIC8gUS5sZW5ndGg7XG4gICAgICAgIHZhciBjb3ZlcmFnZSAgPSAobWF4LW1pbikvKHRtYXgtdG1pbik7XG4gICAgICAgIC8vIGlmIGNvdmVyYWdlIGhpZ2ggZW5vdWdoXG4gICAgICAgIGlmIChjb3ZlcmFnZSA+IG1pbmNvdmVyYWdlICYmICFvdmVybGFwKHRtaW4sIHRtYXgsIHRkZWx0YSwgY2FsY19sYWJlbF93aWR0aCwgYXhpc193aWR0aCwgbmRlYykpIHtcbiAgICAgICAgICAvLyBjYWxjdWxhdGUgc2NvcmVcbiAgICAgICAgICB2YXIgdG5pY2UgPSBncmFudWxhcml0eSArIHJvdW5kbmVzcyArIGNvdmVyYWdlO1xuICAgICAgICAgIC8vIGlmIGhpZ2hlc3Qgc2NvcmVcbiAgICAgICAgICBpZiAoKGJlc3QgPT09IHVuZGVmaW5lZCkgfHwgKHRuaWNlID4gYmVzdC5zY29yZSkpIHtcbiAgICAgICAgICAgIGJlc3QgPSB7XG4gICAgICAgICAgICAgICAgJ2xtaW4nICA6IHRtaW4sXG4gICAgICAgICAgICAgICAgJ2xtYXgnICA6IHRtYXgsXG4gICAgICAgICAgICAgICAgJ2xzdGVwJyA6IHRkZWx0YSxcbiAgICAgICAgICAgICAgICAnc2NvcmUnIDogdG5pY2UsXG4gICAgICAgICAgICAgICAgJ25kZWMnICA6IG5kZWNcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gcmV0dXJuXG4gICAgcmV0dXJuIChiZXN0KTtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gTUFJTiA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIGRlZmF1bHQgdmFsdWVzXG4gIGRtaW4gICAgICAgICAgICAgPSBOdW1iZXIoZG1pbik7XG4gIGRtYXggICAgICAgICAgICAgPSBOdW1iZXIoZG1heCk7XG4gIGlmIChNYXRoLmFicyhkbWluIC0gZG1heCkgPCAxRS0xMCkge1xuICAgIGRtaW4gPSAwLjk2KmRtaW47XG4gICAgZG1heCA9IDEuMDQqZG1heDtcbiAgfVxuICBjYWxjX2xhYmVsX3dpZHRoID0gY2FsY19sYWJlbF93aWR0aCB8fCBmdW5jdGlvbigpIHsgcmV0dXJuKDApO307XG4gIGF4aXNfd2lkdGggICAgICAgPSBheGlzX3dpZHRoIHx8IDE7XG4gIFEgICAgICAgICAgICAgICAgPSBRICAgICAgICAgfHwgWzEwLCAxLCA1LCAyLCAyLjUsIDMsIDQsIDEuNSwgNywgNiwgOCwgOV07XG4gIHByZWNpc2lvbiAgICAgICAgPSBwcmVjaXNpb24gfHwgWzEsICAwLCAwLCAwLCAgLTEsIDAsIDAsICAtMSwgMCwgMCwgMCwgMF07XG4gIG1pbmNvdmVyYWdlICAgICAgPSBtaW5jb3ZlcmFnZSB8fCAwLjg7XG4gIG1taW4gICAgICAgICAgICAgPSBtbWluIHx8IDI7XG4gIG1tYXggICAgICAgICAgICAgPSBtbWF4IHx8IE1hdGguY2VpbCg2Km0pO1xuICAvLyBpbml0aWxpc2UgZW5kIHJlc3VsdFxuICB2YXIgYmVzdCA9IHtcbiAgICAgICdsbWluJyAgOiBkbWluLFxuICAgICAgJ2xtYXgnICA6IGRtYXgsXG4gICAgICAnbHN0ZXAnIDogKGRtYXggLSBkbWluKSxcbiAgICAgICdzY29yZScgOiAtMUU4LFxuICAgICAgJ25kZWMnICA6IDBcbiAgICB9O1xuICAvLyBjYWxjdWxhdGUgbnVtYmVyIG9mIGRlY2ltYWwgcGxhY2VzXG4gIHZhciB4ID0gU3RyaW5nKGJlc3QubHN0ZXApLnNwbGl0KCcuJyk7XG4gIGJlc3QubmRlYyA9IHgubGVuZ3RoID4gMSA/IHhbMV0ubGVuZ3RoIDogMDtcbiAgLy8gbG9vcCB0aG91Z2ggYWxsIHBvc3NpYmxlIG51bWJlcnMgb2YgbGFiZWxzXG4gIGZvciAodmFyIGsgPSBtbWluOyBrIDw9IG1tYXg7IGsrKykgeyBcbiAgICAvLyBjYWxjdWxhdGUgYmVzdCBsYWJlbCBwb3NpdGlvbiBmb3IgY3VycmVudCBudW1iZXIgb2YgbGFiZWxzXG4gICAgdmFyIHJlc3VsdCA9IHdpbGtpbnNvbl9zdGVwKGRtaW4sIGRtYXgsIGssIG0sIFEsIG1pbmNvdmVyYWdlKTtcbiAgICAvLyBjaGVjayBpZiBjdXJyZW50IHJlc3VsdCBoYXMgaGlnaGVyIHNjb3JlXG4gICAgaWYgKChyZXN1bHQgIT09IHVuZGVmaW5lZCkgJiYgKChiZXN0ID09PSB1bmRlZmluZWQpIHx8IChyZXN1bHQuc2NvcmUgPiBiZXN0LnNjb3JlKSkpIHtcbiAgICAgIGJlc3QgPSByZXN1bHQ7XG4gICAgfVxuICB9XG4gIC8vIGdlbmVyYXRlIGxhYmVsIHBvc2l0aW9uc1xuICB2YXIgbGFiZWxzID0gW107XG4gIGZvciAodmFyIGwgPSBiZXN0LmxtaW47IChsIC0gYmVzdC5sbWF4KSA8PSAxRS0xMDsgbCArPSBiZXN0LmxzdGVwKSB7XG4gICAgbGFiZWxzLnB1c2gobCk7XG4gIH1cbiAgYmVzdC5sYWJlbHMgPSBsYWJlbHM7XG4gIHJldHVybihiZXN0KTtcbn1cblxuXG4iLCIgIFxuICBncnBoLmxpbmUgPSBncnBoX2dyYXBoX2xpbmU7XG4gIGdycGgubWFwID0gZ3JwaF9ncmFwaF9tYXA7XG4gIGdycGguYnViYmxlID0gZ3JwaF9ncmFwaF9idWJibGU7XG5cbiAgdGhpcy5ncnBoID0gZ3JwaDtcblxufSgpKTtcblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9