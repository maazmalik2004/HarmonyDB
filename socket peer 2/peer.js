// // import tls from 'tls';
// // import fs from 'fs/promises';
// // import os from 'os';
// // import ip from 'ip';
// // import crypto from "crypto";
// // import forge from 'node-forge';

// // class Peer {
// //     constructor() {
// //         // Initialization moved to this.initialize
// //     }

// //     async initialize() {
// //         this.config = await this.readJsonFile("./config.json");
// //         this.identity = this.config.identity;
// //         this.peersToDiscover = this.config.peersToDiscover;
// //         this.autoDiscoverPeers = this.config.autoDiscoverPeers;
// //         this.autoDiscoverPort = this.config.autoDiscoverPort;
// //         this.autoDiscoverSubnetMask = this.config.autoDiscoverSubnetMask;

// //         console.log(this.config);

// //         if (this.autoDiscoverPeers === true) {
// //             this.port = this.autoDiscoverPort;
// //             this.identity.port = this.autoDiscoverPort;
// //         } else {
// //             this.port = this.identity.port;
// //         }

// //         // Load or generate RSA key pair for data-at-rest encryption
// //         this.keyPair = await this.loadOrGenerateKeyPair();

// //         // Load or generate certificate
// //         const certFiles = await this.loadOrGenerateCertificate(this.identity);
// //         this.tlsOptions = {
// //             key: certFiles.key,
// //             cert: certFiles.cert,
// //             rejectUnauthorized: false, // Allow self-signed certs, verified manually
// //             requestCert: true // Request client certificates
// //         };

// //         // Initialize trusted certificates store
// //         this.trustedCertificates = await this.loadTrustedCertificates();

// //         // Initialize data store first
// //         try {
// //             await fs.access('./data.bin');
// //             // Try to read existing data to ensure it's valid
// //             await this.readData('./data.bin');
// //         } catch (err) {
// //             if (err.code === 'ENOENT' || err instanceof SyntaxError) {
// //                 // Initialize new data store
// //                 await this.writeData('./data.bin', {});
// //             } else {
// //                 throw err;
// //             }
// //         }

// //         // Initialize TLS server
// //         this.server = tls.createServer(this.tlsOptions, (socket) => this.handleConnection(socket));
// //         this.server.listen(this.port, () => {
// //             console.log(`TLS server is running on port ${this.port}`);
// //         });

// //         // Store connected clients
// //         this.clients = {};
// //         this.sockets = {};

// //         // Start peer discovery
// //         if (this.autoDiscoverPeers) {
// //             await this.autoDiscover(this.autoDiscoverSubnetMask, this.port);
// //         } else {
// //             await this.discover(this.peersToDiscover);
// //         }
// //     }

// //     async loadOrGenerateKeyPair() {
// //         try {
// //             // Try to load existing key pair
// //             const publicKey = await fs.readFile('./public.pem', 'utf-8');
// //             const privateKey = await fs.readFile('./private.pem', 'utf-8');
// //             console.log('Loaded existing RSA key pair');
// //             return { publicKey, privateKey };
// //         } catch (err) {
// //             if (err.code === 'ENOENT') {
// //                 // Generate new key pair if none exists
// //                 console.log('Generating new RSA key pair');
// //                 const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
// //                     modulusLength: 2048,
// //                     publicKeyEncoding: {
// //                         type: 'spki',
// //                         format: 'pem'
// //                     },
// //                     privateKeyEncoding: {
// //                         type: 'pkcs8',
// //                         format: 'pem'
// //                     }
// //                 });
// //                 // Save the key pair
// //                 await fs.writeFile('./public.pem', publicKey);
// //                 await fs.writeFile('./private.pem', privateKey);
// //                 return { publicKey, privateKey };
// //             }
// //             throw err;
// //         }
// //     }

// //     async loadOrGenerateCertificate(identity) {
// //         try {
// //             // Try to load existing certificate
// //             const cert = await fs.readFile('./cert.pem', 'utf-8');
// //             const key = await fs.readFile('./key.pem', 'utf-8');
// //             console.log('Loaded existing certificate');
// //             return { cert, key };
// //         } catch (err) {
// //             if (err.code === 'ENOENT') {
// //                 // Generate new certificate if none exists
// //                 console.log('Generating new certificate');
// //                 const certFiles = await this.generateSelfSignedCertificate(identity);
// //                 // Save the certificate and key
// //                 await fs.writeFile('./cert.pem', certFiles.cert);
// //                 await fs.writeFile('./key.pem', certFiles.key);
// //                 return certFiles;
// //             }
// //             throw err;
// //         }
// //     }

// //     async generateSelfSignedCertificate(identity) {
// //         // Generate a new key pair
// //         const keys = forge.pki.rsa.generateKeyPair(2048);
        
// //         // Create a new certificate
// //         const cert = forge.pki.createCertificate();
// //         cert.publicKey = keys.publicKey;
// //         cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytes(8));
// //         cert.validity.notBefore = new Date();
// //         cert.validity.notAfter = new Date();
// //         cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

// //         // Set certificate attributes
// //         const attrs = [{
// //             name: 'commonName',
// //             value: identity.name
// //         }, {
// //             name: 'organizationName',
// //             value: 'HarmonyDB'
// //         }];

// //         cert.setSubject(attrs);
// //         cert.setIssuer(attrs);

// //         // Self-sign the certificate
// //         cert.sign(keys.privateKey, forge.md.sha256.create());

// //         // Convert to PEM format
// //         const certPem = forge.pki.certificateToPem(cert);
// //         const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);

// //         return {
// //             cert: certPem,
// //             key: privateKeyPem
// //         };
// //     }

// //     async loadTrustedCertificates(){
// //         try {
// //             const data = await fs.readFile('./trusted_peers.json', 'utf-8');
// //             if (data.trim() === '') {
// //                 // Handle empty file
// //                 await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
// //                 return {};
// //             }
// //             return JSON.parse(data);
// //         } catch (err) {
// //             if (err.code === 'ENOENT') {
// //                 // File doesn't exist, create it
// //                 await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
// //                 return {};
// //             } else if (err instanceof SyntaxError) {
// //                 // Invalid JSON, overwrite with empty object
// //                 console.warn('Invalid JSON in trusted_peers.json, initializing with empty object');
// //                 await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
// //                 return {};
// //             }
// //             throw err;
// //         }
// //     }

// //     async saveTrustedCertificate(peerName, cert) {
// //         this.trustedCertificates[peerName] = cert;
// //         await fs.writeFile('./trusted_peers.json', JSON.stringify(this.trustedCertificates, null, 2));
// //     }

// //     async handleConnection(socket) {
// //         socket.setEncoding('utf8');
// //         let dataBuffer = '';

// //         // Verify peer certificate
// //         const cert = socket.getPeerCertificate();
// //         if (!cert || !cert.raw) {
// //             console.error('No peer certificate provided');
// //             socket.destroy();
// //             return;
// //         }
// //         const peerName = cert.subject?.CN || 'unknown';
// //         if (!this.trustedCertificates[peerName]) {
// //             // Trust-on-first-use: Store certificate
// //             await this.saveTrustedCertificate(peerName, cert.raw.toString('base64'));
// //             console.log(`Trusted new certificate for ${peerName}`);
// //         } else if (this.trustedCertificates[peerName] !== cert.raw.toString('base64')) {
// //             console.error(`Certificate mismatch for ${peerName}`);
// //             socket.destroy();
// //             return;
// //         }

// //         socket.on('data', async (data) => {
// //             dataBuffer += data;
// //             try {
// //                 const messages = this.extractJsonMessages(dataBuffer);
// //                 if (messages.length > 0) {
// //                     for (const message of messages) {
// //                         await this.handleMessage(message, socket);
// //                     }
// //                     dataBuffer = dataBuffer.substring(dataBuffer.lastIndexOf('}') + 1);
// //                 }
// //             } catch (err) {
// //                 // Wait for more data
// //             }
// //         });

// //         socket.on('close', () => {
// //             for (const [name, clientSocket] of Object.entries(this.sockets)) {
// //                 if (clientSocket === socket) {
// //                     console.log(`Peer ${name} disconnected`);
// //                     delete this.sockets[name];
// //                     delete this.clients[name];
// //                     break;
// //                 }
// //             }
// //         });

