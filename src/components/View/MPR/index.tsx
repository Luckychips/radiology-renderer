import { type ChangeEvent, useState, useEffect, useRef } from 'react'
import { RenderingEngine } from '@cornerstonejs/core'
import { Types, ToolGroupManager, PanTool, ZoomTool, TrackballRotateTool } from '@cornerstonejs/tools'
import { Axial, Coronal, Sagittal, Volume3d } from '@/components'
import { setupCornerstone } from '@/cores/setup'

export default function MPR() {
    const dicomLoaderRef = useRef<any>(null)
    const [cs, setCs] = useState<any>(null)
    const [ct, setCt] = useState<any>(null)
    const [renderingEngine, setRenderingEngine] = useState<RenderingEngine | null>(null)
    const [toolGroup, setToolGroup] = useState<Types.IToolGroup | null>(null)
    const [imageIds, setImageIds] = useState<string[]>([])

    const addNewTool = (newToolGroup:  Types.IToolGroup, toolName: any) => {
        if (!newToolGroup.hasTool(toolName)) {
            newToolGroup.addTool(toolName)
        }
    }

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const dicomParser = await import('dicom-parser')
        const ids: {
            instanceNumber: number
            imageId: string
        }[] = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const byteArray = new Uint8Array(await file.arrayBuffer())
            const dataSet = dicomParser.parseDicom(byteArray)
            const instanceNumber = dataSet.intString('x00200013')!
            // const imagePosition = dataSet.string('x00200032');
            // const sliceLocation = dataSet.string('x00201041');
            // const seriesUID = dataSet.string('x0020000e');
            const imageId = dicomLoaderRef.current.wadouri.fileManager.add(file)
            ids.push({ instanceNumber, imageId })
        }

        if (cs) {
            const sorted = ids.sort((a, b) => {
                return a.instanceNumber - b.instanceNumber
            }).map((item) => {
                return item.imageId
            });

            setImageIds(sorted)
        }
    }

    useEffect(() => {
        (async () => {
            const { cornerstone, cornerstoneTools, dicomImageLoader } = await setupCornerstone()
            dicomLoaderRef.current = dicomImageLoader
            setCs(cornerstone)
            setCt(cornerstoneTools)
            setRenderingEngine(new cornerstone.RenderingEngine('mpr-viewer-engine'))
            const newToolGroup =  ToolGroupManager.getToolGroup('mainToolGroup') || ToolGroupManager.createToolGroup('mainToolGroup')
            if (newToolGroup) {
                addNewTool(newToolGroup, PanTool.toolName)
                addNewTool(newToolGroup, ZoomTool.toolName)
                addNewTool(newToolGroup, TrackballRotateTool.toolName)

                // newToolGroup.setToolActive(PanTool.toolName, {
                //     bindings: [{ mouseButton: 1 }],
                // })
                newToolGroup.setToolActive(TrackballRotateTool.toolName, {
                    bindings: [{ mouseButton: 1 }],
                })

                setToolGroup(newToolGroup)
            }
        })()

        return () => {
            renderingEngine?.destroy()
        }
    }, [])

    return (
        <div>
            <div className="h-[4vh]">
                <input type="file" id="fileInput" multiple onChange={onChange} />
            </div>
            {(renderingEngine && toolGroup) && (
                <>
                    <div className="w-full h-[48vh] flex">
                        <Axial
                            renderingEngine={renderingEngine}
                            toolGroup={toolGroup}
                            cornerstone={cs}
                            cornerstoneTools={ct}
                            imageIds={imageIds}
                        />
                        <Coronal
                            renderingEngine={renderingEngine}
                            toolGroup={toolGroup}
                            cornerstone={cs}
                            cornerstoneTools={ct}
                            imageIds={imageIds}
                        />
                    </div>
                    <div className="w-full h-[48vh] flex">
                        <Sagittal
                            renderingEngine={renderingEngine}
                            toolGroup={toolGroup}
                            cornerstone={cs}
                            cornerstoneTools={ct}
                            imageIds={imageIds}
                        />
                        <Volume3d
                            renderingEngine={renderingEngine}
                            toolGroup={toolGroup}
                            cornerstone={cs}
                            viewportId="viewport-3d"
                            imageIds={imageIds}
                        />
                    </div>
                </>
            )}
        </div>
    )
}
