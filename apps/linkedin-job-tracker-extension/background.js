const STORAGE_KEY = 'taas_extension_auth';
const DEFAULT_APP_URL = 'https://taas-ten.vercel.app';
const DEFAULT_API_URL = 'https://taas-col4.onrender.com/api';
const KNOWN_API_BY_APP = {
  'https://taas-ten.vercel.app': 'https://taas-col4.onrender.com/api',
};

function trimSlash(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

function normalizeAppUrl(value) {
  const normalized = trimSlash(value);
  if (!normalized) return DEFAULT_APP_URL;
  return normalized;
}

function normalizeApiUrl(value) {
  const normalized = trimSlash(value);
  if (!normalized) return DEFAULT_API_URL;
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

function getApiCandidates(apiUrlInput, appUrlInput) {
  const appUrl = normalizeAppUrl(appUrlInput);
  const appOrigin = (() => {
    try {
      return new URL(appUrl).origin;
    } catch {
      return '';
    }
  })();
  const isLocalApp = /:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(appOrigin);

  const explicitApi = trimSlash(apiUrlInput);
  if (explicitApi) {
    const normalizedExplicit = normalizeApiUrl(explicitApi);
    const explicitOrigin = (() => {
      try {
        return new URL(normalizedExplicit).origin;
      } catch {
        return '';
      }
    })();

    const explicitLooksLikeFrontendApi = !isLocalApp && explicitOrigin && explicitOrigin === appOrigin;
    if (explicitLooksLikeFrontendApi) {
      const known = KNOWN_API_BY_APP[appUrl] || DEFAULT_API_URL;
      return [normalizeApiUrl(known)];
    }

    return [normalizedExplicit];
  }

  const candidates = [
    KNOWN_API_BY_APP[appUrl] || '',
    DEFAULT_API_URL,
    isLocalApp ? normalizeApiUrl(appUrl) : '',
  ].filter(Boolean);

  return [...new Set(candidates)];
}

async function getStoredState() {
  const saved = await chrome.storage.local.get(STORAGE_KEY);
  const data = saved?.[STORAGE_KEY] || {};

  return {
    apiUrl: normalizeApiUrl(data.apiUrl),
    appUrl: normalizeAppUrl(data.appUrl),
    token: data.token || null,
    user: data.user || null,
  };
}

function getApiCandidatesFromState(state) {
  const appUrl = normalizeAppUrl(state?.appUrl);
  const appOrigin = (() => {
    try {
      return new URL(appUrl).origin;
    } catch {
      return '';
    }
  })();
  const isLocalApp = /:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(appOrigin);

  const explicit = normalizeApiUrl(state?.apiUrl);
  const explicitOrigin = (() => {
    try {
      return new URL(explicit).origin;
    } catch {
      return '';
    }
  })();
  const explicitLooksLikeFrontendApi = !isLocalApp && explicitOrigin && explicitOrigin === appOrigin;

  const derived = isLocalApp ? normalizeApiUrl(appUrl) : '';
  const known = KNOWN_API_BY_APP[appUrl] ? normalizeApiUrl(KNOWN_API_BY_APP[appUrl]) : '';
  const defaults = [DEFAULT_API_URL, explicitLooksLikeFrontendApi ? '' : explicit, known, derived].filter(Boolean);
  return [...new Set(defaults)];
}

async function setStoredState(partial) {
  const current = await getStoredState();
  const next = { ...current, ...partial };
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}

function getErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload.error === 'string') return payload.error;
  if (typeof payload.message === 'string') return payload.message;
  return fallback;
}

async function getAppTabId(appUrl, createIfMissing = true) {
  const appOrigin = new URL(normalizeAppUrl(appUrl)).origin;
  const tabs = await chrome.tabs.query({ url: [`${appOrigin}/*`] });
  const existing = tabs.find((tab) => typeof tab.id === 'number');

  if (existing?.id) return existing.id;
  if (!createIfMissing) return null;

  const created = await chrome.tabs.create({ url: appOrigin, active: false });
  if (typeof created.id !== 'number') return null;
  return created.id;
}

