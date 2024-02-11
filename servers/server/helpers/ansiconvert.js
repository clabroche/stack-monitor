const ansiconvert = new (require('ansi-to-html'))({
  newline: true,
  escapeXML: false,
  bg: '#FFFFFFFF',
  fg: '#4c4c4c',
});

/** @param {string} msg */
function stripAnsi(msg) {
  return msg
    // eslint-disable-next-line no-control-regex
    .replaceAll(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/gm, '');
}
/** @param {string} msg */
function unescapeAnsi(msg) {
  return msg
    .replaceAll(/\\u001b\[/gm, '\u001b[')
    .replaceAll(/\\u009b\[/gm, '\u009b[');
}

module.exports = { ansiconvert, stripAnsi, unescapeAnsi };
