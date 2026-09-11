import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, doc, deleteDoc, 
    onSnapshot, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration Keys
const firebaseConfig = {
    apiKey: "AIzaSyALrGK6yYtpORV5jHvANzpAi0WwPTPUqFI",
    authDomain: "study-suppliers.firebaseapp.com",
    projectId: "study-suppliers",
    storageBucket: "study-suppliers.firebasestorage.app",
    messagingSenderId: "1066506689674",
    appId: "1:1066506689674:web:3b860b11f6a1572929e173"
};

let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase Fallback Mode Enabled");
}

// BCom CA Syllabus Structure (Semesters & Subjects)
const bcomCaSyllabus = {
    fy: {
        title: "FY BCom CA",
        semesters: {
            sem1: {
                title: "Semester 1",
                subjects: [
                    "Financial Accounting",
                    "Business Communication",
                    "Principles of Management",
                    "Computer Fundamentals & C Programming",
                    "Office Automation tools"
                ]
            },
            sem2: {
                title: "Semester 2",
                subjects: [
                    "Financial Accounting II",
                    "Business Economics",
                    "Programming in C",
                    "DBMS (Database Management)",
                    "Web Technology (HTML/CSS)"
                ]
            }
        }
    },
    sy: {
        title: "SY BCom CA",
        semesters: {
            sem3: {
                title: "Semester 3",
                subjects: [
                    "Cost & Management Accounting",
                    "Data Structure using C",
                    "Object Oriented Programming (C++)",
                    "Software Engineering",
                    "Business Regulatory Framework"
                ]
            },
            sem4: {
                title: "Semester 4",
                subjects: [
                    "Corporate Accounting",
                    "Java Programming",
                    "Computer Networks",
                    "Database Systems (SQL)",
                    "Management Information System (MIS)"
                ]
            }
        }
    },
    ty: {
        title: "TY BCom CA",
        semesters: {
            sem5: {
                title: "Semester 5",
                subjects: [
                    "Cyber Security & Law",
                    "Advanced Java",
                    "Python Programming",
                    "E-Commerce & Web Marketing",
                    "Project Work I"
                ]
            },
            sem6: {
                title: "Semester 6",
                subjects: [
                    "Advanced Web Technology (PHP)",
                    "Software Testing",
                    "Cloud Computing",
                    "Digital Marketing",
                    "Main Project Work II"
                ]
            }
        }
    }
};

// Local Data Helpers
const getLocalData = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const setLocalData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// Navigation Memory
let currentSelectedYear = "";
let currentSelectedSem = "";
let currentSelectedSubject = "";

document.addEventListener("DOMContentLoaded", function () {
    setupFormEvents();
    renderHistoryList();
    updateDownloadBadgeCount();
});

// Setup Form Submission Handlers
function setupFormEvents() {
    const userShareForm = document.getElementById("userShareForm");
    if (userShareForm) {
        userShareForm.onsubmit = async function (e) {
            e.preventDefault();
            const year = document.getElementById("userMatYear").value;
            const sem = document.getElementById("userMatSem").value;
            const subject = document.getElementById("userMatSubject").value;
            const category = document.getElementById("userMatCategory").value;
            const title = document.getElementById("userMatTitle").value.trim();
            const url = document.getElementById("userMatUrl").value.trim();

            await saveNewMaterial(year, sem, subject, category, title, url);
            userShareForm.reset();
            openSubjectMaterials(year, sem, subject);
        };
    }

    const adminForm = document.getElementById("addMaterialForm");
    if (adminForm) {
        adminForm.onsubmit = async function (e) {
            e.preventDefault();
            const year = document.getElementById("adminMatYear").value;
            const sem = document.getElementById("adminMatSem").value;
            const subject = document.getElementById("adminMatSubject").value;
            const category = document.getElementById("adminMatCategory").value;
            const title = document.getElementById("adminMatTitle").value.trim();
            const url = document.getElementById("adminMatUrl").value.trim();

            await saveNewMaterial(year, sem, subject, category, title, url);
            adminForm.reset();
            renderAdminMaterialsList();
        };
    }

    const clearBtn = document.getElementById("clearHistoryBtn");
    if (clearBtn) {
        clearBtn.onclick = function() {
            setLocalData("activity_logs", []);
            renderHistoryList();
        };
    }
}

