// // creating server
// const http = require('http');
// const open = require('open').default;
// // define host and port host as local host
// const host = 'localhost';
// // 8080 used as default port for some servers
// const port = 8080;

const { application } = require("express");

// const requestListener = function(req,res){
//     // sets http status code
//     res.writeHead(200);
//     res.end("My First Server !");
// };

// const server = http.createServer(requestListener);
// server.listen(port,host,()=>{
//     console.log(`Server is running on http:// ${host}:${port}`);
//     open(`http://${host}:${port}`);

// });

// const fs = require('fs');
// fs.readFile("input.txt", function(err,data){
//     if(err){
//         return console.error(err);
//     }
//     console.log("Asynchronous read: " +data.toString());
// })

// // fs.open(Path2D,flags,module,callback)

// const fs = require("fs");
// console.log("Opening file");
// fs.open("input.txt","r+",function(err,fd){
//     if(err){
//         return console.log(err);
//     }
//     console.log("file has been open successfully");
// })

// // fs.read(fd,Buffer,offset,length,Position,callback)
// // read file contents
// const fs = require('fs');
// const buf = new Buffer(1024);
// console.log('opening an existing file');
// fs.open("input.txt","r+",function(err,fd){
//     if(err){
//         return console.error(err);
//     }
//     console.log("File opened Successfully");
//     console.log("reading the file");
//     fs.read(fd,buf,0,buf.length,0,function(err,bytes){
//         if(err){
//             console.error(err);
//         }
//         console.log(bytes + "bytes read");

//         if(byte >0){
//             console.log(buf.slice(0,bytes).toString());
//         }
//     })
// })

// // fs.writeFile(Path,Data,options,callbacks)
// // write in to a file

// const fs = require('fs');
// console.log("writing into an existing file");
// fs.writeFile("input.txt","Hello World",function(err){
//         if(err){
//             console.error(err);
//         }
//         console.log("Data written Successfully");   
//         console.log("Let's read the new data from file");   

//         fs.readFile("input.txt",function(err,data){
//     if(err){
//         return console.error(err);
//     }
//     console.log("Asynchronous read: " +data.toString());
//     })
// })

// // appending a file

// const fs = require('fs');
// const data = "node.js";
// fs.appendFileSync("input.txt",data,"utf8");
//         console.log("Data has been appended to the file successfully");

// // closing a file

// const fs = require('fs');
// fs.close(fd, function(err){
//     if(err){
//         console.log(err);
//     }
//     console.log("file was closed successfully")
// })

// const fs = require("fs");
// console.log("delete a file");
// fs.unlink("input.txt",function(err){
//     if(err){
//         return console.log(err);
//     }
//     console.log("file was deleted successfully");
// })

// middleware

// const jwt = require('jsonwebtoken');
// require('dotenv').config();
// const JWT_SECRET = process.env.JWT_SECRET;

// module.exports = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     console.log("Auth header:", authHeader);

//     if (!authHeader) return res.status(401).json({ message: 'No token provided' });

//     const token = authHeader.split(' ')[1];
//     console.log("Token:", token);
 
//     if (!token) return res.status(401).json({ message: 'Invalid token' });

//     try {
//         const decoded = jwt.verify(token, JWT_SECRET);
//         console.log("Decoded token:", decoded);
//         req.user = decoded; // attach decoded info to request
//         next();
//     } catch (err) {
//         console.error("JWT ERROR:", err);
//         res.status(401).json({ message: 'Unauthorized' });
//     }
// };

// (req,res,next) =>{
//     // body of the middleware
//     next();
// }

// const express = require('express');
// const app = express();
// const port = process.env.port || 3000; 
// // const port = 3000
// app.get('/',(req,resss,next)=>{
//     console.log("Hello, world!");
//     res.send("Hello, world!");
//     next();
// })
// app.listen(port,()=>{
//     console.log(`listening on ${port}`);
// })


// const authMiddleware = async(req,res,next)=>{
//     try{
//         ... do some tuff
//         next();
//     }
//     catch(err){
//         next(err);
//     }
// }
// const handler = (req,res) => {
//     ... handle the request
// }
// application.use('path',authMiddleware,handler);

const express = require('express');
const app = express();
// app.get('/',(req,res)=>{
//     res.send("Hello, world123!");
// });
// app.get('/user',(req,res)=>{
//     res.send("your are using user route");
// });
// app.listen(3500, ()=>{
//     console.log("server is listening on 3500")
// })
app.get('/users/:userId',(req,res)=>{
    const userId = req.params.userId;
    res.send(`user details for  the ID $(userId)`);
})
        