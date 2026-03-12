import { useEffect, useRef, useState } from 'react'
import { type Types as CoreTypes, RenderingEngine } from '@cornerstonejs/core'
import { type Types } from '@cornerstonejs/tools'
import { ImageStackPager } from '@/components'

interface Props {
    cornerstone: any
    cornerstoneTools: any
    renderingEngine: RenderingEngine
    toolGroup: Types.IToolGroup
    viewportId: string
    imageIds: string[]
    currentImageStackIndex: number
    setCurrentImageStackIndex: (v: number) => void
}

export default function Abstracter({
    cornerstone,
    cornerstoneTools,
    renderingEngine,
    toolGroup,
    viewportId,
    imageIds,
    currentImageStackIndex,
    setCurrentImageStackIndex,
}: Props) {
    const elementRef = useRef<HTMLDivElement>(null)
    const [totalImageStackCount, setTotalImageStackCount] = useState(0)

    useEffect(() => {
        if (cornerstone && cornerstoneTools) {
            const { Enums } = cornerstone
            if (viewportId.includes('axial')) {
                renderingEngine.enableElement({
                    viewportId,
                    type: Enums.ViewportType.STACK,
                    element: elementRef.current!,
                })
                renderingEngine.resize(true)
            } else {
                renderingEngine.enableElement({
                    viewportId,
                    type: Enums.ViewportType.ORTHOGRAPHIC,
                    element: elementRef.current!,
                })
                setTimeout(() => renderingEngine.resize(true), 0)
            }

            toolGroup.addViewport(viewportId, renderingEngine.id)
        }

        return () => {
            toolGroup.removeViewports(viewportId, renderingEngine.id)
        }
    }, [cornerstone, cornerstoneTools]);

    useEffect(() => {
        (async () => {
            if (cornerstone && renderingEngine && imageIds.length) {
                let viewport;
                if (viewportId.includes('axial')) {
                    viewport = renderingEngine.getViewport(viewportId) as any
                    await viewport.setStack(imageIds)
                } else {
                    const { imageLoader, volumeLoader, Enums } = cornerstone
                    await Promise.all(imageIds.map(id => imageLoader.loadImage(id)))
                    const volumeId = `${viewportId}-${Date.now()}`
                    const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds })
                    await volume.load()
                    viewport = renderingEngine.getViewport(viewportId) as CoreTypes.IVolumeViewport
                    await viewport.setVolumes([{ volumeId }])
                    if (viewportId.includes('coronal')) {
                        viewport.setOrientation(Enums.OrientationAxis.CORONAL)
                    } else if (viewportId.includes('sagittal')) {
                        viewport.setOrientation(Enums.OrientationAxis.SAGITTAL)
                    }
                }

                setCurrentImageStackIndex(viewport.getCurrentImageIdIndex())
                setTotalImageStackCount(viewport.getImageIds().length)
                viewport.resetCamera(true)
                viewport.render()
            }
        })()
    }, [cornerstone, renderingEngine, imageIds])

    useEffect(() => {
        if (renderingEngine) {
            if (viewportId.includes('axial')) {
                const viewport: any = renderingEngine.getViewport(viewportId)
                viewport.setImageIdIndex(currentImageStackIndex);
            } else {
                const viewport = renderingEngine.getViewport(viewportId) as CoreTypes.IVolumeViewport
                const camera = viewport.getCamera();
                const axis = camera.viewPlaneNormal!.findIndex(v => Math.abs(v) === 1)
                const imageData = viewport.getImageData()
                if (imageData) {
                    const origin = imageData.origin
                    const spacing = imageData.spacing
                    const worldPosition = origin[axis] + currentImageStackIndex * spacing[axis]
                    const delta = worldPosition - camera.focalPoint![axis]
                    camera.focalPoint![axis] += delta
                    camera.position![axis] += delta
                    viewport.setCamera(camera)
                    viewport.render()
                }
            }
        }
    }, [currentImageStackIndex, renderingEngine])

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
