import shortid from 'shortid';
import {
	applySettings,
	AUTO,
	castArray,
	enforceArray,
	enforceCssSize,
	enforceInteger,
	HUNDRED_PERCENT,
	isArray,
	methodAny,
	methodArray,
	methodBoolean,
	methodEnum
} from 'type-enforcer-ui';
import ControlRecycler from '../ControlRecycler';
import controlTypes from '../controlTypes';
import Button from '../elements/Button';
import Div from '../elements/Div';
import FocusMixin from '../mixins/FocusMixin';
import { ORIENTATION } from '../uiConstants';
import { HEIGHT, TAB_INDEX, TAB_INDEX_DISABLED, TAB_INDEX_ENABLED, WIDTH } from '../utility/domConstants';
import MultiItemFocus from '../utility/MultiItemFocus';
import FormControl from './FormControl';
import './GroupedButtons.less';

const BUTTON_RECYCLER = Symbol();
const SHADOW_RECYCLER = Symbol();
const SHADOW_CONTAINER = Symbol();
const MULTI_ITEM_FOCUS = Symbol();

const onButtonClick = Symbol();
const getButtonWidthSetting = Symbol();
const buildButton = Symbol();
const setAllButtonToggles = Symbol();
const setGroupShadows = Symbol();
const setFocusIndex = Symbol();

/**
 * Visually groups buttons together
 *
 * @class GroupedButtons
 * @extends FormControl
 * @mixes FocusMixin
 * @constructor
 *
 * @arg {Object} settings - Accepts all control and FormControl options plus:
 */
export default class GroupedButtons extends FocusMixin(FormControl) {
	constructor(settings = {}) {
		let buttonContainer = new Div({
			classes: 'grouped-buttons-wrapper'
		});
		settings.type = settings.type || controlTypes.GROUPED_BUTTONS;
		settings.contentContainer = buttonContainer;
		settings.width = enforceCssSize(settings.width, AUTO, true);
		settings.FocusMixin = settings.FocusMixin || {};
		settings.FocusMixin.mainControl = buttonContainer;
		settings.FocusMixin.setFocus = () => {
			self[MULTI_ITEM_FOCUS].first();
		};
		settings.buttons = settings.buttons || [];

		super(settings);

		const self = this;
		self.addClass('grouped-buttons');

		self[SHADOW_CONTAINER] = new Div({
			container: self.contentContainer,
			classes: 'shadows'
		});

		self[MULTI_ITEM_FOCUS] = new MultiItemFocus(self.contentContainer)
			.onSetFocus((index) => {
				self[setFocusIndex](index);
			});

		self[BUTTON_RECYCLER] = new ControlRecycler()
			.control(Button)
			.defaultSettings({
				classes: 'form-button'
			});

		self[SHADOW_RECYCLER] = new ControlRecycler()
			.control(Div)
			.defaultSettings({
				classes: 'shadow'
			});

		applySettings(self, settings);

		self
			.onRemove(() => {
				self[MULTI_ITEM_FOCUS].remove();
			})
			.onResize(() => {
				const CURRENT_ORIENTATION = (self.orientation() === ORIENTATION.VERTICAL) ? WIDTH : HEIGHT;
				const CURRENT_ORIENTATION_READ = (CURRENT_ORIENTATION === WIDTH) ? 'borderWidth' : 'borderHeight';
				let maxSize = 0;

				self.contentContainer.css(CURRENT_ORIENTATION, AUTO);
				self[BUTTON_RECYCLER].each((control) => {
					maxSize = Math.max(maxSize, control[CURRENT_ORIENTATION_READ]());
				});
				if (CURRENT_ORIENTATION === WIDTH) {
					maxSize += self.contentContainer.paddingWidth;
				}
				else {
					maxSize += self.contentContainer.paddingHeight;
				}
				self.contentContainer.css(CURRENT_ORIENTATION, maxSize);
				self[setGroupShadows]();
			});
	}

