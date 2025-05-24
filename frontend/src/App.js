import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Report from './components/Report'; // Assuming Report component will be created
import { CContainer } from '@coreui/react';

function App() {
  return (
    <Router>
      <CContainer className="mt-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </CContainer>
    </Router>
  );
}

export default App; 