import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { DisciplineCommitment } from './pages/DisciplineCommitment';
import { RuleConfiguration } from './pages/RuleConfiguration';
import { TradeLog } from './pages/TradeLog';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/discipline-commitment" element={<DisciplineCommitment />} />
        <Route path="/rule-configuration" element={<RuleConfiguration />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/trade-log" element={<TradeLog />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
