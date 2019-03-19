import { method } from 'type-enforcer';
import dom from '../../utility/dom';
import { ANCHOR } from '../../utility/domConstants';
import objectHelper from '../../utility/objectHelper';
import Control from '../Control';
import controlTypes from '../controlTypes';
import OnClickMixin from '../mixins/OnClickMixin';
import './Hyperlink.less';

/**
 * <p>Display an anchor element.</p>
 *
 * @module Hyperlink
 * @extends ControlBase
 * @constructor
 *
 * @param {Object} settings
 * @param {String} [settings.text]
 */
export default class Hyperlink extends OnClickMixin(Control) {
	constructor(settings = {}) {
		settings.element = dom.buildNew('', ANCHOR);

		super(controlTypes.HYPERLINK, settings);

		objectHelper.applySettings(this, settings);
	}
}

Object.assign(Hyperlink.prototype, {
	/**
	 * The displayed text. This is automatically set to the url when the url is set.
	 *
	 * @method text
	 * @member module:Hyperlink
	 * @instance
	 *
	 * @param {string|element} content
	 *
	 * @returns {string|element|this}
	 */
	text: method.string({
		set: function(text) {
			dom.content(this, text || this.url());
		}
	})
});
