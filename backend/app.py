import os
import re
import pandas as pd

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS


app = Flask(__name__)
CORS(app)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# app.py is inside backend/
# index.html, script.js and style.css are one level above
FRONTEND_DIR = os.path.abspath(
    os.path.join(BASE_DIR, "..")
)

EXCEL_FILE = os.path.join(
    BASE_DIR,
    "SkillSync_Database_with_Company_Official_Websites.xlsx"
)


# ============================================================
# DATAFRAMES
# ============================================================

companies_df = pd.DataFrame()
websites_df = pd.DataFrame()
roles_df = pd.DataFrame()
skills_df = pd.DataFrame()
company_role_skills_df = pd.DataFrame()


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def clean_value(value):
    if pd.isna(value):
        return ""

    return str(value).strip()


def normalize_text(value):
    value = clean_value(value).lower()

    value = re.sub(
        r"[^a-z0-9+#.& ]",
        " ",
        value
    )

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value.strip()


def normalize_company(value):
    return normalize_text(value)


def normalize_role(value):
    return normalize_text(value)


def normalize_skill(value):
    return normalize_text(value)


def safe_float(value, default=1.0):
    try:
        if pd.isna(value):
            return default

        return float(value)

    except Exception:
        return default


def unique_list(values):
    result = []
    seen = set()

    for value in values:
        value = clean_value(value)

        if not value:
            continue

        key = normalize_text(value)

        if key not in seen:
            seen.add(key)
            result.append(value)

    return result


# ============================================================
# LOAD EXCEL DATABASE
# ============================================================

def load_database():
    global companies_df
    global websites_df
    global roles_df
    global skills_df
    global company_role_skills_df

    print()
    print("=" * 60)
    print("SkillSync AI - Loading Excel Database")
    print("=" * 60)

    print("Excel file:")
    print(EXCEL_FILE)

    if not os.path.exists(EXCEL_FILE):
        print()
        print("ERROR: Excel file was not found.")
        print("Expected location:")
        print(EXCEL_FILE)
        print()
        return False

    try:
        excel = pd.ExcelFile(EXCEL_FILE)

        print()
        print("Available sheets:")

        for sheet in excel.sheet_names:
            print(" -", sheet)

        if "500_Companies" in excel.sheet_names:
            companies_df = pd.read_excel(
                EXCEL_FILE,
                sheet_name="500_Companies"
            )

        if "Company_Websites" in excel.sheet_names:
            websites_df = pd.read_excel(
                EXCEL_FILE,
                sheet_name="Company_Websites"
            )

        if "25_Roles" in excel.sheet_names:
            roles_df = pd.read_excel(
                EXCEL_FILE,
                sheet_name="25_Roles"
            )

        if "Skill_Master" in excel.sheet_names:
            skills_df = pd.read_excel(
                EXCEL_FILE,
                sheet_name="Skill_Master"
            )

        if "Company_Role_Skills" in excel.sheet_names:
            company_role_skills_df = pd.read_excel(
                EXCEL_FILE,
                sheet_name="Company_Role_Skills"
            )

        print()
        print("Database loaded successfully.")
        print("Companies:", len(companies_df))
        print("Websites:", len(websites_df))
        print("Roles:", len(roles_df))
        print("Skills:", len(skills_df))
        print(
            "Company-role-skill records:",
            len(company_role_skills_df)
        )
        print("=" * 60)
        print()

        return True

    except Exception as error:
        print()
        print("ERROR loading Excel database:")
        print(error)
        print()

        return False


# ============================================================
# COMPANY WEBSITE
# ============================================================

def get_company_website(company):
    target = normalize_company(company)

    if not websites_df.empty:
        if "company" in websites_df.columns:

            for _, row in websites_df.iterrows():

                row_company = normalize_company(
                    row.get("company", "")
                )

                if row_company == target:

                    website = clean_value(
                        row.get(
                            "company_official_website",
                            ""
                        )
                    )

                    if website:
                        return website

    if not companies_df.empty:
        if "company" in companies_df.columns:

            for _, row in companies_df.iterrows():

                row_company = normalize_company(
                    row.get("company", "")
                )

                if row_company == target:

                    website = clean_value(
                        row.get(
                            "company_official_website",
                            ""
                        )
                    )

                    if website:
                        return website

    return ""


# ============================================================
# COMPANY LIST
# ============================================================

def get_company_list():
    result = []

    if (
        not companies_df.empty
        and "company" in companies_df.columns
    ):
        result.extend(
            companies_df["company"]
            .dropna()
            .astype(str)
            .tolist()
        )

    if (
        not websites_df.empty
        and "company" in websites_df.columns
    ):
        result.extend(
            websites_df["company"]
            .dropna()
            .astype(str)
            .tolist()
        )

    return unique_list(result)


