// server.js - Complete version with Parts B and C
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
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

        console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);

        // Route handling
        if (pathname === '/COMP4537/labs/3/getDate/') {
            this.handleGetDate(req, res, query);
        } else if (pathname === '/COMP4537/labs/3/writeFile/') {
            this.handleWriteFile(req, res, query);
        } else if (pathname.startsWith('/COMP4537/labs/3/readFile/')) {
            this.handleReadFile(req, res, pathname);
        } else {
            this.send404(res, pathname);
        }
    }

    // Part B - Get Date endpoint
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
                    <p style="color: blue; font-size: 16px; font-family: Arial, sans-serif;">
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

    // Part C.1 - Write File endpoint
    handleWriteFile(req, res, query) {
        try {
            const text = query.text || '';
            
            if (!text) {
                res.writeHead(400, {'Content-Type': 'text/html'});
                res.end('<h1>400 - Bad Request</h1><p>No text parameter provided</p>');
                return;
            }

            const filePath = path.join(__dirname, 'file.txt');

            // Append text to file (create if doesn't exist)
            fs.appendFile(filePath, text + '\n', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    this.sendError(res, `Error writing to file: ${err.message}`);
                    return;
                }
                
                const response = `
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

                res.writeHead(200);
                res.end(response);
            });

        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    // Part C.2 - Read File endpoint
    handleReadFile(req, res, pathname) {
        try {
            // Extract filename from path: /COMP4537/labs/3/readFile/file.txt -> file.txt
            const pathParts = pathname.split('/');
            const filename = pathParts[pathParts.length - 1];
            
            if (!filename) {
                res.writeHead(400, {'Content-Type': 'text/html'});
                res.end('<h1>400 - Bad Request</h1><p>No filename provided</p>');
                return;
            }

            const filePath = path.join(__dirname, filename);

            // Read file content
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    
                    if (err.code === 'ENOENT') {
                        res.writeHead(404, {'Content-Type': 'text/html'});
                        res.end(`
                            <h1>404 - File Not Found</h1>
                            <p>The file "<strong>${this.escapeHtml(filename)}</strong>" does not exist.</p>
                            <p>Make sure you have written to the file first using the writeFile endpoint.</p>
                        `);
                    } else {
                        this.sendError(res, `Error reading file ${filename}: ${err.message}`);
                    }
                    return;
                }
                
                // Return file content as plain text (displayed in browser, not downloaded)
                const response = `
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

                res.writeHead(200);
                res.end(response);
            });

        } catch (error) {
            this.sendError(res, error.message);
        }
    }

    // Helper method to escape HTML characters
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    send404(res, pathname) {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end(`
            <h1>404 - Not Found</h1>
            <p>The requested path "<strong>${this.escapeHtml(pathname)}</strong>" was not found.</p>
            <h3>Available endpoints:</h3>
            <ul>
                <li><a href="/COMP4537/labs/3/getDate/?name=Joey">/COMP4537/labs/3/getDate/?name=Joey</a></li>
                <li>/COMP4537/labs/3/writeFile/?text=YourText</li>
                <li>/COMP4537/labs/3/readFile/file.txt</li>
            </ul>
        `);
    }

    sendError(res, errorMessage) {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end(`
            <h1>500 - Server Error</h1>
            <p>${this.escapeHtml(errorMessage)}</p>
            <p><em>Error occurred at: ${new Date().toISOString()}</em></p>
        `);
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