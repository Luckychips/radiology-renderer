import { useEffect, useRef, useState } from 'react'
import { RenderingEngine } from '@cornerstonejs/core'
import { type Types } from '@cornerstonejs/tools'
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData'
import vtkPoints from '@kitware/vtk.js/Common/Core/Points'
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray'
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper'
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor'
import { data, getCenterFromBounds, getCalculatedOrigin, getCalculatedPoint1, getCalculatedPoint2 } from '@/cores/xyz.ts'
import { useViewerStore } from '@/stores/mpr'

interface Props {
    cornerstone: any
    renderingEngine: RenderingEngine
    toolGroup: Types.IToolGroup
    viewportId: string
    imageIds: string[]
}

export default function Volume3d({ cornerstone, renderingEngine, toolGroup, viewportId, imageIds }: Props) {
    const { axialCurrentImageStackIndex, coronalCurrentImageStackIndex, sagittalCurrentImageStackIndex } = useViewerStore()
    const elementRef = useRef<HTMLDivElement>(null)
    const axialActorRef = useRef<any>(null)
    const axialPointsRef = useRef<any>(null)
    const coronalActorRef = useRef<any>(null)
    const coronalPointsRef = useRef<any>(null)
    const sagittalActorRef = useRef<any>(null)
    const sagittalPointsRef = useRef<any>(null)
    const [isInitialized, setIsInitialized] = useState(false)

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
        const distance = 1
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
        const points = vtkPoints.newInstance()
        points.setNumberOfPoints(4)

        const p3 = [
            p1[0] + p2[0] - origin[0],
            p1[1] + p2[1] - origin[1],
            p1[2] + p2[2] - origin[2]
        ]

        points.setPoint(0, origin[0], origin[1], origin[2])
        points.setPoint(1, p1[0], p1[1], p1[2])
        points.setPoint(2, p3[0], p3[1], p3[2])
        points.setPoint(3, p2[0], p2[1], p2[2])

        const polys = vtkCellArray.newInstance({
            values: new Uint32Array([4,0,1,2,3])
        })

        const polydata = vtkPolyData.newInstance()
        polydata.setPoints(points)
        polydata.setPolys(polys)

        const mapper = vtkMapper.newInstance()
        mapper.setInputData(polydata)

        const actor = vtkActor.newInstance()
        actor.setMapper(mapper)

        actor.getProperty().setColor(...color)
        actor.getProperty().setOpacity(0.35)
        actor.getProperty().setLighting(false)

        return { actor, points }
    }

    const initializePlanes = (volumeId: string, viewport: any) => {
        const volumeActor = viewport.getActors().find((a: any)=> {
            return a.referencedId === volumeId
        }).actor
        const imageData = volumeActor.getMapper().getInputData()
        const bounds = imageData.getBounds()
        const center = getCenterFromBounds(bounds)
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

        const axialCoordinate = [center[0], center[1], bounds[5]]
        const axialOrigin = getCalculatedOrigin(axialCoordinate, row, col, width, height)
        const axialPoint1 = getCalculatedPoint1(axialCoordinate, row, col, width, height)
        const axialPoint2 = getCalculatedPoint2(axialCoordinate, row, col, width, height)
        const { actor: axialActor, points: axialPoints } = createPlaneActor(axialOrigin, axialPoint1, axialPoint2, data.appearance.color.red)
        axialActorRef.current = axialActor
        axialPointsRef.current = axialPoints
        renderer.addActor(axialActor)

        const coronalOrigin = getCalculatedOrigin(center, row, normal, width, depth)
        const coronalPoint1 = getCalculatedPoint1(center, row, normal, width, depth)
        const coronalPoint2 = getCalculatedPoint2(center, row, normal, width, depth)
        const { actor: coronalActor, points: coronalPoints } = createPlaneActor(coronalOrigin, coronalPoint1, coronalPoint2, data.appearance.color.green)
        coronalActorRef.current = coronalActor
        coronalPointsRef.current = coronalPoints
        renderer.addActor(coronalActor)

        const sagittalOrigin = getCalculatedOrigin(center, col, normal, height, depth)
        const sagittalPoint1 = getCalculatedPoint1(center, col, normal, height, depth)
        const sagittalPoint2 = getCalculatedPoint2(center, col, normal, height, depth)
        const { actor: sagittalActor, points: sagittalPoints } = createPlaneActor(sagittalOrigin, sagittalPoint1, sagittalPoint2, data.appearance.color.blue)
        sagittalActorRef.current = sagittalActor
        sagittalPointsRef.current = sagittalPoints
        renderer.addActor(sagittalActor)
        viewport.render()
    }

    const getRenderingPipelines = (viewportId: string) => {
        const viewport = renderingEngine.getViewport(viewportId)
        const renderer = viewport.getRenderer()
        const volumeActor = viewport.getActors()[0].actor
        const imageData = volumeActor.getMapper().getInputData()

        return { viewport, renderer, imageData }
    }

    const getMetaData = (imageData: any) => {
        const newBounds = imageData.getBounds()
        const data: any = {
            bounds: newBounds,
            center: getCenterFromBounds(newBounds),
            width: newBounds[1] - newBounds[0],
            height: newBounds[3] - newBounds[2],
            depth: newBounds[5] - newBounds[4],
        }

        if (imageData.hasOwnProperty('getSpacing')) {
            data.spacing2 = imageData.getSpacing()
        }

        if (imageData.hasOwnProperty('getDimensions')) {
            data.dims = imageData.getDimensions()
        }

        return data
    }

    useEffect(() => {
        (async () => {
            if (cornerstone && imageIds.length) {
                const { volumeId } = await initializeVolume()
                const viewport: any = renderingEngine.getViewport(viewportId)
                const { actor } = initializeModel(viewport)
                initializeCamera(viewport, actor)
                initializePlanes(volumeId, viewport)
                setIsInitialized(true)
            }
        })()

        return () => {
            toolGroup.removeViewports(viewportId, renderingEngine.id)
        }
    }, [cornerstone, imageIds])

    useEffect(() => {
        if (isInitialized) {
            const imagePlane = cornerstone.metaData.get('imagePlaneModule', imageIds[axialCurrentImageStackIndex])
            if (imagePlane) {
                const coordinate = imagePlane.imagePositionPatient
                const orientation = imagePlane.imageOrientationPatient
                const imageData = axialActorRef.current.getMapper().getInputData()
                const { width, height, center } = getMetaData(imageData)
                const newCoordinate = [center[0], center[1], coordinate[2]]
                const row = orientation.slice(0,3)
                const col = orientation.slice(3,6)
                const newOrigin = getCalculatedOrigin(newCoordinate, row, col, width, height)
                const newP1 = getCalculatedPoint1(newCoordinate, row, col, width, height)
                const newP2 = getCalculatedPoint2(newCoordinate, row, col, width, height)
                const viewport = renderingEngine.getViewport(viewportId)
                const renderer = viewport.getRenderer()
                renderer.removeActor(axialActorRef.current)
                const { actor: newActor, points: newPoints } = createPlaneActor(newOrigin, newP1, newP2, data.appearance.color.red)
                axialActorRef.current = newActor
                axialPointsRef.current = newPoints
                renderer.addActor(newActor)
                viewport.render()
            }
        }
    }, [isInitialized, axialCurrentImageStackIndex])

    useEffect(() => {
        if (isInitialized) {
            const { viewport, renderer, imageData } = getRenderingPipelines(viewportId)
            const { spacing2, dims, center, width, depth } = getMetaData(imageData)
            const centerIndex = Math.floor(dims[1] / 2)
            const offset = (coronalCurrentImageStackIndex - centerIndex) * spacing2[1]
            const newCoordinate = [center[0], center[1] + offset, center[2]]
            const row = data.orientation.row
            const normal = data.orientation.normal
            const newOrigin = getCalculatedOrigin(newCoordinate, row, normal, width, depth)
            const newP1 = getCalculatedPoint1(newCoordinate, row, normal, width, depth)
            const newP2 = getCalculatedPoint2(newCoordinate, row, normal, width, depth)

            renderer.removeActor(coronalActorRef.current)
            const { actor } = createPlaneActor(newOrigin, newP1, newP2, data.appearance.color.green)
            coronalActorRef.current = actor
            renderer.addActor(actor)
            viewport.render()
        }
    }, [isInitialized, coronalCurrentImageStackIndex])

    useEffect(() => {
        if (isInitialized) {
            const { viewport, renderer, imageData } = getRenderingPipelines(viewportId)
            const { spacing2, dims, center, height, depth } = getMetaData(imageData)
            const centerIndex = Math.floor(dims[0] / 2)
            const offset = (sagittalCurrentImageStackIndex - centerIndex) * spacing2[0]
            const newCoordinate = [center[0] + offset, center[1], center[2]]
            const col = data.orientation.col
            const normal = data.orientation.normal
            const newOrigin = getCalculatedOrigin(newCoordinate, col, normal, height, depth)
            const newP1 = getCalculatedPoint1(newCoordinate, col, normal, height, depth)
            const newP2 = getCalculatedPoint2(newCoordinate, col, normal, height, depth)

            renderer.removeActor(sagittalActorRef.current)
            const { actor: newActor, points: newPoints } = createPlaneActor(newOrigin, newP1, newP2, data.appearance.color.blue)
            sagittalActorRef.current = newActor
            sagittalPointsRef.current = newPoints
            renderer.addActor(newActor)
            viewport.render()
        }
    }, [isInitialized, sagittalCurrentImageStackIndex])

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
