const core = require('@lumjs/core');
const {S,isObj,nonEmptyArray,def} = core.types;
const {getObjectPath, setObjectPath} = core.obj.ns;

/**
 * Abstract class for various sub-sections of the configuration.
 */
class Section
{
  constructor()
  {
    def(this, 'def', def(this)); // Try saying that fast ten times…
  }

  ns(prop)
  {
    const ns = this.$ns;
    if (ns)
    {
      if (typeof prop === S)
      { // Prepend our namespace to the string.
        prop = ns+'.'+prop;
      }
      else if (nonEmptyArray(prop))
      { // Ditto, but to an array.
        prop.unshift(ns);
      }
      else if (!prop)
      { // An empty property name means use our namespace.
        prop = ns;
      }
    }
    console.debug('ns()', {prop, ns, section: this});
    return prop;
  }

  get conf()
  {
    if (isObj(this.$conf)) 
    { // We have explicit conf data.
      return this.$conf;
    }
    else if (this.top instanceof Section)
    { // Use the top-level conf data.
      return this.top.conf;
    }
    else
    {
      throw new Error("Could not find conf for section");
    }
  }

  set(prop, value, opts={})
  {
    opts.assign = true;
    opts.value = value;
    console.debug(".set()", {prop, opts, conf: this.conf, section: this});
    setObjectPath(this.conf, this.ns(prop), opts);
    return this;
  }

  get(prop, opts={})
  {
    console.debug(".get()", {prop, opts, conf: this.conf, section: this});
    return getObjectPath(this.conf, this.ns(prop), opts);
  }

  get C() 
  {
    if (this.top instanceof Section)
    {
      return this.top.C;
    }
    else
    {
      throw new Error('Cannot use default .C on child sections');
    }
  }

}

module.exports = Section;