	/**
	 * Button click callback. Manages selection state.
	 * @function onButtonClick
	 */
	[onButtonClick](button, event) {
		const self = this;
		let buttonData = self.buttons().find((item) => item.id === button.id());
		let currentValue;

		self[MULTI_ITEM_FOCUS].current(buttonData);

		if (!self.isMultiSelect()) {
			self.value(button.id());
			self[setAllButtonToggles]();
		}
		else {
			self.value(enforceArray(self.value(), []));
			currentValue = self.value();
			if (button.isSelected()) {
				currentValue.push(button.id());
			}
			else {
				currentValue.splice(currentValue.indexOf(button.id()), 1);
			}
			self.value(currentValue.reduce((result, item) => {
				if (!result.includes(item)) {
					result.push(item);
				}
				return result;
			}, []));
		}

		if (buttonData.onClick) {
			buttonData.onClick.call(button, event);
		}
		self.triggerChange();
	}

	/**
	 * Get the appropriate width for each button.
	 * @function getButtonWidthSetting
	 */
	[getButtonWidthSetting]() {
		return this.orientation() === ORIENTATION.VERTICAL ? HUNDRED_PERCENT : AUTO;
	}

	/**
	 * Build a single button and add it to the DOM at a specific location
	 * @function buildButton
	 */
	[buildButton](settings, doSaveData, insertIndex) {
		const self = this;
		const button = self[BUTTON_RECYCLER].getRecycledControl();
		const currentButtons = self.buttons();

		settings.id = settings.id ? settings.id.toString() : shortid.generate();

		applySettings(button, {
			...settings,
			container: self.contentContainer,
			isSelectable: self.isSelectable(),
			width: self[getButtonWidthSetting](),
			onClick(event) {
				self[onButtonClick](this, event);
			}
		});

		insertIndex = Math.min(enforceInteger(insertIndex, currentButtons.length), currentButtons.length);

		if (insertIndex < currentButtons.length) {
			self.contentContainer.insertAt(button, insertIndex + 1);
		}
		else {
			self.contentContainer.append(button);
		}

		if (doSaveData) {
			currentButtons.splice(insertIndex, 0, settings);
		}
		self[MULTI_ITEM_FOCUS].length(currentButtons.length);
	}

	/**
	 * Set the toggled state of all buttons based on the current value.
	 * @function setAllButtonToggles
	 */
	[setAllButtonToggles]() {
		const self = this;
		const currentValue = self.value() || [];
		let isChanged = false;
		let isSelected;

		self[BUTTON_RECYCLER].each((button, index) => {
			if (self.isMultiSelect()) {
				isSelected = currentValue.includes(button.id());
			}
			else {
				isSelected = currentValue === button.id();
			}

			if (button.isSelected() !== isSelected) {
				button.isSelected(isSelected);
				isChanged = true;
			}

			button.attr(TAB_INDEX, index === 0 ? TAB_INDEX_ENABLED : TAB_INDEX_DISABLED);
		});

		if (isChanged) {
			self.resize(true);
		}
	}

	[setGroupShadows]() {
		const self = this;
		const shadows = [];
		let control;
		const CURRENT_ORIENTATION = (self.orientation() === ORIENTATION.VERTICAL) ? WIDTH : HEIGHT;
		const CURRENT_ORIENTATION_READ = (CURRENT_ORIENTATION === WIDTH) ? 'borderHeight' : 'borderWidth';

		self.buttons().forEach((buttonData) => {
			control = self[BUTTON_RECYCLER].getControl(buttonData.id);
			const isSelected = control.isSelected();

			if (!shadows.length || shadows[shadows.length - 1].isSelected !== isSelected) {
				shadows.push({
					isSelected: isSelected,
					size: control[CURRENT_ORIENTATION_READ]()
				});
			}
			else {
				shadows[shadows.length - 1].size += control[CURRENT_ORIENTATION_READ]();
			}
		});

		self[SHADOW_RECYCLER].discardAllControls();
		shadows.forEach((shadow) => {
			self[SHADOW_RECYCLER].getRecycledControl()
				.container(self[SHADOW_CONTAINER])
				.width(CURRENT_ORIENTATION === HEIGHT ? shadow.size + 'px' : HUNDRED_PERCENT)
				.height(CURRENT_ORIENTATION === WIDTH ? shadow.size + 'px' : HUNDRED_PERCENT)
				.classes('shadow', !shadow.isSelected);
		});
	}

	/**
	 * Sets focus on the current focus Button
	 * @function setFocusIndex
	 */
	[setFocusIndex](index) {
		if (this.buttons().length >= index + 1) {
			this[BUTTON_RECYCLER].getControl(this.buttons()[index].id)
				.isFocused(true);
		}
	}
}