// //         socket.on('error', (err) => {
// //             console.log(`Socket error: ${err.message}`);
// //         });
// //     }

// //     extractJsonMessages(data) {
// //         const messages = [];
// //         let bracketCount = 0;
// //         let startPos = data.indexOf('{');
// //         if (startPos === -1) return messages;

// //         for (let i = startPos; i < data.length; i++) {
// //             if (data[i] === '{') bracketCount++;
// //             else if (data[i] === '}') bracketCount--;
// //             if (bracketCount === 0) {
// //                 try {
// //                     const jsonStr = data.substring(startPos, i + 1);
// //                     const jsonObj = JSON.parse(jsonStr);
// //                     messages.push(jsonObj);
// //                     startPos = data.indexOf('{', i + 1);
// //                     if (startPos === -1) break;
// //                     i = startPos - 1;
// //                 } catch (err) {
// //                     // Not valid JSON yet
// //                 }
// //             }
// //         }
// //         return messages;
// //     }

// //     async handleMessage(message, socket) {
// //         console.log(`Received message: ${message.type}`);
// //         switch (message.type) {
// //             case 'DISCOVER':
// //                 await this.handleDiscover(message, socket);
// //                 break;
// //             case 'DISCOVERACK':
// //                 await this.handleDiscoverAck(message, socket);
// //                 break;
// //             case 'UPDATE':
// //                 await this.handleUpdate(message, socket);
// //                 break;
// //             case 'UPDATEACK':
// //                 break;
// //             default:
// //                 console.log(`Unknown message type: ${message.type}`);
// //         }
// //     }

// //     async handleDiscover(message, socket) {
// //         const requestIdentity = message.payload.identity;
// //         console.log(`Discovery request from: ${requestIdentity.name}`);

// //         // Store peer info (certificate already verified in handleConnection)
// //         this.clients[requestIdentity.name] = requestIdentity;
// //         this.sockets[requestIdentity.name] = socket;

// //         // Send response with empty data if we can't read it
// //         let latestData;
// //         try {
// //             latestData = await this.readData("./data.bin");
// //         } catch (err) {
// //             console.log('Error reading data during discovery, sending empty data');
// //             latestData = {};
// //         }

// //         const response = {
// //             type: 'DISCOVERACK',
// //             payload: {
// //                 latestData,
// //                 identity: this.identity
// //             }
// //         };
// //         socket.write(JSON.stringify(response));
// //     }

// //     async handleDiscoverAck(message, socket) {
// //         const responseIdentity = message.payload.identity;
// //         console.log(`Discovery acknowledgment from: ${responseIdentity.name}`);

// //         // Store peer info
// //         this.clients[responseIdentity.name] = responseIdentity;
// //         this.sockets[responseIdentity.name] = socket;

// //         // Update local data if available
// //         const latestData = message.payload.latestData;
// //         if (latestData && typeof latestData === 'object') {
// //             try {
// //                 await this.writeData("./data.bin", latestData);
// //             } catch (err) {
// //                 console.log('Error updating data from peer:', err.message);
// //             }
// //         }
// //     }

// //     async handleUpdate(message, socket) {
// //         const { updatedKey, updatedValue } = message.payload;
// //         console.log(`[UPDATE] ${updatedKey} = ${updatedValue}`);

// //         // Update local data
// //         let data = await this.readData("./data.bin");
// //         data[updatedKey] = updatedValue;
// //         await this.writeData("./data.bin", data);

// //         // Send acknowledgment
// //         const response = {
// //             type: 'UPDATEACK',
// //             payload: {}
// //         };
// //         socket.write(JSON.stringify(response));
// //     }

// //     async connectToPeer(peerIp, peerPort) {
// //         return new Promise((resolve, reject) => {
// //             const socket = tls.connect({
// //                 host: peerIp,
// //                 port: peerPort,
// //                 ...this.tlsOptions,
// //                 servername: peerIp // For SNI, though not critical for self-signed certs
// //             }, () => {
// //                 // Verify peer certificate
// //                 const cert = socket.getPeerCertificate();
// //                 if (!cert || !cert.raw) {
// //                     console.error(`No certificate from ${peerIp}:${peerPort}`);
// //                     socket.destroy();
// //                     reject(new Error('No peer certificate'));
// //                     return;
// //                 }
// //                 const peerName = cert.subject?.CN || 'unknown';
// //                 if (!this.trustedCertificates[peerName]) {
// //                     // Trust-on-first-use
// //                     this.saveTrustedCertificate(peerName, cert.raw.toString('base64'));
// //                     console.log(`Trusted new certificate for ${peerName}`);
// //                 } else if (this.trustedCertificates[peerName] !== cert.raw.toString('base64')) {
// //                     console.error(`Certificate mismatch for ${peerName}`);
// //                     socket.destroy();
// //                     reject(new Error('Certificate mismatch'));
// //                     return;
// //                 }
// //                 console.log(`Connected to peer at ${peerIp}:${peerPort}`);
// //                 resolve(socket);
// //             });

// //             socket.on('error', (err) => {
// //                 reject(err);
// //             });

// //             socket.on('data', async (data) => {
// //                 let dataBuffer = data.toString();
// //                 try {
// //                     const messages = this.extractJsonMessages(dataBuffer);
// //                     for (const message of messages) {
// //                         await this.handleMessage(message, socket);
// //                     }
// //                 } catch (err) {
// //                     console.log(`Error processing data: ${err.message}`);
// //                 }
// //             });

// //             socket.on('close', () => {
// //                 for (const [name, clientSocket] of Object.entries(this.sockets)) {
// //                     if (clientSocket === socket) {
// //                         console.log(`Lost connection to peer ${name}`);
// //                         delete this.sockets[name];
// //                         delete this.clients[name];
// //                         break;
// //                     }
// //                 }
// //             });
// //         });
// //     }

// //     async set(key, value) {
// //         let data = await this.readData("./data.bin");
// //         data[key] = value;
// //         await this.writeData("./data.bin", data);

// //         const failedPeers = [];
// //         const updateMessage = {
// //             type: 'UPDATE',
// //             payload: {
// //                 updatedKey: key,
// //                 updatedValue: value
// //             }
// //         };

// //         for (const name of Object.keys(this.sockets)) {
// //             const socket = this.sockets[name];
// //             try {
// //                 socket.write(JSON.stringify(updateMessage));
// //             } catch (error) {
// //                 console.log(`[ERROR] Failed to send update to peer ${name}. Removing from clients.`);
// //                 failedPeers.push(name);
// //             }
// //         }

// //         for (const peerName of failedPeers) {
// //             delete this.sockets[peerName];
// //             delete this.clients[peerName];
// //         }
// //     }

// //     async get(key) {
// //         let data = await this.readData("./data.bin");
// //         return data[key];
// //     }

// //     async readJsonFile(path) {
// //         try {
// //             const data = await fs.readFile(path, 'utf-8');
// //             return JSON.parse(data);
// //         } catch (err) {
// //             if (err.code === 'ENOENT') {
// //                 await fs.writeFile(path, '{}', 'utf-8');
// //                 return {};
// //             }
// //             throw err;
// //         }
// //     }

// //     async writeJsonFile(path, data) {
// //         await fs.writeFile(path, JSON.stringify(data, null, 2));
// //     }

// //     async readData(path) {
// //         try {
// //             try {
// //                 await fs.access(path);
// //             } catch (err) {
// //                 if (err.code === 'ENOENT') {
// //                     await this.writeData(path, {});
// //                     return {};
// //                 }
// //                 throw err;
// //             }

// //             const data = await fs.readFile(path);
// //             if (data.length === 0) {
// //                 return {};
// //             }
// //             console.log('Data:', data.toString());

