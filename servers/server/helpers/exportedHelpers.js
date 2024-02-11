module.exports = {
  /**
   * @param {string} str
   * @param {string} search
   */
  searchString(str, search) {
    return str?.toUpperCase()?.includes(search);
  },
};
