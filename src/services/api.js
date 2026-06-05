// NOTE: production should set VITE_API_URL (or VITE_API_TARGET) to an HTTPS backend.
// Fallback changed to the project's duckdns HTTPS host to avoid mixed-content blocking when served over HTTPS.
const BASE_URL = `${import.meta.env.VITE_API_TARGET || import.meta.env.VITE_API_URL || 'https://soumenproject.duckdns.org'}/api`;

// Utility to mask sensitive values when logging
const maskSensitive = (obj) => {
  if (!obj) return obj;
  try {
    const copy = JSON.parse(JSON.stringify(obj));
    const maskValue = (v) => (typeof v === 'string' && v.length > 0 ? '****' : v);
    const walk = (o) => {
      if (o && typeof o === 'object') {
        Object.keys(o).forEach((k) => {
          if (/password|token|authorization/i.test(k)) {
            o[k] = maskValue(o[k]);
          } else if (typeof o[k] === 'object') {
            walk(o[k]);
          }
        });
      }
    };
    walk(copy);
    return copy;
  } catch (e) {
    return obj;
  }
};

// Centralized request wrapper with detailed logging
const makeRequest = async (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const headers = options.headers || {};
  const body = options.body ? (() => {
    try { return JSON.parse(options.body); } catch(e) { return options.body; }
  })() : null;

  // Prepare masked copies for logging
  const loggedHeaders = maskSensitive(headers);
  const loggedBody = maskSensitive(body);

  console.info('[API] Request ->', { url, method, headers: loggedHeaders, body: loggedBody });

  try {
    const response = await fetch(url, options);
    console.info('[API] Response <-', { url, method, status: response.status });
    return response;
  } catch (error) {
    console.error('[API] Fetch error', { url, method, headers: loggedHeaders, body: loggedBody, error: error?.message || error });
    throw error;
  }
};

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
    // Log details for failed responses
    console.error('[API] Non-OK response', { url: response.url, status: response.status, body: maskSensitive(data) });

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
    const url = `${BASE_URL}/auth/register`;
    const response = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, email, password }),
    });
    return handleResponse(response);
  },

  async login(email, password) {
    const url = `${BASE_URL}/auth/login`;
    const response = await makeRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  async getProfile() {
    const url = `${BASE_URL}/auth/profile`;
    const response = await makeRequest(url, {
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
    const url = `${BASE_URL}/auth/profile-picture`;
    const response = await makeRequest(url, {
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
    const url = `${BASE_URL}/teams/create`;
    const response = await makeRequest(url, {
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
    const url = `${BASE_URL}/teams/add-member/${teamId}`;
    const response = await makeRequest(url, {
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
    const url = `${BASE_URL}/teams/remove-member/${teamId}`;
    const response = await makeRequest(url, {
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
    const url = `${BASE_URL}/tasks/read`;
    const response = await makeRequest(url, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  async createTask({ title, description, priority, dueDate, assignedTo, team }) {
    const url = `${BASE_URL}/tasks/create`;
    const response = await makeRequest(url, {
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
    const url = `${BASE_URL}/tasks/update/${taskId}`;
    const response = await makeRequest(url, {
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
    const url = `${BASE_URL}/tasks/delete/${taskId}`;
    const response = await makeRequest(url, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  }
};
