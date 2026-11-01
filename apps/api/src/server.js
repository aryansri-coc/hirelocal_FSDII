import app from './app.js';
import { config } from './config/env.js';

const PORT = config.port || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 HireLocal API Server running on port ${PORT}`);
  console.log(`💻 Web Frontend: http://localhost:5173`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT IN USE] Port ${PORT} is already occupied by another running instance.`);
    console.error(`💡 Tip: To free port ${PORT} in PowerShell, run:`);
    console.error(`   Get-Process node | Stop-Process -Force\n`);
    process.exit(1);
  }
  throw err;
});

export default server;
