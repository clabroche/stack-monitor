const urlRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/gi;

/** @type {import("../models/Service").Parser} */
const parser = {
  id: 'stack-monitor-parser-links',
  label: 'Parse links',
  readonly: true,
  transform: (line) => {
    line.msg = line.msg.replaceAll(urlRegex, (url) => `<a href="${url}" target="_blank">${url}</a>`);
    return line;
  },
};

module.exports = parser;
