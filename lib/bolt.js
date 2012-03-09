var EventEmitter = require('events').EventEmitter;

var Protocol = require('./protocol').MultilangProtocol;
var Tuple = require('./tuple').Tuple;


var Bolt = module.exports.Bolt = function(definitionFn, inputStream, outputStream) {
	
	this._events = new EventEmitter();
	this._definitionFn = definitionFn || function() {};
	this._processTupleFn = null;
	this._ready = false;

	this._protocol = new Protocol(inputStream, outputStream);
	this._handleEvents();
	this._outputCollector = this._getOutputCollector();
}

Bolt.prototype._handleEvents = function() {
	var self = this;

	this._protocol.on('error', function(err) {
		self._events.emit('error', err);
	});

	this._protocol.on('ready', function() {
		self._ready = true;
		self._processTupleFn = self._definitionFn(self._events);
		self._events.emit('prepare', self._outputCollector);
	});

	this._protocol.on('message', function(message) {

		if (message && !!message.tuple) {

			var id = message.id || null;
			var comp = message.comp || null;
			var stream = message.stream || null;
			var task = message.task || null;
			var tuple = message.tuple || null;

			self._processTupleFn(new Tuple(id, comp, stream, task, tuple), function(err) {
				if (err) {
					self._protocol.sendLog(err);
				}

				self._protocol.sendSync();
			});
		}

	});
};


Bolt.prototype._getOutputCollector = function() {
	
	var self = this;
	var collector = function() {};


	collector.prototype.emit = function(tuple, stream, anchors) {
		self._protocol.emitTuple(tuple, stream, anchors, null);
	}

	collector.prototype.emitDirect = function(directTask, tuple, stream, anchors) {
		self._protocol.emitTuple(tuple, stream, anchors, directTask);
	}

	collector.prototype.ack = function(tuple) {
		if (tuple instanceof Tuple) {
			self._protocol.sendMessage({
				command:'ack',
				id:tuple.id
			})
		}
	};

	collector.prototype.fail = function(tuple) {
		if (tuple instanceof Tuple) {
			self._protocol.sendMessage({
				command:'fail',
				id:tuple.id
			})
		}
	}

	collector.prototype.reportError = function(err) {
		self._protocol.sendLog(JSON.stringify(err));
	}

	return new collector();

};