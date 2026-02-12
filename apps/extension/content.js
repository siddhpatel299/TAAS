// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    const data = scrapeJobDetails();
    sendResponse(data);
  } else if (request.action === "getSelection") {
    sendResponse({ selection: window.getSelection().toString() });
  }
});

function scrapeJobDetails() {
  const data = {
    title: "",
    company: "",
    location: "",
    url: window.location.href
  };


  // 1. Try JSON-LD (Most Reliable, matches backend logic)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const json = JSON.parse(script.textContent);
      const job = Array.isArray(json) ? json.find(j => j['@type'] === 'JobPosting') : json;
      
      if (job && job['@type'] === 'JobPosting') {
        if (!data.title && job.title) data.title = job.title;
        if (!data.company && job.hiringOrganization?.name) data.company = job.hiringOrganization.name;
        if (!data.location) {
            data.location = job.jobLocation?.address?.addressLocality || 
                            (typeof job.jobLocation === 'string' ? job.jobLocation : '');
        }
        if (!data.description && job.description) {
            // Clean HTML from description
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = job.description;
            data.description = tempDiv.innerText.trim();
        }
      }
    } catch (e) {
      console.error('Error parsing JSON-LD:', e);
    }
  }

  // 2. Specific Heuristics for LinkedIn
  if (window.location.hostname.includes("linkedin.com")) {
    const titleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title h1');
    const companyEl = document.querySelector('.job-details-jobs-unified-top-card__company-name');
    const locationEl = document.querySelector('.job-details-jobs-unified-top-card__bullet');
    
    // Selectors from backend service + common ones + Sidebar view
    const descriptionEl = document.querySelector('.jobs-description__content') || 
                          document.querySelector('.jobs-description-content__text') || 
                          document.querySelector('.show-more-less-html__markup') || 
                          document.querySelector('.description__text') ||
                          document.querySelector('#job-details') || 
                          document.querySelector('.job-view-layout .jobs-description') ||
                          // Sidebar view selectors
                          document.querySelector('.jobs-search__job-details--container') ||
                          document.querySelector('.job-details-jobs-unified-top-card').parentNode.querySelector('.jobs-description__content');

    if (!data.title && titleEl) data.title = titleEl.textContent.trim();
    if (!data.company && companyEl) data.company = companyEl.textContent.trim();
    if (!data.location && locationEl) data.location = locationEl.textContent.trim();
    if (!data.description && descriptionEl) {
      data.description = descriptionEl.innerText.trim();
    }
  }

  // 3. Fallback: User Selection
  if (!data.description) {
       const selection = window.getSelection().toString();
       if (selection) data.description = selection;
  }
  
  // 4. Fallback: Generic Largest Text Block (for sidebar/dynamic views)
  if (!data.description) {
      const candidates = document.querySelectorAll('div, article, section');
      let bestCandidate = null;
      let maxLen = 0;
      
      candidates.forEach(el => {
          const text = el.innerText;
          // Look for keywords common in JDs
          if (text.length > 200 && (text.includes('About the job') || text.includes('Requirements') || text.includes('Description'))) {
              if (text.length > maxLen && text.length < 10000) { // Limit max length to avoid grabbing whole page
                  maxLen = text.length;
                  bestCandidate = el;
              }
          }
      });
      
      if (bestCandidate) {
          data.description = bestCandidate.innerText.trim();
      }
  }

  // 5. Fallback: Page Title cleaning (if still empty)
  if (!data.title) {
    data.title = document.title;
  }

  return data;
}
