// Monorepo Layout (pnpm workspaces)
// .
// ├─ package.json
// ├─ pnpm-workspace.yaml
// ├─ README.md
// ├─ packages/
// │  └─ db/
// │     ├─ package.json
// │     ├─ prisma/
// │     │  └─ schema.prisma
// │     └─ src/index.ts
// ├─ apps/
// │  ├─ api/              # Express + Socket.IO + JWT + Prisma + Baileys
// │  │  ├─ package.json
// │  │  ├─ tsconfig.json
// │  │  ├─ .env.example
// │  │  ├─ src/
// │  │  │  ├─ index.ts
// │  │  │  ├─ config.ts
// │  │  │  ├─ auth.ts
// │  │  │  ├─ routes.ts
// │  │  │  ├─ socket.ts
// │  │  │  ├─ wa/manager.ts
// │  │  │  ├─ wa/types.ts
// │  │  │  └─ utils/logger.ts
// │  │  └─ wa-auth/       # generated at runtime (ignored by git)
// │  └─ web/              # Vite + React + TypeScript
// │     ├─ package.json
// │     ├─ tsconfig.json
// │     ├─ index.html
// │     └─ src/
// │        ├─ main.tsx
// │        ├─ App.tsx
// │        ├─ api.ts
// │        ├─ store.ts
// │        ├─ pages/
// │        │  ├─ Login.tsx
// │        │  ├─ Register.tsx
// │        │  ├─ Dashboard.tsx
// │        │  └─ Chat.tsx
// │        └─ components/
// │           ├─ QRPanel.tsx
// │           ├─ ChatList.tsx
// │           └─ MessagePane.tsx
// 
// ------------------
// Root: package.json
// ------------------
{
  "name": "wa-monorepo",
  "private": true,
  "packageManager": "pnpm@9.12.0",
  "workspaces": ["packages/*", "apps/*/*", "apps/*"],
  "scripts": {
    "dev": "concurrently -n api,web -c blue,green 'pnpm -F @app/api dev' 'pnpm -F @app/web dev'",
    "build": "pnpm -F @app/api build && pnpm -F @app/web build",
    "prisma:generate": "pnpm -F @pkg/db prisma:generate",
    "prisma:migrate": "pnpm -F @pkg/db migrate"
  },
  "devDependencies": {"concurrently": "^9.0.1"}
}

// ------------------
// pnpm-workspace.yaml
// ------------------
packages:
  - packages/*
  - apps/*
  - apps/*/*

// ------------------
// packages/db/package.json
// ------------------
{
  "name": "@pkg/db",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "prisma:generate": "prisma generate",
    "migrate": "prisma migrate dev --name init --create-only || true && prisma migrate dev",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0"
  },
  "devDependencies": {
    "prisma": "^5.20.0",
    "typescript": "^5.6.3"
  }
}

// ------------------
// packages/db/tsconfig.json
// ------------------
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src", "prisma"]
}

// ------------------
// packages/db/prisma/schema.prisma
// ------------------
// SQLite for easiest local start. Swap to Postgres by changing provider/url.
 datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
 }

 generator client {
  provider = "prisma-client-js"
 }

 model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  Session[]
 }

 model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  label     String?  // ex: "Main phone"
 }

// ------------------
// packages/db/src/index.ts
// ------------------
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();

// ------------------
// apps/api/package.json
// ------------------
{
  "name": "@app/api",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format esm --dts --out-dir dist",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@pkg/db": "workspace:*",
    "@whiskeysockets/baileys": "^6.7.8",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "http-errors": "^2.0.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "qrcode": "^1.5.4",
    "socket.io": "^4.7.5"
  },
  "devDependencies": {
    "tsup": "^8.3.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.3"
  }
}

// ------------------
// apps/api/tsconfig.json
// ------------------
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src"]
}

// ------------------
// apps/api/.env.example
// ------------------
# copy to .env and tweak
PORT=4000
JWT_SECRET=change_me
DATABASE_URL="file:../data.sqlite" # prisma (relative to packages/db)
CORS_ORIGIN=http://localhost:5173

// ------------------
// apps/api/src/config.ts
// ------------------
import 'dotenv/config';
export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'devsecret',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