// //             // First try to decrypt the data
// //             try {
// //                 const privateKey = this.keyPair.privateKey;
// //                 const decryptedBuffer = crypto.privateDecrypt(
// //                     {
// //                         key: privateKey,
// //                         padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
// //                         oaepHash: 'sha256'
// //                     },
// //                     data
// //                 );
// //                 console.log('Decrypted data:', decryptedBuffer.toString());
// //                 return JSON.parse(decryptedBuffer.toString());
// //             } catch (decryptErr) {
// //                 console.log('Decryption failed, attempting to read as plain JSON');
// //                 // If decryption fails, try to read as plain JSON
// //                 try {
// //                     const jsonString = data.toString('utf8');
// //                     const parsedData = JSON.parse(jsonString);
// //                     // If we successfully read as plain JSON, re-encrypt it
// //                     await this.writeData(path, parsedData);
// //                     return parsedData;
// //                 } catch (jsonErr) {
// //                     console.log('Failed to parse as plain JSON, initializing new data store');
// //                     // If both decryption and JSON parsing fail, initialize new data
// //                     const newData = {};
// //                     await this.writeData(path, newData);
// //                     return newData;
// //                 }
// //             }
// //         } catch (err) {
// //             console.error('Error reading data:', err.message);
// //             // On any other error, initialize new data
// //             const newData = {};
// //             await this.writeData(path, newData);
// //             return newData;
// //         }
// //     }

// //     async writeData(path, data) {
// //         try {
// //             const publicKey = this.keyPair.publicKey;
// //             const dataBuffer = Buffer.from(JSON.stringify(data));
            
// //             // Check if data is too large for RSA encryption
// //             const maxBytesToEncrypt = Math.floor(2048 / 8) - 66; // RSA-2048 with OAEP
// //             if (dataBuffer.length > maxBytesToEncrypt) {
// //                 console.warn(`Data too large to encrypt (${dataBuffer.length} bytes), storing as plain JSON`);
// //                 await this.writeJsonFile(path, data);
// //                 return;
// //             }

// //             // Encrypt the data
// //             const encryptedBuffer = crypto.publicEncrypt(
// //                 {
// //                     key: publicKey,
// //                     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
// //                     oaepHash: 'sha256'
// //                 },
// //                 dataBuffer
// //             );
// //             console.log('Encrypted data:', encryptedBuffer.toString());
// //             await fs.writeFile(path, encryptedBuffer);
// //         } catch (err) {
// //             console.error('Error writing encrypted data:', err.message);
// //             // Fallback to plain JSON if encryption fails
// //             await this.writeJsonFile(path, data);
// //         }
// //     }

// //     async discover(peersToDiscover) {
// //         const discoveryPromises = peersToDiscover
// //             .filter(peer => !(peer.ip === this.identity.ip && peer.port === this.identity.port))
// //             .map(async peer => {
// //                 const peerIp = peer.ip;
// //                 const peerPort = peer.port;
// //                 console.log(`Discovering peer at ${peerIp}:${peerPort}`);
// //                 try {
// //                     const socket = await this.connectToPeer(peerIp, peerPort);
// //                     const discoverMessage = {
// //                         type: 'DISCOVER',
// //                         payload: { identity: this.identity }
// //                     };
// //                     socket.write(JSON.stringify(discoverMessage));
// //                 } catch (error) {
// //                     console.log(`Discovery failed at ${peerIp}:${peerPort} — skipping`);
// //                 }
// //             });
// //         await Promise.allSettled(discoveryPromises);
// //     }

// //     async autoDiscover(subnetMask, port) {
// //         console.log("Starting peer discovery");
// //         const interfaces = os.networkInterfaces();
// //         const myIp = this.identity.ip;
// //         const discoveryTasks = [];

// //         for (const iface of Object.values(interfaces)) {
// //             for (const ifaceDetail of iface) {
// //                 if (ifaceDetail.family === 'IPv4' && !ifaceDetail.internal) {
// //                     const subnet = ip.subnet(ifaceDetail.address, subnetMask);
// //                     if (!ip.cidrSubnet(`${ifaceDetail.address}/${subnetMask}`).contains(myIp)) {
// //                         continue;
// //                     }
// //                     for (
// //                         let current = ip.toLong(subnet.firstAddress);
// //                         current <= ip.toLong(subnet.lastAddress);
// //                         current++
// //                     ) {
// //                         const targetIp = ip.fromLong(current);
// //                         if (targetIp === myIp) continue;
// //                         discoveryTasks.push((async () => {
// //                             try {
// //                                 const socket = await this.connectToPeer(targetIp, port).catch(() => null);
// //                                 if (socket) {
// //                                     const discoverMessage = {
// //                                         type: 'DISCOVER',
// //                                         payload: { identity: this.identity }
// //                                     };
// //                                     socket.write(JSON.stringify(discoverMessage));
// //                                     console.log(`[DISCOVER] Sent discovery to peer at ${targetIp}`);
// //                                 }
// //                             } catch (error) {
// //                                 // No peer at this IP/port
// //                             }
// //                         })());
// //                     }
// //                 }
// //             }
// //         }
// //         await Promise.allSettled(discoveryTasks);
// //         console.log("PEER DISCOVERY COMPLETE");
// //     }

// //     async getConfig() {
// //         return this.config;
// //     }

// //     async getPeers() {
// //         return this.clients;
// //     }

// //     async getData() {
// //         return await this.readData('./data.bin');
// //     }
// // }

// // const peer = new Peer();
// // await peer.initialize();
// // export default peer;

// import tls from 'tls';
// import fs from 'fs/promises';
// import os from 'os';
// import ip from 'ip';
// import crypto from "crypto";
// import forge from 'node-forge';

// class Peer {
//     constructor() {
//         this.clockOffset = 0; // Offset for synchronized time
//         this.syncInterval = null; // For periodic synchronization
//     }

//     async initialize() {
//         this.config = await this.readJsonFile("./config.json");
//         this.identity = this.config.identity;
//         this.peersToDiscover = this.config.peersToDiscover;
//         this.autoDiscoverPeers = this.config.autoDiscoverPeers;
//         this.autoDiscoverPort = this.config.autoDiscoverPort;
//         this.autoDiscoverSubnetMask = this.config.autoDiscoverSubnetMask;

//         console.log(this.config);

//         if (this.autoDiscoverPeers === true) {
//             this.port = this.autoDiscoverPort;
//             this.identity.port = this.autoDiscoverPort;
//         } else {
//             this.port = this.identity.port;
//         }

//         // Load or generate RSA key pair for data-at-rest encryption
//         this.keyPair = await this.loadOrGenerateKeyPair();

//         // Load or generate certificate
//         const certFiles = await this.loadOrGenerateCertificate(this.identity);
//         this.tlsOptions = {
//             key: certFiles.key,
//             cert: certFiles.cert,
//             rejectUnauthorized: false,
//             requestCert: true
//         };

//         // Initialize trusted certificates store
//         this.trustedCertificates = await this.loadTrustedCertificates();

//         // Initialize data store
//         try {
//             await fs.access('./data.bin');
//             await this.readData('./data.bin');
//         } catch (err) {
//             if (err.code === 'ENOENT' || err instanceof SyntaxError) {
//                 await this.writeData('./data.bin', {});
//             } else {
//                 throw err;
//             }
//         }

//         // Initialize TLS server
//         this.server = tls.createServer(this.tlsOptions, (socket) => this.handleConnection(socket));
//         this.server.listen(this.port, () => {
//             console.log(`TLS server is running on port ${this.port}`);
//         });

//         // Store connected clients
//         this.clients = {};
//         this.sockets = {};

//         // Start peer discovery
//         if (this.autoDiscoverPeers) {
//             await this.autoDiscover(this.autoDiscoverSubnetMask, this.port);
//         } else {
//             await this.discover(this.peersToDiscover);
//         }

//         // Start periodic clock synchronization
//         this.startClockSynchronization();
//     }

//     // Berkeley's clock synchronization
//     async startClockSynchronization() {
//         // Run synchronization every 60 seconds
//         this.syncInterval = setInterval(async () => {
//             try {
//                 await this.synchronizeClocks();
//             } catch (err) {
//                 console.error('Clock synchronization failed:', err.message);
//             }
//         }, 60 * 1000);

//         // Run initial synchronization
//         await this.synchronizeClocks();
//     }

//     async synchronizeClocks() {
//         if (Object.keys(this.sockets).length === 0) {
//             console.log('No peers connected, skipping clock synchronization');
//             this.clockOffset = 0; // Reset offset if alone
//             return;
//         }

//         const syncId = crypto.randomBytes(8).toString('hex');
//         const responses = [];
//         const requestTime = Date.now();

//         // Collect timestamps from peers
//         const promises = Object.entries(this.sockets).map(async ([name, socket]) => {
//             try {
//                 const peerTime = await this.requestPeerTime(name, socket, syncId, requestTime);
//                 return { name, peerTime, socket };
//             } catch (err) {
//                 console.warn(`Failed to get time from ${name}: ${err.message}`);
//                 return null;
//             }
//         });

