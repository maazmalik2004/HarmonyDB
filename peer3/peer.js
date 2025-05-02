import jayson from 'jayson';
import fs from 'fs/promises';
import os from 'os';
import ip from 'ip'; // For subnet calculation
class Peer {
    constructor() {
    }

    async initialize() {
        this.identity = await this.readJsonFile("./identity.json")

        this.server = jayson.server({
            discover: async(args, callback) => await this.discoverAck(args, callback),
            set: async(args, callback) => await this.setter(args,callback)
        });

        this.server.http().listen(this.identity.port, () => {
            console.log(`JSON-RPC server is running on port ${this.identity.port}`);
        });

        this.clients = {};

        await this.discover(4000, 4005);
    }

    // async readJsonFile(path){
    //     const data = await fs.readFile(path, 'utf-8');
    //     return JSON.parse(data);
    // }

    async set(key, value){
        let data = await this.readJsonFile("./data.json")
        data[key] = value
        await this.writeJsonFile("./data.json",data)

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
                console.log(error);
            }
        }        
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
        callback(null, true)
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
        await fs.writeFile(path,JSON.stringify(data))
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

    async discover(start, end) {
        for (let port = start; port <= end; port++) {
            if (port === this.identity.port) {
                continue;
            }
            try {
                const client = jayson.Client.http({
                    hostname: this.identity.ip,
                    port: port
                });

                const response = await this.remoteCall(client, "discover", {
                    message: "DISCOVER",
                    payload: {
                        identity:this.identity
                    }
                });

                console.log(response);
                const responsePayloadIdentity = response.payload.identity
                this.clients[responsePayloadIdentity.name] = responsePayloadIdentity 
                console.log(this.clients)
                const latestData = response.payload.latestData
                await this.writeJsonFile("./data.json", latestData)
            } catch (error) {
                console.log(`Port ${port} rejected, moving on`);
            }
        }
    }

    // async discover(prefix="192.168.1",port = 6000) {
    //     const interfaces = os.networkInterfaces();
    //     const myIp = this.identity.ip;

    //     for (const iface of Object.values(interfaces)) {
    //         for (const ifaceDetail of iface) {
    //             if (ifaceDetail.family === 'IPv4' && !ifaceDetail.internal) {
    //                 const subnet = ip.subnet(ifaceDetail.address, ifaceDetail.netmask);
    //                 for (let current = ip.toLong(subnet.firstAddress); current <= ip.toLong(subnet.lastAddress); current++) {
    //                     const targetIp = ip.fromLong(current);
    //                     if (targetIp === myIp) continue;
    //                     console.log(targetIp)
    //                     console.log(port)
    //                     if(!targetIp.startsWith(prefix))continue;
    //                     try {
    //                         const client = jayson.Client.http({
    //                             hostname: targetIp,
    //                             port: port,
    //                         });

    //                         const response = await this.remoteCall(client, "discover", {
    //                             message: "DISCOVER",
    //                             payload: {
    //                                 identity: this.identity
    //                             }
    //                         });

    //                         console.log(`[DISCOVER] Found peer at ${targetIp}`);
    //                         const responseIdentity = response.payload.identity;
    //                         this.clients[responseIdentity.name] = responseIdentity;

    //                         const latestData = response.payload.latestData;
    //                         await this.writeJsonFile("./data.json", latestData);
    //                     } catch (error) {
    //                         // Timeout or peer not running — ignore
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }


    async discoverAck(args, callback) {
        const request = args[0]
        console.log(request)
        const requestPayloadIdentity = request.payload.identity
        console.log(requestPayloadIdentity)
        this.clients[requestPayloadIdentity.name] = requestPayloadIdentity 
        console.log(this.clients)

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

setTimeout(async()=>{
    await peer.set("name","the one")
    await peer.set("name","the two")
    console.log("getting...",await peer.get("meow"))
},5000)