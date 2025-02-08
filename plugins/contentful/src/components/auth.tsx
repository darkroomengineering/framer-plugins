import { framer } from "framer-plugin"
import { useLayoutEffect } from "react"
import { Hero } from "./hero"
import { useRef, useState } from "react"

const isLocal = () => window.location.hostname.includes("localhost")

const AUTH_BACKEND = isLocal() ? "https://localhost:8787" : "https://example.com"

export function Auth({ onSubmit }: { onSubmit: (tokens: { access_token: string }) => void }) {
    const [isLoading, setIsLoading] = useState(false)

    useLayoutEffect(() => {
        framer.showUI({
            width: 320,
            height: 345,
            resizable: false,
        })
    }, [])

    const pollInterval = useRef<NodeJS.Timeout>()

    const pollForTokens = (readKey: string): Promise<{ access_token: string }> => {
        // Clear any previous interval timers, one may already exist

        // if this function was invoked multiple times.
        if (pollInterval.current) {
            clearInterval(pollInterval.current)
        }

        return new Promise(resolve => {
            pollInterval.current = setInterval(async () => {
                const response = await fetch(`${AUTH_BACKEND}/poll?readKey=${readKey}`, { method: "POST" })

                if (response.status === 200) {
                    const tokens = await response.json()

                    clearInterval(pollInterval.current)
                    resolve(tokens as { access_token: string })
                }
            }, 2500)
        })
    }

    const login = async () => {
        setIsLoading(true)
        // Retrieve the authorization URL & set of unique read/write keys
        const response = await fetch(`${AUTH_BACKEND}/authorize`, {
            method: "POST",
        })
        if (response.status !== 200) return

        const authorize = await response.json()

        // Open up the provider's login window.
        window.open(authorize.url)

        // return

        // While the user is logging in, poll the backend with the
        // read key. On successful login, tokens will be returned.
        const tokens = await pollForTokens(authorize.readKey)

        // Store tokens in local storage to keep the user logged in.
        // window.localStorage.setItem("tokens", JSON.stringify(tokens))

        // Update the component state.
        onSubmit(tokens)
        setIsLoading(false)
    }

    return (
        <>
            <div className="col-lg">
                <Hero />
                <ol className="list-decimal list-inside space-y-2.5 marker:text-secondary text-tertiary *:text-content *:leading-none *:tracking-normal py-[7px]">
                    <li>
                        <span className="pl-[10px]">Log in to your Contentful account</span>
                    </li>

                    <li>
                        <span className="pl-[10px]">Select the Space and Content Type</span>
                    </li>
                    <li>
                        <span className="pl-[10px]">Map the fields to the CMS</span>
                    </li>
                </ol>
                <div className="sticky left-0 bottom-0 flex justify-between bg-primary items-center max-w-full">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex justify-center items-center relative py-2 framer-button-secondary w-full"
                        onClick={login}
                    >
                        {isLoading ? "Connecting..." : "Sign in"}
                    </button>
                </div>
            </div>
        </>
    )
}
