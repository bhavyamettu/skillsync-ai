const API = "http://127.0.0.1:5000";

let companies = [];
let roles = [];

let selectedCompanies = [];

let technicalSkills = new Set();
let behavioralSkills = new Set();

let allTechnicalSkills = [];
let allBehavioralSkills = [];

let currentSkillFilter = "both";


document.addEventListener("DOMContentLoaded", () => {
    loadConfig();
    loadSkills();
});


/* =========================
   LOGIN
========================= */

function login() {

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email) {
        alert("Please enter your email address.");
        return;
    }

    if (!password) {
        alert("Please enter your password.");
        return;
    }

    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");

    document.getElementById("userBadge").textContent = email;

    const firstLetter = email.charAt(0).toUpperCase();

    document.getElementById("userAvatar").textContent =
        firstLetter;

    showSection("profileSection");
}


/* =========================
   LOAD CONFIG
========================= */

async function loadConfig() {

    try {

        const response = await fetch(
            `${API}/config`
        );

        const data = await response.json();

        companies = data.companies || [];
        roles = data.roles || [];

        renderCompanies();
        renderRoles();

    } catch (error) {

        console.error(error);

        alert(
            "Could not connect to SkillSync AI backend. Make sure app.py is running."
        );
    }
}


/* =========================
   LOAD SKILLS
========================= */

async function loadSkills() {

    try {

        const response = await fetch(
            `${API}/skills`
        );

        const data = await response.json();

        allTechnicalSkills =
            data.technical || [];

        allBehavioralSkills =
            data.behavioral || [];

        renderSkills();

    } catch (error) {

        console.error(error);

        alert(
            "Could not load skills from the backend."
        );
    }
}


/* =========================
   NAVIGATION
========================= */

function showSection(sectionId) {

    const sections = document.querySelectorAll(
        ".content-section"
    );

    sections.forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(sectionId)
        .classList.remove("hidden");


    const titles = {
        profileSection: "Student Profile",
        careerSection: "Dream Career",
        skillsSection: "My Skills",
        resultSection: "Career Analysis"
    };

    document.getElementById("pageTitle")
        .textContent = titles[sectionId];


    document.querySelectorAll(".nav-item")
        .forEach(item => {
            item.classList.remove("active");
        });


    const buttons =
        document.querySelectorAll(".nav-item");

    if (sectionId === "profileSection") {
        buttons[0].classList.add("active");
    }

    if (sectionId === "careerSection") {
        buttons[1].classList.add("active");
    }

    if (sectionId === "skillsSection") {
        buttons[2].classList.add("active");
    }

    if (sectionId === "resultSection") {
        buttons[3].classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================
   PROFILE
========================= */

function goToCareer() {

    const name =
        document.getElementById("studentName")
            .value.trim();

    const college =
        document.getElementById("college")
            .value.trim();

    const branch =
        document.getElementById("branch")
            .value;

    const cgpa =
        document.getElementById("cgpa")
            .value;


    if (!name) {
        alert("Please enter your name.");
        return;
    }

    if (!college) {
        alert("Please enter your college.");
        return;
    }

    if (!branch) {
        alert("Please select your branch.");
        return;
    }

    if (!cgpa) {
        alert("Please enter your CGPA.");
        return;
    }

    showSection("careerSection");
}


/* =========================
   COMPANIES
========================= */

function renderCompanies() {

    const grid =
        document.getElementById("companyGrid");

    grid.innerHTML = "";

    companies.slice(0, 15).forEach(
        (company, index) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "company-btn";

            button.dataset.company =
                company;


            const logo =
                document.createElement("div");

            logo.className =
                "company-logo";

            /*
             * We use company initials here.
             * This guarantees the logo cards work
             * even without external image URLs.
             */

            logo.textContent =
                getCompanyInitials(company);


            const name =
                document.createElement("div");

            name.className =
                "company-name";

            name.textContent =
                company;


            const check =
                document.createElement("div");

            check.className =
                "company-check";

            check.textContent = "✓";


            button.appendChild(logo);
            button.appendChild(name);
            button.appendChild(check);


            button.addEventListener(
                "click",
                () => toggleCompany(company, button)
            );


            grid.appendChild(button);
        }
    );
}


function getCompanyInitials(company) {

    const words =
        company
            .replace(/[^a-zA-Z0-9 ]/g, "")
            .trim()
            .split(/\s+/);

    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        words[0].charAt(0) +
        words[1].charAt(0)
    ).toUpperCase();
}


