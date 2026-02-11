function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message || 'Extension error'));
        return;
      }
      resolve(response);
    });
  });
}

function setStatus(message, isError = false) {
  const el = document.getElementById('statusMessage');
  el.textContent = message || '';
  el.classList.toggle('error', isError);
}

function showLoggedInView(user) {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('sessionSection').classList.remove('hidden');
  const label = user?.email || user?.username || user?.firstName || 'Authenticated user';
  document.getElementById('userInfo').textContent = `Logged in as ${label}`;
}

function showLoggedOutView() {
  document.getElementById('sessionSection').classList.add('hidden');
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('password').value = '';
}

async function refreshStatus() {
  const response = await sendMessage({ type: 'GET_STATUS' });
  if (!response?.ok) {
    throw new Error(response?.error || 'Failed to load extension state');
  }

  const data = response.data;
  document.getElementById('apiUrl').value = data.apiUrl || '';
  document.getElementById('appUrl').value = data.appUrl || '';

  if (data.isLoggedIn) {
    showLoggedInView(data.user);
  } else {
    showLoggedOutView();
  }
}

async function saveSettings() {
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const appUrl = document.getElementById('appUrl').value.trim();
  const apiOrigin = (() => { try { return new URL(apiUrl.replace(/\/$/, '')).origin; } catch { return ''; } })();
  const appOrigin = (() => { try { return new URL(appUrl.replace(/\/$/, '')).origin; } catch { return ''; } })();
  const isLocal = /:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(appOrigin);

  if (apiOrigin && appOrigin && apiOrigin === appOrigin && !isLocal) {
    throw new Error('API URL points to frontend origin. Use backend API URL (for example: https://taas-col4.onrender.com/api).');
  }

  const response = await sendMessage({
    type: 'SAVE_SETTINGS',
    apiUrl,
    appUrl,
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'Failed to save settings');
  }

  setStatus('URLs saved.');
}

async function login() {
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const appUrl = document.getElementById('appUrl').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const response = await sendMessage({
    type: 'LOGIN',
    apiUrl,
    appUrl,
    email,
    password,
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'Login failed');
  }

  if (response?.data?.apiUrl) {
    document.getElementById('apiUrl').value = response.data.apiUrl;
  }

  showLoggedInView(response?.data?.user || null);
  document.getElementById('password').value = '';
  setStatus('Logged in successfully.');
}

async function importSession() {
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const appUrl = document.getElementById('appUrl').value.trim();

  const response = await sendMessage({
    type: 'IMPORT_SESSION',
    apiUrl,
    appUrl,
  });

  if (!response?.ok) {
    throw new Error(response?.error || 'Failed to import session');
  }

  if (response?.data?.apiUrl) {
    document.getElementById('apiUrl').value = response.data.apiUrl;
  }

  showLoggedInView(response?.data?.user || null);
  setStatus('Imported current TAAS session.');
}

async function logout() {
  const response = await sendMessage({ type: 'LOGOUT' });
  if (!response?.ok) {
    throw new Error(response?.error || 'Logout failed');
  }

  showLoggedOutView();
  setStatus('Logged out.');
}

function openTracker() {
  const appUrl = document.getElementById('appUrl').value.trim().replace(/\/$/, '');
  const target = `${appUrl}/plugins/job-tracker/applications`;
  chrome.tabs.create({ url: target });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await refreshStatus();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to initialize.', true);
  }

  document.getElementById('saveSettings').addEventListener('click', async () => {
    setStatus('');
    try {
      await saveSettings();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save settings.', true);
    }
  });

  document.getElementById('loginButton').addEventListener('click', async () => {
    setStatus('');
    try {
      await login();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Login failed.', true);
    }
  });

  document.getElementById('importSessionButton').addEventListener('click', async () => {
    setStatus('');
    try {
      await importSession();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to import session.', true);
    }
  });

  document.getElementById('logoutButton').addEventListener('click', async () => {
    setStatus('');
    try {
      await logout();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Logout failed.', true);
    }
  });

  document.getElementById('openTracker').addEventListener('click', openTracker);
});
