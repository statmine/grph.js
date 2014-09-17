
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


function grph_axis_colour() {

  var scale = grph_scale_colour();
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


function grph_axis_linear(horizontal) {

  var scale_ = grph_scale_linear();
  var horizontal_ = horizontal;
  var variable_;
  var width_, height_;
  var settings_ = {
    "tick_length" : 5,
    "tick_padding" : 2,
    "padding" : 4
  }

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "linearaxis dummy")
    .style("visibility", "invisible");
  var label_size_ = grph_label_size(dummy_);
  if (horizontal_) scale_.label_size(label_size_.width) 
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
      if (arguments.length == 0) {
        return width_;
      } else {
        width_ = width;
        scale_.range([0, width_]);
        return this;
      }
    } else {
      // if vertical the width is usually defined by the graph: the space it
      // needs to draw the tickmarks and labels etc. 
      if (arguments.length == 0) {
        if (width_ == undefined) {// TODO reset width_ when labels change
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
  }

  axis.height = function(height) {
    if (horizontal_) {
      // if horizontal the width is usually defined by the graph: the space it
      // needs to draw the tickmarks and labels etc. 
      if (arguments.length == 0) {
        if (height_ == undefined) { // TODO reset height_ when labels change
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
      if (arguments.length == 0) {
        return height_;
      } else {
        height_ = height;
        scale_.range([height_, 0]);
        return this;
      }
    }
  }

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'number';
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
      return scale_.domain();
    } else {
      var range = d3.extent(data, function(d) { return d[variable_];});
      scale_.domain(range).nice();
      return this;
    }
  }

  axis.ticks = function() {
    return scale_.ticks();
  }

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return scale_(v[variable_]);
    } else {
      return scale_(v);
    }
  }

  return axis;
}


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
    if (arguments.length == 0) {
      return width_;
    } else {
      update_projection_ = update_projection_ || width_ != width;
      width_ = width;
      return this;
    }
  }

  axis.height = function(height) {
    if (arguments.length == 0) {
      return height_;
    } else {
      update_projection_ = update_projection_ || height_ != height;
      height_ = height;
      return this;
    }
  }

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'string';
  }

  axis.variable = function(v) {
    if (arguments.length == 0) {
      return variable_;
    } else {
      variable_ = v;
      return this;
    }
  }

  // Variable and function that keeps track of whether or not the map has 
  // finished loading. The method domain() loads the map. However, this happens
  // asynchronously. Therefore, it is possible (and often happens) that the map
  // has not yet loaded when scale() and transform() are called. The code 
  // calling these methods therefore needs to wait until the map has loaded. 
  var map_loading_ = false; 
  axis.map_loaded = function() {
    return !map_loading_;
  }

  function load_map(data, schema, callback) {
    if (variable_ === undefined) return ; // TODO
    var vschema = variable_schema(variable_, schema);
    if (vschema.map == undefined) return ; // TODO
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
    if (arguments.length == 0) {
      //return scale.domain();
    } else {
      load_map(data, schema, function(map) {
        map_ = map;
        update_projection_ = true;
        // build index mapping region name on features 
        var vschema = variable_schema(variable_, schema);
        var regionid = vschema.regionid || "id";
        for (feature in map_.features) {
          var name = map_.features[feature].properties[regionid];
          index_[name] = feature;
        }
      });
      return this;
    }
  }

  axis.scale = function(v) {
    if (typeof v == 'object') { 
      return axis.scale(v[variable_]);
    } else {
      axis.update_projection();
      return path_(map_.features[index_[v]]);
    }
  }

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
      var scale  = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width_, 
                  (bounds[1][1] - bounds[0][1]) / height_);
      var transl = [(width_ - scale * (bounds[1][0] + bounds[0][0])) / 2, 
                  (height_ - scale * (bounds[1][1] + bounds[0][1])) / 2];
      projection_.scale(scale).translate(transl);
      update_projection_ = false;
    }
  }


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
  }

  graph.width = function(w) {
    if (arguments.length == 0) {
      return width;
    } else {
      width = w;
      return this;
    }
  }

  graph.height = function(h) {
    if (arguments.length == 0) {
      return height;
    } else {
      height = h;
      return this;
    }
  }

  graph.accept = function(variables, axis) {
    if (arguments.length > 1) {
      if (axes[axis] === undefined) return false;
      return axes[axis].accept(variables, schema);
    } else {
      for (i in axes) {
        if (variables[i] === undefined) {
          if (axes[i].required) return false;
        } else {
          var accept = axes[i].accept(variables[i], schema);
          if (!accept) return false;
        }
      }
      return true;
    }
  }

  graph.assign = function(variables) {
    for (i in axes) axes[i].variable(variables[i]);
    return this;
  }

  graph.schema = function(s) {
    if (arguments.length == 0) {
      return schema;
    } else {
      schema = s;
      return this;
    }
  }

  graph.data = function(d, s) {
    if (arguments.length == 0) {
      return data;
    } else {
      data = d;
      if (arguments.length > 1) 
        graph.schema(s);
      return this;
    }
  }

  graph.dispatch = function() {
    return dispatch;
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
  var settings = {
    'padding' : [2, 2, 2, 2],
    'label_padding' : 4,
    'sep' : 8,
    'point_size' : 4
  };
  var dispatch = d3.dispatch("mouseover", "mouseout", "pointover", "pointout");

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
    var label_height = label_size_.height(xlabel) + settings.label_padding;
    var vschemay = variable_schema(axes.y.variable(), schema);
    var ylabel = vschemay.title;
    // set the width, height end domain of the x- and y-axes. We need some 
    // iterations for this, as the height of the y-axis depends of the height
    // of the x-axis, which depends on the labels of the x-axis, which depends
    // on the width of the x-axis, etc. 
    for (var i = 0; i < 2; ++i) {
      var w = graph.width() - settings.padding[1] - settings.padding[3] - 
        axes.y.width() - label_height;
      w = (w - (ncol-1)*settings.sep) / ncol;
      axes.x.width(w).domain(graph.data(), graph.schema());
      var h = graph.height() - settings.padding[0] - settings.padding[2] - 
        axes.x.height() - label_height;
      h = (h - (nrow-1)*settings.sep) / nrow;
      axes.y.height(h).domain(graph.data(), graph.schema());
    }
    var l = axes.y.width() + settings.padding[1] + label_height;
    var t  = settings.padding[2];
    // draw labels
    var ycenter = t + 0.5*(graph.height() - settings.padding[0] - settings.padding[2] - 
        axes.x.height() - label_height);
    var xcenter = l + 0.5*(graph.width() - settings.padding[1] - settings.padding[3] - 
        axes.y.width() - label_height);
    g.append("text")
      .attr("x", settings.padding[1]).attr("y", ycenter)
      .attr("text-anchor", "middle").text(ylabel)
      .attr("transform", "rotate(90 " + settings.padding[1] + " " + ycenter + ")");
    g.append("text").attr("x", xcenter).attr("y", graph.height()-settings.padding[0])
      .attr("text-anchor", "middle").text(xlabel);



    var d = d3.nest().key(nest_column).key(nest_row).key(nest_colour).entries(graph.data());

    for (var i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      var t  = settings.padding[2];
      for (var j = 0; j < dj.length; ++j) {
        // draw x-axis
        if (j == (dj.length-1)) {
          g.append("g").attr("class", "xaxis")
            .attr("transform", "translate(" + l + "," + (t + h) + ")").call(axes.x);
        }
        // draw y-axis
        if (i == 0) {
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
        var line = d3.svg.line().x(axes.x.scale).y(axes.y.scale) 
        var dk = dj[j].values;
        for (var k = 0; k < dk.length; ++k) {
          gr.append("path").attr("d", line(dk[k].values))
            .attr("class", axes.colour.scale(dk[k].key))
            .datum(dk[k]);
        }
        // draw points 
        var dk = dj[j].values;
        for (var k = 0; k < dk.length; ++k) {
          var cls = "circle" + k;
          gr.selectAll("circle.circle" + k).data(dk[k].values).enter().append("circle")
            .attr("class", "circle" + k + " " + axes.colour.scale(dk[k].key))
            .attr("cx", axes.x.scale).attr("cy", axes.y.scale)
            .attr("r", settings.point_size);
        }

        // next line
        t += axes.y.height() + settings.sep;
      }
      l += axes.x.width() + settings.sep;
    }


    // add hover events to the lines and points
    g.selectAll(".colour").on("mouseover", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseover.call(g, variable, value, d);
      if (!d.key) dispatch.pointover.call(g, variable, value, d);
    });
    g.selectAll(".colour").on("mouseout", function(d, i) {
      var variable = axes.colour.variable();
      var value = variable ? (d.key || d[variable]) : undefined;
      dispatch.mouseout.call(g, variable, value, d);
      if (!d.key) dispatch.pointout.call(g, variable, value, d);
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
  var settings = {
    'padding' : [2, 2, 2, 2],
    'label_padding' : 4,
    'sep' : 8,
  };
  var dispatch = d3.dispatch("mouseover", "mouseout");

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
    var w = (graph.width() - settings.padding[1] - settings.padding[3] - 
      (ncol-1)*settings.sep)/ncol;
    var h = (graph.height() - settings.padding[0] - settings.padding[2] - 
      (nrow-1)*settings.sep)/nrow;
    var l = settings.padding[1];
    var t  = settings.padding[2];
    axes.region.width(w).height(h);
    // draw graphs
    wait_for(axes.region.map_loaded, function() {
    var d = d3.nest().key(nest_column).key(nest_row).entries(graph.data());
    for (var i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      var t  = settings.padding[2];
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
        t += h + settings.sep;
      }
      l += w + settings.sep;
    }
    // add events to the lines
    g.selectAll("path").on("mouseover", function(d, i) {
      var region = d[axes.region.variable()];
      dispatch.mouseover.call(g, axes.region.variable(), region, d);
    });
    g.selectAll("path").on("mouseout", function(d, i) {
      var region = d[axes.region.variable()];
      dispatch.mouseout.call(g, axes.region.variable(), region, d);
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



grph_label_size = function(g) {

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
    if (arguments.length == 0) {
      return g_;
    } else {
      g_ = g;
      return this;
    }
  }

  label_size.width = function(label) {
    var size = label_size(label);
    return size[0];
  }

  label_size.height = function(label) {
    var size = label_size(label);
    return size[1];
  }

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
    if (arguments.length == 0) {
      return domain;
    } else {
      domain = d;
      return this;
    }
  }

  scale.range = function(r) {
    if (arguments.length == 0) {
      return baseclass;
    } else {
      baseclass = r;
      return this;
    }
  }

  scale.ticks = function() {
    var step = (domain[1] - domain[0])/ncolours;
    var t = domain[0];
    var ticks = [];
    for (var i = 0; i <= ncolours; ++i) {
      ticks.push(t);
      t += step;
    }
    return ticks;
  }

  return scale;
}


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
    if (arguments.length == 0) {
      return domain;
    } else {
      domain = d;
      ncolours = d.length;
      return this;
    }
  }

  scale.range = function(r) {
    if (arguments.length == 0) {
      return range;
    } else {
      range = r;
      return this;
    }
  }

  scale.ticks = function() {
    return domain;
  }

  return scale;

 
}


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
    var d = lscale.domain(d);
    if (arguments.length == 0) {
      return d;
    } else {
      return this;
    }
  }

  scale.range = function(r) {
    var r = lscale.range(r);
    if (arguments.length == 0) {
      return r;
    } else {
      return this;
    }
  }

  scale.label_size = function(label_size) {
    if (arguments.length == 0) {
      return label_size_;
    } else {
      label_size_ = label_size;
      return this;
    }
  }

  function lsize(label) {
    var size = typeof(label_size_) == "function" ? label_size_(label) : label_size_;
    size += padding_;
    return size;
  }

  scale.nticks = function(n) {
    if (arguments.length == 0) {
      return nticks_;
    } else {
      nticks_ = n;
      return this;
    }
  }

  scale.inside = function(i) {
    if (arguments.length == 0) {
      return inside_;
    } else {
      inside_ = i ? true : false;
      return this;
    }
  }

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
  }

  scale.ticks = function() {
    if (ticks_ === undefined) return lscale.ticks(nticks_);
    return ticks_;
  }

  return scale;
}




