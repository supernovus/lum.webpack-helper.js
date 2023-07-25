const Section = require('./section');

/**
 * An abstract class for special property objects that offer convenient
 * ways to set common configuration settings in a statement-like manner.
 * 
 * @exports module:@lumjs/webpack-helper/statement
 * @property {module:@lumjs/webpack-helper} top - Parent helper instance
 */

class Statement extends Section
{
  /**
   * Generic constructor for any Statement classes.
   * @param {module:@lumjs/webpack-helper} helper - Parent helper instance
   */
  constructor(helper)
  {
    super();
    this.def('top', {value: helper});
  }

  static new(helper)
  {
    return new this(helper);
  }
}

module.exports = Statement;
