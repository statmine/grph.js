
function grph_axis_period() {

  var scale_ = grph_scale_period();
  var height_;
  var variable_;
  var settings = {
    "tick_length" : [15, 30, 45],
    "tick-threshold" : 7,
    "label-year-small" : 30,
    "label-threshold" : 13
  };

  // checks if we need/want to draw tickmarks and labels for months and
  // quarters. This depends on the density. When th density becomes too
  // large first no labels are drawn; when higher the ticksmarks are also
  // not drawn.
  function determine_what_to_draw(ticks) {
    // determine if we want to draw ticks and labels for months
    var n = ticks.filter(function(t) {return t.type == "month";}).length;
    var d = (scale_.range()[1] - scale_.range()[0]) / n;
    var month_ticks  = scale_.has_month() && d > settings['tick-threshold'];
    var month_labels = scale_.has_month() && d > settings['label-threshold'];
    // determine if we want to draw ticks and labels for quarters
    n = ticks.filter(function(t) {return t.type == "quarter";}).length;
    d = (scale_.range()[1] - scale_.range()[0]) / n;
    var quarter_ticks  = scale_.has_quarter() && d > settings['tick-threshold'];
    var quarter_labels = scale_.has_quarter() && d > settings['label-threshold'];
    // determine if we want to draw all year labels or only the begin and end
    // labels
    n = ticks.filter(function(t) {return t.type == "year";}).length;
    d = (scale_.range()[1] - scale_.range()[0]) / n;
    console.log('n=', n, '; d=', d);
    var year_labels = d > settings['label-threshold'];
    var year_small = d < settings['label-year-small'];
    return {
      month : {ticks : month_ticks, labels : month_labels},
      quarter : {ticks : quarter_ticks, labels : quarter_ticks},
      year : {ticks: true, labels : year_labels, small: year_small}
    };
  }

  var axis = function(g) {
    var ticks = scale_.ticks();

    var to_draw = determine_what_to_draw(ticks);

    var tick_length = {};
    var tick = 0;
    if (to_draw.month.ticks) tick_length.month = settings.tick_length[tick++];
    if (to_draw.quarter.ticks) tick_length.quarter = settings.tick_length[tick++];
    tick_length.year = settings.tick_length[tick++];

    // draw the tick marks
    // remove tickmarks that do not need to be drawn
    ticks = ticks.filter(function(d) {
      if (d.type == 'quarter' && !to_draw.quarter.ticks) return false;
      if (d.type == 'month' && !to_draw.month.ticks) return false;
      return true;
    });

    g.selectAll("line.tick-end").data(ticks).enter().append("line")
      .attr("class", function(d) {
        var last = d.last ? " ticklast" : "";
        return "tick tickend tick" + d.type + last;
      })
      .attr("x1", function(d) { return scale_(d.period.end);})
      .attr("y1", 0)
      .attr("x2", function(d) { return scale_(d.period.end);})
      .attr("y2", function(d) { return tick_length[d.type];});
    g.selectAll("line.tick-start").data(ticks).enter().append("line")
      .attr("class", function(d) {
        var last = d.last ? " ticklast" : "";
        return "tick tickstart tick" + d.type + last;
      })
      .attr("x1", function(d) { return scale_(d.period.start);})
      .attr("y1", 0)
      .attr("x2", function(d) { return scale_(d.period.start);})
      .attr("y2", function(d) { return tick_length[d.type];});

    // draw the labels
    // remove tickmarks that do not need to be drawn
    console.log(to_draw);
    console.log(ticks);
    var first_year = true;
    ticks = ticks.filter(function(d) {
      if (d.type == 'quarter' && !to_draw.quarter.labels) return false;
      if (d.type == 'month' && !to_draw.month.labels) return false;
      if (d.type == 'year' && !to_draw.year.labels) {
        var first_or_last = d.last || first_year;
        first_year = false;
        if (!first_or_last) return false;
      }
      return true;
    });

    console.log("ticks=", ticks);
    g.selectAll("text").data(ticks).enter().append("text")
      .attr("class", function(d) { return "ticklabel ticklabel" + d.type;})
      .attr("x", function(d) { return scale_(d.date);})
      .attr("y", function(d) { return tick_length[d.type];})
      .attr("text-anchor", "middle")
      .text(function(d) {
        if (d.type == "month") {
          return d.period.start.format("MMM").charAt(0);
        } else if (d.type == "quarter") {
          return "Q" + d.period.start.format("Q");
        } if (d.type == "year" && to_draw.year.small) {
          return (d.label + "").slice(-2);
        }
        return d.label;
      });
  };

  axis.height = function(height_) {
    if (arguments.length === 0) {
      if (height_ === undefined) {
        var tick = 0;
        if (scale_.has_month) tick++;
        if (scale_.has_quarter) tick++;
        return settings.tick_length[tick];
      } else {
        return height_;
      }
    } else {
      height_ = height;
      return this;
    }
  };

  axis.width = function(width) {
    if (arguments.length === 0) {
      var r = scale_.range();
      return r[1] - r[0];
    } else {
      scale_.range([0, width]);
      return this;
    }
  };

  axis.accept = function(variable, schema) {
    var vschema = variable_schema(variable, schema);
    return vschema.type == 'date' || vschema.type == 'period';
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
      var domain = data.map(function(d) { return d[variable_];});
      scale_.domain(domain);
      return this;
    }
  };


  axis.ticks = function() {
    var ticks = scale_.ticks();
    return ticks.filter(function(d) { return d.type == "year";});
  };

  axis.scale = function(v) {
    if (typeof v == 'object') {
      if (v.hasOwnProperty("date") && v.hasOwnProperty("period")) {
        return scale_(v);
      } else {
        return scale_(v[variable_]);
      }
    } else {
      return scale_(v);
    }
  };


  return axis;
}

if (grph.axis === undefined) grph.axis = {};
grph.axis.period = grph_axis_period();
