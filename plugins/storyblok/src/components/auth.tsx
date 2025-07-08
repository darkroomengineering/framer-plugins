import { useEffect, useRef, useState } from "react"
import { PLUGIN_KEYS } from "../data"
import { getTokenValidity } from "../storyblok"

export function Auth({ onValidToken }: { onValidToken: (token: string) => void }) {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const [defaultToken, setDefaultToken] = useState<string | null>(null)

    useEffect(() => {
        const defaultBoardToken = localStorage.getItem(PLUGIN_KEYS.PERSONAL_ACCESS_TOKEN)
        if (defaultBoardToken) {
            setDefaultToken(defaultBoardToken)
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const token = inputRef.current?.value

        if (!token) {
            setError("Please enter a token")
            return
        }

        try {
            setIsLoading(true)

            const isValid = await getTokenValidity(token)
            if (isValid) {
                onValidToken(token)
            }
        } catch (error) {
            setError("Invalid")
            console.error(error)
        } finally {
            setIsLoading(false)
        }

        setIsLoading(true)
    }

    return (
        <div className="framer-hide-scrollbar setup">
            <img src="/asset.jpg" alt="Greenhouse Hero" onDragStart={e => e.preventDefault()} />
            <form onSubmit={handleSubmit}>
                <label>
                    <p>
                        Access Token{" "}
                        {error && (
                            <span
                                style={{
                                    color: "#FF3366",
                                }}
                            >
                                ({error})
                            </span>
                        )}
                    </p>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Token"
                        defaultValue={defaultToken ?? ""}
                        onChange={() => {
                            setError(null)
                        }}
                    />
                </label>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Connecting..." : "Connect"}
                </button>
            </form>
        </div>
    )
}
