const Scope = require('./scope');
const rt = require('./rt').rt;

const table = {
  'ast.Module': (callstack, scope, node) => {
    node.body.forEach(x => {
      run_(callstack, scope, x);
    });
  },
  'ast.Declaration': (callstack, scope, node) => {
    const name = node.identifier.name;
    const value = run_(callstack, scope, node.expression);
    Scope.add(scope, name, value);
  },
  'ast.Assignment': (callstack, scope, node) => {
    const name = node.identifier.name;
    const value = run_(callstack, scope, node.expression);
    Scope.update(scope, name, value);
  },
  'ast.Function': (callstack, scope, node) => {
    const params = node.parameters.map(p => p.name);
    return rt.Function(scope, params, node.body);
  },
  'ast.Identifier': (callstack, scope, node) => {
    return Scope.get(scope, node.name);
  },
  'ast.Number': (callstack, scope, node) => {
    return rt.Number(node.value);
  },
  'ast.If': (callstack, scope, node) => {
    const cond = run_(callstack, scope, node.condition);
    const body = cond.type === 'rt.False' ? node.falseBody : node.trueBody;
    body.forEach(x => {
      run_(callstack, scope, x);
    });
  },
  'ast.Entry': (callstack, scope, node) => {
    const key = run_(callstack, node, node.key)
    const value = run_(callstack, node, node.value)
    return [key, value];
  },
  'ast.Dictionary': (callstack, scope, node) => {
    const pairs = node.entries.map(x => run_(callstack, scope, x));
    const entries = new Map();
    pairs.forEach(p => {
      entries.set(p[0], p[1]);
    });
    return rt.Dictionary(entries);
  },
  'ast.List': (callstack, scope, node) => {
    return rt.List(node.items.map(x => run_(callstack, scope, x)));
  },
  'ast.String': (callstack, scope, node) => {
    return rt.String(node.value);
  },
  'ast.Return': (callstack, scope, node) => {
    const value = run_(callstack, scope, node.expression);
    throw ['RETURN', value];
  },
  'ast.While': (callstack, scope, node) => {
    while (run_(callstack, scope, node.condition).type !== 'rt.False') {
      node.body.forEach(x => {
        run_(callstack, scope, x);
      });
    }
  },
  'ast.Call': (callstack, scope, node) => {
    const f = run_(callstack, scope, node.function);
    const args = node.arguments.map(x => run_(callstack, scope, x));
    if (f.type === 'rt.JSFunction') {
      return f.value.apply(null, args);
    }
    const newStack = callstack.concat('[...]');
    const newScope = Scope.create(f.scope);
    f.parameters.forEach((p, i) => {
      Scope.add(newScope, p, args[i]);
    });
    // This is really gross, but I'm using try/catch so that the Hibiscus return
    // function will jump us out of evaluating anything else. Ideally the whole
    // parser would be written with callbacks, and we'd avoid this mess.
    try {
      f.body.forEach(x => run_(newStack, newScope, x));
      return rt.Null();
    } catch (err) {
      if (Array.isArray(err) && err.length === 2 && err[0] === 'RETURN') {
        return err[1];
      } else {
        throw err;
      }
    }
  }
}

function run_(callstack, scope, node) {
  if (arguments.length !== run_.length) {
    throw new Error('arity mismatch');
  }
  if (node && table.hasOwnProperty(node.type)) {
    return table[node.type](callstack, scope, node);
  } else {
    throw new Error('not a node: ' + JSON.stringify(node));
  }
}

function run(scope, node) {
  if (arguments.length !== run.length) {
    throw new Error('arity mismatch');
  }
  return run_([], scope, node);
}

exports.run = run;
