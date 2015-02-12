var http = require('http')
var url = require('url')

var connect = require('connect')
var httpProxy = require('http-proxy')

module.exports = neoProxy

function neoProxy(options) {
  console.assert(options.port >= 0)
  console.assert(options.target)
  console.assert(options.needle)
  console.assert(options.customHTML)

  //
  // properly configure the proxy to pretend that the request came from the
  // original host.
  //
  var proxy = httpProxy.createProxyServer()
  var dest = url.parse(options.target)
  var proxyOptions = {
    target: dest.href
  , hostRewrite: false // not super sure what this does.
  }
  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    proxyReq.setHeader('host', dest.host)
    proxyReq.removeHeader('accept-encoding')
  })

  //
  // Basic Connect App w/ harmon
  //
  var app = connect()
  app.use(replacer)
  app.use(function (req, res) {
    proxy.web(req, res, proxyOptions)
  })
  app.listen(options.port)
  console.log('%s neoProxy: Listening on http://localhost:%s'
    , options.target, options.port)
  console.log('%s neoProxy: Will find `%s` and prepend\n`%s`.'
    , options.target, options.needle, options.customHTML)
  console.log()

  // via http://ghub.io/harmon
  function replacer(req, res, next) {
    if (req.url.indexOf('.js') > -1 || req.url.indexOf('.css') > -1) {
      return next()
    }

    var _write      = res.write
    var _end        = res.end
    var _writeHead  = res.writeHead

    // Assume response is binary by default
    res.isHtml = false

    res.writeHead = function (code, headers) {
      var contentType = this.getHeader('content-type')

      /* Sniff out the content-type header.
       * If the response is HTML, we're safe to modify it.
       */
      if ((typeof contentType != 'undefined') && (contentType.indexOf('text/html') == 0)) {
        res.isHtml = true

        // Strip off the content length since it will change.
        res.removeHeader('Content-Length')
      }

      _writeHead.apply(res, arguments)
    }

    res.write = function (data, encoding) {
      // Only run data through replacer if we have HTML, and needle is present
      var chunk = ''
      if (res.isHtml && (chunk = data.toString(encoding)) && chunk.indexOf(options.needle) > -1) {
        chunk = chunk.replace(options.needle, options.customHTML + options.needle)
        _write.call(res, new Buffer(chunk))

      } else {
        _write.apply(res, arguments)
      }
    }

    res.end = function (data, encoding) {
      _end.call(res)
    }

    next()
  }

  options.app = app
  options.proxy = proxy

  return options
}
