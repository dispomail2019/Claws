const expect = require('chai').expect;
const readTestAsset = require('../test-helper').readTestAsset;
const StreamLewd = require('../../src/scrapers/resolvers/StreamLewd');

let instance = new StreamLewd();

describe('StreamLewd', function () {
    it('should resolve html links', async function () {
        // 1. ARRANGE
        let html = readTestAsset('resolvers/stream-lewd/DaWDkPJQ3wry2mV.html');
        let meta = {};

        // 2. ACT
        let results = await instance.resolveHtml(meta, html, null, null);

        // 3. ASSERT
        expect(results.length).to.be.equal(4);
        expect(results[0].file).to.include({
            'data': 'https://fr-3.stream.lewd.host/link/DaWDkPJQ3wry2mV/360/265b9363d1248d53252e0e61b37eee8c/',
        });
    });
});