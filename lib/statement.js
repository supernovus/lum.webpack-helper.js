/**
 * An abstract class for special property objects that offer convenient
 * ways to set common configuration settings in a statement-like manner.
 * 
 * @exports module:@lumjs/webpack-helper/statement
 * @property {module:@lumjs/webpack-helper} top - Parent helper instance
 */

class Statement
{
  /**
   * Generic constructor for any Statement classes.
   * @param {module:@lumjs/webpack-helper} helper - Parent helper instance
   */
  constructor(helper)
  {
    this.top = helper;
  }

  set()
  {
    this.top.set(...arguments)
    return this;
  }

  get()
  {
    return this.top.get(...arguments);
  }

  static new(helper)
  {
    return new this(helper);
  }
}

module.exports = Statement;
