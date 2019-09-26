import { event } from 'd3';
import shortid from 'shortid';
import { applySettings, method, Point } from 'type-enforcer';
import ControlRecycler from '../ControlRecycler';
import controlTypes from '../controlTypes';
import { DELETE_ALL_ICON, DELETE_ICON } from '../icons';
import ContextMenuMixin from '../mixins/ContextMenuMixin';
import Svg from '../svg/Svg';
import EditRectangle from './EditRectangle';
import './VectorEditor.less';

const HEIGHT = Symbol();
const WIDTH = Symbol();
const START = Symbol();
const CURRENT_SHAPE = Symbol();
const CONTROLS = Symbol();
const VALUE = Symbol();

const pixelsToRatios = Symbol();
const ratiosToPixels = Symbol();

const startDrawing = Symbol();
const updateDrawing = Symbol();
const stopDrawing = Symbol();

export default class VectorEditor extends ContextMenuMixin(Svg) {
	constructor(settings = {}) {
		settings.type = settings.type || controlTypes.VECTOR_EDITOR;

		super(settings);

		const self = this;
		self[VALUE] = [];
		self.addClass('vector-editor');

		self[CONTROLS] = new ControlRecycler({
			control: EditRectangle,
			defaultSettings: {
				container: self,
				onChange() {
					self.onChange().call(self, this.id(), self[pixelsToRatios](this.bounds()));
				}
			}
		});

		self.contextMenu([{
			id: 'deleteAll',
			title: 'Delete all',
			icon: DELETE_ALL_ICON,
			onSelect() {
				self.onDeleteAllShapes().call(self);
			}
		}]);

		self.onResize((width, height) => {
			self[HEIGHT] = height;
			self[WIDTH] = width;

			self[CONTROLS].each((control) => {
				if (control.originalBounds) {
					control.bounds(self[ratiosToPixels](control.originalBounds));
				}
			});
		})
			.on('mousedown', () => {
				event.preventDefault();
				event.stopPropagation();
				self[startDrawing]();

				self.on('mousemove', () => {
					event.preventDefault();
					event.stopPropagation();
					self[updateDrawing]();
				})
					.on('mouseup', () => {
						event.preventDefault();
						event.stopPropagation();
						self[stopDrawing]();

						self.off('mousemove')
							.off('mouseup');
					});
			});

		applySettings(self, settings);

		self.resize();
	}

	[pixelsToRatios](value) {
		const self = this;

		return [new Point(value[0].x / self[WIDTH], value[0].y / self[HEIGHT]),
			new Point(value[1].x / self[WIDTH], value[1].y / self[HEIGHT])];
	}

	[ratiosToPixels](value) {
		const self = this;

		return [new Point(value[0].x * self[WIDTH], value[0].y * self[HEIGHT]),
			new Point(value[1].x * self[WIDTH], value[1].y * self[HEIGHT])];
	}

	[startDrawing]() {
		const self = this;

		self[CONTROLS].each((control) => {
			control.ignore(true);
		});

		self[START] = new Point(event.offsetX, event.offsetY);

		self[CURRENT_SHAPE] = self[CONTROLS].getRecycledControl();
		self[CURRENT_SHAPE].originalBounds = null;
		self[CURRENT_SHAPE]
			.container(self)
			.isFocused(true)
			.id(shortid.generate());

		self[updateDrawing]();
	}

	[updateDrawing]() {
		const self = this;

		self[CURRENT_SHAPE]
			.bounds([{
				x: event.offsetX,
				y: event.offsetY
			}, self[START]]);
	}

	[stopDrawing]() {
		const self = this;

		if (self[CURRENT_SHAPE].borderWidth() < 10 && self[CURRENT_SHAPE].borderHeight() < 10) {
			self[CONTROLS].discardControl(self[CURRENT_SHAPE].id());
		}
		else {
			self[HEIGHT] = self.borderHeight();
			self[WIDTH] = self.borderWidth();
			self[CURRENT_SHAPE].originalBounds = self[pixelsToRatios](self[CURRENT_SHAPE].bounds());
			self.onAdd()(self[CURRENT_SHAPE].id(), self[CURRENT_SHAPE].originalBounds);
		}

		self[CONTROLS].each((control) => {
			control.ignore(false);
		});

	}

	value(value) {
		const self = this;

		self[CONTROLS].discardAllControls();

		self[VALUE] = value;

		self[VALUE].forEach((shape) => {
			self[CONTROLS]
				.getRecycledControl()
				.container(self)
				.id(shape.id)
				.bounds(self[ratiosToPixels](shape.bounds))
				.contextMenu([{
					id: 'delete',
					title: 'Delete',
					icon: DELETE_ICON,
					onSelect() {
						self.onDeleteShape().call(self, shape.id);
					}
				}]).originalBounds = shape.bounds;
		});
	}
}

Object.assign(VectorEditor.prototype, {
	onChange: method.function(),
	onAdd: method.function(),
	onDeleteShape: method.function(),
	onDeleteAllShapes: method.function()
});