// Format a numeric value:
// - Make sure it is rounded to the correct number of decimals (ndec)
// - Use the correct decimal separator (dec)
// - Add a thousands separator (grp)
format_numeric = function(label, unit, ndec, dec, grp) {
  if (isNaN(label)) return '';
  if (unit == undefined) unit = '';
  if (dec == undefined) dec = ',';
  if (grp == undefined) grp = ' ';
  // round number
  if (ndec != undefined) {
    label = label.toFixed(ndec);
  } else {
    label = label.toString();
  }
  // Following based on code from 
  // http://www.mredkj.com/javascript/numberFormat.html
  x     = label.split('.');
  x1    = x[0];
  x2    = x.length > 1 ? dec + x[1] : '';
  if (grp != '') {
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + grp + '$2');
    }
  }
  return(x1 + x2 + unit);
}



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
    var best = undefined;
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
        var roundness = 1 - (i - (tmin <= 0 && tmax >= 0)) / Q.length
        var coverage  = (max-min)/(tmax-tmin)
        // if coverage high enough
        if (coverage > mincoverage && !overlap(tmin, tmax, tdelta, calc_label_width, axis_width, ndec)) {
          // calculate score
          var tnice = granularity + roundness + coverage
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
  var x = String(best['lstep']).split('.');
  best['ndec'] = x.length > 1 ? x[1].length : 0;
  // loop though all possible numbers of labels
  for (var k = mmin; k <= mmax; k++) { 
    // calculate best label position for current number of labels
    var result = wilkinson_step(dmin, dmax, k, m, Q, mincoverage)
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
  best['labels'] = labels;
  return(best);
}



//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF4aXNfY2hsb3JvcGxldGguanMiLCJheGlzX2NvbG91ci5qcyIsImF4aXNfbGluZWFyLmpzIiwiYXhpc19yZWdpb24uanMiLCJheGlzX3NwbGl0LmpzIiwiZGF0YXBhY2thZ2UuanMiLCJncmFwaC5qcyIsImdyYXBoX2xpbmUuanMiLCJncmFwaF9tYXAuanMiLCJsYWJlbF9zaXplLmpzIiwic2NhbGVfY2hsb3JvcGxldGguanMiLCJzY2FsZV9jb2xvdXIuanMiLCJzY2FsZV9saW5lYXIuanMiLCJ3aWxraW5zb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdycGguanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbmZ1bmN0aW9uIGdycGhfYXhpc19jaGxvcm9wbGV0aCgpIHtcblxuICB2YXIgdmFyaWFibGU7XG4gIHZhciB3aWR0aCwgaGVpZ2h0O1xuICB2YXIgc2NhbGUgPSBncnBoX3NjYWxlX2NobG9yb3BsZXRoKCk7XG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24odykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiB3aWR0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGggPSB3O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodDtcbiAgICB9IGVsc2Uge1xuICAgICAgaGVpZ2h0ID0gaDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ251bWJlcic7XG4gIH1cblxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiB2YXJpYWJsZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyaWFibGUgPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gc2NhbGUuZG9tYWluKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh2YXJpYWJsZSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcbiAgICAgIHNjYWxlLmRvbWFpbihkMy5leHRlbnQoZGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV07fSkpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZS50aWNrcygpO1xuICB9XG5cbiAgYXhpcy5zY2FsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAodHlwZW9mIHYgPT0gJ29iamVjdCcpIHsgXG4gICAgICByZXR1cm4gYXhpcy5zY2FsZSh2W3ZhcmlhYmxlXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXhpcztcbn1cbiIsIlxuZnVuY3Rpb24gZ3JwaF9heGlzX2NvbG91cigpIHtcblxuICB2YXIgc2NhbGUgPSBncnBoX3NjYWxlX2NvbG91cigpO1xuICB2YXIgdmFyaWFibGVfO1xuICB2YXIgd2lkdGhfLCBoZWlnaHRfO1xuICB2YXIgc2V0dGluZ3NfID0ge1xuICB9O1xuXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xuICB9XG5cbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkdGhfID0gd2lkdGg7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBoZWlnaHRfO1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWlnaHRfID0gaGVpZ2h0O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgYXhpcy5hY2NlcHQgPSBmdW5jdGlvbih2YXJpYWJsZSwgc2NoZW1hKSB7XG4gICAgdmFyIHZzY2hlbWEgPSB2YXJpYWJsZV9zY2hlbWEodmFyaWFibGUsIHNjaGVtYSk7XG4gICAgcmV0dXJuIHZzY2hlbWEudHlwZSA9PSAnY2F0ZWdvcmljYWwnO1xuICB9XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZV8gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gc2NhbGUuZG9tYWluKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh2YXJpYWJsZV8gPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXM7XG4gICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XG4gICAgICB2YXIgY2F0ZWdvcmllcyA9IHZzY2hlbWEuY2F0ZWdvcmllcy5tYXAoZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZC5uYW1lOyB9KTtcbiAgICAgIHNjYWxlLmRvbWFpbihjYXRlZ29yaWVzKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIGF4aXMudGlja3MgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2NhbGUudGlja3MoKTtcbiAgfVxuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIHNjYWxlKHZbdmFyaWFibGVfXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBzY2FsZSh2KTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXhpcztcbn1cbiIsIlxuZnVuY3Rpb24gZ3JwaF9heGlzX2xpbmVhcihob3Jpem9udGFsKSB7XG5cbiAgdmFyIHNjYWxlXyA9IGdycGhfc2NhbGVfbGluZWFyKCk7XG4gIHZhciBob3Jpem9udGFsXyA9IGhvcml6b250YWw7XG4gIHZhciB2YXJpYWJsZV87XG4gIHZhciB3aWR0aF8sIGhlaWdodF87XG4gIHZhciBzZXR0aW5nc18gPSB7XG4gICAgXCJ0aWNrX2xlbmd0aFwiIDogNSxcbiAgICBcInRpY2tfcGFkZGluZ1wiIDogMixcbiAgICBcInBhZGRpbmdcIiA6IDRcbiAgfVxuXG4gIHZhciBkdW1teV8gPSBkMy5zZWxlY3QoXCJib2R5XCIpLmFwcGVuZChcInN2Z1wiKVxuICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsaW5lYXJheGlzIGR1bW15XCIpXG4gICAgLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImludmlzaWJsZVwiKTtcbiAgdmFyIGxhYmVsX3NpemVfID0gZ3JwaF9sYWJlbF9zaXplKGR1bW15Xyk7XG4gIGlmIChob3Jpem9udGFsXykgc2NhbGVfLmxhYmVsX3NpemUobGFiZWxfc2l6ZV8ud2lkdGgpIFxuICBlbHNlIHNjYWxlXy5sYWJlbF9zaXplKGxhYmVsX3NpemVfLmhlaWdodCk7XG4gIFxuXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xuICAgIHZhciB0aWNrcyA9IGF4aXMudGlja3MoKTtcbiAgICBnLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBheGlzLndpZHRoKCkpLmF0dHIoXCJoZWlnaHRcIiwgYXhpcy5oZWlnaHQoKSk7XG4gICAgaWYgKGhvcml6b250YWwpIHtcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrXCIpXG4gICAgICAgIC5hdHRyKFwieDFcIiwgc2NhbGVfKS5hdHRyKFwieDJcIiwgc2NhbGVfKVxuICAgICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ5MlwiLCBzZXR0aW5nc18udGlja19sZW5ndGgpO1xuICAgICAgZy5zZWxlY3RBbGwoXCIudGlja2xhYmVsXCIpLmRhdGEodGlja3MpLmVudGVyKClcbiAgICAgICAgLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGlja2xhYmVsXCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCBzY2FsZV8pLmF0dHIoXCJ5XCIsIHNldHRpbmdzXy50aWNrX2xlbmd0aCArIHNldHRpbmdzXy50aWNrX3BhZGRpbmcpXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7fSlcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcIm1pZGRsZVwiKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiMC43MWVtXCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdyA9IGF4aXMud2lkdGgoKTtcbiAgICAgIGcuc2VsZWN0QWxsKFwiLnRpY2tcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwibGluZVwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrXCIpXG4gICAgICAgIC5hdHRyKFwieDFcIiwgdy1zZXR0aW5nc18udGlja19sZW5ndGgpLmF0dHIoXCJ4MlwiLCB3KVxuICAgICAgICAuYXR0cihcInkxXCIsIHNjYWxlXykuYXR0cihcInkyXCIsIHNjYWxlXyk7XG4gICAgICBnLnNlbGVjdEFsbChcIi50aWNrbGFiZWxcIikuZGF0YSh0aWNrcykuZW50ZXIoKVxuICAgICAgICAuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aWNrbGFiZWxcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHNldHRpbmdzXy5wYWRkaW5nKS5hdHRyKFwieVwiLCBzY2FsZV8pXG4gICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7fSlcbiAgICAgICAgLmF0dHIoXCJ0ZXh0LWFuY2hvclwiLCBcImJlZ2luXCIpXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIwLjM1ZW1cIik7XG4gICAgfVxuICB9XG5cbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XG4gICAgaWYgKGhvcml6b250YWxfKSB7XG4gICAgICAvLyBpZiBob3Jpem9udGFsIHRoZSB3aWR0aCBpcyB1c3VhbGx5IGdpdmVuOyB0aGlzIGRlZmluZXMgdGhlIHJhbmdlIG9mXG4gICAgICAvLyB0aGUgc2NhbGVcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZHRoXyA9IHdpZHRoO1xuICAgICAgICBzY2FsZV8ucmFuZ2UoWzAsIHdpZHRoX10pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdmVydGljYWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZGVmaW5lZCBieSB0aGUgZ3JhcGg6IHRoZSBzcGFjZSBpdFxuICAgICAgLy8gbmVlZHMgdG8gZHJhdyB0aGUgdGlja21hcmtzIGFuZCBsYWJlbHMgZXRjLiBcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgICAgaWYgKHdpZHRoXyA9PSB1bmRlZmluZWQpIHsvLyBUT0RPIHJlc2V0IHdpZHRoXyB3aGVuIGxhYmVscyBjaGFuZ2VcbiAgICAgICAgICB2YXIgdGlja3MgPSBzY2FsZV8udGlja3MoKTtcbiAgICAgICAgICB2YXIgdyA9IDA7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aWNrcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGx3ID0gbGFiZWxfc2l6ZV8ud2lkdGgodGlja3NbaV0pO1xuICAgICAgICAgICAgaWYgKGx3ID4gdykgdyA9IGx3O1xuICAgICAgICAgIH1cbiAgICAgICAgICB3aWR0aF8gPSB3ICsgc2V0dGluZ3NfLnRpY2tfbGVuZ3RoICsgc2V0dGluZ3NfLnRpY2tfcGFkZGluZyArIHNldHRpbmdzXy5wYWRkaW5nOyAgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdpZHRoXyA9IHdpZHRoO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBheGlzLmhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCkge1xuICAgIGlmIChob3Jpem9udGFsXykge1xuICAgICAgLy8gaWYgaG9yaXpvbnRhbCB0aGUgd2lkdGggaXMgdXN1YWxseSBkZWZpbmVkIGJ5IHRoZSBncmFwaDogdGhlIHNwYWNlIGl0XG4gICAgICAvLyBuZWVkcyB0byBkcmF3IHRoZSB0aWNrbWFya3MgYW5kIGxhYmVscyBldGMuIFxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICBpZiAoaGVpZ2h0XyA9PSB1bmRlZmluZWQpIHsgLy8gVE9ETyByZXNldCBoZWlnaHRfIHdoZW4gbGFiZWxzIGNoYW5nZVxuICAgICAgICAgIHZhciB0aWNrcyA9IHNjYWxlXy50aWNrcygpO1xuICAgICAgICAgIHZhciBoID0gMDtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRpY2tzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgbGggPSBsYWJlbF9zaXplXy5oZWlnaHQodGlja3NbaV0pO1xuICAgICAgICAgICAgaWYgKGxoID4gaCkgaCA9IGxoO1xuICAgICAgICAgIH1cbiAgICAgICAgICBoZWlnaHRfID0gaCArIHNldHRpbmdzXy50aWNrX2xlbmd0aCArIHNldHRpbmdzXy50aWNrX3BhZGRpbmcgKyBzZXR0aW5nc18ucGFkZGluZzsgXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhlaWdodF87XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBoZWlnaHRfID0gaGVpZ2h0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaWYgdmVydGljYWwgdGhlIHdpZHRoIGlzIHVzdWFsbHkgZ2l2ZW47IHRoaXMgZGVmaW5lcyB0aGUgcmFuZ2Ugb2ZcbiAgICAgIC8vIHRoZSBzY2FsZVxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICAgIHNjYWxlXy5yYW5nZShbaGVpZ2h0XywgMF0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdudW1iZXInO1xuICB9XG5cbiAgYXhpcy52YXJpYWJsZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gdmFyaWFibGVfO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXJpYWJsZV8gPSB2O1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gc2NhbGVfLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcmFuZ2UgPSBkMy5leHRlbnQoZGF0YSwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZFt2YXJpYWJsZV9dO30pO1xuICAgICAgc2NhbGVfLmRvbWFpbihyYW5nZSkubmljZSgpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgYXhpcy50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzY2FsZV8udGlja3MoKTtcbiAgfVxuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIHNjYWxlXyh2W3ZhcmlhYmxlX10pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2NhbGVfKHYpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBheGlzO1xufVxuIiwiXG5mdW5jdGlvbiBncnBoX2F4aXNfcmVnaW9uKCkge1xuXG4gIHZhciB2YXJpYWJsZV87XG4gIHZhciB3aWR0aF8sIGhlaWdodF87XG4gIHZhciBtYXBfbG9hZGVkXztcbiAgdmFyIG1hcF87XG4gIHZhciBpbmRleF8gPSB7fTtcblxuICB2YXIgc2V0dGluZ3NfID0ge1xuICB9O1xuXG4gIGZ1bmN0aW9uIGF4aXMoZykge1xuICB9XG5cbiAgYXhpcy53aWR0aCA9IGZ1bmN0aW9uKHdpZHRoKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIHdpZHRoXztcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdXBkYXRlX3Byb2plY3Rpb25fIHx8IHdpZHRoXyAhPSB3aWR0aDtcbiAgICAgIHdpZHRoXyA9IHdpZHRoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgYXhpcy5oZWlnaHQgPSBmdW5jdGlvbihoZWlnaHQpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0XztcbiAgICB9IGVsc2Uge1xuICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gdXBkYXRlX3Byb2plY3Rpb25fIHx8IGhlaWdodF8gIT0gaGVpZ2h0O1xuICAgICAgaGVpZ2h0XyA9IGhlaWdodDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIGF4aXMuYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGUsIHNjaGVtYSkge1xuICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpO1xuICAgIHJldHVybiB2c2NoZW1hLnR5cGUgPT0gJ3N0cmluZyc7XG4gIH1cblxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhcmlhYmxlXyA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICAvLyBWYXJpYWJsZSBhbmQgZnVuY3Rpb24gdGhhdCBrZWVwcyB0cmFjayBvZiB3aGV0aGVyIG9yIG5vdCB0aGUgbWFwIGhhcyBcbiAgLy8gZmluaXNoZWQgbG9hZGluZy4gVGhlIG1ldGhvZCBkb21haW4oKSBsb2FkcyB0aGUgbWFwLiBIb3dldmVyLCB0aGlzIGhhcHBlbnNcbiAgLy8gYXN5bmNocm9ub3VzbHkuIFRoZXJlZm9yZSwgaXQgaXMgcG9zc2libGUgKGFuZCBvZnRlbiBoYXBwZW5zKSB0aGF0IHRoZSBtYXBcbiAgLy8gaGFzIG5vdCB5ZXQgbG9hZGVkIHdoZW4gc2NhbGUoKSBhbmQgdHJhbnNmb3JtKCkgYXJlIGNhbGxlZC4gVGhlIGNvZGUgXG4gIC8vIGNhbGxpbmcgdGhlc2UgbWV0aG9kcyB0aGVyZWZvcmUgbmVlZHMgdG8gd2FpdCB1bnRpbCB0aGUgbWFwIGhhcyBsb2FkZWQuIFxuICB2YXIgbWFwX2xvYWRpbmdfID0gZmFsc2U7IFxuICBheGlzLm1hcF9sb2FkZWQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gIW1hcF9sb2FkaW5nXztcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRfbWFwKGRhdGEsIHNjaGVtYSwgY2FsbGJhY2spIHtcbiAgICBpZiAodmFyaWFibGVfID09PSB1bmRlZmluZWQpIHJldHVybiA7IC8vIFRPRE9cbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XG4gICAgaWYgKHZzY2hlbWEubWFwID09IHVuZGVmaW5lZCkgcmV0dXJuIDsgLy8gVE9ET1xuICAgIGlmICh2c2NoZW1hLm1hcCA9PSBtYXBfbG9hZGVkXykgcmV0dXJuOyBcbiAgICBtYXBfbG9hZGluZ18gPSB0cnVlO1xuICAgIC8vIFRPRE8gaGFuZGxlIGVycm9ycyBpbiBkMy5qc29uXG4gICAgZDMuanNvbih2c2NoZW1hLm1hcCwgZnVuY3Rpb24oanNvbikge1xuICAgICAgbWFwX2xvYWRlZF8gPSB2c2NoZW1hLm1hcDtcbiAgICAgIGNhbGxiYWNrKGpzb24pO1xuICAgICAgbWFwX2xvYWRpbmdfID0gZmFsc2U7XG4gICAgfSk7XG4gIH1cblxuICBheGlzLmRvbWFpbiA9IGZ1bmN0aW9uKGRhdGEsIHNjaGVtYSkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIC8vcmV0dXJuIHNjYWxlLmRvbWFpbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsb2FkX21hcChkYXRhLCBzY2hlbWEsIGZ1bmN0aW9uKG1hcCkge1xuICAgICAgICBtYXBfID0gbWFwO1xuICAgICAgICB1cGRhdGVfcHJvamVjdGlvbl8gPSB0cnVlO1xuICAgICAgICAvLyBidWlsZCBpbmRleCBtYXBwaW5nIHJlZ2lvbiBuYW1lIG9uIGZlYXR1cmVzIFxuICAgICAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZV8sIHNjaGVtYSk7XG4gICAgICAgIHZhciByZWdpb25pZCA9IHZzY2hlbWEucmVnaW9uaWQgfHwgXCJpZFwiO1xuICAgICAgICBmb3IgKGZlYXR1cmUgaW4gbWFwXy5mZWF0dXJlcykge1xuICAgICAgICAgIHZhciBuYW1lID0gbWFwXy5mZWF0dXJlc1tmZWF0dXJlXS5wcm9wZXJ0aWVzW3JlZ2lvbmlkXTtcbiAgICAgICAgICBpbmRleF9bbmFtZV0gPSBmZWF0dXJlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIGF4aXMuc2NhbGUgPSBmdW5jdGlvbih2KSB7XG4gICAgaWYgKHR5cGVvZiB2ID09ICdvYmplY3QnKSB7IFxuICAgICAgcmV0dXJuIGF4aXMuc2NhbGUodlt2YXJpYWJsZV9dKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXhpcy51cGRhdGVfcHJvamVjdGlvbigpO1xuICAgICAgcmV0dXJuIHBhdGhfKG1hcF8uZmVhdHVyZXNbaW5kZXhfW3ZdXSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhlIHByb2plY3Rpb24uIENhbGN1bGF0aW5nIHRoZSBzY2FsZSBhbmQgdHJhbnNsYXRpb24gb2YgdGhlIHByb2plY3Rpb24gXG4gIC8vIHRha2VzIHRpbWUuIFRoZXJlZm9yZSwgd2Ugb25seSB3YW50IHRvIGRvIHRoYXQgd2hlbiBuZWNlc3NhcnkuIFxuICAvLyB1cGRhdGVfcHJvamVjdGlvbl8ga2VlcHMgdHJhY2sgb2Ygd2hldGhlciBvciBub3QgdGhlIHByb2plY3Rpb24gbmVlZHMgXG4gIC8vIHJlY2FsY3VsYXRpb25cbiAgdmFyIHVwZGF0ZV9wcm9qZWN0aW9uXyA9IHRydWU7XG4gIC8vIHRoZSBwcm9qZWN0aW9uXG4gIHZhciBwcm9qZWN0aW9uXyA9IGQzLmdlby50cmFuc3ZlcnNlTWVyY2F0b3IoKVxuICAgIC5yb3RhdGUoWy01LjM4NzIwNjIxLCAtNTIuMTU1MTc0NDBdKS5zY2FsZSgxKS50cmFuc2xhdGUoWzAsMF0pO1xuICB2YXIgcGF0aF8gPSBkMy5nZW8ucGF0aCgpLnByb2plY3Rpb24ocHJvamVjdGlvbl8pO1xuICAvLyBmdW5jdGlvbiB0aGF0IHJlY2FsY3VsYXRlcyB0aGUgc2NhbGUgYW5kIHRyYW5zbGF0aW9uIG9mIHRoZSBwcm9qZWN0aW9uXG4gIGF4aXMudXBkYXRlX3Byb2plY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodXBkYXRlX3Byb2plY3Rpb25fICYmIG1hcF8pIHtcbiAgICAgIHByb2plY3Rpb25fLnNjYWxlKDEpLnRyYW5zbGF0ZShbMCwwXSk7XG4gICAgICBwYXRoXyA9IGQzLmdlby5wYXRoKCkucHJvamVjdGlvbihwcm9qZWN0aW9uXyk7XG4gICAgICB2YXIgYm91bmRzID0gcGF0aF8uYm91bmRzKG1hcF8pO1xuICAgICAgdmFyIHNjYWxlICA9IC45NSAvIE1hdGgubWF4KChib3VuZHNbMV1bMF0gLSBib3VuZHNbMF1bMF0pIC8gd2lkdGhfLCBcbiAgICAgICAgICAgICAgICAgIChib3VuZHNbMV1bMV0gLSBib3VuZHNbMF1bMV0pIC8gaGVpZ2h0Xyk7XG4gICAgICB2YXIgdHJhbnNsID0gWyh3aWR0aF8gLSBzY2FsZSAqIChib3VuZHNbMV1bMF0gKyBib3VuZHNbMF1bMF0pKSAvIDIsIFxuICAgICAgICAgICAgICAgICAgKGhlaWdodF8gLSBzY2FsZSAqIChib3VuZHNbMV1bMV0gKyBib3VuZHNbMF1bMV0pKSAvIDJdO1xuICAgICAgcHJvamVjdGlvbl8uc2NhbGUoc2NhbGUpLnRyYW5zbGF0ZSh0cmFuc2wpO1xuICAgICAgdXBkYXRlX3Byb2plY3Rpb25fID0gZmFsc2U7XG4gICAgfVxuICB9XG5cblxuICByZXR1cm4gYXhpcztcbn1cblxuXG5cblxuXG5cbi8vIEEgZnVuY3Rpb24gZXhwZWN0aW5nIHR3byBmdW5jdGlvbnMuIFRoZSBzZWNvbmQgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gdGhlIFxuLy8gZmlyc3QgZnVuY3Rpb24gcmV0dXJucyB0cnVlLiBXaGVuIHRoZSBmaXJzdCBmdW5jdGlvbiBkb2VzIG5vdCByZXR1cm4gdHJ1ZVxuLy8gd2Ugd2FpdCBmb3IgMTAwbXMgYW5kIHRyeSBhZ2Fpbi4gXG52YXIgd2FpdF9mb3IgPSBmdW5jdGlvbihtLCBmKSB7XG4gIGlmIChtKCkpIHtcbiAgICBmKCk7XG4gIH0gZWxzZSB7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHsgd2FpdF9mb3IobSwgZik7fSwgMTAwKTtcbiAgfVxufTtcblxuIiwiXG5mdW5jdGlvbiBncnBoX2F4aXNfc3BsaXQoKSB7XG5cbiAgdmFyIHZhcmlhYmxlXztcbiAgdmFyIHdpZHRoXywgaGVpZ2h0XztcbiAgdmFyIGRvbWFpbl87XG4gIHZhciBzZXR0aW5nc18gPSB7XG4gIH07XG5cbiAgZnVuY3Rpb24gYXhpcyhnKSB7XG4gIH1cblxuICBheGlzLndpZHRoID0gZnVuY3Rpb24od2lkdGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gd2lkdGhfO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aWR0aF8gPSB3aWR0aDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIGF4aXMuaGVpZ2h0ID0gZnVuY3Rpb24oaGVpZ2h0KSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIGhlaWdodF87XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlaWdodF8gPSBoZWlnaHQ7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBheGlzLmFjY2VwdCA9IGZ1bmN0aW9uKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgICB2YXIgdnNjaGVtYSA9IHZhcmlhYmxlX3NjaGVtYSh2YXJpYWJsZSwgc2NoZW1hKTtcbiAgICByZXR1cm4gdnNjaGVtYS50eXBlID09ICdjYXRlZ29yaWNhbCc7XG4gIH1cblxuICBheGlzLnZhcmlhYmxlID0gZnVuY3Rpb24odikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiB2YXJpYWJsZV87XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhcmlhYmxlXyA9IHY7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cbiBcbiAgYXhpcy5kb21haW4gPSBmdW5jdGlvbihkYXRhLCBzY2hlbWEpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gZG9tYWluXztcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHZhcmlhYmxlXyA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdGhpcztcbiAgICAgIHZhciB2c2NoZW1hID0gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlXywgc2NoZW1hKTtcbiAgICAgIGRvbWFpbl8gPSB2c2NoZW1hLmNhdGVnb3JpZXMubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGQubmFtZTsgfSk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBheGlzLnRpY2tzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGRvbWFpbl87XG4gIH1cblxuICBheGlzLnNjYWxlID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiBkb21haW5fLmluZGV4T2Yodik7XG4gIH1cblxuICByZXR1cm4gYXhpcztcbn1cbiIsIlxuZnVuY3Rpb24gdmFyaWFibGVfc2NoZW1hKHZhcmlhYmxlLCBzY2hlbWEpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY2hlbWEuZmllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNjaGVtYS5maWVsZHNbaV0ubmFtZSA9PSB2YXJpYWJsZSkgXG4gICAgICByZXR1cm4gc2NoZW1hLmZpZWxkc1tpXTtcbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuICBcbiIsIlxuZnVuY3Rpb24gZ3JwaF9ncmFwaChheGVzLCBkaXNwYXRjaCwgZ3JhcGgpIHtcblxuICB2YXIgd2lkdGgsIGhlaWdodDtcbiAgdmFyIGRhdGEsIHNjaGVtYTtcblxuICBncmFwaC5heGVzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGQzLmtleXMoYXhlcyk7XG4gIH1cblxuICBncmFwaC53aWR0aCA9IGZ1bmN0aW9uKHcpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gd2lkdGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZHRoID0gdztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIGdyYXBoLmhlaWdodCA9IGZ1bmN0aW9uKGgpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gaGVpZ2h0O1xuICAgIH0gZWxzZSB7XG4gICAgICBoZWlnaHQgPSBoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgZ3JhcGguYWNjZXB0ID0gZnVuY3Rpb24odmFyaWFibGVzLCBheGlzKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICBpZiAoYXhlc1theGlzXSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gYXhlc1theGlzXS5hY2NlcHQodmFyaWFibGVzLCBzY2hlbWEpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGkgaW4gYXhlcykge1xuICAgICAgICBpZiAodmFyaWFibGVzW2ldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBpZiAoYXhlc1tpXS5yZXF1aXJlZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBhY2NlcHQgPSBheGVzW2ldLmFjY2VwdCh2YXJpYWJsZXNbaV0sIHNjaGVtYSk7XG4gICAgICAgICAgaWYgKCFhY2NlcHQpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgZ3JhcGguYXNzaWduID0gZnVuY3Rpb24odmFyaWFibGVzKSB7XG4gICAgZm9yIChpIGluIGF4ZXMpIGF4ZXNbaV0udmFyaWFibGUodmFyaWFibGVzW2ldKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdyYXBoLnNjaGVtYSA9IGZ1bmN0aW9uKHMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gc2NoZW1hO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY2hlbWEgPSBzO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgZ3JhcGguZGF0YSA9IGZ1bmN0aW9uKGQsIHMpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGF0YSA9IGQ7XG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIFxuICAgICAgICBncmFwaC5zY2hlbWEocyk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBncmFwaC5kaXNwYXRjaCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkaXNwYXRjaDtcbiAgfVxuXG4gIHJldHVybiBncmFwaDtcbn1cblxuIiwiXG5mdW5jdGlvbiBncnBoX2dyYXBoX2xpbmUoKSB7XG5cbiAgdmFyIGF4ZXMgPSB7XG4gICAgJ3gnIDogZ3JwaF9heGlzX2xpbmVhcih0cnVlKSxcbiAgICAneScgOiBncnBoX2F4aXNfbGluZWFyKGZhbHNlKSxcbiAgICAnY29sb3VyJyA6IGdycGhfYXhpc19jb2xvdXIoKSxcbiAgICAnY29sdW1uJyA6IGdycGhfYXhpc19zcGxpdCgpLFxuICAgICdyb3cnIDogZ3JwaF9heGlzX3NwbGl0KClcbiAgfTtcbiAgYXhlcy54LnJlcXVpcmVkID0gdHJ1ZTtcbiAgYXhlcy55LnJlcXVpcmVkID0gdHJ1ZTtcbiAgdmFyIHNldHRpbmdzID0ge1xuICAgICdwYWRkaW5nJyA6IFsyLCAyLCAyLCAyXSxcbiAgICAnbGFiZWxfcGFkZGluZycgOiA0LFxuICAgICdzZXAnIDogOCxcbiAgICAncG9pbnRfc2l6ZScgOiA0XG4gIH07XG4gIHZhciBkaXNwYXRjaCA9IGQzLmRpc3BhdGNoKFwibW91c2VvdmVyXCIsIFwibW91c2VvdXRcIiwgXCJwb2ludG92ZXJcIiwgXCJwb2ludG91dFwiKTtcblxuICB2YXIgZHVtbXlfID0gZDMuc2VsZWN0KFwiYm9keVwiKS5hcHBlbmQoXCJzdmdcIilcbiAgICAuYXR0cihcImNsYXNzXCIsIFwibGluZWFyZ3JhcGggZHVtbXlcIilcbiAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaW52aXNpYmxlXCIpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSBncnBoX2xhYmVsX3NpemUoZHVtbXlfKTtcblxuICB2YXIgZ3JhcGggPSBncnBoX2dyYXBoKGF4ZXMsIGRpc3BhdGNoLCBmdW5jdGlvbihnKSB7XG4gICAgZnVuY3Rpb24gbmVzdF9jb2xvdXIoZCkge1xuICAgICAgcmV0dXJuIGF4ZXMuY29sb3VyLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sb3VyLnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmVzdF9jb2x1bW4oZCkge1xuICAgICAgcmV0dXJuIGF4ZXMuY29sdW1uLnZhcmlhYmxlKCkgPyBkW2F4ZXMuY29sdW1uLnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgZnVuY3Rpb24gbmVzdF9yb3coZCkge1xuICAgICAgcmV0dXJuIGF4ZXMucm93LnZhcmlhYmxlKCkgPyBkW2F4ZXMucm93LnZhcmlhYmxlKCldIDogMTtcbiAgICB9XG4gICAgLy8gc2V0dXAgYXhlc1xuICAgIGF4ZXMuY29sb3VyLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICBheGVzLmNvbHVtbi5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgYXhlcy5yb3cuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIC8vIGRldGVybWluZSBudW1iZXIgb2Ygcm93cyBhbmQgY29sdW1uc1xuICAgIHZhciBuY29sID0gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGF4ZXMuY29sdW1uLnRpY2tzKCkubGVuZ3RoIDogMTtcbiAgICB2YXIgbnJvdyA9IGF4ZXMucm93LnZhcmlhYmxlKCkgPyBheGVzLnJvdy50aWNrcygpLmxlbmd0aCA6IDE7XG4gICAgLy8gZ2V0IGxhYmVscyBhbmQgZGV0ZXJtaW5lIHRoZWlyIGhlaWdodFxuICAgIHZhciB2c2NoZW1heCA9IHZhcmlhYmxlX3NjaGVtYShheGVzLngudmFyaWFibGUoKSwgc2NoZW1hKTtcbiAgICB2YXIgeGxhYmVsID0gdnNjaGVtYXgudGl0bGU7XG4gICAgdmFyIGxhYmVsX2hlaWdodCA9IGxhYmVsX3NpemVfLmhlaWdodCh4bGFiZWwpICsgc2V0dGluZ3MubGFiZWxfcGFkZGluZztcbiAgICB2YXIgdnNjaGVtYXkgPSB2YXJpYWJsZV9zY2hlbWEoYXhlcy55LnZhcmlhYmxlKCksIHNjaGVtYSk7XG4gICAgdmFyIHlsYWJlbCA9IHZzY2hlbWF5LnRpdGxlO1xuICAgIC8vIHNldCB0aGUgd2lkdGgsIGhlaWdodCBlbmQgZG9tYWluIG9mIHRoZSB4LSBhbmQgeS1heGVzLiBXZSBuZWVkIHNvbWUgXG4gICAgLy8gaXRlcmF0aW9ucyBmb3IgdGhpcywgYXMgdGhlIGhlaWdodCBvZiB0aGUgeS1heGlzIGRlcGVuZHMgb2YgdGhlIGhlaWdodFxuICAgIC8vIG9mIHRoZSB4LWF4aXMsIHdoaWNoIGRlcGVuZHMgb24gdGhlIGxhYmVscyBvZiB0aGUgeC1heGlzLCB3aGljaCBkZXBlbmRzXG4gICAgLy8gb24gdGhlIHdpZHRoIG9mIHRoZSB4LWF4aXMsIGV0Yy4gXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyArK2kpIHtcbiAgICAgIHZhciB3ID0gZ3JhcGgud2lkdGgoKSAtIHNldHRpbmdzLnBhZGRpbmdbMV0gLSBzZXR0aW5ncy5wYWRkaW5nWzNdIC0gXG4gICAgICAgIGF4ZXMueS53aWR0aCgpIC0gbGFiZWxfaGVpZ2h0O1xuICAgICAgdyA9ICh3IC0gKG5jb2wtMSkqc2V0dGluZ3Muc2VwKSAvIG5jb2w7XG4gICAgICBheGVzLngud2lkdGgodykuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgICAgdmFyIGggPSBncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzLnBhZGRpbmdbMF0gLSBzZXR0aW5ncy5wYWRkaW5nWzJdIC0gXG4gICAgICAgIGF4ZXMueC5oZWlnaHQoKSAtIGxhYmVsX2hlaWdodDtcbiAgICAgIGggPSAoaCAtIChucm93LTEpKnNldHRpbmdzLnNlcCkgLyBucm93O1xuICAgICAgYXhlcy55LmhlaWdodChoKS5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgfVxuICAgIHZhciBsID0gYXhlcy55LndpZHRoKCkgKyBzZXR0aW5ncy5wYWRkaW5nWzFdICsgbGFiZWxfaGVpZ2h0O1xuICAgIHZhciB0ICA9IHNldHRpbmdzLnBhZGRpbmdbMl07XG4gICAgLy8gZHJhdyBsYWJlbHNcbiAgICB2YXIgeWNlbnRlciA9IHQgKyAwLjUqKGdyYXBoLmhlaWdodCgpIC0gc2V0dGluZ3MucGFkZGluZ1swXSAtIHNldHRpbmdzLnBhZGRpbmdbMl0gLSBcbiAgICAgICAgYXhlcy54LmhlaWdodCgpIC0gbGFiZWxfaGVpZ2h0KTtcbiAgICB2YXIgeGNlbnRlciA9IGwgKyAwLjUqKGdyYXBoLndpZHRoKCkgLSBzZXR0aW5ncy5wYWRkaW5nWzFdIC0gc2V0dGluZ3MucGFkZGluZ1szXSAtIFxuICAgICAgICBheGVzLnkud2lkdGgoKSAtIGxhYmVsX2hlaWdodCk7XG4gICAgZy5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAuYXR0cihcInhcIiwgc2V0dGluZ3MucGFkZGluZ1sxXSkuYXR0cihcInlcIiwgeWNlbnRlcilcbiAgICAgIC5hdHRyKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIikudGV4dCh5bGFiZWwpXG4gICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSg5MCBcIiArIHNldHRpbmdzLnBhZGRpbmdbMV0gKyBcIiBcIiArIHljZW50ZXIgKyBcIilcIik7XG4gICAgZy5hcHBlbmQoXCJ0ZXh0XCIpLmF0dHIoXCJ4XCIsIHhjZW50ZXIpLmF0dHIoXCJ5XCIsIGdyYXBoLmhlaWdodCgpLXNldHRpbmdzLnBhZGRpbmdbMF0pXG4gICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpLnRleHQoeGxhYmVsKTtcblxuXG5cbiAgICB2YXIgZCA9IGQzLm5lc3QoKS5rZXkobmVzdF9jb2x1bW4pLmtleShuZXN0X3Jvdykua2V5KG5lc3RfY29sb3VyKS5lbnRyaWVzKGdyYXBoLmRhdGEoKSk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBkaiA9IGRbaV0udmFsdWVzO1xuICAgICAgdmFyIHQgID0gc2V0dGluZ3MucGFkZGluZ1syXTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgLy8gZHJhdyB4LWF4aXNcbiAgICAgICAgaWYgKGogPT0gKGRqLmxlbmd0aC0xKSkge1xuICAgICAgICAgIGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpc1wiKVxuICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyAodCArIGgpICsgXCIpXCIpLmNhbGwoYXhlcy54KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBkcmF3IHktYXhpc1xuICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInhheGlzXCIpXG4gICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIChsIC0gYXhlcy55LndpZHRoKCkpICsgXCIsXCIgKyB0ICsgXCIpXCIpXG4gICAgICAgICAgICAuY2FsbChheGVzLnkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGRyYXcgYm94IGZvciBncmFwaFxuICAgICAgICB2YXIgZ3IgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwiZ3JhcGhcIilcbiAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInRyYW5zbGF0ZShcIiArIGwgKyBcIixcIiArIHQgKyBcIilcIik7XG4gICAgICAgIGdyLmFwcGVuZChcInJlY3RcIikuYXR0cihcImNsYXNzXCIsIFwiYmFja2dyb3VuZFwiKVxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgdykuYXR0cihcImhlaWdodFwiLCBoKTtcbiAgICAgICAgLy8gZHJhdyBncmlkXG4gICAgICAgIHZhciB4dGlja3MgPSBheGVzLngudGlja3MoKTtcbiAgICAgICAgZ3Iuc2VsZWN0QWxsKFwibGluZS5ncmlkeFwiKS5kYXRhKHh0aWNrcykuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImdyaWQgZ3JpZHhcIilcbiAgICAgICAgICAuYXR0cihcIngxXCIsIGF4ZXMueC5zY2FsZSkuYXR0cihcIngyXCIsIGF4ZXMueC5zY2FsZSlcbiAgICAgICAgICAuYXR0cihcInkxXCIsIDApLmF0dHIoXCJ5MlwiLCBoKTtcbiAgICAgICAgdmFyIHl0aWNrcyA9IGF4ZXMueS50aWNrcygpO1xuICAgICAgICBnci5zZWxlY3RBbGwoXCJsaW5lLmdyaWR5XCIpLmRhdGEoeXRpY2tzKS5lbnRlcigpLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiZ3JpZCBncmlkeVwiKVxuICAgICAgICAgIC5hdHRyKFwieDFcIiwgMCkuYXR0cihcIngyXCIsIHcpXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCBheGVzLnkuc2NhbGUpLmF0dHIoXCJ5MlwiLCBheGVzLnkuc2NhbGUpO1xuICAgICAgICAvLyBhZGQgY3Jvc3NoYWlycyB0byBncmFwaFxuICAgICAgICB2YXIgZ2Nyb3NzaCA9IGdyLmFwcGVuZChcImdcIikuY2xhc3NlZChcImNyb3NzaGFpcnNcIiwgdHJ1ZSk7XG4gICAgICAgIGdjcm9zc2guYXBwZW5kKFwibGluZVwiKS5jbGFzc2VkKFwiaGxpbmVcIiwgdHJ1ZSkuYXR0cihcIngxXCIsIDApXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieDJcIiwgYXhlcy54LndpZHRoKCkpLmF0dHIoXCJ5MlwiLCAwKVxuICAgICAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgIGdjcm9zc2guYXBwZW5kKFwibGluZVwiKS5jbGFzc2VkKFwidmxpbmVcIiwgdHJ1ZSkuYXR0cihcIngxXCIsIDApXG4gICAgICAgICAgLmF0dHIoXCJ5MVwiLCAwKS5hdHRyKFwieDJcIiwgMCkuYXR0cihcInkyXCIsIGF4ZXMueS5oZWlnaHQoKSlcbiAgICAgICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAvLyBkcmF3IGxpbmVzIFxuICAgICAgICB2YXIgbGluZSA9IGQzLnN2Zy5saW5lKCkueChheGVzLnguc2NhbGUpLnkoYXhlcy55LnNjYWxlKSBcbiAgICAgICAgdmFyIGRrID0gZGpbal0udmFsdWVzO1xuICAgICAgICBmb3IgKHZhciBrID0gMDsgayA8IGRrLmxlbmd0aDsgKytrKSB7XG4gICAgICAgICAgZ3IuYXBwZW5kKFwicGF0aFwiKS5hdHRyKFwiZFwiLCBsaW5lKGRrW2tdLnZhbHVlcykpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIGF4ZXMuY29sb3VyLnNjYWxlKGRrW2tdLmtleSkpXG4gICAgICAgICAgICAuZGF0dW0oZGtba10pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGRyYXcgcG9pbnRzIFxuICAgICAgICB2YXIgZGsgPSBkaltqXS52YWx1ZXM7XG4gICAgICAgIGZvciAodmFyIGsgPSAwOyBrIDwgZGsubGVuZ3RoOyArK2spIHtcbiAgICAgICAgICB2YXIgY2xzID0gXCJjaXJjbGVcIiArIGs7XG4gICAgICAgICAgZ3Iuc2VsZWN0QWxsKFwiY2lyY2xlLmNpcmNsZVwiICsgaykuZGF0YShka1trXS52YWx1ZXMpLmVudGVyKCkuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY2lyY2xlXCIgKyBrICsgXCIgXCIgKyBheGVzLmNvbG91ci5zY2FsZShka1trXS5rZXkpKVxuICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCBheGVzLnguc2NhbGUpLmF0dHIoXCJjeVwiLCBheGVzLnkuc2NhbGUpXG4gICAgICAgICAgICAuYXR0cihcInJcIiwgc2V0dGluZ3MucG9pbnRfc2l6ZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBuZXh0IGxpbmVcbiAgICAgICAgdCArPSBheGVzLnkuaGVpZ2h0KCkgKyBzZXR0aW5ncy5zZXA7XG4gICAgICB9XG4gICAgICBsICs9IGF4ZXMueC53aWR0aCgpICsgc2V0dGluZ3Muc2VwO1xuICAgIH1cblxuXG4gICAgLy8gYWRkIGhvdmVyIGV2ZW50cyB0byB0aGUgbGluZXMgYW5kIHBvaW50c1xuICAgIGcuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5vbihcIm1vdXNlb3ZlclwiLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICB2YXIgdmFyaWFibGUgPSBheGVzLmNvbG91ci52YXJpYWJsZSgpO1xuICAgICAgdmFyIHZhbHVlID0gdmFyaWFibGUgPyAoZC5rZXkgfHwgZFt2YXJpYWJsZV0pIDogdW5kZWZpbmVkO1xuICAgICAgZGlzcGF0Y2gubW91c2VvdmVyLmNhbGwoZywgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICAgIGlmICghZC5rZXkpIGRpc3BhdGNoLnBvaW50b3Zlci5jYWxsKGcsIHZhcmlhYmxlLCB2YWx1ZSwgZCk7XG4gICAgfSk7XG4gICAgZy5zZWxlY3RBbGwoXCIuY29sb3VyXCIpLm9uKFwibW91c2VvdXRcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHZhcmlhYmxlID0gYXhlcy5jb2xvdXIudmFyaWFibGUoKTtcbiAgICAgIHZhciB2YWx1ZSA9IHZhcmlhYmxlID8gKGQua2V5IHx8IGRbdmFyaWFibGVdKSA6IHVuZGVmaW5lZDtcbiAgICAgIGRpc3BhdGNoLm1vdXNlb3V0LmNhbGwoZywgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICAgIGlmICghZC5rZXkpIGRpc3BhdGNoLnBvaW50b3V0LmNhbGwoZywgdmFyaWFibGUsIHZhbHVlLCBkKTtcbiAgICB9KTtcblxuICB9KTtcblxuXG4gIC8vIExvY2FsIGV2ZW50IGhhbmRsZXJzXG4gIC8vIEhpZ2hsaWdodGluZyBvZiBzZWxlY3RlZCBsaW5lXG4gIGRpc3BhdGNoLm9uKFwibW91c2VvdmVyXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgIGlmICh2YXJpYWJsZSkge1xuICAgICAgdmFyIGNsYXNzZXMgPSBheGVzLmNvbG91ci5zY2FsZShcIlwiICsgdmFsdWUpO1xuICAgICAgdmFyIHJlZ2V4cCA9IC9cXGJjb2xvdXIoWzAtOV0rKVxcYi87XG4gICAgICB2YXIgY29sb3VyID0gcmVnZXhwLmV4ZWMoY2xhc3NlcylbMF07XG4gICAgICB0aGlzLnNlbGVjdEFsbChcIi5jb2xvdXJcIikuY2xhc3NlZChcImNvbG91cmxvd1wiLCB0cnVlKTtcbiAgICAgIHRoaXMuc2VsZWN0QWxsKFwiLlwiICsgY29sb3VyKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogdHJ1ZSwgXCJjb2xvdXJsb3dcIjogZmFsc2V9KTtcbiAgICB9XG4gIH0pO1xuICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLmNvbG91clwiKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogZmFsc2UsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XG4gIH0pO1xuICAvLyBTaG93IGNyb3NzaGFpcnMgd2hlbiBob3ZlcmluZyBvdmVyIGEgcG9pbnRcbiAgZGlzcGF0Y2gub24oXCJwb2ludG92ZXJcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuYXR0cihcInkxXCIsIGF4ZXMueS5zY2FsZShkKSkuYXR0cihcInkyXCIsIGF4ZXMueS5zY2FsZShkKSlcbiAgICAgIC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLmF0dHIoXCJ4MVwiLCBheGVzLnguc2NhbGUoZCkpLmF0dHIoXCJ4MlwiLCBheGVzLnguc2NhbGUoZCkpXG4gICAgICAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKTtcbiAgfSk7XG4gIGRpc3BhdGNoLm9uKFwicG9pbnRvdXRcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCIuaGxpbmVcIikuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xuICAgIHRoaXMuc2VsZWN0QWxsKFwiLnZsaW5lXCIpLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcbiAgfSk7XG5cbiAgcmV0dXJuIGdyYXBoO1xufVxuXG4iLCJcbmZ1bmN0aW9uIGdycGhfZ3JhcGhfbWFwKCkge1xuXG4gIHZhciBheGVzID0ge1xuICAgICdyZWdpb24nIDogZ3JwaF9heGlzX3JlZ2lvbigpLFxuICAgICdjb2xvdXInIDogZ3JwaF9heGlzX2NobG9yb3BsZXRoKCksXG4gICAgJ2NvbHVtbicgOiBncnBoX2F4aXNfc3BsaXQoKSxcbiAgICAncm93JyA6IGdycGhfYXhpc19zcGxpdCgpXG4gIH07XG4gIGF4ZXMucmVnaW9uLnJlcXVpcmVkID0gdHJ1ZTtcbiAgYXhlcy5jb2xvdXIucmVxdWlyZWQgPSB0cnVlO1xuICB2YXIgc2V0dGluZ3MgPSB7XG4gICAgJ3BhZGRpbmcnIDogWzIsIDIsIDIsIDJdLFxuICAgICdsYWJlbF9wYWRkaW5nJyA6IDQsXG4gICAgJ3NlcCcgOiA4LFxuICB9O1xuICB2YXIgZGlzcGF0Y2ggPSBkMy5kaXNwYXRjaChcIm1vdXNlb3ZlclwiLCBcIm1vdXNlb3V0XCIpO1xuXG4gIHZhciBncmFwaCA9IGdycGhfZ3JhcGgoYXhlcywgZGlzcGF0Y2gsIGZ1bmN0aW9uKGcpIHtcbiAgICBmdW5jdGlvbiBuZXN0X2NvbHVtbihkKSB7XG4gICAgICByZXR1cm4gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGRbYXhlcy5jb2x1bW4udmFyaWFibGUoKV0gOiAxO1xuICAgIH1cbiAgICBmdW5jdGlvbiBuZXN0X3JvdyhkKSB7XG4gICAgICByZXR1cm4gYXhlcy5yb3cudmFyaWFibGUoKSA/IGRbYXhlcy5yb3cudmFyaWFibGUoKV0gOiAxO1xuICAgIH1cbiAgICAvLyBzZXR1cCBheGVzXG4gICAgYXhlcy5yZWdpb24uZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIGF4ZXMuY29sb3VyLmRvbWFpbihncmFwaC5kYXRhKCksIGdyYXBoLnNjaGVtYSgpKTtcbiAgICBheGVzLmNvbHVtbi5kb21haW4oZ3JhcGguZGF0YSgpLCBncmFwaC5zY2hlbWEoKSk7XG4gICAgYXhlcy5yb3cuZG9tYWluKGdyYXBoLmRhdGEoKSwgZ3JhcGguc2NoZW1hKCkpO1xuICAgIC8vIGRldGVybWluZSBudW1iZXIgb2Ygcm93cyBhbmQgY29sdW1uc1xuICAgIHZhciBuY29sID0gYXhlcy5jb2x1bW4udmFyaWFibGUoKSA/IGF4ZXMuY29sdW1uLnRpY2tzKCkubGVuZ3RoIDogMTtcbiAgICB2YXIgbnJvdyA9IGF4ZXMucm93LnZhcmlhYmxlKCkgPyBheGVzLnJvdy50aWNrcygpLmxlbmd0aCA6IDE7XG4gICAgLy8gc2V0IHRoZSB3aWR0aCwgaGVpZ2h0IGVuZCBkb21haW4gb2YgdGhlIHgtIGFuZCB5LWF4ZXNcbiAgICB2YXIgdyA9IChncmFwaC53aWR0aCgpIC0gc2V0dGluZ3MucGFkZGluZ1sxXSAtIHNldHRpbmdzLnBhZGRpbmdbM10gLSBcbiAgICAgIChuY29sLTEpKnNldHRpbmdzLnNlcCkvbmNvbDtcbiAgICB2YXIgaCA9IChncmFwaC5oZWlnaHQoKSAtIHNldHRpbmdzLnBhZGRpbmdbMF0gLSBzZXR0aW5ncy5wYWRkaW5nWzJdIC0gXG4gICAgICAobnJvdy0xKSpzZXR0aW5ncy5zZXApL25yb3c7XG4gICAgdmFyIGwgPSBzZXR0aW5ncy5wYWRkaW5nWzFdO1xuICAgIHZhciB0ICA9IHNldHRpbmdzLnBhZGRpbmdbMl07XG4gICAgYXhlcy5yZWdpb24ud2lkdGgodykuaGVpZ2h0KGgpO1xuICAgIC8vIGRyYXcgZ3JhcGhzXG4gICAgd2FpdF9mb3IoYXhlcy5yZWdpb24ubWFwX2xvYWRlZCwgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQgPSBkMy5uZXN0KCkua2V5KG5lc3RfY29sdW1uKS5rZXkobmVzdF9yb3cpLmVudHJpZXMoZ3JhcGguZGF0YSgpKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGQubGVuZ3RoOyArK2kpIHtcbiAgICAgIHZhciBkaiA9IGRbaV0udmFsdWVzO1xuICAgICAgdmFyIHQgID0gc2V0dGluZ3MucGFkZGluZ1syXTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgZGoubGVuZ3RoOyArK2opIHtcbiAgICAgICAgLy8gZHJhdyBib3ggZm9yIGdyYXBoXG4gICAgICAgIHZhciBnciA9IHN2Zy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcImdyYXBoXCIpXG4gICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsICsgXCIsXCIgKyB0ICsgXCIpXCIpO1xuICAgICAgICBnci5hcHBlbmQoXCJyZWN0XCIpLmF0dHIoXCJjbGFzc1wiLCBcImJhY2tncm91bmRcIilcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHcpLmF0dHIoXCJoZWlnaHRcIiwgaCk7XG4gICAgICAgIC8vIGRyYXcgbWFwXG4gICAgICAgIGdyLnNlbGVjdEFsbChcInBhdGhcIikuZGF0YShkaltqXS52YWx1ZXMpLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAgIC5hdHRyKFwiZFwiLCBheGVzLnJlZ2lvbi5zY2FsZSkuYXR0cihcImNsYXNzXCIsIGF4ZXMuY29sb3VyLnNjYWxlKTtcbiAgICAgICAgLy8gbmV4dCBsaW5lXG4gICAgICAgIHQgKz0gaCArIHNldHRpbmdzLnNlcDtcbiAgICAgIH1cbiAgICAgIGwgKz0gdyArIHNldHRpbmdzLnNlcDtcbiAgICB9XG4gICAgLy8gYWRkIGV2ZW50cyB0byB0aGUgbGluZXNcbiAgICBnLnNlbGVjdEFsbChcInBhdGhcIikub24oXCJtb3VzZW92ZXJcIiwgZnVuY3Rpb24oZCwgaSkge1xuICAgICAgdmFyIHJlZ2lvbiA9IGRbYXhlcy5yZWdpb24udmFyaWFibGUoKV07XG4gICAgICBkaXNwYXRjaC5tb3VzZW92ZXIuY2FsbChnLCBheGVzLnJlZ2lvbi52YXJpYWJsZSgpLCByZWdpb24sIGQpO1xuICAgIH0pO1xuICAgIGcuc2VsZWN0QWxsKFwicGF0aFwiKS5vbihcIm1vdXNlb3V0XCIsIGZ1bmN0aW9uKGQsIGkpIHtcbiAgICAgIHZhciByZWdpb24gPSBkW2F4ZXMucmVnaW9uLnZhcmlhYmxlKCldO1xuICAgICAgZGlzcGF0Y2gubW91c2VvdXQuY2FsbChnLCBheGVzLnJlZ2lvbi52YXJpYWJsZSgpLCByZWdpb24sIGQpO1xuICAgIH0pO1xuXG4gICAgfSk7XG4gIH0pO1xuXG5cbiAgLy8gTG9jYWwgZXZlbnQgaGFuZGxlcnNcbiAgZGlzcGF0Y2gub24oXCJtb3VzZW92ZXIuZ3JhcGhcIiwgZnVuY3Rpb24odmFyaWFibGUsIHZhbHVlLCBkKSB7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmNsYXNzZWQoXCJjb2xvdXJsb3dcIiwgdHJ1ZSk7XG4gICAgdGhpcy5zZWxlY3RBbGwoXCJwYXRoXCIpLmZpbHRlcihmdW5jdGlvbihkLCBpKSB7XG4gICAgICByZXR1cm4gZFt2YXJpYWJsZV0gPT0gdmFsdWU7XG4gICAgfSkuY2xhc3NlZCh7XCJjb2xvdXJoaWdoXCI6IHRydWUsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XG4gIH0pO1xuICBkaXNwYXRjaC5vbihcIm1vdXNlb3V0LmdyYXBoXCIsIGZ1bmN0aW9uKHZhcmlhYmxlLCB2YWx1ZSwgZCkge1xuICAgIHRoaXMuc2VsZWN0QWxsKFwicGF0aFwiKS5jbGFzc2VkKHtcImNvbG91cmhpZ2hcIjogZmFsc2UsIFwiY29sb3VybG93XCI6IGZhbHNlfSk7XG4gIH0pO1xuXG5cblxuXG4gIHJldHVybiBncmFwaDtcbn1cblxuIiwiXG5ncnBoX2xhYmVsX3NpemUgPSBmdW5jdGlvbihnKSB7XG5cbiAgLy8gYSBzdmcgb3IgZyBlbGVtZW50IHRvIHdoaWNoICB3ZSB3aWxsIGJlIGFkZGluZyBvdXIgbGFiZWwgaW4gb3JkZXIgdG9cbiAgLy8gcmVxdWVzdCBpdCdzIHNpemVcbiAgdmFyIGdfID0gZztcbiAgLy8gc3RvcmUgcHJldmlvdXNseSBjYWxjdWxhdGVkIHZhbHVlczsgYXMgdGhlIHNpemUgb2YgY2VydGFpbiBsYWJlbHMgYXJlIFxuICAvLyByZXF1ZXN0ZWQgYWdhaW4gYW5kIGFnYWluIHRoaXMgZ3JlYXRseSBlbmhhbmNlcyBwZXJmb3JtYW5jZVxuICB2YXIgc2l6ZXNfID0ge307XG5cbiAgZnVuY3Rpb24gbGFiZWxfc2l6ZShsYWJlbCkge1xuICAgIGlmIChzaXplc19bbGFiZWxdKSB7XG4gICAgICByZXR1cm4gc2l6ZXNfW2xhYmVsXTtcbiAgICB9XG4gICAgaWYgKCFnXykgcmV0dXJuIFt1bmRlZmluZWQsIHVuZGVmaW5lZF07XG4gICAgdmFyIHRleHQgPSBnXy5hcHBlbmQoXCJ0ZXh0XCIpLnRleHQobGFiZWwpO1xuICAgIHZhciBiYm94ID0gdGV4dFswXVswXS5nZXRCQm94KCk7XG4gICAgdmFyIHNpemUgPSBbYmJveC53aWR0aCoxLjIsIGJib3guaGVpZ2h0KjAuNjVdOyAvLyBUT0RPIHdoeTsgYW5kIGlzIHRoaXMgYWx3YXlzIGNvcnJlY3RcbiAgICAvL3ZhciBzaXplID0gaG9yaXpvbnRhbF8gPyB0ZXh0WzBdWzBdLmdldENvbXB1dGVkVGV4dExlbmd0aCgpIDpcbiAgICAgIC8vdGV4dFswXVswXS5nZXRCQm94KCkuaGVpZ2h0O1xuICAgIHRleHQucmVtb3ZlKCk7XG4gICAgc2l6ZXNfW2xhYmVsXSA9IHNpemU7XG4gICAgcmV0dXJuIHNpemU7XG4gIH1cblxuICBsYWJlbF9zaXplLnN2ZyA9IGZ1bmN0aW9uKGcpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gZ187XG4gICAgfSBlbHNlIHtcbiAgICAgIGdfID0gZztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIGxhYmVsX3NpemUud2lkdGggPSBmdW5jdGlvbihsYWJlbCkge1xuICAgIHZhciBzaXplID0gbGFiZWxfc2l6ZShsYWJlbCk7XG4gICAgcmV0dXJuIHNpemVbMF07XG4gIH1cblxuICBsYWJlbF9zaXplLmhlaWdodCA9IGZ1bmN0aW9uKGxhYmVsKSB7XG4gICAgdmFyIHNpemUgPSBsYWJlbF9zaXplKGxhYmVsKTtcbiAgICByZXR1cm4gc2l6ZVsxXTtcbiAgfVxuXG4gIHJldHVybiBsYWJlbF9zaXplO1xufVxuXG4iLCJcbmZ1bmN0aW9uIGdycGhfc2NhbGVfY2hsb3JvcGxldGgoKSB7XG5cbiAgdmFyIGRvbWFpbjtcbiAgdmFyIGJhc2VjbGFzcyA9IFwiY2hsb3JvXCI7XG4gIHZhciBuY29sb3VycyAgPSA5O1xuXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcbiAgICBpZiAoZG9tYWluID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIGFzc3VtZSB3ZSBoYXZlIG9ubHkgMSBjb2xvdXJcbiAgICAgIHJldHVybiBiYXNlY2xhc3MgKyBcIiBcIiArIGJhc2VjbGFzcyArIFwibjFcIiArIFwiIFwiICsgYmFzZWNsYXNzICsgMTtcbiAgICB9XG4gICAgdmFyIHJhbmdlICA9IGRvbWFpblsxXSAtIGRvbWFpblswXTtcbiAgICB2YXIgdmFsICAgID0gTWF0aC5zcXJ0KCh2IC0gZG9tYWluWzBdKSowLjk5OTkpIC8gTWF0aC5zcXJ0KHJhbmdlKTtcbiAgICB2YXIgY2F0ICAgID0gTWF0aC5mbG9vcih2YWwqbmNvbG91cnMpO1xuICAgIC8vIHJldHVybnMgc29tZXRoaW5nIGxpa2UgXCJjaGxvcm8gY2hsb3JvbjEwIGNobG9ybzRcIlxuICAgIHJldHVybiBiYXNlY2xhc3MgKyBcIiBcIiArIGJhc2VjbGFzcyArIFwiblwiICsgbmNvbG91cnMgKyBcIiBcIiArIGJhc2VjbGFzcyArIChjYXQrMSk7XG4gIH1cblxuICBzY2FsZS5kb21haW4gPSBmdW5jdGlvbihkKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIGRvbWFpbjtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9tYWluID0gZDtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHNjYWxlLnJhbmdlID0gZnVuY3Rpb24ocikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBiYXNlY2xhc3M7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJhc2VjbGFzcyA9IHI7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzdGVwID0gKGRvbWFpblsxXSAtIGRvbWFpblswXSkvbmNvbG91cnM7XG4gICAgdmFyIHQgPSBkb21haW5bMF07XG4gICAgdmFyIHRpY2tzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPD0gbmNvbG91cnM7ICsraSkge1xuICAgICAgdGlja3MucHVzaCh0KTtcbiAgICAgIHQgKz0gc3RlcDtcbiAgICB9XG4gICAgcmV0dXJuIHRpY2tzO1xuICB9XG5cbiAgcmV0dXJuIHNjYWxlO1xufVxuIiwiXG5mdW5jdGlvbiBncnBoX3NjYWxlX2NvbG91cigpIHtcblxuICB2YXIgZG9tYWluO1xuICB2YXIgcmFuZ2UgPSBcImNvbG91clwiO1xuICB2YXIgbmNvbG91cnM7XG5cbiAgZnVuY3Rpb24gc2NhbGUodikge1xuICAgIGlmIChkb21haW4gPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gYXNzdW1lIHdlIGhhdmUgb25seSAxIGNvbG91clxuICAgICAgcmV0dXJuIHJhbmdlICsgXCIgXCIgKyByYW5nZSArIFwibjFcIiArIFwiIFwiICsgcmFuZ2UgKyAxO1xuICAgIH1cbiAgICB2YXIgaSA9IGRvbWFpbi5pbmRleE9mKHYpO1xuICAgIC8vIHJldHVybnMgc29tZXRoaW5nIGxpa2UgXCJjb2xvdXIgY29sb3VybjEwIGNvbG91cjRcIlxuICAgIHJldHVybiByYW5nZSArIFwiIFwiICsgcmFuZ2UgKyBcIm5cIiArIG5jb2xvdXJzICsgXCIgXCIgKyByYW5nZSArIChpKzEpO1xuICB9XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBkb21haW47XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvbWFpbiA9IGQ7XG4gICAgICBuY29sb3VycyA9IGQubGVuZ3RoO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIHJhbmdlO1xuICAgIH0gZWxzZSB7XG4gICAgICByYW5nZSA9IHI7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBkb21haW47XG4gIH1cblxuICByZXR1cm4gc2NhbGU7XG5cbiBcbn1cbiIsIlxuZnVuY3Rpb24gZ3JwaF9zY2FsZV9saW5lYXIoKSB7XG5cbiAgdmFyIGxzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpO1xuICB2YXIgbGFiZWxfc2l6ZV8gPSAyMDtcbiAgdmFyIHBhZGRpbmdfID0gNTtcbiAgdmFyIG50aWNrc18gPSAxMDtcbiAgdmFyIHRpY2tzXztcbiAgdmFyIGluc2lkZV8gPSB0cnVlO1xuXG4gIGZ1bmN0aW9uIHNjYWxlKHYpIHtcbiAgICByZXR1cm4gbHNjYWxlKHYpO1xuICB9XG5cbiAgc2NhbGUuZG9tYWluID0gZnVuY3Rpb24oZCkge1xuICAgIHZhciBkID0gbHNjYWxlLmRvbWFpbihkKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gZDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICB9XG5cbiAgc2NhbGUucmFuZ2UgPSBmdW5jdGlvbihyKSB7XG4gICAgdmFyIHIgPSBsc2NhbGUucmFuZ2Uocik7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIHI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHNjYWxlLmxhYmVsX3NpemUgPSBmdW5jdGlvbihsYWJlbF9zaXplKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT0gMCkge1xuICAgICAgcmV0dXJuIGxhYmVsX3NpemVfO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYWJlbF9zaXplXyA9IGxhYmVsX3NpemU7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBsc2l6ZShsYWJlbCkge1xuICAgIHZhciBzaXplID0gdHlwZW9mKGxhYmVsX3NpemVfKSA9PSBcImZ1bmN0aW9uXCIgPyBsYWJlbF9zaXplXyhsYWJlbCkgOiBsYWJlbF9zaXplXztcbiAgICBzaXplICs9IHBhZGRpbmdfO1xuICAgIHJldHVybiBzaXplO1xuICB9XG5cbiAgc2NhbGUubnRpY2tzID0gZnVuY3Rpb24obikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBudGlja3NfO1xuICAgIH0gZWxzZSB7XG4gICAgICBudGlja3NfID0gbjtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfVxuXG4gIHNjYWxlLmluc2lkZSA9IGZ1bmN0aW9uKGkpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICByZXR1cm4gaW5zaWRlXztcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zaWRlXyA9IGkgPyB0cnVlIDogZmFsc2U7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gIH1cblxuICBzY2FsZS5uaWNlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHIgPSBsc2NhbGUucmFuZ2UoKTtcbiAgICB2YXIgZCA9IGxzY2FsZS5kb21haW4oKTtcbiAgICB2YXIgbCA9IE1hdGguYWJzKHJbMV0gLSByWzBdKTtcbiAgICB2YXIgdyA9IHdpbGtpbnNvbl9paShkWzBdLCBkWzFdLCBudGlja3NfLCBsc2l6ZSwgbCk7XG4gICAgaWYgKGluc2lkZV8pIHtcbiAgICAgIHZhciB3MSA9IGxzaXplKHcubGFiZWxzWzBdKTtcbiAgICAgIHZhciB3MiA9IGxzaXplKHcubGFiZWxzW3cubGFiZWxzLmxlbmd0aC0xXSk7XG4gICAgICB2YXIgcGFkID0gdzEvMiArIHcyLzI7XG4gICAgICB3ID0gd2lsa2luc29uX2lpKGRbMF0sIGRbMV0sIG50aWNrc18sIGxzaXplLCBsLXBhZCk7XG4gICAgICBpZiAoclswXSA8IHJbMV0pIHtcbiAgICAgICAgbHNjYWxlLnJhbmdlKFtyWzBdK3cxLzIsIHJbMV0tdzIvMl0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbHNjYWxlLnJhbmdlKFtyWzBdLXcxLzIsIHJbMV0rdzIvMl0pO1xuICAgICAgfVxuICAgIH1cbiAgICBkb21haW4gPSBbdy5sbWluLCB3LmxtYXhdO1xuICAgIGxzY2FsZS5kb21haW4oW3cubG1pbiwgdy5sbWF4XSk7XG4gICAgdGlja3NfID0gdy5sYWJlbHM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzY2FsZS50aWNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aWNrc18gPT09IHVuZGVmaW5lZCkgcmV0dXJuIGxzY2FsZS50aWNrcyhudGlja3NfKTtcbiAgICByZXR1cm4gdGlja3NfO1xuICB9XG5cbiAgcmV0dXJuIHNjYWxlO1xufVxuXG5cbiIsIlxuLy8gRm9ybWF0IGEgbnVtZXJpYyB2YWx1ZTpcbi8vIC0gTWFrZSBzdXJlIGl0IGlzIHJvdW5kZWQgdG8gdGhlIGNvcnJlY3QgbnVtYmVyIG9mIGRlY2ltYWxzIChuZGVjKVxuLy8gLSBVc2UgdGhlIGNvcnJlY3QgZGVjaW1hbCBzZXBhcmF0b3IgKGRlYylcbi8vIC0gQWRkIGEgdGhvdXNhbmRzIHNlcGFyYXRvciAoZ3JwKVxuZm9ybWF0X251bWVyaWMgPSBmdW5jdGlvbihsYWJlbCwgdW5pdCwgbmRlYywgZGVjLCBncnApIHtcbiAgaWYgKGlzTmFOKGxhYmVsKSkgcmV0dXJuICcnO1xuICBpZiAodW5pdCA9PSB1bmRlZmluZWQpIHVuaXQgPSAnJztcbiAgaWYgKGRlYyA9PSB1bmRlZmluZWQpIGRlYyA9ICcsJztcbiAgaWYgKGdycCA9PSB1bmRlZmluZWQpIGdycCA9ICcgJztcbiAgLy8gcm91bmQgbnVtYmVyXG4gIGlmIChuZGVjICE9IHVuZGVmaW5lZCkge1xuICAgIGxhYmVsID0gbGFiZWwudG9GaXhlZChuZGVjKTtcbiAgfSBlbHNlIHtcbiAgICBsYWJlbCA9IGxhYmVsLnRvU3RyaW5nKCk7XG4gIH1cbiAgLy8gRm9sbG93aW5nIGJhc2VkIG9uIGNvZGUgZnJvbSBcbiAgLy8gaHR0cDovL3d3dy5tcmVka2ouY29tL2phdmFzY3JpcHQvbnVtYmVyRm9ybWF0Lmh0bWxcbiAgeCAgICAgPSBsYWJlbC5zcGxpdCgnLicpO1xuICB4MSAgICA9IHhbMF07XG4gIHgyICAgID0geC5sZW5ndGggPiAxID8gZGVjICsgeFsxXSA6ICcnO1xuICBpZiAoZ3JwICE9ICcnKSB7XG4gICAgdmFyIHJneCA9IC8oXFxkKykoXFxkezN9KS87XG4gICAgd2hpbGUgKHJneC50ZXN0KHgxKSkge1xuICAgICAgeDEgPSB4MS5yZXBsYWNlKHJneCwgJyQxJyArIGdycCArICckMicpO1xuICAgIH1cbiAgfVxuICByZXR1cm4oeDEgKyB4MiArIHVuaXQpO1xufVxuXG5cblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy8gPT09PSAgICAgICAgICAgICAgICAgICAgICAgICBXSUxLSU5TT04gQUxHT1JJVEhNICAgICAgICAgICAgICAgICAgICAgICAgPT09PVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG5cbmZ1bmN0aW9uIHdpbGtpbnNvbl9paShkbWluLCBkbWF4LCBtLCBjYWxjX2xhYmVsX3dpZHRoLCBheGlzX3dpZHRoLCBtbWluLCBtbWF4LCBRLCBwcmVjaXNpb24sIG1pbmNvdmVyYWdlKSB7XG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT0gU1VCUk9VVElORVMgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgLy8gVGhlIGZvbGxvd2luZyByb3V0aW5lIGNoZWNrcyBmb3Igb3ZlcmxhcCBpbiB0aGUgbGFiZWxzLiBUaGlzIGlzIHVzZWQgaW4gdGhlIFxuICAvLyBXaWxraW5zb24gbGFiZWxpbmcgYWxnb3JpdGhtIGJlbG93IHRvIGVuc3VyZSB0aGF0IHRoZSBsYWJlbHMgZG8gbm90IG92ZXJsYXAuXG4gIGZ1bmN0aW9uIG92ZXJsYXAobG1pbiwgbG1heCwgbHN0ZXAsIGNhbGNfbGFiZWxfd2lkdGgsIGF4aXNfd2lkdGgsIG5kZWMpIHtcbiAgICB2YXIgd2lkdGhfbWF4ID0gbHN0ZXAqYXhpc193aWR0aC8obG1heC1sbWluKTtcbiAgICBmb3IgKHZhciBsID0gbG1pbjsgKGwgLSBsbWF4KSA8PSAxRS0xMDsgbCArPSBsc3RlcCkge1xuICAgICAgdmFyIHcgID0gY2FsY19sYWJlbF93aWR0aChsLCBuZGVjKTtcbiAgICAgIGlmICh3ID4gd2lkdGhfbWF4KSByZXR1cm4odHJ1ZSk7XG4gICAgfVxuICAgIHJldHVybihmYWxzZSk7XG4gIH1cblxuICAvLyBQZXJmb3JtIG9uZSBpdGVyYXRpb24gb2YgdGhlIFdpbGtpbnNvbiBhbGdvcml0aG1cbiAgZnVuY3Rpb24gd2lsa2luc29uX3N0ZXAobWluLCBtYXgsIGssIG0sIFEsIG1pbmNvdmVyYWdlKSB7XG4gICAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgICBRICAgICAgICAgICAgICAgPSBRICAgICAgICAgfHwgWzEwLCAxLCA1LCAyLCAyLjUsIDMsIDQsIDEuNSwgNywgNiwgOCwgOV07XG4gICAgcHJlY2lzaW9uICAgICAgID0gcHJlY2lzaW9uIHx8IFsxLCAgMCwgMCwgMCwgIC0xLCAwLCAwLCAgLTEsIDAsIDAsIDAsIDBdO1xuICAgIG1pbmNvdmVyYWdlICAgICA9IG1pbmNvdmVyYWdlIHx8IDAuODtcbiAgICBtICAgICAgICAgICAgICAgPSBtIHx8IGs7XG4gICAgLy8gY2FsY3VsYXRlIHNvbWUgc3RhdHMgbmVlZGVkIGluIGxvb3BcbiAgICB2YXIgaW50ZXJ2YWxzICAgPSBrIC0gMTtcbiAgICB2YXIgZGVsdGEgICAgICAgPSAobWF4IC0gbWluKSAvIGludGVydmFscztcbiAgICB2YXIgYmFzZSAgICAgICAgPSBNYXRoLmZsb29yKE1hdGgubG9nKGRlbHRhKS9NYXRoLkxOMTApO1xuICAgIHZhciBkYmFzZSAgICAgICA9IE1hdGgucG93KDEwLCBiYXNlKTtcbiAgICAvLyBjYWxjdWxhdGUgZ3JhbnVsYXJpdHk7IG9uZSBvZiB0aGUgdGVybXMgaW4gc2NvcmVcbiAgICB2YXIgZ3JhbnVsYXJpdHkgPSAxIC0gTWF0aC5hYnMoay1tKS9tO1xuICAgIC8vIGluaXRpYWxpc2UgZW5kIHJlc3VsdFxuICAgIHZhciBiZXN0ID0gdW5kZWZpbmVkO1xuICAgIC8vIGxvb3AgdGhyb3VnaCBhbGwgcG9zc2libGUgbGFiZWwgcG9zaXRpb25zIHdpdGggZ2l2ZW4ga1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBRLmxlbmd0aDsgaSsrKSB7XG4gICAgICAvLyBjYWxjdWxhdGUgbGFiZWwgcG9zaXRpb25zXG4gICAgICB2YXIgdGRlbHRhID0gUVtpXSAqIGRiYXNlO1xuICAgICAgdmFyIHRtaW4gICA9IE1hdGguZmxvb3IobWluL3RkZWx0YSkgKiB0ZGVsdGE7XG4gICAgICB2YXIgdG1heCAgID0gdG1pbiArIGludGVydmFscyAqIHRkZWx0YTtcbiAgICAgIC8vIGNhbGN1bGF0ZSB0aGUgbnVtYmVyIG9mIGRlY2ltYWxzXG4gICAgICB2YXIgbmRlYyAgID0gKGJhc2UgKyBwcmVjaXNpb25baV0pIDwgMCA/IE1hdGguYWJzKGJhc2UgKyBwcmVjaXNpb25baV0pIDogMDtcbiAgICAgIC8vIGlmIGxhYmVsIHBvc2l0aW9ucyBjb3ZlciByYW5nZVxuICAgICAgaWYgKHRtaW4gPD0gbWluICYmIHRtYXggPj0gbWF4KSB7XG4gICAgICAgIC8vIGNhbGN1bGF0ZSByb3VuZG5lc3MgYW5kIGNvdmVyYWdlIHBhcnQgb2Ygc2NvcmVcbiAgICAgICAgdmFyIHJvdW5kbmVzcyA9IDEgLSAoaSAtICh0bWluIDw9IDAgJiYgdG1heCA+PSAwKSkgLyBRLmxlbmd0aFxuICAgICAgICB2YXIgY292ZXJhZ2UgID0gKG1heC1taW4pLyh0bWF4LXRtaW4pXG4gICAgICAgIC8vIGlmIGNvdmVyYWdlIGhpZ2ggZW5vdWdoXG4gICAgICAgIGlmIChjb3ZlcmFnZSA+IG1pbmNvdmVyYWdlICYmICFvdmVybGFwKHRtaW4sIHRtYXgsIHRkZWx0YSwgY2FsY19sYWJlbF93aWR0aCwgYXhpc193aWR0aCwgbmRlYykpIHtcbiAgICAgICAgICAvLyBjYWxjdWxhdGUgc2NvcmVcbiAgICAgICAgICB2YXIgdG5pY2UgPSBncmFudWxhcml0eSArIHJvdW5kbmVzcyArIGNvdmVyYWdlXG4gICAgICAgICAgLy8gaWYgaGlnaGVzdCBzY29yZVxuICAgICAgICAgIGlmICgoYmVzdCA9PT0gdW5kZWZpbmVkKSB8fCAodG5pY2UgPiBiZXN0LnNjb3JlKSkge1xuICAgICAgICAgICAgYmVzdCA9IHtcbiAgICAgICAgICAgICAgICAnbG1pbicgIDogdG1pbixcbiAgICAgICAgICAgICAgICAnbG1heCcgIDogdG1heCxcbiAgICAgICAgICAgICAgICAnbHN0ZXAnIDogdGRlbHRhLFxuICAgICAgICAgICAgICAgICdzY29yZScgOiB0bmljZSxcbiAgICAgICAgICAgICAgICAnbmRlYycgIDogbmRlY1xuICAgICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyByZXR1cm5cbiAgICByZXR1cm4gKGJlc3QpO1xuICB9XG5cbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSBNQUlOID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gZGVmYXVsdCB2YWx1ZXNcbiAgZG1pbiAgICAgICAgICAgICA9IE51bWJlcihkbWluKTtcbiAgZG1heCAgICAgICAgICAgICA9IE51bWJlcihkbWF4KTtcbiAgaWYgKE1hdGguYWJzKGRtaW4gLSBkbWF4KSA8IDFFLTEwKSB7XG4gICAgZG1pbiA9IDAuOTYqZG1pbjtcbiAgICBkbWF4ID0gMS4wNCpkbWF4O1xuICB9XG4gIGNhbGNfbGFiZWxfd2lkdGggPSBjYWxjX2xhYmVsX3dpZHRoIHx8IGZ1bmN0aW9uKCkgeyByZXR1cm4oMCk7fTtcbiAgYXhpc193aWR0aCAgICAgICA9IGF4aXNfd2lkdGggfHwgMTtcbiAgUSAgICAgICAgICAgICAgICA9IFEgICAgICAgICB8fCBbMTAsIDEsIDUsIDIsIDIuNSwgMywgNCwgMS41LCA3LCA2LCA4LCA5XTtcbiAgcHJlY2lzaW9uICAgICAgICA9IHByZWNpc2lvbiB8fCBbMSwgIDAsIDAsIDAsICAtMSwgMCwgMCwgIC0xLCAwLCAwLCAwLCAwXTtcbiAgbWluY292ZXJhZ2UgICAgICA9IG1pbmNvdmVyYWdlIHx8IDAuODtcbiAgbW1pbiAgICAgICAgICAgICA9IG1taW4gfHwgMjtcbiAgbW1heCAgICAgICAgICAgICA9IG1tYXggfHwgTWF0aC5jZWlsKDYqbSk7XG4gIC8vIGluaXRpbGlzZSBlbmQgcmVzdWx0XG4gIHZhciBiZXN0ID0ge1xuICAgICAgJ2xtaW4nICA6IGRtaW4sXG4gICAgICAnbG1heCcgIDogZG1heCxcbiAgICAgICdsc3RlcCcgOiAoZG1heCAtIGRtaW4pLFxuICAgICAgJ3Njb3JlJyA6IC0xRTgsXG4gICAgICAnbmRlYycgIDogMFxuICAgIH07XG4gIC8vIGNhbGN1bGF0ZSBudW1iZXIgb2YgZGVjaW1hbCBwbGFjZXNcbiAgdmFyIHggPSBTdHJpbmcoYmVzdFsnbHN0ZXAnXSkuc3BsaXQoJy4nKTtcbiAgYmVzdFsnbmRlYyddID0geC5sZW5ndGggPiAxID8geFsxXS5sZW5ndGggOiAwO1xuICAvLyBsb29wIHRob3VnaCBhbGwgcG9zc2libGUgbnVtYmVycyBvZiBsYWJlbHNcbiAgZm9yICh2YXIgayA9IG1taW47IGsgPD0gbW1heDsgaysrKSB7IFxuICAgIC8vIGNhbGN1bGF0ZSBiZXN0IGxhYmVsIHBvc2l0aW9uIGZvciBjdXJyZW50IG51bWJlciBvZiBsYWJlbHNcbiAgICB2YXIgcmVzdWx0ID0gd2lsa2luc29uX3N0ZXAoZG1pbiwgZG1heCwgaywgbSwgUSwgbWluY292ZXJhZ2UpXG4gICAgLy8gY2hlY2sgaWYgY3VycmVudCByZXN1bHQgaGFzIGhpZ2hlciBzY29yZVxuICAgIGlmICgocmVzdWx0ICE9PSB1bmRlZmluZWQpICYmICgoYmVzdCA9PT0gdW5kZWZpbmVkKSB8fCAocmVzdWx0LnNjb3JlID4gYmVzdC5zY29yZSkpKSB7XG4gICAgICBiZXN0ID0gcmVzdWx0O1xuICAgIH1cbiAgfVxuICAvLyBnZW5lcmF0ZSBsYWJlbCBwb3NpdGlvbnNcbiAgdmFyIGxhYmVscyA9IFtdO1xuICBmb3IgKHZhciBsID0gYmVzdC5sbWluOyAobCAtIGJlc3QubG1heCkgPD0gMUUtMTA7IGwgKz0gYmVzdC5sc3RlcCkge1xuICAgIGxhYmVscy5wdXNoKGwpO1xuICB9XG4gIGJlc3RbJ2xhYmVscyddID0gbGFiZWxzO1xuICByZXR1cm4oYmVzdCk7XG59XG5cblxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9