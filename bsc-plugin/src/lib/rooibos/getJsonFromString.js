// eslint-disable-next-line func-names
let getJsonFromString = function(text) {
  let value = null;
  // eslint-disable-next-line no-eval
  eval('value = ' + text);
  return value;
};

module.exports = getJsonFromString;
