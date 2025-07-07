import { useEffect, useCallback, useState } from "react"
import { framer } from "framer-plugin"
import { personalAccessToken } from "../data"
import { getTokenValidity } from "../storyblok"
import hero from "../assets/hero.png"

export function Auth({ onValidToken }: { onValidToken: (token: string) => void }) {
    const [isLoading, setIsLoading] = useState(false)
    const [defaultToken, setDefaultToken] = useState<string | null>(null)

    useEffect(() => {
        const defaultBoardToken = localStorage.getItem(personalAccessToken)
        if (defaultBoardToken) {
            setDefaultToken(defaultBoardToken)
        }
    }, [defaultToken])

    const handleSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            setIsLoading(true)
            try {
                setIsLoading(true)
                if (defaultToken) {
                    getTokenValidity(defaultToken).then((isValid)=>{
                        if (isValid) {
                            onValidToken(defaultToken)
                        } else {
                            framer.notify("Please valid access token", {
                                variant: "error",
                            })
                        }
                    })
                } else {
                    framer.notify("Please provide access token", {
                        variant: "error",
                    })
                }
            } catch (error) {
                framer.notify(error instanceof Error ? error.message : "An unknown error occurred", {
                    variant: "error",
                })
            } finally {
                setIsLoading(false)
            }
            setIsLoading(true)
        },
        [defaultToken]
    )

    const isButtonDisabled = !defaultToken || isLoading
    return (
        <div className="framer-hide-scrollbar setup">
            <img src={hero} alt="StoryBlok Hero" onDragStart={e => e.preventDefault()} />
            <form onSubmit={handleSubmit}>
                <label>
                    <p>Access Token</p>
                    <input
                        id="accessToken"
                        type="text"
                        required
                        placeholder="Enter Access Token…"
                        defaultValue={defaultToken ?? ""}
                        onChange={event => setDefaultToken(event.target.value)}
                    />
                </label>
                <button disabled={isButtonDisabled}>{isLoading ? <div className="framer-spinner" /> : "Next"}</button>
            </form>
        </div>
    )
}
