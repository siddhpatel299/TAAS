import streamlit as st
import requests
import pandas as pd
import json
import os
from datetime import datetime
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

def get_secret(key):
    """Safely fetch a secret without requiring secrets.toml locally."""
    try:
        return st.secrets[key]
    except Exception:
        return None

# --- CONFIGURATION ---
API_KEY = os.getenv("GOOGLE_API_KEY") or get_secret("GOOGLE_API_KEY")
SEARCH_ENGINE_ID = os.getenv("GOOGLE_CX") or get_secret("GOOGLE_CX")
QUOTA_FILE = "quota_usage.json"
HISTORY_FILE = "search_history.json"
SAVED_SEARCHES_FILE = "saved_searches.json"
DAILY_LIMIT = 100

if not API_KEY or not SEARCH_ENGINE_ID:
    st.error("Missing Google Custom Search credentials. Set GOOGLE_API_KEY and GOOGLE_CX via environment variables or Streamlit secrets.")
    st.stop()

# --- JOB FIELDS / CATEGORIES ---
JOB_FIELDS = {
    "🔐 Cybersecurity": {
        "titles": [
            # Analyst Roles
            "Security Analyst", "Jr Security Analyst", "Junior Security Analyst",
            "SOC Analyst", "Jr SOC Analyst", "Junior SOC Analyst", "SOC Analyst I", "SOC Analyst II", "SOC Analyst III",
            "Cybersecurity Analyst", "Jr Cybersecurity Analyst", "Information Security Analyst",
            "Threat Intelligence Analyst", "Cyber Threat Analyst", "Threat Analyst",
            "Vulnerability Analyst", "Vulnerability Management Analyst",
            "GRC Analyst", "Compliance Analyst", "Risk Analyst", "IT Risk Analyst",
            "DFIR Analyst", "Forensics Analyst", "Digital Forensics Analyst",
            "Malware Analyst", "Reverse Engineer",
            # Engineer Roles
            "Security Engineer", "Jr Security Engineer", "Junior Security Engineer",
            "Cloud Security Engineer", "Application Security Engineer", "AppSec Engineer",
            "Network Security Engineer", "Infrastructure Security Engineer",
            "IAM Engineer", "Identity Access Management Engineer", "Identity Engineer",
            "Detection Engineer", "Security Automation Engineer",
            # Operations & Response
            "Incident Response", "Incident Response Analyst", "Incident Handler",
            "Security Operations", "Security Operations Engineer", "SecOps Engineer",
            "Penetration Tester", "Pen Tester", "Ethical Hacker", "Offensive Security",
            "Red Team", "Red Team Operator", "Blue Team", "Purple Team",
            # Senior & Leadership
            "Security Architect", "Senior Security Engineer", "Lead Security Engineer",
            "Security Consultant", "Cybersecurity Consultant", "Security Specialist"
        ],
        "skills": ["SIEM", "Splunk", "CrowdStrike", "Sentinel", "Firewall", "IDS/IPS", "Threat Hunting", "NIST", "ISO 27001", "SOC", "EDR", "XDR"]
    },
    "💻 Software Engineering": {
        "titles": [
            "Software Engineer", "Jr Software Engineer", "Junior Software Engineer", "Software Engineer I", "Software Engineer II",
            "Software Developer", "Jr Software Developer", "Junior Developer",
            "Backend Engineer", "Jr Backend Engineer", "Backend Developer",
            "Frontend Engineer", "Jr Frontend Engineer", "Frontend Developer",
            "Full Stack Developer", "Full Stack Engineer", "Jr Full Stack Developer",
            "Web Developer", "Jr Web Developer",
            "Mobile Developer", "iOS Developer", "Android Developer",
            "DevOps Engineer", "Jr DevOps Engineer", "DevOps Specialist",
            "SRE", "Site Reliability Engineer", "Jr SRE",
            "Platform Engineer", "API Developer", "Embedded Engineer", "Systems Programmer"
        ],
        "skills": ["Python", "JavaScript", "Java", "Go", "Rust", "React", "Node.js", "AWS", "Docker", "Kubernetes"]
    },
    "📊 Data & Analytics": {
        "titles": [
            "Data Analyst", "Jr Data Analyst", "Junior Data Analyst", "Business Data Analyst",
            "Data Scientist", "Jr Data Scientist", "Junior Data Scientist",
            "Data Engineer", "Jr Data Engineer", "Junior Data Engineer",
            "Business Analyst", "Jr Business Analyst", "Business Intelligence Analyst",
            "BI Developer", "BI Engineer", "Analytics Engineer",
            "Machine Learning Engineer", "ML Engineer", "Jr ML Engineer",
            "AI Engineer", "MLOps Engineer", "Quantitative Analyst"
        ],
        "skills": ["Python", "SQL", "Tableau", "Power BI", "Spark", "Snowflake", "TensorFlow", "PyTorch"]
    },
    "☁️ Cloud & Infrastructure": {
        "titles": [
            "Cloud Engineer", "Jr Cloud Engineer", "Junior Cloud Engineer",
            "Cloud Architect", "AWS Engineer", "Azure Engineer", "GCP Engineer",
            "Infrastructure Engineer", "Jr Infrastructure Engineer",
            "Network Engineer", "Jr Network Engineer", "Junior Network Engineer",
            "Systems Administrator", "Jr Systems Administrator", "SysAdmin",
            "Linux Administrator", "Linux Engineer", "Windows Administrator",
            "Site Reliability Engineer", "Platform Engineer"
        ],
        "skills": ["AWS", "Azure", "GCP", "Terraform", "Ansible", "Linux", "Networking", "CI/CD"]
    },
    "🎨 Product & Design": {
        "titles": [
            "Product Manager", "Jr Product Manager", "Associate Product Manager",
            "Product Owner", "Technical Product Manager",
            "UX Designer", "Jr UX Designer", "UI Designer", "Jr UI Designer",
            "UX Researcher", "Jr UX Researcher", "User Researcher",
            "Product Designer", "Jr Product Designer",
            "Interaction Designer", "Visual Designer", "Design Systems"
        ],
        "skills": ["Figma", "Sketch", "User Research", "Prototyping", "A/B Testing", "Agile"]
    },
    "🛠️ IT & Support": {
        "titles": [
            "IT Support", "IT Support Specialist", "Jr IT Support",
            "Help Desk", "Help Desk Analyst", "Help Desk Technician",
            "Desktop Support", "Desktop Support Technician",
            "IT Administrator", "Jr IT Administrator", "IT Admin",
            "Technical Support Engineer", "Jr Technical Support",
            "IT Specialist", "System Support", "IT Technician", "Field Service Technician"
        ],
        "skills": ["Windows", "Active Directory", "Office 365", "ServiceNow", "ITIL", "Troubleshooting"]
    },
    "📝 Custom Search": {
        "titles": [],
        "skills": []
    }
}

