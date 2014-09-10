
function grph_graph_line() {

  var width_, height_;
  var axes_ = {
    'x' : grph_axis_linear(true),
    'y' : grph_axis_linear(false),
    'colour' : grph_axis_colour(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes_.x.required = true;
  axes_.y.required = true;
  var schema_;
  var data_;
  var settings_ = {
    'padding' : [2, 2, 2, 2],
    'label_padding' : 4,
    'sep' : 8,
    'point_size' : 4
  };

  var dummy_ = d3.select("body").append("svg")
    .attr("class", "lineargraph dummy")
    .style("visibility", "invisible");
  var label_size_ = grph_label_size(dummy_);

  function graph(g) {
    function nest_colour(d) {
      return axes_.colour.variable() ? d[axes_.colour.variable()] : 1;
    }
    function nest_column(d) {
      return axes_.column.variable() ? d[axes_.column.variable()] : 1;
    }
    function nest_row(d) {
      return axes_.row.variable() ? d[axes_.row.variable()] : 1;
    }
    // setup axes
    axes_.colour.domain(data_, schema_);
    axes_.column.domain(data_, schema_);
    axes_.row.domain(data_, schema_);
    // determine number of rows and columns
    var ncol = axes_.column.variable() ? axes_.column.ticks().length : 1;
    var nrow = axes_.row.variable() ? axes_.row.ticks().length : 1;
    // get labels and determine their height
    var vschemax = variable_schema(axes_.x.variable(), schema);
    var xlabel = vschemax.title;
    var label_height = label_size_.height(xlabel) + settings_.label_padding;
    var vschemay = variable_schema(axes_.y.variable(), schema);
    var ylabel = vschemay.title;
    // set the width, height end domain of the x- and y-axes. We need some 
    // iterations for this, as the height of the y-axis depends of the height
    // of the x-axis, which depends on the labels of the x-axis, which depends
    // on the width of the x-axis, etc. 
    for (var i = 0; i < 2; ++i) {
      var w = width_ - settings_.padding[1] - settings_.padding[3] - 
        axes_.y.width() - label_height;
      w = (w - (ncol-1)*settings_.sep) / ncol;
      axes_.x.width(w).domain(data_, schema_);
      var h = height_ - settings_.padding[0] - settings_.padding[2] - 
        axes_.x.height() - label_height;
      h = (h - (nrow-1)*settings_.sep) / nrow;
      axes_.y.height(h).domain(data_, schema_);
    }
    var l = axes_.y.width() + settings_.padding[1] + label_height;
    var t  = settings_.padding[2];
    // draw labels
    var ycenter = t + 0.5*(height_ - settings_.padding[0] - settings_.padding[2] - 
        axes_.x.height() - label_height);
    var xcenter = l + 0.5*(width_ - settings_.padding[1] - settings_.padding[3] - 
        axes_.y.width() - label_height);
    svg.append("text")
      .attr("x", settings_.padding[1]).attr("y", ycenter)
      .attr("text-anchor", "middle").text(ylabel)
      .attr("transform", "rotate(90 " + settings_.padding[1] + " " + ycenter + ")");
    svg.append("text").attr("x", xcenter).attr("y", height_-settings_.padding[0])
      .attr("text-anchor", "middle").text(xlabel);



    var d = d3.nest().key(nest_column).key(nest_row).key(nest_colour).entries(data_);

    for (var i = 0; i < d.length; ++i) {
      var dj = d[i].values;
      var t  = settings_.padding[2];
      for (var j = 0; j < dj.length; ++j) {
        // draw x-axis
        if (j == (dj.length-1)) {
          svg.append("g").attr("class", "xaxis")
            .attr("transform", "translate(" + l + "," + (t + h) + ")").call(axes_.x);
        }
        // draw y-axis
        if (i == 0) {
          svg.append("g").attr("class", "xaxis")
            .attr("transform", "translate(" + (l - axes_.y.width()) + "," + t + ")")
            .call(axes_.y);
        }
        // draw box for graph
        var gr = svg.append("g").attr("class", "graph")
          .attr("transform", "translate(" + l + "," + t + ")");
        gr.append("rect").attr("class", "background")
          .attr("width", w).attr("height", h);
        // draw grid
        var xticks = axes_.x.ticks();
        gr.selectAll("line.gridx").data(xticks).enter().append("line")
          .attr("class", "grid gridx")
          .attr("x1", axes_.x.scale).attr("x2", axes_.x.scale)
          .attr("y1", 0).attr("y2", h);
        var yticks = axes_.y.ticks();
        gr.selectAll("line.gridy").data(yticks).enter().append("line")
          .attr("class", "grid gridy")
          .attr("x1", 0).attr("x2", w)
          .attr("y1", axes_.y.scale).attr("y2", axes_.y.scale);
        // add crosshairs to graph
        var gcrossh = gr.append("g").classed("crosshairs", true);
        gcrossh.append("line").classed("hline", true).attr("x1", 0)
          .attr("y1", 0).attr("x2", axes_.x.width()).attr("y2", 0)
          .style("visibility", "hidden");
        gcrossh.append("line").classed("vline", true).attr("x1", 0)
          .attr("y1", 0).attr("x2", 0).attr("y2", axes_.y.height())
          .style("visibility", "hidden");
        // draw lines 
        var line = d3.svg.line().x(axes_.x.scale).y(axes_.y.scale) 
        var dk = dj[j].values;
        for (var k = 0; k < dk.length; ++k) {
          gr.append("path").attr("d", line(dk[k].values))
            .attr("class", axes_.colour.scale(dk[k].key));
        }
        // draw points 
        var dk = dj[j].values;
        for (var k = 0; k < dk.length; ++k) {
          var cls = "circle" + k;
          gr.selectAll("circle.circle" + k).data(dk[k].values).enter().append("circle")
            .attr("class", "circle" + k + " " + axes_.colour.scale(dk[k].key))
            .attr("cx", axes_.x.scale).attr("cy", axes_.y.scale)
            .attr("r", settings_.point_size);
        }

        // next line
        t += axes_.y.height() + settings_.sep;
      }
      l += axes_.x.width() + settings_.sep;
    }


    // add hover events to the lines
    g.selectAll(".colour").on("mouseover", function(d, i) {
      var classes = d3.select(this).attr("class");
      var regexp = /\bcolour([0-9]+)\b/;
      var colour = regexp.exec(classes)[0];
      d3.selectAll(".colour").classed("colourlow", true);
      d3.selectAll("." + colour).classed({"colourhigh": true, "colourlow": false});
    });
    g.selectAll(".colour").on("mouseout", function(d, i) {
      d3.selectAll(".colour").classed({"colourhigh": false, "colourlow": false});
    });
    // add hover events to the points
    g.selectAll("circle").on("mouseover", function(d, i) {
      g.selectAll(".hline").attr("y1", axes_.y.scale(d)).attr("y2", axes_.y.scale(d))
        .style("visibility", "visible");
      g.selectAll(".vline").attr("x1", axes_.x.scale(d)).attr("x2", axes_.x.scale(d))
        .style("visibility", "visible");
    });
    g.selectAll("circle").on("mouseout", function(d, i) {
      g.selectAll(".hline").style("visibility", "hidden");
      g.selectAll(".vline").style("visibility", "hidden");
    });
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

  graph.axes = function() {
    return d3.keys(axes_);
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
    for (i in axes_) axes_[i].variable(variables[i]);
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

