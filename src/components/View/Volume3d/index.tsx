import { useEffect, useRef } from 'react'
import { RenderingEngine } from '@cornerstonejs/core'
import { type Types } from '@cornerstonejs/tools'
import vtkPlaneSource from '@kitware/vtk.js/Filters/Sources/PlaneSource'
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper'
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor'

// todo - axial plane 초기 위치 변경
// todo - image stack index 이동 시 plane 이동되게끔

interface Props {
    cornerstone: any
    renderingEngine: RenderingEngine
    toolGroup: Types.IToolGroup
    viewportId: string
    imageIds: string[]
}

export default function Volume3D({ cornerstone, renderingEngine, toolGroup, viewportId, imageIds }: Props) {
    const elementRef = useRef<HTMLDivElement>(null)

    const initializeVolume = async () => {
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
        return { volume, volumeId }
    }

    const initializeModel = (viewport: any) => {
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
        return { actor }
    }

    const initializeCamera = (viewport: any, actor: any) => {
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

        return { firstSlicePosition, sliceNormal, colCosines, rowCosines }
    }

    const createPlaneActor = (
        origin: number[],
        p1: number[],
        p2: number[],
        color: number[]
    ) => {
        const plane = vtkPlaneSource.newInstance()

        plane.setOrigin(...origin)
        plane.setPoint1(...p1)
        plane.setPoint2(...p2)

        const mapper = vtkMapper.newInstance()
        mapper.setInputConnection(plane.getOutputPort())

        const actor = vtkActor.newInstance()
        actor.setMapper(mapper)

        actor.getProperty().setColor(...color)
        actor.getProperty().setOpacity(0.35)

        return actor
    }

    /**
     *
     * @param coordinate  - 3d volume center position (x, y, z)
     * @param vector1     - direction vector (axial,coronal:row, sagittal:col)
     * @param vector2     - direction vector (axial:col, coronal,sagittal:normal)
     * @param horizontal  - volume size (axial,coronal:width, sagittal:height)
     * @param vertical    - volume size (axial:height, coronal,sagittal:depth)
     */
    const getCalculatedOrigin = (
        coordinate: number[],
        vector1: number[],
        vector2: number[],
        horizontal: number,
        vertical: number,
    ) => {
        return [
            coordinate[0] - vector1[0] * horizontal / 2 - vector2[0] * vertical / 2,
            coordinate[1] - vector1[1] * horizontal / 2 - vector2[1] * vertical / 2,
            coordinate[2] - vector1[2] * horizontal / 2 - vector2[2] * vertical / 2,
        ]
    }

    const getCalculatedPoint1 = (
        coordinate: number[],
        vector1: number[],
        vector2: number[],
        horizontal: number,
        vertical: number,
    ) => {
        return [
            coordinate[0] + vector1[0] * horizontal / 2 - vector2[0] * vertical / 2,
            coordinate[1] + vector1[1] * horizontal / 2 - vector2[1] * vertical / 2,
            coordinate[2] + vector1[2] * horizontal / 2 - vector2[2] * vertical / 2,
        ]
    }

    const getCalculatedPoint2 = (
        coordinate: number[],
        vector1: number[],
        vector2: number[],
        horizontal: number,
        vertical: number,
    ) => {
        return [
            coordinate[0] - vector1[0] * horizontal / 2 + vector2[0] * vertical / 2,
            coordinate[1] - vector1[1] * horizontal / 2 + vector2[1] * vertical / 2,
            coordinate[2] - vector1[2] * horizontal / 2 + vector2[2] * vertical / 2,
        ]
    }

    const initializePlanes = (volumeId: string, viewport: any) => {
        const volumeActor = viewport.getActors().find((a: any)=> {
            return a.referencedId === volumeId
        }).actor
        const imageData = volumeActor.getMapper().getInputData()
        const bounds = imageData.getBounds()
        const center = [
            (bounds[0] + bounds[1]) / 2,
            (bounds[2] + bounds[3]) / 2,
            (bounds[4] + bounds[5]) / 2
        ]

        const dims = imageData.getDimensions()
        const spacing = imageData.getSpacing()
        const width = dims[0] * spacing[0]
        const height = dims[1] * spacing[1]
        const depth = dims[2] * spacing[2]
        const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageIds[0])
        const orientation = imagePlane.imageOrientationPatient
        const row = orientation.slice(0, 3)
        const col = orientation.slice(3, 6)
        const normal = [
            row[1] * col[2] - row[2] * col[1],
            row[2] * col[0] - row[0] * col[2],
            row[0] * col[1] - row[1] * col[0]
        ]

        const renderer = viewport.getRenderer()

        const axialOrigin = getCalculatedOrigin(center, row, col, width, height)
        const axialPoint1 = getCalculatedPoint1(center, row, col, width, height)
        const axialPoint2 = getCalculatedPoint2(center, row, col, width, height)
        const axialColor = [1,0,0]
        const axialActor = createPlaneActor(axialOrigin, axialPoint1, axialPoint2, axialColor)
        renderer.addActor(axialActor)

        const coronalOrigin = getCalculatedOrigin(center, row, normal, width, depth)
        const coronalPoint1 = getCalculatedPoint1(center, row, normal, width, depth)
        const coronalPoint2 = getCalculatedPoint2(center, row, normal, width, depth)
        const coronalColor = [0,1,0]
        const coronalActor = createPlaneActor(coronalOrigin, coronalPoint1, coronalPoint2, coronalColor)
        renderer.addActor(coronalActor)

        const sagittalOrigin = getCalculatedOrigin(center, col, normal, height, depth)
        const sagittalPoint1 = getCalculatedPoint1(center, col, normal, height, depth)
        const sagittalPoint2 = getCalculatedPoint2(center, col, normal, height, depth)
        const sagittalColor = [0,0,1]
        const sagittalActor = createPlaneActor(sagittalOrigin, sagittalPoint1, sagittalPoint2, sagittalColor)
        renderer.addActor(sagittalActor)

        viewport.render()
    }

    useEffect(() => {
        (async () => {
            if (cornerstone && imageIds.length) {
                const { volumeId } = await initializeVolume()
                const viewport: any = renderingEngine.getViewport(viewportId)
                const { actor } = initializeModel(viewport)
                initializeCamera(viewport, actor)
                initializePlanes(volumeId, viewport)
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