# --- EXPANDED ATS SITES ---
ATS_SITES = {
    "All Platforms (ATS + LinkedIn)": [
        "site:boards.greenhouse.io", "site:jobs.lever.co", "site:myworkdayjobs.com",
        "site:jobs.ashbyhq.com", "site:icims.com", "site:jobs.smartrecruiters.com",
        "site:careers.workable.com", "site:apply.workable.com", "site:recruiting.paylocity.com",
        "site:jobs.jobvite.com", "site:hire.jazz.co", "site:breezy.hr",
        "site:bamboohr.com/jobs", "site:recruitee.com", "site:applytojob.com",
        "site:linkedin.com/jobs"
    ],
    "LinkedIn Jobs": ["site:linkedin.com/jobs"],
    "All ATS (No LinkedIn)": [
        "site:boards.greenhouse.io", "site:jobs.lever.co", "site:myworkdayjobs.com",
        "site:jobs.ashbyhq.com", "site:icims.com", "site:jobs.smartrecruiters.com",
        "site:careers.workable.com", "site:apply.workable.com", "site:recruiting.paylocity.com",
        "site:jobs.jobvite.com", "site:hire.jazz.co", "site:breezy.hr",
        "site:bamboohr.com/jobs", "site:recruitee.com", "site:applytojob.com"
    ],
    "Tech Giants": [
        "site:careers.google.com", "site:amazon.jobs", "site:careers.microsoft.com",
        "site:meta.com/careers", "site:apple.com/careers"
    ],
    "Greenhouse Only": ["site:boards.greenhouse.io"],
    "Lever Only": ["site:jobs.lever.co"],
    "Workday Only": ["site:myworkdayjobs.com"],
}

# --- QUOTA MANAGEMENT ---
def get_quota_status():
    """Checks how many searches are left for today."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    if not os.path.exists(QUOTA_FILE):
        return DAILY_LIMIT, 0
        
    with open(QUOTA_FILE, "r") as f:
        try:
            data = json.load(f)
            if data["date"] == today_str:
                used = data["count"]
                remaining = max(0, DAILY_LIMIT - used)
                return remaining, used
            else:
                return DAILY_LIMIT, 0
        except:
            return DAILY_LIMIT, 0

def increment_quota():
    """Increments the search counter by 1."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    _, used = get_quota_status()
    
    new_data = {"date": today_str, "count": used + 1}
    with open(QUOTA_FILE, "w") as f:
        json.dump(new_data, f)

# --- SEARCH HISTORY ---
def load_search_history():
    """Load search history from file."""
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return []

def save_search_history(query, mode, results_count):
    """Save a search to history."""
    history = load_search_history()
    history.insert(0, {
        "query": query,
        "mode": mode,
        "results": results_count,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")
    })
    # Keep only last 20 searches
    history = history[:20]
    with open(HISTORY_FILE, "w") as f:
        json.dump(history, f)

def clear_search_history():
    """Clear all search history."""
    if os.path.exists(HISTORY_FILE):
        os.remove(HISTORY_FILE)

