import { framer } from "framer-plugin"
import { useEffect, useRef } from "react"

export default function Page({ children, width = 320 }: { children: React.ReactNode; width?: number }) {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!ref.current) return

        const observer = new ResizeObserver(entries => {
            if (!entries[0]) return
            const { height } = entries[0].contentRect

            framer.showUI({
                height: Math.min(height, 450),
                width,
            })
        })

        observer.observe(ref.current)

        return () => {
            observer.disconnect()
        }
    }, [width])

    return (
        <div ref={ref}>
            <main>
                <hr className="sticky-divider" />
                {children}
            </main>
        </div>
    )
}
