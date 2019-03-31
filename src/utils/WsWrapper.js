const RequestPromise = require('request-promise');
const tough = require('tough-cookie');
const ffprobe = require('./ffprobe');
const ffprobeStatic = require('ffprobe-static');
const logger = require('./logger');

class WsWrapper {
    constructor(ws, options) {
        this.ws = ws;
        this.options = options;

        this.stopExecution = false
        this.rp = RequestPromise.defaults(target => {
            if (this.stopExecution) {
                return null;
            }

            return RequestPromise(target);
        })

        this.sentLinks = [];
    }

    async send(resultData) {
        if (this.shouldSend(resultData)) {
            await this.setHeadInfo(resultData);
            // Commenting this out until we get a better workflow for retrieving file data consistently
            // await this.setFileInfo(resultData);
            try {
                this.ws.send(JSON.stringify(resultData));
                if (resultData.event === 'result') {
                    this.sentLinks.push(resultData.file.data);
                } else {
                    this.sentLinks.push(resultData.target);
                }
            } catch (err) {
                logger.debug("WS client disconnected, can't send data");
            }
        }
    }

    shouldSend(resultData) {
        if (resultData.event === 'result') {
            return !this.sentLinks.includes(resultData.file.data);
        } else {
            return !this.sentLinks.includes(resultData.target);
        }
    }

    async setHeadInfo(resultData) {
        if (resultData.event === 'result') {
            const jar = this.rp.jar();
            const headers = resultData.headers || {};

            if (resultData.metadata.cookie) {
                const splitCookie = resultData.metadata.cookie.split('=');
                const cookie = new tough.Cookie({
                    key: splitCookie[0],
                    value: splitCookie[1]
                });
                jar.setCookie(cookie, resultData.file.data);
            }

            try {
                const response = await this.rp({
                    uri: resultData.file.data,
                    method: 'HEAD',
                    headers,
                    jar,
                    resolveWithFullResponse: true,
                    timeout: 5000
                });

                if (response) {
                    // Response can be null if stopExecution is true.
                    resultData.file.fileSize = Number(response.headers['content-length']);
                    resultData.file.contentType = response.headers['content-type'];
                    resultData.metadata.isStreamable = response.headers['accept-ranges'] === 'bytes';
                }
            } catch(err) {
                logger.error(err);
            }
        }
        return resultData;
    }

    async setFileInfo(resultData) {
        if (resultData.event === 'result' && resultData.metadata.isStreamable !== false) {
            const jar = this.rp.jar();
            const headers = resultData.headers || {};

            if (resultData.metadata.cookie) {
                headers.Cookie = resultData.metadata.cookie;
            }

            try {
                const response = await ffprobe(resultData.file.data, {path: ffprobeStatic.path, headers, endOffset: 2000000, execOptions: {timeout: 10000}});

                for (let stream of response.streams) {
                    if (stream.codec_type === 'video') {
                        resultData.file.width = stream.width;
                        resultData.file.height = stream.height;
                        resultData.file.codec_name = stream.codec_name;
                        resultData.file.display_aspect_ratio = stream.display_aspect_ratio;
                        const frameRateSplit = stream.avg_frame_rate.split('/');
                        resultData.file.avg_frame_rate = Number((Number(frameRateSplit[0]) / Number(frameRateSplit[1])).toFixed(2));
                    } else if (stream.codec_type === 'audio') {
                        resultData.file.codec_name = stream.codec_name;
                        resultData.file.channels = stream.channels;
                        resultData.file.channel_layout = stream.channel_layout;
                    }
                }

                resultData.file.duration = parseFloat(response.format.duration);
                resultData.file.fileSize = Number(response.format.size);
            } catch(err) {
                logger.error(err);
            }
        }
        return resultData;
    }
}


module.exports = exports = WsWrapper;