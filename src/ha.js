'use strict';
// Home Assistant: sammanfattning för integrationen, samt installationsfiler som serveras direkt från appen
// (så att det fungerar lokalt utan att GitHub-repot behöver vara publikt).
const fs = require('node:fs');
const path = require('node:path');

const HA_DIR = path.join(__dirname, '..');
const COMPONENT = 'custom_components/homelift';

function listFiles(dir, base = '') {
  return fs.readdirSync(path.join(dir, base), { withFileTypes: true }).flatMap(d =>
    d.isDirectory() ? listFiles(dir, path.join(base, d.name)) : [path.join(base, d.name)]);
}

module.exports = function ha({ VERSION, q, summary }) {
  function summaryAll() {
    return { version: VERSION, generated: new Date().toISOString(), profiles: q('SELECT id FROM users ORDER BY name').all().map(u => summary(u.id)) };
  }

  function serve(req, res, url) {
    const base = `http://${req.headers.host}`;
    const p = url.pathname.slice(4);
    if (p === 'install.sh') {
      const files = listFiles(path.join(HA_DIR, COMPONENT)).filter(f => !f.includes('__pycache__'));
      const dirs = [...new Set(files.map(f => path.dirname(f)).filter(d => d !== '.'))];
      const script = `#!/bin/sh
# Installerar HomeLift-integrationen i Home Assistant. Kör i Home Assistants terminal:
#   curl -fsSL ${base}/ha/install.sh | sh
set -e
CONFIG="\${1:-/config}"
DEST="$CONFIG/${COMPONENT}"
get() { if command -v curl >/dev/null 2>&1; then curl -fsSL -o "$2" "$1"; else wget -q -O "$2" "$1"; fi; }
mkdir -p "$DEST"${dirs.map(d => ` "$DEST/${d}"`).join('')} "$CONFIG/blueprints/automation/homelift"
${files.map(f => `get "${base}/ha/files/${COMPONENT}/${f}" "$DEST/${f}"`).join('\n')}
get "${base}/ha/blueprint.yaml" "$CONFIG/blueprints/automation/homelift/homelift_reminder.yaml"
echo ""
echo "HomeLift ${VERSION} installerad i $DEST"
echo "1. Starta om Home Assistant (Inställningar > System > Starta om)."
echo "2. Lägg till integrationen: Inställningar > Enheter och tjänster > Lägg till integration > HomeLift"
echo "   Adress: ${base}"
`;
      res.writeHead(200, { 'Content-Type': 'text/x-shellscript; charset=utf-8' });
      return res.end(script);
    }
    let file;
    if (p === 'blueprint.yaml') file = path.join(HA_DIR, 'blueprints', 'homelift_reminder.yaml');
    else if (p.startsWith('files/')) file = path.normalize(path.join(HA_DIR, p.slice(6)));
    const allowed = [path.join(HA_DIR, COMPONENT) + path.sep, path.join(HA_DIR, 'blueprints') + path.sep];
    if (!file || !allowed.some(a => file.startsWith(a)) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
    const type = { '.js': 'text/javascript', '.json': 'application/json', '.py': 'text/x-python', '.yaml': 'text/yaml' }[path.extname(file)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
    fs.createReadStream(file).pipe(res);
  }

  return { summaryAll, serve };
};