//         const results = await Promise.all(promises);
//         responses.push(...results.filter(r => r !== null));

//         // Add local time
//         responses.push({
//             name: this.identity.name,
//             peerTime: { timestamp: Date.now(), syncId },
//             socket: null
//         });

//         // Calculate average time
//         const now = Date.now();
//         const rtts = responses.map(r => now - requestTime);
//         const adjustedTimes = responses.map((r, i) => r.peerTime.timestamp + Math.floor(rtts[i] / 2));
//         const averageTime = Math.floor(adjustedTimes.reduce((sum, t) => sum + t, 0) / adjustedTimes.length);

//         // Compute and send adjustments
//         for (const { name, peerTime, socket } of responses) {
//             const adjustedPeerTime = peerTime.timestamp + Math.floor((now - requestTime) / 2);
//             const adjustment = averageTime - adjustedPeerTime;
//             if (socket) {
//                 // Send adjustment to peer
//                 try {
//                     socket.write(JSON.stringify({
//                         type: 'CLOCKSYNC_ADJUST',
//                         payload: { syncId, adjustment }
//                     }));
//                 } catch (err) {
//                     console.warn(`Failed to send adjustment to ${name}: ${err.message}`);
//                 }
//             } else {
//                 // Apply adjustment locally
//                 this.clockOffset = adjustment;
//                 console.log(`Local clock adjusted by ${adjustment}ms`);
//             }
//         }
//     }

//     async requestPeerTime(name, socket, syncId, requestTime) {
//         return new Promise((resolve, reject) => {
//             let timeout = setTimeout(() => {
//                 socket.removeListener('data', handler);
//                 reject(new Error('Timeout waiting for CLOCKSYNC_RESPONSE'));
//             }, 5000);

//             const handler = async (data) => {
//                 try {
//                     const messages = this.extractJsonMessages(data.toString());
//                     for (const message of messages) {
//                         if (message.type === 'CLOCKSYNC_RESPONSE' && message.payload.syncId === syncId) {
//                             clearTimeout(timeout);
//                             socket.removeListener('data', handler);
//                             resolve(message.payload);
//                         }
//                     }
//                 } catch (err) {
//                     // Ignore malformed data
//                 }
//             };

//             socket.on('data', handler);
//             socket.write(JSON.stringify({
//                 type: 'CLOCKSYNC_REQUEST',
//                 payload: { syncId, timestamp: requestTime }
//             }));
//         });
//     }

//     getCurrentTime() {
//         return Date.now() + this.clockOffset;
//     }

//     async loadOrGenerateKeyPair() {
//         try {
//             const publicKey = await fs.readFile('./public.pem', 'utf-8');
//             const privateKey = await fs.readFile('./private.pem', 'utf-8');
//             console.log('Loaded existing RSA key pair');
//             return { publicKey, privateKey };
//         } catch (err) {
//             if (err.code === 'ENOENT') {
//                 console.log('Generating new RSA key pair');
//                 const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
//                     modulusLength: 2048,
//                     publicKeyEncoding: {
//                         type: 'spki',
//                         format: 'pem'
//                     },
//                     privateKeyEncoding: {
//                         type: 'pkcs8',
//                         format: 'pem'
//                     }
//                 });
//                 await fs.writeFile('./public.pem', publicKey);
//                 await fs.writeFile('./private.pem', privateKey);
//                 return { publicKey, privateKey };
//             }
//             throw err;
//         }
//     }

//     async loadOrGenerateCertificate(identity) {
//         try {
//             const cert = await fs.readFile('./cert.pem', 'utf-8');
//             const key = await fs.readFile('./key.pem', 'utf-8');
//             console.log('Loaded existing certificate');
//             return { cert, key };
//         } catch (err) {
//             if (err.code === 'ENOENT') {
//                 console.log('Generating new certificate');
//                 const certFiles = await this.generateSelfSignedCertificate(identity);
//                 await fs.writeFile('./cert.pem', certFiles.cert);
//                 await fs.writeFile('./key.pem', certFiles.key);
//                 return certFiles;
//             }
//             throw err;
//         }
//     }

//     async generateSelfSignedCertificate(identity) {
//         const keys = forge.pki.rsa.generateKeyPair(2048);
//         const cert = forge.pki.createCertificate();
//         cert.publicKey = keys.publicKey;
//         cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytes(8));
//         cert.validity.notBefore = new Date();
//         cert.validity.notAfter = new Date();
//         cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
//         const attrs = [{
//             name: 'commonName',
//             value: identity.name
//         }, {
//             name: 'organizationName',
//             value: 'HarmonyDB'
//         }];
//         cert.setSubject(attrs);
//         cert.setIssuer(attrs);
//         cert.sign(keys.privateKey, forge.md.sha256.create());
//         const certPem = forge.pki.certificateToPem(cert);
//         const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
//         return { cert: certPem, key: privateKeyPem };
//     }

//     async loadTrustedCertificates() {
//         try {
//             const data = await fs.readFile('./trusted_peers.json', 'utf-8');
//             if (data.trim() === '') {
//                 await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
//                 return {};
//             }
//             return JSON.parse(data);
//         } catch (err) {
//             if (err.code === 'ENOENT') {
//                 await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
//                 return {};
//             } else if (err instanceof SyntaxError) {
//                 console.warn('Invalid JSON in trusted_peers.json, initializing with empty object');
//                 await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
//                 return {};
//             }
//             throw err;
//         }
//     }

//     async saveTrustedCertificate(peerName, cert) {
//         this.trustedCertificates[peerName] = cert;
//         await fs.writeFile('./trusted_peers.json', JSON.stringify(this.trustedCertificates, null, 2));
//     }

//     async handleConnection(socket) {
//         socket.setEncoding('utf8');
//         let dataBuffer = '';

//         const cert = socket.getPeerCertificate();
//         if (!cert || !cert.raw) {
//             console.error('No peer certificate provided');
//             socket.destroy();
//             return;
//         }
//         const peerName = cert.subject?.CN || 'unknown';
//         if (!this.trustedCertificates[peerName]) {
//             await this.saveTrustedCertificate(peerName, cert.raw.toString('base64'));
//             console.log(`Trusted new certificate for ${peerName}`);
//         } else if (this.trustedCertificates[peerName] !== cert.raw.toString('base64')) {
//             console.error(`Certificate mismatch for ${peerName}`);
//             socket.destroy();
//             return;
//         }

//         socket.on('data', async (data) => {
//             dataBuffer += data;
//             try {
//                 const messages = this.extractJsonMessages(dataBuffer);
//                 if (messages.length > 0) {
//                     for (const message of messages) {
//                         await this.handleMessage(message, socket);
//                     }
//                     dataBuffer = dataBuffer.substring(dataBuffer.lastIndexOf('}') + 1);
//                 }
//             } catch (err) {
//                 // Wait for more data
//             }
//         });

//         socket.on('close', () => {
//             for (const [name, clientSocket] of Object.entries(this.sockets)) {
//                 if (clientSocket === socket) {
//                     console.log(`Peer ${name} disconnected`);
//                     delete this.sockets[name];
//                     delete this.clients[name];
//                     break;
//                 }
//             }
//         });

//         socket.on('error', (err) => {
//             console.log(`Socket error: ${err.message}`);
//         });
//     }

//     extractJsonMessages(data) {
//         const messages = [];
//         let bracketCount = 0;
//         let startPos = data.indexOf('{');
//         if (startPos === -1) return messages;

//         for (let i = startPos; i < data.length; i++) {
//             if (data[i] === '{') bracketCount++;
//             else if (data[i] === '}') bracketCount--;
//             if (bracketCount === 0) {
//                 try {
//                     const jsonStr = data.substring(startPos, i + 1);
//                     const jsonObj = JSON.parse(jsonStr);
//                     messages.push(jsonObj);
//                     startPos = data.indexOf('{', i + 1);
//                     if (startPos === -1) break;
//                     i = startPos - 1;
//                 } catch (err) {
//                     // Not valid JSON yet
//                 }
//             }
//         }
//         return messages;
//     }

