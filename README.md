#HarmonyDB- A Lightweight Secure Distributed Key-Value Store
![Screenshot 2025-05-04 175403](https://github.com/user-attachments/assets/986cdf5d-1a0b-43bc-919d-4d19243c862c)

##configure a peer- config.json

```json
{
    "autoDiscoverPeers":false,
    "autoDiscoverPort":6000,
    "autoDiscoverSubnetMask":"255.255.255.0",
    "dbServerPort":4000,
    "identity":{
        "name":"peerx",
        "ip":"172.29.193.59",
        "port":5000
    },
    "peersToDiscover":[{
        "name":"peerx",
        "ip":"172.29.193.59",
        "port":5000
    },{
        "name":"peery",
        "ip":"172.29.193.59",
        "port":5001
    },{
        "name":"peerz",
        "ip":"172.29.95.173",
        "port":5002
    }]
}
```
##start a peer

```bash
node server.js
```
###wait for "Express server running on http://localhost:<PORT>"

##Access the dashboard- .\frontend\index.html

![image](https://github.com/user-attachments/assets/4efef37a-81de-46e6-bcbe-7aef8594605f)

![image](https://github.com/user-attachments/assets/61166b5b-ced4-4ca6-8e74-05a59f47a6d0)

![image](https://github.com/user-attachments/assets/6f08c862-6cd7-493a-bb9a-db64dc32b3c2)

![image](https://github.com/user-attachments/assets/ebfb5a00-e17f-40d2-a12e-00007d317492)

![image](https://github.com/user-attachments/assets/1289675b-2a1e-4a97-bd07-b45867ef6ab1)

