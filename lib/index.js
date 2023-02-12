// webpack-helper
const path = require('node:path');
const core = require('@lumjs/core');
const {F,S,O,needType,notNil,def} = core.types;
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

    this.def('output', {value: require('./output').new(this)});
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

  /**
   * Load modules defining sections of the Webpack config
   * 
   * @param {...string} module - Sub-module to add to the config
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
  add()
  { // Load more rules from a sub-config module.
    const conf = this.opts.confPath ?? 'conf';
    const mod = require(this.path(conf, ...arguments));
    let ret;

    if (typeof mod === F)
    { // If it's a function, call it, passing `this` as the sole argument.
      ret = mod.call(this, this);
    }
    else 
    { // Anything else is the value to assign.
      ret = mod;
    }

    if (notNil(ret))
    { // A config value was found, let's assign it.
      const ns = Array.from(arguments);
      this.set(ns, ret);
    }

    return this;
  }

  set(prop, value, opts={})
  {
    opts.value = value;
    setObjectPath(this.conf, prop, opts);
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
      W.trigger('webpack', env, argv);
      return W.conf;
    }
  }

}

def(WebpackHelper, 'C', C);

module.exports = WebpackHelper;
