const crypto = require('crypto');
const { readFile, writeFile } = require('fs/promises');

var encryptionAlgorithm = "aes-256-ctr";

module.exports = async function decryptCreds(oldSecret, newScret, path) {
  const oldKey = crypto.createHash('sha256').update(oldSecret).digest();
  const newKey = crypto.createHash('sha256').update(newScret).digest();
  const cipher = JSON.parse(await readFile(path, 'utf-8'))
  let flows = cipher["$"];
  const vector = Buffer.from(flows.substring(0, 32), 'hex');
  flows = flows.substring(32);
  const decipher = crypto.createDecipheriv(encryptionAlgorithm, oldKey, vector);
  const decrypted = decipher.update(flows, 'base64', 'utf8') + decipher.final('utf8');
  const newVector = crypto.randomBytes(16);
  const newCipher = crypto.createCipheriv(encryptionAlgorithm, newKey, newVector);
  const encrypted = newCipher.update(decrypted, 'utf8', 'base64') + newCipher.final('base64');
  await writeFile(path, JSON.stringify({
    "$": newVector.toString('hex') + encrypted
  }, null, 2), 'utf-8')
}
