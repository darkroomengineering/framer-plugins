import { useState } from "react"

async function validateToken(token: string): Promise<boolean> {
    try {
        const response = await fetch("https://api.storyblok.com/v1/spaces/", {
            headers: {
                Authorization: token,
            },
        })

        return response.ok
    } catch {
        return false
    }
}

export function Login({ onValidToken }: { onValidToken: () => void }) {
    const [token, setToken] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const isValid = await validateToken(token)
        if (isValid) {
            localStorage.setItem("storyblok_token", token)
            onValidToken()
        }
        
        setIsLoading(false)
    }

    return (
        <div>
            <h2>Please insert your personal access token to continue</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !token}>
                    {isLoading ? "Validating..." : "Continue"}
                </button>
            </form>
        </div>
    )
}

