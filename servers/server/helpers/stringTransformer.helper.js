const slugify = require('slugify').default;
const { specialCaracters } = require('./specialCaracters.helper');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Transform number to alphabet letters.
 * Pick letters until there is no rest
 * @example
 * numberToLetters(1111111111111) // => EHHUAAUUA
 */
function numberToLetters(number, result = '') {
  let charIndex = number % alphabet.length;
  let quotient = number / alphabet.length;
  if (charIndex - 1 === -1) {
    charIndex = alphabet.length;
    quotient -= 1;
  }
  // eslint-disable-next-line no-param-reassign
  result = alphabet.charAt(charIndex - 1) + result;
  return quotient >= 1
    ? numberToLetters(+quotient, result)
    : result;
}

/**
 * A beginning number can be an issue for certain templating language.
 * This function transforms beginning numbers to deterministic and non conflict letters
 * @example
 * transformBeginingNumber('1111111111111aaa') // => EHHUAAUUA_aaa
 */
function transformBeginingNumber(str) {
  let transformedString = str;
  const beginningNumber = Number.parseInt(transformedString, 10);
  const isBeginningWithNumber = Number.isInteger(beginningNumber);
  if (isBeginningWithNumber) {
    const hasAlreadySeparator = transformedString.split(beginningNumber.toString())?.[1]?.charAt(0) === '_';
    transformedString = transformedString.replace(beginningNumber.toString(), `${numberToLetters(beginningNumber)}${hasAlreadySeparator ? '' : '_'}`);
  }
  return transformedString;
}

/**
 * Transliterate a string to a string without ambigeous caracters
 * @example
 * humanStringToKey('aaa aaa aaa') // => aaa_aaa_aaa
 * humanStringToKey('1111111111111aaa') // => EHHUAAUUA_aaa
 */
module.exports.humanStringToKey = (str, separator = '_') => {
  let transformedString = str
    .trim()
    .toLowerCase();
  specialCaracters.forEach((sc) => {
    const [char, eacute, slug] = sc;
    if (eacute) transformedString = transformedString.replaceAll(eacute.toLowerCase(), char);
    if (slug) transformedString = transformedString.replaceAll(slug.toLowerCase(), char);
  });
  transformedString = transformBeginingNumber(transformedString);
  slugify.extend({
    "'": separator,
    '-': '_',
    '(': separator,
    ')': separator,
  });
  return slugify(transformedString, separator);
};

module.exports.replaceEnvs = (str) => {
  Object.keys(process.env).forEach((env) => {
    if (!env) return;
    str = str.replaceAll(`$${env}`, process.env[env]);
  });
  return str;
};