// ------------------
// apps/api/src/utils/logger.ts
// ------------------
export const log = (...args: any[]) => console.log('[api]', ...args);

// ------------------
// apps/api/src/auth.ts
// ------------------
import { Router } from 'express';
import { prisma } from '@pkg/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ error: 'email & password required' });
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({ data: { email, password: hashed } });
    return res.json({ id: user.id, email: user.email });
  } catch (e: any) {
    return res.status(400).json({ error: 'email exists?' });
  }
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ uid: user.id }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token });
});

export function requireAuth(req: any, res: any, next: any) {
  const hdr = req.headers.authorization?.toString() || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    const dec = jwt.verify(token, config.jwtSecret) as any;
    (req as any).uid = dec.uid;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// ------------------
// apps/api/src/wa/types.ts
// ------------------
export type QRPayload = { qr: string };
export type OutboundMsg = { to: string; text: string };

// ------------------
// apps/api/src/wa/manager.ts
// ------------------
import makeWASocket, { useMultiFileAuthState, Browsers, WASocket, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'node:path';
import fs from 'node:fs/promises';
import { Server } from 'socket.io';
import { log } from '../utils/logger';

const ROOT = path.resolve(process.cwd(), 'apps/api/wa-auth');
await fs.mkdir(ROOT, { recursive: true });

export class WARegistry {
  private sockets: Map<string, WASocket> = new Map();
  constructor(private io: Server) {}

  async startForUser(uid: string) {
    const dir = path.join(ROOT, `user-${uid}`);
    const { state, saveCreds } = await useMultiFileAuthState(dir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.macOS('Chrome'),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (u) => {
      const { connection, lastDisconnect, qr } = u as any;
      if (qr) {
        // tell this user's room the QR
        this.io.to(uid).emit('wa.qr', { qr });
      }
      if (connection === 'open') {
        log(`WA connected for ${uid}`);
        this.io.to(uid).emit('wa.ready');
      }
      if (connection === 'close') {
        const reason = new Boom((lastDisconnect as any)?.error)?.output?.statusCode;
        log('WA closed', reason);
        if (reason !== DisconnectReason.loggedOut) {
          // auto-reconnect
          setTimeout(() => this.startForUser(uid), 1_000);
        }
      }
    });

    sock.ev.on('messages.upsert', (m) => {
      const msg = m.messages?.[0];
      if (!msg || !msg.key.remoteJid) return;
      const from = msg.key.remoteJid;
      const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      // forward to UI
      this.io.to(uid).emit('wa.message', { from, text, ts: Date.now() });
    });

    this.sockets.set(uid, sock);
    return sock;
  }

  async send(uid: string, to: string, text: string) {
    const sock = this.sockets.get(uid) || (await this.startForUser(uid));
    await sock.sendMessage(to, { text });
  }
}

// ------------------
// apps/api/src/socket.ts
// ------------------
import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from './config';
import { WARegistry } from './wa/manager';

export function initIO(httpServer: HTTPServer) {
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  const registry = new WARegistry(io);

  io.use((socket, next) => {
    const token = (socket.handshake.auth as any)?.token;
    if (!token) return next(new Error('missing token'));
    try {
      const dec = jwt.verify(token, config.jwtSecret) as any;
      (socket as any).uid = dec.uid;
      next();
    } catch {
      next(new Error('invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const uid = (socket as any).uid as string;
    socket.join(uid);
    // ensure WA session is started; QR will be emitted if needed
    await registry.startForUser(uid);

    socket.on('wa.send', async (payload: { to: string; text: string }) => {
      await registry.send(uid, payload.to, payload.text);
    });
  });

  return io;
}

// ------------------
// apps/api/src/routes.ts
// ------------------
import { Router } from 'express';
import { requireAuth } from './auth';

export const apiRouter = Router();

apiRouter.get('/me', requireAuth, async (req: any, res) => {
  return res.json({ uid: req.uid });
});

// ------------------
// apps/api/src/index.ts
// ------------------
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { config } from './config';
import { authRouter } from './auth';
import { apiRouter } from './routes';
import { initIO } from './socket';

const app = express();
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (_req, res) => res.json({ ok: true }));
app.use('/auth', authRouter);
app.use('/api', apiRouter);

const server = http.createServer(app);
initIO(server);

server.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

// ------------------
// apps/web/package.json
// ------------------
{
  "name": "@app/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "jwt-decode": "^4.0.0",
    "qrcode": "^1.5.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.27.0",
    "socket.io-client": "^4.7.5"
  },
  "devDependencies": {
    "@types/jwt-decode": "^3.1.0",
    "@types/node": "^20.12.12",
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.10"
  }
}

// ------------------
// apps/web/tsconfig.json
// ------------------
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": "."
  },
  "include": ["src"]
}

// ------------------
// apps/web/vite.config.ts
// ------------------
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });

