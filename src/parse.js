const P = require('parsimmon');
const ast = require('./ast').ast;

const _ = P.regex(/\s*/);
const __ = P.regex(/\s+/);

function sepBy1(item, separator) {
  return item.chain(first =>
    separator
      .then(item)
      .many()
      .map(rest => [first].concat(rest))
      .or(P.of([first]))
  );
}

function sepBy(item, separator) {
  return sepBy1(item, separator).or(P.of([]));
}

function parenthesized(thing) {
  return P.string('(')
    .then(spaced(thing))
    .skip(P.string(')'));
}

function spaced(thing) {
  return _.then(thing).skip(_);
}

const Expr =
  P.lazy(() => P.alt(
    Calls,
    Atom
  ));

const Atom =
  P.lazy(() => P.alt(
    List,
    Dictionary,
    NamedLiteral,
    Function_,
    Number_,
    String_,
    Identifier,
    ParenthesizedExpression
  ));

const ParenthesizedExpression =
  parenthesized(Expr);

const Separator =
  spaced(P.string(','));

const Name =
  P.regex(/[a-zA-Z_][a-zA-Z_0-9]*/);

const NamedLiteral =
  Name
    .chain(n => {
      if (n === 'true') {
        return P.of(ast.True())
      } else if (n === 'false') {
        return P.of(ast.False());
      } else if (n === 'null') {
        return P.of(ast.Null());
      } else {
        return P.fail('named literal');
      }
    });

const Identifier =
  Name
    .map(ast.Identifier);

const Arguments =
  parenthesized(sepBy(Expr, Separator));

const Calls =
  P.seqMap(
    Atom,
    Arguments.skip(_).many(),
    (f, argLists) =>
      argLists.reduce(
        (call, args) =>
          ast.Call(call, args),
        f
      )
  );

const List =
  P.string('[')
    .skip(_)
    .then(sepBy(Expr, Separator))
    .skip(_)
    .skip(P.string(']'))
    .map(ast.List);

const Entry =
  P.seqMap(
    Expr
      .skip(_)
      .skip(P.string(':'))
      .skip(_),
    Expr,
    ast.Entry
  );

const Dictionary =
  P.string('{')
    .skip(_)
    .then(sepBy(Entry, Separator))
    .skip(_)
    .skip(P.string('}'))
    .map(ast.Dictionary);

const Number_ =
  P.regex(/[0-9]+/)
  .map(Number)
  .map(ast.Number);

const String_ =
  P.string('"')
    .then(P.regex(/[^"]*/))
    .skip(P.string('"'))
    .map(ast.String)

const Statement =
  P.lazy(() =>
    P.alt(
      While,
      Return,
      Declaration,
      Assignment,
      If,
      Calls
    )
      .skip(_)
      .skip(P.string(';'))
  );

const Statements =
  Statement.skip(_).many();

const Return =
  P.string('return')
    .skip(__)
    .then(Expr)
    .map(ast.Return);

const While =
  P.seqMap(
    P.string('while')
      .skip(__)
      .then(Expr)
      .skip(_)
      .skip(P.string('{')),
    spaced(Statements)
      .skip(P.string('}')),
    ast.While
  );

const If =
  P.seqMap(
    P.string('if')
      .skip(__)
      .then(Expr)
      .skip(_)
      .skip(P.string('{')),
    spaced(Statements)
      .skip(P.string('}'))
      .skip(_)
      .skip(P.string('else'))
      .skip(_)
      .skip(P.string('{')),
    spaced(Statements)
      .skip(P.string('}')),
    ast.If
  );

const Declaration =
  P.seqMap(
    P.string('let')
      .skip(__)
      .then(Identifier)
      .skip(spaced(P.string('='))),
    Expr,
    ast.Declaration
  );

const Assignment =
  P.seqMap(
    Identifier
      .skip(spaced(P.string('='))),
    Expr,
    ast.Assignment
  );

const Function_ =
  P.seqMap(
    P.string('function')
      .then(P.string('('))
      .then(sepBy(Identifier, Separator)),
    P.string(')')
      .skip(_)
      .skip(P.string('{'))
      .then(spaced(Statements))
      .skip(_)
      .skip(P.string('}')),
    ast.Function
  );

const Module =
  Statements
    .map(ast.Module);

function parse(text) {
  return Module.parse(text);
}

exports.parse = parse;
