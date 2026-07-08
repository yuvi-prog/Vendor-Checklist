import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import VendorDetail from './pages/VendorDetail.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/vendors/:id" element={<VendorDetail />} />
    </Routes>
  )
}

export default App
