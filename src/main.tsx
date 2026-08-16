import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { UpdateNote } from './components/UpdateNote';
import { FamilyProvider } from './store/FamilyProvider';
import './styles/base.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FamilyProvider>
      <App />
    </FamilyProvider>
    {/* Outside the family: a new build is worth saying whatever is on screen. */}
    <UpdateNote />
  </StrictMode>,
);
