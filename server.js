// Enhanced OOP version with multiple classes

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const DateUtils = require('./modules/utils');
const messages = require('./lang/en/en');

// Base Response Handler Class
class ResponseHandler {
    constructor(res) {
        this.res = res;
    }

    setHeaders() {
        this.res.setHeader('Access-Control-Allow-Origin', '*');
        this.res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    sendResponse(statusCode, content) {
        this.res.writeHead(statusCode);
        this.res.end(content);
    }

    sendError(errorMessage, statusCode = 500) {
        const content = `
            <h1>${statusCode} - Server Error</h1>
            <p>${this.escapeHtml(errorMessage)}</p>
            <p><em>Error occurred at: ${new Date().toISOString()}</em></p>
        `;
        this.sendResponse(statusCode, content);
    }
}

// Date Endpoint Handler
class DateHandler extends ResponseHandler {
    handle(query) {
        try {
            const name = query.name || 'Guest';
            const currentDate = DateUtils.getDate();
            const greeting = messages.greeting.replace('%1', name);
            
            const content = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Server Date API</title>
                </head>
                <body>
                    <p style="color: blue; font-size: 16px; font-family: Arial, sans-serif;">
                        ${greeting} ${currentDate}
                    </p>
                </body>
                </html>
            `;

            this.sendResponse(200, content);
        } catch (error) {
            this.sendError(error.message);
        }
    }
}

// File Operations Class
class FileManager {
    constructor(baseDir = __dirname) {
        this.baseDir = baseDir;
    }

    async writeFile(filename, text) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(this.baseDir, filename);
            fs.appendFile(filePath, text + '\n', (err) => {
                if (err) reject(err);
                else resolve(filePath);
            });
        });
    }

    async readFile(filename) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(this.baseDir, filename);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }
}

// Write File Endpoint Handler
class WriteFileHandler extends ResponseHandler {
    constructor(res, fileManager) {
        super(res);
        this.fileManager = fileManager;
    }

    async handle(query) {
        try {
            const text = query.text || '';
            
            if (!text) {
                this.sendError('No text parameter provided', 400);
                return;
            }

            await this.fileManager.writeFile('file.txt', text);
                
            const content = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>File Write Success</title>
                </head>
                <body>
                    <h1>✅ Success!</h1>
                    <p>Text "<strong>${this.escapeHtml(text)}</strong>" has been appended to file.txt</p>
                    <p><em>Timestamp: ${new Date().toISOString()}</em></p>
                </body>
                </html>
            `;

            this.sendResponse(200, content);

        } catch (error) {
            this.sendError(`Error writing to file: ${error.message}`);
        }
    }
}

// Read File Endpoint Handler  
class ReadFileHandler extends ResponseHandler {
    constructor(res, fileManager) {
        super(res);
        this.fileManager = fileManager;
    }

    async handle(filename) {
        try {
            if (!filename) {
                this.sendError('No filename provided', 400);
                return;
            }

            const data = await this.fileManager.readFile(filename);
                
            const content = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>File Content: ${filename}</title>
                    <style>
                        body { font-family: monospace; padding: 20px; }
                        .file-content { 
                            background-color: #f5f5f5; 
                            padding: 15px; 
                            border: 1px solid #ddd; 
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }
                    </style>
                </head>
                <body>
                    <h1>📄 Contents of: ${this.escapeHtml(filename)}</h1>
                    <div class="file-content">${this.escapeHtml(data)}</div>
                    <hr>
                    <p><em>File read at: ${new Date().toISOString()}</em></p>
                </body>
                </html>
            `;

            this.sendResponse(200, content);

        } catch (error) {
            if (error.code === 'ENOENT') {
                const content = `
                    <h1>404 - File Not Found</h1>
                    <p>The file "<strong>${this.escapeHtml(filename)}</strong>" does not exist.</p>
                    <p>Make sure you have written to the file first using the writeFile endpoint.</p>
                `;
                this.sendResponse(404, content);
            } else {
                this.sendError(`Error reading file ${filename}: ${error.message}`);
            }
        }
    }
}

// Router Class to handle URL routing
class Router {
    constructor() {
        this.routes = new Map();
    }

    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    route(pathname, req, res, query) {
        const fileManager = new FileManager();

        if (pathname === '/COMP4537/labs/3/getDate/') {
            const handler = new DateHandler(res);
            handler.setHeaders();
            handler.handle(query);
        } else if (pathname === '/COMP4537/labs/3/writeFile/') {
            const handler = new WriteFileHandler(res, fileManager);
            handler.setHeaders();
            handler.handle(query);
        } else if (pathname.startsWith('/COMP4537/labs/3/readFile/')) {
            const pathParts = pathname.split('/');
            const filename = pathParts[pathParts.length - 1];
            const handler = new ReadFileHandler(res, fileManager);
            handler.setHeaders();
            handler.handle(filename);
        } else {
            this.send404(res, pathname);
        }
    }

    send404(res, pathname) {
        const handler = new ResponseHandler(res);
        handler.setHeaders();
        const content = `
            <h1>404 - Not Found</h1>
            <p>The requested path "<strong>${handler.escapeHtml(pathname)}</strong>" was not found.</p>
            <h3>Available endpoints:</h3>
            <ul>
                <li><a href="/COMP4537/labs/3/getDate/?name=Joey">/COMP4537/labs/3/getDate/?name=Joey</a></li>
                <li>/COMP4537/labs/3/writeFile/?text=YourText</li>
                <li>/COMP4537/labs/3/readFile/file.txt</li>
            </ul>
        `;
        handler.sendResponse(404, content);
    }
}

// Main API Server Class
class APIServer {
    constructor(port = 3000) {
        this.port = port;
        this.router = new Router();
        this.server = http.createServer(this.handleRequest.bind(this));
    }

    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const query = parsedUrl.query;

        console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);
        
        this.router.route(pathname, req, res, query);
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🚀 Server running on port ${this.port}`);
            console.log(`📝 Test URLs:`);
            console.log(`   - http://localhost:${this.port}/COMP4537/labs/3/getDate/?name=Joey`);
            console.log(`   - http://localhost:${this.port}/COMP4537/labs/3/writeFile/?text=Hello`);
            console.log(`   - http://localhost:${this.port}/COMP4537/labs/3/readFile/file.txt`);
        });
    }
}

// Start the server
const PORT = process.env.PORT || 3000;
const server = new APIServer(PORT);
server.start();