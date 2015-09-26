#samsaara time offset

[![Build Status](https://travis-ci.org/arjunmehta/node-samsaara-timeoffset.svg?branch=1.0.0)](https://travis-ci.org/arjunmehta/node-samsaara-timeoffset)

Time Offset middleware for [samsaara](https://www.github.com/arjunmehta/node-samsaara). Use this module to:

- **Calculate the clock time difference between server and clients.**

**Note:** *Use of this module requires familiarity with [samsaara](https://www.github.com/arjunmehta/node-samsaara) (of course). It's amazing and you'll love it. Get familiarized.*

## Installation

```bash
npm install --save samsaara-timeoffset
```

## Basic Usage

### Client Side

In order to capture and calculate the time differential of clients you must add the `samsaara-timeoffset` middleware to your client samsaara instance. Refer to the samsaara module documentation to see how to add middleware.

```javascript
var samsaara = require('samsaara')
var timeOffset = require('samsaara-timeoffset')

samsaara
  .use(timeOffset)
  .initialize({
    socket: ws
  })
```

#### Client event listeners
Set listeners to do something when the client time offset has been calculated.

```javascript
samsaara.on('time offset', function(offset){
  console.log('This client is', offset, 'milliseconds ahead of the server')
})
```

#### Get offset value.
A negative offset value means the client's clock is behind the server. And a positive value means the client's clock is ahead of the server.


### Server Side

Just add the timeoffset middleware to your samsaara instance. 

Use the `onConnection` option to get the connecting client's timeOffset when they connect. Set it to `'required'` if the query is a requirement for `initialization`. If you're not familiar with what this means, definitely read this section in the samsaara readme about initialization.

```javascript
var samsaara = require('samsaara')
var timeOffset = require('samsaara-timeoffset')

samsaara
  .use(timeOffset, {
    onConnection: 'required' // or true or false
  })
  .initialize({
    socketType: 'ws'
  })
```

#### Get Connection's Time Offset
You can get the last updated connection time offset by referring to the connection's `state` object. This only works if the connection's offset has been queried before, but may not be the most accurate value.

```javascript
var offset = connection.state.timeOffset;
```

If you want to update the state or force a recalculation of the connection's offset:

```javascript
connection.getTimeOffset(function(offset){
  console.log('This connection\'s time offset is:', offset)
})
```


## License
The MIT License (MIT)

Copyright (c) 2015 Arjun Mehta