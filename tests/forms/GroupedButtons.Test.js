import { assert } from 'chai';
import { GroupedButtons } from '../..';
import TestUtil from '../TestUtil';
import FormControlTests from './FormControlTests';

describe('GroupedButtons', () => {
	const testUtil = new TestUtil(GroupedButtons);
	const formControlTests = new FormControlTests(GroupedButtons, testUtil, {
		mainCssClass: 'grouped-buttons',
		extraSettings: {
			buttons: [{
				id: '1',
				label: 'test'
			}, {
				id: '2',
				label: 'test2'
			}]
		},
		focusableElement: 'button'
	});

	formControlTests.run([], ['focus']);

	describe('.addButton', () => {
		it('should add a button to the DOM when addButton is called', () => {
			testUtil.control = new GroupedButtons({
				container: testUtil.container,
				id: 'first'
			})
				.addButton({
					id: 'one',
					label: 'test'
				});

			assert.equal(testUtil.count('button'), 1);
		});

		it('should add two buttons to the DOM when addButton is called twice', () => {
			const control2 = new GroupedButtons({
				container: testUtil.container,
				id: 'second'
			});
			control2
				.addButton({
					id: 'two',
					label: 'test 1'
				})
				.addButton({
					id: 'three',
					label: 'test 2'
				});

			assert.equal(testUtil.count('button'), 2);
			testUtil.control = control2;
		});
	});
});