// Save Material to LocalStorage and Firebase
async function saveNewMaterial(year, sem, subject, category, title, url) {
    let mats = getLocalData("materials_data");
    const newMat = { 
        id: Date.now().toString(), 
        year, sem, subject, category, title, url, 
        date: new Date().toLocaleDateString() 
    };
    mats.unshift(newMat);
    setLocalData("materials_data", mats);

    if (db) {
        try {
            await addDoc(collection(db, "materialsData"), { 
                year, sem, subject, category, title, url, timestamp: serverTimestamp() 
            });
        } catch (err) { console.log("Firebase sync skipped:", err); }
    }

    alert(`PDF Uploaded Successfully under ${subject}!`);
    addActivityLog(`Shared PDF: ${title} (${subject})`);
}

// Navigation Functions
window.showHome = function () {
    hideAllViews();
    document.getElementById("courseSelectionView").classList.remove("hidden");
};

window.openYear = function (yearKey) {
    currentSelectedYear = yearKey;
    hideAllViews();
    const semView = document.getElementById("semesterSelectionView");
    semView.classList.remove("hidden");

    const yearData = bcomCaSyllabus[yearKey];
    document.getElementById("selectedYearTitle").textContent = `${yearData.title} - Select Semester`;

    const grid = document.getElementById("semesterGrid");
    grid.innerHTML = "";

    Object.keys(yearData.semesters).forEach(semKey => {
        const sem = yearData.semesters[semKey];
        const card = document.createElement("div");
        card.className = "course-card";
        card.onclick = () => openSemester(yearKey, semKey);
        card.innerHTML = `
            <i class="fa-solid fa-book-bookmark course-icon"></i>
            <h3>${sem.title}</h3>
            <p>${sem.subjects.length} Subjects Included</p>
            <button type="button" class="explore-btn">Open Semester <i class="fa-solid fa-arrow-right"></i></button>
        `;
        grid.appendChild(card);
    });
};

window.backToSemesters = function() {
    if (currentSelectedYear) openYear(currentSelectedYear);
    else showHome();
};

window.openSemester = function (yearKey, semKey) {
    currentSelectedYear = yearKey;
    currentSelectedSem = semKey;
    hideAllViews();

    const subjectView = document.getElementById("subjectSelectionView");
    subjectView.classList.remove("hidden");

    const semData = bcomCaSyllabus[yearKey].semesters[semKey];
    document.getElementById("selectedSemTitle").textContent = `${bcomCaSyllabus[yearKey].title} (${semData.title}) - Subjects`;

    const grid = document.getElementById("subjectGrid");
    grid.innerHTML = "";

    semData.subjects.forEach(subjName => {
        const card = document.createElement("div");
        card.className = "subject-card";
        card.onclick = () => openSubjectMaterials(yearKey, semKey, subjName);
        card.innerHTML = `
            <i class="fa-solid fa-folder-open subject-icon"></i>
            <h3>${subjName}</h3>
            <p>Access Notes, Books & Papers</p>
            <button type="button" class="explore-btn">View PDFs <i class="fa-solid fa-arrow-right"></i></button>
        `;
        grid.appendChild(card);
    });
};

window.backToSubjects = function() {
    if (currentSelectedYear && currentSelectedSem) {
        openSemester(currentSelectedYear, currentSelectedSem);
    } else {
        showHome();
    }
};

window.openSubjectMaterials = function (yearKey, semKey, subjectName) {
    currentSelectedYear = yearKey;
    currentSelectedSem = semKey;
    currentSelectedSubject = subjectName;

    hideAllViews();
    document.getElementById("materialsDetailView").classList.remove("hidden");
    document.getElementById("selectedSubjectTitle").textContent = `${subjectName} - Study PDFs`;

    renderSubjectMaterials(yearKey, semKey, subjectName);
};

// Form Dropdown Dynamic Populators
window.populateFormSemesters = function (yearSelectId, semSelectId, subjSelectId) {
    const yearVal = document.getElementById(yearSelectId).value;
    const semSelect = document.getElementById(semSelectId);
    const subjSelect = document.getElementById(subjSelectId);

    semSelect.innerHTML = '<option value="">2. Select Semester</option>';
    subjSelect.innerHTML = '<option value="">3. Select Subject</option>';

    if (!yearVal || !bcomCaSyllabus[yearVal]) return;

    const sems = bcomCaSyllabus[yearVal].semesters;
    Object.keys(sems).forEach(sKey => {
        const opt = document.createElement("option");
        opt.value = sKey;
        opt.textContent = sems[sKey].title;
        semSelect.appendChild(opt);
    });
};

