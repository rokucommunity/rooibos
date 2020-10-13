var getJsonFromString = function(text) {
  var value = null;
  eval("value = " + text);
  return value;
}

module.exports = getJsonFromString;