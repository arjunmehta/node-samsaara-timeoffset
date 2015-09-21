/*!
 * Samsaara Time Offset Middleware
 * Copyright(c) 2015 Arjun Mehta <arjun@arjunmehta.net>
 * MIT Licensed
 */

var debug = require('debugit').add('samsaara:timeOffset');

var timeAccuracy = 7;

var clientOffset = 0;
var clientOffsetGuesses = [];
var latencies = [];
var measurableDifferences = [];
var afterMin = 1000000000000000;

var doneInitialization;
var samsaara;


module.exports = {

    name: 'timeOffset',

    initialize: function(extender, capability, options) {

        samsaara = extender.core;

        samsaara.createNamespace('samsaaraTimeOffset', this.exposedMethods);
        extender.addCoreObjects(this.coreObjects);

        return this;
    },

    coreObjects: {
        getTimeOffset: function() {
            return clientOffset;
        },
        updateTimeOffset: function() {
            return clientOffset;
        }
    },

    exposedMethods: {
        testTimeOffset: function(cb) {
            doneInitialization = cb;
            testTime();
        }
    }
};


function testTimeReturn(originalTime, clientTime, errorDifference) {

    var currentTime = new Date().getTime();
    var latency = currentTime - originalTime;
    var measurableDifference = currentTime - clientTime;

    var currenAfterMin;
    var lagBehind;

    if (latencies.length > timeAccuracy) {
        latencies.shift();
        measurableDifferences.shift();
        clientOffsetGuesses.shift();
    }

    latencies.push(latency);
    measurableDifferences.push(measurableDifference);

    currenAfterMin = min(measurableDifferences);
    if (currenAfterMin < afterMin) {
        afterMin = currenAfterMin;
    }

    lagBehind = latency - errorDifference;

    if (latencies.length > 2) {
        clientOffsetGuesses.push(measurableDifference - lagBehind);
    }

    clientOffset = median(clientOffsetGuesses);

    if (latencies.length < timeAccuracy) {
        continueToTestTime();
    } else {
        debug('Time Offset:', clientOffset);

        if (typeof doneInitialization === 'function') {
            doneInitialization(clientOffset);
            doneInitialization = undefined;
        }
    }
}


function testTime() {
    var currentTime = new Date().getTime();
    samsaara.core.nameSpace('samsaaraTimeOffset').execute('testTime')(0, currentTime, testTimeReturn);
}


function continueToTestTime() {
    var currentTime = new Date().getTime();
    samsaara.core.nameSpace('samsaaraTimeOffset').execute('testTime')(afterMin, currentTime, testTimeReturn);
}


// helpers

function min(arr) {

    var arrMod = [];
    var i;

    if (!Array.isArray(arr)) {
        return false;
    }

    for (i = 0; i < arr.length; i++) {
        arrMod.push(arr[i]);
    }

    arrMod.sort(function(a, b) {
        return a - b;
    });

    return arrMod[0];
}

function median(arr) {

    var arrMod = [];
    var i;
    var half;
    var medianValue;

    if (!Array.isArray(arr)) {
        return false;
    }

    for (i = 0; i < arr.length; i++) {
        arrMod.push(arr[i]);
    }

    arrMod.sort(function(a, b) {
        return a - b;
    });

    half = Math.floor(arrMod.length / 2);

    if (arrMod.length % 2) {
        medianValue = arrMod[half];
    } else {
        medianValue = (arrMod[half - 1] + arrMod[half]) / 2;
    }

    return medianValue;
}