# ============================================================
# ROLE LIST
# ============================================================

def get_role_list():
    if roles_df.empty:
        return []

    if "role" not in roles_df.columns:
        return []

    roles = (
        roles_df["role"]
        .dropna()
        .astype(str)
        .tolist()
    )

    return unique_list(roles)


# ============================================================
# SKILLS
# ============================================================

def get_skills_by_type():
    technical = []
    behavioral = []

    if skills_df.empty:
        return {
            "technical": [],
            "behavioral": []
        }

    if "canonical_skill" not in skills_df.columns:
        return {
            "technical": [],
            "behavioral": []
        }

    for _, row in skills_df.iterrows():

        skill = clean_value(
            row.get(
                "canonical_skill",
                ""
            )
        )

        skill_type = normalize_text(
            row.get(
                "skill_type",
                ""
            )
        )

        if not skill:
            continue

        if "technical" in skill_type:
            technical.append(skill)

        elif "behavior" in skill_type:
            behavioral.append(skill)

    return {
        "technical": unique_list(technical),
        "behavioral": unique_list(behavioral)
    }


# ============================================================
# COMPANY + ROLE DATA
# ============================================================

def get_company_role_data(company, role):

    if company_role_skills_df.empty:
        return pd.DataFrame()

    required_columns = [
        "company",
        "role",
        "skill"
    ]

    for column in required_columns:
        if column not in company_role_skills_df.columns:
            return pd.DataFrame()

    target_company = normalize_company(company)
    target_role = normalize_role(role)

    company_mask = (
        company_role_skills_df["company"]
        .apply(normalize_company)
        == target_company
    )

    role_mask = (
        company_role_skills_df["role"]
        .apply(normalize_role)
        == target_role
    )

    return company_role_skills_df.loc[
        company_mask & role_mask
    ].copy()


# ============================================================
# ANALYZE COMPANY
# ============================================================

def analyze_company(
    company,
    role,
    technical_skills,
    behavioral_skills
):

    data = get_company_role_data(
        company,
        role
    )

    student_technical = {
        normalize_skill(skill)
        for skill in technical_skills
        if clean_value(skill)
    }

    student_behavioral = {
        normalize_skill(skill)
        for skill in behavioral_skills
        if clean_value(skill)
    }

    required_technical = []
    required_behavioral = []

    if not data.empty:

        for _, row in data.iterrows():

            skill = clean_value(
                row.get(
                    "skill",
                    ""
                )
            )

            if not skill:
                continue

            skill_type = normalize_text(
                row.get(
                    "skill_type",
                    ""
                )
            )

            importance = safe_float(
                row.get(
                    "importance_1_to_5",
                    1
                ),
                1
            )

            requirement = (
                skill,
                importance
            )

            if "technical" in skill_type:

                required_technical.append(
                    requirement
                )

            elif "behavior" in skill_type:

                required_behavioral.append(
                    requirement
                )

    # --------------------------------------------------------
    # TECHNICAL MATCH
    # --------------------------------------------------------

    matched_technical = []
    missing_technical = []

    technical_total_weight = 0.0
    technical_matched_weight = 0.0

    for skill, weight in required_technical:

        normalized = normalize_skill(skill)

        technical_total_weight += weight

        if normalized in student_technical:

            matched_technical.append(skill)

            technical_matched_weight += weight

        else:

            missing_technical.append(skill)

    if technical_total_weight > 0:

        technical_match = (
            technical_matched_weight
            / technical_total_weight
        ) * 100

    else:

        technical_match = 0.0

    # --------------------------------------------------------
    # BEHAVIORAL MATCH
    # --------------------------------------------------------

    matched_behavioral = []
    missing_behavioral = []

    behavioral_total_weight = 0.0
    behavioral_matched_weight = 0.0

    for skill, weight in required_behavioral:

        normalized = normalize_skill(skill)

        behavioral_total_weight += weight

        if normalized in student_behavioral:

            matched_behavioral.append(skill)

            behavioral_matched_weight += weight

        else:

            missing_behavioral.append(skill)

    if behavioral_total_weight > 0:

        behavioral_match = (
            behavioral_matched_weight
            / behavioral_total_weight
        ) * 100

    else:

        behavioral_match = 0.0

    # --------------------------------------------------------
    # OVERALL MATCH
    # --------------------------------------------------------

    total_weight = (
        technical_total_weight
        + behavioral_total_weight
    )

    matched_weight = (
        technical_matched_weight
        + behavioral_matched_weight
    )

    if total_weight > 0:

        overall_match = (
            matched_weight
            / total_weight
        ) * 100

    else:

        overall_match = 0.0

    # --------------------------------------------------------
    # ROADMAP
    # --------------------------------------------------------

    roadmap = []

    for skill in missing_technical:

        roadmap.append(
            f"Improve technical skill: {skill}"
        )

    for skill in missing_behavioral:

        roadmap.append(
            f"Develop behavioral skill: {skill}"
        )

    if not roadmap:

        roadmap.append(
            "Great job! You currently match all available requirements."
        )

    # --------------------------------------------------------
    # WEBSITE
    # --------------------------------------------------------

    website = get_company_website(company)

    # --------------------------------------------------------
    # RESULT
    # --------------------------------------------------------

    return {
        "company": company,
        "role": role,
        "official_website": website,

        "technical_match": round(
            technical_match,
            2
        ),

        "behavioral_match": round(
            behavioral_match,
            2
        ),

        "overall_match": round(
            overall_match,
            2
        ),

        "matched_technical": unique_list(
            matched_technical
        ),

        "missing_technical": unique_list(
            missing_technical
        ),

        "matched_behavioral": unique_list(
            matched_behavioral
        ),

        "missing_behavioral": unique_list(
            missing_behavioral
        ),

        "matched_count": len(
            matched_technical
            + matched_behavioral
        ),

        "missing_count": len(
            missing_technical
            + missing_behavioral
        ),

        "roadmap": roadmap,

        "data_status": "prototype"
    }


