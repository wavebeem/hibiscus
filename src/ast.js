const NodeMakers = require('./node-makers').NodeMakers;

const ast = NodeMakers('ast', {
  Module: ['body'],
  True: [],
  False: [],
  Null: [],
  List: ['items'],
  Dictionary: ['entries'],
  Entry: ['key', 'value'],
  Return: ['expression'],
  While: ['condition', 'body'],
  Declaration: ['identifier', 'expression'],
  Assignment: ['identifier', 'expression'],
  If: ['condition', 'trueBody', 'falseBody'],
  Number: ['value'],
  String: ['value'],
  Function: ['parameters', 'body'],
  Identifier: ['name'],
  Call: ['function', 'arguments']
});

exports.ast = ast;
