import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Home from './pages/Home';
import RecipeDetail from './pages/RecipeDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import RecipeForm from './pages/admin/RecipeForm';
import CategoryManager from './pages/admin/CategoryManager';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes for Crew and Admin */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'crew']}>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/resep/:id" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'crew']}>
                <RecipeDetail />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes for Admin only */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/resep/tambah" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RecipeForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/resep/edit/:id" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RecipeForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/kategori" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CategoryManager />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;