Object.assign(GroupedButtons.prototype, {
	/**
	 * @method value
	 * @member module:GroupedButtons
	 * @instance
	 * @arg {Array|String} [value]
	 * @returns {Array|String|this}
	 */
	value: methodAny({
		enforce(newValue) {
			if (this.isMultiSelect()) {
				return castArray(newValue);
			}

			return isArray(newValue) ? newValue[0] : newValue;
		},
		set: setAllButtonToggles
	}),

	/**
	 * Add a single button to this control
	 *
	 * @method addButton
	 * @member module:GroupedButtons
	 * @instance
	 *
	 * @arg {Object} buttonSettings
	 * @arg {Int}    [insertIndex]
	 *
	 * @returns {this}
	 */
	addButton(buttonSettings, insertIndex) {
		const self = this;

		if (buttonSettings) {
			self[buildButton](buttonSettings, true, insertIndex);
			self[setAllButtonToggles]();
		}

		return self;
	},

	/**
	 * Remove a single button from this control
	 *
	 * @method removeButton
	 * @member module:GroupedButtons
	 * @instance
	 * @arg {String} id
	 * @returns {this}
	 */
	removeButton(id) {
		const self = this;
		const buttons = self.buttons();

		self[BUTTON_RECYCLER].discardControl(id);
		buttons.splice(buttons.findIndex((button) => button.id === id), 1);
		self[setAllButtonToggles]();

		return self;
	},

	/**
	 * Remove all the buttons from this control
	 *
	 * @method removeAllButtons
	 * @member module:GroupedButtons
	 * @instance
	 * @returns {this}
	 */
	removeAllButtons() {
		return this.buttons([]);
	},

	/**
	 * Get a previously added button by id
	 *
	 * @method getButton
	 * @member module:GroupedButtons
	 * @instance
	 * @arg {String}    id
	 * @returns {Object}
	 */
	getButton(id) {
		return this[BUTTON_RECYCLER].getControl(id);
	},

	/**
	 * The buttons in this control.
	 *
	 * @method buttons
	 * @member module:GroupedButtons
	 * @instance
	 * @arg {Array} [buttons]
	 * @returns {Array|this}
	 */
	buttons: methodArray({
		set(buttons) {
			const self = this;

			self[BUTTON_RECYCLER].discardAllControls();
			buttons.forEach((button) => self[buildButton](button, false));
			self[setAllButtonToggles]();
		}
	}),

	/**
	 * Gets the total number of rendered buttons in this control
	 *
	 * @method totalButtons
	 * @member module:GroupedButtons
	 * @instance
	 * @returns {Int}
	 */
	totalButtons() {
		return this.buttons().length;
	},

	/**
	 * Determines whether the buttons in this control can be toggled.
	 * If false then buttons do not maintain state, this control will have no value,
	 * but each button will still fire click callbacks.
	 *
	 * @method isSelectable
	 * @member module:GroupedButtons
	 * @instance
	 * @arg {Boolean} [isSelectable]
	 * @returns {Boolean|this}
	 */
	isSelectable: methodBoolean({
		init: true,
		set(isSelectable) {
			this[BUTTON_RECYCLER].each((control) => {
				control.isSelectable(isSelectable);
			});
		}
	}),

	/**
	 * Determines whether multiple buttons can be toggled at the same time or not.
	 *
	 * @method isMultiSelect
	 * @member module:GroupedButtons
	 * @instance
	 * @arg {Boolean} [isMultiSelect]
	 * @returns {Boolean|this}
	 */
	isMultiSelect: methodBoolean({
		set() {
			this.value(this.value());
		}
	}),

	/**
	 * The layout direction of the buttons. Use GroupedButtons.ORIENTATION to set.
	 *
	 * @method orientation
	 * @member module:GroupedButtons
	 * @instance
	 * @arg {String} [orientation]
	 * @returns {String|this}
	 */
	orientation: methodEnum({
		init: ORIENTATION.HORIZONTAL,
		enum: ORIENTATION,
		set(newValue) {
			const self = this;

			self.classes('vertical', newValue === ORIENTATION.VERTICAL);
			self[BUTTON_RECYCLER].each((control) => {
				control.width(self[getButtonWidthSetting]());
			});
		}
	})
});

GroupedButtons.ORIENTATION = ORIENTATION;
