function NodeMakers(prefix, obj) {
  Object.keys(obj).forEach(k => {
    obj[k] = makeIt(prefix, k, obj[k]);
  });
  return obj;
}

function makeIt(prefix, name, props) {
  return function() {
    const fullName = prefix + '.' + name;
    if (arguments.length !== props.length) {
      throw new Error('wrong argument count to ' + fullName + '()');
    }
    const obj = {};
    obj.type = fullName;
    props.forEach((p, i) => {
      obj[p] = arguments[i];
    });
    return obj;
  };
}

exports.NodeMakers = NodeMakers
