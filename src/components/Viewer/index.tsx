import { type ChangeEvent, useState, useEffect, useRef } from 'react'
import { RenderingEngine } from '@cornerstonejs/core'
import { Types, ToolGroupManager, PanTool, ZoomTool, StackScrollTool } from '@cornerstonejs/tools'
import { setupCornerstone } from '@/cores/setup'
import { Axial, Coronal, Sagittal } from '@/components'

export default function Viewer() {
    const dicomLoaderRef = useRef<any>(null)
    const [cs, setCs] = useState<any>(null)
    const [ct, setCt] = useState<any>(null)
    const [renderingEngine, setRenderingEngine] = useState<RenderingEngine | null>(null)
    const [toolGroup, setToolGroup] = useState<Types.IToolGroup | null>(null)
    const [imageIds, setImageIds] = useState<string[]>([])

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const ids: string[] = []
        for (let i = 0; i < files.length; i++) {
            const imageId = dicomLoaderRef.current.wadouri.fileManager.add(files[i])
            ids.push(imageId)
        }

        setImageIds(ids)
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
                newToolGroup.addTool(PanTool.toolName)
                newToolGroup.addTool(ZoomTool.toolName)
                newToolGroup.addTool(StackScrollTool.toolName)
                newToolGroup.setToolActive(PanTool.toolName, {
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
                    </div>
                </>
            )}
        </div>
    )
}
