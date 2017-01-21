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
        height: 225,
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

function userCommands(commandFunc) {
    return commandFunc();
}

function exec(url) {
  console.log("running script from: " + url);
  $('#scriptsContainer').append(
     $('<script type="text/javascript" src="' + url + '"></script>')
  );
}

var device = function(outputName) {
   this.current = midi.outputs[outputName];
   this.channel = 1;
   
   // makes device visible inside of nested function defs
   var self = this;

   this._send = function(status, data) {
    var messageArr = [status + (self.channel - 1)].concat(data);
    console.log("sending " + messageArr + " to " + self.current.name);
    self.current.send(messageArr);
    return self;
   }

   this.ch = function(channel) {
      self.channel = channel;
      return self;
   }

   this.cc = function(b1, b2) {
    return self._send(messages.cc, [b1, b2]);
   }

   this.on = function(b1, b2) {
    return self._send(messages.on, [b1, b2]);
   }

   this.off = function(b1, b2) {
    return self._send(messages.off, [b1, b2]);
   }

   this.pp = function(b1, b2) {
    return self._send(messages.pp, [b1, b2]);
   }

   this.cp = function(b1) {
    return self._send(messages.cp, [b1]);
   }

   this.pb = function(b1) {
    return self._send(
        messages.pb, [
            b1 & 127,
            b1 >> 7
        ]
    );
   }

   this.pc = function(b1) {
    return self._send(messages.pc, [b1]);
   }

   this.panic = function() {
    return self.cc(123, 0)
   }

   this.rpn = function(b1, b2) {
    return self.cc(101, b1 >> 7)
        .cc(100, b1 & 127)
        .cc(6, b2 >> 7)
        .cc(38, b2 & 127)
        .cc(101, 127)
        .cc(100, 127);
   }

   this.nrpn = function(b1, b2) {
    return self.cc(99, b1 >> 7)
        .cc(98, b1 & 127)
        .cc(6, b2 >> 7)
        .cc(38, b2 & 127)
        .cc(101, 127)
        .cc(100, 127);
   }   

   this.raw = function(data) {
    console.log("sending raw data: " + data);
    self.current.send(data);
    return self;
   }

   this.toString = function() {
    var s = "no connected devices";
    if (typeof this.current != 'undefined') {
        s = "";
    }
    return s;
   }

   return this;
};

function po(obj) {
  return JSON.stringify(obj);
}

function po2(obj) {
    var s = "{ ";
    for (prop in obj) {
        s += prop + "=";

        var value = obj[prop];
        if (typeof value == "object") {
            s += po2(value);
        } else {
            s += value;
        }
        s += ", ";
    }
    return s.substring(0, s.length-1) + " }";
}

function scriptHelp() {
    return `
exec(url)           run commands in external url

You can run device chain commands from a remote url.
To use this approach, the document located at the
given url must return an invocation of the "userCommands"
function, which itself takes a function as an argument.
The body of the function passed to "userCommands" should
contain your code.

Here's a template:

userCommands(
  function() {
    // your code here
  }
);

And here's an example:

userCommands(
  function() {
    var d = device("Livid Minim Bluetooth").ch(15);
    for (var i = 10; i < 18; i++) {
        d.cc(i, 42);
    }
  }
);

Note that you're free (but not required) to use any JavaScript
you see fit in the passed function.  Or you can just have
basic device chain manipulations similar to:

userCommands(
  function() {
    device("MIDI Output Name").on(84, 127).cc(21, 100).off(84, 127);
  }
);
`;
}

function help() {
  return `
device(outputName)  selects a MIDI output port, must always be called first!
ch(number)          set MIDI channel number (1-16) 
on(note, vel)       send note on for note (0-127) with velocity (0-127)
off(note, vel)      send note off for note (0-127) with velocity (0-127)
cc(number, value)   send CC number (0-127) with value (0-127)
pp(note, value)     send poly pressure for note (0-127) with value (0-127)
cp(value)           send channel pressure value (0-127)
pc(number)          send program change number (0-127)
pb(value)           send pitch bend with value (0-16383)
rpn(number, value)  send rpn number (0-16383) with value (0-16383)
nrpn(number, value) send nrpn number (0-16383) with value (0-16383)
panic()             send all notes off
raw(dataArray)      send array of bytes
exec(url)           run commands in external url, run scriptHelp() for detailed usage info

examples:
  device("Device Output Name").ch(15).cc(14, 42).cc(15, 42).cc(16, 42).cc(17, 42)

  exec("https://rawgit.com/benschmaus/web-midi-console/master/user-script-example
.js")

  device("Livid Minim Bluetooth").raw([190, 10, 42, 190, 11, 42, 190, 12, 42, 190
, 13, 42])

  (scroll up to see start of help.)
`;  
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