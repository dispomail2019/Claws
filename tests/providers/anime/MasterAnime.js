const expect = require('chai').expect;
const readTestAsset = require('../../test-helper').readTestAsset;
const MasterAnime = require('../../../src/scrapers/providers/archive/anime/MasterAnime');

let instance = new MasterAnime();

describe('MasterAnime', function () {
    it('should provide links from html', function () {
        // 1. ARRANGE
        let html = readTestAsset('providers/masteranime/one-piece-1.html');

        // 2. ACT
        let links = instance._scrapeMirrors(html);

        // 3. ASSERT
        expect(links.length).to.be.equal(7);
        expect(links[0]).to.be.equal('https://mp4upload.com/embed-3pp6895rrjsr.html');
    });
});