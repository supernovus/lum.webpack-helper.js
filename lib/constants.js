const core = require('@lumjs/core');
const {def,needObj} = core.types;

const CONSTANTS = [];
const _ = module.exports;

def(_, 'get', function()
{
  return Object.assign({}, ...CONSTANTS);
});

def(_, 'add', function(C)
{
  needObj(C, 'C.add() requires an object');
  CONSTANTS.push(core.obj.lock(C));
  return C;
});
