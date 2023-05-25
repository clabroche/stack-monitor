const foregroundColors = [
  {number: '30', color: 'black'},
  {number: '31', color: 'red'},
  {number: '32', color: 'green'},
  {number: '33', color: 'yellow'},
  {number: '34', color: 'blue'},
  {number: '35', color: 'purple'},
  {number: '36', color: 'cyan'},
  {number: '37', color: 'white'}
];

/** @param {string} str */
const ainsiconvert = function (str) {
  foregroundColors.forEach(function (ansi) {
    const span = '<span style="color: ' + ansi.color + '">';
    str = str
      .replace(new RegExp('\x1b\\[' + ansi.number + 'm', 'g'), span)
      .replace(new RegExp('\x1b\\[0;' + ansi.number + 'm', 'g'), span);
  });
  return str
    // bold
    .replace(/\x1b\[1m/g, '<b>') 
    .replace(/\x1b\[21m/g, '</b>')
    // thin
    .replace(/\x1b\[2m/g, '<span>')
    .replace(/\x1b\[22m/g, '</span>')
    //italic
    .replace(/\x1b\[3m/g, '<i>')
    .replace(/\x1b\[23m/g, '</i>')
    // underline
    .replace(/\x1b\[4m/g, '<span style="text-decoration: underline">')
    .replace(/\x1b\[24m/g, '</span>')
    // slow blink
    .replace(/\x1b\[5m/g, '<span>')
    .replace(/\x1b\[25m/g, '</span>')
    // rapid blink
    .replace(/\x1b\[6m/g, '<span>')
    .replace(/\x1b\[26m/g, '</span>')
    // reverse
    .replace(/\x1b\[7m/g, '<span>')
    .replace(/\x1b\[27m/g, '</span>')
    // conceal
    .replace(/\x1b\[8m/g, '<span>')
    .replace(/\x1b\[28m/g, '</span>')
    // crossed out
    .replace(/\x1b\[9m/g, '<span>')
    .replace(/\x1b\[29m/g, '</span>')




    .replace(/\x1b\[m/g, '</span>')// reset
    .replace(/\x1b\[0m/g, '</span>') //reset
    .replace(/\x1b\[22m/g, '</b>')
    .replace(/\x1b\[22m/g, '</b>')
    .replace(/\x1b\[23m/g, '</i>')
    .replace(/\x1b\[24m/g, '</span>')
    .replace(/\x1b\[25m/g, '</span>')
    .replace(/\x1b\[27m/g, '</span>')
    .replace(/\x1b\[28m/g, '</span>')
    .replace(/\x1b\[39m/g, '</span>')
    .replace(/\x1b\[49m/g, '</span>')
};

module.exports = ainsiconvert;