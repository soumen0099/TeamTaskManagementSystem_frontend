import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { CheckCircle, AlertCircle, Users, ClipboardList, Copy, Check } from 'lucide-react';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [stats, setStats] = useState({
    teamsCount: 0,
    tasksCount: 0,
    completedTasksCount: 0,
    pendingTasksCount: 0,
    completionRate: 0
  });
  
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch tasks
        const tasksData = await api.getTasks();
        const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
        
        // 2. Use the authenticated user already loaded in context
        const userTeams = user?.team || [];
        
        const totalTasks = tasks.length;
        // Count tasks by status. Task model schema can vary, but standard status could be "Completed" or similar
        // Let's assume standard status fields (e.g. status: "Done", "Completed" or check status)
        // Let's look at standard task status: to be safe, let's treat "Done" or "Completed" as completed, and any other as pending
        const completedTasks = tasks.filter(t => 
          t.status?.toLowerCase() === 'done' || 
          t.status?.toLowerCase() === 'completed' ||
          t.completed === true
        ).length;
        
        const pendingTasks = totalTasks - completedTasks;
        const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setStats({
          teamsCount: userTeams.length,
          tasksCount: totalTasks,
          completedTasksCount: completedTasks,
          pendingTasksCount: pendingTasks,
          completionRate: rate
        });

        // Set top 4 recent tasks
        const sortedTasks = [...tasks]
          .sort((a, b) => new Date(b.createdAt || b.dueDate) - new Date(a.createdAt || a.dueDate))
          .slice(0, 4);
        setRecentTasks(sortedTasks);
      } catch (error) {
        console.error("Dashboard load error", error);
        toast.showToast("Failed to fetch dashboard metrics.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast, user]);

  const handleCopyId = () => {
    if (user && user._id) {
      navigator.clipboard.writeText(user._id);
      setCopied(true);
      toast.showToast("Member ID copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // SVG Circular Gauge calculations
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.completionRate / 100) * circumference;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Navbar title="Dashboard Workspace" />

        {loading ? (
          <div className="dashboard-skeleton">
            <div className="skeleton-grid">
              <div className="pulse-skeleton skeleton-card"></div>
              <div className="pulse-skeleton skeleton-card"></div>
              <div className="pulse-skeleton skeleton-card"></div>
              <div className="pulse-skeleton skeleton-card"></div>
            </div>
            <div className="pulse-skeleton skeleton-body"></div>
          </div>
        ) : (
          <div className="dashboard-view animate-fadeIn">
            {/* Header Welcoming */}
            <div className="dashboard-welcome glass-card">
              <div className="welcome-details">
                <h2>Welcome Back, {user?.userName}!</h2>
                <p>Track your team projects, monitor assignments, and post updates in real-time.</p>
                
                {user?._id && (
                  <div className="member-id-box">
                    <span className="member-id-label">Your Member ID:</span>
                    <code className="member-id-value">{user._id}</code>
                    <button className="copy-id-btn" aria-label="Copy member ID" onClick={handleCopyId}>
                      {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="gauge-container">
                <svg width="120" height="120" viewBox="0 0 120 120" className="radial-gauge">
                  <circle
                    className="gauge-bg"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    className="gauge-progress"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="gauge-text-box">
                  <span className="gauge-value">{stats.completionRate}%</span>
                  <span className="gauge-label">Done</span>
                </div>
              </div>
            </div>

            {/* Stat Indicators Grid */}
            <div className="stats-grid">
              <div className="stat-card glass-card">
                <div className="stat-icon-wrapper teams-icon">
                  <Users size={24} />
                </div>
                <div className="stat-data">
                  <span className="stat-label">Active Teams</span>
                  <h3 className="stat-number">{stats.teamsCount}</h3>
                </div>
              </div>

              <div className="stat-card glass-card">
                <div className="stat-icon-wrapper tasks-icon">
                  <ClipboardList size={24} />
                </div>
                <div className="stat-data">
                  <span className="stat-label">Total Tasks</span>
                  <h3 className="stat-number">{stats.tasksCount}</h3>
                </div>
              </div>

              <div className="stat-card glass-card">
                <div className="stat-icon-wrapper completed-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="stat-data">
                  <span className="stat-label">Completed Tasks</span>
                  <h3 className="stat-number">{stats.completedTasksCount}</h3>
                </div>
              </div>

              <div className="stat-card glass-card">
                <div className="stat-icon-wrapper pending-icon">
                  <AlertCircle size={24} />
                </div>
                <div className="stat-data">
                  <span className="stat-label">Pending Tasks</span>
                  <h3 className="stat-number">{stats.pendingTasksCount}</h3>
                </div>
              </div>
            </div>

            {/* Main Dashboard Panel */}
            <div className="dashboard-grid">
              <div className="recent-tasks-panel glass-card">
                <div className="panel-header">
                  <h3>Recent Task Activity</h3>
                </div>
                
                {recentTasks.length === 0 ? (
                  <div className="no-tasks-state">
                    <p>No task assignments recorded yet.</p>
                  </div>
                ) : (
                  <div className="tasks-list">
                    {recentTasks.map(task => (
                      <div key={task._id} className="task-row glass-panel">
                        <div className="task-row-left">
                          <span className={`priority-indicator priority-${task.priority?.toLowerCase() || 'medium'}`}></span>
                          <div className="task-row-details">
                            <h4 className="task-row-title">{task.title}</h4>
                            <span className="task-row-team">{task.team?.teamName || 'Personal Task'}</span>
                          </div>
                        </div>
                        <div className="task-row-right">
                          <span className="task-row-date">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span className={`task-status-label status-${task.status?.toLowerCase() || 'todo'}`}>
                            {task.status || 'To Do'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
