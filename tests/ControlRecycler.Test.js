import { assert } from 'chai';
import { Button, ControlRecycler, Icon } from '../';
import TestUtil from './TestUtil';

describe('ControlRecycler', () => {
	const testUtil = new TestUtil(ControlRecycler);

	describe('Initial', () => {
		it('should not break if a setting is provided that doesn\'t correlate to a method', () => {
			testUtil.control = new ControlRecycler({
				testSetting: 'test'
			});

			assert.equal(testUtil.control.control(), undefined);
		});
	});

	describe('Control', () => {
		testUtil.testMethod({
			methodName: 'control',
			defaultValue: undefined,
			testValue: Button,
			secondTestValue: Icon
		});
	});

	describe('defaultSettings', () => {
		testUtil.testMethod({
			methodName: 'defaultSettings',
			defaultValue: undefined,
			testValue: {
				container: 'testContainer'
			},
			secondTestValue: {
				container: 'testContainer2'
			}
		});
	});

	describe('GetControls', () => {
		it('should NOT return an instance of a control when getRecycledControl is called if no control has been defined', () => {
			testUtil.control = new ControlRecycler();

			assert.isNotTrue(!!testUtil.control.getRecycledControl());
		});

		it('should return an instance of a control when getRecycledControl is called', () => {
			testUtil.control = new ControlRecycler({
				control: Button,
				defaultSettings: {
					container: 'body'
				}
			});

			assert.isTrue(!!testUtil.control.getRecycledControl());
		});

		it('should not discard a control if no id is provided', () => {
			testUtil.control = new ControlRecycler({
				control: Button,
				defaultSettings: {
					container: 'body'
				}
			});

			testUtil.control.getRecycledControl();

			testUtil.control.discardControl();

			testUtil.control.getRecycledControl();

			assert.equal(testUtil.control.totalVisibleControls(), 2);
		});

		it('should return an instance of a recycled control when getRecycledControl is called after the control is discarded', () => {
			let initialControl;
			let secondControl;

			testUtil.control = new ControlRecycler({
				control: Button,
				defaultSettings: {
					container: 'body'
				}
			});

			initialControl = testUtil.control.getRecycledControl();

			testUtil.control.discardAllControls();

			secondControl = testUtil.control.getRecycledControl();

			assert.equal(initialControl, secondControl);
		});

		it('should return the instance of a specific control when getControl is called', () => {
			let secondControl;
			let thirdControl;

			testUtil.control = new ControlRecycler({
				control: Button,
				defaultSettings: {
					container: 'body'
				}
			});

			testUtil.control.getRecycledControl();
			secondControl = testUtil.control.getRecycledControl();

			secondControl.id('test');

			thirdControl = testUtil.control.getControl('test');

			assert.equal(secondControl, thirdControl);
		});

		it('should return an array with two controls when getRenderedControls is called after three conrols have been instantiated and one discarded', () => {
			let secondControl;

			testUtil.control = new ControlRecycler({
				control: Button,
				defaultSettings: {
					container: 'body'
				}
			});

			testUtil.control.getRecycledControl();
			secondControl = testUtil.control.getRecycledControl();
			testUtil.control.getRecycledControl();

			secondControl.id('test');

			testUtil.control.discardControl('test');

			assert.equal(testUtil.control.getRenderedControls().length, 2);
		});

		it('should 2 when totalVisibleControls is called ther are two visible controls', () => {
			let secondControl;

			testUtil.control = new ControlRecycler({
				control: Button,
				defaultSettings: {
					container: 'body'
				}
			});

			testUtil.control.getRecycledControl();
			secondControl = testUtil.control.getRecycledControl();
			testUtil.control.getRecycledControl();

			secondControl.id('test');

			testUtil.control.discardControl('test');

			assert.equal(testUtil.control.totalVisibleControls(), 2);
		});

		it('should get the appropriate control when getControlAtOffset is called', () => {
			let initialControl;
			let secondControl;
			let thirdControl;
			let fourthControl;

			testUtil.control = new ControlRecycler({
				control: Button,
				defaultSettings: {
					container: 'body'
				}
			});

			initialControl = testUtil.control.getRecycledControl();
			secondControl = testUtil.control.getRecycledControl();
			thirdControl = testUtil.control.getRecycledControl();

			fourthControl = testUtil.control.getControlAtOffset(1);

			assert.notEqual(initialControl, fourthControl);
			assert.equal(secondControl, fourthControl);
			assert.notEqual(thirdControl, fourthControl);
		});
	});
});
