/** @type {import("../models/Service").Parser} */
const parser = {
  id: 'stack-monitor-parser-jsons',
  label: 'Parse jsons',
  readonly: true,
  transform: (line) => {
    if (!line.raw) return line;
    const firstChar = line.raw.trim().charAt(0);
    if (firstChar === '[' || firstChar === '{') {
      try { line.json = JSON.parse(line.raw); } catch (error) { }
    }
    return line;
  },
};
module.exports = parser;
