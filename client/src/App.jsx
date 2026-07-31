import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import VendorDetail from './pages/VendorDetail.jsx'
import Templates from './pages/Templates.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/vendors/:id" element={<VendorDetail />} />
      <Route path="/templates" element={<Templates />} />
    </Routes>
  )
}

export default App
