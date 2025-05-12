const { generateKeyPairSync } = require('crypto');
const fs = require('fs');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const certPem = publicKey.export({ type: 'spki', format: 'pem' });

fs.writeFileSync('key.pem', keyPem);
fs.writeFileSync('cert.pem', certPem);

console.log('Generated key.pem and cert.pem');