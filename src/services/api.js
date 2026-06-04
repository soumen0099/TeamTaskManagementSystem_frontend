const BASE_URL = `${import.meta.env.VITE_API_TARGET || import.meta.env.VITE_API_URL || 'http://16.192.61.193:8800'}/api`;

console.log("BASE_URL =", BASE_URL);
console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
console.log("VITE_API_TARGET =", import.meta.env.VITE_API_TARGET);

// const BASE_URL = `${import.meta.env.VITE_API_TARGET || import.meta.env.VITE_API_URL || 'http://16.192.61.193:8800'}/api`;
const BASE_URL = "http://16.192.61.193:8800/api";
/**
 * Helper to fetch token from localStorage
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

/**
 * Handle responses and catch HTTP errors
 */
const handleResponse = async (response) => {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    // If unauthorized, clear local session
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Trigger a page reload to auth if not on auth page
      if (!window.location.pathname.endsWith('/auth')) {
        window.location.href = '/auth';
      }
    }
    const errorMessage = data?.message || data?.error || 'An error occurred during request';
    throw new Error(errorMessage);
  }

  return data;
};

export const api = {
  // === Authentication ===
  async register(userName, email, password) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, email, password }),
    });
    return handleResponse(response);
  },

  async login(email, password) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async getProfile() {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
      },
    });
    const data = await handleResponse(response);
    return {
      user: data?.data || data?.user || data,
      message: data?.message,
    };
  },

  async updateProfilePicture(profilePicture) {
    const response = await fetch(`${BASE_URL}/auth/profile-picture`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ profilePicture }),
    });
    return handleResponse(response);
  },

  // === Teams ===
  async createTeam({ teamName, description, owner }) {
    // Controller expects 'description' but schema expects 'teamDescription'.
    // We send both to avoid service/controller mismatches!
    const response = await fetch(`${BASE_URL}/teams/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        teamName,
        description,
        teamDescription: description,
        members: []
      }),
    });
    return handleResponse(response);
  },

  async addTeamMember(teamId, memberUserId) {
    const response = await fetch(`${BASE_URL}/teams/add-member/${teamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ memberUserId }),
    });
    return handleResponse(response);
  },

  async removeTeamMember(teamId, memberUserId) {
    const response = await fetch(`${BASE_URL}/teams/remove-member/${teamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ memberUserId }),
    });
    return handleResponse(response);
  },

  // === Tasks ===
  async getTasks() {
    const response = await fetch(`${BASE_URL}/tasks/read`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async createTask({ title, description, priority, dueDate, assignedTo, team }) {
    const response = await fetch(`${BASE_URL}/tasks/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ title, description, priority, dueDate, assignedTo, team }),
    });
    return handleResponse(response);
  },

  async updateTask(taskId, updateData) {
    const response = await fetch(`${BASE_URL}/tasks/update/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  async deleteTask(taskId) {
    const response = await fetch(`${BASE_URL}/tasks/delete/${taskId}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  }
};
