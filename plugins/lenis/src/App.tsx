import { framer, isComponentInstanceNode } from "framer-plugin"
import "./App.css"
import { useEffect, useState } from "react"
import cn from 'clsx'
import { FormsIcon, ChartIcon, DatabaseIcon } from "./components/Icons"
import { Route, Switch, useLocation } from "wouter"
import SmoothScrollPage from "./pages/canvas/SmoothScroll"



framer.showUI({
    position: "top right",
    width: 250,
    height: 350,
    resizable: false,
})

const LENIS_INFINITE_COMPONENT_URL = "https://framer.com/m/SeamlessInfinite-Ewnw.js@STKcFeAGI8EdZuHRxhZd"
const INFINITE_COMPONENT_NAME = "SeamlessInfinite"
// const HIDE_VERTICAL_SCROLLBAR_COMPONENT = "https://framer.com/m/HideVerticalScrollbar-Ivt5.js@7UhKJGWr3Ep1GM9aPplr"

// Get the Desktop frame 
export const getDesktopFrame = async () => {
    const frames = await framer.getNodesWithType("FrameNode")
    return frames.find(node => node?.name?.includes("Desktop"))
}

// Check for the existence of infinite component
export const getInfiniteComponent = async () => {
    const desktopFrame = await getDesktopFrame()
    if (!desktopFrame) return null

    const children = await framer.getChildren(desktopFrame.id)
    return children.find(child => isComponentInstanceNode(child) && child.name === "SeamlessInfinite")
}


const infiniteScroll = async () => {
    const desktop = await getDesktopFrame()
    if (!desktop) return

    const component = await framer.addComponentInstance({
        url: LENIS_INFINITE_COMPONENT_URL,
    })


    await framer.setParent(component?.id, desktop?.id)
    await framer.setAttributes(component?.id, {
        name: INFINITE_COMPONENT_NAME,
    })    
    
}


export function App() {
    const [hasInfinite, setHasInfinite] = useState(false)
    const [, navigate] = useLocation()

    useEffect(() => {
        const checkAndUpdate = async () => {
            const infinite = await getInfiniteComponent()
            setHasInfinite(!!infinite)
        }

        checkAndUpdate()
        return framer.subscribeToSelection(checkAndUpdate)
    }, [])

    return (
        <Switch>
            <Route path="/">
                <main className="main">
                    <p>Welcome to Lenis Plugin</p>
                    <div className='buttons-grid'>
                        <button
                            type="button"
                            onClick={() => navigate("/canvas/smooth-scroll")}
                            className="button-icon"
                        >
                            <FormsIcon />
                            Smooth Scroll
                        </button>
                        <button
                            type="button"
                            className={cn("button-icon", hasInfinite && "lenis-applied")}
                            onClick={async () => {
                                await infiniteScroll()
                                setHasInfinite(prev => !prev)
                            }}
                        >
                            <ChartIcon />
                            Seamless Infinite
                        </button>
                        <button
                            type="button"
                            className="button-icon"
                        >
                            <DatabaseIcon />
                            Horizontal Section
                        </button>
                    </div>

                </main>
            </Route>
            <Route path="/canvas/smooth-scroll">
                <SmoothScrollPage />
            </Route>
        </Switch>
    )
}