# --- SAVED SEARCHES ---
def load_saved_searches():
    """Load saved searches from file."""
    if not os.path.exists(SAVED_SEARCHES_FILE):
        return []
    with open(SAVED_SEARCHES_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return []

def save_search(name, search_type, results):
    """Save a search with its results."""
    searches = load_saved_searches()
    searches.append({
        "name": name,
        "type": search_type,
        "results": results,
        "created": datetime.now().strftime("%Y-%m-%d %H:%M")
    })
    with open(SAVED_SEARCHES_FILE, "w") as f:
        json.dump(searches, f)

def delete_saved_search(index):
    """Delete a saved search by index."""
    searches = load_saved_searches()
    if 0 <= index < len(searches):
        searches.pop(index)
        with open(SAVED_SEARCHES_FILE, "w") as f:
            json.dump(searches, f)

# --- SEARCH TEMPLATES ---
SEARCH_TEMPLATES = {
    "Job Search Templates": {
        "🔥 Hot Startups - Security Roles": {
            "query": '(site:boards.greenhouse.io OR site:jobs.lever.co) ("Security Engineer" OR "Security Analyst") (startup OR "series A" OR "series B")',
            "description": "Find security roles at early-stage startups"
        },
        "💼 FAANG - New Grad Roles": {
            "query": '(site:careers.google.com OR site:amazon.jobs OR site:meta.com/careers) ("new grad" OR "university" OR "entry level") (software OR engineering)',
            "description": "Entry-level engineering at big tech"
        },
        "🚀 Remote DevOps Jobs": {
            "query": '(site:boards.greenhouse.io OR site:jobs.lever.co) ("DevOps" OR "SRE" OR "Platform Engineer") (remote OR "work from home")',
            "description": "Remote infrastructure and operations roles"
        },
        "🎓 Internships - Summer 2026": {
            "query": '(site:boards.greenhouse.io OR site:jobs.lever.co OR site:myworkdayjobs.com) (intern OR internship OR "summer 2026") (software OR engineering OR security)',
            "description": "Tech internships for next summer"
        },
        "💰 High-Paying Senior Roles": {
            "query": '(site:boards.greenhouse.io OR site:jobs.lever.co) (senior OR lead OR principal OR staff) (200k OR 300k OR "competitive salary")',
            "description": "Senior positions with high compensation signals"
        }
    },
    "LinkedIn X-Ray Templates": {
        "🎯 Hiring Managers at Target Company": {
            "query": 'site:linkedin.com/in/ "[COMPANY]" ("hiring manager" OR "engineering manager" OR "team lead")',
            "description": "Find decision-makers at specific company (replace [COMPANY])"
        },
        "🎓 Alumni Network - Same School": {
            "query": 'site:linkedin.com/in/ "[YOUR_SCHOOL]" ("software engineer" OR "data scientist") -intern',
            "description": "Connect with alumni in tech roles (replace [YOUR_SCHOOL])"
        },
        "📞 Technical Recruiters": {
            "query": 'site:linkedin.com/in/ ("technical recruiter" OR "talent acquisition") ("[COMPANY]" OR "big tech" OR FAANG)',
            "description": "Find recruiters specializing in tech roles"
        },
        "🌟 Recently Promoted Leaders": {
            "query": 'site:linkedin.com/in/ ("recently promoted" OR "new role" OR "excited to announce") (director OR VP OR "head of")',
            "description": "Connect with people who just got promoted"
        },
        "🔄 Job Seekers - Open to Work": {
            "query": 'site:linkedin.com/in/ ("open to work" OR "seeking opportunities" OR "looking for") ("software engineer" OR "security analyst")',
            "description": "Find active job seekers in your field"
        }
    },
    "Company Research Templates": {
        "📈 Funding & Growth Signals": {
            "query": '"[COMPANY]" ("series A" OR "series B" OR "series C" OR funding OR "raised" OR "venture capital")',
            "description": "Track funding rounds and investor activity"
        },
        "⚠️ Layoff & Risk Indicators": {
            "query": '"[COMPANY]" (layoffs OR "hiring freeze" OR restructuring OR "laid off" OR downsizing)',
            "description": "Monitor company stability and risks"
        },
        "🏆 Awards & Recognition": {
            "query": '"[COMPANY]" ("best place to work" OR award OR recognition OR "top employer" OR "Inc 5000")',
            "description": "Find company accolades and culture indicators"
        },
        "🔧 Tech Stack & Tools": {
            "query": '"[COMPANY]" site:stackshare.io OR "tech stack" OR "we use" OR "built with"',
            "description": "Discover technologies company uses"
        }
    }
}

# --- BOOLEAN SEARCH BUILDER ---
def build_boolean_query(must_include, should_include, must_exclude, exact_phrases, sites):
    """Build a boolean search query from components."""
    query_parts = []
    
    # Sites (OR logic)
    if sites:
        site_list = [s.strip() for s in sites if s.strip()]
        if site_list:
            query_parts.append('(' + ' OR '.join(site_list) + ')')
    
    # Must include (AND logic)
    if must_include:
        terms = [t.strip() for t in must_include.split(',') if t.strip()]
        if terms:
            query_parts.extend(terms)
    
    # Should include (OR logic)
    if should_include:
        terms = [t.strip() for t in should_include.split(',') if t.strip()]
        if terms:
            query_parts.append('(' + ' OR '.join([f'"{t}"' for t in terms]) + ')')
    
    # Exact phrases
    if exact_phrases:
        phrases = [p.strip() for p in exact_phrases.split(',') if p.strip()]
        if phrases:
            query_parts.extend([f'"{p}"' for p in phrases])
    
    # Must exclude (NOT logic)
    if must_exclude:
        terms = [t.strip() for t in must_exclude.split(',') if t.strip()]
        if terms:
            query_parts.extend([f'-{t}' if ' ' not in t else f'-"{t}"' for t in terms])
    
    return ' '.join(query_parts)

# --- BATCH COMPANY SEARCH ---
def batch_company_search(companies, job_titles, ats_sites, num_results=10, date_restrict=None):
    """Search multiple companies at once and aggregate results."""
    all_results = []
    company_stats = {}
    
    for company in companies:
        company = company.strip()
        if not company:
            continue
        
        # Build query for this company
        if len(job_titles) == 1:
            title_query = f'"{job_titles[0]}"'
        else:
            title_query = '(' + ' OR '.join([f'"{t}"' for t in job_titles]) + ')'
        
        search_query = f'({" OR ".join(ats_sites)}) "{company}" {title_query}'
        
        # Search
        results = google_search(search_query, num_results=num_results, date_restrict=date_restrict)
        
        # Track stats per company
        company_stats[company] = len(results)
        
        # Tag results with company name
        for result in results:
            result['search_company'] = company
            all_results.append(result)
    
    return all_results, company_stats

# --- DEDUPLICATION ---
def deduplicate_results(results):
    """Remove duplicate job listings based on URL and title similarity."""
    seen_urls = set()
    seen_titles = set()
    unique_results = []
    
    for item in results:
        url = item.get('link', '')
        title = item.get('title', '').lower().strip()
        
        # Normalize URL (remove tracking parameters)
        base_url = url.split('?')[0].rstrip('/')
        
        # Create a simple title fingerprint (first 50 chars, lowercase)
        title_key = ''.join(title[:50].split())
        
        # Skip if we've seen this URL or very similar title
        if base_url in seen_urls:
            continue
        if title_key in seen_titles:
            continue
            
        seen_urls.add(base_url)
        seen_titles.add(title_key)
        unique_results.append(item)
    
    return unique_results

# --- EXPORT FUNCTIONS ---
def convert_df_to_csv(df):
    """Convert DataFrame to CSV for download."""
    return df.to_csv(index=False).encode('utf-8')

def convert_df_to_excel(df):
    """Convert DataFrame to Excel for download."""
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Results')
    return output.getvalue()

# --- GOOGLE SEARCH ---
def google_search(query, num_results=10, date_restrict=None, start=1):
    """Search Google Custom Search API with pagination support."""
    # 1. Check Quota First
    remaining, _ = get_quota_status()
    if remaining <= 0:
        st.error("🚨 Daily Quota Exceeded (100/100). Try again tomorrow!")
        return []

    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        'key': API_KEY, 
        'cx': SEARCH_ENGINE_ID, 
        'q': query, 
        'num': num_results,
        'start': start  # Pagination: 1-based index
    }
    if date_restrict: 
        params['dateRestrict'] = date_restrict
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        # 2. Only increment if successful
        increment_quota()
        
        return response.json().get('items', [])
    except Exception as e:
        st.error(f"Error: {e}")
        return []

# --- APP UI ---
st.set_page_config(page_title="Cyber Search Pro", layout="wide", page_icon="🔎")

# --- MINIMAL CSS ---
st.markdown("""
<style>
    #MainMenu, footer {visibility: hidden;}
    .block-container {padding-top: 1.5rem;}
    .stTabs [data-baseweb="tab-list"] {gap: 8px;}
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        padding: 0 24px;
        white-space: nowrap;
    }
</style>
""", unsafe_allow_html=True)

# --- SIDEBAR ---
with st.sidebar:
    st.title("🔎 Search Pro")
    remaining, used = get_quota_status()
    st.metric("Searches Left", remaining, delta=f"{used} used")
    
    # Saved Searches
    st.markdown("---")
    saved_searches = load_saved_searches()
    if saved_searches:
        st.markdown("**Saved Searches**")
        for i, s in enumerate(saved_searches):
            col1, col2 = st.columns([4, 1])
            with col1:
                result_count = len(s.get('results', []))
                if st.button(f"📌 {s['name']} ({result_count})", key=f"load_{i}", use_container_width=True):
                    # Load saved results directly (no API call)
                    st.session_state['people_results'] = s.get('results', [])
                    st.session_state['loaded_search_name'] = s['name']
                    st.rerun()
            with col2:
                if st.button("🗑️", key=f"del_{i}"):
                    delete_saved_search(i)
                    st.rerun()

# --- MAIN TABS (People first as default) ---
tab_people, tab_jobs, tab_company, tab_premium = st.tabs(["People", "Jobs", "Company Research", "🌟 Premium"])