async function apiRequestViaAppTab({ appUrl, apiUrl, token, path, method = 'GET', body }) {
  const tabId = await getAppTabId(appUrl, true);
  if (!tabId) {
    throw new Error(`No TAAS tab available at ${normalizeAppUrl(appUrl)}.`);
  }

  const exec = await chrome.scripting.executeScript({
    target: { tabId },
    world: 'MAIN',
    args: [apiUrl, path, method, token || null, body || null],
    func: async (baseApiUrl, reqPath, reqMethod, reqToken, reqBody) => {
      try {
        const response = await fetch(`${baseApiUrl}${reqPath}`, {
          method: reqMethod,
          headers: {
            'Content-Type': 'application/json',
            ...(reqToken ? { Authorization: `Bearer ${reqToken}` } : {}),
          },
          body: reqBody ? JSON.stringify(reqBody) : undefined,
        });

        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();
        return {
          ok: response.ok,
          status: response.status,
          contentType,
          text,
          networkError: null,
        };
      } catch (error) {
        return {
          ok: false,
          status: 0,
          contentType: '',
          text: '',
          networkError: error instanceof Error ? error.message : 'Failed to fetch',
        };
      }
    },
  });

  const result = exec?.[0]?.result;
  if (!result) {
    throw new Error('Failed to execute API request in TAAS tab.');
  }

  if (result.networkError) {
    throw new Error(`Cannot reach API from TAAS tab. ${result.networkError}`);
  }

  let payload = null;
  if (result.contentType.includes('application/json')) {
    try {
      payload = JSON.parse(result.text || '{}');
    } catch {
      payload = null;
    }
  }

  if (!result.ok) {
    throw new Error(`${getErrorMessage(payload, `Request failed (${result.status})`)} [${apiUrl}${path}]`);
  }

  return payload;
}

async function apiRequest({ apiUrl, appUrl, token, path, method = 'GET', body }) {
  let response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    if (appUrl) {
      try {
        return await apiRequestViaAppTab({ appUrl, apiUrl, token, path, method, body });
      } catch (fallbackError) {
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Fallback failed';
        throw new Error(
          `Cannot reach API at ${apiUrl}. ${message}. Also failed via TAAS tab: ${fallbackMessage}`
        );
      }
    }
    throw new Error(`Cannot reach API at ${apiUrl}. ${message}. Check API URL, server status, and CORS deployment.`);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(`${getErrorMessage(payload, `Request failed (${response.status})`)} [${apiUrl}${path}]`);
  }

  return payload;
}

async function apiRequestWithFallback({ apiUrlCandidates, appUrl, token, path, method = 'GET', body }) {
  const candidates = (apiUrlCandidates || []).filter(Boolean);
  if (candidates.length === 0) {
    throw new Error('No API URL candidates configured.');
  }

  let lastError = 'Request failed';
  for (const candidate of candidates) {
    try {
      const response = await apiRequest({
        apiUrl: candidate,
        appUrl,
        token,
        path,
        method,
        body,
      });
      return { response, apiUrl: candidate };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Request failed';
    }
  }

  throw new Error(lastError);
}

async function ensureJobTrackerEnabled(apiUrlCandidates, token, appUrl) {
  const status = await apiRequestWithFallback({
    apiUrlCandidates,
    appUrl,
    token,
    path: '/plugins/job-tracker/status',
  });

  if (!status?.response?.data?.enabled) {
    await apiRequestWithFallback({
      apiUrlCandidates,
      appUrl,
      token,
      path: '/plugins/job-tracker/enable',
      method: 'POST',
      body: { settings: {} },
    });
  }

  return status?.apiUrl || apiUrlCandidates[0];
}

function firstNonEmpty(values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function extractLinkedInJobId(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    const pathMatch = parsed.pathname.match(/\/jobs\/view\/(\d+)/);
    if (pathMatch?.[1]) return pathMatch[1];

    const fromQuery = parsed.searchParams.get('currentJobId') || parsed.searchParams.get('jobId');
    if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery;
  } catch {
    return null;
  }

  const looseMatch = String(rawUrl || '').match(/\/jobs\/view\/(\d+)/);
  return looseMatch?.[1] || null;
}

function normalizeLinkedInJobUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  try {
    const parsed = new URL(rawUrl);
    if (!parsed.hostname.includes('linkedin.com')) return rawUrl;

    const id = extractLinkedInJobId(rawUrl);
    if (id) return `https://www.linkedin.com/jobs/view/${id}/`;

    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return rawUrl;
  }
}

function normalizeUrlForCompare(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
  } catch {
    return String(value || '').trim().replace(/\/+$/, '');
  }
}

async function findExistingApplication(apiUrlCandidates, appUrl, token, createPayload) {
  const searchTerm = createPayload.jobTitle || createPayload.company;
  if (!searchTerm) return null;

  const response = await apiRequestWithFallback({
    apiUrlCandidates,
    appUrl,
    token,
    path: `/job-tracker/applications?search=${encodeURIComponent(searchTerm)}&limit=30&sortBy=createdAt&sortOrder=desc`,
  });

  const apps = Array.isArray(response?.response?.data) ? response.response.data : [];
  const targetJobUrl = normalizeUrlForCompare(createPayload.jobUrl);
  const targetSourceUrl = normalizeUrlForCompare(createPayload.sourceUrl);

  const exactUrlMatch = apps.find((app) => {
    const appJobUrl = normalizeUrlForCompare(app?.jobUrl);
    const appSourceUrl = normalizeUrlForCompare(app?.sourceUrl);
    return (
      (targetJobUrl && appJobUrl && appJobUrl === targetJobUrl) ||
      (targetSourceUrl && appSourceUrl && appSourceUrl === targetSourceUrl)
    );
  });
  if (exactUrlMatch?.id) return exactUrlMatch;

  const fallbackMatch = apps.find((app) => {
    const sameCompany = String(app?.company || '').trim().toLowerCase() === String(createPayload.company || '').trim().toLowerCase();
    const sameTitle = String(app?.jobTitle || '').trim().toLowerCase() === String(createPayload.jobTitle || '').trim().toLowerCase();
    return sameCompany && sameTitle;
  });

  return fallbackMatch?.id ? fallbackMatch : null;
}

