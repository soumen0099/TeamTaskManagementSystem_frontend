import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Plus, Search, Calendar, User, MessageSquare, Trash2, ArrowRight, ArrowLeft, X, Eye, Copy, Check } from 'lucide-react';
import '../styles/tasks.css';

const COLUMNS = [
  { id: 'todo', title: 'To Do', statusName: 'To Do' },
  { id: 'inprogress', title: 'In Progress', statusName: 'In Progress' },
  { id: 'review', title: 'Review', statusName: 'Review' },
  { id: 'done', title: 'Done', statusName: 'Done' }
];

const Tasks = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [userTeams, setUserTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modals Visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null); // Task Details Overlay

  // Create Task Form States
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskTeamId, setTaskTeamId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Comments State
  const [newCommentText, setNewCommentText] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeMobileColumn, setActiveMobileColumn] = useState('todo');

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks
      const tasksData = await api.getTasks();
      const allTasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
      setTasks(allTasks);

      // Fetch user profile to get teams populate list
      const profileData = await api.getProfile();
      const freshUser = profileData.user || profileData;
      setUserTeams(freshUser.team || []);
    } catch (error) {
      console.error("Tasks loading error", error);
      toast.showToast(error.message || "Failed to load tasks.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const updateMobileState = () => {
      setIsMobileView(mediaQuery.matches);
    };

    updateMobileState();
    mediaQuery.addEventListener('change', updateMobileState);

    return () => {
      mediaQuery.removeEventListener('change', updateMobileState);
    };
  }, []);

  // Filter Tasks dynamically
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Search Query
      const matchSearch = task.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Team Filter
      // task.team can be an ID string or populated object
      const taskTeamIdStr = typeof task.team === 'object' ? task.team?._id : task.team;
      const matchTeam = selectedTeamId === 'all' || taskTeamIdStr === selectedTeamId;
      
      // 3. Priority Filter
      const matchPriority = selectedPriority === 'all' || task.priority === selectedPriority;

      return matchSearch && matchTeam && matchPriority;
    });
  }, [tasks, searchQuery, selectedTeamId, selectedPriority]);

  // Standardize task status into one of: 'todo' | 'inprogress' | 'review' | 'done'
  const getTaskColumnId = (task) => {
    const status = (task.status || 'todo').toLowerCase().replace(/\s+/g, '');
    if (['todo', 'inprogress', 'review', 'done'].includes(status)) {
      return status;
    }
    return 'todo'; // fallback
  };

  const visibleColumns = useMemo(() => {
    if (!isMobileView) return COLUMNS;
    return COLUMNS.filter((column) => column.id === activeMobileColumn);
  }, [isMobileView, activeMobileColumn]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskTeamId || !taskDueDate) {
      toast.showToast("Title, Team and Due Date are required", "warning");
      return;
    }

    try {
      setActionLoading(true);
      // If assignee is not set, we can assign to ourselves
      const assignedToVal = taskAssigneeId.trim() || user._id;

      await api.createTask({
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate,
        assignedTo: assignedToVal,
        team: taskTeamId
      });

      toast.showToast("Task created successfully!", "success");
      
      // Reset form
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('Medium');
      setTaskDueDate('');
      setTaskAssigneeId('');
      setTaskTeamId('');
      setShowCreateModal(false);
      
      await loadData();
    } catch (error) {
      toast.showToast(error.message || "Failed to create task", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveStatus = async (task, direction) => {
    const colId = getTaskColumnId(task);
    let nextStatus = '';

    if (colId === 'todo' && direction === 'right') nextStatus = 'In Progress';
    else if (colId === 'inprogress' && direction === 'left') nextStatus = 'To Do';
    else if (colId === 'inprogress' && direction === 'right') nextStatus = 'Review';
    else if (colId === 'review' && direction === 'left') nextStatus = 'In Progress';
    else if (colId === 'review' && direction === 'right') nextStatus = 'Done';
    else if (colId === 'done' && direction === 'left') nextStatus = 'Review';

    if (!nextStatus) return;

    try {
      // Optimistic Update
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: nextStatus } : t));
      
      await api.updateTask(task._id, { status: nextStatus });
      toast.showToast(`Moved to "${nextStatus}"`, "success");
      
      // Reload silently
      const tasksData = await api.getTasks();
      const allTasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
      setTasks(allTasks);
      
      // Refresh selected detail view if open
      if (selectedTask && selectedTask._id === task._id) {
        const freshTaskObj = allTasks.find(t => t._id === task._id);
        if (freshTaskObj) setSelectedTask(freshTaskObj);
      }
    } catch (error) {
      toast.showToast("Failed to move task status", "error");
      loadData(); // Revert on failure
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      await api.deleteTask(taskId);
      toast.showToast("Task deleted successfully", "success");
      setSelectedTask(null);
      await loadData();
    } catch (error) {
      toast.showToast(error.message || "Failed to delete task", "error");
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      setActionLoading(true);
      // Comments are an array: { user: ObjectId, text: string }
      // Get the existing comments
      const existingComments = selectedTask.comments || [];
      const newComment = {
        user: user._id,
        text: newCommentText.trim()
      };
      
      // Update comments via task update
      const updatedComments = [...existingComments, newComment];
      await api.updateTask(selectedTask._id, { comments: updatedComments });
      
      setNewCommentText('');
      toast.showToast("Comment posted!", "success");
      
      // Reload tasks & details
      const tasksData = await api.getTasks();
      const allTasks = Array.isArray(tasksData) ? tasksData : (tasksData.tasks || []);
      setTasks(allTasks);
      
      const freshTaskObj = allTasks.find(t => t._id === selectedTask._id);
      if (freshTaskObj) setSelectedTask(freshTaskObj);
    } catch (error) {
      toast.showToast(error.message || "Could not post comment", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.showToast("ID copied!", "success");
    setTimeout(() => setCopiedId(''), 2000);
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Navbar title="Tasks Kanban" />

        {/* Filters and Actions Bar */}
        <div className="tasks-action-bar flex-wrap">
          <div className="filters-left">
            {/* Search */}
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input 
                type="text"
                placeholder="Search tasks..."
                className="input-field search-padding"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Team Filter */}
            <select 
              className="input-field select-filter"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="all">All Teams</option>
              {userTeams.map(team => (
                <option key={team._id} value={team._id}>{team.teamName}</option>
              ))}
            </select>

            {/* Priority Filter */}
            <select 
              className="input-field select-filter"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>New Task</span>
          </button>
        </div>

        {loading ? (
          <div className="tasks-skeleton">
            <div className="pulse-skeleton skeleton-col"></div>
            <div className="pulse-skeleton skeleton-col"></div>
            <div className="pulse-skeleton skeleton-col"></div>
          </div>
        ) : (
          <>
            {filteredTasks.length === 0 ? (
              <div className="tasks-empty-state glass-card animate-fadeIn">
                <h3>No tasks match your current filters</h3>
                <p>Reset filters or create a new task to get your board moving.</p>
                <div className="tasks-empty-actions">
                  <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} />
                    <span>Create Task</span>
                  </button>
                  <button className="btn btn-secondary" onClick={() => navigate('/teams')}>
                    <span>Join or Create Team</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                {isMobileView && (
                  <div className="kanban-mobile-tabs animate-fadeIn" role="tablist" aria-label="Task columns">
                    {COLUMNS.map((column) => {
                      const count = filteredTasks.filter((t) => getTaskColumnId(t) === column.id).length;
                      return (
                        <button
                          key={column.id}
                          role="tab"
                          type="button"
                          aria-selected={activeMobileColumn === column.id}
                          className={`kanban-tab-btn ${activeMobileColumn === column.id ? 'active' : ''}`}
                          onClick={() => setActiveMobileColumn(column.id)}
                        >
                          <span>{column.title}</span>
                          <span className="tab-count">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Kanban Board layout */}
                <div className="kanban-board animate-fadeIn">
            {visibleColumns.map(column => {
              // Group filtered tasks by column
              const columnTasks = filteredTasks.filter(t => getTaskColumnId(t) === column.id);

              return (
                <div key={column.id} className="kanban-column glass-panel">
                  <div className="kanban-column-header">
                    <h3 className="column-title">{column.title}</h3>
                    <span className="column-count">{columnTasks.length}</span>
                  </div>

                  <div className="kanban-tasks-list">
                    {columnTasks.length === 0 ? (
                      <div className="empty-column-state">
                        <span>No tasks in this column</span>
                      </div>
                    ) : (
                      columnTasks.map(task => (
                        <div key={task._id} className="kanban-card glass-card">
                          <div className="kanban-card-header">
                            <span className={`badge badge-${task.priority?.toLowerCase() || 'medium'}`}>
                              {task.priority || 'Medium'}
                            </span>
                            
                            <div className="card-quick-nav">
                              {column.id !== 'todo' && (
                                <button className="quick-nav-btn" aria-label="Move task left" onClick={() => handleMoveStatus(task, 'left')}>
                                  <ArrowLeft size={12} />
                                </button>
                              )}
                              {column.id !== 'done' && (
                                <button className="quick-nav-btn" aria-label="Move task right" onClick={() => handleMoveStatus(task, 'right')}>
                                  <ArrowRight size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          <h4 className="kanban-card-title">{task.title}</h4>
                          <p className="kanban-card-desc">{task.description}</p>

                          <div className="kanban-card-footer">
                            <div className="card-due-tag">
                              <Calendar size={12} />
                              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                            </div>

                            <button className="btn-details-eye" aria-label="View task details" onClick={() => setSelectedTask(task)}>
                              <Eye size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
              </>
            )}
          </>
        )}

        {/* CREATE TASK MODAL */}
        {showCreateModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Draft Task</h3>
                <button className="modal-close" aria-label="Close create task modal" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Task Title</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. Implement API Integrations"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      required
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="input-field"
                      rows={3}
                      placeholder="Provide steps to complete..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group flex-grow-1">
                      <label className="form-label">Assign Team</label>
                      <select 
                        className="input-field"
                        value={taskTeamId}
                        onChange={(e) => setTaskTeamId(e.target.value)}
                        required
                        disabled={actionLoading}
                      >
                        <option value="">Choose Workspace Team</option>
                        {userTeams.map(t => (
                          <option key={t._id} value={t._id}>{t.teamName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group flex-grow-1">
                      <label className="form-label">Priority</label>
                      <select 
                        className="input-field"
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        disabled={actionLoading}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group flex-grow-1">
                      <label className="form-label">Due Date</label>
                      <input 
                        type="date"
                        className="input-field"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        required
                        disabled={actionLoading}
                      />
                    </div>

                    <div className="form-group flex-grow-1">
                      <label className="form-label">Assignee User ID (Optional)</label>
                      <input 
                        type="text"
                        className="input-field"
                        placeholder="Leave blank to assign to self"
                        value={taskAssigneeId}
                        onChange={(e) => setTaskAssigneeId(e.target.value)}
                        disabled={actionLoading}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowCreateModal(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? <span className="loading-spinner"></span> : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DETAILED TASK PANEL & COMMENTS OVERLAY */}
        {selectedTask && (
          <div className="modal-backdrop">
            <div className="modal-content modal-content-lg task-details-overlay">
              <div className="modal-header">
                <div className="task-header-left">
                  <span className={`badge badge-${selectedTask.priority?.toLowerCase() || 'medium'}`}>
                    {selectedTask.priority || 'Medium'}
                  </span>
                  <h3 className="modal-title">{selectedTask.title}</h3>
                </div>
                
                <div className="task-header-right">
                  <button className="btn-delete-task" aria-label="Delete task" onClick={() => handleDeleteTask(selectedTask._id)}>
                    <Trash2 size={16} />
                  </button>
                  <button className="modal-close" aria-label="Close task details" onClick={() => setSelectedTask(null)}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="modal-body details-body-split">
                {/* Details Section */}
                <div className="details-left">
                  <div className="detail-block">
                    <h4 className="detail-section-title">Description</h4>
                    <p className="detail-description-text">
                      {selectedTask.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="detail-meta-grid">
                    <div className="meta-block">
                      <span className="meta-label">Status</span>
                      <span className={`task-status-label status-${getTaskColumnId(selectedTask)}`}>
                        {selectedTask.status || 'To Do'}
                      </span>
                    </div>

                    <div className="meta-block">
                      <span className="meta-label">Due Date</span>
                      <div className="meta-date">
                        <Calendar size={14} />
                        <span>{new Date(selectedTask.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-meta-ids glass-panel">
                    <div className="id-block">
                      <span className="id-label">Team ID:</span>
                      <code className="id-value">
                        {typeof selectedTask.team === 'object' ? selectedTask.team._id : selectedTask.team}
                      </code>
                      <button className="id-copy-btn" aria-label="Copy team ID" onClick={() => handleCopyText(typeof selectedTask.team === 'object' ? selectedTask.team._id : selectedTask.team)}>
                        {copiedId === (typeof selectedTask.team === 'object' ? selectedTask.team._id : selectedTask.team) ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="id-block">
                      <span className="id-label">Assignee ID:</span>
                      <code className="id-value">
                        {typeof selectedTask.assignedTo === 'object' ? selectedTask.assignedTo._id : selectedTask.assignedTo}
                      </code>
                      <button className="id-copy-btn" aria-label="Copy assignee ID" onClick={() => handleCopyText(typeof selectedTask.assignedTo === 'object' ? selectedTask.assignedTo._id : selectedTask.assignedTo)}>
                        {copiedId === (typeof selectedTask.assignedTo === 'object' ? selectedTask.assignedTo._id : selectedTask.assignedTo) ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="id-block">
                      <span className="id-label">Creator ID:</span>
                      <code className="id-value">
                        {typeof selectedTask.createdBy === 'object' ? selectedTask.createdBy._id : selectedTask.createdBy}
                      </code>
                      <button className="id-copy-btn" aria-label="Copy creator ID" onClick={() => handleCopyText(typeof selectedTask.createdBy === 'object' ? selectedTask.createdBy._id : selectedTask.createdBy)}>
                        {copiedId === (typeof selectedTask.createdBy === 'object' ? selectedTask.createdBy._id : selectedTask.createdBy) ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="details-right-comments">
                  <h4 className="detail-section-title flex-items-center">
                    <MessageSquare size={16} className="margin-right-xs" />
                    <span>Comments ({selectedTask.comments?.length || 0})</span>
                  </h4>

                  <div className="comments-feed">
                    {(selectedTask.comments || []).length === 0 ? (
                      <div className="no-comments-state">
                        <span>No comments yet. Start the conversation below!</span>
                      </div>
                    ) : (
                      (selectedTask.comments || []).map((comment, index) => {
                        const cUser = comment.user;
                        const cUserName = typeof cUser === 'object' && cUser?.userName ? cUser.userName : 'Teammate';
                        const cUserId = typeof cUser === 'object' ? cUser?._id : cUser;

                        return (
                          <div key={index} className="comment-bubble glass-panel">
                            <div className="comment-bubble-header">
                              <span className="comment-author">{cUserName}</span>
                              <span className="comment-uid">{cUserId ? `ID: ${cUserId.substring(0, 8)}...` : ''}</span>
                            </div>
                            <p className="comment-text">{comment.text}</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <form onSubmit={handlePostComment} className="comment-compose-form">
                    <input 
                      type="text"
                      className="input-field comment-input"
                      placeholder="Write an update..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      disabled={actionLoading}
                      required
                    />
                    <button type="submit" className="btn btn-primary comment-submit-btn" disabled={actionLoading}>
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tasks;
