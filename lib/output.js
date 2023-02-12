const Statement = require('./statement');

/**
 * Some simple output conf setters.
 * @exports module:@lumjs/webpack-helper/output
 */

class Output extends Statement
{
  get named()
  {
    return this.set('output.filename', '[name].js');
  }

  get clean()
  {
    return this.set('output.clean', true);
  }

  get byMode()
  {
    const W = this.top;
    const C = W.C;
    const P = {};

    P[C.DEV] = 'dev';
    P[C.PROD] = 'prod';

    W.on(C.WP, function(env, argv)
    {
      if (this.get('output.path') === undefined)
      {
        const mode = argv.mode ?? this.get('mode');
        const path = P[mode] ?? 'none';
        W.set('output.path', this.dest(path));
      }
    });

    return this;
  } // byMode
}

module.exports = Output;
