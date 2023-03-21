const logger = require('.')({name: 'example-logger', level: 'ERROR'});

logger.info('hello'); //won't print
logger.error('error'); //will print to STDERR

const e = new Error('omg');

e.type = 'MyError';
e.status = 500;
e.previous = new Error('error');

logger.error({error: e}, 'What an error!');

const logger2 = require('.')({name: 'stdout-logger'});
logger2.info('hello'); // prints to STDOUT
logger2.error('error'); // prints to STDERR
