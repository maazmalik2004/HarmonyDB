// import crypto from "crypto"

// function generateKeyPair() {
//     return crypto.generateKeyPairSync('rsa', {
//       modulusLength: 2048,
//       publicKeyEncoding: {
//         type: 'spki',
//         format: 'pem'
//       },
//       privateKeyEncoding: {
//         type: 'pkcs8',
//         format: 'pem'
//       }
//     });
// }

// const sender = generateKeyPair();
// const receiver = generateKeyPair();

// const message = "hello";

// const encryptedMessage = crypto.publicEncrypt(
//     receiver.publicKey,
//     Buffer.from(message)
// );

// console.log("Encrypted message (base64):", encryptedMessage);

// const decryptedMessage = crypto.privateDecrypt(
//     receiver.privateKey,
//     encryptedMessage
// );

// console.log("Decrypted message:", decryptedMessage.toString());

