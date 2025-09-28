// server.js
const http = require('http');
const url = require('url');
const DateUtils = require('./modules/utils');
const messages = require('./lang/en/en');

class APIServer {
    constructor(port = 3000) {
        this.port = port;
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const query = parsedUrl.query;

        // Set headers for CORS and content type
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');

        // Route handling
        if (pathname === '/COMP4537/labs/3/getDate/') {
            this.handleGetDate(req, res, query);
        } else {
            this.send404(res);
        }
    }

    handleGetDate(req, res, query) {
        try {
            const name = query.name || 'Guest';
            const currentDate = DateUtils.getDate();
            const greeting = messages.greeting.replace('%1', name);
            
            // Create response with BLUE styling (server-side)
            const response = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Server Date API</title>
                </head>
                <body>
                    <p style="color: blue; font-size: 16px;">
                        ${greeting} ${currentDate}
                    </p>
                </body>
                </html>
            `;

            res.writeHead(200);
            res.end(response);
        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    send404(res) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end('<h1>404 - Not Found</h1>');
    }

    sendError(res, errorMessage) {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end(`<h1>500 - Server Error</h1><p>${errorMessage}</p>`);
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 Server running on http://localhost:${this.port}`);
            console.log(`📝 Test URL: http://localhost:${this.port}/COMP4537/labs/3/getDate/?name=YourName`);
        });
    }
}

// Start the server
const server = new APIServer(3000);
server.start();