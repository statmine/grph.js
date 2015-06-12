

var settings = function() {
  var s = {
    'default' : {
      'padding' : [2, 2, 2, 2],
      'label_padding' : 4,
      'sep' : 8,
      'point_size' : 4,
      'max_bubble' : 20,
      'default_bubble' : 5,
      'bar_padding' : 0.4,
      'tick_length' : 5,
      'tick_padding' : 2,
      'period_coverage' : 0.85
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
