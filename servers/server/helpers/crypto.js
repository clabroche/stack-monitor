const _sodium = require('libsodium-wrappers');
const crypto = require('crypto');

module.exports.generateKey = async () => {
  await _sodium.ready;
  const sodium = _sodium;
  const key = sodium.crypto_aead_aegis256_keygen();
  return sodium.to_base64(key);
};

module.exports.encrypt = async (data, { additionnalNonce = '', encryptionKey = '' } = {}) => {
  await _sodium.ready;
  const sodium = _sodium;
  if (!encryptionKey) encryptionKey = require('../models/EncryptionKey').encryptionKey;
  const key = sodium.from_base64(encryptionKey);
  if (!key || key.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error('Invalid encryption key length');
  }

  let nonce;
  if (additionnalNonce) {
    const combinedHash = crypto.createHash('blake2b512').update(data + additionnalNonce).digest();
    nonce = combinedHash.slice(0, sodium.crypto_secretbox_NONCEBYTES); // Tronquer à la taille requise
  } else {
    nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  }

  const ciphertext = sodium.crypto_secretbox_easy(data, nonce, key);

  return Buffer.concat([nonce, ciphertext]).toString('base64');
};

module.exports.decrypt = async (encryptedData, { additionnalNonce = '', encryptionKey = '' } = {}) => {
  await _sodium.ready;
  const sodium = _sodium;

  if (!encryptionKey) encryptionKey = require('../models/EncryptionKey').encryptionKey;
  const key = sodium.from_base64(encryptionKey);
  if (!key || key.length !== sodium.crypto_secretbox_KEYBYTES) {
    throw new Error('Invalid decryption key length');
  }
  const encryptedBuffer = Buffer.from(encryptedData, 'base64');

  const nonce = encryptedBuffer.slice(0, sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = encryptedBuffer.slice(sodium.crypto_secretbox_NONCEBYTES);

  const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);

  if (!decrypted) {
    throw new Error('Decryption failed');
  }

  return Buffer.from(decrypted).toString('utf-8');
};
