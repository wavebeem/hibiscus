const NodeMakers = require('./node-makers').NodeMakers;

const rt = NodeMakers('rt', {
  Function: ['scope', 'parameters', 'body'],
  JSFunction: ['value'],
  True: [],
  False: [],
  Null: [],
  List: ['items'],
  Dictionary: ['entries'],
  Number: ['value'],
  String: ['value']
});

exports.rt = rt;
