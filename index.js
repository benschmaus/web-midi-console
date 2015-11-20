var midi = {

onMIDISuccess: function(midiAccess) {
    console.log('MIDI Access Object', midiAccess);
    //console.log(this);

    var self = this;
    midiAccess.onstatechange = function(e) {
        self.onMIDIAccessChange(e);
    }
    this.midiAccess = midiAccess;
    this.inputs = {};
    this.outputs = {};

    this.initPorts();
},

initPorts: function() {    
    var self = this;

    var inputs = this.midiAccess.inputs;
    if (inputs.size > 0) {
        inputs.forEach(
            function(port, key) {
                //console.log(port);
                self.registerPort(port);
            }
        );
    } else {
        $("#midiinputs").append("<p>No connected inputs</p>");
    }

    var outputs = this.midiAccess.outputs;
    if (outputs.size > 0) {
        outputs.forEach(
            function(port, key) {
                self.registerPort(port);        
                self.renderPort(port);
            }
        );
    } else {
        $("#midioutputs").append("<p>No connected outputs</p>"); 
    }
},

onMIDIAccessChange: function(e) {
    console.log(e);
    //console.log(this);
    var port = e.port;
    var portContainer = $("#midi" + port.type + "s");
    if (portContainer.html().startsWith("<p>No connected")) {
        portContainer.empty();
    }

    if (port.type == "input") {
        if (this.inputs[port.name] === undefined) {
            this.registerPort(port);
        }
    } else {
        if (this.outputs[port.name] === undefined) {
            this.registerPort(port);
        }
    }

    this.renderPort(port);
},

renderPort: function(port) {
    if (port.state == "connected") {
        if (!$("#" + port.type + port.id).length) {
            var tmpl = $.templates(
                "<div id='{{:type}}{{:port.id}}'>{{:port.name}}</div>"
            );         
            var html = tmpl.render({ "port": port, "type": port.type });
            $("#midi" + port.type + "s").append(html);
        }
    } else {
        $("#" + port.type + port.id).remove();
    }
},

registerPort: function(port) {
    var self = this;
    if (port.type == "input") {
        this.inputs[port.name] = port;
        port.onmidimessage = function(m) { self.onMIDIMessage(m); };
    } else {
        this.outputs[port.name] = port;
    }

    port.onstatechange = function(e) { self.onPortStateChange(e); };
},

onMIDIFailure: function(e) {
    // when we get a failed response, run this code
    alert("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
},

onPortStateChange: function(event) {
	console.log(event);
},

onMIDIMessage: function(message) {
    console.log(message);

    var port = message.target;
	var data = message.data;
	var msgConsole = document.getElementById("midiMessages").elements["console"];
    msgConsole.value = port.name + ": " + data + "\n" + msgConsole.value;
}

};

if (navigator.requestMIDIAccess) {

    navigator.requestMIDIAccess({
        sysex: false
    }).then(
        function(midiAccess) { midi.onMIDISuccess(midiAccess); },
        function(e) { midi.onMIDIFailure(e); }
    );

} else {
    alert("No MIDI support in your browser.");
}