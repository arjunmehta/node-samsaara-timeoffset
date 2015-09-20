var debugit = require('debugit').enable();
var debug = debugit.add('samsaara:test:timeOffset');

var test = require('tape').test;
var TapeFence = require('./tapefence');

var fences = {};

var WebSocketServer = require('ws').Server;
var samsaara = require('samsaara');
var timeOffset = require('../main');

var connectionCount = 0;

var wss = new WebSocketServer({
    port: 8080
});


// test setup

samsaara.on('initialized', function(connection) {
    debug('Connection Initialized', connection.name);
    fences['Connection Initialized'].hit(connection);
});

wss.on('connection', function(ws) {
    samsaara.newConnection(ws, 'connection' + connectionCount++);
});

samsaara.expose({
    doneTest: function(cb) {
        cb(true);
        fences['Done Test'].hit(this);
    }
});


// tests

test('Samsaara Server Exists', function(t) {
    t.equal(typeof samsaara, 'object');
    t.end();
});

test('Samsaara can load TimeOffset middleware', function(t) {
    samsaara.use(timeOffset, {
        forced: true
    });
    t.end();
});

test('Samsaara can initialize', function(t) {
    var initialized = samsaara.initialize();
    t.equal(initialized, samsaara);
    t.end();
});

test('Wait for X Connections', function(t) {

    fences['Connection Initialized'] = new TapeFence(1, function() {
        t.equal(typeof samsaara.connection('connection0'), 'object');
        t.equal(typeof samsaara.connection('connection0').state, 'object');
        t.equal(typeof samsaara.connection('connection0').state.timeOffset, 'number');

        debug('Client offset is:', samsaara.connection('connection0').state.timeOffset);

        t.end();
    });
});

test('Hold Test', function(t) {
    setTimeout(function() {
        samsaara.group('all').execute('continueTest')();
        t.end();
    }, 500);
});

test('Close Test', function(t) {
    fences['Done Test'] = new TapeFence(1, function() {
        wss.close();
        t.end();
    });
});
