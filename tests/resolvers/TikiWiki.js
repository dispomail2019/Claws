const expect = require('chai').expect;
const readTestAsset = require('../test-helper').readTestAsset;
const TikiWiki = require('../../src/scrapers/resolvers/TikiWiki');

let instance = new TikiWiki();

describe('TikiWiki', function () {
    it('should resolve html links', async function () {
        // 1. ARRANGE
        let html = readTestAsset('resolvers/tikiwiki/88yh05fbvjcx.html');
        let meta = {};

        // 2. ACT
        let results = await instance.resolveHtml(meta, html, null, null);

        // 3. ASSERT
        expect(results.length).to.be.equal(1);
        expect(results[0].file).to.include({
            'data': 'https://saber.tiwicdn.net/hlrzohqpqks7nz6enz5eelwdba3wkw4rcp4jv3zn52ma3a3xcf2erhbcveva/v.mp4',
        });
    });
});