import pandas as pd

# 1. Load your backup file
df = pd.read_csv('jobs_rows (1).csv')

# 2. Define the target database columns
target_cols = [
    'id', 'userId', 'company', 'jobTitle', 'location', 'employmentType',
    'salaryMin', 'salaryMax', 'salaryCurrency', 'jobUrl', 'jobDescription',
    'status', 'priority', 'rating', 'appliedDate', 'notes', 'source',
    'createdAt', 'updatedAt', 'salaryPeriod', 'sourceUrl'
]

# 3. Create the new dataframe
new_df = pd.DataFrame(columns=target_cols)

# 4. Map the data with your specific correction (Source Notes -> Target JobDescription)
new_df['id'] = df['id']
new_df['userId'] = df['user_id']
new_df['company'] = df['company']
new_df['jobTitle'] = df['title']
new_df['location'] = df['location']
new_df['jobUrl'] = df['job_url']
new_df['jobDescription'] = df['notes']  # <--- YOUR CORRECTION APPLIED HERE
new_df['status'] = df['status']
new_df['priority'] = df['priority']
new_df['notes'] = "" # Leaving this blank as the data moved to Description

# 5. Add default values and format dates
new_df['salaryCurrency'] = 'USD'
new_df['salaryPeriod'] = 'year'
new_df['source'] = 'CSV Import'

# Format Dates for the database
new_df['appliedDate'] = df['applied_date'].apply(lambda x: f"{x} 00:00:00" if pd.notna(x) else "")
new_df['createdAt'] = df['created_at'].str.split('+').str[0].str[:23]
new_df['updatedAt'] = df['updated_at'].str.split('+').str[0].str[:23]

# 6. Save the final file
new_df.to_csv('final_jobs_for_upload.csv', index=False)
print("Migration complete: 'final_jobs_for_upload.csv' is ready.")