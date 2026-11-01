process.env.NODE_ENV = 'test';

import app from '../src/app.js';
import http from 'http';
import os from 'os';
import path from 'path';
import { db } from '../../../database/db.js';

let testServer = null;
let currentSocket = null;
let activeSuites = 0;

export async function startTestServer() {
  activeSuites++;
  if (testServer) return { app, socketPath: currentSocket, db };

  db.resetToSeed();

  const isWin = process.platform === 'win32';
  const pipeId = `hirelocal-test-${process.pid}-${Date.now()}`;
  currentSocket = isWin ? `\\\\.\\pipe\\${pipeId}` : path.join(os.tmpdir(), `${pipeId}.sock`);

  await new Promise((resolve, reject) => {
    testServer = http.createServer(app);
    testServer.on('error', reject);
    testServer.listen(currentSocket, () => {
      resolve();
    });
  });

  return { app, socketPath: currentSocket, db };
}

export async function stopTestServer() {
  activeSuites = Math.max(0, activeSuites - 1);
  if (activeSuites === 0 && testServer) {
    await new Promise((resolve) => testServer.close(resolve));
    testServer = null;
    currentSocket = null;
  }
}

export async function apiRequest(endpoint, options = {}) {
  if (!testServer || !currentSocket) {
    await startTestServer();
  }

  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'content-type': 'application/json',
    ...(options.headers || {})
  };

  const bodyData = options.body 
    ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
    : undefined;

  if (bodyData) {
    headers['content-length'] = Buffer.byteLength(bodyData);
  }

  return new Promise((resolve, reject) => {
    const req = http.request({
      socketPath: currentSocket,
      path: endpoint.startsWith('/') ? endpoint : `/${endpoint}`,
      method,
      headers
    }, (res) => {
      let rawData = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        let data = null;
        try {
          data = JSON.parse(rawData);
        } catch {
          data = rawData;
        }
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          data
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}
