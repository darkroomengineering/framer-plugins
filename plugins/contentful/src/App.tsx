import { framer } from "framer-plugin"
import { useEffect, useRef, useState } from "react"
import { createClient } from "contentful-management"

export function App() {
    useEffect(() => {
        framer.showUI({
            width: 300,
            height: 300,
        })
    }, [])

    const pollInterval = useRef()

    const pollForTokens = readKey => {
        // Clear any previous interval timers, one may already exist
        // if this function was invoked multiple times.
        if (pollInterval.current) {
            clearInterval(pollInterval.current)
        }

        return new Promise(resolve => {
            pollInterval.current = setInterval(async () => {
                const response = await fetch(`https://localhost:8787/poll?readKey=${readKey}`, { method: "POST" })

                if (response.status === 200) {
                    const tokens = await response.json()

                    clearInterval(pollInterval.current)
                    resolve(tokens)
                }
            }, 2500)
        })
    }

    const [tokens, setTokens] = useState(null)

    const login = async () => {
        // Retrieve the authorization URL & set of unique read/write keys
        const response = await fetch("https://localhost:8787/authorize", {
            method: "POST",
        })
        if (response.status !== 200) return

        const authorize = await response.json()
        // https://be.contentful.com/oauth/authorize?response_type=token&client_id=NSVZbJDKXl3ISvKCHQOAd5a7pupbS4KT-EmTgGO6wGo&redirect_uri=https%3A%2F%2Flocalhost%3A8787%2Fredirect&response_type=code&access_type=online&include_granted_scopes=true&scope=content_management_read&state=146a6485e23d7f7c40a3765906bda00b
        // https://be.contentful.com/oauth/authorize?client_id=NSVZbJDKXl3ISvKCHQOAd5a7pupbS4KT-EmTgGO6wGo&redirect_uri=https%3A%2F%2Flocalhost%3A8787%2Fredirect&response_type=code&access_type=online&include_granted_scopes=true&scope=content_management_read&state=b5d7b6c1dd4d12eb237174e474bbde2c

        console.log(authorize)

        // return
        // Open up the provider's login window.
        window.open(authorize.url)

        // return

        // While the user is logging in, poll the backend with the
        // read key. On successful login, tokens will be returned.
        const tokens = await pollForTokens(authorize.readKey)

        // Store tokens in local storage to keep the user logged in.
        window.localStorage.setItem("tokens", JSON.stringify(tokens))

        // Update the component state.
        setTokens(tokens)
    }

    useEffect(() => {
        // Check for tokens on first load.
        const serializedTokens = window.localStorage.getItem("tokens")
        if (!serializedTokens) return

        const tokens = JSON.parse(serializedTokens)
        setTokens(tokens)
    }, [])

    useEffect(() => {
        if (!tokens) return

        const fetchSpaces = async () => {
            console.log(tokens.access_token)

            const client = createClient({
                accessToken: tokens.access_token,
            })

            client
                .getSpaces()
                .then(response => console.log(response.items))
                .catch(console.error)
        }

        fetchSpaces()
    }, [tokens])

    console.log(tokens)

    return (
        <div>
            <button onClick={login}>OAuth</button>
        </div>
    )
}
