import { Application } from 'express';
import { Server as SocketServer } from 'socket.io';
import 'express-async-errors';
declare const app: Application;
declare const io: SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, io };
//# sourceMappingURL=server.d.ts.map