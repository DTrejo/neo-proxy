# neo-proxy

A man-in-the-middle (mitm) proxy that impersonates the target site and allows
you to modify the target&#39;s http response before sending it back to the
client.

## Should you use this module?

You should use this module if you are interested in changing the HTML of any
site on the internet. I am using it to inject a custom script into sites that I
do not own, this makes it easier for me to test my code on mobile browsers,
before I deploy my changes to my script to these 3rd parties.

## Installation

Download node at [nodejs.org](http://nodejs.org) and install it, if you haven't
already.

```sh
npm install neo-proxy --save
```

## Usage

```js
  var neoProxy = require('neo-proxy')
  neoProxy({
    port: 8888,
    target: 'http://dtrejo.com',
    needle: '</body>',
    customHTML: '<script>alert("Hello, it's working! — DTrejo")</script>',
    rewriteUrlsHost: 'localhost' // or '10.1.1.250'
  })
```

See `example.js` for a more full-fledged version.

## Credits

Thank you [@No9](https://github.com/no9) for <https://github.com/No9/harmon>,
from which I borrowed a good amount of code!
— [@DTrejo](http://dtrejo.com)

## License

MIT
