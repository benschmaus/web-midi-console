// don't end the device chain arg to execScript with a semi-colon!
execScript(
  device("Livid Minim Bluetooth")
    .ch(15).cc(10, 42)
);