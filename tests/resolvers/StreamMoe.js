const expect = require('chai').expect;
const assert = require('chai').assert;
const readTestAsset = require('../test-helper').readTestAsset;
const StreamMoe = require('../../src/scrapers/resolvers/StreamMoe');

let instance = new StreamMoe();

describe('StreamMoe', function () {
    it('should resolve live link', async function () {
        // Test to ensure that the page structure hasn't changed.

        // 1. ARRANGE
        let url = 'https://stream.moe/embed2/2721f8202077d242';
        let meta = {};

        // 2. ACT
        let results = await instance.resolveUri(meta, url, null, null);

        // 3. ASSERT
        assert.isNotNull(results, 'No stream results');
        expect(results.length).to.not.equal(0);
    });

    it('should resolve html links', async function () {
        // 1. ARRANGE
        let html = readTestAsset('resolvers/stream-moe/2721f8202077d242.html');
        let meta = {};

        // 2. ACT
        let results = await instance.resolveHtml(meta, html, null, null);

        // 3. ASSERT
        expect(results.length).to.be.equal(1);
        expect(results[0].file).to.include({
            'data': 'https://ams-n05.moecdn.io/2721f8202077d242?download_token=9a2e8f23c274cf4e63d2eb97ba6b6f6f2784e226f3269eb7b61c2b90d43c9de1',
        });
    });
});