# --- TAB 2: JOB SEARCH ---
with tab_jobs:
    st.subheader("Find Jobs")
    
    col1, col2 = st.columns([1, 2])
    with col1:
        job_field = st.selectbox("Field", list(JOB_FIELDS.keys()), key="job_field")
    
    field_data = JOB_FIELDS[job_field]
    
    with col2:
        if job_field != "📝 Custom Search":
            selected_titles = st.multiselect(
                "Job Titles", 
                field_data["titles"],
                default=field_data["titles"],
                key=f"job_titles_{job_field}"
            )
        else:
            custom_role = st.text_input("Job Title", "Security Analyst", key="custom_role")
            selected_titles = [custom_role] if custom_role else []
    
    # Row 2: Filters
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        experience_level = st.selectbox("Experience", 
            ["Any", "Entry Level", "Mid Level", "Senior", "Lead", "Manager"],
            key="job_exp")
    with col2:
        freshness = st.selectbox("Posted", 
            ["Past Week", "24 Hours", "3 Days", "Month", "Anytime"], 
            key="job_fresh")
    with col3:
        location = st.text_input("Location", "", placeholder="Optional", key="job_loc")
    with col4:
        ats_choice = st.selectbox("Platform", list(ATS_SITES.keys()), key="job_ats")
    
    # Row 3: Optional filters (collapsed)
    with st.expander("More Filters"):
        col1, col2, col3 = st.columns(3)
        with col1:
            keywords = st.text_input("Skills", "", placeholder="Python, AWS", key="job_skills")
        with col2:
            target_company = st.text_input("Company", "", placeholder="Optional", key="job_company")
        with col3:
            exclude_keywords = st.text_input("Exclude", "", placeholder="Senior, Manager", key="job_exclude")
        
        col1, col2 = st.columns(2)
        with col1:
            remote_only = st.checkbox("Remote Only", key="job_remote")
        with col2:
            num_pages = st.slider("Pages (more = more results)", 1, 3, 1, key="job_pages")
    
    # Experience & Date mappings
    experience_map = {
        "Any": None,
        "Entry Level": '("entry level" OR "junior" OR "associate" OR "new grad")',
        "Mid Level": '("mid level" OR "2-5 years" OR "3+ years")',
        "Senior": '("senior" OR "sr." OR "5+ years")',
        "Lead": '("lead" OR "principal" OR "staff")',
        "Manager": '("manager" OR "director")'
    }
    
    date_map = {
        "24 Hours": "d1", 
        "3 Days": "d3",
        "Past Week": "w1", 
        "Month": "m1", 
        "Anytime": None
    }
    
    # Build Query
    ats_sites = ATS_SITES[ats_choice]
    titles_to_search = list(selected_titles)
    num_results = 10
    include_salary = False
    custom_title = ""
    
    # Validate and build query
    search_query = ""
    if titles_to_search:
        if len(titles_to_search) == 1:
            title_query = f'"{titles_to_search[0]}"'
        else:
            title_query = "(" + " OR ".join([f'"{t}"' for t in titles_to_search]) + ")"
        
        search_query = f'({" OR ".join(ats_sites)}) {title_query}'
        
        if keywords:
            skills = [s.strip() for s in keywords.split(",") if s.strip()]
            if skills:
                search_query += f' ({" OR ".join([f"{s}" for s in skills])})'
        if location:
            search_query += f' "{location}"'
        if target_company:
            search_query += f' "{target_company}"'
        if experience_map.get(experience_level):
            search_query += f' {experience_map[experience_level]}'
        if remote_only:
            search_query += ' (remote OR "work from home")'
        if exclude_keywords:
            exclusions = [f'-"{term.strip()}"' for term in exclude_keywords.split(",") if term.strip()]
            search_query += " " + " ".join(exclusions)
    
    # Search Button
    st.markdown("---")
    if st.button("🔍 Search Jobs", type="primary", use_container_width=True, disabled=not search_query):
        with st.spinner("Searching..."):
            all_results = []
            for page in range(num_pages):
                start_index = page * num_results + 1
                results = google_search(search_query, num_results=num_results, date_restrict=date_map.get(freshness), start=start_index)
                if results:
                    all_results.extend(results)
                else:
                    break
            
            # Deduplicate results
            results = deduplicate_results(all_results)
            
            if results:
                save_search_history(search_query, "Jobs", len(results))
                st.success(f"Found {len(results)} jobs")
                
                data = []
                for item in results:
                    link = item.get('link', '#')
                    company = ""
                    source = "Other"
                    
                    if "greenhouse.io" in link:
                        company = link.split("/")[3] if len(link.split("/")) > 3 else ""
                        source = "Greenhouse"
                    elif "lever.co" in link:
                        company = link.split("/")[3] if len(link.split("/")) > 3 else ""
                        source = "Lever"
                    elif "linkedin.com" in link:
                        source = "LinkedIn"
                        title = item.get('title', '')
                        if ' at ' in title:
                            company = title.split(' at ')[-1].split(' - ')[0].strip()
                    elif "myworkdayjobs.com" in link:
                        source = "Workday"
                    
                    data.append({
                        "Title": item.get('title', 'N/A'),
                        "Company": company.replace("-", " ").title(),
                        "Source": source,
                        "Link": link
                    })
                
                df = pd.DataFrame(data)
                
                st.dataframe(
                    df,
                    column_config={"Link": st.column_config.LinkColumn("Apply")},
                    use_container_width=True,
                    hide_index=True
                )
                
                st.download_button("📥 Download CSV", convert_df_to_csv(df), 
                                  f"jobs_{datetime.now().strftime('%Y%m%d')}.csv", "text/csv")
            else:
                st.warning("No jobs found. Try different filters.")

