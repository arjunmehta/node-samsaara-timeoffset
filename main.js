/*!
 * Samsaara Client Time Offset Module
 * Copyright(c) 2014 Arjun Mehta <arjun@newlief.com>
 * MIT Licensed
 */

var debug = require('debug')('samsaara:timeOffset');

function timeOffset(options){

  var config,
      connectionController, connections,
      communication,
      ipc;

  options = options || {};

  var timeAccuracy = options.accuracy || 7;


  /**
   * Connection Initialization Methods
   * Called for every new connection
   *
   * @opts: {Object} contains the connection's options
   * @connection: {SamsaaraConnection} the connection that is initializing
   * @attributes: {Attributes} The attributes of the SamsaaraConnection and its methods
   */

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
      testTime(connection.id);
    }
  }


  /**
   * Foundation Methods
   */

  function testTime (connID){
    var currentTime = new Date().getTime();
    if(connections[connID].connectionTimings.afterMin < 10000000000){
      communication.sendToClient(connID, {internal: "testTime", args:[( connections[connID].connectionTimings.afterMin ), currentTime]}, testTimeReturn);
    }
    else{
      communication.sendToClient(connID, {internal: "testTime", args:[0, currentTime]}, testTimeReturn);
    }
  }


  // note testTimeReturn is a callback for the above method

  function testTimeReturn (originalTime, clientTime, timeError){

    var connection = this.connection;
    var connectionTimings = connection.connectionTimings;

    var currentTime = new Date().getTime();
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
      testTime(connection.id);
    }
    else{
      debug("TimeOffset", connection.id, "Time Offset:", connectionTimings.clientOffset);

      connection.updateDataAttribute("timeOffset", connectionTimings.clientOffset);
      communication.sendToClient(connection.id, {internal: "updateOffset", args: [connectionTimings.clientOffset]});
      connection.initializeAttributes.initialized(null, "timeOffset");
      delete connection.connectionTimings;
    }

  }




  /**
   * Module Return Function.
   * Within this function you should set up and return your samsaara middleWare exported
   * object. Your eported object can contain:
   * name, foundation, remoteMethods, connectionInitialization, connectionClose
   */

  return function timeOffset(samsaaraCore){

    config = samsaaraCore.config;
    connectionController = samsaaraCore.connectionController;
    connections = connectionController.connections;
    communication = samsaaraCore.communication;
    ipc = samsaaraCore.ipcRedis;

    samsaaraCore.addClientFileRoute("samsaara-timeoffset.js", __dirname + '/client/samsaara-timeoffset.js');

    var exported = {

      name: "timeOffset",

      clientScript: __dirname + '/client/samsaara-timeoffset.js', 

      connectionInitialization: {
        timeOffset: connectionInitialzation
      },

      foundationMethods: {
        testTime: testTime
      }
    };

    return exported;

  };

}

module.exports = exports = timeOffset;


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
