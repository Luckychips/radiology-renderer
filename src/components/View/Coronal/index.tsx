import { RenderingEngine } from '@cornerstonejs/core'
import { type Types } from '@cornerstonejs/tools'
import { Abstracter } from '@/components'

interface Props {
    cornerstone: any
    cornerstoneTools: any
    renderingEngine: RenderingEngine
    toolGroup: Types.IToolGroup
    imageIds: string[]
}

export default function Coronal({
    cornerstone,
    cornerstoneTools,
    renderingEngine,
    toolGroup,
    imageIds,
}: Props) {
    return (
        <Abstracter
            cornerstone={cornerstone}
            cornerstoneTools={cornerstoneTools}
            renderingEngine={renderingEngine}
            toolGroup={toolGroup}
            viewportId="viewport-coronal"
            imageIds={imageIds}
        />
    )
}
