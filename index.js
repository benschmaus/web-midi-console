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
},

initTerminal: function() {
    jQuery(function($, undefined) {
    $('#jsTerm').terminal(function(command, term) {
        if (command !== '') {
            try {
                var result = window.eval(command);
                if (result !== undefined) {
                    term.echo(new String(result));
                }
            } catch(e) {
                term.error(new String(e));
            }
        } else {
           term.echo('');
        }
    }, {
        greetings: "Send messages to outputs here. Type 'help()' for list of commands.",
        name: 'MIDI Console',
        height: 150,
        // adjust width relative to textarea
        width: parseInt($("#messageBox").css("width").substring(0, 3)) - 16,
        prompt: '> '
    });
  });
}

};

// status bytes on channel 1
var messages = {
    off: 128,
    on: 144,
    pp: 160,
    cc: 176,
    pc: 192,
    cp: 208,
    pb: 224
}

var device = function(outputName) {
   this.current = midi.outputs[outputName];
   this.channel = 1;
   
   // makes device visible inside of nested function defs
   var self = this;

   this._send = function(status, b1, b2) {
    self.current.send([status + (self.channel - 1), b1, b2]);
    return self;
   }

   this.ch = function(channel) {
      self.channel = channel;
      return self;
   }

   this.cc = function(b1, b2) {
    return self._send(messages.cc, b1, b2);
   }

   this.on = function(b1, b2) {
    return self._send(messages.on, b1, b2);
   }

   this.off = function(b1, b2) {
    return self._send(messages.off, b1, b2);
   }

   this.pp = function(b1, b2) {
    return self._send(messages.pp, b1, b2);
   }

   this.cp = function(b1, b2) {
    return self._send(messages.cp, b1, b2);
   }

   this.pc = function(b1, b2) {
    return self._send(messages.pc, b1, b2);
   }

   this.panic = function() {
    return self.cc(123, 0)
   }

   this.raw = function(data) {
    return self._send(data);
   }

   this.toString = function() {
    var s = "no connected devices";
    if (typeof this.current != 'undefined') {
        s = "sent to " + outputName;
    }
    return s;
   }

   return this;
};

function help() {
  return "commands list here...";   
}

if (navigator.requestMIDIAccess) {

    navigator.requestMIDIAccess({
        sysex: true
    }).then(
        function(midiAccess) { midi.onMIDISuccess(midiAccess); },
        function(e) { midi.onMIDIFailure(e); }
    );

    midi.initTerminal();

} else {
    alert("No MIDI support in your browser.");
}