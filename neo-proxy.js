var http = require('http')
var url = require('url')

var connect = require('connect')
var httpProxy = require('http-proxy')

module.exports = neoProxy

function neoProxy(options) {
  console.assert(options.port >= 0, "Please specify a port")
  console.assert(options.target, "Please specify a target")
  console.assert(options.needle, "Please pass in a needle")
  console.assert(options.customHTML, "Please provide customHTML")
  options.rewriteUrlsHost = options.rewriteUrlsHost || 'localhost'

  //
  // Rewrite URLs of HTML link elements with your local host IP
  //
  var rewriteUrlsScript = ''
  if (options.rewriteUrlsHost) {
    rewriteUrlsScript = "<script>"
    rewriteUrlsScript += rewriteUrlsFunction + "; rewriteUrlsFunction('"
      + options.target + "', '" + options.rewriteUrlsHost + "', "
      + options.port + ");"
    rewriteUrlsScript += "</script>"
  }

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
  console.log('http://localhost:%s -> %s, hrefs %s'
    , options.port , options.target, options.rewriteUrlsHost)

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
        chunk = chunk.replace(options.needle, options.customHTML + rewriteUrlsScript + options.needle)

        console.log('%s: Found `%s` and prepended `%s`'
          , options.target, options.needle, options.customHTML)
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

function rewriteUrlsFunction (host, localHost, port) {
  var links = document.getElementsByTagName('a');
  for (var i = links.length - 1; i >= 0; i--) {
    var link = links[i]
    var href = link.getAttribute('href')
    if (href && href.indexOf(host) > -1 ) {
      link.setAttribute('href', href.replace(host, 'http://' + localHost + ':' + port) + '?host=' + host)
    };
  };
}
