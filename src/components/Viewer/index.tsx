import { type ChangeEvent, useState, useEffect, useRef } from 'react'
import { setupCornerstone } from '@/cores/setup'
import { Axial, Coronal } from '@/components'

export default function Viewer() {
    const dicomLoaderRef = useRef<any>(null)
    const [cs, setCs] = useState<any>(null)
    const [ct, setCt] = useState<any>(null)
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
        })()
    }, [])

    return (
        <div>
            <div className="h-[4vh]">
                <input type="file" id="fileInput" multiple onChange={onChange} />
            </div>
            <div className="w-full h-[48vh] flex">
                <Axial cornerstone={cs} cornerstoneTools={ct} imageIds={imageIds} />
                <Coronal cornerstone={cs} cornerstoneTools={ct} imageIds={imageIds} />
            </div>
            {/*<div className="w-full h-[48vh] flex">*/}
            {/*    <Axial cornerstone={cs} cornerstoneTools={ct} dicomImageLoader={dil} imageIds={imageIds} />*/}
            {/*    <Axial cornerstone={cs} cornerstoneTools={ct} dicomImageLoader={dil} imageIds={imageIds} />*/}
            {/*</div>*/}
        </div>
    )
}
