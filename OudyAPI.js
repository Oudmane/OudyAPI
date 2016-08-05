var jQuery = require('jquery');

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
    busy: false,
    socket: null,
    ajax: null,
    events: {
        open: function(event) {},
        close: function(event) {},
        message: function(event) {},
        error: function(event) {},
        beforeSend: function(request) {}
    },
    callbacks: {},
    interface: 'api',
    send: function(request) {
        if(!request.interface)
            request.interface = this.interface;
        if(this.socket && this.socket.readyState == 1) {
            if(request.success && !request.id && request.success) {
                request.id = this.getID();
                this.callbacks[request.id] = request.success;
            }
            this.events.beforeSend(request);
            if(typeof request.beforeSend  === 'function')
                request.beforeSend();
            this.socket.send(JSON.stringify(request));
        } else {
            request.headers = jQuery.extend(
                {},
                {
                    Interface: request.interface
                },
                request.headers || {}
            );
            if(!request.success)
                request.success = this.callbacks[request.interface];
            if(this.ajax && this.ajax.readyState != 4) {
                $this = this;
                jQuery.when(this.ajax).done(function() {
                    $this.send(request);
                });
            } else {
                this.ajax = jQuery.ajax(
                    this.url.ajax+request.uri,
                    request
                );
            }
        }
    },
    getID: function() {
        var text = '',
            possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for(var i=0; i < 16; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
    connect: function() {
        this.socket = new WebSocket(this.url.socket);
        this.socket.$this = this;
        this.socket.onopen = this.events.open;
        this.socket.onerror = this.events.error;
        this.socket.onclose = this.events.close;
        this.socket.onmessage = function(response) {
            data = JSON.parse(response.data);
            this.$this.events.message(data);
            if(data.interface)
                this.$this.callbacks[data.interface](data.response, data.id);
            else if(this.$this.callbacks.hasOwnProperty(data.id)) {
                this.$this.callbacks[data.id](data.response, data.id);
                delete this.$this.callbacks[data.id];
            }
        };
    },
    init: function() {
        if(("WebSocket" in window && window.WebSocket != undefined) || ("MozWebSocket" in window))
            this.connect();
    }
};