import { useEffect, useRef } from 'react'
import { RenderingEngine } from '@cornerstonejs/core'
import { type Types } from '@cornerstonejs/tools'

interface Props {
    cornerstone: any
    renderingEngine: RenderingEngine
    toolGroup: Types.IToolGroup
    viewportId: string
    imageIds: string[]
}

export default function Volume3D({ cornerstone, renderingEngine, toolGroup, viewportId, imageIds }: Props) {
    const elementRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        (async () => {
            if (cornerstone && imageIds.length) {
                await import('@cornerstonejs/streaming-image-volume-loader')
                const {
                    Enums,
                    imageLoader,
                    volumeLoader,
                    setVolumesForViewports,
                } = cornerstone
                await Promise.all(imageIds.map(id => imageLoader.loadAndCacheImage(id)))
                const volumeId = `cornerstoneStreamingImageVolume:${Date.now()}`
                renderingEngine.enableElement({
                    viewportId,
                    type: Enums.ViewportType.VOLUME_3D,
                    element: elementRef.current!,
                    defaultOptions: {
                        background: [0, 0, 0],
                    },
                })

                const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds })
                await volume.load()

                await setVolumesForViewports(
                    renderingEngine,
                    [{ volumeId }],
                    [viewportId]
                )

                toolGroup.addViewport(viewportId, renderingEngine.id)

                const viewport: any = renderingEngine.getViewport(viewportId)

                const actorEntry = viewport.getActors()[0]
                const actor = actorEntry.actor
                const property = actor.getProperty()

                const opacity = property.getScalarOpacity()
                opacity.removeAllPoints()
                opacity.addPoint(0, 0)
                opacity.addPoint(1, 0.05)
                opacity.addPoint(2, 0.2)
                opacity.addPoint(4, 0.6)
                opacity.addPoint(8, 1)

                const rgb = property.getRGBTransferFunction(0)
                rgb.removeAllPoints()
                rgb.addRGBPoint(0, 0,0,0)
                rgb.addRGBPoint(2, 0,0,1)
                rgb.addRGBPoint(4, 1,0,0)
                rgb.addRGBPoint(8, 1,1,0)

                // volume smooth rendering
                property.setInterpolationTypeToLinear()
                property.setShade(true)

                const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageIds[0])
                const firstSlicePosition = imagePlane.imagePositionPatient
                const orientation = imagePlane.imageOrientationPatient
                const rowCosines = orientation.slice(0, 3)
                const colCosines = orientation.slice(3, 6)
                const sliceNormal = [
                    rowCosines[1] * colCosines[2] - rowCosines[2] * colCosines[1],
                    rowCosines[2] * colCosines[0] - rowCosines[0] * colCosines[2],
                    rowCosines[0] * colCosines[1] - rowCosines[1] * colCosines[0],
                ]
                const distance = 1500
                const cameraPosition = [
                    firstSlicePosition[0] + sliceNormal[0] * distance,
                    firstSlicePosition[1] + sliceNormal[1] * distance,
                    firstSlicePosition[2] + sliceNormal[2] * distance,
                ]

                viewport.setCamera({
                    focalPoint: firstSlicePosition,
                    position: cameraPosition,
                    viewUp: [-colCosines[0], -colCosines[1], -colCosines[2]],
                })
                actor.setScale([-1, 1, 1])

                viewport.resetCamera()
                viewport.render()
            }
        })()

        return () => {
            toolGroup.removeViewports(viewportId, renderingEngine.id)
        }
    }, [cornerstone, imageIds])

    return (
        <section className="relative w-[50vw] h-full">
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
