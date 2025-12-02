import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Removed <StrictMode> to prevent double-initialization race conditions with Firebase
createRoot(document.getElementById('root')).render(
    <App />
)