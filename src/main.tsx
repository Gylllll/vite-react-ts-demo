import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import RouterComp from './router/index.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterComp />
  </StrictMode>,
);
