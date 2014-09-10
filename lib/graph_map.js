

function grph_graph_map() {

  var width_, height_;
  var axes_ = {
    'region' : grph_axis_region(),
    'colour' : grph_axis_chloropleth(),
    'column' : grph_split_axis(),
    'row' : grph_split_axis()
  };
  axes_.region.required = true;
  axes_.colour.required = true;
  var schema_;
  var data_;
  var settings_ = {
    'padding' : [2, 2, 2, 2],
    'label_padding' : 4,
    'sep' : 8,
  };

  function graph(g) {
    function nest_column(d) {
      return axes_.column.variable() ? d[axes_.column.variable()] : 1;
    }
    function nest_row(d) {
      return axes_.row.variable() ? d[axes_.row.variable()] : 1;
    }
    // setup axes
    axes_.region.domain(data_, schema_);
    axes_.colour.domain(data_, schema_);
    axes_.column.domain(data_, schema_);
    axes_.row.domain(data_, schema_);
    // determine number of rows and columns
    var ncol = axes_.column.variable() ? axes_.column.ticks().length : 1;
    var nrow = axes_.row.variable() ? axes_.row.ticks().length : 1;
    // set the width, height end domain of the x- and y-axes
    var w = (width_ - settings_.padding[1] - settings_.padding[3] - 
      (ncol-1)*settings_.sep)/ncol;
    var h = (height_ - settings_.padding[0] - settings_.padding[2] - 
      (nrow-1)*settings_.sep)/nrow;
    var l = settings_.padding[1];
    var t  = settings_.padding[2];
    axes_.region.width(w).height(h);
    // draw graphs
    wait_for(axes_.region.map_loaded, function() {
    var d = d3.nest().key(nest_column).key(nest_row).entries(data_);
    for (var i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      var t  = settings_.padding[2];
      for (var j = 0; j < dj.length; ++j) {
        // draw box for graph
        var gr = svg.append("g").attr("class", "graph")
          .attr("transform", "translate(" + l + "," + t + ")");
        gr.append("rect").attr("class", "background")
          .attr("width", w).attr("height", h);
        // draw map
        gr.selectAll("path").data(dj[j].values).enter().append("path")
          .attr("d", axes_.region.scale).attr("class", axes_.colour.scale);
        // next line
        t += h + settings_.sep;
      }
      l += w + settings_.sep;
    }
    // add hover events to the lines
    g.selectAll("path").on("mouseover", function(d, i) {
      var region = d3.select(this).datum()[axes_.region.variable()];
      d3.selectAll("path").classed("colourlow", true);
      d3.selectAll("path").filter(function(d, i) {
        return d[axes_.region.variable()] == region;
      }).classed({"colourhigh": true, "colourlow": false});
    }).on("mouseout", function(d, i) {
      d3.selectAll("path").classed({"colourhigh": false, "colourlow": false});
    });
    });
  }


  // ==========================================================================
  // The following is the same for each (or most) graphs (and could therefore
  // probably be moved to a graph superclass.
  graph.axes = function() {
    return d3.keys(axes_);
  }

  graph.width = function(width) {
    if (arguments.length == 0) {
      return width_;
    } else {
      width_ = width;
      return this;
    }
  }

  graph.height = function(height) {
    if (arguments.length == 0) {
      return height_;
    } else {
      height_ = height;
      return this;
    }
  }

  graph.accept = function(variables, axis) {
    if (arguments.length > 1) {
      if (axes_[axis] === undefined) return false;
      return axes_[axis].accept(variables, schema_);
    } else {
      for (i in axes_) {
        if (variables[i] === undefined) {
          if (axes_[i].required) return false;
        } else {
          var accept = axes_[i].accept(variables[i], schema_);
          if (!accept) return false;
        }
      }
      return true;
    }
  }

  graph.assign = function(variables) {
    for (i in axes_) axes_[i].assign(variables[i]);
    return this;
  }

  graph.schema = function(schema) {
    if (arguments.length == 0) {
      return schema_;
    } else {
      schema_ = schema;
      return this;
    }
  }

  graph.data = function(data, schema) {
    if (arguments.length == 0) {
      return data_;
    } else {
      data_ = data;
      if (arguments.length > 1) 
        graph.schema(schema);
      return this;
    }
  }

  return graph;
}

