const expect = require('chai').expect;
const readTestAsset = require('../test-helper').readTestAsset;
const Mp4Upload = require('../../src/scrapers/resolvers/Mp4Upload');

let instance = new Mp4Upload();

describe('Mp4Upload', function () {
    it('should normalize uri', function () {
        // 1. ARRANGE
        let uriFull = 'https://www.mp4upload.com/loje9jz4q4v1';
        let uriEmbed = 'https://www.mp4upload.com/embed-loje9jz4q4v1.html';

        let normalizedUrl = 'https://www.mp4upload.com/embed-loje9jz4q4v1.html';

        // 2. ACT
        let uriFullNormalized = instance.normalizeUri(uriFull);
        let uriEmbedNormalized = instance.normalizeUri(uriEmbed);

        // 3. ASSERT
        expect(uriFullNormalized).to.be.equal(normalizedUrl);
        expect(uriEmbedNormalized).to.be.equal(normalizedUrl);
    });

    it('should normalize uri with .html suffix', function () {
        // 1. ARRANGE
        let uriFull = 'https://www.mp4upload.com/loje9jz4q4v1.html';
        let uriEmbed = 'https://www.mp4upload.com/embed-loje9jz4q4v1.html';

        let normalizedUrl = 'https://www.mp4upload.com/embed-loje9jz4q4v1.html';

        // 2. ACT
        let uriFullNormalized = instance.normalizeUri(uriFull);
        let uriEmbedNormalized = instance.normalizeUri(uriEmbed);

        // 3. ASSERT
        expect(uriFullNormalized).to.be.equal(normalizedUrl);
        expect(uriEmbedNormalized).to.be.equal(normalizedUrl);
    });

    it('should resolve html links', async function () {
        // 1. ARRANGE
        let html = readTestAsset('resolvers/mp4upload/5s2j789k6lg5.html');
        let meta = {};

        // 2. ACT
        let results = await instance.resolveHtml(meta, html, null, null);

        // 3. ASSERT
        expect(results.length).to.be.equal(1);
        expect(results[0].file).to.include({
            'data': 'https://s2.mp4upload.com:282/d/qox266icz3b4quuouovu6iisjmsf4s3nttf7etetswtextolhkrtqjhs/video.mp4',
        });
    });
});