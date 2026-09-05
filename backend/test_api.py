import requests

url = "http://127.0.0.1:5000/predict"

data = {
    "company": "Google",
    "sector": "Technology",
    "role": "Software Engineer",
    "skill": "Python",
    "skill_type": "Technical",
    "jd_mentions": 8,
    "interview_mentions": 5,
    "importance_mean": 4.5,
    "requirement_count": 10,
    "jd_coverage_proxy": 0.8,
    "interview_coverage_proxy": 0.5
}

response = requests.post(url, json=data)

print("Status:", response.status_code)
print("Response:", response.json())