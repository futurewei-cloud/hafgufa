import { debounce } from 'async-agent';
import { deepEqual } from 'object-agent';
import {
	enforceBoolean,
	enforceCssSize,
	enforceInteger,
	HUNDRED_PERCENT,
	methodBoolean,
	methodInteger,
	methodObject,
	methodQueue
} from 'type-enforcer-ui';
import Control from '../Control';
import ControlHeadingMixin from '../mixins/ControlHeadingMixin';
import './FormControl.less';
import formRelationships from './formRelationships';

const CURRENT_VALUE = Symbol();
const RELATIONSHIP_ID = Symbol();
const ON_CHANGE = Symbol();

/**
 * Code used by most form controls.
 *
 * @class FormControl
 * @extends Control
 * @constructor
 *
 * @arg {Object} type
 * @arg {Object} settings
 */
export default class FormControl extends ControlHeadingMixin(Control) {
	constructor(settings = {}) {
		settings.width = enforceCssSize(settings.width, HUNDRED_PERCENT, true);
		settings.changeDelay = enforceInteger(settings.changeDelay, 0);

		super(settings);

		const self = this;

		if (!settings.element) {
			self.addClass('form-control');
		}

		self[RELATIONSHIP_ID] = formRelationships.add({
			control: self,
			controlId: self.id(),
			relationships: settings.relationships
		});

		self.onRemove(() => {
			if (self[ON_CHANGE]) {
				self[ON_CHANGE].clear();
			}
			formRelationships.remove(self[RELATIONSHIP_ID]);
		});
	}

	/**
	 * Trigger an onChange event.
	 *
	 * @method triggerChange
	 * @member module:FormControlBase
	 * @instance
	 *
	 * @params [ignoreDelay=false]
	 * @params [skipCallback=false]
	 * @params [isHardTrigger=true]
	 */
	triggerChange(ignoreDelay, skipCallback, isHardTrigger = true) {
		const self = this;

		if (!self.isRemoved) {
			isHardTrigger = enforceBoolean(isHardTrigger, true);

			if ((isHardTrigger || (self.value && !deepEqual(self[CURRENT_VALUE], self.value()))) && self.onChange().length) {
				self[ON_CHANGE](skipCallback);

				if (ignoreDelay || !self.changeDelay()) {
					self[ON_CHANGE].flush();
				}
			}

			formRelationships.trigger();
		}

		return self;
	}

	/**
	 * Updates a previously set relationship. See {@link module:formRelationships#update}
	 *
	 * @method updateRelationship
	 * @member module:FormControlBase
	 * @instance
	 *
	 * @arg {Object} updateObject
	 */
	updateRelationship(updateObject) {
		if (arguments.length) {
			formRelationships.update(self[RELATIONSHIP_ID], updateObject);
		}
	}
}

Object.assign(FormControl.prototype, {
	/**
	 * Changes the view of the title to express whether this control is required or not.
	 *
	 * @method isRequired
	 * @member module:FormControlBase
	 * @instance
	 *
	 * @arg   {Boolean} [isRequired]
	 *
	 * @returns {Boolean|this}
	 */
	isRequired: methodBoolean({
		set(isRequired) {
			this.classes('required', isRequired);
		}
	}),

	data: methodObject({
		init: {}
	}),

	/**
	 * Change the delay for the onChange callback.
	 *
	 * @method changeDelay
	 * @member module:FormControlBase
	 * @instance
	 *
	 * @arg   {int} newDelay - Milliseconds
	 *
	 * @returns {int|this}
	 */
	changeDelay: methodInteger({
		min: 0,
		set(changeDelay) {
			this[ON_CHANGE] = debounce(function(skipCallback) {
				const self = this;

				self[CURRENT_VALUE] = self.value();

				if (!skipCallback) {
					self.onChange()
						.trigger(null, [self[CURRENT_VALUE]]);
				}
			}, changeDelay, {
				maxWait: 15000
			});
		}
	}),

	newline: methodBoolean({
		set(newline) {
			this.classes('newline', newline);
		}
	}),

	/**
	 * Determines when to fire the settings.onChange callback. Parent should call this whenever content changes. There
	 * is a 200ms delay so that fast typers don't fire of an excessive amount of callbacks. Also, if a fast typer keeps
	 * going for a long period of time, then onChange will be triggered every 15 seconds.
	 *
	 * @method onChange
	 * @member module:FormControlBase
	 * @instance
	 *
	 * @arg {function} [callback]
	 *
	 * @returns {queue}
	 */
	onChange: methodQueue()
});
