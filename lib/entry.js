const Statement = require('./statement');
const core = require('@lumjs/core');
const {S,isObj,isArray} = core.types;
const MAIN = 'main';
const ENT = 'entry';

const ENT_PROPS = 
[
  'dependOn', 'filename', 'import', 'library', 'runtime', 'publicPath',
];

/**
 * A helper for defining entries.
 * @exports module:@lumjs/webpack-helper/entry
 */

class Entry extends Statement
{
  _src(name, opts)
  {
    const filename = opts.src ?? name+'.js';
    return this.top.src(filename);
  }

  // Low level function with no type checking or otherwise.
  define(name, entry)
  {
    return this.set([ENT, name], entry);
  }

  exists(name)
  {
    return this.get([ENT, name]);
  }

  addFile(name, opts={})
  {
    const filepath = this._src(name, opts);
    return this.define(name, filepath);
  }

  get explicit()
  {
    this.$useMain = false;
    this.$noCheck = true;
    return this;
  }

  setMain(opts={})
  {
    if (this.$useMain === undefined)
    { // We want implicit dependencies on the main chunk.
      this.$useMain = true;
    }
    
    if (typeof opts === S)
    { // A shortcut for setting the main source.
      opts = {src: main};
    }
    return this.addFile(MAIN, opts);
  }

  get withMain() 
  { 
    return this.setMain(); 
  }

  get count()
  {
    const entries = this.get(ENT);
    if (isObj(entries))
    { // Get the number of entries.
      return Object.keys(entries).length;
    }
    // No entries found.
    return 0;
  }

  add(name, opts={})
  {
    const entry = {};
    for (const prop of ENT_PROPS)
    { // Copy known entity properties from the options.
      entry[prop] = opts[prop];
    }

    if (!entry.import)
    { // No import property.
      const filepath = this._src(name, opts);
      entry.import = filepath;
    }

    if (this.$useMain)
    {
      if (typeof entry.dependOn === S)
      { // A single dependency listed currently.
        if (entry.dependOn !== MAIN)
        { // Convert it into an array with MAIN added.
          entry.dependOn = [MAIN, entry.dependOn];
        }
      }
      else if (isArray(entry.dependOn))
      { // It's already an array.
        if (!entry.dependOn.includes(MAIN))
        { // Add main to the front of the list.
          entry.dependOn.unshift(MAIN);
        }
      }
      else 
      {
        entry.dependOn = MAIN;
      }
    }

    if (!this.$noCheck && this.count > 0)
    { // If there's already an entry, use a single runtime for all of them.
      this.top.output.singleRuntime;
    }

    return this.define(name, entry);
  }

}

module.exports = Entry;
