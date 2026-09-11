"""Local preview server with one explicit equipment-fit write operation."""
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
BUILD_LOCK = threading.Lock()


class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def reply(self, status, data):
        raw = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        match = re.fullmatch(r'/__workshop/apply/([a-z0-9-]+)', self.path)
        if not match:
            return self.reply(404, {'error': 'Unknown operation'})
        # A local project write must come from this preview, not another website.
        if self.headers.get('Origin') != 'http://' + self.headers.get('Host', ''):
            return self.reply(403, {'error': 'Open the workshop on this local server'})
        if not BUILD_LOCK.acquire(blocking=False):
            return self.reply(409, {'error': 'A set is being applied. Try again when it finishes.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 262144:
                raise ValueError('Invalid fit size')
            payload = json.loads(self.rfile.read(length))
            set_id = match[1]
            folder = ROOT / 'design' / 'sets' / set_id
            manifest = folder / 'set.json'
            spec = json.loads(manifest.read_text(encoding='utf-8'))
            edits = payload.get('parts', [])
            if not isinstance(edits, list) or len(edits) != len(spec['parts']):
                raise ValueError('The fit must contain every part of this set')
            if {p.get('id') for p in edits} != {p['id'] for p in spec['parts']}:
                raise ValueError('Part IDs do not match this set')
            for part in spec['parts']:
                edit = next(p for p in edits if p['id'] == part['id'])
                target, size, rotation = edit.get('target'), edit.get('size'), edit.get('rotation', 0)
                if not isinstance(target, list) or len(target) != 2 or not isinstance(size, list) or len(size) != 2:
                    raise ValueError('Invalid position or size')
                if not all(type(v) in (int, float) and math.isfinite(v) for v in [*target, *size, rotation]):
                    raise ValueError('Fit values must be finite numbers')
                if not all(abs(v) <= 3000 for v in target) or not all(5 <= v <= 1000 for v in size) or abs(rotation) > 180:
                    raise ValueError('Fit values are outside the supported range')
                part.update(target=target, size=size, rotation=rotation)
            # Build first. Invalid/clipped poses leave the current project assets untouched.
            with tempfile.TemporaryDirectory(prefix='.fit-', dir=ROOT / 'qa') as temp:
                temp = Path(temp)
                candidate = temp / 'set.json'
                candidate.write_text(json.dumps(spec, indent=2) + '\n', encoding='utf-8')
                output = temp / 'assets'
                env = dict(os.environ, SET_FIT_PATH=str(candidate), SET_OUTPUT_DIR=str(output))
                result = subprocess.run([shutil.which('node') or 'node', str(ROOT / 'design' / 'build-set.cjs'), set_id],
                                        cwd=ROOT, env=env, capture_output=True, text=True, timeout=120,
                                        creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
                if result.returncode:
                    error = next((line for line in result.stderr.splitlines() if line.startswith('Error:')), 'Could not build this fit')
                    return self.reply(422, {'error': error})
                destination = ROOT / 'assets' / 'sets' / set_id
                for file in output.iterdir():
                    target = folder / file.name if file.name == 'build-report.json' else ROOT / 'qa' / f'{set_id}-poses.png' if file.name == 'poses.png' else destination / file.name
                    os.replace(file, target)
                os.replace(candidate, manifest)
            self.reply(200, {'ok': True, 'id': set_id, 'spec': spec})
        except (ValueError, TypeError, KeyError, StopIteration) as error:
            self.reply(400, {'error': str(error)})
        except FileNotFoundError:
            self.reply(404, {'error': 'Set or build dependency not found'})
        except subprocess.TimeoutExpired:
            self.reply(504, {'error': 'The build took too long. Your previous fit is unchanged.'})
        except OSError as error:
            self.reply(500, {'error': str(error)})
        finally:
            BUILD_LOCK.release()


if __name__ == '__main__':
    print('Forest Forge: http://127.0.0.1:4173', flush=True)
    ThreadingHTTPServer(('127.0.0.1', 4173), PreviewHandler).serve_forever()
