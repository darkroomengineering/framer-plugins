import { framer } from "framer-plugin"
import Logo from "../assets/splash.png"
import { useEffect, useLayoutEffect, useState } from "react"
import { initGreenhouse } from "../greenhouse"

export function Auth({ onSubmit }: { onSubmit: (spaceId: string) => void }) {
    const [spaceId, setSpaceId] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useLayoutEffect(() => {
        framer.showUI({
            width: 320,
            height: 305,
            resizable: false,
        })
    }, [])

    useEffect(() => {
        async function prefill() {
            const spaceId = await framer.getPluginData("greenhouse")
            if (spaceId) {
                setSpaceId(spaceId)
            }
        }

        prefill()
    }, [])

    return (
        <div
            onSubmit={() => {
                onSubmit(spaceId)
            }}
            className="flex flex-col gap-[15px]"
        >
            <img
                src={Logo}
                alt="Contentful Hero"
                className="object-contain w-full rounded-[10px] h-[200px] bg-contentful-orange bg-opacity-10"
            />
            <div className="flex flex-col gap-[10px] text-secondary">
                <div className="row justify-between items-center items-center">
                    <label htmlFor="spaceId" className="ml-[15px]">
                        Board Token {error && <span className="text-framer-red">(Invalid)</span>}
                    </label>
                    <input
                        id="spaceId"
                        type="text"
                        className="w-[134px]"
                        placeholder="Space ID"
                        value={spaceId}
                        onChange={e => {
                            setSpaceId(e.target.value)
                            setError(null)
                        }}
                    />
                </div>
            </div>
            <div className="sticky left-0 bottom-0 flex justify-between bg-primary items-center max-w-full">
                <button
                    // type="submit"
                    disabled={isLoading}
                    className="flex justify-center items-center relative py-2 framer-button-secondary w-full"
                    onClick={async () => {
                        setIsLoading(true)
                        try {
                            await initGreenhouse(spaceId)
                            onSubmit(spaceId)
                        } catch (error) {
                            setError("Invalid space ID")
                            setIsLoading(false)
                            throw new Error("Invalid space ID")
                        }
                    }}
                >
                    {isLoading ? "Connecting..." : "Connect"}
                </button>
            </div>
        </div>
    )
}
