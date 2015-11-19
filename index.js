var midi = {

onMIDISuccess: function(midiAccess) {
    console.log('MIDI Access Object', midiAccess);
    //console.log(this);

    var self = this;
    midiAccess.onstatechange = function(e) {
        self.onMIDIAccessChange(e);
    }
    this.midiAccess = midiAccess;
    this.initInputs();
},

initInputs: function() {    
    var self = this;

    $("#midiIns").empty();

    var html = "";  
    this.midiAccess.inputs.forEach(
        function(port, key) {
            
            console.log(port);            
            var tmpl = $.templates(
                "{{:port.manufacturer}} {{:port.name}}"
            );
            html += tmpl.render({ "port": port });

            port.onmidimessage = function(m) { self.onMIDIMessage(m); };
            port.onstatechange = function(e) { self.onPortStateChange(e); };
        }
    );
    $("#midiIns").html(html);
},

onMIDIAccessChange: function(e) {
    console.log(e);
    //console.log(this);
    this.initInputs();
},

onMIDIFailure: function(e) {
    // when we get a failed response, run this code
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
},

onPortStateChange: function(event) {
	console.log(event);
},

onMIDIMessage: function(message) {
    console.log(message);

	var data = message.data;
	var msgConsole = document.getElementById("midiMessages").elements["console"];
    msgConsole.value = data + "\n" + msgConsole.value;
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