'use client'
import { useEffect } from 'react'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import cornerstone from 'cornerstone-core'
import dicomParser from 'dicom-parser'

export default function Renderer() {
    useEffect(() => {
        cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
        cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

        cornerstoneWADOImageLoader.webWorkerManager.initialize({
            webWorkerPath:
                "https://unpkg.com/cornerstone-wado-image-loader/dist/cornerstoneWADOImageLoaderWebWorker.js",
            taskConfiguration: {
                decodeTask: {
                    initializeCodecsOnStartup: true,
                },
            },
        });

        const element = document.getElementById("dicomImage");
        cornerstone.enable(element);

        const inputElement = document.getElementById("fileInput");
        if (inputElement) {
            inputElement.addEventListener("change", function (e) {
                const input = e.target as HTMLInputElement;
                if (input.files) {
                    const file = input.files[0];

                    const imageId =
                        cornerstoneWADOImageLoader.wadouri.fileManager.add(file);

                    cornerstone.loadImage(imageId).then(function (image: any) {
                        cornerstone.displayImage(element, image);
                    });
                }
            });
        }
    }, [])

    return (
        <>
            <input type="file" id="fileInput" accept=".dcm" />
            <div id="dicomImage" style={{ width: 512, height: 512 }} />
        </>
    )
}
