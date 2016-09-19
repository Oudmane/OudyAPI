var jQuery = require('jquery'),
    OudyAPI,
    events = jQuery({});

jQuery.fn.URI = function() {
    switch(this.prop('tagName')) {
        case 'A':
            return this[0].href.replace(location.origin, '');
            break;
        case 'FORM':
            return this[0].action.replace(location.origin, '');
            break;
        default:
            return jQuery(this).attr('href');
            break;
    }
};
jQuery.expr[':'].external = function (a) {
    var PATTERN_FOR_EXTERNAL_URLS = /^(\w+:)?\/\//;
    var href = jQuery(a).URI();
    return href !== undefined && href.search(PATTERN_FOR_EXTERNAL_URLS) !== -1;
};
jQuery.expr[':'].internal = function (a) {
    return jQuery(a).URI() !== undefined && !jQuery.expr[':'].external(a);
};

module.exports = {
    url: {
        socket: '',
        ajax: ''
    },
    socket: null,
    ajax: null,
    callbacks: {},
    send: function(request) {
        if(this.isReady()) {
            if(request.interface)
                OudyAPI.trigger('before:'+request.interface, request);
            this.trigger('before', request);
            if(this.socket) {
                this.trigger('before:socket', request);
                if(request.success && !request.interface) {
                    request.id = this.generateID();
                    this.one('success:'+request.id, function(event, response) {
                        request.success(response.response);
                    });
                }
                this.socket.send(JSON.stringify(request));
            } else {
                this.ajax = jQuery.ajax({
                    url: request.uri,
                    method: (request.method || 'GET'),
                    data: (request.data || false),
                    headers: jQuery.extend(
                        request.interface ? {
                            Interface: request.interface
                        } : {},
                        request.headers || {}
                    ),
                    success: function(response) {
                        if(request.success)
                            request.success(response);
                        else if(request.interface)
                            OudyAPI.trigger('success:'+request.interface, {
                                response: response
                            });
                        OudyAPI.trigger('success', {
                            response: response
                        });
                    },
                    error: function(response) {
                        if(request.error)
                            request.error(response);
                        else if(request.interface)
                            OudyAPI.trigger('error:'+request.interface, {
                                response: response
                            });
                        OudyAPI.trigger('error', {
                            response: response
                        });
                    },
                    complete: function(response) {
                        if(request.complete)
                            request.complete(response);
                        else if(request.interface)
                            OudyAPI.trigger('complete:'+request.interface, {
                                response: response
                            });
                        OudyAPI.trigger('complete', {
                            response: response
                        });
                    }
                });
            }
        } else
            jQuery.when(this.ajax).done(function() {
                OudyAPI.send(request);
            });
    },
    isReady: function() {
        if(this.ajax && [XMLHttpRequest.UNSENT, XMLHttpRequest.DONE].indexOf(this.ajax.readyState) != -1)
            if(this.socket && this.socket.readyState != WebSocket.OPEN)
                return false;
        return true;
    },
    generateID: function() {
        var text = '',
            possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for(var i=0; i < 16; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
    connect: function() {
        if(!this.url.socket)
            this.url.socket = location.protocol.replace('http', 'ws')+'//'+location.hostname;
        this.socket = new WebSocket(this.url.socket);
        this.socket.onopen = function(event) {
            OudyAPI.trigger('socket.open', event);
        };
        this.socket.onerror = function(event) {
            OudyAPI.trigger('socket.error', event);
        };
        this.socket.onclose = function(event) {
            OudyAPI.trigger('socket.close', event);
        };
        this.socket.onmessage = function(response) {
            var data = JSON.parse(response.data),
                id = data.interface | data.id;
            console.log(data.response);
            OudyAPI.trigger('success.'+id, data);
            OudyAPI.trigger('success', data);
            OudyAPI.trigger('complete', data);
        };
    },
    init: function(socket) {
        OudyAPI = this;
        if(socket && (("WebSocket" in window && window.WebSocket != undefined) || ("MozWebSocket" in window)))
            this.connect();
        this.trigger('init', socket);
    },
    on: events.on.bind(events),
    one: events.one.bind(events),
    trigger: events.trigger.bind(events)
};