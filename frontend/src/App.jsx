import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeIntelligence from './pages/ResumeIntelligence';
import JobIntelligence from './pages/JobIntelligence';
import JobMatcher from './pages/JobMatcher';
import CareerAssistant from './pages/CareerAssistant';
import InterviewSetup from './pages/InterviewSetup';
import InterviewRoom from './pages/InterviewRoom';
import CareerMentor from './pages/CareerMentor';
import Roadmaps from './pages/Roadmaps';
import SkillMatrix from './pages/SkillMatrix';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      {/* Public Routes with Main Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="resume" element={<ResumeIntelligence />} />
        <Route path="jobs" element={<JobIntelligence />} />
        <Route path="match" element={<JobMatcher />} />
        <Route path="assistant" element={<CareerAssistant />} />
        <Route path="interview" element={<InterviewSetup />} />
        <Route path="interview/:id" element={<InterviewRoom />} />
        <Route path="mentor" element={<CareerMentor />} />
        <Route path="roadmaps" element={<Roadmaps />} />
        <Route path="skills" element={<SkillMatrix />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="*" element={<Dashboard />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