//     async handleMessage(message, socket) {
//         console.log(`Received message: ${message.type}`);
//         switch (message.type) {
//             case 'DISCOVER':
//                 await this.handleDiscover(message, socket);
//                 break;
//             case 'DISCOVERACK':
//                 await this.handleDiscoverAck(message, socket);
//                 break;
//             case 'UPDATE':
//                 await this.handleUpdate(message, socket);
//                 break;
//             case 'UPDATEACK':
//                 break;
//             case 'CLOCKSYNC_REQUEST':
//                 await this.handleClockSyncRequest(message, socket);
//                 break;
//             case 'CLOCKSYNC_RESPONSE':
//                 // Handled in requestPeerTime
//                 break;
//             case 'CLOCKSYNC_ADJUST':
//                 await this.handleClockSyncAdjust(message, socket);
//                 break;
//             default:
//                 console.log(`Unknown message type: ${message.type}`);
//         }
//     }

//     async handleClockSyncRequest(message, socket) {
//         const { syncId, timestamp } = message.payload;
//         socket.write(JSON.stringify({
//             type: 'CLOCKSYNC_RESPONSE',
//             payload: { syncId, timestamp: Date.now() }
//         }));
//     }

//     async handleClockSyncAdjust(message, socket) {
//         const { syncId, adjustment } = message.payload;
//         this.clockOffset = adjustment;
//         console.log(`Clock adjusted by ${adjustment}ms for syncId ${syncId}`);
//     }

//     async handleDiscover(message, socket) {
//         const requestIdentity = message.payload.identity;
//         console.log(`Discovery request from: ${requestIdentity.name}`);

//         this.clients[requestIdentity.name] = requestIdentity;
//         this.sockets[requestIdentity.name] = socket;

//         let latestData;
//         try {
//             latestData = await this.readData("./data.bin");
//         } catch (err) {
//             console.log('Error reading data during discovery, sending empty data');
//             latestData = {};
//         }

//         const response = {
//             type: 'DISCOVERACK',
//             payload: {
//                 latestData,
//                 identity: this.identity
//             }
//         };
//         socket.write(JSON.stringify(response));
//     }

//     async handleDiscoverAck(message, socket) {
//         const responseIdentity = message.payload.identity;
//         console.log(`Discovery acknowledgment from: ${responseIdentity.name}`);

//         this.clients[responseIdentity.name] = responseIdentity;
//         this.sockets[responseIdentity.name] = socket;

//         const latestData = message.payload.latestData;
//         if (latestData && typeof latestData === 'object') {
//             try {
//                 await this.writeData("./data.bin", latestData);
//             } catch (err) {
//                 console.log('Error updating data from peer:', err.message);
//             }
//         }
//     }

//     async handleUpdate(message, socket) {
//         const { updatedKey, updatedValue } = message.payload;
//         console.log(`[UPDATE] ${updatedKey} = ${updatedValue}`);

//         let data = await this.readData("./data.bin");
//         data[updatedKey] = updatedValue;
//         await this.writeData("./data.bin", data);

//         const response = {
//             type: 'UPDATEACK',
//             payload: {}
//         };
//         socket.write(JSON.stringify(response));
//     }

//     async connectToPeer(peerIp, peerPort) {
//         return new Promise((resolve, reject) => {
//             const socket = tls.connect({
//                 host: peerIp,
//                 port: peerPort,
//                 ...this.tlsOptions,
//                 servername: peerIp
//             }, () => {
//                 const cert = socket.getPeerCertificate();
//                 if (!cert || !cert.raw) {
//                     console.error(`No certificate from ${peerIp}:${peerPort}`);
//                     socket.destroy();
//                     reject(new Error('No peer certificate'));
//                     return;
//                 }
//                 const peerName = cert.subject?.CN || 'unique';
//                 if (!this.trustedCertificates[peerName]) {
//                     this.saveTrustedCertificate(peerName, cert.raw.toString('base64'));
//                     console.log(`Trusted new certificate for ${peerName}`);
//                 } else if (this.trustedCertificates[peerName] !== cert.raw.toString('base64')) {
//                     console.error(`Certificate mismatch for ${peerName}`);
//                     socket.destroy();
//                     reject(new Error('Certificate mismatch'));
//                     return;
//                 }
//                 console.log(`Connected to peer at ${peerIp}:${peerPort}`);
//                 resolve(socket);
//             });

//             socket.on('error', (err) => {
//                 reject(err);
//             });

//             socket.on('data', async (data) => {
//                 let dataBuffer = data.toString();
//                 try {
//                     const messages = this.extractJsonMessages(dataBuffer);
//                     for (const message of messages) {
//                         await this.handleMessage(message, socket);
//                     }
//                 } catch (err) {
//                     console.log(`Error processing data: ${err.message}`);
//                 }
//             });

//             socket.on('close', () => {
//                 for (const [name, clientSocket] of Object.entries(this.sockets)) {
//                     if (clientSocket === socket) {
//                         console.log(`Lost connection to peer ${name}`);
//                         delete this.sockets[name];
//                         delete this.clients[name];
//                         break;
//                     }
//                 }
//             });
//         });
//     }

//     async set(key, value) {
//         let data = await this.readData("./data.bin");
//         data[key] = value;
//         await this.writeData("./data.bin", data);

//         const failedPeers = [];
//         const updateMessage = {
//             type: 'UPDATE',
//             payload: {
//                 updatedKey: key,
//                 updatedValue: value
//             }
//         };

//         for (const name of Object.keys(this.sockets)) {
//             const socket = this.sockets[name];
//             try {
//                 socket.write(JSON.stringify(updateMessage));
//             } catch (error) {
//                 console.log(`[ERROR] Failed to send update to peer ${name}. Removing from clients.`);
//                 failedPeers.push(name);
//             }
//         }

//         for (const peerName of failedPeers) {
//             delete this.sockets[peerName];
//             delete this.clients[peerName];
//         }
//     }

//     async get(key) {
//         let data = await this.readData("./data.bin");
//         return data[key];
//     }

//     async readJsonFile(path) {
//         try {
//             const data = await fs.readFile(path, 'utf-8');
//             return JSON.parse(data);
//         } catch (err) {
//             if (err.code === 'ENOENT') {
//                 await fs.writeFile(path, '{}', 'utf-8');
//                 return {};
//             }
//             throw err;
//         }
//     }

//     async writeJsonFile(path, data) {
//         await fs.writeFile(path, JSON.stringify(data, null, 2));
//     }

//     async readData(path) {
//         try {
//             try {
//                 await fs.access(path);
//             } catch (err) {
//                 if (err.code === 'ENOENT') {
//                     await this.writeData(path, {});
//                     return {};
//                 }
//                 throw err;
//             }

//             const data = await fs.readFile(path);
//             if (data.length === 0) {
//                 return {};
//             }
//             console.log('Data:', data.toString());

//             try {
//                 const privateKey = this.keyPair.privateKey;
//                 const decryptedBuffer = crypto.privateDecrypt(
//                     {
//                         key: privateKey,
//                         padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//                         oaepHash: 'sha256'
//                     },
//                     data
//                 );
//                 console.log('Decrypted data:', decryptedBuffer.toString());
//                 return JSON.parse(decryptedBuffer.toString());
//             } catch (decryptErr) {
//                 console.log('Decryption failed, attempting to read as plain JSON');
//                 try {
//                     const jsonString = data.toString('utf8');
//                     const parsedData = JSON.parse(jsonString);
//                     await this.writeData(path, parsedData);
//                     return parsedData;
//                 } catch (jsonErr) {
//                     console.log('Failed to parse as plain JSON, initializing new data store');
//                     const newData = {};
//                     await this.writeData(path, newData);
//                     return newData;
//                 }
//             }
//         } catch (err) {
//             console.error('Error reading data:', err.message);
//             const newData = {};
//             await this.writeData(path, newData);
//             return newData;
//         }
//     }

//     async writeData(path, data) {
//         try {
//             const publicKey = this.keyPair.publicKey;
//             const dataBuffer = Buffer.from(JSON.stringify(data));
//             const maxBytesToEncrypt = Math.floor(2048 / 8) - 66;
//             if (dataBuffer.length > maxBytesToEncrypt) {
//                 console.warn(`Data too large to encrypt (${dataBuffer.length} bytes), storing as plain JSON`);
//                 await this.writeJsonFile(path, data);
//                 return;
//             }

