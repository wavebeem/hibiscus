function assertString(x) {
  if (typeof x !== 'string') {
    throw new Error('expected string: ' + x);
  }
}

const empty = ['Scope.Empty'];

function create(parent) {
  return ['Scope.Nonempty', new Map(), parent];
}

function get(scope, key) {
  assertString(key);
  if (scope[0] === 'Scope.Empty') {
    throw new Error('no such variable ' + key);
  } else {
    if (scope[1].has(key)) {
      return scope[1].get(key);
    } else {
      return get(scope[2], key);
    }
  }
}

function add(scope, key, value) {
  assertString(key);
  if (scope[0] === 'Scope.Nonempty') {
    if (scope[1].has(key)) {
      throw new Error('cannot redeclare variable ' + key);
    }
    scope[1].set(key, value);
  } else {
    throw new Error('cannot add key to scope ' + scope);
  }
}

function update(scope, key, value) {
  assertString(key);
  if (scope[0] === 'Scope.Empty') {
    throw new Error('cannot update nonexistent variable ' + key);
  } else if (scope[1].has(key)) {
    scope[1].set(key, value);
  } else {
    update(scope[2], key, value);
  }
}

exports.empty = empty;
exports.create = create;
exports.update = update;
exports.add = add;
exports.get = get;
