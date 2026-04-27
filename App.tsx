import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast'; // IMPORT INI WAJIB ADA

import Home from './pages/Home';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManager from './pages/admin/CategoryManager';
import RecipeForm from './pages/admin/RecipeForm';
import RecipeDetail from './pages/RecipeDetail';
import OurTeam from './pages/OurTeam';
import CrewManagement from './pages/CrewManagement';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* WADAH NOTIFIKASI GLOBAL (Posisikan di atas agar selalu muncul) */}
        <Toaster 
          position="top-center" 
          toastOptions={{ 
            style: { borderRadius: '20px', background: '#333', color: '#fff', fontSize: '14px', fontWeight: 'bold' }
          }} 
        />
        
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute allowedRoles={['admin', 'crew']}><Home /></ProtectedRoute>} />
          <Route path="/resep/:id" element={<ProtectedRoute allowedRoles={['admin', 'crew']}><RecipeDetail /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/kategori" element={<ProtectedRoute allowedRoles={['admin']}><CategoryManager /></ProtectedRoute>} />
          <Route path="/admin/resep/baru" element={<ProtectedRoute allowedRoles={['admin']}><RecipeForm /></ProtectedRoute>} />
          <Route path="/admin/resep/edit/:id" element={<ProtectedRoute allowedRoles={['admin']}><RecipeForm /></ProtectedRoute>} />

          <Route path="/our-team" element={<ProtectedRoute allowedRoles={['admin', 'crew']}><OurTeam /></ProtectedRoute>} />
          <Route path="/crew" element={<ProtectedRoute allowedRoles={['admin']}><CrewManagement /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;