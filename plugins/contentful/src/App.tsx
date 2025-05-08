import "./App.css"

import { type ManagedCollection } from "framer-plugin"
import { useEffect, useState } from "react"
import { type DataSource, getDataSource } from "./data"
import { FieldMapping } from "./FieldMapping"
import { SelectDataSource } from "./SelectDataSource"
import type { ContentType } from "contentful"
import type { Credential } from "./lib/utils"
import { getContentTypes, initContentful } from "./lib/space"

interface AppProps {
    collection: ManagedCollection
    storedCredentials: Credential
    previousDataSourceId: string | null
    previousSlugFieldId: string | null
}

export function App({ collection, storedCredentials, previousDataSourceId, previousSlugFieldId }: AppProps) {
    const [dataSource, setDataSource] = useState<DataSource | null>(null)

    // For manage button
    useEffect(() => {
        if (!previousDataSourceId) {
            return
        }

        initContentful(storedCredentials)
        getContentTypes().then(contentTypes => {
            getDataSource(
                contentTypes.find((contentType: ContentType) => contentType.sys.id === previousDataSourceId)!
            ).then(setDataSource)
        })
    }, [previousDataSourceId, storedCredentials])

    // Datasource screen selection
    if (!dataSource) {
        if (!previousDataSourceId) {
            return <SelectDataSource onSelectDataSource={setDataSource} storedCredentials={storedCredentials} />
        }

        return (
            <main className="loading">
                <div className="framer-spinner" />
            </main>
        )
    }

    return <FieldMapping collection={collection} dataSource={dataSource} initialSlugFieldId={previousSlugFieldId} />
}
