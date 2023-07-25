const Section = require('./section'),
      Statement = require('./statement'),
      $C = require('./constants'),
      core = require('@lumjs/core');
const {needType,F,B,S,isArray,isNil,notNil} = core.types;

const C = $C.add(
{
  RES: 'asset/resource',
  TEST:
  {
    CSS:   /\.css$/i,
    SASS:  /\.s[ac]ss/i,
    IMGS:  /\.(jpe?g|png|webp|heic|heif|gif|jif?f)$/i,
  },
  USE:
  {
    CSS: 'css-loader',
    SASS: 'sass-loader',
    STYLE: 'style-loader',
  }
});

function getArray(obj, prop)
{
  let val = obj.get(prop);
  if (isNil(val))
  { // No rules yet, let's change that.
    val = [];
    obj.set(prop, val);
  }
  else if (!isArray(val))
  { // That's not valid.
    console.error({obj, prop, val});
    throw new TypeError('getArray found a non-array property');
  }
  return val;
}

function addRule(obj, rule, opts={})
{
  const prop = opts.prop ?? 'rules';
  const rules = getArray(obj, prop);

  //console.debug('addRule()', {obj, rule, opts, prop, rules});

  if (rule instanceof RegExp)
  { // A regexp is assumed to be the 'test'.
    rule = {test: rule};
  }

  rules.push(rule);
  return new ModuleRule(obj, rule);
}

/**
 * Simple module rule helpers.
 * @exports module:@lumjs/webpack-helper/modulerules
 */
class ModuleStatement extends Statement
{
  get $ns() { return 'module'; }

  add(rule, opts={}) 
  {
    return addRule(this, rule, opts); 
  }

  oneOf(rule, opts={})
  {
    opts.prop = 'oneOf';
    return this.add(rule, opts);
  }

  noParse(val)
  {
    return this.set('noParse', val);
  }

  CSS(outfile)
  {
    const rule = this.add(C.TEST.CSS);

    if (typeof outfile === S)
    {
      rule.type(C.RES);
      this.set('generator.filename', outfile);
    }
    else
    {
      rule.use(C.USE.STYLE, C.USE.CSS);
    }

    return rule;
  }

  get css()
  {
    return this.CSS();
  }

  SASS(outfile)
  {
    const rule = this.add(C.TEST.SASS);

    if (typeof outfile === S)
    {
      rule.type(C.RES);
      this.set('generator.filename', outfile);
      rule.use(C.USE.SASS);
    }
    else
    {
      rule.use(C.USE.STYLE, C.USE.CSS, C.USE.SASS);
    }

    return rule;
  }

  get sass()
  {
    return this.SASS();
  }

  get images()
  {
    return this.add(C.TEST.IMGS);
  }

  get extractImages()
  {
    const rule = this.images;
    rule.type(C.RES);
    return rule;
  }

} // ModuleStatement

class ModuleRule extends Section
{
  constructor(parent, conf)
  {
    super();

    this.def('parent', parent);
    
    const module = (parent instanceof ModuleStatement)
      ? parent
      : parent.module;

    this.def('module', {value: module});
    this.def('top',    {value: module.top});
    this.def('$conf',  conf);
  }

  get top() { return this.module.top; }

  add(rule, opts={}) 
  { 
    const obj = opts.nested ? this : this.parent;
    return addRule(obj, rule, opts); 
  }

  nested(rule, opts={})
  {
    opts.nested = true;
    return this.add(rule, opts);
  }

  oneOf(rule, opts={})
  {
    opts.prop = 'oneOf';
    if (typeof opts.nested !== B) opts.nested = true;
    return this.add(rule, opts);
  }

  use(...vals)
  {
    const uses = getArray(this, 'use');
    for (const newVal of vals)
    {
      uses.push(newVal);
    }
    return this;
  }

  useFunction(fn)
  {
    needType(F, fn, 'useFunction must be passed a function');

    const oldVal = this.get('use');
    if (notNil(oldVal))
    { // An array-style 'use' property has already been defined.
      console.error({rule: this, fn, oldVal});
      throw new TypeError("Cannot assign 'use' function over existing value");
    }

    this.set('use', fn);
  }

  type(type)
  {
    return this.set('type', type);
  }

} // ModuleRule

ModuleStatement.Rule = ModuleRule;

module.exports = ModuleStatement;
