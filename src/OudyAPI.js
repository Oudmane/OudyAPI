var OudyAPI = {
    url: {
        socket: null,
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
    send: function(request) {
        if(this.socket && this.socket.readyState == 1) {
            if(request.success && !request.id) {
                request.id = this.getID();
                this.callbacks[request.id] = request.success;
            }
            this.events.beforeSend(request);
            if(typeof request.beforeSend  === 'function')
                request.beforeSend();
            this.socket.send(JSON.stringify(request));
        } else if(this.ajax && this.ajax.readyState != 4) {
            $this = this;
            $.when(this.ajax).done(function() {
                $this.send(request);
            });
        } else {
            this.ajax = $.ajax(
                this.url.ajax+request.uri,
                request
            );
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
            if(this.$this.callbacks.hasOwnProperty(data.id))
                this.$this.callbacks[data.id](data.response, data.id);
        };
    },
    init: function() {
        if(("WebSocket" in window && window.WebSocket != undefined) || ("MozWebSocket" in window))
            this.connect();
    }
};