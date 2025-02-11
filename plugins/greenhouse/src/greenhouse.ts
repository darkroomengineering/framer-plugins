import { ManagedCollectionField } from "framer-plugin"

function decodeHtml(html: string) {
    const textarea = document.createElement("textarea")
    textarea.innerHTML = html
    return textarea.value
}

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

export type Job = {
    id: string
    internal_job_id: string
    title: string
    updated_at: string
    requisition_id: string
    location: {
        name: string
    }
    absolute_url: string
    content: string
    departments: Department[]
    offices: Office[]
}

export type Department = {
    id: string
    name: string
    jobs: Job[]
}

export type Office = {
    id: string
    name: string
    departments: Department[]
}

export type Degree = {
    id: string
    text: string
}

export type Discipline = {
    id: string
    text: string
}

export type School = {
    id: string
    text: string
}

export type Section = {
    id: string
    name: string
    jobs: Job[]
}

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
                type: "string",
            },
            {
                id: "internal_job_id",
                name: "Internal Job Id",
                type: "string",
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
                type: "string",
            },
            {
                id: "location",
                name: "Location",
                type: "string",
            },
            {
                id: "absolute_url",
                name: "Absolute URL",
                type: "string",
            },
            {
                id: "content",
                name: "Content",
                type: "formattedText",
            },
            {
                id: "departments",
                name: "Departments",
                type: "multiCollectionReference",
                contentTypeId: "departments",
            },
            {
                id: "offices",
                name: "Offices",
                type: "multiCollectionReference",
                contentTypeId: "offices",
            },
        ],
        mapEntry: (entry: Job) => {
            return {
                id: String(entry?.id),
                internal_job_id: String(entry?.internal_job_id),
                title: entry?.title,
                updated_at: String(entry?.updated_at),
                requisition_id: String(entry?.requisition_id),
                location: entry?.location?.name,
                absolute_url: String(entry?.absolute_url),
                content: decodeHtml(entry?.content),
                departments: entry?.departments?.map((department: Department) => String(department.id)),
                offices: entry?.offices?.map((office: Office) => String(office.id)),
            }
        },
    },
    {
        id: "offices",
        name: "Offices",
        path: "/offices",
        key: "offices",
        fields: [
            {
                id: "id",
                name: "Id",
                type: "string",
            },
            {
                id: "name",
                name: "Name",
                type: "string",
            },
            {
                id: "departments",
                name: "Departments",
                type: "multiCollectionReference",
                contentTypeId: "departments",
            },
        ],
        mapEntry: (entry: Office) => {
            return {
                id: String(entry?.id),
                name: entry?.name,
                departments: entry?.departments?.map((department: Department) => String(department.id)),
            }
        },
    },
    {
        id: "departments",
        name: "Departments",
        path: "/departments",
        key: "departments",
        fields: [
            {
                id: "id",
                name: "Id",
                type: "string",
            },
            {
                id: "name",
                name: "Name",
                type: "string",
            },
            {
                id: "jobs",
                name: "Jobs",
                type: "multiCollectionReference",
                contentTypeId: "jobs",
            },
        ],
        mapEntry: (entry: Department) => {
            return {
                id: String(entry?.id),
                name: entry?.name,
                jobs: entry?.jobs?.map((job: Job) => String(job.id)),
            }
        },
    },
    {
        id: "degrees",
        name: "Degrees",
        path: "/education/degrees",
        key: "items",
        fields: [
            {
                id: "id",
                name: "Id",
                type: "string",
            },
            {
                id: "text",
                name: "text",
                type: "string",
            },
        ],
        mapEntry: (entry: Degree) => {
            return {
                id: String(entry?.id),
                text: entry?.text,
            }
        },
    },
    {
        id: "disciplines",
        name: "Disciplines",
        path: "/education/disciplines",
        key: "items",
        fields: [
            {
                id: "id",
                name: "Id",
                type: "string",
            },
            {
                id: "text",
                name: "text",
                type: "string",
            },
        ],
        mapEntry: (entry: Discipline) => {
            return {
                id: String(entry?.id),
                text: entry?.text,
            }
        },
    },
    {
        id: "schools",
        name: "Schools",
        path: "/education/schools",
        key: "items",
        fields: [
            {
                id: "id",
                name: "Id",
                type: "string",
            },
            {
                id: "text",
                name: "text",
                type: "string",
            },
        ],
        mapEntry: (entry: School) => {
            return {
                id: String(entry?.id),
                text: entry?.text,
            }
        },
    },
    {
        id: "sections",
        name: "Sections",
        path: "/sections",
        key: "sections",
        fields: [
            {
                id: "id",
                name: "Id",
                type: "string",
            },
            {
                id: "name",
                name: "Name",
                type: "string",
            },
            {
                id: "jobs",
                name: "Jobs",
                type: "multiCollectionReference",
                contentTypeId: "jobs",
            },
        ],
        mapEntry: (entry: Section) => {
            return {
                id: String(entry?.id),
                name: entry?.name,
                jobs: entry?.jobs?.map((job: Job) => String(job.id)),
            }
        },
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

export async function getContentType(
    contentType: string,
    all: boolean = true
): Promise<Job[] | Department[] | Office[] | Degree[] | Discipline[] | School[] | Section[]> {
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

export async function getAllContentTypes(
    all: boolean = true
): Promise<Record<string, Job[] | Department[] | Office[] | Degree[] | Discipline[] | School[] | Section[]>> {
    if (!greenhouseToken) throw new Error("Greenhouse token not set")

    const contentTypes = await Promise.all(
        CONTENT_TYPES.map(async ct => {
            const data = await getContentType(ct.id, all)
            return [ct.id, data]
        })
    )

    return Object.fromEntries(contentTypes)
}
