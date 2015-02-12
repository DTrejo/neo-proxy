var startingPort = 8000

var neoProxy = require('./')

var exec = require('shelljs').exec

var customHTML = '<script>alert("also visible at http://'+geten0BroadcastIP()
  +':'+startingPort+'")</script>'

var batman = neoProxy({
  port: startingPort,
  target: 'http://dtrejo.com',
  needle: '</body>',
  customHTML: customHTML
})

function geten0BroadcastIP() {
  var out = exec('ifconfig', { silent: true }).output
  out = out.slice(out.indexOf('en0'), out.length)
  out = out.slice(out.indexOf('inet ') + 'inet '.length, out.indexOf('netmask'))
  var ip = out = out.trim()
  return ip
};
