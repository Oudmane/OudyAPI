OudyAPI = {
    url: {
        socket: '',
        ajax: ''
    },
    busy: false,
    socket: null,
    ajax: null,
    data: {},
    connect: function() {
        this.socket = new WebSocket(this.url.socket);
        this.socket.onopen = this.events.open;
        this.socket.onerror = this.events.error;
        this.socket.onclose = this.events.close;
        this.socket.onmessage = this.events.message;
    },
    events: {
        open: function(event) {
            
        },
        close: function(event) {
            
        },
        message: function(event) {
            
        },
        error: function(event) {
            
        }
    },
    send: function(request) {
        if(this.ajax && this.ajax.readyState != 4) {
            $this = this;
            $.when(this.ajax).done(function() {
                $this.send(request);
            });
        } else {
            request.xhrFields = {
                withCredentials: true
            };
            this.ajax = $.ajax(
                this.url.ajax+request.uri,
                request
            );
        }
    },
    parse: function(uri) {
        var a =  document.createElement('a');
        a.href = url;
        return {
            uri: a.pathname,
            query: a.search.replace(/^\?/, '')
        };
    },
    get: function(request) {
        $this = this;
        request.data = $.extend({}, $this.data, request.data);
        request.method = 'GET';
        this.send(request);
    }
};