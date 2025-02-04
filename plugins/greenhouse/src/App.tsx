import "./App.css"
import { framer } from "framer-plugin"
import { useEffect, useState } from "react"

export function App() {
    const [isLoading, setIsLoading] = useState(true)
    const [spaceId, setSpaceId] = useState("")
    const [isConfigured, setIsConfigured] = useState(false)

    useEffect(() => {
        async function configure() {
            // const collection = await framer.getManagedCollection()
            // const contentTypeId = await collection.getPluginData("contentTypeId")

            // console.log("contentTypeId", contentTypeId)

            // if (contentTypeId) {
            //     // edit mode
            //     // retrieve content types from Contentful
            //     // show UI
            //     return
            // }

            framer.showUI({
                width: 340,
                height: 370,
                resizable: false,
            })
            setIsLoading(false)
        }

        // console.log("useEffect", framer.mode)
        if (framer.mode === "syncManagedCollection") {
            // When in sync mode, don't show UI
            sync()
        } else {
            if (framer.mode === "configureManagedCollection") {
                console.log("configureManagedCollection")
            }

            configure()
        }
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

    const sync = async () => {
        console.log("sync it")
        try {
            const collection = await framer.getManagedCollection()
            const spaceId = await collection.getPluginData("spaceId")
            const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${spaceId}/jobs?content=true`)
            const data = await response.json()

            // https://developers.greenhouse.io/job-board.html#jobs
            // Update fields
            await collection.setFields([
                {
                    id: "title",
                    name: "title",
                    type: "string",
                },
                {
                    id: "updated_at",
                    name: "updated_at",
                    type: "string",
                },
                {
                    id: "location",
                    name: "location",
                    type: "string",
                },
                {
                    id: "absolute_url",
                    name: "url",
                    type: "link",
                },
                {
                    id: "content",
                    name: "content",
                    type: "formattedText",
                },
                // TODO: add offices and departments (extra collections)
                // {
                //     id: "office",
                //     name: "office",
                //     type: "collectionReference",
                //     collectionId: "offices",
                // },
                // {
                //     id: "department",
                //     name: "department",
                //     type: "collectionReference",
                //     collectionId: "departments",
                // },
                // extra fields from Greenhouse
                {
                    id: "internal_job_id",
                    name: "internal_job_id",
                    type: "string",
                },
                {
                    id: "requisition_id",
                    name: "requisition_id",
                    type: "string",
                },
                {
                    id: "metadata",
                    name: "metadata",
                    type: "string",
                },
                {
                    id: "data_compliance",
                    name: "data_compliance",
                    type: "string",
                },
            ])

            const jobs = data.jobs.map(
                (job: {
                    id: number
                    title: string
                    updated_at: string
                    location: { name: string }
                    absolute_url: string
                    content: string
                    internal_job_id: number
                    requisition_id: number
                    metadata: object
                    data_compliance: object
                }) => ({
                    id: String(job.id),
                    slug: String(job.id),
                    fieldData: {
                        title: job?.title,
                        updated_at: job?.updated_at,
                        location: job?.location?.name,
                        absolute_url: job?.absolute_url,
                        content: job?.content,
                        internal_job_id: String(job?.internal_job_id),
                        requisition_id: String(job?.requisition_id),
                        metadata: job?.metadata ? JSON.stringify(job?.metadata) : "",
                        data_compliance: job?.data_compliance ? JSON.stringify(job?.data_compliance) : "",
                    },
                })
            )

            await collection.addItems(jobs)

            console.log(data.jobs)

            // await framer.setPluginData("contentful:collections", "")

            // In sync mode, we're already in a specific collection
            // const collection = await framer.getManagedCollection()
            // const contentTypeId = await collection.getPluginData("contentTypeId")

            // let collections = await framer.getPluginData("contentful:collections")
            // collections = collections ? JSON.parse(collections) : {}
            // collections[contentTypeId] = collection.id

            // console.log("collections", collections)

            // await framer.setPluginData("contentful:collections", JSON.stringify(collections))

            // if (!contentTypeId) {
            //     throw new Error("No content type configured")
            // }

            // // Initialize Contentful client for sync
            // const spaceId = await collection.getPluginData("spaceId")
            // const accessToken = await collection.getPluginData("accessToken")
            // if (!spaceId || !accessToken) {
            //     throw new Error("Contentful credentials not found")
            // }
            // initContentful({ space: spaceId, accessToken })

            // console.log("contentTypeId", contentTypeId, collection.id)

            // const entries = await getEntriesForContentType(contentTypeId)
            // const mappedCollection = await mapContentfulToFramerCollection(contentTypeId, entries)

            // // empty the collection
            // const itemsIds = await collection.getItemIds()
            // await collection.removeItems(itemsIds)

            // // Update fields
            // await collection.setFields(mappedCollection.fields)

            // // Add/update items
            // await collection.addItems(mappedCollection.items)

            framer.notify("Collection synchronized successfully", { variant: "success" })

            if (process.env.NODE_ENV !== "development") {
                // keep logs in dev
                framer.closePlugin()
            }
        } catch (error) {
            console.error("Failed to sync collection:", error)
            framer.notify(`Failed to sync collection, ${error instanceof Error ? error.message : "Unknown error"}`, {
                variant: "error",
            })
        }
    }

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setIsLoading(true)

        try {
            await framer.setPluginData("greenhouse", spaceId)
            // check if spaceId is valid

            const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${spaceId}`)
            if (!response.ok) {
                throw new Error("Invalid space ID")
            }

            const collection = await framer.getManagedCollection()
            await collection.setPluginData("spaceId", spaceId)

            await sync()

            // initContentful(contentfulConfig)

            // // Store the content type ID and Contentful credentials for future syncs
            // const collection = await framer.getManagedCollection()
            // await collection.setPluginData("spaceId", contentfulConfig.space)
            // await collection.setPluginData("accessToken", contentfulConfig.accessToken)
            // framer.setPluginData("contentful", JSON.stringify(contentfulConfig))

            // const contentTypes = await getContentTypes()
            // console.log(
            //     "Available content types:",
            //     contentTypes.map(ct => ({
            //         id: ct.sys.id,
            //         name: ct.name,
            //         fields: ct.fields.map(f => ({
            //             id: f.id,
            //             name: f.name,
            //             type: f.type,
            //         })),
            //     }))
            // )

            // // Filter out content types with no entries
            // const contentTypesWithEntries = await Promise.all(
            //     contentTypes.map(async contentType => {
            //         const entries = await getEntriesForContentType(contentType.sys.id)
            //         // console.log(
            //         //     `Content type ${contentType.name} (${contentType.sys.id}) has ${entries.length} entries`
            //         // )
            //         return entries.length > 0 ? contentType : null
            //     })
            // )

            // console.log("contentTypesWithEntries", JSON.stringify(contentTypesWithEntries, null, 2))
            // setContentfulContentTypes(contentTypesWithEntries.filter((ct): ct is NonNullable<typeof ct> => ct !== null))
            setIsConfigured(true)
        } catch (error) {
            framer.notify("Failed to connect to Contentful", { variant: "error" })
            console.error("Failed to connect to Contentful", error)
        } finally {
            setIsLoading(false)
        }
    }

    // const importContentType = async (contentTypeId: string) => {
    //     setIsLoading(true)
    //     try {
    //         // console.log("Importing contentful data for content type ID:", contentTypeId)

    //         // const collection = await framer.getManagedCollection()
    //         // await collection.setPluginData("contentTypeId", contentTypeId)

    //         await sync()
    //     } catch (error) {
    //         console.error("Failed to import collection:", error)
    //         if (error instanceof Error) {
    //             framer.notify(`Import failed: ${error.message}`, { variant: "error" })
    //         } else {
    //             framer.notify("Failed to import collection", { variant: "error" })
    //         }
    //     } finally {
    //         setIsLoading(false)
    //     }
    // }

    return (
        <div className="export-collection">
            {!isConfigured ? (
                <form onSubmit={onSubmit} className="contentful-config">
                    <h2>Configure Greenhouse</h2>
                    {/* <input
                        type="text"
                        placeholder="Space ID"
                        value={contentfulConfig.space}
                        onChange={e => setContentfulConfig(prev => ({ ...prev, space: e.target.value }))}
                        required
                        disabled={isLoading}
                    />
                    <input
                        type="text"
                        placeholder="Access Token"
                        value={contentfulConfig.accessToken}
                        onChange={e => setContentfulConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                        required
                        disabled={isLoading}
                    /> */}
                    <input
                        type="text"
                        placeholder="Space ID"
                        value={spaceId}
                        onChange={e => setSpaceId(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? "Connecting..." : "Connect"}
                    </button>
                </form>
            ) : (
                <>
                    <div className="contentful-content-types">
                        <h3>Available Content Types</h3>
                        <div className="content-type-list">
                            {/* {isLoading ? (
                                <p>Loading content types...</p>
                            ) : contentfulContentTypes.length === 0 ? (
                                <p>No content types with entries found</p>
                            ) : (
                                contentfulContentTypes.map(contentType => (
                                    <button
                                        key={contentType.sys.id}
                                        onClick={() => importContentType(contentType.sys.id)}
                                        className="content-type-button"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "Importing..." : `Import ${contentType.name}`}
                                    </button>
                                ))
                            )} */}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
