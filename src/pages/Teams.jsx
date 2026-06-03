import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Users, UserPlus, UserMinus, Plus, Shield, ShieldAlert, X } from 'lucide-react';
import '../styles/teams.css';

const Teams = () => {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals visibility
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [activeTeam, setActiveTeam] = useState(null);

  // Form states
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [newMemberId, setNewMemberId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      // Fetch fresh profile to get the user's latest teams
      const profileData = await api.getProfile();
      const updatedUser = profileData.user || profileData;
      
      // The profile returns a 'team' list populated with teams
      setTeams(updatedUser.team || []);
    } catch (error) {
      console.error("Teams loading failed", error);
      toast.showToast(error.message || "Failed to load teams list.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.showToast("Team Name is required", "warning");
      return;
    }

    try {
      setActionLoading(true);
      // Backend sets the owner from authenticated user, so no need to send owner
      await api.createTeam({
        teamName,
        description: teamDesc
      });
      
      toast.showToast(`Team "${teamName}" created successfully!`, "success");
      setTeamName('');
      setTeamDesc('');
      setShowCreateModal(false);
      
      // Refresh teams lists and user context
      await fetchTeams();
      await refreshProfile();
    } catch (error) {
      toast.showToast(error.message || "Could not create team.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberId.trim()) {
      toast.showToast("Please enter a valid User ID", "warning");
      return;
    }

    try {
      setActionLoading(true);
      await api.addTeamMember(activeTeam._id, newMemberId.trim());
      toast.showToast("Teammate added successfully!", "success");
      setNewMemberId('');
      
      // Re-fetch teams to refresh the current member count, and update modal view
      const updatedTeamsResponse = await fetchTeams();
      
      // Refresh active team in modal
      // We'll re-fetch profile to get up-to-date populates
      const profile = await api.getProfile();
      const freshUser = profile.user || profile;
      const freshTeam = (freshUser.team || []).find(t => t._id === activeTeam._id);
      if (freshTeam) {
        setActiveTeam(freshTeam);
      }
    } catch (error) {
      toast.showToast(error.message || "Failed to add member.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      setActionLoading(true);
      await api.removeTeamMember(activeTeam._id, memberUserId);
      toast.showToast("Member removed successfully.", "success");
      
      // Refresh list
      await fetchTeams();
      
      // Refresh active team inside modal
      const profile = await api.getProfile();
      const freshUser = profile.user || profile;
      const freshTeam = (freshUser.team || []).find(t => t._id === activeTeam._id);
      if (freshTeam) {
        setActiveTeam(freshTeam);
      } else {
        setShowManageModal(false);
      }
    } catch (error) {
      toast.showToast(error.message || "Failed to remove member.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const isOwner = (team) => {
    if (!team || !user) return false;
    const ownerId = typeof team.owner === 'object' ? team.owner._id : team.owner;
    return ownerId === user._id;
  };

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Navbar title="Team Spaces" />

        <div className="teams-action-bar">
          <p className="teams-tagline">Collaborate, allocate tasks, and assign roles across active boards.</p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            <span>Create Team</span>
          </button>
        </div>

        {loading ? (
          <div className="teams-skeleton">
            <div className="pulse-skeleton skeleton-teams-card"></div>
            <div className="pulse-skeleton skeleton-teams-card"></div>
            <div className="pulse-skeleton skeleton-teams-card"></div>
          </div>
        ) : teams.length === 0 ? (
          <div className="no-teams-container glass-card">
            <Users size={48} className="no-teams-icon" />
            <h3>No Teams Found</h3>
            <p>Create a brand new workspace or share your Member ID with owners to get added to existing teams.</p>
            <div className="no-teams-actions">
              <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                <span>Create Team</span>
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/tasks')}>
                <span>Go to Tasks Board</span>
              </button>
            </div>
            {user?._id && (
              <div className="teams-id-reminder glass-panel">
                <span>Your ID:</span>
                <code>{user._id}</code>
              </div>
            )}
          </div>
        ) : (
          <div className="teams-grid animate-fadeIn">
            {teams.map(team => {
              const owned = isOwner(team);
              return (
                <div key={team._id} className="team-card glass-card">
                  <div className="team-card-header">
                    <h3 className="team-name">{team.teamName}</h3>
                    <span className={`team-role-badge ${owned ? 'role-owner' : 'role-member'}`}>
                      {owned ? <Shield size={12} /> : <ShieldAlert size={12} />}
                      <span>{owned ? 'Owner' : 'Member'}</span>
                    </span>
                  </div>

                  <p className="team-description">
                    {team.teamDescription || team.description || 'No description provided.'}
                  </p>

                  <div className="team-stats-row">
                    <div className="team-stat-item">
                      <span className="team-stat-num">{team.members?.length || 1}</span>
                      <span className="team-stat-lbl">Members</span>
                    </div>
                    <div className="team-stat-item">
                      <span className="team-stat-num">{team.tasks?.length || 0}</span>
                      <span className="team-stat-lbl">Tasks</span>
                    </div>
                  </div>

                  <div className="team-card-actions">
                    {owned ? (
                      <button 
                        className="btn btn-secondary btn-full"
                        onClick={() => {
                          setActiveTeam(team);
                          setShowManageModal(true);
                        }}
                      >
                        <UserPlus size={16} />
                        <span>Manage Teammates</span>
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-full" disabled>
                        <span>Collaborating</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE TEAM MODAL */}
        {showCreateModal && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Create Workspace Team</h3>
                <button className="modal-close" aria-label="Close create team modal" onClick={() => setShowCreateModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTeam}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input 
                      type="text"
                      className="input-field"
                      placeholder="e.g. Frontend Engineering"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                      disabled={actionLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="input-field"
                      rows={3}
                      placeholder="Discuss tech stacks, project features, and tasks..."
                      value={teamDesc}
                      onChange={(e) => setTeamDesc(e.target.value)}
                      disabled={actionLoading}
                    />
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
                    {actionLoading ? <span className="loading-spinner"></span> : 'Create Team'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MANAGE TEAM MEMBERS MODAL */}
        {showManageModal && activeTeam && (
          <div className="modal-backdrop">
            <div className="modal-content modal-content-lg">
              <div className="modal-header">
                <div className="modal-header-desc">
                  <h3 className="modal-title">Teammate Manager</h3>
                  <span className="modal-subtitle-text">Team: {activeTeam.teamName}</span>
                </div>
                <button className="modal-close" aria-label="Close teammate manager" onClick={() => setShowManageModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {/* Add Member Form */}
                <form onSubmit={handleAddMember} className="add-member-form glass-panel">
                  <div className="add-member-inputs">
                    <div className="form-group flex-grow-1">
                      <label className="form-label">Member User ID (MongoDB ObjectId)</label>
                      <input 
                        type="text"
                        className="input-field"
                        placeholder="e.g. 646a782e4f000..."
                        value={newMemberId}
                        onChange={(e) => setNewMemberId(e.target.value)}
                        required
                        disabled={actionLoading}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary add-member-submit" disabled={actionLoading}>
                      <UserPlus size={16} />
                      <span>Add</span>
                    </button>
                  </div>
                  <p className="form-tip">Teammates can copy their Member ID from their Dashboard greeting card.</p>
                </form>

                {/* Member List */}
                <div className="members-section">
                  <h4 className="members-section-title">Current Members</h4>
                  <div className="members-list">
                    {/* Owner row (always displayed) */}
                    <div className="member-item-row owner-row">
                      <div className="member-item-left">
                        <div className="user-avatar-mini">OW</div>
                        <div className="member-item-info">
                          <span className="member-item-name">Team Owner</span>
                          <span className="member-item-id">ID: {typeof activeTeam.owner === 'object' ? activeTeam.owner._id : activeTeam.owner}</span>
                        </div>
                      </div>
                      <span className="badge badge-role">Owner</span>
                    </div>

                    {/* Members loop */}
                    {(activeTeam.members || []).map((mObj, index) => {
                      const mUser = mObj.user || mObj;
                      const mId = typeof mUser === 'object' ? mUser._id : mUser;
                      
                      // Skip rendering owner twice if stored inside members list
                      const ownerIdStr = typeof activeTeam.owner === 'object' ? activeTeam.owner._id : activeTeam.owner;
                      if (mId === ownerIdStr) return null;

                      return (
                        <div key={index} className="member-item-row glass-panel">
                          <div className="member-item-left">
                            <div className="user-avatar-mini">
                              {typeof mUser === 'object' && mUser.userName ? mUser.userName.substring(0, 2).toUpperCase() : 'ME'}
                            </div>
                            <div className="member-item-info">
                              <span className="member-item-name">
                                {typeof mUser === 'object' && mUser.userName ? mUser.userName : 'Active Member'}
                              </span>
                              <span className="member-item-id">ID: {mId}</span>
                            </div>
                          </div>

                          <div className="member-item-actions">
                            <span className="badge">{mObj.role || 'Member'}</span>
                            <button 
                              type="button"
                              className="btn-remove-member"
                              aria-label="Remove member"
                              onClick={() => handleRemoveMember(mId)}
                              disabled={actionLoading}
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Teams;
