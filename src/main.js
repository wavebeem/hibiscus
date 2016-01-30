const fs = require('fs');
const util = require('util');
const parse = require('./parse').parse;
const run = require('./run').run;
const rt = require('./rt').rt;
const Scope = require('./scope');

function inspect(x) {
  return util.inspect(x, {depth: null, colors: true});
}

const args = process.argv.slice(2);
if (args.length === 1) {
  const filename = args[0];
  const code = fs.readFileSync(filename, 'utf-8');
  // Show source code
  // console.log(code);
  const result = parse(code);
  if (result.status) {
    // Show AST
    // console.log(inspect(result.value));
    const scope = Scope.create(Scope.empty);
    // TODO: Actually do type checking on these functions
    Scope.add(scope, 'print', rt.JSFunction(x => {
      function show(x) {
        const t = x.type;
        if (t === 'rt.List') {
          return '[' + x.items.map(show).join(', ') + ']';
        } else if (t === 'rt.Dictionary') {
          return '{' +
            Array.from(x.entries.entries())
              .map(p => show(p[0]) + ': ' + show(p[1]))
              .join(', ') +
            '}';
        } else if (t === 'rt.Entry') {
          return show(x.key) + ': ' + show(x.value);
        } else if (t === 'rt.Function') {
          return '<function>';
        } else if (t === 'rt.True') {
          return 'true';
        } else if (t === 'rt.False') {
          return 'false';
        } else if (t === 'rt.Null') {
          return 'null';
        } else {
          return JSON.stringify(x.value);
        }
      }
      console.log(show(x));
      return rt.Null();
    }));
    Scope.add(scope, 'less', rt.JSFunction((a, b) => {
      return a.value < b.value ? rt.True() : rt.False();
    }));
    Scope.add(scope, 'length', rt.JSFunction(x => {
      return rt.Number(x.items.length);
    }));
    Scope.add(scope, 'get', rt.JSFunction((xs, i) => {
      return xs.items[i.value];
    }));
    Scope.add(scope, 'set', rt.JSFunction((dict, key, val) => {
      dict.entries.set(key, val);
      return rt.Null();
    }));
    Scope.add(scope, 'append', rt.JSFunction((xs, x) => {
      xs.items.push(x);
      return rt.Null();
    }));
    Scope.add(scope, 'multiply', rt.JSFunction((a, b) => {
      return rt.Number(a.value * b.value);
    }));
    Scope.add(scope, 'add', rt.JSFunction((a, b) => {
      return rt.Number(a.value + b.value);
    }));
    Scope.add(scope, 'subtract', rt.JSFunction((a, b) => {
      return rt.Number(a.value - b.value);
    }));
    run(scope, result.value);
  } else {
    console.error('syntax error at character', result.index);
    console.error('expected one of', result.expected.join(', '));
  }
} else {
  console.error('wrong argument count');
}
