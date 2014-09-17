
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

