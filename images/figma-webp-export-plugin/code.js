// Percaal – Rename & Export Images to WebP
// Renames every image layer on the "UI design" page by its location-role,
// then exports each placement as a PNG (converted to WebP in the UI) and
// bundles everything into a single .zip download.

figma.showUI(__html__, { width: 460, height: 520 });

// ---- helpers ---------------------------------------------------------------

// Names Figma auto-assigns or that carry no meaning as a "role".
var GENERIC = /^(frame|group|rectangle|rect|ellipse|oval|vector|line|polygon|star|images?|img|photo|picture|pic|component|instance|union|subtract|intersect|exclude|mask|slice|clip|bg|background|content|container|wrapper|holder|layer|shape|fill|thumb|thumbnail|screenshot|property\s*\d+=?.*|variant\d*)\b/i;

function isMeaningful(name) {
  if (!name) return false;
  var n = String(name).trim();
  if (!n) return false;
  if (/^\d+$/.test(n)) return false;              // purely numeric
  if (/^frame\s*\d+/i.test(n)) return false;      // "Frame 2147226641"
  if (/^screenshot\b/i.test(n)) return false;     // "Screenshot 2026-..."
  if (/^image\s*\d*$/i.test(n)) return false;     // "image 7"
  if (GENERIC.test(n) && n.replace(GENERIC, '').trim().length === 0) return false;
  return /[a-zA-Z]/.test(n);
}

function slug(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 28)
    .replace(/^-+|-+$/g, '');
}

function hasImageFill(node) {
  var fills = node.fills;
  if (!fills || fills === figma.mixed || !Array.isArray(fills)) return false;
  for (var i = 0; i < fills.length; i++) {
    var f = fills[i];
    if (f && f.type === 'IMAGE' && f.visible !== false && f.imageHash) return true;
  }
  return false;
}

// Build [screenSlug, sectionSlug] context from a node's ancestor chain.
function contextParts(node) {
  var chain = [];
  var p = node.parent;
  var top = null;
  while (p && p.type !== 'PAGE' && p.type !== 'DOCUMENT') {
    chain.push(p);
    if (p.parent && p.parent.type === 'PAGE') top = p;
    p = p.parent;
  }
  var screenSlug = top && isMeaningful(top.name) ? slug(top.name) : '';
  // nearest meaningful ancestor that isn't the top-level screen
  var sectionSlug = '';
  for (var i = 0; i < chain.length; i++) {
    var c = chain[i];
    if (c === top) continue;
    if (isMeaningful(c.name)) { sectionSlug = slug(c.name); break; }
  }
  // own name, if the designer actually named this layer meaningfully
  var ownSlug = isMeaningful(node.name) ? slug(node.name) : '';

  var parts = [];
  if (screenSlug) parts.push(screenSlug);
  if (sectionSlug && sectionSlug !== screenSlug) parts.push(sectionSlug);
  if (ownSlug && parts.indexOf(ownSlug) === -1) parts.push(ownSlug);
  if (parts.length === 0) parts.push('image');
  // trim to at most 3 parts
  return parts.slice(0, 3);
}

function pickScale(node) {
  var m = Math.max(node.width || 1, node.height || 1);
  var s = Math.min(2, 2000 / m); // cap longest side ~2000px
  if (!isFinite(s) || s <= 0) s = 1;
  return Math.max(0.25, s);
}

// ---- main ------------------------------------------------------------------

function findUiDesignPage() {
  var pages = figma.root.children;
  for (var i = 0; i < pages.length; i++) {
    if (/ui\s*design/i.test(pages[i].name)) return pages[i];
  }
  return figma.currentPage;
}

figma.ui.onmessage = async function (msg) {
  if (msg.type === 'cancel') { figma.closePlugin(); return; }
  if (msg.type !== 'run') return;

  var doRename = msg.rename !== false;
  var page = findUiDesignPage();
  try { if (figma.currentPage !== page) figma.currentPage = page; } catch (e) {}

  var nodes = page.findAll(hasImageFill);

  // Pass 1: compute base name per node
  var records = [];
  for (var i = 0; i < nodes.length; i++) {
    var base = contextParts(nodes[i]).join('-') || 'image';
    records.push({ node: nodes[i], base: base });
  }

  // Count bases to decide whether to add a numeric suffix
  var counts = {};
  for (var j = 0; j < records.length; j++) counts[records[j].base] = (counts[records[j].base] || 0) + 1;

  // Assign final unique names
  var used = {};
  var running = {};
  for (var k = 0; k < records.length; k++) {
    var b = records[k].base;
    var name;
    if (counts[b] > 1) {
      running[b] = (running[b] || 0) + 1;
      var idx = running[b] < 10 ? '0' + running[b] : '' + running[b];
      name = b + '-' + idx;
    } else {
      name = b;
    }
    while (used[name]) { // safety against collisions
      running[b] = (running[b] || 0) + 1;
      var idx2 = running[b] < 10 ? '0' + running[b] : '' + running[b];
      name = b + '-' + idx2;
    }
    used[name] = true;
    records[k].name = name;
  }

  figma.ui.postMessage({ type: 'start', total: records.length });

  var renamed = 0, renameFailed = 0, exported = 0, exportFailed = 0;

  for (var r = 0; r < records.length; r++) {
    var rec = records[r];
    var node = rec.node;

    if (doRename) {
      try { node.name = rec.name; renamed++; }
      catch (e) { renameFailed++; }
    }

    try {
      var bytes = await node.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: pickScale(node) }
      });
      figma.ui.postMessage({ type: 'image', name: rec.name + '.webp', bytes: bytes, index: r + 1 });
      exported++;
    } catch (e) {
      exportFailed++;
      figma.ui.postMessage({ type: 'skip', name: rec.name, index: r + 1, error: String(e) });
    }
  }

  figma.ui.postMessage({
    type: 'done',
    stats: { total: records.length, renamed: renamed, renameFailed: renameFailed, exported: exported, exportFailed: exportFailed }
  });
};
