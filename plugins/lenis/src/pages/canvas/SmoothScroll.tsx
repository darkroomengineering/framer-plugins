import { useState, useRef, useEffect } from 'react'
import { framer, isComponentInstanceNode } from "framer-plugin"
import cn from 'clsx'
import { useLocation } from "wouter"


const LENIS_COMPONENT_URL = "https://framer.com/m/Lenis-y33L.js"
const LENIS_COMPONENT_NAME = "Lenis"



const applyLenis = async () => {
    const desktopFrame = (await framer.getNodesWithType("FrameNode")).find(node => node.name === "Desktop")
    if (!desktopFrame) {
        return
    }

    await framer.setAttributes(desktopFrame?.id, {
        name: "Desktop",
        position: "fixed",
        height: '100%',
    })

    console.log('desktopFrame', desktopFrame)

    const component = await framer.addComponentInstance({
        url: LENIS_COMPONENT_URL,
    })

    await framer.setParent(component?.id, desktopFrame?.id)
    await framer.setAttributes(component?.id, {
        name: LENIS_COMPONENT_NAME,
        controls: {
            orientation: 'vertical',
            infinite: false,
            intensity: 12
        }
    })
}

export const getLenisComponent = async () => {
    const desktopFrame = (await framer.getNodesWithType("FrameNode")).find(node => node.name === "Desktop")
    if (!desktopFrame) return null

    const children = await framer.getChildren(desktopFrame.id)
    return children.find(child => isComponentInstanceNode(child) && child.name === LENIS_COMPONENT_NAME)
}


const MIN = 1
const MAX = 100

export default function SmoothScrollPage() {
    const [hasLenis, setHasLenis] = useState(false)

    const [, navigate] = useLocation()


    const [lenisConfig, setLenisConfig] = useState({
        orientation: 'vertical',
        isInfinite: false,
        intensity: 12
    })
    const inputTextRef = useRef<HTMLInputElement>(null)

    const updateLenisConfig = async (key: 'orientation' | 'isInfinite' | 'intensity', value: boolean | string | number) => {
        const lenis = await getLenisComponent()
        if (!lenis) return

        const configMap = {
            orientation: { controls: { orientation: value as string } },
            isInfinite: { controls: { infinite: value as boolean } },
            intensity: { controls: { intensity: value as number } }
        }

        await framer.setAttributes(lenis.id, configMap[key])
        setLenisConfig(prev => ({ ...prev, [key]: value }))
    }

    useEffect(() => {
        const checkAndUpdate = async () => {
            const lenis = await getLenisComponent()
            setHasLenis(!!lenis)
        }

        checkAndUpdate()
        return framer.subscribeToSelection(checkAndUpdate)
    }, [])

    return (
        <div className='lenis-ui'>
            <button
                type="button"
                onClick={applyLenis}
                className={cn("lenis-button", hasLenis && "lenis-applied")}
            >
                {hasLenis ? "Lenis Applied" : "Apply Lenis"}
            </button>
            
            <div className='attributes-container'>
                <div className="buttons-container">
                    <p>Orientation</p>
                    <div className='inner' data-orientation={lenisConfig?.orientation}>
                        <div className="toggle" />
                        <button data-active={lenisConfig?.orientation === 'vertical'} aria-label="Vertical" type='button' className={cn("button", lenisConfig?.orientation !== 'vertical' && 'disabled')} onClick={() => updateLenisConfig('orientation', 'vertical')}>
                            Vertical
                        </button>
                        <button data-active={lenisConfig?.orientation === 'horizontal'} aria-label="Horizontal" type='button' className={cn("button", lenisConfig?.orientation !== 'horizontal' && 'disabled')} onClick={() => updateLenisConfig('orientation', 'horizontal')} >
                            Horizontal
                        </button>
                    </div>
                </div>
                <div className="buttons-container">
                    <p>Infinite</p>
                    <div className="inner" data-infinite={lenisConfig?.isInfinite}>
                        <div className="toggle" />
                        <button data-active={lenisConfig?.isInfinite} aria-label="Inifinte" type='button' className={cn("button", !lenisConfig?.isInfinite && 'disabled')} onClick={() => updateLenisConfig('isInfinite', true)}>
                            Yes
                        </button>
                        <button data-active={!lenisConfig?.isInfinite} aria-label="Not Infinite" type='button' className={cn("button", lenisConfig?.isInfinite && 'disabled')} onClick={() => updateLenisConfig('isInfinite', false)} >
                            No
                        </button>
                    </div>
                </div>
                <div className="buttons-container">
                    <p>Intensity</p>
                    <div className="inner-range">
                        <input
                            className="range-text"
                            type="text"
                            ref={inputTextRef}
                            value={lenisConfig.intensity.toString()}
                            onChange={(e) => {
                                let float = Number.parseFloat(e.target.value)
                                if (Number.isNaN(float)) return
                                float = Math.min(Math.max(MIN, float), MAX)
                                updateLenisConfig('intensity', float)
                            }}
                            onBlur={(e) => {
                                let float = Number.parseFloat(e.target.value)
                                if (Number.isNaN(float)) return

                                float = Math.min(Math.max(MIN, float), MAX)
                                updateLenisConfig('intensity', float)
                            }}
                        />
                        <div className="input-range">
                            <input
                                type="range"
                                min={MIN}
                                max={MAX}
                                step="1"
                                onChange={(e) => {
                                    const newValue = Number.parseFloat(e.target.value)
                                    updateLenisConfig('intensity', newValue)
                                }}
                                value={lenisConfig.intensity}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button type='button' className='back-btn' onClick={() => navigate('/')}>Back to Main</button>
        </div>
    )
}