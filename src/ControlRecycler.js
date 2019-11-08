import { clone } from 'object-agent';
import { applySettings, methodFunction, methodObject } from 'type-enforcer-ui';

const VISIBLE_CONTROLS = Symbol();
const DISCARDED_CONTROLS = Symbol();
const DISCARD = Symbol();

/**
 * Instead of creating and destroying controls in rapid succession, recycle them!
 *
 * @class ControlRecycler
 * @constructor
 */
export default class ControlRecycler {
	constructor(settings = {}) {
		this[VISIBLE_CONTROLS] = [];
		this[DISCARDED_CONTROLS] = [];
		applySettings(this, settings);
	}

	/**
	 * Discard a control at a specific index of visibleControls.
	 * @function discardControl
	 * @arg {Number} index
	 * @arg {array} visibleControls
	 * @arg {array} discardedControls
	 */
	[DISCARD](index) {
		const control = this[VISIBLE_CONTROLS][index];

		if (control) {
			control.container(null);
			this[DISCARDED_CONTROLS].push(control);
			this[VISIBLE_CONTROLS].splice(index, 1);
		}
	}
}

Object.assign(ControlRecycler.prototype, {
	/**
	 * @method control
	 * @member module:ControlRecycler
	 * @instance
	 * @arg {constructor} [newControl]
	 * @returns {constructor|this}
	 */
	control: methodFunction({
		bind: false
	}),

	/**
	 * @method defaultSettings
	 * @member module:ControlRecycler
	 * @instance
	 * @arg {Object} [newDefaultSettings]
	 * @returns {Object|this}
	 */
	defaultSettings: methodObject({
		other: undefined
	}),

	/**
	 * If there are discarded controls available then return one of those, otherwise instantiate a new control.
	 * @method getRecycledControl
	 * @member module:ControlRecycler
	 * @instance
	 * @arg   {Boolean} [doPrepend=false]
	 * @returns {Object}
	 */
	getRecycledControl(doPrepend) {
		let control;
		const Control = this.control();

		if (Control) {
			control = this[DISCARDED_CONTROLS].shift() || new Control(clone(this.defaultSettings()));

			if (doPrepend) {
				this[VISIBLE_CONTROLS].unshift(control);
			}
			else {
				this[VISIBLE_CONTROLS].push(control);
			}

			return control;
		}
	},

	/**
	 * Get a visible control with a specific id
	 * @method getControl
	 * @member module:ControlRecycler
	 * @instance
	 * @arg {String} [id]
	 * @returns {Object}
	 */
	getControl(id) {
		return this[VISIBLE_CONTROLS].find((control) => control.id() === id);
	},

	/**
	 * Get an Array of all the visible controls
	 * @method getRenderedControls
	 * @member module:ControlRecycler
	 * @instance
	 * @returns {Object[]}
	 */
	getRenderedControls() {
		return this[VISIBLE_CONTROLS];
	},

	/**
	 * Calls a callback for each rendered control
	 * @method each
	 * @member module:ControlRecycler
	 * @instance
	 * @arg {Function} [callback] - provides a reference to the control and the index
	 * @returns {Object[]}
	 */
	each(callback) {
		this[VISIBLE_CONTROLS].forEach(callback);
	},

	/**
	 * Calls a callback for each rendered control, returns the resulting array
	 *
	 * @method map
	 * @member module:ControlRecycler
	 * @instance
	 *
	 * @arg {Function} [callback] - provides a reference to the control and the index
	 *
	 * @returns {Object[]}
	 */
	map(callback) {
		return this[VISIBLE_CONTROLS].map(callback);
	},

	/**
	 * Discard a control that matches a specific id
	 * @method discardControl
	 * @member module:ControlRecycler
	 * @instance
	 * @arg {String} [id]
	 */
	discardControl(id) {
		this[DISCARD](this[VISIBLE_CONTROLS].findIndex((control) => control.id() === id));
	},

	/**
	 * Discard all the controls that are currently visible.
	 * @method discardAllControls
	 * @member module:ControlRecycler
	 * @instance
	 */
	discardAllControls() {
		while (this[VISIBLE_CONTROLS].length > 0) {
			this[DISCARD](0);
		}
	},

	/**
	 * Get a reference to a control at a specific offset.
	 *
	 * @method getControlAtOffset
	 * @member module:ControlRecycler
	 * @instance
	 *
	 * @arg {Number} [controlOffset]
	 * @arg {Boolean} [canCreateNew=false]
	 *
	 * @returns {Object}
	 */
	getControlAtOffset(controlOffset, canCreateNew = false) {
		let control = this[VISIBLE_CONTROLS][controlOffset];

		if (!control && canCreateNew) {
			control = this.getRecycledControl();
		}

		return control;
	},

	/**
	 * Gets the total number of controls that are currently visible.
	 * @method totalVisibleControls
	 * @member module:ControlRecycler
	 * @instance
	 * @returns {Number}
	 */
	totalVisibleControls() {
		return this[VISIBLE_CONTROLS].length;
	},

	/**
	 * Prepares itself for deletion and removes all the controls it contains
	 * @method remove
	 * @member module:ControlRecycler
	 * @instance
	 */
	remove() {
		this[DISCARDED_CONTROLS].forEach((control) => control.remove());
		this[VISIBLE_CONTROLS].forEach((control) => control.remove());
		this[DISCARDED_CONTROLS].length = 0;
		this[VISIBLE_CONTROLS].length = 0;
	}
});