// ------------------
// apps/web/index.html
// ------------------
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WA Desk</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

// ------------------
// apps/web/src/api.ts
// ------------------
import axios from 'axios';
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const api = axios.create({ baseURL: API_URL });

// ------------------
// apps/web/src/store.ts
// ------------------
export const tokenStore = {
  get token() { return localStorage.getItem('token'); },
  set token(v: string | null) { v ? localStorage.setItem('token', v) : localStorage.removeItem('token'); }
};

// ------------------
// apps/web/src/main.tsx
// ------------------
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}> 
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

// ------------------
// apps/web/src/App.tsx
// ------------------
import { Outlet, useNavigate } from 'react-router-dom';
import { tokenStore } from './store';
export default function App(){
  const nav = useNavigate();
  return (
    <div style={{fontFamily:'system-ui',maxWidth:920,margin:'0 auto',padding:24}}>
      <header style={{display:'flex',gap:16,alignItems:'center'}}>
        <h1>WA Desk</h1>
        <nav style={{marginLeft:'auto',display:'flex',gap:12}}>
          <button onClick={()=>nav('/dashboard')}>Dashboard</button>
          <button onClick={()=>nav('/chat')}>Chat</button>
          {tokenStore.token ? (
            <button onClick={()=>{tokenStore.token=null; nav('/login');}}>Logout</button>
          ):(
            <button onClick={()=>nav('/login')}>Login</button>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

// ------------------
// apps/web/src/pages/Register.tsx
// ------------------
import { useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Register(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');
  const nav = useNavigate();
  return (
    <form onSubmit={async e=>{e.preventDefault();
      try{ await api.post('/auth/register',{email,password}); setMsg('Registered. Go login.'); setTimeout(()=>nav('/login'),800);}catch(e:any){ setMsg(e.response?.data?.error||'err'); }
    }}>
      <h2>Create account</h2>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit">Register</button>
      <div>{msg}</div>
    </form>
  );
}

// ------------------
// apps/web/src/pages/Login.tsx
// ------------------
import { useState } from 'react';
import { api } from '../api';
import { tokenStore } from '../store';
import { useNavigate } from 'react-router-dom';

export default function Login(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [msg,setMsg]=useState('');
  const nav = useNavigate();
  return (
    <form onSubmit={async e=>{e.preventDefault();
      try{ const r = await api.post('/auth/login',{email,password}); tokenStore.token = r.data.token; nav('/dashboard'); }
      catch(e:any){ setMsg(e.response?.data?.error||'err'); }
    }}>
      <h2>Login</h2>
      <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="submit">Login</button>
      <div>{msg}</div>
    </form>
  );
}

// ------------------
// apps/web/src/components/QRPanel.tsx
// ------------------
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import QRCode from 'qrcode';
import { API_URL } from '../api';
import { tokenStore } from '../store';

export default function QRPanel(){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status,setStatus]=useState<'waiting'|'ready'|'scanning'>('waiting');

  useEffect(()=>{
    let sock: Socket | null = null;
    const token = tokenStore.token!;
    sock = io(API_URL, { auth: { token } });

    sock.on('connect', ()=> setStatus('scanning'));
    sock.on('wa.qr', async (payload: {qr:string})=>{
      setStatus('scanning');
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, payload.qr, { width: 256 });
      }
    });
    sock.on('wa.ready', ()=> setStatus('ready'));

    return ()=>{ sock?.close(); };
  },[]);

  return (
    <div>
      <h3>Link your WhatsApp</h3>
      <p>Status: {status}</p>
      {status!== 'ready' && <canvas ref={canvasRef} />}
      {status==='ready' && <p>Connected ✅</p>}
    </div>
  );
}

// ------------------
// apps/web/src/pages/Dashboard.tsx
// ------------------
import QRPanel from '../components/QRPanel';
export default function Dashboard(){
  return (
    <div>
      <QRPanel />
      <p>Once connected, go to Chat to receive/send messages.</p>
    </div>
  );
}

// ------------------
// apps/web/src/components/ChatList.tsx
// ------------------
export function ChatList({ chats, onPick }:{ chats: string[]; onPick:(jid:string)=>void }){
  return (
    <div style={{borderRight:'1px solid #ddd', paddingRight:12}}>
      <h3>Recent JIDs</h3>
      <ul>
        {chats.map(c=> (
          <li key={c}><button onClick={()=>onPick(c)}>{c}</button></li>
        ))}
      </ul>
    </div>
  );
}

// ------------------
// apps/web/src/components/MessagePane.tsx
// ------------------
export function MessagePane({ jid, messages, onSend }:{ jid:string|null; messages:{from:string;text:string;ts:number}[]; onSend:(t:string)=>void }){
  if(!jid) return <div style={{padding:12}}>Pick a chat</div>;
  let input = '';
  return (
    <div style={{flex:1, padding:12}}>
      <h3>Chat with {jid}</h3>
      <div style={{height:300,overflow:'auto',border:'1px solid #eee',padding:8}}>
        {messages.map((m,i)=> (
          <div key={i} style={{margin:'6px 0'}}>
            <b>{m.from}:</b> {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={e=>{ e.preventDefault(); const t = (e.currentTarget.elements.namedItem('t') as HTMLInputElement).value; onSend(t); (e.currentTarget.elements.namedItem('t') as HTMLInputElement).value=''; }}>
        <input name="t" placeholder="Type a message" style={{width:'80%'}} />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

// ------------------
// apps/web/src/pages/Chat.tsx
// ------------------
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../api';
import { tokenStore } from '../store';
import { ChatList } from '../components/ChatList';
import { MessagePane } from '../components/MessagePane';

export default function Chat(){
  const [sock,setSock] = useState<Socket|null>(null);
  const [messages,setMessages] = useState<{from:string;text:string;ts:number}[]>([]);
  const [chats,setChats] = useState<string[]>([]);
  const [active,setActive] = useState<string|null>(null);

  useEffect(()=>{
    const s = io(API_URL, { auth: { token: tokenStore.token } });
    s.on('wa.message', (m:any)=>{
      setMessages(prev=>[...prev, m]);
      if (!chats.includes(m.from)) setChats(prev=> Array.from(new Set([...prev, m.from])));
    });
    setSock(s);
    return ()=> s.close();
  },[]);

  const send = (text:string)=>{
    if (!active) return alert('Pick a chat (JID like 6012xxxx@s.whatsapp.net)');
    sock?.emit('wa.send', { to: active, text });
  }

  return (
    <div style={{display:'flex', gap:12}}>
      <ChatList chats={chats} onPick={setActive} />
      <MessagePane jid={active} messages={messages.filter(m=>m.from===active)} onSend={send} />
    </div>
  );
}

// ------------------
// README.md (setup)
// ------------------
# WA Desk (Unofficial WhatsApp Web via Baileys)

> ⚠️ **Important**: This project uses an unofficial API (Baileys). Using it may violate WhatsApp's Terms of Service and can lead to temporary or permanent account bans. Use at your own risk and only with accounts you own and have permission to automate.

## Prereqs
- Node 18+
- pnpm 9+

## Install & Run

```bash
pnpm i
# set database URL for prisma (SQLite is default)
cp apps/api/.env.example apps/api/.env
# generate prisma client and create DB
pnpm prisma:generate
pnpm prisma:migrate
# run both api and web
pnpm dev
```

- API: http://localhost:4000
- Web: http://localhost:5173

Open Web → Register → Login → Dashboard → scan QR using your WhatsApp → Chat page to receive/send.

## Notes
- WhatsApp JIDs look like `60123456789@s.whatsapp.net` for individuals; for new chats you must input the full JID in Chat page before sending.
- Session files are stored under `apps/api/wa-auth/user-<uid>/`.
- Swap DB to Postgres by editing `packages/db/prisma/schema.prisma` and `DATABASE_URL`.

