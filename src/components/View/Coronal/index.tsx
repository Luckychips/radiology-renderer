import { useEffect, useRef, useState } from 'react'
import { type Types as CoreTypes, RenderingEngine } from '@cornerstonejs/core'
import { type Types } from '@cornerstonejs/tools'
import { ImageStackPager } from '@/components'

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
    const elementRef = useRef<HTMLDivElement>(null)
    const viewportId = 'viewport-coronal'
    const [currentImageStackIndex, setCurrentImageStackIndex] = useState(0)
    const [totalImageStackCount, setTotalImageStackCount] = useState(0)

    useEffect(() => {
        if (cornerstone && cornerstoneTools) {
            const { Enums } = cornerstone
            renderingEngine.enableElement({
                viewportId,
                type: Enums.ViewportType.ORTHOGRAPHIC,
                element: elementRef.current!,
            })
            setTimeout(() => renderingEngine.resize(true), 0)
            toolGroup.addViewport(viewportId, renderingEngine.id)
        }

        return () => {
            toolGroup.removeViewports(viewportId, renderingEngine.id)
        }
    }, [cornerstone, cornerstoneTools]);

    useEffect(() => {
        (async () => {
            if (cornerstone && renderingEngine && imageIds.length) {
                const { imageLoader, volumeLoader, Enums } = cornerstone
                await Promise.all(imageIds.map(id => imageLoader.loadImage(id)))
                const volumeId = 'coronalVolume'
                const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds })
                await volume.load()
                const viewport = renderingEngine.getViewport(viewportId) as CoreTypes.IVolumeViewport
                await viewport.setVolumes([{ volumeId }])
                viewport.setOrientation(Enums.OrientationAxis.CORONAL)
                setCurrentImageStackIndex(viewport.getCurrentImageIdIndex())
                setTotalImageStackCount(viewport.getImageIds().length)
                viewport.resetCamera(true)
                viewport.render()
            }
        })()
    }, [cornerstone, renderingEngine, imageIds])

    return (
        <section className="relative w-[50vw] h-full">
            <ImageStackPager
                currentImageStackIndex={currentImageStackIndex}
                totalImageStackCount={totalImageStackCount}
                setCurrentImageStackIndex={setCurrentImageStackIndex}
            />
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
