import { RenderingEngine } from '@cornerstonejs/core'
import { type Types } from '@cornerstonejs/tools'
import { Abstracter } from '@/components'
import { useViewerStore } from '@/stores/mpr'

interface Props {
    cornerstone: any
    cornerstoneTools: any
    renderingEngine: RenderingEngine
    toolGroup: Types.IToolGroup
    imageIds: string[]
}

export default function Sagittal({
    cornerstone,
    cornerstoneTools,
    renderingEngine,
    toolGroup,
    imageIds,
}: Props) {
    const { sagittalCurrentImageStackIndex, setSagittalCurrentImageStackIndex } = useViewerStore()
    return (
        <Abstracter
            cornerstone={cornerstone}
            cornerstoneTools={cornerstoneTools}
            renderingEngine={renderingEngine}
            toolGroup={toolGroup}
            viewportId="viewport-sagittal"
            imageIds={imageIds}
            currentImageStackIndex={sagittalCurrentImageStackIndex}
            setCurrentImageStackIndex={setSagittalCurrentImageStackIndex}
        />
    )
}