function toggleCompany(
    company,
    button
) {

    const index =
        selectedCompanies.findIndex(
            item =>
                item.toLowerCase() ===
                company.toLowerCase()
        );


    if (index === -1) {

        selectedCompanies.push(company);

        button.classList.add("selected");

    } else {

        selectedCompanies.splice(
            index,
            1
        );

        button.classList.remove("selected");
    }

    updateSelectedCompanies();
}


function updateSelectedCompanies() {

    const container =
        document.getElementById(
            "selectedCompanies"
        );

    const count =
        document.getElementById(
            "companyCount"
        );


    count.textContent =
        selectedCompanies.length;


    container.innerHTML = "";


    if (selectedCompanies.length === 0) {

        container.innerHTML =
            `<span class="empty-selection">
                No companies selected yet
            </span>`;

        return;
    }


    selectedCompanies.forEach(
        company => {

            const chip =
                document.createElement("div");

            chip.className =
                "selected-chip";


            chip.innerHTML = `
                <span>${escapeHtml(company)}</span>
                <button type="button"
                    onclick="removeCompany('${escapeJs(company)}')">
                    ×
                </button>
            `;

            container.appendChild(chip);
        }
    );
}


function removeCompany(company) {

    selectedCompanies =
        selectedCompanies.filter(
            item =>
                item.toLowerCase() !==
                company.toLowerCase()
        );


    document.querySelectorAll(
        ".company-btn"
    ).forEach(button => {

        if (
            button.dataset.company
                .toLowerCase() ===
            company.toLowerCase()
        ) {

            button.classList.remove(
                "selected"
            );
        }
    });


    updateSelectedCompanies();
}


/* =========================
   OTHER COMPANY
========================= */

function addOtherCompany() {

    const input =
        document.getElementById(
            "otherCompany"
        );

    const company =
        input.value.trim();


    if (!company) {

        alert(
            "Please enter a company name."
        );

        return;
    }


    const exists =
        selectedCompanies.some(
            item =>
                item.toLowerCase() ===
                company.toLowerCase()
        );


    if (exists) {

        alert(
            "This company is already selected."
        );

        return;
    }


    selectedCompanies.push(company);

    input.value = "";

    updateSelectedCompanies();
}


/* =========================
   ROLES
========================= */

function renderRoles() {

    const select =
        document.getElementById("role");

    select.innerHTML =
        `<option value="">
            Select your dream role
        </option>`;


    roles.forEach(role => {

        const option =
            document.createElement("option");

        option.value = role;

        option.textContent = role;

        select.appendChild(option);
    });
}


function getSelectedRole() {

    const role =
        document.getElementById(
            "role"
        ).value.trim();

    const otherRole =
        document.getElementById(
            "otherRole"
        ).value.trim();


    if (otherRole) {
        return otherRole;
    }

    return role;
}


function goToSkills() {

    if (
        selectedCompanies.length === 0
    ) {

        alert(
            "Please select at least one dream company."
        );

        return;
    }


    const role =
        getSelectedRole();


    if (!role) {

        alert(
            "Please select or enter your dream role."
        );

        return;
    }


    showSection("skillsSection");
}


/* =========================
   SKILLS
========================= */

function renderSkills() {

    renderTechnicalSkills();
    renderBehavioralSkills();

    updateSkillCount();
}


function renderTechnicalSkills() {

    const container =
        document.getElementById(
            "technicalSkills"
        );

    container.innerHTML = "";


    allTechnicalSkills.forEach(
        skill => {

            const button =
                createSkillButton(
                    skill,
                    "technical"
                );

            container.appendChild(button);
        }
    );
}


function renderBehavioralSkills() {

    const container =
        document.getElementById(
            "behavioralSkills"
        );

    container.innerHTML = "";


    allBehavioralSkills.forEach(
        skill => {

            const button =
                createSkillButton(
                    skill,
                    "behavioral"
                );

            container.appendChild(button);
        }
    );
}


