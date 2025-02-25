import { assert } from 'chai';
import { Section } from '../..';
import ControlHeadingMixinTests from '../mixins/ControlHeadingMixinTests';
import TestUtil from '../TestUtil';

describe('Section', () => {
	const testUtil = new TestUtil(Section);
	const controlHeadingMixinTests = new ControlHeadingMixinTests(Section, testUtil);

	controlHeadingMixinTests.run(['canCollapse', 'isCollapsed']);

	describe('.canCollapse', () => {
		testUtil.testMethod({
			methodName: 'canCollapse',
			defaultSettings: {
				container: testUtil.container,
				title: 'Test Title'
			},
			defaultValue: true,
			testValue: false
		});

		it('should set isCollapsed to false when canCollapse is set to false', () => {
			testUtil.control = new Section({
				container: testUtil.container,
				title: 'Test Title',
				isCollapsed: true
			});

			testUtil.control.canCollapse(false);

			assert.equal(testUtil.control.isCollapsed(), false);
		});
	});

	describe('.isCollapsed', () => {
		testUtil.testMethod({
			methodName: 'isCollapsed',
			defaultSettings: {
				container: testUtil.container,
				title: 'Test Title'
			},
			defaultValue: false,
			testValue: true,
			testValueClass: 'collapsed'
		});

		it('should always return false for isCollapsed when canCollapse is false', () => {
			testUtil.control = new Section({
				container: testUtil.container,
				title: 'Test Title',
				canCollapse: false
			});

			testUtil.control.isCollapsed(true);

			assert.equal(testUtil.control.isCollapsed(), false);
		});

		it('should have a heading control with a expander without class "expanded" when isCollapsed is true', () => {
			testUtil.control = new Section({
				container: testUtil.container,
				title: 'Test Title',
				isCollapsed: true
			});

			assert.equal(testUtil.count('.heading button'), 1);
		});

		it('should have a heading control with a expander with class "expanded" when isCollapsed is false', () => {
			testUtil.control = new Section({
				container: testUtil.container,
				title: 'Test Title',
				isCollapsed: false
			});

			assert.equal(testUtil.count('.heading button'), 1);
		});
	});
});