window.populateFormSubjects = function (yearSelectId, semSelectId, subjSelectId) {
    const yearVal = document.getElementById(yearSelectId).value;
    const semVal = document.getElementById(semSelectId).value;
    const subjSelect = document.getElementById(subjSelectId);

    subjSelect.innerHTML = '<option value="">3. Select Subject</option>';

    if (!yearVal || !semVal || !bcomCaSyllabus[yearVal].semesters[semVal]) return;

    const subjects = bcomCaSyllabus[yearVal].semesters[semVal].subjects;
    subjects.forEach(subj => {
        const opt = document.createElement("option");
        opt.value = subj;
        opt.textContent = subj;
        subjSelect.appendChild(opt);
    });
};

// Google Drive Link Normalizer & Converter
function processPdfUrls(rawUrl) {
    let previewUrl = rawUrl;
    let downloadUrl = rawUrl;

    if (rawUrl.includes("drive.google.com")) {
        let fileId = "";
        const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            fileId = match[1];
            previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
    }
    return { previewUrl, downloadUrl };
}

// Render PDFs inside Selected Subject
function renderSubjectMaterials(yearKey, semKey, subjectName) {
    const grid = document.getElementById("materialsGrid");
    grid.innerHTML = "";

    const allMaterials = getLocalData("materials_data");
    const subjectMaterials = allMaterials.filter(m => 
        m.year === yearKey && m.sem === semKey && m.subject === subjectName
    );

    if (subjectMaterials.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="fa-solid fa-folder-open" style="font-size:3rem; color:#0284c7; margin-bottom:12px;"></i><br>
                <b>No PDFs available yet for ${subjectName}.</b><br>
                <p style="color:#64748b; margin-top:5px;">Use 'Share PDF' button above to add study material for this subject.</p>
            </div>`;
        return;
    }

    const categories = ["Textbooks & Notes", "Question Papers", "Practical Files", "Reference PDFs"];

    categories.forEach(category => {
        const items = subjectMaterials.filter(m => m.category === category || (!m.category && category === "Textbooks & Notes"));

        if (items.length > 0) {
            const sectionHeader = document.createElement("div");
            sectionHeader.className = "category-header";
            sectionHeader.innerHTML = `<h3><i class="fa-solid fa-folder"></i> ${category}</h3>`;
            grid.appendChild(sectionHeader);

            items.forEach(item => {
                const pdfCard = document.createElement("div");
                pdfCard.className = "pdf-item-card";

                const { previewUrl, downloadUrl } = processPdfUrls(item.url);

                pdfCard.innerHTML = `
                    <div class="pdf-item-header">
                        <div>
                            <i class="fa-solid fa-file-pdf" style="color: #e11d48; margin-right: 8px;"></i>
                            <b>${item.title}</b>
                        </div>
                        <div class="pdf-action-btns">
                            <a href="${previewUrl}" target="_blank" class="action-btn btn-open" onclick="trackAndSaveDownload('${item.title}', '${item.url}', 'view')">
                                <i class="fa-solid fa-eye"></i> View PDF
                            </a>
                            <a href="${downloadUrl}" target="_blank" class="action-btn btn-download" onclick="trackAndSaveDownload('${item.title}', '${item.url}', 'download')">
                                <i class="fa-solid fa-download"></i> Download PDF
                            </a>
                        </div>
                    </div>
                    <iframe src="${previewUrl}" width="100%" height="320" style="border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 10px;" allow="autoplay"></iframe>
                `;
                grid.appendChild(pdfCard);
            });
        }
    });
}

// User Saved Downloads Logic
window.trackAndSaveDownload = function (title, url, actionType) {
    let downloads = getLocalData("user_saved_downloads");
    const exists = downloads.some(d => d.pdfTitle === title);

    if (!exists) {
        downloads.push({
            pdfTitle: title,
            pdfUrl: url,
            date: new Date().toLocaleDateString()
        });
        setLocalData("user_saved_downloads", downloads);
    }

    addActivityLog(`${actionType === 'download' ? 'Downloaded' : 'Viewed'} ${title}`);
    updateDownloadBadgeCount();
};

function updateDownloadBadgeCount() {
    const downloads = getLocalData("user_saved_downloads");
    const badge = document.getElementById("dlNavBadge");
    if (badge) badge.textContent = downloads.length;
}

window.openUserDownloads = function () {
    hideAllViews();
    document.getElementById("userDownloadsView").classList.remove("hidden");
    renderUserDownloadsGrid();
};

function renderUserDownloadsGrid() {
    const grid = document.getElementById("userDownloadsGrid");
    grid.innerHTML = "";

    const downloads = getLocalData("user_saved_downloads");

    if (downloads.length === 0) {
        grid.innerHTML = `
            <div style="text-align:center; padding:30px;">
                <i class="fa-solid fa-folder-open" style="font-size:2.5rem; color:#0284c7; margin-bottom:12px;"></i><br>
                <b>No saved PDFs found.</b><br>PDFs you view or download will appear here.
            </div>`;
        return;
    }

    downloads.forEach(item => {
        const { previewUrl, downloadUrl } = processPdfUrls(item.pdfUrl);

        const pdfCard = document.createElement("div");
        pdfCard.className = "pdf-item-card";
        pdfCard.innerHTML = `
            <div class="pdf-item-header">
                <div>
                    <i class="fa-solid fa-file-pdf" style="color: #e11d48; margin-right: 8px;"></i>
                    <b>${item.pdfTitle}</b>
                </div>
                <div class="pdf-action-btns">
                    <a href="${previewUrl}" target="_blank" class="action-btn btn-open">
                        <i class="fa-solid fa-eye"></i> View PDF
                    </a>
                    <a href="${downloadUrl}" target="_blank" class="action-btn btn-download">
                        <i class="fa-solid fa-download"></i> Re-Download
                    </a>
                </div>
            </div>
            <iframe src="${previewUrl}" width="100%" height="320" style="border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 10px;" allow="autoplay"></iframe>
        `;
        grid.appendChild(pdfCard);
    });
}

// Panels Show/Hide
window.openUserUploadPanel = function () {
    hideAllViews();
    document.getElementById("userUploadView").classList.remove("hidden");
};

window.openAdminPanel = function () {
    hideAllViews();
    document.getElementById("adminPanelView").classList.remove("hidden");
    renderAdminMaterialsList();
};

function hideAllViews() {
    [
        "courseSelectionView", "semesterSelectionView", "subjectSelectionView", 
        "materialsDetailView", "userUploadView", "userDownloadsView", "adminPanelView"
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
}

function renderAdminMaterialsList() {
    const list = document.getElementById("adminMaterialList");
    const mats = getLocalData("materials_data");

    if (mats.length === 0) {
        list.innerHTML = "<li>No materials found.</li>";
        return;
    }

    let html = "";
    mats.forEach(m => {
        html += `
            <li style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #e2e8f0;">
                <span><b>[${m.year ? m.year.toUpperCase() : ''} - ${m.subject}]</b> ${m.title}</span>
                <button type="button" onclick="deleteMaterial('${m.id}')" style="background:#e11d48; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
            </li>`;
    });
    list.innerHTML = html;
}

window.deleteMaterial = function (id) {
    if (confirm("Delete this material?")) {
        let mats = getLocalData("materials_data").filter(m => m.id !== id);
        setLocalData("materials_data", mats);
        renderAdminMaterialsList();
    }
};

function addActivityLog(text) {
    let logs = getLocalData("activity_logs");
    logs.unshift({ text, date: new Date().toLocaleTimeString() });
    setLocalData("activity_logs", logs);
    renderHistoryList();
}

function renderHistoryList() {
    const historyList = document.getElementById("historyList");
    const countText = document.getElementById("downloadCount");
    const logs = getLocalData("activity_logs");

    if (countText) countText.textContent = logs.length;

    if (logs.length === 0) {
        historyList.innerHTML = `<li class="empty-msg">No activity yet.</li>`;
        return;
    }

    let html = "";
    logs.forEach(l => {
        html += `<li style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><i class="fa-solid fa-angle-right"></i> ${l.text}</li>`;
    });
    historyList.innerHTML = html;
}
