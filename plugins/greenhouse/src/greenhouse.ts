import { getContentType } from "./../../contentful/src/contentful"
export const CONTENT_TYPES = [
    {
        id: "jobs",
        name: "Jobs",
        path: "/jobs",
        key: "jobs",
    },
    {
        id: "offices",
        name: "Offices",
        path: "/offices",
        key: "offices",
    },
    {
        id: "departments",
        name: "Departments",
        path: "/departments",
        key: "departments",
    },
    {
        id: "degrees",
        name: "Degrees",
        path: "/education/degrees",
        key: "items",
    },
    {
        id: "disciplines",
        name: "Disciplines",
        path: "/education/disciplines",
        key: "items",
    },
    {
        id: "schools",
        name: "Schools",
        path: "/education/schools",
        key: "items",
    },
    {
        id: "sections",
        name: "Sections",
        path: "/sections",
        key: "sections",
    },
]

let greenhouseToken = ""

export async function initGreenhouse(spaceId: string) {
    const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${spaceId}`)
    if (!response.ok) {
        throw new Error("Invalid space ID")
    }

    greenhouseToken = spaceId

    return true
}

export async function getContentType(contentType: string, all: boolean = true) {
    if (!greenhouseToken) throw new Error("Greenhouse token not set")

    const response = await fetch(
        `https://boards-api.greenhouse.io/v1/boards/${greenhouseToken}${CONTENT_TYPES.find(ct => ct.id === contentType)?.path}?content=true`
    )

    const data = await response.json()

    // const items = data?.items
    const count = data?.meta?.total_count
    const perPage = data?.meta?.per_page

    if (count > perPage && all) {
        const pages = Math.ceil(count / perPage)
        console.log(count, perPage, pages)

        const promises = []

        for (let i = 1; i <= pages; i++) {
            promises.push(
                fetch(
                    `https://boards-api.greenhouse.io/v1/boards/${greenhouseToken}${CONTENT_TYPES.find(ct => ct.id === contentType)?.path}?page=${i}`
                )
            )
        }

        const results = await Promise.all(promises)
        const data = await Promise.all(results.map(r => r.json()))

        return data.map(({ items }) => items).flat()
    }

    const key = CONTENT_TYPES.find(ct => ct.id === contentType)?.key

    if (!key) throw new Error(`Content type key not found for ${contentType}`)

    return data[key]
}

export async function getAllContentTypes(all: boolean = true): Promise<Record<string, any[]>> {
    if (!greenhouseToken) throw new Error("Greenhouse token not set")

    const contentTypes = await Promise.all(
        CONTENT_TYPES.map(async ct => {
            const data = await getContentType(ct.id, all)
            return [ct.id, data]
        })
    )

    return Object.fromEntries(contentTypes)
}
