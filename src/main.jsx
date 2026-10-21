import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-center"
        toastOptions={{
          classNames: {
            toast:
              "rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#1b1b1b] text-neutral-900 dark:text-neutral-100",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
