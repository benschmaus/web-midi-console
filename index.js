
// request MIDI access
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({
        sysex: false // this defaults to 'false' and we won't be covering sysex in this article. 
    }).then(onMIDISuccess, onMIDIFailure);
} else {
    alert("No MIDI support in your browser.");
}

// midi functions
function onMIDISuccess(midiAccess) {
    // when we get a succesful response, run this code
    console.log('MIDI Access Object', midiAccess);

    var midiIn = midiAccess.inputs;

    var numIns = midiIn.size;

    var midiInsDiv = document.getElementById("midiIns");

    midiInsDiv.innerHTML = "<div>MIDI inputs: " + numIns + "</div>";

    midiIn.forEach(
    	function(port, key) {
    		console.log(port);
    		midiInsDiv.innerHTML += port.manufacturer +  " " + port.name + " - <span id='state'>" + port.state + "</span>";
    		port.onmidimessage = onMIDIMessage;
    		port.onstatechange = onStateChange;
    	}
    );
}

function onMIDIFailure(e) {
    // when we get a failed response, run this code
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
}

function onStateChange(event) {
	console.log(event);
	document.getElementById("state").innerHTML = event.port.state;
}

function onMIDIMessage(message) {
	var data = message.data;
	var console = document.getElementById("midiMessages").elements["console"];
	console.value = data + "\n" + console.value;
}

function write(str) {
	document.writeln(str);
}