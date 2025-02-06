import { framer, ManagedCollectionField } from "framer-plugin"
import { forwardRef, Fragment, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useState } from "react"
import { CheckboxTextfield } from "./checkbox-text-field"
import cx from "classnames"
import { useInView } from "react-intersection-observer"
import { ExtendedManagedCollectionField, getFramerFieldFromContentfulField } from "../utils"
import { ContentType } from "contentful"
import { getContentType } from "../contentful"

type CollectionFieldType = ManagedCollectionField["type"]

const FIELD_TYPE_OPTIONS: { type: CollectionFieldType; label: string }[] = [
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

export function Fields({ contentType }: { contentType: ContentType }) {
    console.log({ contentType })

    return <div>{JSON.stringify(contentType)}</div>
}
