import net from 'net';
import fs from 'fs/promises';
import os from 'os';
import ip from 'ip';

class Peer {
    constructor() {
        // Initialization moved to this.initialize
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

        // Initialize socket server
        this.server = net.createServer((socket) => this.handleConnection(socket));
        this.server.listen(this.port, () => {
            console.log(`Socket server is running on port ${this.port}`);
        });

        // Store connected clients
        this.clients = {}; 
        this.sockets = {}; // Map peer names to their socket connections

        // Start peer discovery
        if (this.autoDiscoverPeers == true) {
            await this.autoDiscover(this.autoDiscoverSubnetMask, this.port);
        } else {
            await this.discover(this.peersToDiscover);
        }
    }

    async handleConnection(socket) {
        socket.setEncoding('utf8');
        
        let dataBuffer = '';
        
        socket.on('data', async (data) => {
            dataBuffer += data;
            
            try {
                // Try to parse accumulated data as JSON
                // This handles cases where data might come in multiple chunks
                const messages = this.extractJsonMessages(dataBuffer);
                
                if (messages.length > 0) {
                    // Process each complete message
                    for (const message of messages) {
                        await this.handleMessage(message, socket);
                    }
                    
                    // Keep any remaining incomplete data
                    dataBuffer = dataBuffer.substring(dataBuffer.lastIndexOf('}') + 1);
                }
            } catch (err) {
                // If we can't parse as JSON yet, wait for more data
            }
        });
        
        socket.on('close', () => {
            // Find and remove the disconnected peer
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
                    // Not a valid JSON yet, continue
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
                // Handle acknowledge if needed
                break;
                
            default:
                console.log(`Unknown message type: ${message.type}`);
        }
    }

    async handleDiscover(message, socket) {
        const requestIdentity = message.payload.identity;
        console.log(`Discovery request from: ${requestIdentity.name}`);
        
        // Store the peer info
        this.clients[requestIdentity.name] = requestIdentity;
        this.sockets[requestIdentity.name] = socket;
        
        // Send response
        const latestData = await this.readJsonFile("./data.json");
        const response = {
            type: 'DISCOVERACK',
            payload: {
                latestData: latestData,
                identity: this.identity
            }
        };
        
        socket.write(JSON.stringify(response));
    }

    async handleDiscoverAck(message, socket) {
        const responseIdentity = message.payload.identity;
        console.log(`Discovery acknowledgment from: ${responseIdentity.name}`);
        
        // Store the peer info
        this.clients[responseIdentity.name] = responseIdentity;
        this.sockets[responseIdentity.name] = socket;
        
        // Update local data
        const latestData = message.payload.latestData;
        await this.writeJsonFile("./data.json", latestData);
    }

    async handleUpdate(message, socket) {
        const updatePayload = message.payload;
        const key = updatePayload.updatedKey;
        const value = updatePayload.updatedValue;
        
        console.log(`[UPDATE] ${key} = ${value}`);
        
        // Update local data
        let data = await this.readJsonFile("./data.json");
        data[key] = value;
        await this.writeJsonFile("./data.json", data);
        
        // Send acknowledgment
        const response = {
            type: 'UPDATEACK',
            payload: {}
        };
        
        socket.write(JSON.stringify(response));
    }

    async connectToPeer(peerIp, peerPort) {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            
            socket.connect(peerPort, peerIp, () => {
                console.log(`Connected to peer at ${peerIp}:${peerPort}`);
                resolve(socket);
            });
            
            socket.on('error', (err) => {
                reject(err);
            });
            
            // Setup socket data handling after connection
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
                // Handle socket close
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
        // Update local data
        let data = await this.readJsonFile("./data.json");
        data[key] = value;
        await this.writeJsonFile("./data.json", data);
        
        // Propagate to peers
        const failedPeers = [];
        
        // Create update message
        const updateMessage = {
            type: 'UPDATE',
            payload: {
                updatedKey: key,
                updatedValue: value
            }
        };
        
        // Send to all connected peers
        for (const name of Object.keys(this.sockets)) {
            const socket = this.sockets[name];
            
            try {
                socket.write(JSON.stringify(updateMessage));
            } catch (error) {
                console.log(`[ERROR] Failed to send update to peer ${name}. Removing from clients.`);
                failedPeers.push(name);
            }
        }
        
        // Remove failed peers
        for (const peerName of failedPeers) {
            delete this.sockets[peerName];
            delete this.clients[peerName];
        }
    }
    
    async get(key) {
        let data = await this.readJsonFile("./data.json");
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

    async discover(peersToDiscover) {
        const discoveryPromises = peersToDiscover
            .filter(peer => !(peer.ip === this.identity.ip && peer.port === this.identity.port))
            .map(async peer => {
                const peerIp = peer.ip;
                const peerPort = peer.port;
                console.log(`Discovering peer at ${peerIp}:${peerPort}`);
    
                try {
                    // Connect to peer
                    const socket = await this.connectToPeer(peerIp, peerPort);
                    
                    // Send discovery message
                    const discoverMessage = {
                        type: 'DISCOVER',
                        payload: {
                            identity: this.identity
                        }
                    };
                    
                    socket.write(JSON.stringify(discoverMessage));
                    
                    // The rest of discovery processing happens in the socket's data event handler
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
                    // Use provided subnet mask instead of detected one
                    const subnet = ip.subnet(ifaceDetail.address, subnetMask);
                    
                    // If myIp is not in this subnet, skip
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
                                // Try to connect to peer
                                const socket = await this.connectToPeer(targetIp, port).catch(() => null);
                                
                                if (socket) {
                                    // Send discovery message
                                    const discoverMessage = {
                                        type: 'DISCOVER',
                                        payload: {
                                            identity: this.identity
                                        }
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
}

const peer = new Peer();
await peer.initialize();
export default peer

// Uncomment to test automatic changes
// setInterval(async() => {
//     console.log("incrementing counter");
//     await peer.set("counter", (await peer.get("counter")) + 1);
// }, 1000);