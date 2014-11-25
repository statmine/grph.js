
function grph_graph_bar() {

  var axes = {
    'x' : grph_axis_linear(true),
    'y' : grph_axis_categorical(),
    'column' : grph_axis_split(),
    'row' : grph_axis_split()
  };
  axes.x.required = true;
  axes.y.required = true;
  var dispatch = d3.dispatch("mouseover", "mouseout", "click", "ready");

  var graph = grph_generic_graph(axes, dispatch, "bar", function(g, data) {
    g.selectAll("rect.bar").data(data).enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) {
        var v = axes.x.scale(d);
        return v < axes.x.scale(0) ? v : axes.x.scale(0);
      })
      .attr("width", function(d) { return Math.abs(axes.x.scale(d) - axes.x.scale(0)); })
      .attr("y", axes.y.scale.l)
      .attr("height", axes.y.scale.w);
    g.append("line").attr("class", "origin")
      .attr("x1", axes.x.scale(0))
      .attr("x2", axes.x.scale(0))
      .attr("y1", 0).attr("y2", axes.y.height());
      
  });

  return graph;
}
