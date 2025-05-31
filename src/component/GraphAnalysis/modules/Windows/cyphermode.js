// src/cypherMode.js
import CodeMirror from 'codemirror';

CodeMirror.defineMode('cypher', function () {
  const keywords = (
    'MATCH WHERE RETURN CREATE DELETE SET ORDER BY LIMIT ASC DESC COUNT SUM AVG MIN MAX'
  ).split(' ');
  const functions = ('count sum avg min max').split(' ');

  return {
    token: function (stream) {
      if (stream.eatSpace()) return null;

      const ch = stream.next();
      if (ch === '"' || ch === "'") {
        stream.match(/.*?["']/);
        return 'string';
      }
      if (ch.match(/[0-9]/)) {
        stream.match(/[\d]*\.?[\d]*/);
        return 'number';
      }
      if (stream.match(/[a-zA-Z_][a-zA-Z0-9_]*/)) {
        const word = stream.current().toUpperCase();
        if (keywords.includes(word)) return 'keyword';
        if (functions.includes(word)) return 'function';
        if (stream.match(/\.\w+/)) return 'variable';
        return 'variable';
      }
      if (ch === '/' && stream.match(/\/.*/)) return 'comment';
      if ('<>|=~+-*/'.indexOf(ch) >= 0) return 'operator';
      if ('(){}[],.;:'.indexOf(ch) >= 0) return 'punctuation';
      return null;
    },
  };
});

CodeMirror.defineMIME('text/x-cypher', 'cypher');