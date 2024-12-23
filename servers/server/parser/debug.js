const jsonParser = require('./json');
/** @type {import("../models/Service").Parser} */
const parser = {
  id: 'stack-monitor-parser-debug',
  label: 'Stackmonitor debug',
  readonly: true,
  transform: (line, ...rest) => {
    if (!line.json) line = jsonParser.transform(line, ...rest);
    if (!line.json) return line;
    if (/** @type {Array<any>} */(line?.json)?.[0] === 'stack-monitor') {
      line.debug = line.json.length === 2 ? /** @type {Array<any>} */(line?.json)?.[1] : line.json.slice(1);
    }
    return line;
  },
};
module.exports = parser;