function createSkillButton(
    skill,
    type
) {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className = "skill-btn";

    button.textContent = skill;


    const selectedSet =
        type === "technical"
            ? technicalSkills
            : behavioralSkills;


    if (
        selectedSet.has(
            skill.toLowerCase()
        )
    ) {

        button.classList.add(
            "selected"
        );
    }


    button.addEventListener(
        "click",
        () => {

            const key =
                skill.toLowerCase();


            if (selectedSet.has(key)) {

                selectedSet.delete(key);

                button.classList.remove(
                    "selected"
                );

            } else {

                selectedSet.add(key);

                button.classList.add(
                    "selected"
                );
            }


            updateSkillCount();
        }
    );


    return button;
}


/* =========================
   SKILL FILTER
========================= */

function filterSkills(
    filter,
    button
) {

    currentSkillFilter = filter;


    document.querySelectorAll(
        ".skill-filter"
    ).forEach(item => {

        item.classList.remove(
            "active"
        );
    });


    button.classList.add("active");


    const technicalSection =
        document
            .getElementById(
                "technicalSkills"
            )
            .closest(".skill-section");


    const behavioralSection =
        document
            .getElementById(
                "behavioralSkills"
            )
            .closest(".skill-section");


    if (filter === "technical") {

        technicalSection.style.display =
            "block";

        behavioralSection.style.display =
            "none";

    } else if (
        filter === "behavioral"
    ) {

        technicalSection.style.display =
            "none";

        behavioralSection.style.display =
            "block";

    } else {

        technicalSection.style.display =
            "block";

        behavioralSection.style.display =
            "block";
    }
}


/* =========================
   CUSTOM SKILL
========================= */

function addCustomSkill(type) {

    let inputId;
    let selectedSet;

    if (type === "technical") {

        inputId = "otherTechnical";
        selectedSet = technicalSkills;

    } else {

        inputId = "otherBehavioral";
        selectedSet = behavioralSkills;
    }


    const input =
        document.getElementById(
            inputId
        );

    const skill =
        input.value.trim();


    if (!skill) {

        alert(
            "Please enter a skill."
        );

        return;
    }


    selectedSet.add(
        skill.toLowerCase()
    );


    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "skill-btn selected";

    button.textContent = skill;


    button.onclick = () => {

        selectedSet.delete(
            skill.toLowerCase()
        );

        button.remove();

        updateSkillCount();
    };


    const container =
        type === "technical"
            ? document.getElementById(
                "technicalSkills"
            )
            : document.getElementById(
                "behavioralSkills"
            );


    container.appendChild(button);

    input.value = "";

    updateSkillCount();
}


/* =========================
   SKILL COUNT
========================= */

function updateSkillCount() {

    const total =
        technicalSkills.size +
        behavioralSkills.size;


    document.getElementById(
        "skillCount"
    ).textContent = total;
}


/* =========================
   ANALYZE
========================= */

async function analyzeCareer() {

    if (
        selectedCompanies.length === 0
    ) {

        alert(
            "Please select at least one company."
        );

        return;
    }


    const role =
        getSelectedRole();


    if (!role) {

        alert(
            "Please select your dream role."
        );

        return;
    }


    const student = {

        name:
            document.getElementById(
                "studentName"
            ).value.trim(),

        college:
            document.getElementById(
                "college"
            ).value.trim(),

        branch:
            document.getElementById(
                "branch"
            ).value,

        cgpa:
            document.getElementById(
                "cgpa"
            ).value
    };


    const technical =
        Array.from(
            technicalSkills
        );

    const behavioral =
        Array.from(
            behavioralSkills
        );


    const payload = {

        student: student,

        companies:
            selectedCompanies,

        role: role,

        technicalSkills:
            technical,

        behavioralSkills:
            behavioral
    };


    const analyzeButton =
        document.querySelector(
            ".analyze-btn"
        );


    analyzeButton.disabled = true;

    analyzeButton.textContent =
        "⏳ Analyzing...";


    try {

        const response =
            await fetch(
                `${API}/analyze`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Analysis failed."
            );
        }


        displayResults(data);

        showSection(
            "resultSection"
        );


    } catch (error) {

        console.error(error);

        alert(
            "Analysis failed: " +
            error.message
        );

    } finally {

        analyzeButton.disabled =
            false;

        analyzeButton.textContent =
            "✨ Analyze My Career";
    }
}


/* =========================
   DISPLAY RESULTS
========================= */

