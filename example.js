const logger = require('.')({name: 'example-logger', level: 'ERROR'});

logger.info('hello'); //won't print
logger.error('error'); //woill print to STDERR

logger.error({err: new Error('error')});