//             const encryptedBuffer = crypto.publicEncrypt(
//                 {
//                     key: publicKey,
//                     padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
//                     oaepHash: 'sha256'
//                 },
//                 dataBuffer
//             );
//             console.log('Encrypted data:', encryptedBuffer.toString());
//             await fs.writeFile(path, encryptedBuffer);
//         } catch (err) {
//             console.error('Error writing encrypted data:', err.message);
//             await this.writeJsonFile(path, data);
//         }
//     }

//     async discover(peersToDiscover) {
//         const discoveryPromises = peersToDiscover
//             .filter(peer => !(peer.ip === this.identity.ip && peer.port === this.identity.port))
//             .map(async peer => {
//                 const peerIp = peer.ip;
//                 const peerPort = peer.port;
//                 console.log(`Discovering peer at ${peerIp}:${peerPort}`);
//                 try {
//                     const socket = await this.connectToPeer(peerIp, peerPort);
//                     const discoverMessage = {
//                         type: 'DISCOVER',
//                         payload: { identity: this.identity }
//                     };
//                     socket.write(JSON.stringify(discoverMessage));
//                 } catch (error) {
//                     console.log(`Discovery failed at ${peerIp}:${peerPort} — skipping`);
//                 }
//             });
//         await Promise.allSettled(discoveryPromises);
//     }

//     async autoDiscover(subnetMask, port) {
//         console.log("Starting peer discovery");
//         const interfaces = os.networkInterfaces();
//         const myIp = this.identity.ip;
//         const discoveryTasks = [];

//         for (const iface of Object.values(interfaces)) {
//             for (const ifaceDetail of iface) {
//                 if (ifaceDetail.family === 'IPv4' && !ifaceDetail.internal) {
//                     const subnet = ip.subnet(ifaceDetail.address, subnetMask);
//                     if (!ip.cidrSubnet(`${ifaceDetail.address}/${subnetMask}`).contains(myIp)) {
//                         continue;
//                     }
//                     for (
//                         let current = ip.toLong(subnet.firstAddress);
//                         current <= ip.toLong(subnet.lastAddress);
//                         current++
//                     ) {
//                         const targetIp = ip.fromLong(current);
//                         if (targetIp === myIp) continue;
//                         discoveryTasks.push((async () => {
//                             try {
//                                 const socket = await this.connectToPeer(targetIp, port).catch(() => null);
//                                 if (socket) {
//                                     const discoverMessage = {
//                                         type: 'DISCOVER',
//                                         payload: { identity: this.identity }
//                                     };
//                                     socket.write(JSON.stringify(discoverMessage));
//                                     console.log(`[DISCOVER] Sent discovery to peer at ${targetIp}`);
//                                 }
//                             } catch (error) {
//                                 // No peer at this IP/port
//                             }
//                         })());
//                     }
//                 }
//             }
//         }
//         await Promise.allSettled(discoveryTasks);
//         console.log("PEER DISCOVERY COMPLETE");
//     }

//     async getConfig() {
//         return this.config;
//     }

//     async getPeers() {
//         return this.clients;
//     }

//     async getData() {
//         return await this.readData('./data.bin');
//     }

//     async shutdown() {
//         if (this.syncInterval) {
//             clearInterval(this.syncInterval);
//         }
//         for (const socket of Object.values(this.sockets)) {
//             socket.destroy();
//         }
//         this.server.close();
//         await this.writeData('./data.bin', await this.getData());
//     }
// }

// const peer = new Peer()
// await peer.initialize()
// export default peer

import tls from 'tls';
import fs from 'fs/promises';
import os from 'os';
import ip from 'ip';
import crypto from "crypto";
import forge from 'node-forge';

class Peer {
    constructor() {
        this.clockOffset = 0; // Offset for synchronized time
        this.syncInterval = null; // For periodic synchronization
    }

    async initialize() {
        this.config = await this.readJsonFile("./config.json");
        this.identity = this.config.identity;
        this.peersToDiscover = this.config.peersToDiscover;
        this.autoDiscoverPeers = this.config.autoDiscoverPeers;
        this.autoDiscoverPort = this.config.autoDiscoverPort;
        this.autoDiscoverSubnetMask = this.config.autoDiscoverSubnetMask;

        console.log(this.config);

        if (this.autoDiscoverPeers === true) {
            this.port = this.autoDiscoverPort;
            this.identity.port = this.autoDiscoverPort;
        } else {
            this.port = this.identity.port;
        }

        // Load or generate RSA key pair for data-at-rest encryption
        this.keyPair = await this.loadOrGenerateKeyPair();

        // Load or generate certificate
        const certFiles = await this.loadOrGenerateCertificate(this.identity);
        this.tlsOptions = {
            key: certFiles.key,
            cert: certFiles.cert,
            rejectUnauthorized: false,
            requestCert: true
        };

        // Initialize trusted certificates store
        this.trustedCertificates = await this.loadTrustedCertificates();

        // Migration for existing plain JSON data
        try {
            const rawData = await fs.readFile('./data.bin', 'utf8');
            const parsedData = JSON.parse(rawData);
            console.log('Migrating existing plain JSON data to encrypted format');
            await this.writeData('./data.bin', parsedData);
        } catch (err) {
            // If it's not plain JSON or doesn't exist, proceed normally
        }

        // Initialize data store
        try {
            await fs.access('./data.bin');
            await this.readData('./data.bin');
        } catch (err) {
            if (err.code === 'ENOENT') {
                await this.writeData('./data.bin', {});
            } else {
                throw err;
            }
        }

        // Initialize TLS server
        this.server = tls.createServer(this.tlsOptions, (socket) => this.handleConnection(socket));
        this.server.listen(this.port, () => {
            console.log(`TLS server is running on port ${this.port}`);
        });

        // Store connected clients
        this.clients = {};
        this.sockets = {};

        // Start peer discovery
        if (this.autoDiscoverPeers) {
            await this.autoDiscover(this.autoDiscoverSubnetMask, this.port);
        } else {
            await this.discover(this.peersToDiscover);
        }

        // Start periodic clock synchronization
        this.startClockSynchronization();
    }

    // Berkeley's clock synchronization
    async startClockSynchronization() {
        // Run synchronization every 60 seconds
        this.syncInterval = setInterval(async () => {
            try {
                await this.synchronizeClocks();
            } catch (err) {
                console.error('Clock synchronization failed:', err.message);
            }
        }, 60 * 1000);

        // Run initial synchronization
        await this.synchronizeClocks();
    }

    async synchronizeClocks() {
        if (Object.keys(this.sockets).length === 0) {
            console.log('No peers connected, skipping clock synchronization');
            this.clockOffset = 0; // Reset offset if alone
            return;
        }

        const syncId = crypto.randomBytes(8).toString('hex');
        const responses = [];
        const requestTime = Date.now();

        // Collect timestamps from peers
        const promises = Object.entries(this.sockets).map(async ([name, socket]) => {
            try {
                const peerTime = await this.requestPeerTime(name, socket, syncId, requestTime);
                return { name, peerTime, socket };
            } catch (err) {
                console.warn(`Failed to get time from ${name}: ${err.message}`);
                return null;
            }
        });

        const results = await Promise.all(promises);
        responses.push(...results.filter(r => r !== null));

        // Add local time
        responses.push({
            name: this.identity.name,
            peerTime: { timestamp: Date.now(), syncId },
            socket: null
        });

        // Calculate average time
        const now = Date.now();
        const rtts = responses.map(r => now - requestTime);
        const adjustedTimes = responses.map((r, i) => r.peerTime.timestamp + Math.floor(rtts[i] / 2));
        const averageTime = Math.floor(adjustedTimes.reduce((sum, t) => sum + t, 0) / adjustedTimes.length);

        // Compute and send adjustments
        for (const { name, peerTime, socket } of responses) {
            const adjustedPeerTime = peerTime.timestamp + Math.floor((now - requestTime) / 2);
            const adjustment = averageTime - adjustedPeerTime;
            if (socket) {
                // Send adjustment to peer
                try {
                    socket.write(JSON.stringify({
                        type: 'CLOCKSYNC_ADJUST',
                        payload: { syncId, adjustment }
                    }));
                } catch (err) {
                    console.warn(`Failed to send adjustment to ${name}: ${err.message}`);
                }
            } else {
                // Apply adjustment locally
                this.clockOffset = adjustment;
                console.log(`Local clock adjusted by ${adjustment}ms`);
            }
        }
    }

