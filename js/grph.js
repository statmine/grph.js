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
        var vals = data.map(function(d) { return d[variable];}).sort();
        var prev;
        for (var i = 0; i < vals.length; ++i) {
          if (vals[i] != prev) categories.push(vals[i]);
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
    for (var axis in axes) axes[axis].domain(graph.data(), graph.schema());
    /*axes.colour.domain(graph.data(), graph.schema());
    axes.object.domain(graph.data(), graph.schema()); 
    axes.size.domain(graph.data(), graph.schema());
    axes.column.domain(graph.data(), graph.schema());
    axes.row.domain(graph.data(), graph.schema());*/
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
    // create group containing complete graph
    g = g.append("g").attr("class", "graph graph-bubble");
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

  function graph_panel(g, data) {
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
  }

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
    // create group containing complete graph
    g = g.append("g").attr("class", "graph graph-line");
    // draw labels
    var ycenter = t + 0.5*(graph.height() - settings('padding')[0] - settings('padding')[2] - 
        axes.x.height() - label_height);
    var xcenter = l + 0.5*(graph.width() - settings('padding')[1] - settings('padding')[3] - 
        axes.y.width() - label_height);
    g.append("text").attr("class", "label label-y")
      .attr("x", settings('padding')[1]).attr("y", ycenter)
      .attr("text-anchor", "middle").text(ylabel)
      .attr("transform", "rotate(90 " + settings('padding')[1] + " " + ycenter + ")");
    g.append("text").attr("class", "label label-y")
      .attr("x", xcenter).attr("y", graph.height()-settings('padding')[0])
      .attr("text-anchor", "middle").text(xlabel);
    // create each of the panels
    var d = d3.nest().key(nest_column).key(nest_row).entries(graph.data());
    for (i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      t  = settings('padding')[2];
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
        // draw lines
        graph_panel(gr, dj[j].values);
        // next panel
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
    var tip = d3.tip().attr('class', 'd3-tip').html(function(variable, value, d) { 
      return "<b>" + value + "</b>";
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


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJlZ2luLmpzIiwiYXhpc19jaGxvcm9wbGV0aC5qcyIsImF4aXNfY29sb3VyLmpzIiwiYXhpc19saW5lYXIuanMiLCJheGlzX3JlZ2lvbi5qcyIsImF4aXNfc2l6ZS5qcyIsImF4aXNfc3BsaXQuanMiLCJkYXRhcGFja2FnZS5qcyIsImdyYXBoLmpzIiwiZ3JhcGhfYnViYmxlLmpzIiwiZ3JhcGhfbGluZS5qcyIsImdyYXBoX21hcC5qcyIsImxhYmVsX3NpemUuanMiLCJzY2FsZV9jaGxvcm9wbGV0aC5qcyIsInNjYWxlX2NvbG91ci5qcyIsInNjYWxlX2xpbmVhci5qcyIsInNjYWxlX3NpemUuanMiLCJzZXR0aW5ncy5qcyIsIndpbGtpbnNvbi5qcyIsImVuZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOUxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdycGguanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKSB7XG4gIGdycGggPSB7fTtcbiIsIlxuZnVuY3Rpb24gZ3JwaF9heGlzX2NobG9yb3BsZXRoKCkge1xuXG4gIHZhciB2YXJpYWJsZTtcbiAgdmFyIHdpZHRoLCBoZWlnaHQ7XG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY2hsb3JvcGxldGgoKTtcblxuICBmdW5jdGlvbiBheGlzKGcpIHtcbiAgfVxuXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB3O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWlnaHQgPSBoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZSA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodmFyaWFibGUgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XG4gICAgICBzY2FsZS5kb21haW4oZDMuZXh0ZW50KGRhdGEsIGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbdmFyaWFibGVdO30pKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNjYWxlLnRpY2tzKCk7XG4gIH07XG5cbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXG4gICAgICByZXR1cm4gYXhpcy5zY2FsZSh2W3ZhcmlhYmxlXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMuY2hsb3JvcGxldGggPSBncnBoX2F4aXNfY2hsb3JvcGxldGgoKTtcblxuIiwiXG5mdW5jdGlvbiBncnBoX2F4aXNfY29sb3VyKCkge1xuXG4gIHZhciBzY2FsZSA9IGdycGhfc2NhbGVfY29sb3VyKCk7XG4gIHZhciB2YXJpYWJsZV87XG4gIHZhciB3aWR0aF8sIGhlaWdodF87XG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGhfID0gd2lkdGg7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodF87XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIgfHwgdnNjaGVtYS50eXBlID09IFwicGVyaW9kXCI7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlXztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyaWFibGVfID0gdjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gc2NhbGUuZG9tYWluKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh2YXJpYWJsZV8gPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XG4gICAgICB2YXIgY2F0ZWdvcmllcyA9IFtdO1xuICAgICAgaWYgKHZzY2hlbWEudHlwZSA9PSBcImNhdGVnb3JpY2FsXCIpIHtcbiAgICAgICAgY2F0ZWdvcmllcyA9IHZzY2hlbWEuY2F0ZWdvcmllcy5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5uYW1lOyB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciB2YWxzID0gZGF0YS5tYXAoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV07fSkuc29ydCgpO1xuICAgICAgICB2YXIgcHJldjtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWxzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgaWYgKHZhbHNbaV0gIT0gcHJldikgY2F0ZWdvcmllcy5wdXNoKHZhbHNbaV0pO1xuICAgICAgICAgIHByZXYgPSB2YWxzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzY2FsZS5kb21haW4oY2F0ZWdvcmllcyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIHNjYWxlKHZbdmFyaWFibGVfXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMuY29sb3VyID0gZ3JwaF9heGlzX2NvbG91cigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfYXhpc19saW5lYXIoaG9yaXpvbnRhbCkge1xuXG4gIHZhciBzY2FsZV8gPSBncnBoX3NjYWxlX2xpbmVhcigpO1xuICB2YXIgaG9yaXpvbnRhbF8gPSBob3Jpem9udGFsO1xuICB2YXIgdmFyaWFibGVfO1xuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xuICB2YXIgc2V0dGluZ3NfID0ge1xuICAgIFwidGlja19sZW5ndGhcIiA6IDUsXG4gICAgXCJ0aWNrX3BhZGRpbmdcIiA6IDIsXG4gICAgXCJwYWRkaW5nXCIgOiA0XG4gIH07XG5cbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImxpbmVhcmF4aXMgZHVtbXlcIilcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaW52aXNpYmxlXCIpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcbiAgaWYgKGhvcml6b250YWxfKSBzY2FsZV8ubGFiZWxfc2l6ZShsYWJlbF9zaXplXy53aWR0aCk7XG4gIGVsc2Ugc2NhbGVfLmxhYmVsX3NpemUobGFiZWxfc2l6ZV8uaGVpZ2h0KTtcbiAgXG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gICAgdmFyIHRpY2tzID0gYXhpcy50aWNrcygpO1xuICAgIGcuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAuYXR0cihcIndpZHRoXCIsIGF4aXMud2lkdGgoKSkuYXR0cihcImhlaWdodFwiLCBheGlzLmhlaWdodCgpKTtcbiAgICBpZiAoaG9yaXpvbnRhbCkge1xuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCBzY2FsZV8pLmF0dHIoXCJ4MlwiLCBzY2FsZV8pXG4gICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcInkyXCIsIHNldHRpbmdzXy50aWNrX2xlbmd0aCk7XG4gICAgICBnLnNlbGVjdEFsbChcIi50aWNrbGFiZWxcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHNjYWxlXykuYXR0cihcInlcIiwgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIwLjcxZW1cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB3ID0gYXhpcy53aWR0aCgpO1xuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja1wiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCB3LXNldHRpbmdzXy50aWNrX2xlbmd0aCkuYXR0cihcIngyXCIsIHcpXG4gICAgICAgIC5hdHRyKFwieTFcIiwgc2NhbGVfKS5hdHRyKFwieTJcIiwgc2NhbGVfKTtcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tsYWJlbFwiKS5kYXRhKHRpY2tzKS5lbnRlcigpXG4gICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcInRpY2tsYWJlbFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgc2V0dGluZ3NfLnBhZGRpbmcpLmF0dHIoXCJ5XCIsIHNjYWxlXylcbiAgICAgICAgLnRleHQoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDt9KVxuICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwiYmVnaW5cIilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIjAuMzVlbVwiKTtcbiAgICB9XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICBpZiAoaG9yaXpvbnRhbF8pIHtcbiAgICAgIC8vIGlmIGhvcml6b250YWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZ2l2ZW47IHRoaXMgZGVmaW5lcyB0aGUgcmFuZ2Ugb2ZcbiAgICAgIC8vIHRoZSBzY2FsZVxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZHRoXyA9IHdpZHRoO1xuICAgICAgICBzY2FsZV8ucmFuZ2UoWzAsIHdpZHRoX10pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdmVydGljYWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZGVmaW5lZCBieSB0aGUgZ3JhcGg6IHRoZSBzcGFjZSBpdFxuICAgICAgLy8gbmVlZHMgdG8gZHJhdyB0aGUgdGlja21hcmtzIGFuZCBsYWJlbHMgZXRjLiBcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGlmICh3aWR0aF8gPT09IHVuZGVmaW5lZCkgey8vIFRPRE8gcmVzZXQgd2lkdGhfIHdoZW4gbGFiZWxzIGNoYW5nZVxuICAgICAgICAgIHZhciB0aWNrcyA9IHNjYWxlXy50aWNrcygpO1xuICAgICAgICAgIHZhciB3ID0gMDtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbHcgPSBsYWJlbF9zaXplXy53aWR0aCh0aWNrc1tpXSk7XG4gICAgICAgICAgICBpZiAobHcgPiB3KSB3ID0gbHc7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdpZHRoXyA9IHcgKyBzZXR0aW5nc18udGlja19sZW5ndGggKyBzZXR0aW5nc18udGlja19wYWRkaW5nICsgc2V0dGluZ3NfLnBhZGRpbmc7ICBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gd2lkdGhfO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2lkdGhfID0gd2lkdGg7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChob3Jpem9udGFsXykge1xuICAgICAgLy8gaWYgaG9yaXpvbnRhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBkZWZpbmVkIGJ5IHRoZSBncmFwaDogdGhlIHNwYWNlIGl0XG4gICAgICAvLyBuZWVkcyB0byBkcmF3IHRoZSB0aWNrbWFya3MgYW5kIGxhYmVscyBldGMuIFxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgaWYgKGhlaWdodF8gPT09IHVuZGVmaW5lZCkgeyAvLyBUT0RPIHJlc2V0IGhlaWdodF8gd2hlbiBsYWJlbHMgY2hhbmdlXG4gICAgICAgICAgdmFyIHRpY2tzID0gc2NhbGVfLnRpY2tzKCk7XG4gICAgICAgICAgdmFyIGggPSAwO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGlja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBsaCA9IGxhYmVsX3NpemVfLmhlaWdodCh0aWNrc1tpXSk7XG4gICAgICAgICAgICBpZiAobGggPiBoKSBoID0gbGg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGhlaWdodF8gPSBoICsgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZyArIHNldHRpbmdzXy5wYWRkaW5nOyBcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBpZiB2ZXJ0aWNhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBnaXZlbjsgdGhpcyBkZWZpbmVzIHRoZSByYW5nZSBvZlxuICAgICAgLy8gdGhlIHNjYWxlXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICAgIHNjYWxlXy5yYW5nZShbaGVpZ2h0XywgMF0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnbnVtYmVyJztcbiAgfTtcblxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZV8gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzY2FsZV8uZG9tYWluKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciByYW5nZSA9IGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlX107fSk7XG4gICAgICBzY2FsZV8uZG9tYWluKHJhbmdlKS5uaWNlKCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZV8udGlja3MoKTtcbiAgfTtcblxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xuICAgIGlmICh0eXBlb2YgdiA9PSAnb2JqZWN0JykgeyBcbiAgICAgIHJldHVybiBzY2FsZV8odlt2YXJpYWJsZV9dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHNjYWxlXyh2KTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG5cbmlmIChncnBoLmF4aXMgPT09IHVuZGVmaW5lZCkgZ3JwaC5heGlzID0ge307XG5ncnBoLmF4aXMubGluZWFyID0gZ3JwaF9heGlzX2xpbmVhcigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfYXhpc19yZWdpb24oKSB7XG5cbiAgdmFyIHZhcmlhYmxlXztcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcbiAgdmFyIG1hcF9sb2FkZWRfO1xuICB2YXIgbWFwXztcbiAgdmFyIGluZGV4XyA9IHt9O1xuXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xuICB9XG5cbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aF87XG4gICAgfSBlbHNlIHtcbiAgICAgIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IHVwZGF0ZV9wcm9qZWN0aW9uXyB8fCB3aWR0aF8gIT0gd2lkdGg7XG4gICAgICB3aWR0aF8gPSB3aWR0aDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdXBkYXRlX3Byb2plY3Rpb25fIHx8IGhlaWdodF8gIT0gaGVpZ2h0O1xuICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdzdHJpbmcnO1xuICB9O1xuXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhcmlhYmxlXyA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgLy8gVmFyaWFibGUgYW5kIGZ1bmN0aW9uIHRoYXQga2VlcHMgdHJhY2sgb2Ygd2hldGhlciBvciBub3QgdGhlIG1hcCBoYXMgXG4gIC8vIGZpbmlzaGVkIGxvYWRpbmcuIFRoZSBtZXRob2QgZG9tYWluKCkgbG9hZHMgdGhlIG1hcC4gSG93ZXZlciwgdGhpcyBoYXBwZW5zXG4gIC8vIGFzeW5jaHJvbm91c2x5LiBUaGVyZWZvcmUsIGl0IGlzIHBvc3NpYmxlIChhbmQgb2Z0ZW4gaGFwcGVucykgdGhhdCB0aGUgbWFwXG4gIC8vIGhhcyBub3QgeWV0IGxvYWRlZCB3aGVuIHNjYWxlKCkgYW5kIHRyYW5zZm9ybSgpIGFyZSBjYWxsZWQuIFRoZSBjb2RlIFxuICAvLyBjYWxsaW5nIHRoZXNlIG1ldGhvZHMgdGhlcmVmb3JlIG5lZWRzIHRvIHdhaXQgdW50aWwgdGhlIG1hcCBoYXMgbG9hZGVkLiBcbiAgdmFyIG1hcF9sb2FkaW5nXyA9IGZhbHNlOyBcbiAgYXhpcy5tYXBfbG9hZGVkID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICFtYXBfbG9hZGluZ187XG4gIH07XG5cbiAgZnVuY3Rpb24gbG9hZF9tYXAoZGF0YSwgc2NoZW1hLCBjYWxsYmFjaykge1xuICAgIGlmICh2YXJpYWJsZV8gPT09IHVuZGVmaW5lZCkgcmV0dXJuIDsgLy8gVE9ET1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcbiAgICBpZiAodnNjaGVtYS5tYXAgPT09IHVuZGVmaW5lZCkgcmV0dXJuIDsgLy8gVE9ET1xuICAgIGlmICh2c2NoZW1hLm1hcCA9PSBtYXBfbG9hZGVkXykgcmV0dXJuOyBcbiAgICBtYXBfbG9hZGluZ18gPSB0cnVlO1xuICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyBpbiBkMy5qc29uXG4gICAgZDMuanNvbih2c2NoZW1hLm1hcCwgZnVuY3Rpb24oanNvbikge1xuICAgICAgbWFwX2xvYWRlZF8gPSB2c2NoZW1hLm1hcDtcbiAgICAgIGNhbGxiYWNrKGpzb24pO1xuICAgICAgbWFwX2xvYWRpbmdfID0gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvL3JldHVybiBzY2FsZS5kb21haW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbG9hZF9tYXAoZGF0YSwgc2NoZW1hLCBmdW5jdGlvbihtYXApIHtcbiAgICAgICAgbWFwXyA9IG1hcDtcbiAgICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdHJ1ZTtcbiAgICAgICAgLy8gYnVpbGQgaW5kZXggbWFwcGluZyByZWdpb24gbmFtZSBvbiBmZWF0dXJlcyBcbiAgICAgICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGVfLCBzY2hlbWEpO1xuICAgICAgICB2YXIgcmVnaW9uaWQgPSB2c2NoZW1hLnJlZ2lvbmlkIHx8IFwiaWRcIjtcbiAgICAgICAgZm9yICh2YXIgZmVhdHVyZSBpbiBtYXBfLmZlYXR1cmVzKSB7XG4gICAgICAgICAgdmFyIG5hbWUgPSBtYXBfLmZlYXR1cmVzW2ZlYXR1cmVdLnByb3BlcnRpZXNbcmVnaW9uaWRdO1xuICAgICAgICAgIGluZGV4X1tuYW1lXSA9IGZlYXR1cmU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIGF4aXMuc2NhbGUodlt2YXJpYWJsZV9dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXhpcy51cGRhdGVfcHJvamVjdGlvbigpO1xuICAgICAgcmV0dXJuIHBhdGhfKG1hcF8uZmVhdHVyZXNbaW5kZXhfW3ZdXSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIFRoZSBwcm9qZWN0aW9uLiBDYWxjdWxhdGluZyB0aGUgc2NhbGUgYW5kIHRyYW5zbGF0aW9uIG9mIHRoZSBwcm9qZWN0aW9uIFxuICAvLyB0YWtlcyB0aW1lLiBUaGVyZWZvcmUsIHdlIG9ubHkgd2FudCB0byBkbyB0aGF0IHdoZW4gbmVjZXNzYXJ5LiBcbiAgLy8gdXBkYXRlX3Byb2plY3Rpb25fIGtlZXBzIHRyYWNrIG9mIHdoZXRoZXIgb3Igbm90IHRoZSBwcm9qZWN0aW9uIG5lZWRzIFxuICAvLyByZWNhbGN1bGF0aW9uXG4gIHZhciB1cGRhdGVfcHJvamVjdGlvbl8gPSB0cnVlO1xuICAvLyB0aGUgcHJvamVjdGlvblxuICB2YXIgcHJvamVjdGlvbl8gPSBkMy5nZW8udHJhbnN2ZXJzZU1lcmNhdG9yKClcbiAgICAucm90YXRlKFstNS4zODcyMDYyMSwgLTUyLjE1NTE3NDQwXSkuc2NhbGUoMSkudHJhbnNsYXRlKFswLDBdKTtcbiAgdmFyIHBhdGhfID0gZDMuZ2VvLnBhdGgoKS5wcm9qZWN0aW9uKHByb2plY3Rpb25fKTtcbiAgLy8gZnVuY3Rpb24gdGhhdCByZWNhbGN1bGF0ZXMgdGhlIHNjYWxlIGFuZCB0cmFuc2xhdGlvbiBvZiB0aGUgcHJvamVjdGlvblxuICBheGlzLnVwZGF0ZV9wcm9qZWN0aW9uID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHVwZGF0ZV9wcm9qZWN0aW9uXyAmJiBtYXBfKSB7XG4gICAgICBwcm9qZWN0aW9uXy5zY2FsZSgxKS50cmFuc2xhdGUoWzAsMF0pO1xuICAgICAgcGF0aF8gPSBkMy5nZW8ucGF0aCgpLnByb2plY3Rpb24ocHJvamVjdGlvbl8pO1xuICAgICAgdmFyIGJvdW5kcyA9IHBhdGhfLmJvdW5kcyhtYXBfKTtcbiAgICAgIHZhciBzY2FsZSAgPSAwLjk1IC8gTWF0aC5tYXgoKGJvdW5kc1sxXVswXSAtIGJvdW5kc1swXVswXSkgLyB3aWR0aF8sIFxuICAgICAgICAgICAgICAgICAgKGJvdW5kc1sxXVsxXSAtIGJvdW5kc1swXVsxXSkgLyBoZWlnaHRfKTtcbiAgICAgIHZhciB0cmFuc2wgPSBbKHdpZHRoXyAtIHNjYWxlICogKGJvdW5kc1sxXVswXSArIGJvdW5kc1swXVswXSkpIC8gMiwgXG4gICAgICAgICAgICAgICAgICAoaGVpZ2h0XyAtIHNjYWxlICogKGJvdW5kc1sxXVsxXSArIGJvdW5kc1swXVsxXSkpIC8gMl07XG4gICAgICBwcm9qZWN0aW9uXy5zY2FsZShzY2FsZSkudHJhbnNsYXRlKHRyYW5zbCk7XG4gICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSBmYWxzZTtcbiAgICB9XG4gIH07XG5cblxuICByZXR1cm4gYXhpcztcbn1cblxuLy8gQSBmdW5jdGlvbiBleHBlY3RpbmcgdHdvIGZ1bmN0aW9ucy4gVGhlIHNlY29uZCBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB0aGUgXG4vLyBmaXJzdCBmdW5jdGlvbiByZXR1cm5zIHRydWUuIFdoZW4gdGhlIGZpcnN0IGZ1bmN0aW9uIGRvZXMgbm90IHJldHVybiB0cnVlXG4vLyB3ZSB3YWl0IGZvciAxMDBtcyBhbmQgdHJ5IGFnYWluLiBcbnZhciB3YWl0X2ZvciA9IGZ1bmN0aW9uKG0sIGYpIHtcbiAgaWYgKG0oKSkge1xuICAgIGYoKTtcbiAgfSBlbHNlIHtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkgeyB3YWl0X2ZvcihtLCBmKTt9LCAxMDApO1xuICB9XG59O1xuXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xuZ3JwaC5heGlzLmxpbmVhciA9IGdycGhfYXhpc19saW5lYXIoKTtcblxuIiwiXG5mdW5jdGlvbiBncnBoX2F4aXNfc2l6ZSgpIHtcblxuICB2YXIgdmFyaWFibGVfO1xuICB2YXIgd2lkdGgsIGhlaWdodDtcbiAgdmFyIHNjYWxlID0gZ3JwaF9zY2FsZV9zaXplKCk7XG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24odykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gd2lkdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZHRoID0gdztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVpZ2h0ID0gaDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdudW1iZXInO1xuICB9O1xuXG4gIGF4aXMudmFyaWFibGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB2YXJpYWJsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyaWFibGUgPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMuZG9tYWluID0gZnVuY3Rpb24oZGF0YSwgc2NoZW1hKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzY2FsZS5kb21haW4oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHZhcmlhYmxlID09PSB1bmRlZmluZWQpIHJldHVybiB0aGlzO1xuICAgICAgc2NhbGUuZG9tYWluKGQzLmV4dGVudChkYXRhLCBmdW5jdGlvbihkKSB7IHJldHVybiBkW3ZhcmlhYmxlXTt9KSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xuICB9O1xuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIGF4aXMuc2NhbGUodlt2YXJpYWJsZV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2NhbGUodik7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBheGlzO1xufVxuXG5pZiAoZ3JwaC5heGlzID09PSB1bmRlZmluZWQpIGdycGguYXhpcyA9IHt9O1xuZ3JwaC5heGlzLnNpemUgPSBncnBoX2F4aXNfc2l6ZSgpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfYXhpc19zcGxpdCgpIHtcblxuICB2YXIgdmFyaWFibGVfO1xuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xuICB2YXIgZG9tYWluXztcbiAgdmFyIHNldHRpbmdzXyA9IHtcbiAgfTtcblxuICBmdW5jdGlvbiBheGlzKGcpIHtcbiAgfVxuXG4gIGF4aXMud2lkdGggPSBmdW5jdGlvbih3aWR0aCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gd2lkdGhfO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aWR0aF8gPSB3aWR0aDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICB9IGVsc2Uge1xuICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdjYXRlZ29yaWNhbCc7XG4gIH07XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHZhcmlhYmxlXztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyaWFibGVfID0gdjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcbiBcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGRvbWFpbl87XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh2YXJpYWJsZV8gPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XG4gICAgICBkb21haW5fID0gdnNjaGVtYS5jYXRlZ29yaWVzLm1hcChmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBkLm5hbWU7IH0pO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZG9tYWluXztcbiAgfTtcblxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBkb21haW5fLmluZGV4T2Yodik7XG4gIH07XG5cbiAgcmV0dXJuIGF4aXM7XG59XG4iLCJcbmZ1bmN0aW9uIHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2NoZW1hLmZpZWxkcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzY2hlbWEuZmllbGRzW2ldLm5hbWUgPT0gdmFyaWFibGUpIFxuICAgICAgcmV0dXJuIHNjaGVtYS5maWVsZHNbaV07XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cbiAgXG4iLCJcbmZ1bmN0aW9uIGdycGhfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIGdyYXBoKSB7XG5cbiAgdmFyIHdpZHRoLCBoZWlnaHQ7XG4gIHZhciBkYXRhLCBzY2hlbWE7XG5cbiAgZ3JhcGguYXhlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkMy5rZXlzKGF4ZXMpO1xuICB9O1xuXG4gIGdyYXBoLndpZHRoID0gZnVuY3Rpb24odykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gd2lkdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZHRoID0gdztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBncmFwaC5oZWlnaHQgPSBmdW5jdGlvbihoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBoZWlnaHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlaWdodCA9IGg7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgZ3JhcGguYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGVzLCBheGlzKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICBpZiAoYXhlc1theGlzXSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gYXhlc1theGlzXS5hY2NlcHQodmFyaWFibGVzLCBzY2hlbWEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKHZhciBpIGluIGF4ZXMpIHtcbiAgICAgICAgaWYgKHZhcmlhYmxlc1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgaWYgKGF4ZXNbaV0ucmVxdWlyZWQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgYWNjZXB0ID0gYXhlc1tpXS5hY2NlcHQodmFyaWFibGVzW2ldLCBzY2hlbWEpO1xuICAgICAgICAgIGlmICghYWNjZXB0KSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfTtcblxuICBncmFwaC5hc3NpZ24gPSBmdW5jdGlvbih2YXJpYWJsZXMpIHtcbiAgICBmb3IgKHZhciBpIGluIGF4ZXMpIGF4ZXNbaV0udmFyaWFibGUodmFyaWFibGVzW2ldKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBncmFwaC5zY2hlbWEgPSBmdW5jdGlvbihzKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzY2hlbWE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNjaGVtYSA9IHM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgZ3JhcGguZGF0YSA9IGZ1bmN0aW9uKGQsIHMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRhdGEgPSBkO1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSBcbiAgICAgICAgZ3JhcGguc2NoZW1hKHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIGdyYXBoLmRpc3BhdGNoID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGRpc3BhdGNoO1xuICB9O1xuXG4gIHJldHVybiBncmFwaDtcbn1cblxuIiwiXG5mdW5jdGlvbiBncnBoX2dyYXBoX2J1YmJsZSgpIHtcblxuICB2YXIgYXhlcyA9IHtcbiAgICAneCcgOiBncnBoX2F4aXNfbGluZWFyKHRydWUpLFxuICAgICd5JyA6IGdycGhfYXhpc19saW5lYXIoZmFsc2UpLFxuICAgICdvYmplY3QnIDogZ3JwaF9heGlzX2NvbG91cigpLFxuICAgICdzaXplJyAgIDogZ3JwaF9heGlzX3NpemUoKSxcbiAgICAnY29sb3VyJyA6IGdycGhfYXhpc19jb2xvdXIoKSxcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcbiAgfTtcbiAgYXhlcy54LnJlcXVpcmVkID0gdHJ1ZTtcbiAgYXhlcy55LnJlcXVpcmVkID0gdHJ1ZTtcbiAgYXhlcy5vYmplY3QucmVxdWlyZWQgPSB0cnVlO1xuICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaChcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIsIFwiY2xpY2tcIik7XG5cbiAgdmFyIGR1bW15XyA9IGQzLnNlbGVjdChcImJvZHlcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgLmF0dHIoXCJjbGFzc1wiLCBcImJ1YmJsZWdyYXBoIGR1bW15XCIpXG4gICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImludmlzaWJsZVwiKTtcbiAgdmFyIGxhYmVsX3NpemVfID0gZ3JwaF9sYWJlbF9zaXplKGR1bW15Xyk7XG5cbiAgdmFyIGdyYXBoID0gZ3JwaF9ncmFwaChheGVzLCBkaXNwYXRjaCwgZnVuY3Rpb24oZykge1xuICAgIGZ1bmN0aW9uIG5lc3Rfb2JqZWN0KGQpIHtcbiAgICAgIHJldHVybiBheGVzLm9iamVjdC52YXJpYWJsZSgpID8gZFtheGVzLm9iamVjdC52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5lc3RfY29sb3VyKGQpIHtcbiAgICAgIHJldHVybiBheGVzLmNvbG91ci52YXJpYWJsZSgpID8gZFtheGVzLmNvbG91ci52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5lc3RfY29sdW1uKGQpIHtcbiAgICAgIHJldHVybiBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gZFtheGVzLmNvbHVtbi52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG5lc3Rfcm93KGQpIHtcbiAgICAgIHJldHVybiBheGVzLnJvdy52YXJpYWJsZSgpID8gZFtheGVzLnJvdy52YXJpYWJsZSgpXSA6IDE7XG4gICAgfVxuICAgIC8vIHNldHVwIGF4ZXNcbiAgICBmb3IgKHZhciBheGlzIGluIGF4ZXMpIGF4ZXNbYXhpc10uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIC8qYXhlcy5jb2xvdXIuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIGF4ZXMub2JqZWN0LmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTsgXG4gICAgYXhlcy5zaXplLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICBheGVzLmNvbHVtbi5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgYXhlcy5yb3cuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpOyovXG4gICAgLy8gZGV0ZXJtaW5lIG51bWJlciBvZiByb3dzIGFuZCBjb2x1bW5zXG4gICAgdmFyIG5jb2wgPSBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gYXhlcy5jb2x1bW4udGlja3MoKS5sZW5ndGggOiAxO1xuICAgIHZhciBucm93ID0gYXhlcy5yb3cudmFyaWFibGUoKSA/IGF4ZXMucm93LnRpY2tzKCkubGVuZ3RoIDogMTtcbiAgICAvLyBnZXQgbGFiZWxzIGFuZCBkZXRlcm1pbmUgdGhlaXIgaGVpZ2h0XG4gICAgdmFyIHZzY2hlbWF4ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMueC52YXJpYWJsZSgpLCBzY2hlbWEpO1xuICAgIHZhciB4bGFiZWwgPSB2c2NoZW1heC50aXRsZTtcbiAgICB2YXIgbGFiZWxfaGVpZ2h0ID0gbGFiZWxfc2l6ZV8uaGVpZ2h0KHhsYWJlbCkgKyBzZXR0aW5ncygnbGFiZWxfcGFkZGluZycpO1xuICAgIHZhciB2c2NoZW1heSA9IHZhcmlhYmxlX3NjaGVtYShheGVzLnkudmFyaWFibGUoKSwgc2NoZW1hKTtcbiAgICB2YXIgeWxhYmVsID0gdnNjaGVtYXkudGl0bGU7XG4gICAgLy8gc2V0IHRoZSB3aWR0aCwgaGVpZ2h0IGVuZCBkb21haW4gb2YgdGhlIHgtIGFuZCB5LWF4ZXMuIFdlIG5lZWQgc29tZSBcbiAgICAvLyBpdGVyYXRpb25zIGZvciB0aGlzLCBhcyB0aGUgaGVpZ2h0IG9mIHRoZSB5LWF4aXMgZGVwZW5kcyBvZiB0aGUgaGVpZ2h0XG4gICAgLy8gb2YgdGhlIHgtYXhpcywgd2hpY2ggZGVwZW5kcyBvbiB0aGUgbGFiZWxzIG9mIHRoZSB4LWF4aXMsIHdoaWNoIGRlcGVuZHNcbiAgICAvLyBvbiB0aGUgd2lkdGggb2YgdGhlIHgtYXhpcywgZXRjLiBcbiAgICB2YXIgdywgaDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI7ICsraSkge1xuICAgICAgdyA9IGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncygncGFkZGluZycpWzFdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVszXSAtIFxuICAgICAgICBheGVzLnkud2lkdGgoKSAtIGxhYmVsX2hlaWdodDtcbiAgICAgIHcgPSAodyAtIChuY29sLTEpKnNldHRpbmdzKCdzZXAnKSkgLyBuY29sO1xuICAgICAgYXhlcy54LndpZHRoKHcpLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICAgIGggPSBncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMF0gLSBzZXR0aW5ncygncGFkZGluZycpWzJdIC0gXG4gICAgICAgIGF4ZXMueC5oZWlnaHQoKSAtIGxhYmVsX2hlaWdodDtcbiAgICAgIGggPSAoaCAtIChucm93LTEpKnNldHRpbmdzKCdzZXAnKSkgLyBucm93O1xuICAgICAgYXhlcy55LmhlaWdodChoKS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgfVxuICAgIHZhciBsID0gYXhlcy55LndpZHRoKCkgKyBzZXR0aW5ncygncGFkZGluZycpWzFdICsgbGFiZWxfaGVpZ2h0O1xuICAgIHZhciB0ICA9IHNldHRpbmdzKCdwYWRkaW5nJylbMl07XG4gICAgLy8gY3JlYXRlIGdyb3VwIGNvbnRhaW5pbmcgY29tcGxldGUgZ3JhcGhcbiAgICBnID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImdyYXBoIGdyYXBoLWJ1YmJsZVwiKTtcbiAgICAvLyBkcmF3IGxhYmVsc1xuICAgIHZhciB5Y2VudGVyID0gdCArIDAuNSooZ3JhcGguaGVpZ2h0KCkgLSBzZXR0aW5ncygncGFkZGluZycpWzBdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXSAtIFxuICAgICAgICBheGVzLnguaGVpZ2h0KCkgLSBsYWJlbF9oZWlnaHQpO1xuICAgIHZhciB4Y2VudGVyID0gbCArIDAuNSooZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMV0gLSBzZXR0aW5ncygncGFkZGluZycpWzNdIC0gXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0KTtcbiAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwibGFiZWwgbGFiZWwteVwiKVxuICAgICAgLmF0dHIoXCJ4XCIsIHNldHRpbmdzKCdwYWRkaW5nJylbMV0pLmF0dHIoXCJ5XCIsIHljZW50ZXIpXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQoeWxhYmVsKVxuICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoOTAgXCIgKyBzZXR0aW5ncygncGFkZGluZycpWzFdICsgXCIgXCIgKyB5Y2VudGVyICsgXCIpXCIpO1xuICAgIGcuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJsYWJlbCBsYWJlbC14XCIpXG4gICAgICAuYXR0cihcInhcIiwgeGNlbnRlcikuYXR0cihcInlcIiwgZ3JhcGguaGVpZ2h0KCktc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSlcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dCh4bGFiZWwpO1xuXG5cblxuICAgIHZhciBkID0gZDMubmVzdCgpLmtleShuZXN0X2NvbHVtbikua2V5KG5lc3Rfcm93KS5rZXkobmVzdF9jb2xvdXIpLmVudHJpZXMoZ3JhcGguZGF0YSgpKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgZGogPSBkW2ldLnZhbHVlcztcbiAgICAgIHQgID0gc2V0dGluZ3MoJ3BhZGRpbmcnKVsyXTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgLy8gZHJhdyB4LWF4aXNcbiAgICAgICAgaWYgKGogPT0gKGRqLmxlbmd0aC0xKSkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyAodCArIGgpICsgXCIpXCIpLmNhbGwoYXhlcy54KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IHktYXhpc1xuICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyAobCAtIGF4ZXMueS53aWR0aCgpKSArIFwiLFwiICsgdCArIFwiKVwiKVxuICAgICAgICAgICAgLmNhbGwoYXhlcy55KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IGJveCBmb3IgZ3JhcGhcbiAgICAgICAgdmFyIGdyID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInBhbmVsXCIpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xuICAgICAgICBnci5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XG4gICAgICAgIC8vIGRyYXcgZ3JpZFxuICAgICAgICB2YXIgeHRpY2tzID0gYXhlcy54LnRpY2tzKCk7XG4gICAgICAgIGdyLnNlbGVjdEFsbChcImxpbmUuZ3JpZHhcIikuZGF0YSh4dGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJncmlkIGdyaWR4XCIpXG4gICAgICAgICAgLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUpXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieTJcIiwgaCk7XG4gICAgICAgIHZhciB5dGlja3MgPSBheGVzLnkudGlja3MoKTtcbiAgICAgICAgZ3Iuc2VsZWN0QWxsKFwibGluZS5ncmlkeVwiKS5kYXRhKHl0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImdyaWQgZ3JpZHlcIilcbiAgICAgICAgICAuYXR0cihcIngxXCIsIDApLmF0dHIoXCJ4MlwiLCB3KVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKTtcbiAgICAgICAgLy8gYWRkIGNyb3NzaGFpcnMgdG8gZ3JhcGhcbiAgICAgICAgdmFyIGdjcm9zc2ggPSBnci5hcHBlbmQoXCJnXCIpLmNsYXNzZWQoXCJjcm9zc2hhaXJzXCIsIHRydWUpO1xuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcImhsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIGF4ZXMueC53aWR0aCgpKS5hdHRyKFwieTJcIiwgMClcbiAgICAgICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICBnY3Jvc3NoLmFwcGVuZChcImxpbmVcIikuY2xhc3NlZChcInZsaW5lXCIsIHRydWUpLmF0dHIoXCJ4MVwiLCAwKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcIngyXCIsIDApLmF0dHIoXCJ5MlwiLCBheGVzLnkuaGVpZ2h0KCkpXG4gICAgICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgLy8gZHJhdyBidWJibGVzIFxuICAgICAgICB2YXIgZGsgPSBkaltqXS52YWx1ZXM7XG4gICAgICAgIGZvciAoayA9IDA7IGsgPCBkay5sZW5ndGg7ICsraykge1xuICAgICAgICAgIHZhciBjbHMgPSBcImNpcmNsZVwiICsgaztcbiAgICAgICAgICBnci5zZWxlY3RBbGwoXCJjaXJjbGUuYnViYmxlXCIgKyBrKS5kYXRhKGRrW2tdLnZhbHVlcykuZW50ZXIoKS5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJidWJibGUgYnViYmxlXCIgKyBrICsgXCIgXCIgKyBheGVzLmNvbG91ci5zY2FsZShka1trXS5rZXkpKVxuICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJjeVwiLCBheGVzLnkuc2NhbGUpXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgYXhlcy5zaXplLnNjYWxlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBuZXh0IGxpbmVcbiAgICAgICAgdCArPSBheGVzLnkuaGVpZ2h0KCkgKyBzZXR0aW5ncygnc2VwJyk7XG4gICAgICB9XG4gICAgICBsICs9IGF4ZXMueC53aWR0aCgpICsgc2V0dGluZ3MoJ3NlcCcpO1xuICAgIH1cblxuXG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xuICAgIGcuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoZywgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciB2YXJpYWJsZSA9IGF4ZXMuY29sb3VyLnZhcmlhYmxlKCk7XG4gICAgICB2YXIgdmFsdWUgPSB2YXJpYWJsZSA/IChkLmtleSB8fCBkW3ZhcmlhYmxlXSkgOiB1bmRlZmluZWQ7XG4gICAgICBkaXNwYXRjaC5tb3VzZW91dC5jYWxsKGcsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2guY2xpY2suY2FsbChnLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pO1xuXG4gIH0pO1xuXG5cbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgaWYgKHZhcmlhYmxlKSB7XG4gICAgICB2YXIgY2xhc3NlcyA9IGF4ZXMuY29sb3VyLnNjYWxlKFwiXCIgKyB2YWx1ZSk7XG4gICAgICB2YXIgcmVnZXhwID0gL1xcYmNvbG91cihbMC05XSspXFxiLztcbiAgICAgIHZhciBjb2xvdXIgPSByZWdleHAuZXhlYyhjbGFzc2VzKVswXTtcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKFwiY29sb3VybG93XCIsIHRydWUpO1xuICAgICAgdGhpcy5zZWxlY3RBbGwoXCIuXCIgKyBjb2xvdXIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiB0cnVlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIH1cbiAgICB0aGlzLnNlbGVjdEFsbChcIi5obGluZVwiKS5hdHRyKFwieTFcIiwgYXhlcy55LnNjYWxlKGQpKS5hdHRyKFwieTJcIiwgYXhlcy55LnNjYWxlKGQpKVxuICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIik7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIudmxpbmVcIikuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZShkKSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZShkKSlcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICB9KTtcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IGZhbHNlLCBcImNvbG91cmxvd1wiOiBmYWxzZX0pO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmhsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICB0aGlzLnNlbGVjdEFsbChcIi52bGluZVwiKS5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gIH0pO1xuXG4gIHJldHVybiBncmFwaDtcbn1cblxuIiwiXG5mdW5jdGlvbiBncnBoX2dyYXBoX2xpbmUoKSB7XG5cbiAgdmFyIGF4ZXMgPSB7XG4gICAgJ3gnIDogZ3JwaF9heGlzX2xpbmVhcih0cnVlKSxcbiAgICAneScgOiBncnBoX2F4aXNfbGluZWFyKGZhbHNlKSxcbiAgICAnY29sb3VyJyA6IGdycGhfYXhpc19jb2xvdXIoKSxcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcbiAgfTtcbiAgYXhlcy54LnJlcXVpcmVkID0gdHJ1ZTtcbiAgYXhlcy55LnJlcXVpcmVkID0gdHJ1ZTtcbiAgdmFyIGRpc3BhdGNoID0gZDMuZGlzcGF0Y2goXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcInBvaW50b3ZlclwiLCBcInBvaW50b3V0XCIsXG4gICAgXCJjbGlja1wiKTtcblxuICB2YXIgZHVtbXlfID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibGluZWFyZ3JhcGggZHVtbXlcIilcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaW52aXNpYmxlXCIpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcblxuICBmdW5jdGlvbiBncmFwaF9wYW5lbChnLCBkYXRhKSB7XG4gICAgZnVuY3Rpb24gbmVzdF9jb2xvdXIoZCkge1xuICAgICAgcmV0dXJuIGF4ZXMuY29sb3VyLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sb3VyLnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgdmFyIGQgPSBkMy5uZXN0KCkua2V5KG5lc3RfY29sb3VyKS5lbnRyaWVzKGRhdGEpO1xuICAgIC8vIGRyYXcgbGluZXMgXG4gICAgdmFyIGxpbmUgPSBkMy5zdmcubGluZSgpLngoYXhlcy54LnNjYWxlKS55KGF4ZXMueS5zY2FsZSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICBnLmFwcGVuZChcInBhdGhcIikuYXR0cihcImRcIiwgbGluZShkW2ldLnZhbHVlcykpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgYXhlcy5jb2xvdXIuc2NhbGUoZFtpXS5rZXkpKVxuICAgICAgICAuZGF0dW0oZFtpXSk7XG4gICAgfVxuICAgIC8vIGRyYXcgcG9pbnRzIFxuICAgIGZvciAoaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgY2xzID0gXCJjaXJjbGVcIiArIGk7XG4gICAgICBnLnNlbGVjdEFsbChcImNpcmNsZS5jaXJjbGVcIiArIGkpLmRhdGEoZFtpXS52YWx1ZXMpLmVudGVyKCkuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjaXJjbGVcIiArIGkgKyBcIiBcIiArIGF4ZXMuY29sb3VyLnNjYWxlKGRbaV0ua2V5KSlcbiAgICAgICAgLmF0dHIoXCJjeFwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJjeVwiLCBheGVzLnkuc2NhbGUpXG4gICAgICAgIC5hdHRyKFwiclwiLCBzZXR0aW5ncygncG9pbnRfc2l6ZScpKTtcbiAgICB9XG4gIH1cblxuICB2YXIgZ3JhcGggPSBncnBoX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBmdW5jdGlvbihnKSB7XG4gICAgZnVuY3Rpb24gbmVzdF9jb2x1bW4oZCkge1xuICAgICAgcmV0dXJuIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sdW1uLnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmVzdF9yb3coZCkge1xuICAgICAgcmV0dXJuIGF4ZXMucm93LnZhcmlhYmxlKCkgPyBkW2F4ZXMucm93LnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgLy8gc2V0dXAgYXhlc1xuICAgIGZvciAodmFyIGF4aXMgaW4gYXhlcykgYXhlc1theGlzXS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgLy8gZGV0ZXJtaW5lIG51bWJlciBvZiByb3dzIGFuZCBjb2x1bW5zXG4gICAgdmFyIG5jb2wgPSBheGVzLmNvbHVtbi52YXJpYWJsZSgpID8gYXhlcy5jb2x1bW4udGlja3MoKS5sZW5ndGggOiAxO1xuICAgIHZhciBucm93ID0gYXhlcy5yb3cudmFyaWFibGUoKSA/IGF4ZXMucm93LnRpY2tzKCkubGVuZ3RoIDogMTtcbiAgICAvLyBnZXQgbGFiZWxzIGFuZCBkZXRlcm1pbmUgdGhlaXIgaGVpZ2h0XG4gICAgdmFyIHZzY2hlbWF4ID0gdmFyaWFibGVfc2NoZW1hKGF4ZXMueC52YXJpYWJsZSgpLCBzY2hlbWEpO1xuICAgIHZhciB4bGFiZWwgPSB2c2NoZW1heC50aXRsZTtcbiAgICB2YXIgbGFiZWxfaGVpZ2h0ID0gbGFiZWxfc2l6ZV8uaGVpZ2h0KHhsYWJlbCkgKyBzZXR0aW5ncygnbGFiZWxfcGFkZGluZycpO1xuICAgIHZhciB2c2NoZW1heSA9IHZhcmlhYmxlX3NjaGVtYShheGVzLnkudmFyaWFibGUoKSwgc2NoZW1hKTtcbiAgICB2YXIgeWxhYmVsID0gdnNjaGVtYXkudGl0bGU7XG4gICAgLy8gc2V0IHRoZSB3aWR0aCwgaGVpZ2h0IGVuZCBkb21haW4gb2YgdGhlIHgtIGFuZCB5LWF4ZXMuIFdlIG5lZWQgc29tZSBcbiAgICAvLyBpdGVyYXRpb25zIGZvciB0aGlzLCBhcyB0aGUgaGVpZ2h0IG9mIHRoZSB5LWF4aXMgZGVwZW5kcyBvZiB0aGUgaGVpZ2h0XG4gICAgLy8gb2YgdGhlIHgtYXhpcywgd2hpY2ggZGVwZW5kcyBvbiB0aGUgbGFiZWxzIG9mIHRoZSB4LWF4aXMsIHdoaWNoIGRlcGVuZHNcbiAgICAvLyBvbiB0aGUgd2lkdGggb2YgdGhlIHgtYXhpcywgZXRjLiBcbiAgICB2YXIgdywgaDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDI7ICsraSkge1xuICAgICAgdyA9IGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncygncGFkZGluZycpWzFdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVszXSAtIFxuICAgICAgICBheGVzLnkud2lkdGgoKSAtIGxhYmVsX2hlaWdodDtcbiAgICAgIHcgPSAodyAtIChuY29sLTEpKnNldHRpbmdzKCdzZXAnKSkgLyBuY29sO1xuICAgICAgYXhlcy54LndpZHRoKHcpLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICAgIGggPSBncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMF0gLSBzZXR0aW5ncygncGFkZGluZycpWzJdIC0gXG4gICAgICAgIGF4ZXMueC5oZWlnaHQoKSAtIGxhYmVsX2hlaWdodDtcbiAgICAgIGggPSAoaCAtIChucm93LTEpKnNldHRpbmdzKCdzZXAnKSkgLyBucm93O1xuICAgICAgYXhlcy55LmhlaWdodChoKS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgfVxuICAgIHZhciBsID0gYXhlcy55LndpZHRoKCkgKyBzZXR0aW5ncygncGFkZGluZycpWzFdICsgbGFiZWxfaGVpZ2h0O1xuICAgIHZhciB0ICA9IHNldHRpbmdzKCdwYWRkaW5nJylbMl07XG4gICAgLy8gY3JlYXRlIGdyb3VwIGNvbnRhaW5pbmcgY29tcGxldGUgZ3JhcGhcbiAgICBnID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImdyYXBoIGdyYXBoLWxpbmVcIik7XG4gICAgLy8gZHJhdyBsYWJlbHNcbiAgICB2YXIgeWNlbnRlciA9IHQgKyAwLjUqKGdyYXBoLmhlaWdodCgpIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVswXSAtIHNldHRpbmdzKCdwYWRkaW5nJylbMl0gLSBcbiAgICAgICAgYXhlcy54LmhlaWdodCgpIC0gbGFiZWxfaGVpZ2h0KTtcbiAgICB2YXIgeGNlbnRlciA9IGwgKyAwLjUqKGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncygncGFkZGluZycpWzFdIC0gc2V0dGluZ3MoJ3BhZGRpbmcnKVszXSAtIFxuICAgICAgICBheGVzLnkud2lkdGgoKSAtIGxhYmVsX2hlaWdodCk7XG4gICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImxhYmVsIGxhYmVsLXlcIilcbiAgICAgIC5hdHRyKFwieFwiLCBzZXR0aW5ncygncGFkZGluZycpWzFdKS5hdHRyKFwieVwiLCB5Y2VudGVyKVxuICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKS50ZXh0KHlsYWJlbClcbiAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDkwIFwiICsgc2V0dGluZ3MoJ3BhZGRpbmcnKVsxXSArIFwiIFwiICsgeWNlbnRlciArIFwiKVwiKTtcbiAgICBnLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwibGFiZWwgbGFiZWwteVwiKVxuICAgICAgLmF0dHIoXCJ4XCIsIHhjZW50ZXIpLmF0dHIoXCJ5XCIsIGdyYXBoLmhlaWdodCgpLXNldHRpbmdzKCdwYWRkaW5nJylbMF0pXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQoeGxhYmVsKTtcbiAgICAvLyBjcmVhdGUgZWFjaCBvZiB0aGUgcGFuZWxzXG4gICAgdmFyIGQgPSBkMy5uZXN0KCkua2V5KG5lc3RfY29sdW1uKS5rZXkobmVzdF9yb3cpLmVudHJpZXMoZ3JhcGguZGF0YSgpKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgZC5sZW5ndGg7ICsraSkge1xuICAgICAgdmFyIGRqID0gZFtpXS52YWx1ZXM7XG4gICAgICB0ICA9IHNldHRpbmdzKCdwYWRkaW5nJylbMl07XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGRqLmxlbmd0aDsgKytqKSB7XG4gICAgICAgIC8vIGRyYXcgeC1heGlzXG4gICAgICAgIGlmIChqID09IChkai5sZW5ndGgtMSkpIHtcbiAgICAgICAgICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLXhcIilcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbCArIFwiLFwiICsgKHQgKyBoKSArIFwiKVwiKS5jYWxsKGF4ZXMueCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZHJhdyB5LWF4aXNcbiAgICAgICAgaWYgKGkgPT09IDApIHtcbiAgICAgICAgICBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiYXhpcyBheGlzLXlcIilcbiAgICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgKGwgLSBheGVzLnkud2lkdGgoKSkgKyBcIixcIiArIHQgKyBcIilcIilcbiAgICAgICAgICAgIC5jYWxsKGF4ZXMueSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZHJhdyBib3ggZm9yIGdyYXBoXG4gICAgICAgIHZhciBnciA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJwYW5lbFwiKVxuICAgICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKFwiICsgbCArIFwiLFwiICsgdCArIFwiKVwiKTtcbiAgICAgICAgZ3IuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3KS5hdHRyKFwiaGVpZ2h0XCIsIGgpO1xuICAgICAgICAvLyBkcmF3IGdyaWRcbiAgICAgICAgdmFyIHh0aWNrcyA9IGF4ZXMueC50aWNrcygpO1xuICAgICAgICBnci5zZWxlY3RBbGwoXCJsaW5lLmdyaWR4XCIpLmRhdGEoeHRpY2tzKS5lbnRlcigpLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZ3JpZCBncmlkeFwiKVxuICAgICAgICAgIC5hdHRyKFwieDFcIiwgYXhlcy54LnNjYWxlKS5hdHRyKFwieDJcIiwgYXhlcy54LnNjYWxlKVxuICAgICAgICAgIC5hdHRyKFwieTFcIiwgMCkuYXR0cihcInkyXCIsIGgpO1xuICAgICAgICB2YXIgeXRpY2tzID0gYXhlcy55LnRpY2tzKCk7XG4gICAgICAgIGdyLnNlbGVjdEFsbChcImxpbmUuZ3JpZHlcIikuZGF0YSh5dGlja3MpLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJncmlkIGdyaWR5XCIpXG4gICAgICAgICAgLmF0dHIoXCJ4MVwiLCAwKS5hdHRyKFwieDJcIiwgdylcbiAgICAgICAgICAuYXR0cihcInkxXCIsIGF4ZXMueS5zY2FsZSkuYXR0cihcInkyXCIsIGF4ZXMueS5zY2FsZSk7XG4gICAgICAgIC8vIGFkZCBjcm9zc2hhaXJzIHRvIGdyYXBoXG4gICAgICAgIHZhciBnY3Jvc3NoID0gZ3IuYXBwZW5kKFwiZ1wiKS5jbGFzc2VkKFwiY3Jvc3NoYWlyc1wiLCB0cnVlKTtcbiAgICAgICAgZ2Nyb3NzaC5hcHBlbmQoXCJsaW5lXCIpLmNsYXNzZWQoXCJobGluZVwiLCB0cnVlKS5hdHRyKFwieDFcIiwgMClcbiAgICAgICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ4MlwiLCBheGVzLngud2lkdGgoKSkuYXR0cihcInkyXCIsIDApXG4gICAgICAgICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgZ2Nyb3NzaC5hcHBlbmQoXCJsaW5lXCIpLmNsYXNzZWQoXCJ2bGluZVwiLCB0cnVlKS5hdHRyKFwieDFcIiwgMClcbiAgICAgICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ4MlwiLCAwKS5hdHRyKFwieTJcIiwgYXhlcy55LmhlaWdodCgpKVxuICAgICAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgIC8vIGRyYXcgbGluZXNcbiAgICAgICAgZ3JhcGhfcGFuZWwoZ3IsIGRqW2pdLnZhbHVlcyk7XG4gICAgICAgIC8vIG5leHQgcGFuZWxcbiAgICAgICAgdCArPSBheGVzLnkuaGVpZ2h0KCkgKyBzZXR0aW5ncygnc2VwJyk7XG4gICAgICB9XG4gICAgICBsICs9IGF4ZXMueC53aWR0aCgpICsgc2V0dGluZ3MoJ3NlcCcpO1xuICAgIH1cblxuXG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xuICAgIGcuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoZywgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICAgIGlmICghZC5rZXkpIGRpc3BhdGNoLnBvaW50b3Zlci5jYWxsKGcsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSkub24oXCJtb3VzZW91dFwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChnLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgICAgaWYgKCFkLmtleSkgZGlzcGF0Y2gucG9pbnRvdXQuY2FsbChnLCB2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcbiAgICAgIGRpc3BhdGNoLmNsaWNrLmNhbGwoZywgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KTtcblxuICB9KTtcblxuXG4gIC8vIExvY2FsIGV2ZW50IGhhbmRsZXJzXG4gIC8vIEhpZ2hsaWdodGluZyBvZiBzZWxlY3RlZCBsaW5lXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgIGlmICh2YXJpYWJsZSkge1xuICAgICAgdmFyIGNsYXNzZXMgPSBheGVzLmNvbG91ci5zY2FsZShcIlwiICsgdmFsdWUpO1xuICAgICAgdmFyIHJlZ2V4cCA9IC9cXGJjb2xvdXIoWzAtOV0rKVxcYi87XG4gICAgICB2YXIgY29sb3VyID0gcmVnZXhwLmV4ZWMoY2xhc3NlcylbMF07XG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZChcImNvbG91cmxvd1wiLCB0cnVlKTtcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLlwiICsgY29sb3VyKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogdHJ1ZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcbiAgICB9XG4gIH0pO1xuICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogZmFsc2UsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XG4gIH0pO1xuICAvLyBTaG93IGNyb3NzaGFpcnMgd2hlbiBob3ZlcmluZyBvdmVyIGEgcG9pbnRcbiAgZGlzcGF0Y2gub24oXCJwb2ludG92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuYXR0cihcInkxXCIsIGF4ZXMueS5zY2FsZShkKSkuYXR0cihcInkyXCIsIGF4ZXMueS5zY2FsZShkKSlcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUoZCkpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUoZCkpXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcbiAgfSk7XG4gIGRpc3BhdGNoLm9uKFwicG9pbnRvdXRcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG4iLCJcblxuZnVuY3Rpb24gZ3JwaF9ncmFwaF9tYXAoKSB7XG5cbiAgdmFyIGF4ZXMgPSB7XG4gICAgJ3JlZ2lvbicgOiBncnBoX2F4aXNfcmVnaW9uKCksXG4gICAgJ2NvbG91cicgOiBncnBoX2F4aXNfY2hsb3JvcGxldGgoKSxcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcbiAgfTtcbiAgYXhlcy5yZWdpb24ucmVxdWlyZWQgPSB0cnVlO1xuICBheGVzLmNvbG91ci5yZXF1aXJlZCA9IHRydWU7XG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwicmVhZHlcIiwgXCJtb3VzZW92ZXJcIiwgXCJtb3VzZW91dFwiLCBcImNsaWNrXCIpO1xuXG4gIHZhciBncmFwaCA9IGdycGhfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIGZ1bmN0aW9uKGcpIHtcbiAgICBmdW5jdGlvbiBuZXN0X2NvbHVtbihkKSB7XG4gICAgICByZXR1cm4gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGRbYXhlcy5jb2x1bW4udmFyaWFibGUoKV0gOiAxO1xuICAgIH1cbiAgICBmdW5jdGlvbiBuZXN0X3JvdyhkKSB7XG4gICAgICByZXR1cm4gYXhlcy5yb3cudmFyaWFibGUoKSA/IGRbYXhlcy5yb3cudmFyaWFibGUoKV0gOiAxO1xuICAgIH1cbiAgICAvLyBzZXR1cCBheGVzXG4gICAgYXhlcy5yZWdpb24uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIGF4ZXMuY29sb3VyLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICBheGVzLmNvbHVtbi5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgYXhlcy5yb3cuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIC8vIGRldGVybWluZSBudW1iZXIgb2Ygcm93cyBhbmQgY29sdW1uc1xuICAgIHZhciBuY29sID0gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGF4ZXMuY29sdW1uLnRpY2tzKCkubGVuZ3RoIDogMTtcbiAgICB2YXIgbnJvdyA9IGF4ZXMucm93LnZhcmlhYmxlKCkgPyBheGVzLnJvdy50aWNrcygpLmxlbmd0aCA6IDE7XG4gICAgLy8gc2V0IHRoZSB3aWR0aCwgaGVpZ2h0IGVuZCBkb21haW4gb2YgdGhlIHgtIGFuZCB5LWF4ZXNcbiAgICB2YXIgdyA9IChncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzFdIC0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzNdIC0gXG4gICAgICAobmNvbC0xKSpzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKSkvbmNvbDtcbiAgICB2YXIgaCA9IChncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVswXSAtIHNldHRpbmdzKFwicGFkZGluZ1wiLCBcIm1hcFwiKVsyXSAtIFxuICAgICAgKG5yb3ctMSkqc2V0dGluZ3MoXCJzZXBcIiwgXCJtYXBcIikpL25yb3c7XG4gICAgdmFyIGwgPSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMV07XG4gICAgdmFyIHQgID0gc2V0dGluZ3MoXCJwYWRkaW5nXCIsIFwibWFwXCIpWzJdO1xuICAgIGF4ZXMucmVnaW9uLndpZHRoKHcpLmhlaWdodChoKTtcbiAgICAvLyBjcmVhdGUgZ3JvdXAgY29udGFpbmluZyBjb21wbGV0ZSBncmFwaFxuICAgIGcgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiZ3JhcGggZ3JhcGgtbWFwXCIpO1xuICAgIC8vIGRyYXcgZ3JhcGhzXG4gICAgd2FpdF9mb3IoYXhlcy5yZWdpb24ubWFwX2xvYWRlZCwgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2x1bW4pLmtleShuZXN0X3JvdykuZW50cmllcyhncmFwaC5kYXRhKCkpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBkaiA9IGRbaV0udmFsdWVzO1xuICAgICAgICB2YXIgdCAgPSBzZXR0aW5ncyhcInBhZGRpbmdcIiwgXCJtYXBcIilbMl07XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgICAvLyBkcmF3IGJveCBmb3IgZ3JhcGhcbiAgICAgICAgICB2YXIgZ3IgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwibWFwXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArIHQgKyBcIilcIik7XG4gICAgICAgICAgZ3IuYXBwZW5kKFwicmVjdFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJiYWNrZ3JvdW5kXCIpXG4gICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XG4gICAgICAgICAgLy8gZHJhdyBtYXBcbiAgICAgICAgICBnci5zZWxlY3RBbGwoXCJwYXRoXCIpLmRhdGEoZGpbal0udmFsdWVzKS5lbnRlcigpLmFwcGVuZChcInBhdGhcIilcbiAgICAgICAgICAgIC5hdHRyKFwiZFwiLCBheGVzLnJlZ2lvbi5zY2FsZSkuYXR0cihcImNsYXNzXCIsIGF4ZXMuY29sb3VyLnNjYWxlKTtcbiAgICAgICAgICAvLyBuZXh0IGxpbmVcbiAgICAgICAgICB0ICs9IGggKyBzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKTtcbiAgICAgICAgfVxuICAgICAgICBsICs9IHcgKyBzZXR0aW5ncyhcInNlcFwiLCBcIm1hcFwiKTtcbiAgICAgIH1cbiAgICAgIC8vIGFkZCBldmVudHMgdG8gdGhlIGxpbmVzXG4gICAgICBnLnNlbGVjdEFsbChcInBhdGhcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoZywgYXhlcy5yZWdpb24udmFyaWFibGUoKSwgcmVnaW9uLCBkKTtcbiAgICAgIH0pLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgICB2YXIgcmVnaW9uID0gZFtheGVzLnJlZ2lvbi52YXJpYWJsZSgpXTtcbiAgICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChnLCBheGVzLnJlZ2lvbi52YXJpYWJsZSgpLCByZWdpb24sIGQpO1xuICAgICAgfSkub24oXCJjbGlja1wiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICAgIHZhciByZWdpb24gPSBkW2F4ZXMucmVnaW9uLnZhcmlhYmxlKCldO1xuICAgICAgICBkaXNwYXRjaC5jbGljay5jYWxsKGcsIGF4ZXMucmVnaW9uLnZhcmlhYmxlKCksIHJlZ2lvbiwgZCk7XG4gICAgICB9KTtcbiAgICAgIC8vIGZpbmlzaGVkIGRyYXdpbmcgY2FsbCByZWFkeSBldmVudFxuICAgICAgZGlzcGF0Y2gucmVhZHkuY2FsbChnKTtcbiAgICB9KTtcbiAgfSk7XG5cblxuICAvLyBMb2NhbCBldmVudCBoYW5kbGVyc1xuICBkaXNwYXRjaC5vbihcIm1vdXNlb3Zlci5ncmFwaFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICB0aGlzLnNlbGVjdEFsbChcInBhdGhcIikuY2xhc3NlZChcImNvbG91cmxvd1wiLCB0cnVlKTtcbiAgICB0aGlzLnNlbGVjdEFsbChcInBhdGhcIikuZmlsdGVyKGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHJldHVybiBkW3ZhcmlhYmxlXSA9PSB2YWx1ZTtcbiAgICB9KS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogdHJ1ZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcbiAgfSk7XG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdXQuZ3JhcGhcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmNsYXNzZWQoe1wiY29sb3VyaGlnaFwiOiBmYWxzZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcbiAgfSk7XG4gIFxuICAvLyB0b29sdGlwXG4gIGlmIChkMy50aXAgIT09IHVuZGVmaW5lZCkge1xuICAgIHZhciB0aXAgPSBkMy50aXAoKS5hdHRyKCdjbGFzcycsICdkMy10aXAnKS5odG1sKGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkgeyBcbiAgICAgIHJldHVybiBcIjxiPlwiICsgdmFsdWUgKyBcIjwvYj5cIjtcbiAgICB9KTtcbiAgICBkaXNwYXRjaC5vbihcInJlYWR5LnRpcFwiLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoaXMuY2FsbCh0aXApO1xuICAgIH0pO1xuICAgIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyLnRpcFwiLCBmdW5jdGlvbih2YXJpYWJsZSwgdmFsdWUsIGQpIHtcbiAgICAgIHRpcC5zaG93KHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSk7XG4gICAgZGlzcGF0Y2gub24oXCJtb3VzZW91dC50aXBcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgICB0aXAuaGlkZSh2YXJpYWJsZSwgdmFsdWUsIGQpO1xuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG4iLCJcbmZ1bmN0aW9uIGdycGhfbGFiZWxfc2l6ZShnKSB7XG5cbiAgLy8gYSBzdmcgb3IgZyBlbGVtZW50IHRvIHdoaWNoICB3ZSB3aWxsIGJlIGFkZGluZyBvdXIgbGFiZWwgaW4gb3JkZXIgdG9cbiAgLy8gcmVxdWVzdCBpdCdzIHNpemVcbiAgdmFyIGdfID0gZztcbiAgLy8gc3RvcmUgcHJldmlvdXNseSBjYWxjdWxhdGVkIHZhbHVlczsgYXMgdGhlIHNpemUgb2YgY2VydGFpbiBsYWJlbHMgYXJlIFxuICAvLyByZXF1ZXN0ZWQgYWdhaW4gYW5kIGFnYWluIHRoaXMgZ3JlYXRseSBlbmhhbmNlcyBwZXJmb3JtYW5jZVxuICB2YXIgc2l6ZXNfID0ge307XG5cbiAgZnVuY3Rpb24gbGFiZWxfc2l6ZShsYWJlbCkge1xuICAgIGlmIChzaXplc19bbGFiZWxdKSB7XG4gICAgICByZXR1cm4gc2l6ZXNfW2xhYmVsXTtcbiAgICB9XG4gICAgaWYgKCFnXykgcmV0dXJuIFt1bmRlZmluZWQsIHVuZGVmaW5lZF07XG4gICAgdmFyIHRleHQgPSBnXy5hcHBlbmQoXCJ0ZXh0XCIpLnRleHQobGFiZWwpO1xuICAgIHZhciBiYm94ID0gdGV4dFswXVswXS5nZXRCQm94KCk7XG4gICAgdmFyIHNpemUgPSBbYmJveC53aWR0aCoxLjIsIGJib3guaGVpZ2h0KjAuNjVdOyAvLyBUT0RPIHdoeTsgYW5kIGlzIHRoaXMgYWx3YXlzIGNvcnJlY3RcbiAgICAvL3ZhciBzaXplID0gaG9yaXpvbnRhbF8gPyB0ZXh0WzBdWzBdLmdldENvbXB1dGVkVGV4dExlbmd0aCgpIDpcbiAgICAgIC8vdGV4dFswXVswXS5nZXRCQm94KCkuaGVpZ2h0O1xuICAgIHRleHQucmVtb3ZlKCk7XG4gICAgc2l6ZXNfW2xhYmVsXSA9IHNpemU7XG4gICAgcmV0dXJuIHNpemU7XG4gIH1cblxuICBsYWJlbF9zaXplLnN2ZyA9IGZ1bmN0aW9uKGcpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGdfO1xuICAgIH0gZWxzZSB7XG4gICAgICBnXyA9IGc7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgbGFiZWxfc2l6ZS53aWR0aCA9IGZ1bmN0aW9uKGxhYmVsKSB7XG4gICAgdmFyIHNpemUgPSBsYWJlbF9zaXplKGxhYmVsKTtcbiAgICByZXR1cm4gc2l6ZVswXTtcbiAgfTtcblxuICBsYWJlbF9zaXplLmhlaWdodCA9IGZ1bmN0aW9uKGxhYmVsKSB7XG4gICAgdmFyIHNpemUgPSBsYWJlbF9zaXplKGxhYmVsKTtcbiAgICByZXR1cm4gc2l6ZVsxXTtcbiAgfTtcblxuICByZXR1cm4gbGFiZWxfc2l6ZTtcbn1cblxuIiwiXG5mdW5jdGlvbiBncnBoX3NjYWxlX2NobG9yb3BsZXRoKCkge1xuXG4gIHZhciBkb21haW47XG4gIHZhciBiYXNlY2xhc3MgPSBcImNobG9yb1wiO1xuICB2YXIgbmNvbG91cnMgID0gOTtcblxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XG4gICAgaWYgKGRvbWFpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBhc3N1bWUgd2UgaGF2ZSBvbmx5IDEgY29sb3VyXG4gICAgICByZXR1cm4gYmFzZWNsYXNzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyBcIm4xXCIgKyBcIiBcIiArIGJhc2VjbGFzcyArIDE7XG4gICAgfVxuICAgIHZhciByYW5nZSAgPSBkb21haW5bMV0gLSBkb21haW5bMF07XG4gICAgdmFyIHZhbCAgICA9IE1hdGguc3FydCgodiAtIGRvbWFpblswXSkqMC45OTk5KSAvIE1hdGguc3FydChyYW5nZSk7XG4gICAgdmFyIGNhdCAgICA9IE1hdGguZmxvb3IodmFsKm5jb2xvdXJzKTtcbiAgICAvLyByZXR1cm5zIHNvbWV0aGluZyBsaWtlIFwiY2hsb3JvIGNobG9yb24xMCBjaGxvcm80XCJcbiAgICByZXR1cm4gYmFzZWNsYXNzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyBcIm5cIiArIG5jb2xvdXJzICsgXCIgXCIgKyBiYXNlY2xhc3MgKyAoY2F0KzEpO1xuICB9XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZG9tYWluO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb21haW4gPSBkO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYmFzZWNsYXNzO1xuICAgIH0gZWxzZSB7XG4gICAgICBiYXNlY2xhc3MgPSByO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN0ZXAgPSAoZG9tYWluWzFdIC0gZG9tYWluWzBdKS9uY29sb3VycztcbiAgICB2YXIgdCA9IGRvbWFpblswXTtcbiAgICB2YXIgdGlja3MgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBuY29sb3VyczsgKytpKSB7XG4gICAgICB0aWNrcy5wdXNoKHQpO1xuICAgICAgdCArPSBzdGVwO1xuICAgIH1cbiAgICByZXR1cm4gdGlja3M7XG4gIH07XG5cbiAgcmV0dXJuIHNjYWxlO1xufVxuXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XG5ncnBoLnNjYWxlLmNobG9yb3BsZXRoID0gZ3JwaF9zY2FsZV9jaGxvcm9wbGV0aCgpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfY29sb3VyKCkge1xuXG4gIHZhciBkb21haW47XG4gIHZhciByYW5nZSA9IFwiY29sb3VyXCI7XG4gIHZhciBuY29sb3VycztcblxuICBmdW5jdGlvbiBzY2FsZSh2KSB7XG4gICAgaWYgKGRvbWFpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBhc3N1bWUgd2UgaGF2ZSBvbmx5IDEgY29sb3VyXG4gICAgICByZXR1cm4gcmFuZ2UgKyBcIiBcIiArIHJhbmdlICsgXCJuMVwiICsgXCIgXCIgKyByYW5nZSArIDE7XG4gICAgfVxuICAgIHZhciBpID0gZG9tYWluLmluZGV4T2Yodik7XG4gICAgLy8gcmV0dXJucyBzb21ldGhpbmcgbGlrZSBcImNvbG91ciBjb2xvdXJuMTAgY29sb3VyNFwiXG4gICAgcmV0dXJuIHJhbmdlICsgXCIgXCIgKyByYW5nZSArIFwiblwiICsgbmNvbG91cnMgKyBcIiBcIiArIHJhbmdlICsgKGkrMSk7XG4gIH1cblxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpbiA9IGQ7XG4gICAgICBuY29sb3VycyA9IGQubGVuZ3RoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gcmFuZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmdlID0gcjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkb21haW47XG4gIH07XG5cbiAgcmV0dXJuIHNjYWxlO1xufVxuXG5pZiAoZ3JwaC5zY2FsZSA9PT0gdW5kZWZpbmVkKSBncnBoLnNjYWxlID0ge307XG5ncnBoLnNjYWxlLmNvbG91ciA9IGdycGhfc2NhbGVfY29sb3VyKCk7XG5cbiIsIlxuZnVuY3Rpb24gZ3JwaF9zY2FsZV9saW5lYXIoKSB7XG5cbiAgdmFyIGxzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSAyMDtcbiAgdmFyIHBhZGRpbmdfID0gNTtcbiAgdmFyIG50aWNrc18gPSAxMDtcbiAgdmFyIHRpY2tzXztcbiAgdmFyIGluc2lkZV8gPSB0cnVlO1xuXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcbiAgICByZXR1cm4gbHNjYWxlKHYpO1xuICB9XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIGQgPSBsc2NhbGUuZG9tYWluKGQpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xuICAgIHIgPSBsc2NhbGUucmFuZ2Uocik7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiByO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgc2NhbGUubGFiZWxfc2l6ZSA9IGZ1bmN0aW9uKGxhYmVsX3NpemUpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGxhYmVsX3NpemVfO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYWJlbF9zaXplXyA9IGxhYmVsX3NpemU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gbHNpemUobGFiZWwpIHtcbiAgICB2YXIgc2l6ZSA9IHR5cGVvZihsYWJlbF9zaXplXykgPT0gXCJmdW5jdGlvblwiID8gbGFiZWxfc2l6ZV8obGFiZWwpIDogbGFiZWxfc2l6ZV87XG4gICAgc2l6ZSArPSBwYWRkaW5nXztcbiAgICByZXR1cm4gc2l6ZTtcbiAgfVxuXG4gIHNjYWxlLm50aWNrcyA9IGZ1bmN0aW9uKG4pIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG50aWNrc187XG4gICAgfSBlbHNlIHtcbiAgICAgIG50aWNrc18gPSBuO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLmluc2lkZSA9IGZ1bmN0aW9uKGkpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGluc2lkZV87XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc2lkZV8gPSBpID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9O1xuXG4gIHNjYWxlLm5pY2UgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgciA9IGxzY2FsZS5yYW5nZSgpO1xuICAgIHZhciBkID0gbHNjYWxlLmRvbWFpbigpO1xuICAgIHZhciBsID0gTWF0aC5hYnMoclsxXSAtIHJbMF0pO1xuICAgIHZhciB3ID0gd2lsa2luc29uX2lpKGRbMF0sIGRbMV0sIG50aWNrc18sIGxzaXplLCBsKTtcbiAgICBpZiAoaW5zaWRlXykge1xuICAgICAgdmFyIHcxID0gbHNpemUody5sYWJlbHNbMF0pO1xuICAgICAgdmFyIHcyID0gbHNpemUody5sYWJlbHNbdy5sYWJlbHMubGVuZ3RoLTFdKTtcbiAgICAgIHZhciBwYWQgPSB3MS8yICsgdzIvMjtcbiAgICAgIHcgPSB3aWxraW5zb25faWkoZFswXSwgZFsxXSwgbnRpY2tzXywgbHNpemUsIGwtcGFkKTtcbiAgICAgIGlmIChyWzBdIDwgclsxXSkge1xuICAgICAgICBsc2NhbGUucmFuZ2UoW3JbMF0rdzEvMiwgclsxXS13Mi8yXSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsc2NhbGUucmFuZ2UoW3JbMF0tdzEvMiwgclsxXSt3Mi8yXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGRvbWFpbiA9IFt3LmxtaW4sIHcubG1heF07XG4gICAgbHNjYWxlLmRvbWFpbihbdy5sbWluLCB3LmxtYXhdKTtcbiAgICB0aWNrc18gPSB3LmxhYmVscztcbiAgICByZXR1cm4gdGhpcztcbiAgfTtcblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aWNrc18gPT09IHVuZGVmaW5lZCkgcmV0dXJuIGxzY2FsZS50aWNrcyhudGlja3NfKTtcbiAgICByZXR1cm4gdGlja3NfO1xuICB9O1xuXG4gIHJldHVybiBzY2FsZTtcbn1cblxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xuZ3JwaC5zY2FsZS5saW5lYXIgPSBncnBoX3NjYWxlX2xpbmVhcigpO1xuXG4iLCJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfc2l6ZSgpIHtcbiAgXG4gIHZhciBtYXg7XG4gIHZhciBkb21haW47XG5cbiAgZnVuY3Rpb24gc2NhbGUodikge1xuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHNldHRpbmdzKFwiZGVmYXVsdF9idWJibGVcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBtID0gbWF4ID09PSB1bmRlZmluZWQgPyBzZXR0aW5ncyhcIm1heF9idWJibGVcIikgOiBtYXg7XG4gICAgICByZXR1cm4gbSAqIE1hdGguc3FydCh2KS9NYXRoLnNxcnQoZG9tYWluWzFdKTtcbiAgICB9XG4gIH1cblxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpbiA9IGQzLmV4dGVudChkKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfTtcblxuICBzY2FsZS5yYW5nZSA9IGZ1bmN0aW9uKHIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIG1heCA9PT0gdW5kZWZpbmVkID8gc2V0dGluZ3MoXCJtYXhfYnViYmxlXCIpIDogbWF4O1xuICAgIH0gZWxzZSB7XG4gICAgICBtYXggPSBkMy5tYXgocik7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH07XG5cbiAgc2NhbGUudGlja3MgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9O1xuXG4gIHJldHVybiBzY2FsZTtcbn1cblxuaWYgKGdycGguc2NhbGUgPT09IHVuZGVmaW5lZCkgZ3JwaC5zY2FsZSA9IHt9O1xuZ3JwaC5zY2FsZS5zaXplID0gZ3JwaF9zY2FsZV9zaXplKCk7XG5cbiIsIlxuXG52YXIgc2V0dGluZ3MgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHMgPSB7XG4gICAgJ2RlZmF1bHQnIDoge1xuICAgICAgJ3BhZGRpbmcnIDogWzIsIDIsIDIsIDJdLFxuICAgICAgJ2xhYmVsX3BhZGRpbmcnIDogNCxcbiAgICAgICdzZXAnIDogOCxcbiAgICAgICdwb2ludF9zaXplJyA6IDQsXG4gICAgICAnbWF4X2J1YmJsZScgOiAyMCxcbiAgICAgICdkZWZhdWx0X2J1YmJsZScgOiA1XG4gICAgfVxuICB9O1xuXG4gIGZ1bmN0aW9uIGdldChzZXR0aW5nLCB0eXBlKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBzZXR0aW5ncztcbiAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICAgIGlmIChzW3R5cGVdICE9PSB1bmRlZmluZWQgJiYgc1t0eXBlXVtzZXR0aW5nXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBzW3R5cGVdW3NldHRpbmddO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHMuZGVmYXVsdFtzZXR0aW5nXTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHMuZGVmYXVsdFtzZXR0aW5nXTtcbiAgICB9XG4gIH1cblxuICBnZXQuc2V0ID0gZnVuY3Rpb24oc2V0dGluZywgYSwgYikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICBzLmRlZmF1bHRbc2V0dGluZ10gPSBhO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAzKSB7XG4gICAgICBpZiAoc1thXSA9PT0gdW5kZWZpbmVkKSBzW2FdID0ge307XG4gICAgICBzW2FdW3NldHRpbmddID0gYjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWVkIGF0IGxlYXQgdHdvIGFyZ3VtZW50cy5cIik7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiBnZXQ7XG59KCk7XG5cbmdycGguc2V0dGluZ3MgPSBzZXR0aW5ncztcbiIsIlxuLy8gRm9ybWF0IGEgbnVtZXJpYyB2YWx1ZTpcbi8vIC0gTWFrZSBzdXJlIGl0IGlzIHJvdW5kZWQgdG8gdGhlIGNvcnJlY3QgbnVtYmVyIG9mIGRlY2ltYWxzIChuZGVjKVxuLy8gLSBVc2UgdGhlIGNvcnJlY3QgZGVjaW1hbCBzZXBhcmF0b3IgKGRlYylcbi8vIC0gQWRkIGEgdGhvdXNhbmRzIHNlcGFyYXRvciAoZ3JwKVxuZm9ybWF0X251bWVyaWMgPSBmdW5jdGlvbihsYWJlbCwgdW5pdCwgbmRlYywgZGVjLCBncnApIHtcbiAgaWYgKGlzTmFOKGxhYmVsKSkgcmV0dXJuICcnO1xuICBpZiAodW5pdCA9PT0gdW5kZWZpbmVkKSB1bml0ID0gJyc7XG4gIGlmIChkZWMgPT09IHVuZGVmaW5lZCkgZGVjID0gJywnO1xuICBpZiAoZ3JwID09PSB1bmRlZmluZWQpIGdycCA9ICcgJztcbiAgLy8gcm91bmQgbnVtYmVyXG4gIGlmIChuZGVjICE9PSB1bmRlZmluZWQpIHtcbiAgICBsYWJlbCA9IGxhYmVsLnRvRml4ZWQobmRlYyk7XG4gIH0gZWxzZSB7XG4gICAgbGFiZWwgPSBsYWJlbC50b1N0cmluZygpO1xuICB9XG4gIC8vIEZvbGxvd2luZyBiYXNlZCBvbiBjb2RlIGZyb20gXG4gIC8vIGh0dHA6Ly93d3cubXJlZGtqLmNvbS9qYXZhc2NyaXB0L251bWJlckZvcm1hdC5odG1sXG4gIHggICAgID0gbGFiZWwuc3BsaXQoJy4nKTtcbiAgeDEgICAgPSB4WzBdO1xuICB4MiAgICA9IHgubGVuZ3RoID4gMSA/IGRlYyArIHhbMV0gOiAnJztcbiAgaWYgKGdycCAhPT0gJycpIHtcbiAgICB2YXIgcmd4ID0gLyhcXGQrKShcXGR7M30pLztcbiAgICB3aGlsZSAocmd4LnRlc3QoeDEpKSB7XG4gICAgICB4MSA9IHgxLnJlcGxhY2Uocmd4LCAnJDEnICsgZ3JwICsgJyQyJyk7XG4gICAgfVxuICB9XG4gIHJldHVybih4MSArIHgyICsgdW5pdCk7XG59O1xuXG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gPT09PSAgICAgICAgICAgICAgICAgICAgICAgICBXSUxLSU5TT04gQUxHT1JJVEhNICAgICAgICAgICAgICAgICAgICAgICAgPT09PVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cbmZ1bmN0aW9uIHdpbGtpbnNvbl9paShkbWluLCBkbWF4LCBtLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBtbWluLCBtbWF4LCBRLCBwcmVjaXNpb24sIG1pbmNvdmVyYWdlKSB7XG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT0gU1VCUk9VVElORVMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgLy8gVGhlIGZvbGxvd2luZyByb3V0aW5lIGNoZWNrcyBmb3Igb3ZlcmxhcCBpbiB0aGUgbGFiZWxzLiBUaGlzIGlzIHVzZWQgaW4gdGhlIFxuICAvLyBXaWxraW5zb24gbGFiZWxpbmcgYWxnb3JpdGhtIGJlbG93IHRvIGVuc3VyZSB0aGF0IHRoZSBsYWJlbHMgZG8gbm90IG92ZXJsYXAuXG4gIGZ1bmN0aW9uIG92ZXJsYXAobG1pbiwgbG1heCwgbHN0ZXAsIGNhbGNfbGFiZWxfd2lkdGgsIGF4aXNfd2lkdGgsIG5kZWMpIHtcbiAgICB2YXIgd2lkdGhfbWF4ID0gbHN0ZXAqYXhpc193aWR0aC8obG1heC1sbWluKTtcbiAgICBmb3IgKHZhciBsID0gbG1pbjsgKGwgLSBsbWF4KSA8PSAxRS0xMDsgbCArPSBsc3RlcCkge1xuICAgICAgdmFyIHcgID0gY2FsY19sYWJlbF93aWR0aChsLCBuZGVjKTtcbiAgICAgIGlmICh3ID4gd2lkdGhfbWF4KSByZXR1cm4odHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybihmYWxzZSk7XG4gIH1cblxuICAvLyBQZXJmb3JtIG9uZSBpdGVyYXRpb24gb2YgdGhlIFdpbGtpbnNvbiBhbGdvcml0aG1cbiAgZnVuY3Rpb24gd2lsa2luc29uX3N0ZXAobWluLCBtYXgsIGssIG0sIFEsIG1pbmNvdmVyYWdlKSB7XG4gICAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgICBRICAgICAgICAgICAgICAgPSBRICAgICAgICAgfHwgWzEwLCAxLCA1LCAyLCAyLjUsIDMsIDQsIDEuNSwgNywgNiwgOCwgOV07XG4gICAgcHJlY2lzaW9uICAgICAgID0gcHJlY2lzaW9uIHx8IFsxLCAgMCwgMCwgMCwgIC0xLCAwLCAwLCAgLTEsIDAsIDAsIDAsIDBdO1xuICAgIG1pbmNvdmVyYWdlICAgICA9IG1pbmNvdmVyYWdlIHx8IDAuODtcbiAgICBtICAgICAgICAgICAgICAgPSBtIHx8IGs7XG4gICAgLy8gY2FsY3VsYXRlIHNvbWUgc3RhdHMgbmVlZGVkIGluIGxvb3BcbiAgICB2YXIgaW50ZXJ2YWxzICAgPSBrIC0gMTtcbiAgICB2YXIgZGVsdGEgICAgICAgPSAobWF4IC0gbWluKSAvIGludGVydmFscztcbiAgICB2YXIgYmFzZSAgICAgICAgPSBNYXRoLmZsb29yKE1hdGgubG9nKGRlbHRhKS9NYXRoLkxOMTApO1xuICAgIHZhciBkYmFzZSAgICAgICA9IE1hdGgucG93KDEwLCBiYXNlKTtcbiAgICAvLyBjYWxjdWxhdGUgZ3JhbnVsYXJpdHk7IG9uZSBvZiB0aGUgdGVybXMgaW4gc2NvcmVcbiAgICB2YXIgZ3JhbnVsYXJpdHkgPSAxIC0gTWF0aC5hYnMoay1tKS9tO1xuICAgIC8vIGluaXRpYWxpc2UgZW5kIHJlc3VsdFxuICAgIHZhciBiZXN0O1xuICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgcG9zc2libGUgbGFiZWwgcG9zaXRpb25zIHdpdGggZ2l2ZW4ga1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBRLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBjYWxjdWxhdGUgbGFiZWwgcG9zaXRpb25zXG4gICAgICB2YXIgdGRlbHRhID0gUVtpXSAqIGRiYXNlO1xuICAgICAgdmFyIHRtaW4gICA9IE1hdGguZmxvb3IobWluL3RkZWx0YSkgKiB0ZGVsdGE7XG4gICAgICB2YXIgdG1heCAgID0gdG1pbiArIGludGVydmFscyAqIHRkZWx0YTtcbiAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbnVtYmVyIG9mIGRlY2ltYWxzXG4gICAgICB2YXIgbmRlYyAgID0gKGJhc2UgKyBwcmVjaXNpb25baV0pIDwgMCA/IE1hdGguYWJzKGJhc2UgKyBwcmVjaXNpb25baV0pIDogMDtcbiAgICAgIC8vIGlmIGxhYmVsIHBvc2l0aW9ucyBjb3ZlciByYW5nZVxuICAgICAgaWYgKHRtaW4gPD0gbWluICYmIHRtYXggPj0gbWF4KSB7XG4gICAgICAgIC8vIGNhbGN1bGF0ZSByb3VuZG5lc3MgYW5kIGNvdmVyYWdlIHBhcnQgb2Ygc2NvcmVcbiAgICAgICAgdmFyIHJvdW5kbmVzcyA9IDEgLSAoaSAtICh0bWluIDw9IDAgJiYgdG1heCA+PSAwKSkgLyBRLmxlbmd0aDtcbiAgICAgICAgdmFyIGNvdmVyYWdlICA9IChtYXgtbWluKS8odG1heC10bWluKTtcbiAgICAgICAgLy8gaWYgY292ZXJhZ2UgaGlnaCBlbm91Z2hcbiAgICAgICAgaWYgKGNvdmVyYWdlID4gbWluY292ZXJhZ2UgJiYgIW92ZXJsYXAodG1pbiwgdG1heCwgdGRlbHRhLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBuZGVjKSkge1xuICAgICAgICAgIC8vIGNhbGN1bGF0ZSBzY29yZVxuICAgICAgICAgIHZhciB0bmljZSA9IGdyYW51bGFyaXR5ICsgcm91bmRuZXNzICsgY292ZXJhZ2U7XG4gICAgICAgICAgLy8gaWYgaGlnaGVzdCBzY29yZVxuICAgICAgICAgIGlmICgoYmVzdCA9PT0gdW5kZWZpbmVkKSB8fCAodG5pY2UgPiBiZXN0LnNjb3JlKSkge1xuICAgICAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICAgICAgICAnbG1pbicgIDogdG1pbixcbiAgICAgICAgICAgICAgICAnbG1heCcgIDogdG1heCxcbiAgICAgICAgICAgICAgICAnbHN0ZXAnIDogdGRlbHRhLFxuICAgICAgICAgICAgICAgICdzY29yZScgOiB0bmljZSxcbiAgICAgICAgICAgICAgICAnbmRlYycgIDogbmRlY1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyByZXR1cm5cbiAgICByZXR1cm4gKGJlc3QpO1xuICB9XG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBNQUlOID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgZG1pbiAgICAgICAgICAgICA9IE51bWJlcihkbWluKTtcbiAgZG1heCAgICAgICAgICAgICA9IE51bWJlcihkbWF4KTtcbiAgaWYgKE1hdGguYWJzKGRtaW4gLSBkbWF4KSA8IDFFLTEwKSB7XG4gICAgZG1pbiA9IDAuOTYqZG1pbjtcbiAgICBkbWF4ID0gMS4wNCpkbWF4O1xuICB9XG4gIGNhbGNfbGFiZWxfd2lkdGggPSBjYWxjX2xhYmVsX3dpZHRoIHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4oMCk7fTtcbiAgYXhpc193aWR0aCAgICAgICA9IGF4aXNfd2lkdGggfHwgMTtcbiAgUSAgICAgICAgICAgICAgICA9IFEgICAgICAgICB8fCBbMTAsIDEsIDUsIDIsIDIuNSwgMywgNCwgMS41LCA3LCA2LCA4LCA5XTtcbiAgcHJlY2lzaW9uICAgICAgICA9IHByZWNpc2lvbiB8fCBbMSwgIDAsIDAsIDAsICAtMSwgMCwgMCwgIC0xLCAwLCAwLCAwLCAwXTtcbiAgbWluY292ZXJhZ2UgICAgICA9IG1pbmNvdmVyYWdlIHx8IDAuODtcbiAgbW1pbiAgICAgICAgICAgICA9IG1taW4gfHwgMjtcbiAgbW1heCAgICAgICAgICAgICA9IG1tYXggfHwgTWF0aC5jZWlsKDYqbSk7XG4gIC8vIGluaXRpbGlzZSBlbmQgcmVzdWx0XG4gIHZhciBiZXN0ID0ge1xuICAgICAgJ2xtaW4nICA6IGRtaW4sXG4gICAgICAnbG1heCcgIDogZG1heCxcbiAgICAgICdsc3RlcCcgOiAoZG1heCAtIGRtaW4pLFxuICAgICAgJ3Njb3JlJyA6IC0xRTgsXG4gICAgICAnbmRlYycgIDogMFxuICAgIH07XG4gIC8vIGNhbGN1bGF0ZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXNcbiAgdmFyIHggPSBTdHJpbmcoYmVzdC5sc3RlcCkuc3BsaXQoJy4nKTtcbiAgYmVzdC5uZGVjID0geC5sZW5ndGggPiAxID8geFsxXS5sZW5ndGggOiAwO1xuICAvLyBsb29wIHRob3VnaCBhbGwgcG9zc2libGUgbnVtYmVycyBvZiBsYWJlbHNcbiAgZm9yICh2YXIgayA9IG1taW47IGsgPD0gbW1heDsgaysrKSB7IFxuICAgIC8vIGNhbGN1bGF0ZSBiZXN0IGxhYmVsIHBvc2l0aW9uIGZvciBjdXJyZW50IG51bWJlciBvZiBsYWJlbHNcbiAgICB2YXIgcmVzdWx0ID0gd2lsa2luc29uX3N0ZXAoZG1pbiwgZG1heCwgaywgbSwgUSwgbWluY292ZXJhZ2UpO1xuICAgIC8vIGNoZWNrIGlmIGN1cnJlbnQgcmVzdWx0IGhhcyBoaWdoZXIgc2NvcmVcbiAgICBpZiAoKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSAmJiAoKGJlc3QgPT09IHVuZGVmaW5lZCkgfHwgKHJlc3VsdC5zY29yZSA+IGJlc3Quc2NvcmUpKSkge1xuICAgICAgYmVzdCA9IHJlc3VsdDtcbiAgICB9XG4gIH1cbiAgLy8gZ2VuZXJhdGUgbGFiZWwgcG9zaXRpb25zXG4gIHZhciBsYWJlbHMgPSBbXTtcbiAgZm9yICh2YXIgbCA9IGJlc3QubG1pbjsgKGwgLSBiZXN0LmxtYXgpIDw9IDFFLTEwOyBsICs9IGJlc3QubHN0ZXApIHtcbiAgICBsYWJlbHMucHVzaChsKTtcbiAgfVxuICBiZXN0LmxhYmVscyA9IGxhYmVscztcbiAgcmV0dXJuKGJlc3QpO1xufVxuXG5cbiIsIiAgXG4gIGdycGgubGluZSA9IGdycGhfZ3JhcGhfbGluZTtcbiAgZ3JwaC5tYXAgPSBncnBoX2dyYXBoX21hcDtcbiAgZ3JwaC5idWJibGUgPSBncnBoX2dyYXBoX2J1YmJsZTtcblxuICB0aGlzLmdycGggPSBncnBoO1xuXG59KCkpO1xuXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=