// Percaal – Export Used Icons to SVG
// Finds every icon actually placed in the design (small component instances),
// resolves each to its master component, exports it as SVG normalised to a
// square canvas, and hands the files to the UI to bundle into one .zip.
//
// The multi-thousand-icon third-party library sitting in the "Icons" section
// on the components page is skipped - only icons genuinely used are exported.

figma.showUI(__html__, { width: 470, height: 580 });

var LIBRARY_SECTION = /^icons$/i;

function slug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\/\\]+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

// True when the node lives inside the big third-party icon library section.
function insideLibrary(node) {
  var p = node.parent;
  while (p && p.type !== 'PAGE' && p.type !== 'DOCUMENT') {
    if (p.type === 'SECTION' && LIBRARY_SECTION.test(String(p.name).trim())) return true;
    p = p.parent;
  }
  return false;
}

async function mainComponentOf(instance) {
  try {
    if (typeof instance.getMainComponentAsync === 'function') {
      return await instance.getMainComponentAsync();
    }
  } catch (e) {}
  try { return instance.mainComponent; } catch (e) {}
  return null;
}

async function collectIcons(maxSize, selectionOnly) {
  var roots = [];
  if (selectionOnly) {
    roots = figma.currentPage.selection.slice();
    if (!roots.length) return [];
  } else {
    try { await figma.loadAllPagesAsync(); } catch (e) {}
    roots = figma.root.children.slice();
  }

  var instances = [];
  for (var r = 0; r < roots.length; r++) {
    var root = roots[r];
    if (root.type === 'INSTANCE') instances.push(root);
    if (typeof root.findAll === 'function') {
      var found = root.findAll(function (n) { return n.type === 'INSTANCE'; });
      for (var f = 0; f < found.length; f++) instances.push(found[f]);
    }
  }

  var seen = {};
  var out = [];
  for (var i = 0; i < instances.length; i++) {
    var n = instances[i];
    if (!(n.width > 0 && n.width <= maxSize && n.height > 0 && n.height <= maxSize)) continue;
    if (!selectionOnly && insideLibrary(n)) continue;

    var mc = await mainComponentOf(n);
    var target = mc || n;
    if (seen[target.id]) { seen[target.id].uses++; continue; }

    var rec = { node: target, rawName: (mc ? mc.name : n.name), uses: 1 };
    seen[target.id] = rec;
    out.push(rec);
  }
  return out;
}

// Give every icon a unique kebab-case filename.
function assignNames(records) {
  var used = {};
  for (var i = 0; i < records.length; i++) {
    var base = slug(records[i].rawName) || 'icon';
    var name = base, n = 1;
    while (used[name]) { n++; name = base + '-' + (n < 10 ? '0' + n : '' + n); }
    used[name] = true;
    records[i].name = name;
  }
  return records;
}

// Rewrite an exported SVG onto a square canvas, content centred, aspect kept.
function normalise(svgText, size) {
  var m = String(svgText).match(/^([\s\S]*?<svg\b[^>]*>)([\s\S]*)<\/svg>[\s\S]*$/i);
  if (!m) return svgText;
  var open = m[1], inner = m[2];

  var minx = 0, miny = 0, vw = 0, vh = 0;
  var vb = open.match(/viewBox\s*=\s*"([^"]+)"/i);
  if (vb) {
    var a = vb[1].trim().split(/[\s,]+/).map(Number);
    if (a.length === 4 && a.every(function (v) { return isFinite(v); })) {
      minx = a[0]; miny = a[1]; vw = a[2]; vh = a[3];
    }
  }
  if (!vw || !vh) {
    var w = open.match(/\bwidth\s*=\s*"([\d.]+)/i);
    var h = open.match(/\bheight\s*=\s*"([\d.]+)/i);
    vw = w ? parseFloat(w[1]) : size;
    vh = h ? parseFloat(h[1]) : size;
  }
  if (!vw || !vh) return svgText;

  var s = Math.min(size / vw, size / vh);
  var tx = (size - vw * s) / 2 - minx * s;
  var ty = (size - vh * s) / 2 - miny * s;
  function r(x) { return Math.round(x * 10000) / 10000; }

  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size +
         '" viewBox="0 0 ' + size + ' ' + size + '" fill="none">' +
         '<g transform="translate(' + r(tx) + ' ' + r(ty) + ') scale(' + r(s) + ')">' +
         inner + '</g></svg>';
}

async function exportSvg(node) {
  try {
    return await node.exportAsync({ format: 'SVG_STRING', svgIdAttribute: false, svgSimplifyStroke: true });
  } catch (e) {}
  var bytes = await node.exportAsync({ format: 'SVG', svgIdAttribute: false, svgSimplifyStroke: true });
  var s = '';
  for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
}

figma.ui.onmessage = async function (msg) {
  if (msg.type === 'cancel') { figma.closePlugin(); return; }
  if (msg.type !== 'run') return;

  var size = parseInt(msg.size, 10) || 80;
  var maxSize = parseInt(msg.maxSize, 10) || 48;
  var selectionOnly = !!msg.selectionOnly;

  var records;
  try {
    records = assignNames(await collectIcons(maxSize, selectionOnly));
  } catch (e) {
    figma.ui.postMessage({ type: 'fatal', error: String(e) });
    return;
  }

  if (!records.length) {
    figma.ui.postMessage({ type: 'fatal', error: selectionOnly
      ? 'Nothing selected, or the selection holds no component instances at or under ' + maxSize + 'px.'
      : 'No icon instances found at or under ' + maxSize + 'px.' });
    return;
  }

  figma.ui.postMessage({ type: 'start', total: records.length });

  var ok = 0, failed = 0;
  for (var i = 0; i < records.length; i++) {
    var rec = records[i];
    try {
      var raw = await exportSvg(rec.node);
      figma.ui.postMessage({
        type: 'svg',
        name: rec.name + '.svg',
        text: normalise(raw, size),
        uses: rec.uses,
        index: i + 1
      });
      ok++;
    } catch (e) {
      failed++;
      figma.ui.postMessage({ type: 'skip', name: rec.name, index: i + 1, error: String(e) });
    }
  }

  figma.ui.postMessage({ type: 'done', stats: { total: records.length, exported: ok, failed: failed, size: size } });
};
