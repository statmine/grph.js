
function grph_colour_scale() {

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
