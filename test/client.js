var shim = require('es5-shim');
var debugit = require('debugit').enable();
var debug = debugit.add('samsaara:test:timeOffset');

var WebSocket = require('ws');
var samsaara = require('samsaara');
var timeOffset = require('../client');

var test = require('tape').test;
var TapeFence = require('./tapefence');
var fences = {};

var ws;


// test setup

samsaara.expose({
    continueTest: function() {
        console.log('CONTINUING TEST');
        fences['Wait to Continue'].hit('continue');
    }
});


// tests

test('Samsaara Client Exists', function(t) {
    t.equal(typeof samsaara, 'object');
    t.end();
});

test('Samsaara can load Groups middleware', function(t) {
    samsaara.use(timeOffset);
    t.end();
});

test('Samsaara initializes and added to All', function(t) {

    t.plan(1);

    ws = new WebSocket('ws://localhost:8080');

    samsaara.initialize({
        socket: ws
    });

    t.equal(typeof samsaara.core, 'object');
    t.end();
});

test('Wait to Continue', function(t) {

    fences['Wait to Continue'] = new TapeFence(1, function(c) {
        if (c === 'continue') {
            t.equal(typeof samsaara.getTimeOffset(), 'number');
            debug('Client TimeOffset:', samsaara.getTimeOffset());
            t.end();
        }
    });
});

test('End Test', function(t) {
    samsaara.core.execute('doneTest')(function() {
        t.end();
        ws.close();
    });
});
