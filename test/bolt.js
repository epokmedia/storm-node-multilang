var Stream = require('stream');

var mocha = require('mocha');
var should = require('should');

var MockStream = require('./mockstream.js');
var Bolt = require('../index').Bolt;

var testBoltDefinition = function(events) {
	var collector = null;

	events.on('prepare', function(c) {
		collector = c;
	});

	return function(tuple, cb) {
		collector.emit(tuple.values.join(', '));
		collector.ack(tuple);
		cb();
	}
}


describe('storm bolt' , function() {

	it('should runs as expected', function(done) {

		var inputStream = new MockStream();
		var outputStream = new MockStream();
		var receivedData = "";
		var doneMatch = false;

		outputStream.on('data', function(data) {
			receivedData += data.toString();
			
			if (!doneMatch && receivedData.indexOf('1, 2, 3, 4') !== -1 && receivedData.indexOf('hello, world') !== -1) {
				done();
				doneMatch = true;
			}
		});

		var bolt = new Bolt(testBoltDefinition, inputStream, outputStream); 

		var input = [
			"/tmp",
			{'some conf' : false},
			{'some context' : true},
			{id:1, comp:2, stream:3, task:4, tuple:['1','2','3','4']},
			{task_ids:[1,2,3,4]},
			{id:2, comp:3, stream:4, task:5, tuple:['hello', 'world']},
			{task_ids:[2,3,4,5]}
		];

		input.forEach(function(i) {
			inputStream.write(JSON.stringify(i) + "\n");
			inputStream.write("end\n");
		})


	});
})