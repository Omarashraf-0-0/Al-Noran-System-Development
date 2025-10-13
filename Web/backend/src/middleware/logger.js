// used to log requests that come into the server
const { format } = require('date-fns');
// to generate unique IDs for each request
const { v4: uuid } = require('uuid');
// to write logs to a file
const fs = require('fs');
// to use promises with file system operations 
// , promises are easier to work with using async/await 
const fsPromises = require('fs').promises;
const path = require('path');

const logEvents = async (message, logFileName) => {
    const dateTime = `${format(new Date(), 'yyyyMMdd\tHH:mm:ss')}`;
    const logItem = `${dateTime}\t${uuid()}\t${message}\n`;
    try {
        if (!fs.existsSync(path.join(__dirname, '..', 'logs'))) {
            await fsPromises.mkdir(path.join(__dirname, '..', 'logs'));
        }
        await fsPromises.appendFile(path.join(__dirname, '..', 'logs', logFileName), logItem);
    } catch (err) {
        console.log(err);
    }
}

const logger = (req, res, next) => {
    logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, 'reqLog.txt');
    console.log(`${req.method} ${req.path}`);
    next();
}
module.exports = { logger, logEvents };