# web-midi-console
Web MIDI Chrome app for viewing messages from connected MIDI devices and sending messages to them.

You can try out the Web MIDI Console at [factotumo.com/web-midi-console/](https://factotumo.com/web-midi-console/).

If you'd like to develop locally, do the following.

1. ```$ git clone git@github.com:benschmaus/web-midi-console.git```
2. ``` $ cd web-midi-console && python -m SimpleHTTPServer 8000```

You can then open http://localhost:8000 in your browser to see a locally running console.  The document root of the server is the directory the server is started from.  In the above example, it would be ```<your-checkout-dir>/web-midi-console```.

Feedback, feature requests, etc. are welcome.
