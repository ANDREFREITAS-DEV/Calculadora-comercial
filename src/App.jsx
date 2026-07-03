import { useState } from 'react';
import ModeBar from './components/ModeBar.jsx';
import InstallButton from './components/InstallButton.jsx';
import SettingsSheet from './components/SettingsSheet.jsx';
import CalcView from './views/CalcView.jsx';
import PercentView from './views/PercentView.jsx';
import UnitsView from './views/UnitsView.jsx';
import CurrencyView from './views/CurrencyView.jsx';
import DateView from './views/DateView.jsx';
import { useTheme } from './hooks/useTheme.js';

export default function App() {
  const [mode, setMode] = useState('calc');
  const [theme, setTheme] = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <ModeBar mode={mode} onChange={setMode} onSettings={() => setSettingsOpen(true)} />
      <InstallButton />
      {mode === 'calc' && <CalcView />}
      {mode === 'pct' && <PercentView />}
      {mode === 'units' && <UnitsView />}
      {mode === 'fx' && <CurrencyView />}
      {mode === 'date' && <DateView />}

      {settingsOpen && (
        <SettingsSheet theme={theme} onTheme={setTheme} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}
