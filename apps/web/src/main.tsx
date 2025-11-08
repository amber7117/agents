import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Channels from './pages/Channels';
import Settings from './pages/Settings';
import AISettings from './pages/AISettings';
import AgentManagement from './pages/AgentManagement';
import SettingsWidget from './pages/SettingsWidget';

import './styles/globals.css';


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
          <Route path="channels" element={<Channels />} />
          <Route path="settings" element={<Settings />} />
          <Route path="/settings/widget" element={<SettingsWidget />} />
          <Route path="ai" element={<AISettings />} />
          <Route path="agent-management" element={<AgentManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);