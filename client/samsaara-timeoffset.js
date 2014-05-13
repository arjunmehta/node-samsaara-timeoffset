/*!
 * Samsaara Client Time Offset Module
 * Copyright(c) 2014 Arjun Mehta <arjun@newlief.com>
 * MIT Licensed
 */
 
var timeoffset = (function(module){

  module.internalMethods = {
    testTime: function(stopTime, serverTime, callBack){
      var serverOffset = serverTime - stopTime;
      var theTime = new Date().getTime();
      var errorDifference = theTime - serverOffset;

      if(typeof callBack === "function") callBack(serverTime, theTime, errorDifference);
    },
    updateOffset: function (timeOffset){
      console.log("Samsaara: updateOffset():", timeOffset);
      samsaara.timeOffset = timeOffset;
    }
  };

  module.initializationMethods = {};
  module.closeMethods = {};

  return module;

}(this.timeoffset = this.timeoffset || {}));

samsaara.use(timeoffset);