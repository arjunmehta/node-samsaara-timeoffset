/*!
 * Samsaara Client Time Offset Module
 * Copyright(c) 2014 Arjun Mehta <arjun@newlief.com>
 * MIT Licensed
 */

var debug = require('debug')('samsaara:timeOffset');


var timeOffset = {
  name: "timeOffset",
  clientScript : __dirname + '/client/samsaara-timeoffset.js',
  connectionInitialization: {
    timeOffset: connectionInitialzation
  },
  moduleExports: {
    testTime: testTime // maybe we should add this to the Connection prototype?
  }
};


var connectionController, connections,
    communication,
    ipc;

var options = options || {};
var timeAccuracy = 7;


// the root interface loaded by require. Options are pass in options here.

function main(opts){
  if(opts){
    if(opts.accuracy){
      timeAccuracy = options.accuracy = opts.accuracy;
    }
  }
  return initialize;
}


// samsaara will call this method when it's ready to load it into its middleware stack
// return your main 

function initialize(samsaaraCore){

  connectionController = samsaaraCore.connectionController;
  connections = connectionController.connections;
  communication = samsaaraCore.communication;
  ipc = samsaaraCore.ipc;

  samsaaraCore.addClientFileRoute("samsaara-timeoffset.js", __dirname + '/client/samsaara-timeoffset.js');

  return timeOffset;
}


// Connection Initialization Methods
// Called for every new connection
// 
// @opts: {Object} contains the connection's options
// @connection: {SamsaaraConnection} the connection that is initializing
// @attributes: {Attributes} The attributes of the SamsaaraConnection and its methods

function connectionInitialzation(opts, connection, attributes){

  connection.updateDataAttribute("timeOffset", null);

  connection.connectionTimings = {
    latencies: [],
    measurableDifferences: [],
    clientOffsetGuesses: [],
    afterMin: 10000000000000000000,
    clientOffset: 0
  };

  if(opts.timeOffset !== undefined){
    debug("Initializing Time Offset...");
    if(opts.timeOffset === "force") attributes.force("timeOffset");
    testTime(connection);
  }
}


// Exposed Methods

function testTime (connection){
  var currentTime = Date.now();
  if(connection.connectionTimings.afterMin < 10000000000){
    connection.executeRaw({ns:"internal", func: "testTime", args:[( connection.connectionTimings.afterMin ), currentTime]}, testTimeReturn);
  }
  else{
    connection.executeRaw({ns:"internal", func: "testTime", args:[0, currentTime]}, testTimeReturn);
  }
}


// testTimeReturn is a callback for the above method

function testTimeReturn (originalTime, clientTime, timeError){

  var connection = this;
  var connectionTimings = connection.connectionTimings;

  var currentTime = Date.now();
  var latency = currentTime - originalTime;
  var measurableDifference = currentTime - clientTime;

  var latencies = connection.connectionTimings.latencies;
  var measurableDifferences = connection.connectionTimings.measurableDifferences;
  var clientOffsetGuesses = connection.connectionTimings.clientOffsetGuesses;

  if(latencies.length > timeAccuracy){
    latencies.shift();
    measurableDifferences.shift();
    clientOffsetGuesses.shift();
  }

  latencies.push( latency );
  measurableDifferences.push( measurableDifference );

  var currenAfterMin = min(measurableDifferences);
  if (currenAfterMin < connectionTimings.afterMin) {
    connectionTimings.afterMin = currenAfterMin;
  }

  var lagBehind = latency - timeError;

  if(latencies.length > 2){
    clientOffsetGuesses.push( measurableDifference - lagBehind );
  }

  connectionTimings.clientOffset = median(clientOffsetGuesses);

  if(latencies.length < timeAccuracy){
    testTime(connection);
  }
  else{
    debug("TimeOffset", connection.id, "Time Offset:", connectionTimings.clientOffset);

    connection.updateDataAttribute("timeOffset", connectionTimings.clientOffset);
    connection.executeRaw({ns:"internal", func: "updateOffset", args: [connectionTimings.clientOffset]});
    connection.initializeAttributes.initialized(null, "timeOffset");
    delete connection.connectionTimings;
  }
}


function min(arr){
  if (!isArray(arr)) {
    return false;
  }

  var arrMod = [];
  for(var i=0; i<arr.length; i++){
    arrMod.push(arr[i]);
  }

  arrMod.sort(function(a, b) {
    return a - b;
  });

  return arrMod[0];
}

function median(arr) {
  if (!isArray(arr)) {
    return false;
  }
  
  var arrMod = [];
  for(var i=0; i<arr.length; i++){
    arrMod.push(arr[i]);
  }
  
  arrMod.sort(function(a, b) {
    return a - b;
  });

  var half = Math.floor(arrMod.length / 2);
  if (arrMod.length % 2) return arrMod[half];
  else return (arrMod[half - 1] + arrMod[half]) / 2;
}

function isArray(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
}


module.exports = exports = main;

