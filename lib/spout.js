var EventEmitter = require('events').EventEmitter;

var Protocol = require('./protocol').MultilangProtocol;


var Spout = module.exports.Spout = function(definitionFn, inputStream, outputStream) {
	
	this._events = new EventEmitter();
	this._definitionFn = definitionFn || function() {};
	this._nextTupleFn = null;
	this._ready = false;

	this._protocol = new Protocol(inputStream, outputStream);
	this._handleEvents();
	this._outputCollector = this._getOutputCollector();
}

Spout.prototype._handleEvents = function() {
	var self = this;

	this._protocol.on('ready', function() {
		self._ready = true;
		self._nextTupleFn = self._definitionFn(self._events);
		self._events.emit('open', self._outputCollector);
	});

	this._protocol.on('message', function(message) {

		if (message === 'next') {

			self._nextTupleFn(function(err) {
				if (err) {
					self._protocol.sendLog(err);
				} else {
					self._protocol.sendSync();
				}
			});

		} else if (message && !!message.command) {

			if (message.command === 'ack') {

				self._events.emit('ack', message.id);

			} else if (message.command === 'fail') {

				self._events.emit('fail', message.id);

			}
		}

	});
};


Spout.prototype._getOutputCollector = function() {
	
	var self = this;
	var collector = function() {}
	var emitTuple = function(tuple, messageId, streamId, directTask) {
		
		var command = {
			command:'emit'
		}

		if (messageId) {
			command['id'] = messageId;
		}

		if (streamId) {
			command['stream'] = streamId;
		}

		if (directTask)
		{
			command['task'] = directTask;
		}

		command['tuple'] = tuple;

		self._protocol.sendMessage(command);
	}


	collector.prototype.emit = function(tuple, messageId, streamId) {
		emitTuple(tuple, messageId, streamId, null);
	}

	collector.prototype.emitDirect = function(directTask, tuple, messageId, streamId) {
		emitTuple(tuple, messageId, streamId, directTask);
	}

	return new collector();

};