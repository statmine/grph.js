
function grph_scale_categorical() {

  var domain;
  var range;

  function scale(v) {
    var i = domain.indexOf(v);
    if (i < 0) return {l: undefined, m:undefined, u:undefined};
    var m = i - 0.5;
    var w = (1 - settings("padding"))*0.5;
    return {l:m-w, m:m, u:m+w};
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
      return range;
    } else {
      range = r;
      return this;
    }
  };

  function lsize(label) {
    var size = typeof(label_size) == "function" ? label_size(label) : label_size;
    return size;
  }

  scale.ticks = function() {
    return domain.map(function(d) { return scale(d).m;});
  };

  return scale;
}

if (grph.scale === undefined) grph.scale = {};
grph.scale.categorical = grph_scale_categorical;

