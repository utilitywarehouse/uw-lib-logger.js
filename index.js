const bunyan = require('bunyan');
const merge = require('merge');
const parsetrace = require('parsetrace');

const safeCycles = bunyan.safeCycles;

// modified from https://github.com/trentm/node-bunyan/blob/master/examples/specific-level-streams.js
class RecordWriter {
	constructor(levels, stream) {
		this.levels = {};
		levels.forEach((lvl) => {
			this.levels[bunyan.resolveLevel(lvl)] = true;
		});
		this.stream = stream;
	}

	mapLevelToString(lvl) {
		return bunyan.nameFromLevel[lvl]
	}

	write(record) {
		if (this.levels[record.level] !== undefined) {
			record.severity = this.mapLevelToString(record.level)
			const str = JSON.stringify(record, safeCycles()) + '\n';
			this.stream.write(str);
		}
	}
}

function getStack(err) {
	if (!err.stack) return;

	try {
		const frames = parsetrace(err).object().frames;
		return frames.map(f => `${f.function} :: ${f.file}:${f.line}`);
	} catch(error) {
		return err.stack.split('\n');
	}
}

function errorWithStackSerializer(err) {
	return {
		type: err.type,
		status: err.status,
		message: err.message,
		stack: getStack(err),
		previous: err.previous ? errorWithStackSerializer(err.previous) : undefined,
		reference: err.reference,
		upstream: err.upstream
	};
}

function errSerializer(err) {
	return {
		type: err.type,
		status: err.status,
		message: err.message,
		previous: err.previous ? errSerializer(err.previous) : undefined,
		reference: err.reference,
		upstream: err.upstream
	};
}

function reqSerializer(req) {
	if (!req || !req.connection) {
		return req;
	}
	return {
		method: req.method,
		url: req.url,
		remoteAddress: req.connection.remoteAddress,
	};
};


module.exports = function (config = {}) {
	const { stack } = config;
	const serializerForErrors = stack === false ? errSerializer : errorWithStackSerializer;
	const logger = bunyan.createLogger(merge.recursive({
		serializers: {err: serializerForErrors, req: reqSerializer, error: serializerForErrors},
		streams: [
			{
				type: 'raw',
				stream: new RecordWriter(
					[bunyan.ERROR, bunyan.FATAL],
					process.stderr
				),
				level: bunyan.ERROR
			},
			{
				type: 'raw',
				stream: new RecordWriter(
					[bunyan.TRACE, bunyan.INFO, bunyan.DEBUG, bunyan.WARN],
					process.stdout
				),
				level: bunyan.TRACE
			}
		]
	}, config));

	if (config.level) {
		logger.level(config.level)
	}

	return logger;
}
