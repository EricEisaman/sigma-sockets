declare module 'uwebsockets.js' {
  export interface WebSocket<T = any> {
    send(message: ArrayBuffer | Uint8Array, opCode?: OpCode): boolean;
    close(code?: number, shortMessage?: ArrayBuffer): void;
    getBufferedAmount(): number;
    getRemoteAddress(): ArrayBuffer;
    getRemoteAddressAsText(): string;
    getUserData(): T;
  }

  export enum OpCode {
    TEXT = 1,
    BINARY = 2,
    CLOSE = 8,
    PING = 9,
    PONG = 10
  }

  export interface WebSocketBehavior<T = any> {
    compression?: number;
    maxCompressedSize?: number;
    maxBackpressure?: number;
    upgrade?: (res: any, req: any, context: any) => void;
    message?: (ws: WebSocket<T>, message: ArrayBuffer, opCode: OpCode) => void;
    drain?: (ws: WebSocket<T>) => void;
    close?: (ws: WebSocket<T>, code: number, message: ArrayBuffer) => void;
    ping?: (ws: WebSocket<T>, message: ArrayBuffer) => void;
    pong?: (ws: WebSocket<T>, message: ArrayBuffer) => void;
    open?: (ws: WebSocket<T>) => void;
  }

  export interface App {
    ws(pattern: string, behavior: WebSocketBehavior): App;
    get(pattern: string, handler: (res: any, req: any) => void): App;
    post(pattern: string, handler: (res: any, req: any) => void): App;
    listen(port: number, cb: (token: any) => void): App;
    listen(host: string, port: number, cb: (token: any) => void): App;
  }

  export function App(options?: any): App;
  export function us_listen_socket_close(listenSocket: any): void;
}

