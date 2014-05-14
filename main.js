/*!
 * Samsaara Client Time Offset Module
 * Copyright(c) 2014 Arjun Mehta <arjun@newlief.com>
 * MIT Licensed
 */

var helper = require('./helper');

function timeOffset(options){

  var config,
      connectionController, connections,
      communication,
      ipc;


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
        clientOffset: 0,
        timeAccuracy: 7
      };

    if(opts.timeOffset !== undefined){
      console.log("Initializing Time Offset...");
      if(opts.timeOffset === "force") attributes.force("timeOffset");
      testTime(connection.id);
    }
  }


  /**
   * Foundation Methods
   */

  function testTime (connID){
    // console.log("Testing Time...");
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

    var currentTime = new Date().getTime();
    var latency = currentTime - originalTime;
    var measurableDifference = currentTime - clientTime;

    if(connection.connectionTimings.latencies.length > connection.connectionTimings.timeAccuracy){
      connection.connectionTimings.latencies.shift();
      connection.connectionTimings.measurableDifferences.shift();
      connection.connectionTimings.clientOffsetGuesses.shift();
    }

    connection.connectionTimings.latencies.push( latency );
    connection.connectionTimings.measurableDifferences.push( measurableDifference );

    var currenAfterMin = helper.min(connection.connectionTimings.measurableDifferences);
    if (currenAfterMin < connection.connectionTimings.afterMin) {
      connection.connectionTimings.afterMin = currenAfterMin;
    }

    var lagBehind = latency - timeError;

    if(connection.connectionTimings.latencies.length > 2){
      connection.connectionTimings.clientOffsetGuesses.push( measurableDifference - lagBehind );
    }

    connection.connectionTimings.clientOffset = helper.median(connection.connectionTimings.clientOffsetGuesses);

    if(connection.connectionTimings.latencies.length < connection.connectionTimings.timeAccuracy){
      testTime(connection.id);
    }
    else{
      console.log(config.uuid, "TimeOffset", connection.id, "Time Offset:", connection.connectionTimings.clientOffset);

      connection.updateDataAttribute("timeOffset", connection.connectionTimings.clientOffset);
      communication.sendToClient(connection.id, {internal: "updateOffset", args: [connection.connectionTimings.clientOffset]});
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