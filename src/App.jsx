import { useState } from 'react';
import ModeBar from './components/ModeBar.jsx';
import CalcView from './views/CalcView.jsx';
import PercentView from './views/PercentView.jsx';
import UnitsView from './views/UnitsView.jsx';
import CurrencyView from './views/CurrencyView.jsx';
import DateView from './views/DateView.jsx';

export default function App() {
  const [mode, setMode] = useState('calc');

  return (
    <div className="app">
      <ModeBar mode={mode} onChange={setMode} />
      {mode === 'calc' && <CalcView />}
      {mode === 'pct' && <PercentView />}
      {mode === 'units' && <UnitsView />}
      {mode === 'fx' && <CurrencyView />}
      {mode === 'date' && <DateView />}
    </div>
  );
}
