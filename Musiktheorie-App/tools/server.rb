# encoding: utf-8
# Kleiner lokaler Webserver fuer die Vorschau (nur auf diesem Rechner erreichbar).
# Start im Terminal:  ruby tools/server.rb   ->  http://localhost:8417
require 'webrick'
root = File.expand_path('..', __dir__)
mime = WEBrick::HTTPUtils::DefaultMimeTypes.merge(
  'js' => 'text/javascript', 'mjs' => 'text/javascript', 'woff2' => 'font/woff2',
  'webmanifest' => 'application/manifest+json', 'svg' => 'image/svg+xml', 'mp3' => 'audio/mpeg')
s = WEBrick::HTTPServer.new(
  Port: (ARGV[0] || 8417).to_i, BindAddress: '127.0.0.1', DocumentRoot: root, MimeTypes: mime,
  RequestCallback: proc { |_req, res| res['Cache-Control'] = 'no-store' })
trap('INT') { s.shutdown }
trap('TERM') { s.shutdown }
s.start
