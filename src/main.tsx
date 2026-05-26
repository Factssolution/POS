
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";

  // Suppress harmless WebSocket connection warnings in development
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Ignore WebSocket connection warnings
    if (message.includes('WebSocket') || 
        message.includes('ws://') || 
        message.includes('WDS')) {
      return;
    }
    originalError.apply(console, args);
  };

  createRoot(document.getElementById("root")!).render(<App />);
  