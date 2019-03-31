const expect = require('chai').expect;
const assert = require('chai').assert;
const readTestAsset = require('../test-helper').readTestAsset;
const VidStreaming = require('../../src/scrapers/resolvers/VidStreaming');

let instance = new VidStreaming();

describe('VidStreaming', function () {
    it('should resolve live link', async function () {
        // Test to ensure that the page structure hasn't changed.

        // 1. ARRANGE
        let url = 'https://vidstreaming.io/streaming.php?id=MTE1MzE5';
        let meta = {};

        // 2. ACT
        let results = await instance.resolveUri(meta, url, null, null);

        // 3. ASSERT
        assert.isNotNull(results, 'No stream results');
        expect(results.length).to.not.equal(0);
    });

    it('should resolve html links', async function () {
        // 1. ARRANGE
        let html = readTestAsset('resolvers/vidstreaming/MTE1MzE5.html');
        let meta = {};

        // 2. ACT
        let results = await instance.resolveHtml(meta, html, null, null);

        // 3. ASSERT
        expect(results.length).to.be.equal(4);
        expect(results[0].file).to.include({
            'data': 'https://redirector.googlevideo.com/videoplayback?id=3edd289f1ac8d7e7&itag=22&source=picasa&begin=0&requiressl=yes&mm=30&mn=sn-5hne6nlk&ms=nxu&mv=u&pl=24&sc=yes&ei=cc6SXNb4HcH51gK2kZvQBQ&susc=ph&app=fife&mime=video/mp4&cnr=14&dur=1420.225&lmt=1553035273864433&mt=1553124650&ipbits=0&keepalive=yes&ratebypass=yes&ip=134.19.181.231&expire=1553132177&sparams=ip,ipbits,expire,id,itag,source,requiressl,mm,mn,ms,mv,pl,sc,ei,susc,app,mime,cnr,dur,lmt&signature=AB9E474AABD06DCC23E1363DAA9672E6ED95DFAAB779E2F25AD99042F5FCA7F5.53468B8B42B9A2F5C3E94147C8C0B718B20A8030AF7ECF73DA35F9D46A6B092E&key=us0',
        });
    });
});