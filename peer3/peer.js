import jayson from 'jayson';
import fs from 'fs/promises';
import os from 'os';
import ip from 'ip';

class Peer {
    constructor() {
        //moved to this.initialize
    }

    async initialize() {
        this.config = await this.readJsonFile("./config.json")
        this.identity = this.config.identity
        this.peersToDiscover = this.config.peersToDiscover
        this.autoDiscoverPeers = this.config.autoDiscoverPeers
        this.autoDiscoverPort = this.config.autoDiscoverPort
        this.autoDiscoverSubnetMask = this.config.autoDiscoverSubnetMask

        console.log(this.config)

        this.server = jayson.server({
            discover: async(args, callback) => await this.discoverAck(args, callback),
            set: async(args, callback) => await this.setter(args,callback)
        });

        if(this.autoDiscoverPeers === true){
            this.port = this.autoDiscoverPort
            this.identity.port = this.autoDiscoverPort
        }else{
            this.port = this.identity.port
        }
        this.server.http().listen(this.port, () => {
            console.log(`JSON-RPC server is running on port ${this.port}`);
        });

        this.clients = {};

        if(this.autoDiscoverPeers == true){
            await this.autoDiscover(this.autoDiscoverSubnetMask, this.port)
        }else{
            await this.discover(this.peersToDiscover);
        }
    }

    async set(key, value) {
        let data = await this.readJsonFile("./data.json");
        data[key] = value;
        const failedPeers = [];
    
        for (const name of Object.keys(this.clients)) {
            const clientInfo = this.clients[name];
            try {
                const client = jayson.Client.http({
                    hostname: clientInfo.ip,
                    port: clientInfo.port
                });
                await this.remoteCall(client, "set", {
                    message: "UPDATE",
                    payload: {
                        updatedKey: key,
                        updatedValue: value
                    }
                });
            } catch (error) {
                console.log(`[ERROR] Peer ${name} (${clientInfo.ip}:${clientInfo.port}) unreachable. Removing from clients.`);
                failedPeers.push(name);
            }
        }
    
        // Remove failed peers
        for (const peerName of failedPeers) {
            delete this.clients[peerName];
        }
        await this.writeJsonFile("./data.json", data);
    }
    
    async get(key){
        let data = await this.readJsonFile("./data.json")
        return data[key]
    }

