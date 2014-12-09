
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

