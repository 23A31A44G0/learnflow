import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GamificationProvider } from './context/GamificationContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import Analytics from './pages/Analytics';
import SpacedRepetition from './pages/SpacedRepetition';
import LearnSpace from './pages/LearnSpace';
import MetacognitiveDashboard from './pages/MetacognitiveDashboard';
import GamificationDashboard from './pages/GamificationDashboard';
import Navbar from './components/Navbar';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/practice/:id" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Practice />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/spaced-repetition" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <SpacedRepetition />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/learn" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <LearnSpace />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/metacognitive" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <MetacognitiveDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/gamification" 
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <GamificationDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Router>
      </GamificationProvider>
    </AuthProvider>
  );
}

export default App;
