/** @type {import("../models/Service").Parser} */
const parser = {
  id: 'stack-monitor-parser-jsons',
  transform: (line) => {
    if (!line.raw) return line
    const firstChar = line.raw.trim().charAt(0)
    if (firstChar === '[' || firstChar === '{') {
      try { line.json = JSON.parse(line.raw) } catch (error) { }
    }
    return line
  }
}
module.exports = parser