document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3001/api';
  
  // UI Elements
  const statusMsg = document.getElementById('status-msg');
  const authWarning = document.getElementById('auth-warning');
  const formContainer = document.getElementById('form-container');
  const saveBtn = document.getElementById('save-btn');
  const toggleSettingsBtn = document.getElementById('toggle-settings');
  const settingsPanel = document.getElementById('settings-panel');
  const mainView = document.getElementById('main-view');
  const apiTokenInput = document.getElementById('api-token');
  const saveTokenBtn = document.getElementById('save-token-btn');
  const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
  
  // Inputs
  const jobTitleInput = document.getElementById('jobTitle');
  const companyInput = document.getElementById('company');
  const locationInput = document.getElementById('location');
  const urlInput = document.getElementById('url');

  const descriptionInput = document.getElementById('description');
  const getSelectionBtn = document.getElementById('get-selection-btn');

  // Load Token
  chrome.storage.sync.get(['taas_token'], (result) => {
    if (result.taas_token) {
      apiTokenInput.value = result.taas_token;
      checkAuth(result.taas_token);
    } else {
      showAuthWarning();
    }
  });

  // Scrape Page on Load
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const activeTab = tabs[0];
    
    // Execute content script if not already injected? 
    // Actually manifest handles content script injection on load. 
    // But for SPAs, we might need to manually ping.
    if (activeTab.id) {
       chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      }, () => {
        // Send message to scrape
        chrome.tabs.sendMessage(activeTab.id, {action: "scrape"}, (response) => {
          if (response) {
            fillForm(response);
          }
        });
      });
    }
  });

  function fillForm(data) {
    if (data.title) jobTitleInput.value = data.title;
    if (data.company) companyInput.value = data.company;
    if (data.location) locationInput.value = data.location;
    if (data.url) urlInput.value = data.url;
    if (data.description) descriptionInput.value = data.description;
  }

  // Get Selection
  getSelectionBtn.addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab.id) {
            chrome.tabs.sendMessage(activeTab.id, {action: "getSelection"}, (response) => {
                if (response && response.selection) {
                    descriptionInput.value = response.selection;
                } else {
                    descriptionInput.placeholder = "No text selected! Highlight text on the page first.";
                }
            });
        }
    });
  });

  function showAuthWarning() {
    authWarning.style.display = 'block';
    saveBtn.disabled = true;
  }

  function hideAuthWarning() {
    authWarning.style.display = 'none';
    saveBtn.disabled = false;
  }

  async function checkAuth(token) {
    try {
      // Simple health check or user profile fetch
      // We assume if token is present it's valid for now to speed up UI
      hideAuthWarning(); 
    } catch (e) {
      showAuthWarning();
    }
  }

  // Save Job
  saveBtn.addEventListener('click', async () => {
    const token = apiTokenInput.value;
    if (!token) return showAuthWarning();

    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    const payload = {
      jobTitle: jobTitleInput.value,
      company: companyInput.value,
      location: locationInput.value,
      postUrl: urlInput.value,
      jobDescription: descriptionInput.value, // Added description
      status: 'applied', // Default status
      appliedDate: new Date().toISOString()
    };

    try {
      const response = await fetch(`${API_URL}/job-tracker/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        showStatus('Job Saved Successfully!', 'success');
        setTimeout(() => window.close(), 1500);
      } else {
        showStatus(data.error || 'Failed to save job', 'error');
        saveBtn.textContent = 'Save to Job Tracker';
        saveBtn.disabled = false;
      }
    } catch (error) {
      showStatus('Network Error: Is TAAS running?', 'error');
      saveBtn.textContent = 'Save to Job Tracker';
      saveBtn.disabled = false;
    }
  });

  // Settings Toggle
  toggleSettingsBtn.addEventListener('click', () => {
    mainView.style.display = 'none';
    settingsPanel.style.display = 'block';
  });

  cancelSettingsBtn.addEventListener('click', () => {
    settingsPanel.style.display = 'none';
    mainView.style.display = 'flex';
  });

  // Save Token
  saveTokenBtn.addEventListener('click', () => {
    const token = apiTokenInput.value.trim();
    if (token) {
      chrome.storage.sync.set({taas_token: token}, () => {
        settingsPanel.style.display = 'none';
        mainView.style.display = 'flex';
        hideAuthWarning();
        showStatus('Token saved', 'success');
      });
    }
  });

  function showStatus(text, type) {
    statusMsg.textContent = text;
    statusMsg.className = `status ${type}`;
    statusMsg.style.display = 'block';
  }
});
