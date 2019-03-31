const expect = require('chai').expect;
const assert = require('chai').assert;
const readTestAsset = require('../test-helper').readTestAsset;
const XStreamCDN = require('../../src/scrapers/resolvers/XStreamCDN');

let instance = new XStreamCDN();

describe('XStreamCDN', function () {
    it('should resolve live link', async function () {
        // Test to ensure that the page structure hasn't changed.

        // 1. ARRANGE
        let url = 'https://www.xstreamcdn.com/v/4dvj6nwny91.html';
        let meta = {};

        // 2. ACT
        let results = await instance.resolveUri(meta, url, null, null);

        // 3. ASSERT
        assert.isNotNull(results, 'No stream results');
        expect(results.length).to.not.equal(0);
    });
});