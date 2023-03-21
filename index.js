const pino = require('pino');
const merge = require('merge');
const parsetrace = require('parsetrace');

function getStack(err) {
	if (!err.stack) return;

	try {
		const frames = parsetrace(err).object().frames;
		return frames.map(f => `${f.function} :: ${f.file}:${f.line}`);
	} catch (error) {
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
		upstream: err.upstream,
	};
}

function errSerializer(err) {
	return {
		type: err.type,
		status: err.status,
		message: err.message,
		previous: err.previous ? errSerializer(err.previous) : undefined,
		reference: err.reference,
		upstream: err.upstream,
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
}

module.exports = function (config = {}) {
	if (config.level) {
		config.level = config.level.toLowerCase();
	}
	const { stack } = config;
	const serializerForErrors = stack === false ? errSerializer : errorWithStackSerializer;

	const logger = pino(merge.recursive({
		timestamp: pino.stdTimeFunctions.isoTime,
		mixin (mergeObject, level) {
			return { severity: pino.levels.labels[level] }
		},
		formatters: {
			log: (record) => {
				record.err = record.err ? serializerForErrors(record.err) : undefined
				record.req = record.req ? reqSerializer(record.req) : undefined
				record.error = record.error ? serializerForErrors(record.error) : undefined
				return record;
			},
		},
		transport: {
			targets: [
				{
					level: 'error',
					target: 'pino/file',
					options: { destination: 2 } // stderr
				},
				{
					level: 'debug',
					target: 'pino/file',
					options: { destination: 1 } // stdout
				},
			],
			dedupe: true,
		},
	}, config));

	if (config.level) {
		logger.level = config.level;
	}

	return logger;
}