function buildCreatePayload(scraped, fallback) {
  const company = firstNonEmpty([scraped?.company, fallback?.company]).slice(0, 200);
  const jobTitle = firstNonEmpty([scraped?.jobTitle, fallback?.jobTitle]).slice(0, 300);

  if (!company || !jobTitle) {
    throw new Error('Could not detect company/title on this LinkedIn page. Open the job details panel and try again.');
  }

  return {
    company,
    jobTitle,
    location: firstNonEmpty([scraped?.location, fallback?.location]).slice(0, 200) || undefined,
    jobUrl: firstNonEmpty([scraped?.jobUrl, fallback?.url]) || undefined,
    sourceUrl: firstNonEmpty([fallback?.url, scraped?.jobUrl]) || undefined,
    source: 'LinkedIn (Extension)',
    status: 'applied',
    priority: 'medium',
  };
}

async function handleLogin(message) {
  const appUrl = normalizeAppUrl(message.appUrl);
  const candidates = getApiCandidates(message.apiUrl, message.appUrl);

  if (!message.email || !message.password) {
    throw new Error('Email and password are required.');
  }

  let lastError = 'Login failed.';
  for (const apiUrl of candidates) {
    try {
      const loginResponse = await apiRequestWithFallback({
        apiUrlCandidates: [apiUrl],
        appUrl,
        path: '/auth/email-login',
        method: 'POST',
        body: {
          email: message.email,
          password: message.password,
        },
      });

      const token = loginResponse?.response?.data?.token;
      const user = loginResponse?.response?.data?.user;
      const workingApiUrl = loginResponse?.apiUrl || apiUrl;

      if (!token) {
        throw new Error('Login succeeded but no token was returned.');
      }

      await setStoredState({ apiUrl: workingApiUrl, appUrl, token, user: user || null });

      return {
        ok: true,
        data: {
          apiUrl: workingApiUrl,
          appUrl,
          user,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Login failed';
    }
  }

  throw new Error(lastError);
}

async function handleImportSession(message) {
  const appUrl = normalizeAppUrl(message.appUrl);
  const apiUrl = normalizeApiUrl(message.apiUrl);

  const appOrigin = new URL(appUrl).origin;
  const tabs = await chrome.tabs.query({ url: [`${appOrigin}/*`] });
  const appTab = tabs.find((tab) => typeof tab.id === 'number');

  if (!appTab?.id) {
    throw new Error(`Open ${appOrigin} in a tab and log in there first, then click "Use Current TAAS Session" again.`);
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: appTab.id },
    func: () => localStorage.getItem('token'),
  });

  const token = typeof results?.[0]?.result === 'string' ? results[0].result : null;
  if (!token) {
    throw new Error('No TAAS token found in that tab. Please log in on the TAAS app tab first.');
  }

  const meResponse = await apiRequestWithFallback({
    apiUrlCandidates: [apiUrl],
    appUrl,
    token,
    path: '/auth/me',
  });

  const user = meResponse?.response?.data || null;
  const workingApiUrl = meResponse?.apiUrl || apiUrl;
  await setStoredState({ apiUrl: workingApiUrl, appUrl, token, user });

  return {
    ok: true,
    data: {
      apiUrl: workingApiUrl,
      appUrl,
      user,
    },
  };
}