    async requestPeerTime(name, socket, syncId, requestTime) {
        return new Promise((resolve, reject) => {
            let timeout = setTimeout(() => {
                socket.removeListener('data', handler);
                reject(new Error('Timeout waiting for CLOCKSYNC_RESPONSE'));
            }, 5000);

            const handler = async (data) => {
                try {
                    const messages = this.extractJsonMessages(data.toString());
                    for (const message of messages) {
                        if (message.type === 'CLOCKSYNC_RESPONSE' && message.payload.syncId === syncId) {
                            clearTimeout(timeout);
                            socket.removeListener('data', handler);
                            resolve(message.payload);
                        }
                    }
                } catch (err) {
                    // Ignore malformed data
                }
            };

            socket.on('data', handler);
            socket.write(JSON.stringify({
                type: 'CLOCKSYNC_REQUEST',
                payload: { syncId, timestamp: requestTime }
            }));
        });
    }

    getCurrentTime() {
        return Date.now() + this.clockOffset;
    }

    async loadOrGenerateKeyPair() {
        try {
            const publicKey = await fs.readFile('./public.pem', 'utf-8');
            const privateKey = await fs.readFile('./private.pem', 'utf-8');
            console.log('Loaded existing RSA key pair');
            return { publicKey, privateKey };
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log('Generating new RSA key pair');
                const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
                    modulusLength: 2048,
                    publicKeyEncoding: {
                        type: 'spki',
                        format: 'pem'
                    },
                    privateKeyEncoding: {
                        type: 'pkcs8',
                        format: 'pem'
                    }
                });
                await fs.writeFile('./public.pem', publicKey);
                await fs.writeFile('./private.pem', privateKey);
                return { publicKey, privateKey };
            }
            throw err;
        }
    }

    async loadOrGenerateCertificate(identity) {
        try {
            const cert = await fs.readFile('./cert.pem', 'utf-8');
            const key = await fs.readFile('./key.pem', 'utf-8');
            console.log('Loaded existing certificate');
            return { cert, key };
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log('Generating new certificate');
                const certFiles = await this.generateSelfSignedCertificate(identity);
                await fs.writeFile('./cert.pem', certFiles.cert);
                await fs.writeFile('./key.pem', certFiles.key);
                return certFiles;
            }
            throw err;
        }
    }

    async generateSelfSignedCertificate(identity) {
        const keys = forge.pki.rsa.generateKeyPair(2048);
        const cert = forge.pki.createCertificate();
        cert.publicKey = keys.publicKey;
        cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytes(8));
        cert.validity.notBefore = new Date();
        cert.validity.notAfter = new Date();
        cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
        const attrs = [{
            name: 'commonName',
            value: identity.name
        }, {
            name: 'organizationName',
            value: 'HarmonyDB'
        }];
        cert.setSubject(attrs);
        cert.setIssuer(attrs);
        cert.sign(keys.privateKey, forge.md.sha256.create());
        const certPem = forge.pki.certificateToPem(cert);
        const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
        return { cert: certPem, key: privateKeyPem };
    }

    async loadTrustedCertificates() {
        try {
            const data = await fs.readFile('./trusted_peers.json', 'utf-8');
            if (data.trim() === '') {
                await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
                return {};
            }
            return JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
                return {};
            } else if (err instanceof SyntaxError) {
                console.warn('Invalid JSON in trusted_peers.json, initializing with empty object');
                await fs.writeFile('./trusted_peers.json', '{}', 'utf-8');
                return {};
            }
            throw err;
        }
    }

    async saveTrustedCertificate(peerName, cert) {
        this.trustedCertificates[peerName] = cert;
        await fs.writeFile('./trusted_peers.json', JSON.stringify(this.trustedCertificates, null, 2));
    }

    async handleConnection(socket) {
        socket.setEncoding('utf8');
        let dataBuffer = '';

        const cert = socket.getPeerCertificate();
        if (!cert || !cert.raw) {
            console.error('No peer certificate provided');
            socket.destroy();
            return;
        }
        const peerName = cert.subject?.CN || 'unknown';
        if (!this.trustedCertificates[peerName]) {
            await this.saveTrustedCertificate(peerName, cert.raw.toString('base64'));
            console.log(`Trusted new certificate for ${peerName}`);
        } else if (this.trustedCertificates[peerName] !== cert.raw.toString('base64')) {
            console.error(`Certificate mismatch for ${peerName}`);
            socket.destroy();
            return;
        }

        socket.on('data', async (data) => {
            dataBuffer += data;
            try {
                const messages = this.extractJsonMessages(dataBuffer);
                if (messages.length > 0) {
                    for (const message of messages) {
                        await this.handleMessage(message, socket);
                    }
                    dataBuffer = dataBuffer.substring(dataBuffer.lastIndexOf('}') + 1);
                }
            } catch (err) {
                // Wait for more data
            }
        });

        socket.on('close', () => {
            for (const [name, clientSocket] of Object.entries(this.sockets)) {
                if (clientSocket === socket) {
                    console.log(`Peer ${name} disconnected`);
                    delete this.sockets[name];
                    delete this.clients[name];
                    break;
                }
            }
        });

        socket.on('error', (err) => {
            console.log(`Socket error: ${err.message}`);
        });
    }

    extractJsonMessages(data) {
        const messages = [];
        let bracketCount = 0;
        let startPos = data.indexOf('{');
        if (startPos === -1) return messages;

        for (let i = startPos; i < data.length; i++) {
            if (data[i] === '{') bracketCount++;
            else if (data[i] === '}') bracketCount--;
            if (bracketCount === 0) {
                try {
                    const jsonStr = data.substring(startPos, i + 1);
                    const jsonObj = JSON.parse(jsonStr);
                    messages.push(jsonObj);
                    startPos = data.indexOf('{', i + 1);
                    if (startPos === -1) break;
                    i = startPos - 1;
                } catch (err) {
                    // Not valid JSON yet
                }
            }
        }
        return messages;
    }

    async handleMessage(message, socket) {
        console.log(`Received message: ${message.type}`);
        switch (message.type) {
            case 'DISCOVER':
                await this.handleDiscover(message, socket);
                break;
            case 'DISCOVERACK':
                await this.handleDiscoverAck(message, socket);
                break;
            case 'UPDATE':
                await this.handleUpdate(message, socket);
                break;
            case 'UPDATEACK':
                break;
            case 'CLOCKSYNC_REQUEST':
                await this.handleClockSyncRequest(message, socket);
                break;
            case 'CLOCKSYNC_RESPONSE':
                // Handled in requestPeerTime
                break;
            case 'CLOCKSYNC_ADJUST':
                await this.handleClockSyncAdjust(message, socket);
                break;
            default:
                console.log(`Unknown message type: ${message.type}`);
        }
    }

    async handleClockSyncRequest(message, socket) {
        const { syncId, timestamp } = message.payload;
        socket.write(JSON.stringify({
            type: 'CLOCKSYNC_RESPONSE',
            payload: { syncId, timestamp: Date.now() }
        }));
    }

    async handleClockSyncAdjust(message, socket) {
        const { syncId, adjustment } = message.payload;
        this.clockOffset = adjustment;
        console.log(`Clock adjusted by ${adjustment}ms for syncId ${syncId}`);
    }

    async handleDiscover(message, socket) {
        const requestIdentity = message.payload.identity;
        console.log(`Discovery request from: ${requestIdentity.name}`);

        this.clients[requestIdentity.name] = requestIdentity;
        this.sockets[requestIdentity.name] = socket;

        let latestData;
        try {
            latestData = await this.readData("./data.bin");
        } catch (err) {
            console.log('Error reading data during discovery, sending empty data');
            latestData = {};
        }

        const response = {
            type: 'DISCOVERACK',
            payload: {
                latestData,
                identity: this.identity
            }
        };
        socket.write(JSON.stringify(response));
    }

    async handleDiscoverAck(message, socket) {
        const responseIdentity = message.payload.identity;
        console.log(`Discovery acknowledgment from: ${responseIdentity.name}`);

        this.clients[responseIdentity.name] = responseIdentity;
        this.sockets[responseIdentity.name] = socket;

        const latestData = message.payload.latestData;
        if (latestData && typeof latestData === 'object') {
            try {
                await this.writeData("./data.bin", latestData);
            } catch (err) {
                console.log('Error updating data from peer:', err.message);
            }
        }
    }

    async handleUpdate(message, socket) {
        const { updatedKey, updatedValue } = message.payload;
        console.log(`[UPDATE] ${updatedKey} = ${updatedValue}`);

        let data = await this.readData("./data.bin");
        data[updatedKey] = updatedValue;
        await this.writeData("./data.bin", data);

        const response = {
            type: 'UPDATEACK',
            payload: {}
        };
        socket.write(JSON.stringify(response));
    }

    async connectToPeer(peerIp, peerPort) {
        return new Promise((resolve, reject) => {
            const socket = tls.connect({
                host: peerIp,
                port: peerPort,
                ...this.tlsOptions,
                servername: peerIp
            }, () => {
                const cert = socket.getPeerCertificate();
                if (!cert || !cert.raw) {
                    console.error(`No certificate from ${peerIp}:${peerPort}`);
                    socket.destroy();
                    reject(new Error('No peer certificate'));
                    return;
                }
                const peerName = cert.subject?.CN || 'unique';
                if (!this.trustedCertificates[peerName]) {
                    this.saveTrustedCertificate(peerName, cert.raw.toString('base64'));
                    console.log(`Trusted new certificate for ${peerName}`);
                } else if (this.trustedCertificates[peerName] !== cert.raw.toString('base64')) {
                    console.error(`Certificate mismatch for ${peerName}`);
                    socket.destroy();
                    reject(new Error('Certificate mismatch'));
                    return;
                }
                console.log(`Connected to peer at ${peerIp}:${peerPort}`);
                resolve(socket);
            });

            socket.on('error', (err) => {
                reject(err);
            });

            socket.on('data', async (data) => {
                let dataBuffer = data.toString();
                try {
                    const messages = this.extractJsonMessages(dataBuffer);
                    for (const message of messages) {
                        await this.handleMessage(message, socket);
                    }
                } catch (err) {
                    console.log(`Error processing data: ${err.message}`);
                }
            });

            socket.on('close', () => {
                for (const [name, clientSocket] of Object.entries(this.sockets)) {
                    if (clientSocket === socket) {
                        console.log(`Lost connection to peer ${name}`);
                        delete this.sockets[name];
                        delete this.clients[name];
                        break;
                    }
                }
            });
        });
    }

    async set(key, value) {
        let data = await this.readData("./data.bin");
        data[key] = value;
        await this.writeData("./data.bin", data);

        const failedPeers = [];
        const updateMessage = {
            type: 'UPDATE',
            payload: {
                updatedKey: key,
                updatedValue: value
            }
        };

        for (const name of Object.keys(this.sockets)) {
            const socket = this.sockets[name];
            try {
                socket.write(JSON.stringify(updateMessage));
            } catch (error) {
                console.log(`[ERROR] Failed to send update to peer ${name}. Removing from clients.`);
                failedPeers.push(name);
            }
        }

        for (const peerName of failedPeers) {
            delete this.sockets[peerName];
            delete this.clients[peerName];
        }
    }

    async get(key) {
        let data = await this.readData("./data.bin");
        return data[key];
    }

    async readJsonFile(path) {
        try {
            const data = await fs.readFile(path, 'utf-8');
            return JSON.parse(data);
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fs.writeFile(path, '{}', 'utf-8');
                return {};
            }
            throw err;
        }
    }

    async writeJsonFile(path, data) {
        await fs.writeFile(path, JSON.stringify(data, null, 2));
    }

    async readData(path) {
        try {
            await fs.access(path);
        } catch (err) {
            if (err.code === 'ENOENT') {
                await this.writeData(path, {});
                return {};
            }
            throw err;
        }

        const data = await fs.readFile(path);
        if (data.length === 0) {
            return {};
        }

        try {
            // Extract components from the encrypted file
            const iv = data.slice(0, 16);              // First 16 bytes: IV
            const authTag = data.slice(16, 32);        // Next 16 bytes: Auth tag
            const encryptedKey = data.slice(32, 32 + 256); // Next 256 bytes: RSA-encrypted AES key
            const encryptedData = data.slice(32 + 256); // Remaining bytes: Encrypted data

            // Decrypt the AES key with RSA private key
            const privateKey = this.keyPair.privateKey;
            const aesKey = crypto.privateDecrypt(
                {
                    key: privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                encryptedKey
            );

            // Decrypt the data with AES-GCM
            const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
            return JSON.parse(decrypted.toString('utf8'));
        } catch (decryptErr) {
            console.error('Failed to decrypt data:', decryptErr.message);
            throw new Error('Data decryption failed; file may be corrupted');
        }
    }

    async writeData(path, data) {
        try {
            // Generate a random 32-byte AES key and 16-byte IV
            const aesKey = crypto.randomBytes(32); // 256-bit AES key
            const iv = crypto.randomBytes(16);     // Initialization vector for AES-GCM

            // Encrypt the data with AES-GCM
            const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
            const dataBuffer = Buffer.from(JSON.stringify(data));
            const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
            const authTag = cipher.getAuthTag(); // Authentication tag for integrity

            // Encrypt the AES key with RSA public key
            const publicKey = this.keyPair.publicKey;
            const encryptedKey = crypto.publicEncrypt(
                {
                    key: publicKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                },
                aesKey
            );

            // Combine IV, auth tag, encrypted key, and encrypted data
            const finalBuffer = Buffer.concat([iv, authTag, encryptedKey, encrypted]);
            await fs.writeFile(path, finalBuffer);
        } catch (err) {
            console.error('Error writing encrypted data:', err.message);
            throw err; // Do not fall back to plain JSON; fail explicitly
        }
    }

    async discover(peersToDiscover) {
        const discoveryPromises = peersToDiscover
            .filter(peer => !(peer.ip === this.identity.ip && peer.port === this.identity.port))
            .map(async peer => {
                const peerIp = peer.ip;
                const peerPort = peer.port;
                console.log(`Discovering peer at ${peerIp}:${peerPort}`);
                try {
                    const socket = await this.connectToPeer(peerIp, peerPort);
                    const discoverMessage = {
                        type: 'DISCOVER',
                        payload: { identity: this.identity }
                    };
                    socket.write(JSON.stringify(discoverMessage));
                } catch (error) {
                    console.log(`Discovery failed at ${peerIp}:${peerPort} — skipping`);
                }
            });
        await Promise.allSettled(discoveryPromises);
    }

    async autoDiscover(subnetMask, port) {
        console.log("Starting peer discovery");
        const interfaces = os.networkInterfaces();
        const myIp = this.identity.ip;
        const discoveryTasks = [];

        for (const iface of Object.values(interfaces)) {
            for (const ifaceDetail of iface) {
                if (ifaceDetail.family === 'IPv4' && !ifaceDetail.internal) {
                    const subnet = ip.subnet(ifaceDetail.address, subnetMask);
                    if (!ip.cidrSubnet(`${ifaceDetail.address}/${subnetMask}`).contains(myIp)) {
                        continue;
                    }
                    for (
                        let current = ip.toLong(subnet.firstAddress);
                        current <= ip.toLong(subnet.lastAddress);
                        current++
                    ) {
                        const targetIp = ip.fromLong(current);
                        if (targetIp === myIp) continue;
                        discoveryTasks.push((async () => {
                            try {
                                const socket = await this.connectToPeer(targetIp, port).catch(() => null);
                                if (socket) {
                                    const discoverMessage = {
                                        type: 'DISCOVER',
                                        payload: { identity: this.identity }
                                    };
                                    socket.write(JSON.stringify(discoverMessage));
                                    console.log(`[DISCOVER] Sent discovery to peer at ${targetIp}`);
                                }
                            } catch (error) {
                                // No peer at this IP/port
                            }
                        })());
                    }
                }
            }
        }
        await Promise.allSettled(discoveryTasks);
        console.log("PEER DISCOVERY COMPLETE");
    }

    async getConfig() {
        return this.config;
    }

    async getPeers() {
        return this.clients;
    }

    async getData() {
        return await this.readData('./data.bin');
    }

    async shutdown() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        for (const socket of Object.values(this.sockets)) {
            socket.destroy();
        }
        this.server.close();
        await this.writeData('./data.bin', await this.getData());
    }
}

const peer = new Peer();
await peer.initialize();
export default peer;