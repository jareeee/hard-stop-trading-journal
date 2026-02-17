import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { RuleConfiguration } from './pages/RuleConfiguration';
import { TradeLog } from './pages/TradeLog';
import { TradeHistory } from './pages/TradeHistory';
import { Settings } from './pages/Settings';
import { Session } from './pages/Session';

import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/session" element={<Session />} />
          <Route path="/sessions" element={<TradeHistory />} />
          <Route path="/trade-history" element={<TradeHistory />} />
          <Route path="/trade-log" element={<TradeLog />} />
          <Route path="/rule-configuration" element={<RuleConfiguration />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
