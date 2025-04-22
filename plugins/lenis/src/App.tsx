import { framer } from "framer-plugin"
import "./App.css"

framer.showUI({
    position: "top right",
    width: 300,
    height: 400,
    resizable: false,
})

const applyLenis = async () => {
    const desktopFrame = (await framer.getNodesWithType("FrameNode")).find(node => node.name === "Desktop")

    if (!desktopFrame) {
        console.log("No frame with name 'Desktop' found")
        return
    }

    const component = await framer.addComponentInstance({
        url: "https://framer.com/m/Lenis-y33L.js",
    })
    await framer.setParent(component.id, desktopFrame.id)
    console.log("Lenis component added successfully to Desktop frame!")
}

export function App() {
    return (
        <main className="main">
            <button type="button" onClick={applyLenis} className="lenis-button">
                Apply Lenis
            </button>
        </main>
    )
}
