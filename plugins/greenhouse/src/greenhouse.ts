import { ManagedCollectionField } from "framer-plugin"

type CollectionFieldType = ManagedCollectionField["type"]

export const FIELD_TYPE_OPTIONS: { type: CollectionFieldType; label: string }[] = [
    { type: "boolean", label: "Boolean" },
    { type: "color", label: "Color" },
    { type: "number", label: "Number" },
    { type: "string", label: "String" },
    { type: "formattedText", label: "Formatted Text" },
    { type: "image", label: "Image" },
    // { type: "link", label: "Link" }, // this is string
    { type: "date", label: "Date" },
    // { type: "enum", label: "Option" }, // this doesn't make sense for the collection
    // { type: "file", label: "File" }, // this cannot be handled by the plugin
]

export const CONTENT_TYPES = [
    {
        id: "jobs",
        name: "Jobs",
        path: "/jobs",
        key: "jobs",
        fields: [
            // https://github.com/grnhse/greenhouse-api-docs/blob/master/source/includes/job-board/_jobs.md
            {
                id: "id",
                name: "Id",
                type: "number",
            },
            {
                id: "internal_job_id",
                name: "Internal Job Id",
                type: "number",
            },
            {
                id: "title",
                name: "Title",
                type: "string",
            },
            {
                id: "updated_at",
                name: "Updated At",
                type: "date",
            },
            {
                id: "requisition_id",
                name: "Requisition ID",
                type: "number",
            },
            {
                id: "location",
                name: "Location",
                type: "string",
                // path: "location/name",
            },
            {
                id: "absolute_url",
                name: "Absolute URL",
                type: "string",
            },
            {
                id: "content",
                name: "Content",
                type: "string",
            },
            {
                id: "departements",
                name: "Departements",
                type: "multiCollectionReference",
            },
            {
                id: "offices",
                name: "Offices",
                type: "multiCollectionReference",
            },
        ],
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