# --- TAB 1: PEOPLE SEARCH (Main Feature) ---
with tab_people:
    st.subheader("Find People on LinkedIn")
    
    search_type = st.radio(
        "Search Type",
        ["🎯 Company", "🎓 Alumni", "👔 Recruiters", "🔍 Custom"],
        horizontal=True,
        key="people_search_type"
    )
    
    if search_type == "🎯 Company":
        col1, col2 = st.columns(2)
        with col1:
            target_company = st.text_input("Company *", "CrowdStrike", key="p_company")
            target_role = st.text_input("Their Role/Department", "Security", key="p_role",
                                       help="e.g., Security, Engineering, Sales")
        with col2:
            seniority = st.selectbox("Seniority Level", 
                ["Any", "Entry/Junior", "Mid-Level", "Senior", "Manager", "Director", "VP/Executive"],
                key="p_seniority")
            target_school = st.text_input("From School (Optional)", "", key="p_school",
                                         help="Find alumni at this company")
        
        # Build query
        search_query = f'site:linkedin.com/in/ "{target_company}"'
        if target_role:
            search_query += f' {target_role}'
        if seniority != "Any":
            seniority_terms = {
                "Entry/Junior": '(junior OR entry OR associate OR "new grad")',
                "Mid-Level": '(mid OR "3 years" OR "4 years" OR "5 years")',
                "Senior": '(senior OR sr OR lead)',
                "Manager": '(manager OR "team lead")',
                "Director": '(director)',
                "VP/Executive": '(VP OR "vice president" OR chief OR executive OR head)'
            }
            search_query += f' {seniority_terms.get(seniority, "")}'
        if target_school:
            search_query += f' "{target_school}"'
    
    elif search_type == "🎓 Alumni":
        col1, col2 = st.columns(2)
        with col1:
            my_school = st.text_input("Your School *", "Arizona State University", key="a_school")
            target_companies = st.text_input("Working at Companies", "CrowdStrike, Palo Alto, Microsoft", 
                                            key="a_companies", help="Comma-separated list")
        with col2:
            target_field = st.selectbox("Field/Industry",
                ["Any", "Cybersecurity", "Software Engineering", "Data Science", "Product", "Finance", "Consulting"],
                key="a_field")
            graduation_year = st.text_input("Graduation Year (Optional)", "", key="a_year",
                                           help="e.g., 2024 or 2020-2024")
        
        # Build query
        search_query = f'site:linkedin.com/in/ "{my_school}"'
        if target_companies:
            companies = [c.strip() for c in target_companies.split(",") if c.strip()]
            if companies:
                search_query += ' (' + ' OR '.join([f'"{c}"' for c in companies]) + ')'
        if target_field != "Any":
            search_query += f' {target_field}'
        if graduation_year:
            search_query += f' {graduation_year}'
    
    elif search_type == "👔 Recruiters":
        col1, col2 = st.columns(2)
        with col1:
            recruiter_company = st.text_input("Company *", "CrowdStrike", key="r_company")
            recruiter_type = st.selectbox("Recruiter Type",
                ["Any Recruiter", "Technical Recruiter", "University Recruiter", "HR/People Ops", "Talent Acquisition Lead"],
                key="r_type")
        with col2:
            recruiter_focus = st.text_input("Focus Area (Optional)", "Security", key="r_focus",
                                           help="e.g., Security, Engineering, Sales")
            include_agency = st.checkbox("Include Agency Recruiters", value=False, key="r_agency")
        
        # Build query
        recruiter_terms = {
            "Any Recruiter": '(recruiter OR recruiting OR "talent acquisition" OR HR)',
            "Technical Recruiter": '("technical recruiter" OR "engineering recruiter" OR "tech recruiting")',
            "University Recruiter": '("university recruiter" OR "campus recruiter" OR "early career" OR "new grad recruiting")',
            "HR/People Ops": '(HR OR "human resources" OR "people operations" OR "people ops")',
            "Talent Acquisition Lead": '("talent acquisition" OR "recruiting manager" OR "head of recruiting")'
        }
        
        search_query = f'site:linkedin.com/in/ "{recruiter_company}" {recruiter_terms.get(recruiter_type, "recruiter")}'
        if recruiter_focus:
            search_query += f' {recruiter_focus}'
        if not include_agency:
            search_query += ' -agency -staffing -consulting'
    
    else:  # Custom Search
        st.info("Build your own LinkedIn X-Ray search")
        col1, col2 = st.columns(2)
        with col1:
            custom_keywords = st.text_input("Keywords *", "cybersecurity manager", key="c_keywords")
            custom_company = st.text_input("Company (Optional)", "", key="c_company")
        with col2:
            custom_location = st.text_input("Location (Optional)", "", key="c_location")
            custom_school = st.text_input("School (Optional)", "", key="c_school")
        
        # Build query
        search_query = f'site:linkedin.com/in/ {custom_keywords}'
        if custom_company:
            search_query += f' "{custom_company}"'
        if custom_location:
            search_query += f' "{custom_location}"'
        if custom_school:
            search_query += f' "{custom_school}"'
    
    # Additional filters (collapsed)
    with st.expander("More Options"):
        col1, col2 = st.columns(2)
        with col1:
            location_filter = st.text_input("Location", "", key="p_location", placeholder="e.g., San Francisco")
            num_results = st.slider("Results per page", 5, 10, 10, key="p_results")
        with col2:
            exclude_terms = st.text_input("Exclude", "", key="p_exclude", placeholder="e.g., intern, student")
            num_pages = st.slider("Pages to search", 1, 5, 3, key="p_pages", help="More pages = more results (uses quota)")
        
        open_to_work = st.checkbox("Likely Open to Work", key="p_open",
                                  help="Add terms that suggest openness to opportunities")
    
    # Apply additional filters
    if location_filter:
        search_query += f' "{location_filter}"'
    if exclude_terms:
        for term in exclude_terms.split(","):
            if term.strip():
                search_query += f' -{term.strip()}'
    if open_to_work:
        search_query += ' (hiring OR "open to" OR seeking OR looking)'
    
    # Search Button
    st.markdown("---")
    
    search_clicked = st.button("🔍 Find People", type="primary", use_container_width=True, key="people_search_btn")
    
    # Handle save action first (before search)
    if 'people_results' in st.session_state and st.session_state.people_results:
        if st.session_state.get('do_save_clicked'):
            save_name = st.session_state.get('save_name_input', '')
            if save_name:
                # Save with full results (no API needed to reload)
                save_search(save_name, st.session_state.get('last_search_type', ''), 
                           st.session_state.people_results)
                st.toast(f"✅ Saved: {save_name}")
                st.session_state.do_save_clicked = False
    
    if search_clicked:
        with st.spinner("Searching..."):
            all_results = []
            for page in range(num_pages):
                start_index = page * num_results + 1
                page_results = google_search(search_query, num_results=num_results, start=start_index)
                if page_results:
                    all_results.extend(page_results)
                else:
                    break
            
            results = deduplicate_results(all_results)
            
            if results:
                save_search_history(search_query, "People", len(results))
                
                data = []
                for item in results:
                    title = item.get('title', 'N/A')
                    parts = title.replace(" | LinkedIn", "").split(" - ")
                    name = parts[0].strip() if parts else "Unknown"
                    headline = " - ".join(parts[1:]).strip() if len(parts) > 1 else ""
                    data.append({
                        "Name": name,
                        "Title": headline,
                        "Profile": item.get('link', '')
                    })
                
                # Store in session state
                st.session_state.people_results = data
                st.session_state.last_query = search_query
                st.session_state.last_search_type = search_type
            else:
                st.session_state.people_results = None
                st.warning("No profiles found. Try broader search terms.")
    
    # Display results from session state
    if 'people_results' in st.session_state and st.session_state.people_results:
        data = st.session_state.people_results
        st.success(f"Found {len(data)} profiles")
        
        df = pd.DataFrame(data)
        
        st.dataframe(
            df,
            column_config={"Profile": st.column_config.LinkColumn("View")},
            use_container_width=True,
            hide_index=True
        )
        
        col1, col2, col3 = st.columns([2, 2, 1])
        with col1:
            st.download_button("📥 Download CSV", convert_df_to_csv(df), 
                              f"people_{datetime.now().strftime('%Y%m%d')}.csv", "text/csv",
                              use_container_width=True)
        with col2:
            save_name = st.text_input("Save as", placeholder="e.g., CrowdStrike Security", 
                                     label_visibility="collapsed", key="save_name_input")
        with col3:
            if st.button("💾 Save", use_container_width=True, key="do_save"):
                st.session_state.do_save_clicked = True
                st.rerun()