async function handleSaveJob(message) {
  const state = await getStoredState();
  if (!state.token) {
    return { ok: false, error: 'Please log in from the extension popup first.' };
  }

  const apiCandidates = getApiCandidatesFromState(state);
  const enabledApiUrl = await ensureJobTrackerEnabled(apiCandidates, state.token, state.appUrl);
  const workingCandidates = [enabledApiUrl, ...apiCandidates.filter((u) => u !== enabledApiUrl)];

  const fallback = message.payload || {};
  if (!fallback.url || typeof fallback.url !== 'string') {
    return { ok: false, error: 'Could not read the current LinkedIn job URL.' };
  }

  const normalizedJobUrl = normalizeLinkedInJobUrl(fallback.url);
  let scrapedData = null;
  let scrapeError = null;

  try {
    const scrapeResponse = await apiRequestWithFallback({
      apiUrlCandidates: workingCandidates,
      appUrl: state.appUrl,
      token: state.token,
      path: '/job-tracker/scrape',
      method: 'POST',
      body: { url: normalizedJobUrl },
    });
    scrapedData = scrapeResponse?.response?.data || null;
    if (scrapeResponse?.apiUrl && scrapeResponse.apiUrl !== state.apiUrl) {
      await setStoredState({ apiUrl: scrapeResponse.apiUrl });
    }
  } catch (error) {
    scrapeError = error instanceof Error ? error.message : 'Scraper request failed';
  }

  const createPayload = buildCreatePayload(scrapedData, {
    ...fallback,
    url: normalizedJobUrl || fallback.url,
  });

  let createResponse = null;
  let createError = null;
  let recoveredExisting = null;
  try {
    createResponse = (await apiRequestWithFallback({
      apiUrlCandidates: workingCandidates,
      appUrl: state.appUrl,
      token: state.token,
      path: '/job-tracker/applications',
      method: 'POST',
      body: createPayload,
    }))?.response;
  } catch (error) {
    createError = error instanceof Error ? error.message : 'Create failed';
    // Retry with minimal payload for backend compatibility.
    const minimalPayload = {
      company: createPayload.company,
      jobTitle: createPayload.jobTitle,
      jobUrl: createPayload.jobUrl,
      sourceUrl: createPayload.sourceUrl,
      source: createPayload.source,
      status: 'applied',
      priority: 'medium',
    };

    try {
      createResponse = (await apiRequestWithFallback({
        apiUrlCandidates: workingCandidates,
        appUrl: state.appUrl,
        token: state.token,
        path: '/job-tracker/applications',
        method: 'POST',
        body: minimalPayload,
      }))?.response;
    } catch (retryError) {
      const retryMessage = retryError instanceof Error ? retryError.message : 'Create retry failed';
      createError = `${createError}; ${retryMessage}`;

      // Final retry with strict oldest-schema payload.
      const strictPayload = {
        company: createPayload.company,
        jobTitle: createPayload.jobTitle,
      };

      try {
        createResponse = (await apiRequestWithFallback({
          apiUrlCandidates: workingCandidates,
          appUrl: state.appUrl,
          token: state.token,
          path: '/job-tracker/applications',
          method: 'POST',
          body: strictPayload,
        }))?.response;
      } catch (strictError) {
        const strictMessage = strictError instanceof Error ? strictError.message : 'Strict create retry failed';
        createError = `${createError}; ${strictMessage}`;

        // Recovery path: create may have succeeded but failed after insert (e.g. activity logging).
        recoveredExisting = await findExistingApplication(workingCandidates, state.appUrl, state.token, createPayload);
        if (!recoveredExisting?.id) {
          throw new Error(createError);
        }
      }
    }
  }

  const appId = createResponse?.data?.id || recoveredExisting?.id;

  return {
    ok: true,
    data: {
      appId,
      appUrl: state.appUrl,
      company: createPayload.company,
      jobTitle: createPayload.jobTitle,
      usedFallback: !scrapedData,
      scrapeError,
      createRetried: Boolean(createError),
      createError,
      recoveredExisting: Boolean(recoveredExisting?.id),
    },
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (!message?.type) {
      sendResponse({ ok: false, error: 'Invalid message type.' });
      return;
    }

    if (message.type === 'GET_STATUS') {
      const state = await getStoredState();
      sendResponse({
        ok: true,
        data: {
          isLoggedIn: Boolean(state.token),
          apiUrl: state.apiUrl,
          appUrl: state.appUrl,
          user: state.user,
        },
      });
      return;
    }

    if (message.type === 'SAVE_SETTINGS') {
      const next = await setStoredState({
        apiUrl: normalizeApiUrl(message.apiUrl),
        appUrl: normalizeAppUrl(message.appUrl),
      });
      sendResponse({ ok: true, data: next });
      return;
    }

    if (message.type === 'LOGIN') {
      const result = await handleLogin(message);
      sendResponse(result);
      return;
    }

    if (message.type === 'LOGOUT') {
      await setStoredState({ token: null, user: null });
      sendResponse({ ok: true });
      return;
    }

    if (message.type === 'IMPORT_SESSION') {
      const result = await handleImportSession(message);
      sendResponse(result);
      return;
    }

    if (message.type === 'SAVE_JOB_FROM_LINKEDIN') {
      const result = await handleSaveJob(message);
      sendResponse(result);
      return;
    }

    sendResponse({ ok: false, error: `Unsupported message type: ${message.type}` });
  })().catch((error) => {
    sendResponse({
      ok: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    });
  });

  return true;
});
