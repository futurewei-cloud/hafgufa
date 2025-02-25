import { erase, set } from 'object-agent';
import {
	applySettings,
	AUTO,
	enforceBoolean,
	enforceCssSize,
	HUNDRED_PERCENT,
	isArray,
	isString,
	methodAny,
	methodArray,
	methodBoolean,
	methodFunction,
	methodString,
	PIXELS
} from 'type-enforcer-ui';
import controlTypes from '../controlTypes';
import Heading from '../elements/Heading';
import VirtualList from '../layout/VirtualList';
import FocusMixin from '../mixins/FocusMixin';
import { ABSOLUTE, EMPTY_STRING, PADDING_LEFT, POSITION } from '../utility/domConstants';
import FormControl from './FormControl';

const ROW_WIDTH_BUFFER_RATIO = 1.1;
const AVERAGE_CHARACTER_WIDTH = 8;
const INDENT_PIXELS = 24;

const VIRTUAL_LIST = Symbol();
const EXPANDED_BRANCHES = Symbol();
const SHOW_EXPANDERS = Symbol();
const SHOW_CHECKBOXES = Symbol();
const SHOW_CHECKBOXES_ON_GROUPS = Symbol();

const renderRow = Symbol();
const processBranches = Symbol();
const preMeasureRowWidth = Symbol();
const toggleSelected = Symbol();
const toggleExpanded = Symbol();

/**
 * A tree control.
 *
 * @class Tree
 * @extends FormControl
 * @mixes FocusMixin
 * @constructor
 *
 * @param {Object} settings
 */
export default class Tree extends FocusMixin(FormControl) {
	constructor(settings = {}) {
		let self;
		let virtualList = new VirtualList({
			height: settings.height ? HUNDRED_PERCENT : AUTO,
			width: HUNDRED_PERCENT,
			minWidth: settings.minWidth,
			maxWidth: settings.maxWidth,
			itemControl: Heading,
			itemDefaultSettings: {
				onExpand() {
					self[toggleExpanded](this);
				},
				isFocusable: true
			},
			onItemRender(heading, branchData) {
				self[renderRow](heading, branchData);
			},
			isFocusable: true
		});

		settings.type = settings.type || controlTypes.TREE;
		settings.width = enforceCssSize(settings.width, HUNDRED_PERCENT, true);
		settings.contentContainer = virtualList;
		settings.FocusMixin = settings.FocusMixin || {};
		settings.FocusMixin.mainControl = virtualList;

		super(settings);

		self = this;
		self.addClass('tree');

		self[VIRTUAL_LIST] = virtualList;
		self[EXPANDED_BRANCHES] = [];
		self[SHOW_EXPANDERS] = false;
		self[SHOW_CHECKBOXES] = false;
		self[SHOW_CHECKBOXES_ON_GROUPS] = false;

		self.onResize((width, height) => {
			virtualList
				.minWidth(self.minWidth())
				.maxWidth(self.maxWidth())
				.maxHeight(height);
		});

		applySettings(self, settings, ['width']);
	}

	/**
	 * Applies branch data to the appropriate methods on heading.
	 * @function renderRow
	 */
	[renderRow](heading, branchData) {
		const self = this;

		heading.removeClass(heading.classes())
			.addClass('heading')
			.isEnabled(heading.isEnabled(), true);

		if (heading.onSelect()) {
			heading.onSelect().discardAll();
			heading.onSelect(function() {
				self[toggleSelected](this);
			});
		}

		applySettings(heading, branchData);

		heading.isSelected(this.value().includes(branchData.id), true)
			.showExpander((!branchData.isExpandable && this[SHOW_CHECKBOXES_ON_GROUPS]) || (branchData.isExpandable && this[SHOW_EXPANDERS]))
			.showCheckbox((branchData.isExpandable && this[SHOW_CHECKBOXES_ON_GROUPS]) || (!branchData.isExpandable && this[SHOW_CHECKBOXES]));
	}

	/**
	 * Process the "value" data into something the virtual list control can consume
	 * @function processBranches
	 */
	[processBranches]() {
		const self = this;
		let branchWidth = 0;
		let longestWidth = 0;
		let branchWithLongestTitle;

		const processLevel = (branches, depth) => {
			let branchData;
			let output = [];

			for (let index = 0; index < branches.length; index++) {
				if (branches[index].isExpanded) {
					self[EXPANDED_BRANCHES].push(branches[index].id);
					erase(branches[index], 'isExpanded');
				}

				branchData = {
					icon: '',
					...branches[index],
					css: set({}, PADDING_LEFT, depth ? ((depth * INDENT_PIXELS) + PIXELS) : EMPTY_STRING),
					isSelectable: self.isMultiSelect() || enforceBoolean(branches[index].isSelectable, false),
					isExpandable: !!branches[index].children,
					isExpanded: self[EXPANDED_BRANCHES].includes(branches[index].id)
				};

				if (branchData.isExpandable) {
					self[SHOW_EXPANDERS] = true;
				}
				if (branchData.isSelectable) {
					self[SHOW_CHECKBOXES] = true;
				}
				if (branchData.isExpandable && branchData.isSelectable) {
					self[SHOW_CHECKBOXES_ON_GROUPS] = true;
				}

				branchWidth = (branchData.title.length * AVERAGE_CHARACTER_WIDTH);
				branchWidth += ((branchData.subTitle ? branchData.subTitle.length : 0) * AVERAGE_CHARACTER_WIDTH);
				branchWidth += ((branchData.level || 0) * INDENT_PIXELS);

				if (branchWidth > longestWidth) {
					longestWidth = branchWidth;
					branchWithLongestTitle = branchData;
				}

				output.push(branchData);

				if (branchData.isExpandable && branchData.isExpanded) {
					output = output.concat(processLevel(branches[index].children, depth + 1));
				}
			}

			return output;
		};

		self[SHOW_EXPANDERS] = false;
		self[SHOW_CHECKBOXES] = false;
		self[SHOW_CHECKBOXES_ON_GROUPS] = false;

		self[VIRTUAL_LIST].itemData(processLevel(self.branches(), 0));

		if (self.width().isAuto && branchWithLongestTitle) {
			self[preMeasureRowWidth](branchWithLongestTitle);
		}
	}

