import { framer, isComponentInstanceNode } from "framer-plugin"
import "./App.css"
import { useEffect, useState } from "react"
import cn from 'clsx'

framer.showUI({
    position: "top right",
    width: 350,
    height: 280,
    resizable: false,
})

const LENIS_COMPONENT_URL = "https://framer.com/m/Lenis-y33L.js"
const LENIS_COMPONENT_NAME = "Lenis"

const getLenisComponent = async () => {
    const desktopFrame = (await framer.getNodesWithType("FrameNode")).find(node => node.name === "Desktop")
    if (!desktopFrame) return null

    const children = await framer.getChildren(desktopFrame.id)
    return children.find(child => isComponentInstanceNode(child) && child.name === LENIS_COMPONENT_NAME)
}

const applyLenis = async () => {
    const desktopFrame = (await framer.getNodesWithType("FrameNode")).find(node => node.name === "Desktop")
    if (!desktopFrame) {
        console.log("No frame with name 'Desktop' found")
        return
    }

    const component = await framer.addComponentInstance({
        url: LENIS_COMPONENT_URL,
    })

    await framer.setParent(component?.id, desktopFrame?.id)
    await framer.setAttributes(component?.id, { 
        name: LENIS_COMPONENT_NAME,
        visible: true,
        controls:{
            orientation: 'vertical',
            infinite: false,
            intensity: 1
        }
    })
    console.log("Lenis component added successfully to Desktop frame!")
}

export function App() {
    const [hasLenis, setHasLenis] = useState(false)
    const [lenisConfig, setLenisConfig] = useState({
        isVisible: true,
        orientation: 'vertical',
        isInfinite: false,
        intensity: 1
    })

    useEffect(() => {
        const checkAndUpdate = async () => {
            const lenis = await getLenisComponent()
            setHasLenis(!!lenis)
        }

        checkAndUpdate()
        return framer.subscribeToSelection(checkAndUpdate)
    }, [])

    const updateLenisConfig = async (key: 'isVisible' | 'orientation' | 'isInfinite' | 'intensity', value: boolean | string | number) => {
        const lenis = await getLenisComponent()
        if (!lenis) return

        const configMap = {
            isVisible: { visible: value as boolean },
            orientation: { controls: { orientation: value as string } },
            isInfinite: { controls: { infinite: value as boolean } },
            intensity: { controls: { intensity: value as number } }
        }

        await framer.setAttributes(lenis.id, configMap[key])
        setLenisConfig(prev => ({ ...prev, [key]: value }))
    }

    return (
        <main className="main">
            <button 
                type="button" 
                onClick={applyLenis} 
                className={cn("lenis-button", hasLenis && "lenis-applied")}
            >
                {hasLenis ? "Lenis Applied" : "Apply Lenis"}
            </button>
            <div className="buttons-container">
                <p>Visibility</p>
                <div className="inner">
                    <button aria-label="Visible" type='button' className={cn("button ", !lenisConfig?.isVisible && 'disabled')} onClick={() => updateLenisConfig('isVisible', true)}>
                        Visible
                    </button>
                    <button aria-label="Hidden" type='button' className={cn("button ", lenisConfig?.isVisible && 'disabled')} onClick={() => updateLenisConfig('isVisible', false)}>
                        Hidden
                    </button>
                </div>
            </div>
            <div className="buttons-container">
                <p>Orientation</p>
                <div className='inner'>
                    <button aria-label="Vertical" type='button' className={cn("button", lenisConfig?.orientation !== 'vertical' && 'disabled')} onClick={() => updateLenisConfig('orientation', 'vertical')}>
                        Vertical
                    </button>
                    <button aria-label="Horizontal" type='button' className={cn("button", lenisConfig?.orientation !== 'horizontal' && 'disabled')} onClick={() => updateLenisConfig('orientation', 'horizontal')} >
                        Horizontal
                    </button>
                </div>
            </div>
            <div className="buttons-container">
                <p>Infinite</p>
                <div className="inner">
                    <button aria-label="Inifinte" type='button' className={cn("button", !lenisConfig?.isInfinite && 'disabled')} onClick={() => updateLenisConfig('isInfinite', true)}>
                        Yes
                    </button>
                    <button aria-label="Not Infinite" type='button' className={cn("button", lenisConfig?.isInfinite && 'disabled')} onClick={() => updateLenisConfig('isInfinite', false)} >
                        No
                    </button>
                </div>
            </div>
            <div className="buttons-container">
                <p>Intensity</p>
                <div className='inner-range'>
                    <p className='range-value'>{lenisConfig.intensity}</p>
                    <input 
                        type="range" 
                        min={1} 
                        max={100} 
                        step={1} 
                        onChange={(e) => updateLenisConfig('intensity', Number.parseInt(e.target.value))}
                    />
                </div>
            </div>
        </main>
    )
}