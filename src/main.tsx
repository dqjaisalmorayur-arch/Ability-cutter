import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Main.tsx starting - Initializing React Root');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('CRITICAL: Root element not found in DOM');
  document.body.innerHTML = '<div style="padding: 40px; color: #ef4444; font-family: sans-serif; text-align: center;">' +
    '<h1 style="font-size: 24px;">Critical Error</h1>' +
    '<p>Root element not found. Please refresh the page.</p>' +
    '</div>';
} else {
  try {
    console.log('Attempting to render App component...');
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log('App render call completed successfully');
    
    // Signal to index.html that we reached this point
    (window as any).__APP_INITIALIZED__ = true;
    const debugElement = document.getElementById('debug-initial');
    if (debugElement) {
      debugElement.style.display = 'none';
    }
  } catch (err) {
    console.error('CRITICAL: Failed to render app:', err);
    rootElement.innerHTML = `<div style="padding: 40px; color: #ef4444; font-family: sans-serif; text-align: center; border: 2px solid #ef4444; border-radius: 20px; margin: 20px;">` +
      `<h1 style="font-size: 24px;">Render Error</h1>` +
      `<p>Failed to initialize the application.</p>` +
      `<pre style="text-align: left; background: #f9fafb; padding: 15px; border-radius: 10px; font-size: 12px; overflow: auto;">${err instanceof Error ? err.stack || err.message : String(err)}</pre>` +
      `<button onclick="location.reload()" style="background: #0066FF; color: white; border: none; padding: 12px 24px; border-radius: 12px; cursor: pointer; font-weight: bold; margin-top: 20px;">Retry</button>` +
      `</div>`;
  }
}

// Service worker cleanup
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}
