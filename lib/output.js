const Statement = require('./statement');

/**
 * Some simple output conf setters.
 * @exports module:@lumjs/webpack-helper/output
 */
class OutputStatement extends Statement
{
  get $ns() { return 'output'; }

  get named()
  {
    return this.set('filename', '[name].js');
  }

  get clean()
  {
    return this.set('clean', true);
  }

  get byMode()
  {
    const O = this;
    const W = O.top;
    const C = W.C;
    const P = {};

    P[C.DEV]  = 'dev';
    P[C.PROD] = 'prod';

    W.on(C.WP, function(env, argv)
    {
      if (O.get('path') === undefined)
      {
        const mode = argv.mode ?? this.get('mode');
        const path = P[mode] ?? 'none';
        O.set('path', this.dest(path));
      }
    });

    return this;
  } // byMode

  get singleRuntime()
  {
    return this.top.set('optimization.runtimeChunk', 'single');
  }
}

module.exports = OutputStatement;