function displayResults(data) {

    const results =
        data.results || [];


    const container =
        document.getElementById(
            "resultsContainer"
        );


    container.innerHTML = "";


    if (results.length === 0) {

        container.innerHTML =
            `<div class="result-card">
                No analysis results found.
            </div>`;

        return;
    }


    const best =
        results[0];


    const bestMatch =
        document.getElementById(
            "bestMatch"
        );


    bestMatch.innerHTML = `
        <div class="best-card">

            <p class="eyebrow">
                BEST MATCH
            </p>

            <h3>
                ${escapeHtml(best.company)}
            </h3>

            <p>
                Your strongest match is
                <strong>
                    ${best.overall_match}%
                </strong>
                for the role of
                <strong>
                    ${escapeHtml(best.role)}
                </strong>.
            </p>

        </div>
    `;


    const grid =
        document.createElement("div");

    grid.className =
        "results-grid";


    results.forEach(result => {

        const card =
            document.createElement("div");

        card.className =
            "result-card";


        const matchedTechnical =
            result.matched_technical || [];

        const missingTechnical =
            result.missing_technical || [];

        const matchedBehavioral =
            result.matched_behavioral || [];

        const missingBehavioral =
            result.missing_behavioral || [];

        const roadmap =
            result.roadmap || [];


        card.innerHTML = `

            <div class="result-header">

                <div>
                    <h3>
                        ${escapeHtml(
                            result.company
                        )}
                    </h3>

                    <p style="
                        color:#727d9c;
                        font-size:12px;
                        margin-top:5px;
                    ">
                        ${escapeHtml(
                            result.role
                        )}
                    </p>
                </div>

                <div class="match-score">
                    ${result.overall_match}%
                </div>

            </div>


            <div class="score-row">

                <div class="score-box">

                    <strong>
                        ${result.technical_match}%
                    </strong>

                    <span>
                        Technical
                    </span>

                </div>


                <div class="score-box">

                    <strong>
                        ${result.behavioral_match}%
                    </strong>

                    <span>
                        Behavioral
                    </span>

                </div>


                <div class="score-box">

                    <strong>
                        ${result.overall_match}%
                    </strong>

                    <span>
                        Overall
                    </span>

                </div>

            </div>


            <div class="result-block">

                <h4>
                    ✓ Matched Technical Skills
                </h4>

                ${renderTags(
                    matchedTechnical
                )}

            </div>


            <div class="result-block">

                <h4>
                    ⚠ Missing Technical Skills
                </h4>

                ${renderTags(
                    missingTechnical,
                    true
                )}

            </div>


            <div class="result-block">

                <h4>
                    ✓ Matched Behavioral Skills
                </h4>

                ${renderTags(
                    matchedBehavioral
                )}

            </div>


            <div class="result-block">

                <h4>
                    ⚠ Missing Behavioral Skills
                </h4>

                ${renderTags(
                    missingBehavioral,
                    true
                )}

            </div>


            <div class="roadmap">

                <h4>
                    Suggested Improvement Roadmap
                </h4>

                <ul>

                    ${roadmap
                        .map(
                            item =>
                                `<li>
                                    ${escapeHtml(item)}
                                </li>`
                        )
                        .join("")
                    }

                </ul>

            </div>


            ${
                result.official_website
                    ? `
                        <a
                            class="website-link"
                            href="${escapeAttribute(
                                result.official_website
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            🌐 Visit Official Company Website →
                        </a>
                    `
                    : `
                        <p style="
                            color:#65708f;
                            font-size:12px;
                            margin-top:18px;
                        ">
                            Official website not available
                        </p>
                    `
            }

        `;


        grid.appendChild(card);
    });


    container.appendChild(grid);


    document.getElementById(
        "resultSubtitle"
    ).textContent =
        `Compared your skills across ${
            results.length
        } selected dream companies for the role of ${
            data.role
        }.`;
}


/* =========================
   RESULT TAGS
========================= */

function renderTags(
    skills,
    missing = false
) {

    if (!skills || skills.length === 0) {

        return `
            <span style="
                color:#59647f;
                font-size:12px;
            ">
                None
            </span>
        `;
    }


    return skills
        .map(skill => {

            return `
                <span class="skill-tag ${
                    missing
                        ? "missing-tag"
                        : ""
                }">
                    ${escapeHtml(skill)}
                </span>
            `;
        })
        .join("");
}


/* =========================
   SECURITY HELPERS
========================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeJs(value) {

    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


function escapeAttribute(value) {

    return String(value)
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}