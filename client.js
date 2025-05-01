import jayson from 'jayson';
import fs from 'fs';

// Create a new JSON-RPC client to interact with the server
const client = jayson.Client.http('http://192.168.1.6:4000');

// Wrap the client request in a promise to use async/await
const requestAsync = (method, params) => {
  return new Promise((resolve, reject) => {
    client.request(method, params, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response.result);
      }
    });
  });
};

// Async function to make the requests
const callRpcMethods = async () => {
  try {
    const addResult = await requestAsync('add', [5, 3]);
    console.log('Result of add:', addResult);

    const multiplyResult = await requestAsync('multiply', [4, 7]);
    console.log('Result of multiply:', multiplyResult);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Call the async function
callRpcMethods();
