/*!
 * Samsaara Time Offset Middleware
 * Copyright(c) 2015 Arjun Mehta <arjun@arjunmehta.net>
 * MIT Licensed
 */

var debug = require('debugit').add('samsaara:timeOffset');

var samsaara;


module.exports = {

    name: 'timeOffset',

    initialize: function(extender, capability, options) {

        samsaara = extender.core;

        extender.addConnectionMethods(this.connectionMethods);

        if (options.onConnection) {
            extender.addConnectionInitialization(this.connectionInitialization, {
                forced: options.onConnection === 'required' ? true : false
            });
        }

        samsaara.createNamespace('samsaaraTimeOffset', this.exposedMethods);

        return this;
    },

    exposedMethods: {
        testTime: function(stopTime, clientTime, cb) {
            var clientOffset = clientTime - stopTime;
            var serverTime = new Date().getTime();
            var errorDifference = serverTime - clientOffset;

            cb(clientTime, serverTime, errorDifference);
        },
        updateOffset: function(clientOffset) {
            debug('samsaara: updateOffset:', clientOffset);
            this.setState({
                timeOffset: clientOffset
            });
        }
    },

    connectionMethods: {
        getTimeOffset: function(cb) {
            this.nameSpace('samsaaraTimeOffset').execute('getTimeOffset')(function(clientOffset) {
                debug('Client Offset', clientOffset);

                this.setState({
                    timeOffset: clientOffset
                });

                if (typeof cb === 'function') {
                    cb(clientOffset);
                }
            });
        }
    },

    connectionInitialization: function(connection, done) {
        connection.nameSpace('samsaaraTimeOffset').execute('getTimeOffset')(function(clientOffset) {
            debug('Client Offset', clientOffset);

            this.setState({
                timeOffset: clientOffset
            });

            done();
        });
    }
};
