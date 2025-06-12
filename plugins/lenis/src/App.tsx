import { framer } from "framer-plugin"
import "./App.css"
import cn from "clsx"
import { SmoothScrollIcon, InfiniteIcon } from "./components/Icons"

framer.showUI({
    position: "top right",
    width: 260,
    height: 411,
    resizable: false,
})

// const LENIS_INFINITE_COMPONENT_URL = "https://framer.com/m/SeamlessInfinite-Ewnw.js@STKcFeAGI8EdZuHRxhZd"
// const INFINITE_COMPONENT_NAME = "SeamlessInfinite"
const LENIS_COMPONENT_URL = "https://framer.com/m/Lenis-y33L.js"
const LENIS_COMPONENT_NAME = "Lenis"

const addComponent = async (url: string, name: string) => {
    framer.addComponentInstance({
        url,
        attributes: {
            name,
        },
    })
}

// const infiniteScroll = () => addComponent(LENIS_INFINITE_COMPONENT_URL, INFINITE_COMPONENT_NAME)
const applyLenis = () => addComponent(LENIS_COMPONENT_URL, LENIS_COMPONENT_NAME)

export function App() {
    return (
        <main className="main">
            <div className="intro">
                <img src="/lenis-icon.png" alt="Lenis" className="lenis-icon" />
                <div className="intro-text">
                    <p className="title">Welcome to Lenis</p>
                    <p className="description">
                        Smooth scroll as it should be,
                        <br />
                        by{" "}
                        <a href="https://darkroom.engineering/" target="_blank" rel="noreferrer">
                            darkroom.engineering
                        </a>
                        .
                    </p>
                </div>
            </div>
            <div className="buttons-grid">
                <button type="button" className="button-icon lenis" onClick={applyLenis}>
                    <SmoothScrollIcon />
                    Smooth Scroll
                </button>
                {/* <button
                    type="button"
                    className={cn("button-icon")}
                    onClick={async () => {
                        await infiniteScroll()
                    }}
                >
                    <InfiniteIcon />
                    Seamless Infinite
                </button> */}
            </div>
            <div className="external-buttons">
                <a
                    className="external-button"
                    target="_blank"
                    rel="noreferrer"
                    type="button"
                    href="https://framer.link/VSD8S6l"
                >
                    Remix
                </a>
                <a
                    className="external-button"
                    target="_blank"
                    rel="noreferrer"
                    type="button"
                    href="https://polar.sh/darkroomengineering/products/1e2f6f70-ff85-4cad-81f0-f979715309f9"
                >
                    Donate
                </a>
            </div>
        </main>
    )
}