# ============================================================
# FRONTEND
# ============================================================

@app.route("/", methods=["GET"])
def home():

    index_file = os.path.join(
        FRONTEND_DIR,
        "index.html"
    )

    if not os.path.exists(index_file):

        return jsonify({
            "error": "index.html was not found.",
            "frontend_directory": FRONTEND_DIR
        }), 404

    return send_from_directory(
        FRONTEND_DIR,
        "index.html"
    )


@app.route("/<path:filename>", methods=["GET"])
def frontend_files(filename):

    requested_file = os.path.join(
        FRONTEND_DIR,
        filename
    )

    if os.path.isfile(requested_file):

        return send_from_directory(
            FRONTEND_DIR,
            filename
        )

    return jsonify({
        "error": "File not found."
    }), 404


# ============================================================
# CONFIG API
# ============================================================

@app.route("/config", methods=["GET"])
def config():

    companies = get_company_list()
    roles = get_role_list()

    # Show only top 15 companies
    top_companies = companies[:15]

    return jsonify({
        "companies": top_companies,
        "roles": roles
    })


# ============================================================
# SKILLS API
# ============================================================

@app.route("/skills", methods=["GET"])
def skills():

    return jsonify(
        get_skills_by_type()
    )


# ============================================================
# ANALYZE API
# ============================================================

@app.route("/analyze", methods=["POST"])
def analyze():

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({
                "error": "No JSON data received."
            }), 400

        student = data.get(
            "student",
            {}
        )

        companies = data.get(
            "companies",
            []
        )

        if not isinstance(
            companies,
            list
        ):

            return jsonify({
                "error": "companies must be a list."
            }), 400

        companies = unique_list(
            companies
        )

        if len(companies) == 0:

            return jsonify({
                "error": "Please select at least one company."
            }), 400

        role = clean_value(
            data.get(
                "role",
                ""
            )
        )

        if not role:

            return jsonify({
                "error": "Please select a role."
            }), 400

        technical_skills = data.get(
            "technicalSkills",
            []
        )

        behavioral_skills = data.get(
            "behavioralSkills",
            []
        )

        if not isinstance(
            technical_skills,
            list
        ):

            technical_skills = []

        if not isinstance(
            behavioral_skills,
            list
        ):

            behavioral_skills = []

        results = []

        for company in companies:

            result = analyze_company(
                company,
                role,
                technical_skills,
                behavioral_skills
            )

            results.append(result)

        results.sort(
            key=lambda item: item["overall_match"],
            reverse=True
        )

        return jsonify({

            "success": True,

            "student": student,

            "role": role,

            "selected_companies": companies,

            "selected_technical_skills":
                technical_skills,

            "selected_behavioral_skills":
                behavioral_skills,

            "results": results
        })

    except Exception as error:

        print()
        print("ERROR in /analyze:")
        print(error)
        print()

        return jsonify({
            "error": str(error)
        }), 500


# ============================================================
# LOAD DATABASE
# ============================================================

load_database()


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("SkillSync AI")
    print("=" * 60)
    print("Frontend:", FRONTEND_DIR)
    print("Excel:", EXCEL_FILE)
    print()
    print("Server:")
    print("http://127.0.0.1:5000")
    print()
    print("API:")
    print("http://127.0.0.1:5000/config")
    print("http://127.0.0.1:5000/skills")
    print("http://127.0.0.1:5000/analyze")
    print("=" * 60)
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
