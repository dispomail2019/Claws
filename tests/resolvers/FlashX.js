const expect = require('chai').expect;
const assert = require('chai').assert;
const readTestAsset = require('../test-helper').readTestAsset;
const FlashX = require('../../src/scrapers/resolvers/FlashX');

let instance = new FlashX();

describe('FlashX', function () {
    it('should resolve live link', async function () {
        // Test to ensure that the page structure hasn't changed.

        // wait at most 5 seconds
        this.timeout(5000);

        // 1. ARRANGE
        let url = 'http://flashx.tv/xzrod3j5t7ft.html';
        let meta = {};

        // 2. ACT
        let results = await instance.resolveUri(meta, url, null, null);

        // 3. ASSERT
        assert.isNotNull(results, 'No stream results');
        expect(results.length).to.not.equal(0);
    });

    it('should resolve html links', async function () {
        // 1. ARRANGE
        let html = readTestAsset('resolvers/flashx/d6192a00aae94e9cf7624ac7190271d7.html');
        let meta = {};

        // 2. ACT
        let results = await instance.resolveVideoHtml(meta, html, null, null);

        // 3. ASSERT
        expect(results.length).to.be.equal(1);
        expect(results[0].file).to.include({
            'data': 'https://bigcdn.flashx1.tv/cdn102/5k7xonhufqvvjuw5lu4jlw2c2rlrux62k5dfo6rcsmrcz3xxy4wvth2zhawa/normal.mp4',
        });
    });
});