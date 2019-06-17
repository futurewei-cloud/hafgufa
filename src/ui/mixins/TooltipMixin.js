import { DockPoint, method } from 'type-enforcer';
import { MOUSE_ENTER_EVENT, MOUSE_LEAVE_EVENT } from '../../utility/domConstants';
import Tooltip from '../layout/Tooltip';

const EVENT_SUFFIX = '.tooltip';

const TOOLTIP = Symbol();
const ARE_EVENTS_SET = Symbol();
const ON_DRAG_ID = Symbol();
const ON_DRAG_DONE_ID = Symbol();

const showTooltip = Symbol();
const removeTooltip = Symbol();

/**
 * Adds a tooltip method to a control
 *
 * @mixin TooltipMixin
 * @constructor
 */
export default (Base) => {
	class TooltipMixin extends Base {
		constructor(settings = {}) {
			super(settings);

			const self = this;
			self.onRemove(() => {
				self.tooltip('');
			});
		}

		[showTooltip]() {
			const self = this;

			if (!self[TOOLTIP]) {
				self[TOOLTIP] = new Tooltip({
					content: self.tooltip(),
					anchor: self.element(),
					anchorDockPoint: self.tooltipDockPoint().opposite,
					tooltipDockPoint: self.tooltipDockPoint(),
					onRemove: () => {
						self[TOOLTIP] = null;
					}
				});
			}
			else {
				self[TOOLTIP].resize();
			}
		}

		[removeTooltip]() {
			const self = this;

			if (self[TOOLTIP] && !self.isDragging) {
				self[TOOLTIP].remove();
			}
		}
	}

	Object.assign(TooltipMixin.prototype, {
		tooltip: method.any({
			set: function(tooltip) {
				const self = this;

				const show = () => {
					self[showTooltip]();
				};

				const remove = () => {
					self[removeTooltip]();
				};

				if (tooltip) {
					self.on(MOUSE_ENTER_EVENT + EVENT_SUFFIX, show)
						.on(MOUSE_LEAVE_EVENT + EVENT_SUFFIX, remove);

					if (self.onDrag) {
						self[ON_DRAG_ID] = self.onDrag(self[showTooltip]);
						self[ON_DRAG_DONE_ID] = self.onDragDone(self[removeTooltip]);
					}
				}
				else {
					self.on(MOUSE_ENTER_EVENT + EVENT_SUFFIX, null)
						.on(MOUSE_LEAVE_EVENT + EVENT_SUFFIX, null);

					if (self.onDrag) {
						self.onDrag().discard(self[ON_DRAG_ID]);
						self.onDragDone().discard(self[ON_DRAG_DONE_ID]);
					}
				}

				if (self[TOOLTIP]) {
					self[TOOLTIP].content(tooltip);
				}
			}
		}),

		tooltipDockPoint: method.dockPoint({
			init: new DockPoint(DockPoint.POINTS.LEFT_CENTER)
		})
	});

	return TooltipMixin;
};
