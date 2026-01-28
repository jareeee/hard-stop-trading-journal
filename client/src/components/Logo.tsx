import { Target } from 'lucide-react';

export const Logo = () => {
  return (
    <div className="logo-container">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '8px',
        border: '1px solid #333',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #000 100%)',
        marginBottom: '10px'
      }}>
        <Target size={32} color="#dc2626" strokeWidth={2} />
      </div>
      <h1 className="logo-text">HardStop</h1>
      <p className="logo-subtext">Discipline & Risk Guardian</p>
    </div>
  );
};
