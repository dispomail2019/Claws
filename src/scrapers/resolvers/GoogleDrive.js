const rp = require('request-promise');
const URL = require('url');
const cheerio = require('cheerio');
const vm = require('vm');
const logger = require('../../utils/logger');

const qualityByItag = {
  "5": "240",
  "6": "270",
  "17": "144",
  "18": "360",
  "22": "720",
  "34": "360",
  "35": "480",
  "36": "240",
  "37": "1080",
  "38": "3072",
  "43": "360",
  "44": "480",
  "45": "720",
  "46": "1080",
  "59": "480",
  "82": "360 [3D]",
  "83": "480 [3D]",
  "84": "720 [3D]",
  "85": "1080p [3D]",
  "100": "360 [3D]",
  "101": "480 [3D]",
  "102": "720 [3D]",
  "92": "240",
  "93": "360",
  "94": "480",
  "95": "720",
  "96": "1080",
  "132": "240",
  "151": "72",
  "133": "240",
  "134": "360",
  "135": "480",
  "136": "720",
  "137": "1080",
  "138": "2160",
  "160": "144",
  "264": "1440",
  "298": "720",
  "299": "1080",
  "266": "2160",
  "167": "360",
  "168": "480",
  "169": "720",
  "170": "1080",
  "218": "480",
  "219": "480",
  "242": "240",
  "243": "360",
  "244": "480",
  "245": "480",
  "246": "480",
  "247": "720",
  "248": "1080",
  "271": "1440",
  "272": "2160",
  "302": "2160",
  "303": "1080",
  "308": "1440",
  "313": "2160",
  "315": "2160"
}

async function GoogleDrive(uri, jar, headers) {
    try {
        let streamPageHtml = await rp({
            uri,
            headers,
            jar,
            timeout: 5000,
        });
    
        return GoogleDriveHtml(streamPageHtml);
    } catch (err) {
        logger.error(err)
    }
}


function GoogleDriveHtml(streamPageHtml) {
    const $ = cheerio.load(streamPageHtml);

    const allStreamInfoString = /\["fmt_stream_map",\s*"([^"]+)"\s*\]/.exec($('script:contains("_initProjector")')[0].children[0].data)[1];
    const streamInfoStrings = allStreamInfoString.split(',');

    return streamInfoStrings.map(streamInfoString => {
        const [itag, url] = streamInfoString.split('|');
        const sandbox = {};
        vm.createContext(sandbox); // Contextify the sandbox.
        const unescapedUrl = decodeURIComponent(vm.runInContext(`"${url}"`, sandbox));
        return {quality: qualityByItag[itag], link: unescapedUrl};
    });
}

function getGoogleDriveScrapeUrl(uri) {
    const googleLinkInfo = URL.parse(uri, true);
    let fileId = '';
    if (googleLinkInfo.pathname === '/open') {
        fileId = googleLinkInfo.query.id;
    } else if (googleLinkInfo.pathname.startsWith('/file/d/')) {
        fileId = googleLinkInfo.pathname.split('/')[3];
    }
    return `https://drive.google.com/file/d/${fileId}/view`;
}

module.exports = exports = {GoogleDrive, GoogleDriveHtml, getGoogleDriveScrapeUrl};