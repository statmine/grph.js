
function grph_linear_scale() {

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


