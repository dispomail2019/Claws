'use strict'

const { execFile } = require('child_process')

/**
 * Executes ffprobe with provided arguments
 * @func    ffprobeExecFile
 * @param   {String}        path Path of the ffprobe binary
 * @param   {Array<String>} args Array of arguments passed to ffprobe
 * @returns {Promise<Object>}    Promise that resolves to the ffprobe JSON output
 */
function ffprobeExecFile (path, args, options) {
  return new Promise((resolve, reject) => {
    execFile(path, args, options, (err, stdout, stderr) => {
      if (err) {
        if (err.code === 'ENOENT') {
          reject(err)
        } else {
          const ffprobeErr = new Error(stderr.split('\n').pop())
          reject(ffprobeErr)
        }
      } else {
        resolve(JSON.parse(stdout))
      }
    })
  })
}

/**
 * Analyzes a video with ffprobe
 * @func    ffprobe
 * @param   {String} target   The file path or remote URL of the video
 * @param   {Object} [config={}]             A configuration object
 * @param   {String} [config.path='ffprobe'] Path of the ffprobe binary
 * @returns {Promise<Object>} Promise that resolves to the ffprobe JSON output
 */
function ffprobe (target, config = {}) {
  const path = config.path || process.env.FFPROBE_PATH || 'ffprobe'
  const args = [
    '-show_streams',
    '-show_format',
    '-print_format',
    'json',
    target
  ]

  if (config.headers) {
    args.push('-headers')
    let headersArg = ''
    for (let header in config.headers) {
      headersArg += `${header}: ${config.headers[header]}\r\n`
    }
    args.push(headersArg)
  }

  if (config.endOffset) {
    args.push('-end_offset')
    args.push(config.endOffset)
  }

  return ffprobeExecFile(path, args, config.execOptions)
}

module.exports = ffprobe
