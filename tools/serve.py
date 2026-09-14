#!/usr/bin/env python3
"""Tiny static server for local preview.

`python3 -m http.server` evaluates os.getcwd() at import time, which blows up
when the launcher hands the process a working directory it can't stat. This
wrapper chdirs into the project first, so the module never sees a bad cwd.
"""
import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8899

os.chdir(ROOT)


class Handler(http.server.SimpleHTTPRequestHandler):
    # Freshly generated CSS/JS must never be served from cache while iterating.
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
    print(f"serving {ROOT} on http://127.0.0.1:{PORT}", flush=True)
    httpd.serve_forever()
