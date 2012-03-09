var util = require("util"),
    Stream = require("stream").Stream;

module.exports = MockStream;

/**
 * A constructor that inherits from Stream and emits data from the given
 * `source`. If it's a Stream it will be piped through to this stream.
 * Otherwise, it should be a string or a Buffer which will be emitted by this
 * stream as soon as possible.
 */
function MockStream(source) {
    Stream.call(this);

    this._chunks = [];
    this._wait = false;
    this.encoding = null;
    this.readable = true;
    this.writable = true;

    var self = this;

    process.nextTick(function () {
        if (self.readable || self._chunks.length) {
            var hasData = self._chunks.length != 0;

            var chunk;
            while (self.readable && self._chunks.length && !self._wait) {
                chunk = self._chunks.shift();

                if (self.encoding) {
                    self.emit("data", chunk.toString(self.encoding));
                } else {
                    self.emit("data", chunk);
                }
            }

            if (hasData && self._chunks.length == 0) {
                self.emit("drain");
            }

            process.nextTick(arguments.callee);
        }
    });

}

util.inherits(MockStream, Stream);

MockStream.prototype.setEncoding = function setEncoding(encoding) {
    this.encoding = encoding;
}

MockStream.prototype.pause = function pause() {
    this._wait = true;
    this.emit("pause");
}

MockStream.prototype.resume = function resume() {
    this._wait = false;
    this.emit("resume");
}

MockStream.prototype.write = function write(chunk) {
    if (typeof chunk == "string") {
        chunk = new Buffer(chunk);
    }

    this._chunks.push(chunk);
}

MockStream.prototype.end = function end(chunk) {
    if (chunk) {
        this.write(chunk);
    }

    var self = this;

    this.destroySoon(function () {
        self.emit("end");
    });
}

MockStream.prototype.destroy = function destroy() {
    this._chunks = [];
    this.readable = false;
    this.writable = false;
}

MockStream.prototype.destroySoon = function destroySoon(callback) {
    var self = this;

    process.nextTick(function () {
        if (self._chunks.length == 0) {
            self.destroy();
            if (typeof callback == "function") {
                callback();
            }
        } else {
            process.nextTick(arguments.callee);
        }
    });
}