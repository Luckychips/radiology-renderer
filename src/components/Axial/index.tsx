import { useEffect, useRef } from 'react'
import { RenderingEngine } from '@cornerstonejs/core'
import { Types } from '@cornerstonejs/tools'

interface Props {
    cornerstone: any
    cornerstoneTools: any
    renderingEngine: RenderingEngine
    toolGroup: Types.IToolGroup
    imageIds: string[]
}

export default function Axial({
    cornerstone,
    cornerstoneTools,
    renderingEngine,
    toolGroup,
    imageIds,
}: Props) {
    const elementRef = useRef<HTMLDivElement>(null)
    const viewportId = 'viewport-axial'

    useEffect(() => {
        if (cornerstone && cornerstoneTools) {
            const { Enums } = cornerstone
            renderingEngine.enableElement({
                viewportId,
                type: Enums.ViewportType.STACK,
                element: elementRef.current!,
            })
            renderingEngine.resize(true)
            toolGroup.addViewport(viewportId, renderingEngine.id)
        }

        return () => {
            toolGroup.removeViewports(viewportId, renderingEngine.id)
        }
    }, [cornerstone, cornerstoneTools]);

    useEffect(() => {
        (async () => {
            if (imageIds.length && renderingEngine) {
                const viewport: any = renderingEngine.getViewport(viewportId)
                await viewport.setStack(imageIds)
                viewport.resetCamera(true)
                viewport.render()
            }
        })()
    }, [imageIds, renderingEngine])

    return (
        <section className="w-[50vw] h-full">
            <div
                ref={elementRef}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'black',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    padding: 0,
                    textAlign: 'left',
                }}
            />
        </section>
    )
}
