import "framer-plugin/framer.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.tsx"
import { framer } from "framer-plugin"

const root = document.getElementById("root")
if (!root) throw new Error("Root element not found")

const lokaliseToken = await framer.getPluginData("lokalise")

createRoot(root).render(
    <StrictMode>
        <App authToken={lokaliseToken} />
    </StrictMode>
)
