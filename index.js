const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;


/******************************************************************************
 * This is the basic handler for a request. Set the request on('data', ...) and
 * on('end)' callbacks and exit. The on('end') callback has the data of the
 * request in its closure so it can access it when the request is done.
 * @param req : the request object
 * @param res : the response object
 ******************************************************************************/
var handleRequest = function(req, res)
{
    const parsedUrl = url.parse(req.url, true);
    const path = '/' + parsedUrl.pathname.replace(/^\/+|\/+$/g, '');

    // obtaining the payload
    const decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer += decoder.write(data);
    });

    /*
     * Once the request has finished being received, assemble its data and pass
     * it to the appropriate handler and return the response. The data is from
     * the closure of the callback.
     */
    req.on('end', function(){
        buffer += decoder.end();

        const data = {
            'path' : path,
            'method' : req.method,
            'headers' : req.headers,
            'query' : parsedUrl.query,
            'payload': (buffer != '' ? JSON.parse(buffer) : {})
        };

        console.log("path:", path);
        requestHandler = (path in router) ? router[path] : handlers.notFound;

        handlerEndCallback = function(statusCode, payload)
        {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(JSON.stringify( payload));
        };
        requestHandler(data, handlerEndCallback);
    });
};

/*******************************************************************************
 * Start an http server and an https server with the same handle request callback
 *******************************************************************************/
var startServers = function()
{
    const httpServer = http.createServer(handleRequest);
    httpServer.listen(3000, function(){
        console.log("the https server is listening on port 3000");
    });

    // const httpsServerOptions = {
    //     'key': fs.readFileSync(config.https.keyFile),
    //     'cert': fs.readFileSync(config.https.certFile),

    // };
    // const httpsServer = https.createServer(httpsServerOptions, handleRequest);
    // httpsServer.listen(443, function(){
    //     console.log("the https server is listening on port 443");
    // });
};

/*******************************************************************************
 * Map between paths and request handlers for paths
 ******************************************************************************/
handlers = {};

/*******************************************************************************
 * @param data : The data from the request
 * @param endCallback : function to call when the handling is finished
 ******************************************************************************/
handlers.ping = function(data, endCallback)
{
    console.log('handler for path \'\ping\' called with data:', data);
    endCallback(200, {'name' : 'ping handler for blogserver'});
};

handlers.list = function(data, callback)
{
    fs.readdir("~/Dropbox/blog", function(err, items){
        if(err){
            callback(500, {'Error': "Could not read blog directory on server"});
            return;
        }
        // TODO Filter out items that don't end with '.html'
        // htmlFiles = ...;
        callback(200, {'Files': htmlFiles});
    });
};

handlers.file = function(data, callback)
{
    // TODO Check filename
    filename = data.query['file'];
    if(filename.indexOf('/') != -1){
        console.log("invalid filename");
        callback(400, {'Error': "Invalid filename"});
        return;
    }

    filename = path.join("/Users/pcarphin/Dropbox/blog", filename);

    fs.readFile(filename, 'utf8', function(err, data){
        if(err){
            console.log('error reading file ', filename);
            callback(400, {'Error': 'Could not read file'});
            return;
        }
        callback(200, {"filecontent": data});
    });
};

const router = {
    '/ping': handlers.ping,
    '/list': handlers.list,
    '/file': handlers.file,
};

startServers();
