const expect = require('chai').expect;
const assert = require('chai').assert;
const readTestAsset = require('../test-helper').readTestAsset;
const KwikCx = require('../../src/scrapers/resolvers/KwikCx');

let instance = new KwikCx();

describe('KwikCx', function () {
    it('should resolve live link', async function () {
        // Test to ensure that the page structure hasn't changed.

        // 1. ARRANGE
        let url;
        //url = 'https://kwik.cx/e/7nbfAA7aJyf1';
        url = 'https://kwik.cx/e/68TCOwMSihA1'; // dash link.
        let meta = {};

        // 2. ACT
        let results = await instance.resolveUri(meta, url, null, null);

        // 3. ASSERT
        assert.isNotNull(results, 'No stream results');
        expect(results.length).to.not.equal(0);
    });

    it('should resolve html links', async function () {
        // 1. ARRANGE
        let html = readTestAsset('resolvers/kwik-cx/7nbfAA7aJyf1.html');
        let meta = {};

        // 2. ACT
        let results = await instance.resolveHtml(meta, html, null, null);

        // 3. ASSERT
        expect(results.length).to.be.equal(1);
        expect(results[0].file).to.include({
            'data': 'https://s1.kwik.cx/uwu/80.6.110.95/vuDTEfSc6v6OiKVfD2MbTueYfMMos8t4HNnCm0T9MYoMpB74/AnimePahe_Hunter_x_Hunter_2011_-_148_BD_720p_TenB.mp4/uwu.m3u8',
        });
    });

    it('should resolve html links (dash)', async function () {
        // 1. ARRANGE
        let html = readTestAsset('resolvers/kwik-cx/68TCOwMSihA1-dash.html');
        let meta = {};

        // 2. ACT
        let results = await instance.resolveHtml(meta, html, null, null);

        // 3. ASSERT
        expect(results.length).to.be.equal(1);
        expect(results[0].file).to.include({
            'data': 'https://s2.kwik.cx/owo/109.201.133.22/roJUbGy5SOR8JVzHyePWfebNCAWVSTJh3oszGwSlJ0BwfKAx/AnimePahe_Naruto_-_001_DVD_480p_RaX.mp4/owo.mpd',
        });
    });
});