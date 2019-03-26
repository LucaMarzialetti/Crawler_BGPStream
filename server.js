//server.js
const express = require('express'),
      cors = require('cors'),
      path = require('path'),
      server = express();

// //allow OPTIONS on all resources
// server.use(function (req, res, next) {

//     // Website you wish to allow to connect
//     res.setHeader('Access-Control-Allow-Origin', 'https://bgpstream.com');

//     // Request methods you wish to allow
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

//     // Request headers you wish to allow
//     res.setHeader('Access-Control-Allow-Headers', '*');

//     // Set to true if you need the website to include cookies in the requests sent
//     // to the API (e.g. in case you use sessions)
//     res.setHeader('Access-Control-Allow-Credentials', true);

//     // Pass to next layer of middleware
	
// 	next();
// });

//server.use(cors());

// first parameter is the mount point, second is the location in the file system
// Express Middleware for serving static files
server.use(express.static(path.join(__dirname, 'public')));

//Adding routes
server.get('/', (request,response,next)=>{
	response.sendFile("index.html");
});

//Express error handling middleware
server.use((request,response)=>{
   response.type('text/plain');
   response.status(505);
   response.send('Error page');
});

//setting the port.
server.set('port', process.env.PORT || 3000);

//Binding to localhost://3000
server.listen(3000,()=>{
 console.log('Express server started at port 3000');
});