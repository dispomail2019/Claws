const expect = require('chai').expect;
const readTestAsset = require('../../test-helper').readTestAsset;
const AnimePahe = require('../../../src/scrapers/providers/anime/AnimePahe');

let instance = new AnimePahe();

describe('AnimePahe', function () {
    it('should resolve live anime (Parasyte)', async function() {
        // 1. ARRANGE
        let request = {
            query: {
                title: 'Parasyte -the maxim-', // Alternatively: "Kiseijuu: Sei no Kakuritsu"
                season: 1,
                episode: 1,
            },
            client: {
                remoteAddress: '66.249.64.0', // Google IP
            }
        };
        let ws = {};

        // wait at most 15 seconds
        this.timeout(15000);

        // 2. ACT
        let links = await instance.resolveRequests(request, ws);

        // 3. ASSERT
        expect(links).to.not.have.lengthOf(0);
    });

    it('should resolve live anime movie (Howl\'s Moving Castle (2004))', async function() {
        // 1. ARRANGE
        let request = {
            query: {
                title: 'Howl\'s Moving Castle',
                year: 2004,
                season: 1,
                episode: 1,
            },
            client: {
                remoteAddress: '66.249.64.0', // Google IP
            }
        };
        let ws = {};

        // wait at most 15 seconds
        this.timeout(15000);

        // 2. ACT
        let links = await instance.resolveRequests(request, ws);

        // 3. ASSERT
        expect(links).to.not.have.lengthOf(0);
    });
});