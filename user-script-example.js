
userCommands(
  function() {
    var d = device("Livid Minim Bluetooth").ch(15);
    for (var i = 10; i < 18; i++) {
    	d.cc(i, 42);
    }
  }
);