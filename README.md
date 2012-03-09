# storm-node-multilang

An implementation of the multi-language support for [Storm][0] in **node.js**

## Example Usage

### Spout creation

```javascript
	
	var Spout = require('storm-node-multilang').Spout;

	//The Spout constructor takes a definition function,
	//an input stream and an output stream
    var sentenceEmitter = new Spout(function(events) {
		var collector = null;
		var seqId = 1;

		//You can listen to the spout "open", "ack" and "fail" events to
		events.on('open', function(c) {
			collector = c;
		});

		events.on('ack', function(messageId) {
			console.log(messageId + ' acked');
		});

		events.on('fail', function(messageId) {
			console.log(messageId + ' failed');
		});

		//The definition function must return a function used as
		//the nextTuple function.
		return function(cb) {
			
			collector.emit(["hello"], seqId++);
			cb();

		}

	}, process.stdin, process.stdout);

	
	process.stdin.setEncoding('utf8');
	process.stdin.resume();
    
``` 


### Bolt creation

```javascript
	
	var Bolt = require('storm-node-multilang').Bolt;

	//The Bolt constructor takes a definition function,
	//an input stream and an output stream
    var joinBolt = new Bolt(function(events) {
		var collector = null;

		//You can listen to the bolt "prepare" event to
		//fetch a reference to the OutputCollector instance
		events.on('prepare', function(c) {
			collector = c;
		});

		//The definition function must return a function used as
		//the execute function.
		return function(tuple, cb) {
		
			collector.emit(tuple.values.join(', '));
			collector.ack(tuple);
			cb();
		}

	}, process.stdin, process.stdout);

	process.stdin.setEncoding('utf8');
	process.stdin.resume();
    
``` 

## How to test my node.js spouts and bolts with Storm ?

To test your node.js spouts and bolts you will need to setup a storm cluster 
which is very painful if you don't want to run VM and a Zookeeper cluster.  

Storm provides a `LocalCluster` class to test a topology locally.  

Maybe the easiest way to test your topologies is to use our [storm-local-multilang][1] project.


## Installation

    $ npm install storm-node-multilang

## Running Tests

To run the test suite first invoke the following command within the repo, installing the development dependencies:

    $ npm install

then run the tests (require `mocha`) :

    $ npm test

## Licence

Copyright (c) 2012 Michaël Schwartz, EPOKMEDIA <info@epokmedia.fr>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.



[0]: https://github.com/nathanmarz/storm
[1]: https://github.com/epokmedia/storm-local-multilang