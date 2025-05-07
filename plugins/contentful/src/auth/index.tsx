import { framer } from "framer-plugin"
import { useCallback, useEffect, useLayoutEffect, type ReactNode } from "react"
import { useRef, useState } from "react"

const isLocal = () => window.location.hostname.includes("localhost")

const AUTH_BACKEND = isLocal() ? "https://localhost:8787" : "https://example.com"

export function AuthScreen({ onSubmit }: { onSubmit: (tokens: { accessToken: string }) => void }) {
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
        const authTokens = await pollForTokens(authorize.readKey)
        // Contentful APIs return access_token and accessToken depending on the service used
        // So we map the access_token to accessToken for consistency
        const tokens = { accessToken: authTokens.access_token }

        // Store tokens in local storage to keep the user logged in.
        window.localStorage.setItem("tokens", JSON.stringify(tokens))

        // Update the component state.
        onSubmit(tokens)
        setIsLoading(false)
    }

    return (
        <div className="auth framer-hide-scrollbar">
            <img src="/contentful.webp" alt="Contentful" className="img" />
            <ol className="list">
                <li>
                    <span>Log in to your Contentful account</span>
                </li>
                <li>
                    <span>Select the Space and Content Type</span>
                </li>
                <li>
                    <span>Map the fields to the CMS</span>
                </li>
            </ol>
            <button type="submit" disabled={isLoading} onClick={login}>
                {isLoading ? "Connecting..." : "Sign in"}
            </button>
        </div>
    )
}

function useLocalTokens(setTokens: (tokens: { accessToken: string | null }) => void) {
    useEffect(() => {
        const serializedTokens = window.localStorage.getItem("tokens")
        if (!serializedTokens) {
            setTokens({ accessToken: null })
            framer.setPluginData("contentful:space", null)
            return
        }
        setTokens(JSON.parse(serializedTokens))
    }, [])
}

export function Auth({
    previousCredentials,
    children,
}: {
    previousCredentials: { accessToken: string | null; spaceId: string | null; authGranted: boolean }
    children: (args: {
        tokens: { accessToken: string | null }
        setTokens: (tokens: { accessToken: string | null }) => void
        needsAuth: boolean
    }) => ReactNode
}) {
    const [tokens, setTokens] = useState<{ accessToken: string | null }>({ accessToken: null })

    useLocalTokens(setTokens)

    const needsAuth = useCallback(() => {
        // If we already have space credentials, we don't need to auth
        // avoiding a flash of the auth screen
        if (previousCredentials.authGranted) {
            return false
        } else {
            // If we don't have space credentials, we need to auth
            return !tokens.accessToken
        }
    }, [previousCredentials, tokens])

    return children({ tokens, setTokens, needsAuth: needsAuth() })
}
