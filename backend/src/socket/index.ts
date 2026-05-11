// Socket.IO - WebSocket with JWT Auth + Rate Limit
import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger, socketLogger } from '../logger';

let io: SocketServer;

// 简单JWT验证（预留）
function verifySocketToken(token: string): { userId?: string; role?: string } | null {
  // TODO: 正式JWT验证
  if (!token) return null;
  return { userId: 'anonymous', role: 'viewer' };
}

export function initializeSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB
  });

  // 连接速率限制（内存）
  const connectionCounts = new Map<string, number>();

  io.use((socket, next) => {
    // 连接频率检查
    const ip = socket.handshake.address;
    const count = connectionCounts.get(ip) || 0;
    if (count > 20) {
      socketLogger.warn({ msg: 'Socket rate limit exceeded', ip });
      return next(new Error('Rate limited'));
    }
    connectionCounts.set(ip, count + 1);

    // Auth验证
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const user = verifySocketToken(token as string);
    if (token && !user) {
      return next(new Error('Authentication failed'));
    }
    (socket as any).user = user;
    next();
  });

  io.on('connection', (socket) => {
    socketLogger.info({ msg: 'Client connected', id: socket.id, ip: socket.handshake.address });

    // 加入仪表盘房间
    socket.join('dashboard');

    // 如果是认证用户，加入个人房间
    const user = (socket as any).user;
    if (user?.userId) {
      socket.join(`user:${user.userId}`);
    }

    socket.on('authenticate', (token: string) => {
      const user = verifySocketToken(token);
      if (user) {
        (socket as any).user = user;
        socket.join(`user:${user.userId}`);
        socket.emit('authenticated', { success: true });
      } else {
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    });

    socket.on('disconnect', (reason) => {
      socketLogger.info({ msg: 'Client disconnected', id: socket.id, reason });
      // 清理连接计数
      const ip = socket.handshake.address;
      const count = connectionCounts.get(ip) || 0;
      if (count > 0) {
        connectionCounts.set(ip, count - 1);
      }
    });
  });

  return io;
}

// 推送新机会
export function emitNewOpportunity(opportunity: any) {
  if (!io) return;
  io.to('dashboard').emit('opportunity:new', opportunity);
}

// 推送高分提醒
export function emitAlert(alert: any) {
  if (!io) return;
  io.to('dashboard').emit('alert:new', alert);
}

// 推送扫描状态更新
export function emitScanUpdate(status: {
  scanId: string;
  status: string;
  progress?: number;
  total?: number;
  new?: number;
}) {
  if (!io) return;
  io.to('dashboard').emit('scan:update', status);
}

// 推送数据刷新
export function emitDataRefresh(type: string) {
  if (!io) return;
  io.to('dashboard').emit('data:refresh', { type, timestamp: new Date().toISOString() });
}

export function getIO(): SocketServer {
  return io;
}
