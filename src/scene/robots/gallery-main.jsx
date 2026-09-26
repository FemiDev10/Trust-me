// Temporary test harness entry. Visit /gallery.html in the dev server.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import RobotGallery from './RobotGallery.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RobotGallery />
  </StrictMode>,
);