# --- TAB 3: COMPANY RESEARCH ---
with tab_company:
    st.subheader("Company Research")
    st.caption("Understand the vibe before you network or interview")
    
    col1, col2 = st.columns([2, 1])
    with col1:
        research_company = st.text_input("Company *", "CrowdStrike", key="research_company")
        research_focus = st.selectbox(
            "Focus",
            [
                "Overview & Culture",
                "Latest News",
                "Funding & Growth",
                "Layoffs / Risks",
                "Products & Roadmap",
                "Interview / Employee Reviews"
            ],
            key="research_focus"
        )
    with col2:
        research_freshness = st.selectbox("Freshness", ["24 Hours", "3 Days", "Past Week", "Month", "Anytime"], key="research_freshness")
        result_limit = st.slider("Articles", 3, 10, 6, key="research_results")
    
    custom_keywords = st.text_input("Additional keywords", "", key="research_keywords", placeholder="e.g., acquisition, Series C, roadmap")
    source_filter = st.selectbox(
        "Source filter",
        [
            "All Web",
            "News & PR",
            "Glassdoor & Blind",
            "Engineering Blogs"
        ],
        key="research_sources"
    )
    
    focus_map = {
        "Overview & Culture": "company culture values mission work environment",
        "Latest News": "news OR press release OR headline",
        "Funding & Growth": "funding round headcount growth expansion hiring",
        "Layoffs / Risks": "layoffs downsizing hiring freeze restructuring",
        "Products & Roadmap": "product roadmap launch feature update platform",
        "Interview / Employee Reviews": "Glassdoor review interview experience compensation"
    }
    source_map = {
        "All Web": "",
        "News & PR": "(site:news.google.com OR site:techcrunch.com OR site:prnewswire.com OR site:businesswire.com)",
        "Glassdoor & Blind": "(site:glassdoor.com OR site:teamblind.com)",
        "Engineering Blogs": "(site:medium.com OR site:dev.to OR site:engineering.fb.com OR site:dropbox.tech)"
    }
    date_map_company = {
        "24 Hours": "d1",
        "3 Days": "d3",
        "Past Week": "w1",
        "Month": "m1",
        "Anytime": None
    }
    
    st.markdown("---")
    search_company = st.button("🔍 Research Company", type="primary", use_container_width=True, disabled=not research_company)
    
    if search_company:
        base_query = f'"{research_company}" {focus_map.get(research_focus, "")}'
        if custom_keywords:
            base_query += " " + custom_keywords
        if source_map.get(source_filter):
            base_query = f"{source_map[source_filter]} {base_query}"
        
        with st.spinner("Gathering intel..."):
            results = google_search(base_query, num_results=result_limit, date_restrict=date_map_company.get(research_freshness))
            results = deduplicate_results(results)
            
            if results:
                st.success(f"Top {len(results)} insights for {research_company}")
                cards = []
                for item in results:
                    cards.append({
                        "Title": item.get("title", ""),
                        "Snippet": item.get("snippet", ""),
                        "Link": item.get("link", "")
                    })
                    title = item.get('title', 'Untitled')
                    snippet = item.get('snippet', '')
                    link = item.get('link', '#')
                    st.markdown(f"**[{title}]({link})**\n\n{snippet}\n")
                    st.markdown("---")
                df_research = pd.DataFrame(cards)
                st.download_button(
                    "� Download summary",
                    convert_df_to_csv(df_research),
                    f"{research_company.lower().replace(' ', '_')}_intel.csv",
                    "text/csv",
                    use_container_width=True
                )
            else:
                st.warning("No recent intel found. Try a broader focus or 'Anytime'.")

