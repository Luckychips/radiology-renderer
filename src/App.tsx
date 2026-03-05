import { Viewer } from '@/components'
import { CornerstoneProvider } from '@/cores/provider'

function App() {
  return (
    <main>
        <CornerstoneProvider>
            <Viewer />
        </CornerstoneProvider>
    </main>
  )
}

export default App
