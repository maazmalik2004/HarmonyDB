import jayson from 'jayson';

// Create a new JSON-RPC server
const server = jayson.server({
  // Define a method that the client can call
  add: function (args, callback) {
    const result = args[0] + args[1];
    callback(null, result);  // Return the result
  },
  multiply: function (args, callback) {
    const result = args[0] * args[1];
    callback(null, result);  // Return the result
  }
});

// Listen on a port
server.http().listen(5000, () => {
  console.log('JSON-RPC server is running on port 5000');
});