	/**
	 * Create a temporary branch control to measure the width.
	 * @function preMeasureRowWidth
	 */
	[preMeasureRowWidth](branchData) {
		const self = this;

		let tempBranchControl = new Heading({
			container: self,
			width: AUTO
		});
		let newWidth;

		tempBranchControl.css(POSITION, ABSOLUTE);
		self[renderRow](tempBranchControl, branchData);

		newWidth = tempBranchControl.borderWidth() * ROW_WIDTH_BUFFER_RATIO;
		self[VIRTUAL_LIST].width(newWidth);

		tempBranchControl.remove();
		tempBranchControl = null;
	}

	/**
	 * Callback function for when a branch is selected
	 * @function toggleSelected
	 */
	[toggleSelected](heading) {
		const self = this;

		if (self.onSelect()) {
			self.onSelect()(heading.id());
		}
		else {
			if (heading.showCheckbox() && heading.isSelectable()) {
				if (self.value().includes(heading.id())) {
					self.value(self.value().filter((item) => item !== heading.id()), true);
				}
				else {
					self.value(self.value().concat(heading.id()), true);
				}
			}
			else {
				self.value([heading.id()]);
			}
			self.triggerChange();
			if (self[VIRTUAL_LIST]) {
				self[VIRTUAL_LIST].refresh();
			}
		}
	}

	/**
	 * Callback function for when a branch is expanded
	 * @function toggleExpanded
	 */
	[toggleExpanded](heading) {
		const self = this;

		if (self[EXPANDED_BRANCHES].includes(heading.id())) {
			self[EXPANDED_BRANCHES] = self[EXPANDED_BRANCHES].filter((item) => item === heading.id());
		}
		else {
			self[EXPANDED_BRANCHES].push(heading.id());
		}
		self[processBranches]();
		if (self.onLayoutChange()) {
			self.onLayoutChange()();
		}
	}
}

Object.assign(Tree.prototype, {
	/**
	 * @method value
	 * @member module:Tree
	 * @instance
	 * @param {Array} [value]
	 * @returns {Array|this}
	 */
	value: methodAny({
		init: [],
		set(value) {
			const self = this;

			if (isString(value)) {
				self.value(value ? value.split(',') : []);
			}
			else if (!isArray(value)) {
				self.value([value]);
			}

			self[processBranches]();
			self[VIRTUAL_LIST].refresh();
		}
	}),

	/**
	 * Get or set the array of branch data objects
	 * @method branches
	 * @member module:Tree
	 * @instance
	 * @param {Array} branches
	 * @returns {Array|this}
	 */
	branches: methodArray({
		set: processBranches
	}),

	/**
	 * Get or set a function that gets called whenever the visible layout changes
	 * @method onLayoutChange
	 * @member module:Tree
	 * @instance
	 * @param {Function} onLayoutChange
	 * @returns {Function|this}
	 */
	onLayoutChange: methodFunction({
		other: undefined
	}),

	/**
	 * Get or set a function that gets called whenever a selectable branch is selected. If set then normal selection
	 * alogic is bypassed.
	 * @method onSelect
	 * @member module:Tree
	 * @instance
	 * @param {Function} onSelect
	 * @returns {Function|this}
	 */
	onSelect: methodFunction({
		other: undefined
	}),

	/**
	 * Set the height of the list to the height of the contents.
	 * @method fitHeightToContents
	 * @member module:VirtualList
	 * @instance
	 * @returns {this}
	 */
	fitHeightToContents() {
		const self = this;

		self[VIRTUAL_LIST].maxHeight(self.maxHeight());
		self[VIRTUAL_LIST].fitHeightToContents();
		self.height(self[VIRTUAL_LIST].borderHeight());
		self[VIRTUAL_LIST].refresh();

		return self;
	},

	emptyContentMessage: methodString({
		set(emptyContentMessage) {
			this[VIRTUAL_LIST].emptyContentMessage(emptyContentMessage);
		}
	}),

	isMultiSelect: methodBoolean({
		set: processBranches
	})
});
