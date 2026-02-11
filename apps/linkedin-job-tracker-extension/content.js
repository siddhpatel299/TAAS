const BUTTON_ID = 'taas-linkedin-save-button';
const TOAST_ID = 'taas-linkedin-save-toast';

function getText(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const text = element?.textContent?.trim();
    if (text) return text;
  }
  return '';
}

function getJobDetails() {
  const description = getText([
    '.jobs-description__content',
    '.jobs-box__html-content',
    '#job-details',
    '.jobs-description-content__text',
  ]);

  return {
    url: window.location.href,
    jobTitle: getText([
      '.job-details-jobs-unified-top-card__job-title h1',
      '.job-details-jobs-unified-top-card__job-title',
      'h1.t-24',
      '.jobs-unified-top-card__job-title',
    ]),
    company: getText([
      '.job-details-jobs-unified-top-card__company-name a',
      '.job-details-jobs-unified-top-card__company-name',
      '.jobs-unified-top-card__company-name a',
      '.jobs-unified-top-card__company-name',
    ]),
    location: getText([
      '.job-details-jobs-unified-top-card__primary-description-container span',
      '.jobs-unified-top-card__primary-description-without-tagline',
      '.jobs-unified-top-card__bullet',
    ]),
    description: description ? description.slice(0, 9000) : '',
  };
}

function showToast(message, isError = false, appLink = null) {
  const existing = document.getElementById(TOAST_ID);
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.style.position = 'fixed';
  toast.style.top = '16px';
  toast.style.right = '16px';
  toast.style.zIndex = '999999';
  toast.style.maxWidth = '360px';
  toast.style.padding = '12px 14px';
  toast.style.borderRadius = '10px';
  toast.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
  toast.style.fontSize = '13px';
  toast.style.lineHeight = '1.4';
  toast.style.background = isError ? '#7f1d1d' : '#14532d';
  toast.style.color = '#fff';
  toast.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  toast.textContent = message;

  if (appLink && !isError) {
    const anchor = document.createElement('a');
    anchor.href = appLink;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.color = '#bfdbfe';
    anchor.style.marginLeft = '8px';
    anchor.style.textDecoration = 'underline';
    anchor.textContent = 'Open';
    toast.appendChild(anchor);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

function setButtonState(button, label, disabled) {
  button.textContent = label;
  button.disabled = disabled;
  button.style.opacity = disabled ? '0.7' : '1';
  button.style.cursor = disabled ? 'not-allowed' : 'pointer';
}

function createButton() {
  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = 'Add to Job Tracker';
  button.style.position = 'fixed';
  button.style.right = '20px';
  button.style.bottom = '20px';
  button.style.zIndex = '999999';
  button.style.border = 'none';
  button.style.borderRadius = '9999px';
  button.style.padding = '10px 14px';
  button.style.fontSize = '14px';
  button.style.fontWeight = '600';
  button.style.background = '#0A66C2';
  button.style.color = '#fff';
  button.style.boxShadow = '0 8px 24px rgba(10, 102, 194, 0.35)';

  button.addEventListener('mouseenter', () => {
    if (!button.disabled) button.style.background = '#004182';
  });

  button.addEventListener('mouseleave', () => {
    if (!button.disabled) button.style.background = '#0A66C2';
  });

  button.addEventListener('click', () => {
    const details = getJobDetails();
    setButtonState(button, 'Saving...', true);

    chrome.runtime.sendMessage(
      {
        type: 'SAVE_JOB_FROM_LINKEDIN',
        payload: details,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          showToast(chrome.runtime.lastError.message || 'Failed to save job.', true);
          setButtonState(button, 'Add to Job Tracker', false);
          return;
        }

        if (!response?.ok) {
          showToast(response?.error || 'Failed to save job.', true);
          setButtonState(button, 'Add to Job Tracker', false);
          return;
        }

        const appId = response?.data?.appId;
        const appUrl = response?.data?.appUrl;
        const usedFallback = Boolean(response?.data?.usedFallback);
        const createRetried = Boolean(response?.data?.createRetried);
        const recoveredExisting = Boolean(response?.data?.recoveredExisting);
        const link = appId && appUrl ? `${appUrl}/plugins/job-tracker/applications/${appId}` : null;

        setButtonState(button, 'Saved', true);
        showToast(
          recoveredExisting
            ? 'Saved (recovered from backend error).'
            : createRetried
              ? 'Saved with compatibility mode.'
              : usedFallback
                ? 'Saved using page data (scraper unavailable).'
                : 'Saved to TAAS Job Tracker.',
          false,
          link
        );

        setTimeout(() => {
          setButtonState(button, 'Add to Job Tracker', false);
        }, 2500);
      }
    );
  });

  return button;
}

function isJobPage() {
  return window.location.pathname.startsWith('/jobs');
}

function ensureButton() {
  const existing = document.getElementById(BUTTON_ID);

  if (!isJobPage()) {
    if (existing) existing.remove();
    return;
  }

  if (!existing) {
    const button = createButton();
    document.body.appendChild(button);
  }
}

let lastHref = window.location.href;
ensureButton();

setInterval(() => {
  if (window.location.href !== lastHref) {
    lastHref = window.location.href;
  }
  ensureButton();
}, 1000);
