// webpack-helper
const path = require('node:path');
const core = require('@lumjs/core');
const {F,S,O,needType,notNil,isObj,def} = core.types;
const {getObjectPath, setObjectPath} = core.obj.ns;

const C = core.obj.lock(
{
  DEV: 'development',
  PROD: 'production',
  WP: 'webpack',
});

/**
 * Webpack helper class.
 * 
 * Only meant for use inside `webpack.config.js` files.
 * Not for use in code outside of that purpose.
 * 
 * @exports module:@lumjs/webpack-helper
 */
class WebpackHelper
{
  /**
   * Build a WebpackHelper instance
   * 
   * @param {object} opts - Options
   * @param {string} opts.rootPath - The path to the project root folder.
   * You can use `__dirname` if `webpack.config.js` is in the project root.
   * All other path options refer to sub-folders inside the root folder.
   * 
   * @param {string} [opts.srcPath='src']   Sub-folder for source files.
   * @param {string} [opts.destPath='dist'] Sub-folder for output files.
   * @param {string} [opts.confPath='conf'] Sub-folder for config files.
   */
  constructor(opts)
  {
    needType(O, opts, 'opts must be an object');
    needType(S, opts.rootPath, 'Must specify a root path');

    // Add the observable API methods.
    core.observable(this);

    def(this, 'def', def(this)); // try saying that fast ten times…

    this.def('conf', {});
    this.def('opts', opts);
    this.def('C',    C);

    const ourStmts = {};
    const addStmt  = (newName) =>
    {
      const newStmt = require('./'+newName).new(this);
      this.def(newName, {value: newStmt});

      for (const oldName in ourStmts)
      {
        const oldStmt = ourStmts[oldName];
  
        if (oldStmt[newName] === undefined)
        {
          oldStmt.def(newName, {value: newStmt});
        }
  
        if (newStmt[oldName] === undefined)
        {
          newStmt.def(oldName, {value: oldStmt});
        }
      }

      ourStmts[newName] = newStmt;
    }

    addStmt('output');
    addStmt('entry');
  }

  path()
  {
    return path.resolve(this.opts.rootPath, ...arguments);
  }

  src() 
  {
    const src = this.opts.srcPath ?? 'src';
    return this.path(src, ...arguments);
  }

  dest()
  {
    const dest = this.opts.destPath ?? 'dist';
    return this.path(dest, ...arguments);
  }

  // Load a configuration module.
  // If it is a function, return the output of said function.
  config()
  {
    const cname = this.opts.confPath ?? 'conf';
    const cdata = require(this.path(cname, ...arguments));
    if (typeof cdata === F)
    {
      return cdata.call(this, this);
    }
    else
    {
      return cdata;
    } 
  }

  /**
   * Load a module defining sections of the Webpack config
   * 
   * @param {string} module - Sub-module to add to the config
   * 
   * Must be found inside the `confPath`.
   * 
   * If the `module.exports` is a function, it will be passed `this`
   * as the sole parameter, and may return a non-null configuration value,
   * or directly assign the `conf` values and return undefined/null.
   * 
   * Any non-null value other than a function will be assumed to be the
   * value to assign, and the `module` will be used as the property path.
   * 
   * @returns {object} `this`
   */
  load()
  { // Load more rules from a sub-config module.
    const confVal = this.config(...arguments);

    //console.debug("WPH.load()", {arguments, confVal});

    if (notNil(confVal))
    { // A config value was found, let's assign it.
      const ns = Array.from(arguments);
      this.set(ns, confVal);
    }

    return this;
  }

  /**
   * Load a plugin via configuration modules
   * 
   * @param {string} module - Sub-module defining the plugin
   * 
   * Must be found inside the `confPath`.
   * 
   * If the `module.exports` is a function, it will be passed `this`
   * as the sole parameter, and must return a valid plugin object instance.
   * 
   * If the `module.exports` is an object, it is assumed to be the
   * plugin instance itself.
   * 
   * No other module values will be considered valid.
   * 
   * @returns {object} `this`
   */
  plugin()
  {
    const plugin = this.config(...arguments);

    //console.debug("WPH.plugin()", {arguments, plugin});

    if (isObj(plugin))
    {
      if (!Array.isArray(this.conf.plugins))
      {
        this.conf.plugins = [];
      }

      this.conf.plugins.push(plugin);
    }
    else 
    {
      console.error("invalid plugin", arguments, this);
      throw new TypeError("Invalid plugin module found");
    }

    return this;
  }

  set(prop, value, opts={})
  {
    opts.assign = true;
    opts.value = value;
    setObjectPath(this.conf, prop, opts);
    //console.debug("WPH.set()", {prop, opts, conf: this.conf});
    return this;
  }

  get(prop, opts={})
  {
    return getObjectPath(this.conf, prop, opts);
  }

  /**
   * Return a function to be exported by the webpack.config.js module.
   */
  get fun()
  {
    const W = this;
    return function(env, argv)
    {
      W.trigger(C.WP, env, argv);
      return W.conf;
    }
  }

}

def(WebpackHelper, 'C', C);

module.exports = WebpackHelper;
