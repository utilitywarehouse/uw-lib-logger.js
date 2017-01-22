const logger = require('.')({name: 'example-logger', level: 'ERROR'});

logger.info('hello'); //won't print
logger.error('error'); //woill print to STDERR

const e = new Error('omg');

e.type = 'MyError';
e.status = 500;
e.previous = new Error('error');

logger.error({error: e}, 'What an error!');
