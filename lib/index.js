// webpack-helper
const path = require('node:path'),
      core = require('@lumjs/core'),
      Section = require('./section'),
      Statement = require('./statement'),
      $C = require('./constants');
const {F,S,needType,needObj,notNil,isObj} = core.types;

const C = $C.add(
{
  DEV:  'development',
  PROD: 'production',
  WP:   'webpack',
  SRC:  'src',
  DIST: 'dist',
});

/**
 * Webpack helper class.
 * 
 * Only meant for use inside `webpack.config.js` files.
 * Not for use in code outside of that purpose.
 * 
 * @exports module:@lumjs/webpack-helper
 */
class WebpackHelper extends Section
{
  /**
   * Build a WebpackHelper instance
   * 
   * @param {object} opts - Options
   * @param {string} opts.rootPath - The path to the project root folder.
   * You can use `__dirname` if `webpack.config.js` is in the project root.
   * All other path options refer to sub-folders inside the root folder.
   * 
   * @param {string} [opts.srcPath='src']      Sub-folder for source files.
   * @param {string} [opts.destPath='dist']    Sub-folder for output files.
   * @param {string} [opts.confPath='webpack'] Sub-folder for config files.
   */
  constructor(opts)
  {
    super();

    needObj(opts, 'opts must be an object');
    needType(S, opts.rootPath, 'Must specify a root path');

    // Add the observable API methods.
    core.observable(this);

    this.def('$conf',  {}); // Underlying config structure.
    this.def('$stmts', {}); // Statement object instances.

    this.def('opts', opts);

    // Shortcut for adding built-in statements.
    const addStmt = (libName, propName=libName) =>
    {
      const stmt = require('./'+libName);
      this.addStatement(propName, stmt);
    }

    addStmt('output');
    addStmt('entry');
    addStmt('modulerules', 'module');
  }

  addStatement(newName, stmt)
  {
    if (typeof stmt === F)
    { // It's a constructor.
      stmt = new stmt(this);
    }
    else if (!(stmt instanceof Statement))
    {
      console.error({name: newName, stmt, helper: this});
      throw new TypeError("Invalid statement");
    }

    this.def(newName, {value: stmt});
    const ourStmts = this.$stmts;

    for (const oldName in ourStmts)
    {
      const oldStmt = ourStmts[oldName];

      if (oldStmt[newName] === undefined)
      {
        oldStmt.def(newName, {value: stmt});
      }

      if (stmt[oldName] === undefined)
      {
        stmt.def(oldName, {value: oldStmt});
      }
    }

    ourStmts[newName] = stmt;
    return this;
  }

  path()
  {
    return path.resolve(this.opts.rootPath, ...arguments);
  }

  src() 
  {
    const src = this.opts.srcPath ?? C.SRC;
    return this.path(src, ...arguments);
  }

  dest()
  {
    const dest = this.opts.destPath ?? C.DIST;
    return this.path(dest, ...arguments);
  }

  // Load a configuration module.
  // If it is a function, return the output of said function.
  config()
  {
    const cname = this.opts.confPath ?? C.WP;
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

  get C() { return $C.get(); }

  static get C() { return $C.get(); }

}

module.exports = WebpackHelper;
