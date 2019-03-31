
const kue = require('kue');
const RequestPromise = require('request-promise');
const logger = require('./logger');

class Queue {
    constructor() {
        this.isEnabled = false;

        if (process.env.ENABLE_QUEUE === 'true') {
            logger.debug('Kue enabled - Using queue to resolve requests')
            this.queue = kue.createQueue();
            this.isEnabled = true;
            if (process.env.ENABLE_KUE_UI === 'true') {
                kue.app.listen(process.env.KUE_UI_PORT || 3001);
            }
        }
    }

    process() {
        logger.debug(`Queue Processing Started`)
        this.queue.process('request', process.env.QUEUE_ACTIVE_JOB_NUMBER || 1, async function (job, done) {
            try {
                const data = await RequestPromise(job.data)
                done(null, data)
            } catch (err) {
                logger.error(err)
                done(err, null)
            }
        });
    }

    submit(jobDetails) {
        let job = this.queue.create(jobDetails.name, jobDetails.job.request)
            .attempts(process.env.QUEUE_MAX_RETRIES || 3)
            .backoff(true).removeOnComplete(true);
        job.save();
        return job;
    }
}

const instance = new Queue()

module.exports.queue = instance;