    async setter(args, callback){
        const updateRequest = args[0]
        const updatePayload = updateRequest.payload
        const key = updatePayload.updatedKey
        console.log("[SETTER]",key)
        const value = updatePayload.updatedValue
        console.log("[SETTER]",value)
        let data = await this.readJsonFile("./data.json")
        data[key] = value
        await this.writeJsonFile("./data.json",data)
        callback(null, {
            message:"UPDATEACK",
            payload:{}
        })
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
        }
    }

    async writeJsonFile(path,data){
        await fs.writeFile(path,JSON.stringify(data,null,2))
    }

    async remoteCall(client, method, ...params) {
        return new Promise((resolve, reject) => {
            client.request(method, params, (err, response) => {
                if (err) {
                    reject(err);
                } else if (response.error) {
                    reject(response.error);
                } else {
                    resolve(response.result);
                }
            });
        });
    }

    async discover(peersToDiscover) {
        const discoveryPromises = peersToDiscover
            .filter(peer => !(peer.ip === this.identity.ip && peer.port === this.identity.port))
            .map(async peer => {
                const ip = peer.ip;
                const port = peer.port;
                console.log("Discovering", ip, port);
    
                try {
                    const client = jayson.Client.http({
                        hostname: ip,
                        port: port
                    });
    
                    const response = await this.remoteCall(client, "discover", {
                        message: "DISCOVER",
                        payload: {
                            identity: this.identity
                        }
                    });
    
                    console.log("Discover response", response);
                    const responseIdentity = response.payload.identity;
                    this.clients[responseIdentity.name] = responseIdentity;
                    console.log("this.clients", this.clients);
    
                    const latestData = response.payload.latestData;
                    await this.writeJsonFile("./data.json", latestData);
                    console.log("Latest data", latestData);
                } catch (error) {
                    console.log(`Discovery failed at ${ip}:${port} — skipping`);
                }
            });
    
        await Promise.allSettled(discoveryPromises);
    }
    
    // async autoDiscover(subnetMask, port) {
    //     const interfaces = os.networkInterfaces();
    //     const myIp = this.identity.ip;
    
    //     const discoveryTasks = [];
    
    //     for (const iface of Object.values(interfaces)) {
    //         for (const ifaceDetail of iface) {
    //             if (ifaceDetail.family === 'IPv4' && !ifaceDetail.internal) {
    //                 const subnet = ip.subnet(ifaceDetail.address, ifaceDetail.netmask);
    //                 for (
    //                     let current = ip.toLong(subnet.firstAddress);
    //                     current <= ip.toLong(subnet.lastAddress);
    //                     current++
    //                 ) {
    //                     const targetIp = ip.fromLong(current);
    //                     if (targetIp === myIp) continue;

    //                     console.log(targetIp)
    //                     console.log(port)
    //                     discoveryTasks.push((async () => {
    //                         try {
    //                             const client = jayson.Client.http({
    //                                 hostname: targetIp,
    //                                 port: port,
    //                             });
    
    //                             const response = await this.remoteCall(client, "discover", {
    //                                 message: "DISCOVER",
    //                                 payload: {
    //                                     identity: this.identity
    //                                 }
    //                             });
    
    //                             console.log(`[DISCOVER] Found peer at ${targetIp}`);
    //                             const responseIdentity = response.payload.identity;
    //                             this.clients[responseIdentity.name] = responseIdentity;
    
    //                             const latestData = response.payload.latestData;
    //                             await this.writeJsonFile("./data.json", latestData);
    //                         } catch (error) {
    //                             // Silent fail is okay — likely no peer on that IP
    //                             console.log("could not connect")
    //                         }
    //                     })());
    //                 }
    //             }
    //         }
    //     }
    
    //     // Wait for all discovery attempts to complete
    //     await Promise.allSettled(discoveryTasks);
    // }

    async autoDiscover(subnetMask, port) {
        console.log("starting peer discovery")
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
    
                        // console.log(`Probing ${targetIp}:${port}`);
                        discoveryTasks.push((async () => {
                            try {
                                const client = jayson.Client.http({
                                    hostname: targetIp,
                                    port: port,
                                });
    
                                const response = await this.remoteCall(client, "discover", {
                                    message: "DISCOVER",
                                    payload: {
                                        identity: this.identity
                                    }
                                });
    
                                console.log(`[DISCOVER] Found peer at ${targetIp}`);
                                const responseIdentity = response.payload.identity;
                                this.clients[responseIdentity.name] = responseIdentity;
    
                                const latestData = response.payload.latestData;
                                await this.writeJsonFile("./data.json", latestData);
                            } catch (error) {
                                // console.log(`[SKIP] ${targetIp} unreachable`);
                            }
                        })());
                    }
                }
            }
        }
    
        await Promise.allSettled(discoveryTasks);
        console.log("PEER DISCOVERY COMPLETE")
    }
    
    
    async discoverAck(args, callback) {
        const request = args[0]
        console.log("discover request",request)
        const requestPayloadIdentity = request.payload.identity
        this.clients[requestPayloadIdentity.name] = requestPayloadIdentity 
        console.log("this.clients",this.clients)

        const latestData = await this.readJsonFile("./data.json")
        callback(null, {
            message: "DISCOVERACK",
            payload: {
                latestData:latestData,
                identity:this.identity
            }
        });
    }
}

const peer = new Peer();
await peer.initialize();
export default peer

// setTimeout(async()=>{
//     await peer.set("name","robert")
//     // await peer.set("name","the two")
//     console.log("getting...",await peer.get("name"))
// },5000)

// await peer.set("counter",0)

// setInterval(async()=>{
//     console.log("incrementing counter")
//     await peer.set("counter",(await peer.get("counter"))+1)
//     // await peer.set("name","the two")
//     // console.log("getting...",await peer.get("name"))
// },1000)