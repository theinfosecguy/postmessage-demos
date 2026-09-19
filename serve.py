from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from threading import Thread
handler = partial(SimpleHTTPRequestHandler, directory=str(Path(__file__).parent / 'public'))
for port in (4173, 4174):
    server = ThreadingHTTPServer(('127.0.0.1', port), handler)
    Thread(target=server.serve_forever, daemon=True).start()
print('Host http://localhost:4173/demo-5.html; widget http://localhost:4174/widget.html', flush=True)
__import__('threading').Event().wait()
