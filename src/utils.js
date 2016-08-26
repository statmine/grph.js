
// Convert a number to string padding it with zeros until the number of 
// characters before the decimal symbol equals length (not including sign)
function zero_pad(num, length) {
  var n = Math.abs(num);
  var nzeros = Math.max(0, length - Math.floor(n).toString().length );
  var padding = Math.pow(10, nzeros).toString().substr(1);
  if( num < 0 ) {
    padding = '-' + padding;
  }
  return padding + n;
}


// Format a numeric value:
// - Make sure it is rounded to the correct number of decimals (ndec)
// - Use the correct decimal separator (dec)
// - Add a thousands separator (grp)
function format_number(label, unit, ndec, dec, grp) {
  if (isNaN(label)) return '';
  var unit = unit || '';
  var dec = dec || '.';
  var grp = grp || ' ';
  // round number
  if (ndec !== undefined) {
    label = label.toFixed(ndec);
  } else {
    label = label.toString();
  }
  // Following based on code from 
  // http://www.mredkj.com/javascript/numberFormat.html
  x     = label.split('.');
  x1    = x[0];
  x2    = x.length > 1 ? dec + x[1] : '';
  if (grp !== '') {
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + grp + '$2');
    }
  }
  return(x1 + x2 + unit);
}