# --- TAB 4: PREMIUM FEATURES ---
with tab_premium:
    st.subheader("🌟 Premium Search Tools")
    st.caption("Advanced search capabilities for power users")
    
    premium_tool = st.radio(
        "Select Tool",
        ["📚 Search Templates", "🔧 Boolean Builder", "🏢 Batch Company Search", "📊 Competitor Analysis"],
        horizontal=True,
        key="premium_tool"
    )
    
    st.markdown("---")
    
    # TOOL 1: Search Templates Library
    if premium_tool == "📚 Search Templates":
        st.markdown("### Pre-Built Search Templates")
        st.info("💡 Use these proven search queries as starting points. Click to copy and customize.")
        
        template_category = st.selectbox(
            "Template Category",
            list(SEARCH_TEMPLATES.keys()),
            key="template_cat"
        )
        
        templates = SEARCH_TEMPLATES[template_category]
        
        for template_name, template_data in templates.items():
            with st.expander(f"{template_name}", expanded=False):
                st.caption(template_data['description'])
                st.code(template_data['query'], language=None)
                
                col1, col2, col3 = st.columns([2, 2, 1])
                with col1:
                    custom_value = st.text_input(
                        "Customize (replace [COMPANY] or [YOUR_SCHOOL])",
                        key=f"custom_{template_name}",
                        placeholder="e.g., CrowdStrike or Arizona State University"
                    )
                with col2:
                    num_results_template = st.slider(
                        "Results",
                        5, 20, 10,
                        key=f"results_{template_name}"
                    )
                with col3:
                    if st.button("🔍 Search", key=f"search_{template_name}", use_container_width=True):
                        query = template_data['query']
                        if custom_value:
                            query = query.replace('[COMPANY]', custom_value).replace('[YOUR_SCHOOL]', custom_value)
                        
                        with st.spinner("Searching..."):
                            results = google_search(query, num_results=num_results_template)
                            results = deduplicate_results(results)
                            
                            if results:
                                st.success(f"Found {len(results)} results")
                                
                                # Display results based on template type
                                if "linkedin.com/in" in query:
                                    # People results
                                    data = []
                                    for item in results:
                                        title = item.get('title', 'N/A')
                                        parts = title.replace(" | LinkedIn", "").split(" - ")
                                        name = parts[0].strip() if parts else "Unknown"
                                        headline = " - ".join(parts[1:]).strip() if len(parts) > 1 else ""
                                        data.append({
                                            "Name": name,
                                            "Title": headline,
                                            "Profile": item.get('link', '')
                                        })
                                    df = pd.DataFrame(data)
                                    st.dataframe(
                                        df,
                                        column_config={"Profile": st.column_config.LinkColumn("View")},
                                        use_container_width=True,
                                        hide_index=True
                                    )
                                else:
                                    # Job or general results
                                    data = []
                                    for item in results:
                                        data.append({
                                            "Title": item.get('title', 'N/A'),
                                            "Snippet": item.get('snippet', ''),
                                            "Link": item.get('link', '')
                                        })
                                    df = pd.DataFrame(data)
                                    st.dataframe(
                                        df,
                                        column_config={"Link": st.column_config.LinkColumn("View")},
                                        use_container_width=True,
                                        hide_index=True
                                    )
                                
                                st.download_button(
                                    "📥 Download CSV",
                                    convert_df_to_csv(df),
                                    f"{template_name.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv",
                                    "text/csv",
                                    key=f"download_{template_name}"
                                )
                            else:
                                st.warning("No results found. Try customizing the query.")
    
    # TOOL 2: Boolean Search Builder
    elif premium_tool == "🔧 Boolean Builder":
        st.markdown("### Visual Boolean Search Builder")
        st.info("💡 Build complex search queries with a GUI. Perfect for precise filtering.")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Sites to Search**")
            site_options = st.multiselect(
                "Select platforms",
                [
                    "site:boards.greenhouse.io",
                    "site:jobs.lever.co",
                    "site:myworkdayjobs.com",
                    "site:linkedin.com/jobs",
                    "site:linkedin.com/in/",
                    "site:indeed.com",
                    "site:glassdoor.com"
                ],
                default=["site:boards.greenhouse.io", "site:jobs.lever.co"],
                key="bool_sites"
            )
            
            st.markdown("**Must Include (AND)**")
            must_include = st.text_input(
                "All of these terms (comma-separated)",
                placeholder="e.g., engineer, Python, AWS",
                key="bool_must",
                help="Every result must contain ALL these terms"
            )
            
            st.markdown("**Should Include (OR)**")
            should_include = st.text_input(
                "Any of these terms (comma-separated)",
                placeholder="e.g., junior, entry level, associate",
                key="bool_should",
                help="Results can contain ANY of these terms"
            )
        
        with col2:
            st.markdown("**Exact Phrases**")
            exact_phrases = st.text_input(
                "Exact matches (comma-separated)",
                placeholder="e.g., Security Analyst, New York",
                key="bool_exact",
                help="Results must contain these exact phrases"
            )
            
            st.markdown("**Must Exclude (NOT)**")
            must_exclude = st.text_input(
                "None of these terms (comma-separated)",
                placeholder="e.g., senior, manager, intern",
                key="bool_exclude",
                help="Results must NOT contain any of these terms"
            )
            
            st.markdown("**Additional Filters**")
            bool_date = st.selectbox(
                "Posted",
                ["Anytime", "24 Hours", "3 Days", "Past Week", "Month"],
                key="bool_date"
            )
            bool_results = st.slider("Results per page", 5, 20, 10, key="bool_results_slider")
        
        # Build and display query
        st.markdown("---")
        st.markdown("**🔍 Generated Query Preview**")
        
        built_query = build_boolean_query(
            must_include,
            should_include,
            must_exclude,
            exact_phrases,
            site_options
        )
        
        if built_query:
            st.code(built_query, language=None)
            
            col1, col2, col3 = st.columns([2, 2, 1])
            with col1:
                if st.button("🔍 Execute Search", type="primary", use_container_width=True, key="bool_search"):
                    date_map_bool = {
                        "24 Hours": "d1",
                        "3 Days": "d3",
                        "Past Week": "w1",
                        "Month": "m1",
                        "Anytime": None
                    }
                    
                    with st.spinner("Searching..."):
                        results = google_search(
                            built_query,
                            num_results=bool_results,
                            date_restrict=date_map_bool.get(bool_date)
                        )
                        results = deduplicate_results(results)
                        
                        if results:
                            save_search_history(built_query, "Boolean Builder", len(results))
                            st.success(f"Found {len(results)} results")
                            
                            data = []
                            for item in results:
                                data.append({
                                    "Title": item.get('title', 'N/A'),
                                    "Snippet": item.get('snippet', ''),
                                    "Link": item.get('link', '')
                                })
                            
                            df = pd.DataFrame(data)
                            st.dataframe(
                                df,
                                column_config={"Link": st.column_config.LinkColumn("View")},
                                use_container_width=True,
                                hide_index=True
                            )
                            
                            st.download_button(
                                "📥 Download Results",
                                convert_df_to_csv(df),
                                f"boolean_search_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                                "text/csv"
                            )
                        else:
                            st.warning("No results found. Try adjusting your filters.")
            
            with col2:
                if st.button("📋 Copy Query", use_container_width=True, key="bool_copy"):
                    st.toast("✅ Query copied to clipboard!", icon="📋")
                    st.write(f"```{built_query}```")
        else:
            st.warning("Add some search terms to build a query")
    
    # TOOL 3: Batch Company Search
    elif premium_tool == "🏢 Batch Company Search":
        st.markdown("### Multi-Company Job Search")
        st.info("💡 Search for the same role across multiple companies simultaneously.")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            companies_input = st.text_area(
                "Companies (one per line or comma-separated)",
                placeholder="CrowdStrike\nPalo Alto Networks\nMicrosoft\nGoogle\nAmazon",
                height=150,
                key="batch_companies"
            )
            
            job_titles_input = st.text_input(
                "Job Titles (comma-separated)",
                placeholder="Security Engineer, Security Analyst",
                key="batch_titles"
            )
        
        with col2:
            batch_ats = st.multiselect(
                "ATS Platforms",
                [
                    "site:boards.greenhouse.io",
                    "site:jobs.lever.co",
                    "site:myworkdayjobs.com",
                    "site:linkedin.com/jobs"
                ],
                default=["site:boards.greenhouse.io", "site:jobs.lever.co"],
                key="batch_ats"
            )
            
            batch_date = st.selectbox(
                "Posted",
                ["Past Week", "24 Hours", "3 Days", "Month", "Anytime"],
                key="batch_date"
            )
            
            batch_num = st.slider("Results per company", 3, 10, 5, key="batch_num")
        
        st.markdown("---")
        
        if st.button("🔍 Search All Companies", type="primary", use_container_width=True, key="batch_search"):
            # Parse companies
            companies = []
            if '\n' in companies_input:
                companies = [c.strip() for c in companies_input.split('\n') if c.strip()]
            else:
                companies = [c.strip() for c in companies_input.split(',') if c.strip()]
            
            # Parse job titles
            job_titles = [t.strip() for t in job_titles_input.split(',') if t.strip()]
            
            if not companies:
                st.error("Please enter at least one company")
            elif not job_titles:
                st.error("Please enter at least one job title")
            elif not batch_ats:
                st.error("Please select at least one ATS platform")
            else:
                date_map_batch = {
                    "24 Hours": "d1",
                    "3 Days": "d3",
                    "Past Week": "w1",
                    "Month": "m1",
                    "Anytime": None
                }
                
                with st.spinner(f"Searching {len(companies)} companies..."):
                    all_results, company_stats = batch_company_search(
                        companies,
                        job_titles,
                        batch_ats,
                        num_results=batch_num,
                        date_restrict=date_map_batch.get(batch_date)
                    )
                    
                    all_results = deduplicate_results(all_results)
                    
                    if all_results:
                        st.success(f"Found {len(all_results)} total jobs across {len(companies)} companies")
                        
                        # Show stats
                        st.markdown("### 📊 Results by Company")
                        stats_df = pd.DataFrame([
                            {"Company": comp, "Jobs Found": count}
                            for comp, count in sorted(company_stats.items(), key=lambda x: x[1], reverse=True)
                        ])
                        st.dataframe(stats_df, use_container_width=True, hide_index=True)
                        
                        st.markdown("---")
                        st.markdown("### 📋 All Results")
                        
                        # Format results
                        data = []
                        for item in all_results:
                            link = item.get('link', '#')
                            company = item.get('search_company', '')
                            
                            # Try to extract company from URL if not set
                            if not company:
                                if "greenhouse.io" in link:
                                    company = link.split("/")[3] if len(link.split("/")) > 3 else ""
                                elif "lever.co" in link:
                                    company = link.split("/")[3] if len(link.split("/")) > 3 else ""
                            
                            source = "Other"
                            if "greenhouse.io" in link:
                                source = "Greenhouse"
                            elif "lever.co" in link:
                                source = "Lever"
                            elif "linkedin.com" in link:
                                source = "LinkedIn"
                            elif "myworkdayjobs.com" in link:
                                source = "Workday"
                            
                            data.append({
                                "Company": company.replace("-", " ").title(),
                                "Title": item.get('title', 'N/A'),
                                "Source": source,
                                "Link": link
                            })
                        
                        df = pd.DataFrame(data)
                        st.dataframe(
                            df,
                            column_config={"Link": st.column_config.LinkColumn("Apply")},
                            use_container_width=True,
                            hide_index=True
                        )
                        
                        st.download_button(
                            "📥 Download All Results",
                            convert_df_to_csv(df),
                            f"batch_search_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                            "text/csv"
                        )
                    else:
                        st.warning("No jobs found. Try different companies or date range.")
    
    # TOOL 4: Competitor Analysis
    elif premium_tool == "📊 Competitor Analysis":
        st.markdown("### Hiring Trends Comparison")
        st.info("💡 Compare hiring activity across competing companies to spot trends.")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            competitor_companies = st.text_area(
                "Companies to Compare (one per line)",
                placeholder="CrowdStrike\nPalo Alto Networks\nFortinet\nZscaler\nOkta",
                height=120,
                key="comp_companies"
            )
            
            competitor_roles = st.text_input(
                "Role Category",
                value="Security Engineer",
                key="comp_roles"
            )
        
        with col2:
            comp_platforms = st.multiselect(
                "Platforms",
                [
                    "site:boards.greenhouse.io",
                    "site:jobs.lever.co",
                    "site:myworkdayjobs.com",
                    "site:linkedin.com/jobs"
                ],
                default=["site:boards.greenhouse.io", "site:jobs.lever.co", "site:myworkdayjobs.com"],
                key="comp_platforms"
            )
            
            comp_timeframes = st.multiselect(
                "Time Periods",
                ["Past Week", "Past Month", "Past 3 Months"],
                default=["Past Week", "Past Month"],
                key="comp_timeframes"
            )
        
        st.markdown("---")
        
        if st.button("📊 Analyze Competitors", type="primary", use_container_width=True, key="comp_analyze"):
            # Parse companies
            companies = [c.strip() for c in competitor_companies.split('\n') if c.strip()]
            
            if not companies or len(companies) < 2:
                st.error("Please enter at least 2 companies to compare")
            elif not competitor_roles:
                st.error("Please enter a role category")
            elif not comp_platforms:
                st.error("Please select at least one platform")
            else:
                date_map_comp = {
                    "Past Week": "w1",
                    "Past Month": "m1",
                    "Past 3 Months": "m3"
                }
                
                analysis_data = []
                
                with st.spinner(f"Analyzing {len(companies)} competitors across {len(comp_timeframes)} time periods..."):
                    for timeframe in comp_timeframes:
                        for company in companies:
                            query = f'({" OR ".join(comp_platforms)}) "{company}" "{competitor_roles}"'
                            results = google_search(
                                query,
                                num_results=10,
                                date_restrict=date_map_comp.get(timeframe)
                            )
                            
                            analysis_data.append({
                                "Company": company,
                                "Time Period": timeframe,
                                "Job Postings": len(results)
                            })
                
                if analysis_data:
                    df_analysis = pd.DataFrame(analysis_data)
                    
                    # Pivot for better visualization
                    pivot_df = df_analysis.pivot(index='Company', columns='Time Period', values='Job Postings')
                    
                    st.markdown("### 📈 Hiring Activity Comparison")
                    st.dataframe(
                        pivot_df.style.background_gradient(cmap='RdYlGn', axis=None),
                        use_container_width=True
                    )
                    
                    # Summary insights
                    st.markdown("### 💡 Key Insights")
                    
                    col1, col2, col3 = st.columns(3)
                    
                    with col1:
                        most_active = df_analysis.groupby('Company')['Job Postings'].sum().idxmax()
                        most_active_count = df_analysis.groupby('Company')['Job Postings'].sum().max()
                        st.metric(
                            "Most Active Hiring",
                            most_active,
                            f"{int(most_active_count)} postings"
                        )
                    
                    with col2:
                        total_postings = df_analysis['Job Postings'].sum()
                        st.metric(
                            "Total Opportunities",
                            int(total_postings),
                            f"Across {len(companies)} companies"
                        )
                    
                    with col3:
                        avg_postings = df_analysis['Job Postings'].mean()
                        st.metric(
                            "Average per Company",
                            f"{avg_postings:.1f}",
                            "per time period"
                        )
                    
                    # Download option
                    st.markdown("---")
                    st.download_button(
                        "📥 Download Analysis",
                        convert_df_to_csv(df_analysis),
                        f"competitor_analysis_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                        "text/csv"
                    )
                    
                    # Show detailed breakdown
                    with st.expander("📋 Detailed Breakdown"):
                        st.dataframe(
                            df_analysis.sort_values(['Time Period', 'Job Postings'], ascending=[True, False]),
                            use_container_width=True,
                            hide_index=True
                        )