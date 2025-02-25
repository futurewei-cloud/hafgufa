import { assert } from 'chai';
import { FileThumbnail } from '../..';
import ControlTests from '../ControlTests';
import TestUtil from '../TestUtil';

describe('FileThumbnail', () => {
	const testUtil = new TestUtil(FileThumbnail);
	const controlBaseTests = new ControlTests(FileThumbnail, testUtil, {
		mainCssClass: 'file-thumbnail'
	});

	controlBaseTests.run();

	describe('ImageSource', () => {
		testUtil.testMethod({
			methodName: 'imageSource',
			defaultValue: undefined,
			testValue: 'test.gif',
			secondTestValue: 'test.jpg'
		});

		it('should have an image element when imageSource is set', () => {
			testUtil.control = new FileThumbnail({
				container: testUtil.container,
				imageSource: 'http://www.examle.com/test.jpg'
			});

			assert.equal(testUtil.first('img').getAttribute('src'), 'http://www.examle.com/test.jpg');
		});
	});

	describe('PreviewSize', () => {
		testUtil.testMethod({
			methodName: 'previewSize',
			defaultValue: 'small',
			testValue: 'medium',
			secondTestValue: 'large'
		});
	});
});
