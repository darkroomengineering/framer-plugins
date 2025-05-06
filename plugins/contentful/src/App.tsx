import "./App.css"

import { framer, type ManagedCollection } from "framer-plugin"
import { useEffect, useLayoutEffect, useState } from "react"
import { type DataSource, getDataSource } from "./data"
import { FieldMapping } from "./FieldMapping"
import { SelectDataSource } from "./SelectDataSource"
import type { ContentType } from "contentful"
import type { Credentials } from "./lib/utils"
import { getContentTypes, initContentful } from "./lib/space"

interface AppProps {
    collection: ManagedCollection
    storedCredentials: Credentials
    previousDataSourceId: string | null
    previousSlugFieldId: string | null
}

export function App({ collection, storedCredentials, previousDataSourceId, previousSlugFieldId }: AppProps) {
    const [dataSource, setDataSource] = useState<DataSource | null>(null)

    // UI load
    useLayoutEffect(() => {
        const hasDataSourceSelected = Boolean(dataSource)

        framer.showUI({
            width: hasDataSourceSelected ? 340 : 320,
            height: hasDataSourceSelected ? 425 : 385,
            minWidth: hasDataSourceSelected ? 340 : 320,
            minHeight: hasDataSourceSelected ? 425 : 345,
            resizable: hasDataSourceSelected,
        })
    }, [dataSource])

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
    if (!dataSource && !previousDataSourceId) {
        return <SelectDataSource onSelectDataSource={setDataSource} storedCredentials={storedCredentials} />
    } else if (!dataSource) {
        return (
            <main className="loading">
                <div className="framer-spinner" />
            </main>
        )
    }

    return <FieldMapping collection={collection} dataSource={dataSource} initialSlugFieldId={previousSlugFieldId} />
}
