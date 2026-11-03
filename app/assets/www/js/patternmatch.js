(function (root) {
  'use strict';
  // Sentence patterns are stored as Python regexes (tools/build_patterns.py). This turns
  // them into Unicode-aware JS ones: \b and \w are ASCII-only in JS, even with /u.
  var W = '\\p{L}\\p{N}_';
  var BOUNDARY = '(?:(?<![' + W + '])(?=[' + W + '])|(?<=[' + W + '])(?![' + W + ']))';

  function convert(src) {
    var out = '', inClass = false;
    for (var i = 0; i < src.length; i++) {
      var c = src[i];
      if (c === '\\' && i + 1 < src.length) {
        var n = src[++i];
        if (n === 'b' && !inClass) out += BOUNDARY;
        else if (n === 'w') out += inClass ? W : '[' + W + ']';
        else out += '\\' + n;
        continue;
      }
      if (c === '[' && !inClass) inClass = true;
      else if (c === ']' && inClass) inClass = false;
      out += c;
    }
    return out;
  }

  var cache = {};
  function compile(src) {
    if (cache[src] === undefined) {
      try { cache[src] = new RegExp(convert(src), 'u'); } catch (e) { cache[src] = null; }
    }
    return cache[src];
  }

  // Same folding as the builder: lowercase, curly apostrophes, Hebrew points and maqaf.
  function norm(s) {
    return String(s || '')
      .replace(/[֑-ׇ]/g, '').replace(/־/g, ' ')
      .replace(/[’׳]/g, "'").replace(/״/g, '"')
      .replace(/(?<=[א-ת])'(?=[א-ת])/g, '')
      .replace(/\s+/g, ' ').toLowerCase().trim();
  }

  // Patterns that occur in a sentence, most specific first (longest matched span, then rank).
  function match(patterns, sentence, limit) {
    var text = norm(sentence), hits = [];
    if (!text) return hits;
    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i], rx = p.rx && compile(p.rx);
      if (!rx) continue;
      var m = rx.exec(text);
      if (m && m[0].length) hits.push({ p: p, len: m[0].length });
    }
    hits.sort(function (a, b) { return b.len - a.len || (a.p.r || 0) - (b.p.r || 0); });
    return hits.slice(0, limit || 4).map(function (h) { return h.p; });
  }

  root.NerPatternMatch = { compile: compile, norm: norm, match: match, convert: convert };
})(typeof window !== 'undefined' ? window : globalThis);
