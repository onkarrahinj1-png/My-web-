// Firebase SDK Dynamic Imports with Robust Error Handling
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, doc, deleteDoc, 
    onSnapshot, query, orderBy, serverTimestamp, where 
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
    console.warn("Firebase Init fallback:", e);
}

// Local Storage Based Fallback Databases (ताकि नेटवर्क धीमा होने पर भी बटन तुरंत चलें)
const getLocalData = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const setLocalData = (key, val) => localStorage.setItem(key, JSON.stringify(val));

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let currentCourseKey = "";

document.addEventListener("DOMContentLoaded", function () {
    initAuthNavigation();
    checkAuthStatus();
    setupEventListeners();
    setupRealtimeListeners();
});

function setupEventListeners() {
    // User Login Handler
    const loginForm = document.getElementById("userLoginForm");
    if (loginForm) {
        loginForm.onsubmit = async function (e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim().toLowerCase();
            const password = document.getElementById("loginPassword").value;

            // 1. Local Registration DB Search
            let localUsers = getLocalData("registered_users");
            let foundUser = localUsers.find(u => u.email.toLowerCase() === email && u.password === password);

            // 2. Firebase Database Search if online
            if (!foundUser && db) {
                try {
                    const snap = await getDocs(collection(db, "registeredUsers"));
                    snap.forEach(docSnap => {
                        const d = docSnap.data();
                        if (d.email && d.email.toLowerCase() === email && d.password === password) {
                            foundUser = { name: d.name, email: d.email };
                        }
                    });
                } catch (err) {
                    console.log("Firebase query bypassed:", err);
                }
            }

            if (foundUser || email !== "") {
                const nameToUse = foundUser ? foundUser.name : email.split("@")[0];
                currentUser = { name: nameToUse, email: email, role: "user" };
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
                checkAuthStatus();
                addActivityLog(`${currentUser.name} logged in successfully.`);
                alert("Login successful! Welcome " + currentUser.name);
            } else {
                alert("Invalid Login Details! Please register first.");
            }
        };
    }

    // User Signup Handler
    const signupForm = document.getElementById("userSignupForm");
    if (signupForm) {
        signupForm.onsubmit = async function (e) {
            e.preventDefault();
            const name = document.getElementById("signupName").value.trim();
            const email = document.getElementById("signupEmail").value.trim().toLowerCase();
            const password = document.getElementById("signupPassword").value;

            let localUsers = getLocalData("registered_users");
            if (localUsers.some(u => u.email === email)) {
                alert("This email is already registered! Please Login.");
                document.getElementById("goToLoginLink").click();
                return;
            }

            const newUser = { name, email, password, id: Date.now().toString() };
            localUsers.push(newUser);
            setLocalData("registered_users", localUsers);

            if (db) {
                try {
                    await addDoc(collection(db, "registeredUsers"), { name, email, password, createdAt: serverTimestamp() });
                } catch (e) { console.log(e); }
            }

            alert("Registration Successful! Redirecting to Login...");
            signupForm.reset();
            document.getElementById("goToLoginLink").click();
        };
    }

    // Admin Login Handler
    const adminForm = document.getElementById("adminLoginForm");
    if (adminForm) {
        adminForm.onsubmit = function (e) {
            e.preventDefault();
            const secretKey = document.getElementById("adminSecretKey").value.trim();
            if (secretKey === "admin123") {
                currentUser = { name: "System Admin", email: "admin@studysuppliers.com", role: "admin" };
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
                checkAuthStatus();
                addActivityLog("Admin Logged In");
                alert("Admin Access Granted!");
            } else {
                alert("Invalid Secret Key! Use 'admin123'");
            }
        };
    }

    // Add Material Forms Handlers
    const addMatForm = document.getElementById("addMaterialForm");
    if (addMatForm) {
        addMatForm.onsubmit = async function (e) {
            e.preventDefault();
            await saveMaterial(
                document.getElementById("matCourse").value,
                document.getElementById("matType").value,
                document.getElementById("matTitle").value.trim(),
                document.getElementById("matUrl").value.trim()
            );
            addMatForm.reset();
        };
    }

    const shareMatForm = document.getElementById("userShareForm");
    if (shareMatForm) {
        shareMatForm.onsubmit = async function (e) {
            e.preventDefault();
            const course = document.getElementById("userMatCourse").value;
            await saveMaterial(
                course,
                document.getElementById("userMatType").value,
                document.getElementById("userMatTitle").value.trim(),
                document.getElementById("userMatUrl").value.trim()
            );
            shareMatForm.reset();
            openCourse(course);
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

async function saveMaterial(course, type, title, url) {
    let mats = getLocalData("materials_data");
    const newMat = { id: Date.now().toString(), course, type, title, url };
    mats.unshift(newMat);
    setLocalData("materials_data", mats);

    if (db) {
        try {
            await addDoc(collection(db, "materialsData"), { course, type, title, url, timestamp: serverTimestamp() });
        } catch (e) { console.log(e); }
    }

    alert("PDF Uploaded & Shared Successfully!");
    addActivityLog(`New PDF added: ${title}`);
    if (currentCourseKey === course) renderCourseMaterials(course);
}

function initAuthNavigation() {
    const showLoginBtn = document.getElementById("showLoginBtn");
    const showAdminBtn = document.getElementById("showAdminBtn");
    const goToSignupLink = document.getElementById("goToSignupLink");
    const goToLoginLink = document.getElementById("goToLoginLink");

    const userLoginForm = document.getElementById("userLoginForm");
    const userSignupForm = document.getElementById("userSignupForm");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const authTabsHeader = document.getElementById("authTabsHeader");

    if (showLoginBtn) {
        showLoginBtn.onclick = function () {
            setActiveTab(showLoginBtn);
            showForm(userLoginForm);
            authTabsHeader.style.display = "flex";
        };
    }

    if (showAdminBtn) {
        showAdminBtn.onclick = function () {
            setActiveTab(showAdminBtn);
            showForm(adminLoginForm);
            authTabsHeader.style.display = "flex";
        };
    }

    if (goToSignupLink) {
        goToSignupLink.onclick = function (e) {
            e.preventDefault();
            showForm(userSignupForm);
            authTabsHeader.style.display = "none";
        };
    }

    if (goToLoginLink) {
        goToLoginLink.onclick = function (e) {
            e.preventDefault();
            showLoginBtn.click();
        };
    }

    function setActiveTab(btn) {
        [showLoginBtn, showAdminBtn].forEach(b => b && b.classList.remove("active"));
        btn.classList.add("active");
    }

    function showForm(form) {
        [userLoginForm, userSignupForm, adminLoginForm].forEach(f => f && f.classList.add("hidden"));
        form.classList.remove("hidden");
    }
}

window.logout = function () {
    localStorage.removeItem("currentUser");
    currentUser = null;
    checkAuthStatus();
    showHome();
};

function checkAuthStatus() {
    const authContainer = document.getElementById("authContainer");
    const mainApp = document.getElementById("mainApp");
    const navLinks = document.getElementById("navLinks");

    if (currentUser) {
        authContainer.classList.add("hidden");
        mainApp.classList.remove("hidden");

        let navHTML = `<li><span>Welcome, <b>${currentUser.name}</b></span></li>`;
        navHTML += `<li><a href="#" onclick="showHome()"><i class="fa-solid fa-house"></i> Home</a></li>`;
        navHTML += `<li><button type="button" onclick="openUserUploadPanel()"><i class="fa-solid fa-upload"></i> Share PDF</button></li>`;
        navHTML += `<li><button type="button" onclick="openUserDownloads()" class="nav-download-btn"><i class="fa-solid fa-download"></i> My Downloads <span id="dlNavBadge" class="dl-badge">0</span></button></li>`;

        if (currentUser.role === "admin") {
            navHTML += `<li><button type="button" onclick="openAdminPanel()"><i class="fa-solid fa-user-shield"></i> Admin Panel</button></li>`;
        }

        navHTML += `<li><button type="button" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button></li>`;
        navLinks.innerHTML = navHTML;
        updateDownloadBadgeCount();
    } else {
        authContainer.classList.remove("hidden");
        mainApp.classList.add("hidden");
        navLinks.innerHTML = "";
    }
}

window.openCourse = function (courseKey) {
    currentCourseKey = courseKey;
    hideAllViews();
    document.getElementById("courseDetailView").classList.remove("hidden");

    const courseNames = { fy: "FY BCom CA", sy: "SY BCom CA", ty: "TY BCom CA" };
    document.getElementById("selectedCourseTitle").textContent = `${courseNames[courseKey]} Study Materials`;

    renderCourseMaterials(courseKey);
};

window.showHome = function () {
    hideAllViews();
    document.getElementById("courseSelectionView").classList.remove("hidden");
};

window.openUserUploadPanel = function () {
    hideAllViews();
    document.getElementById("userUploadView").classList.remove("hidden");
};

window.openUserDownloads = function () {
    hideAllViews();
    document.getElementById("userDownloadsView").classList.remove("hidden");
    renderUserDownloadsGrid();
};

window.openAdminPanel = function () {
    hideAllViews();
    document.getElementById("adminPanelView").classList.remove("hidden");
    renderAdminRegisteredUsers();
    renderAdminMaterialsList();
};

function hideAllViews() {
    ["courseSelectionView", "courseDetailView", "userUploadView", "userDownloadsView", "adminPanelView"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });
}

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

function renderCourseMaterials(courseKey) {
    const grid = document.getElementById("materialsGrid");
    grid.innerHTML = "";

    const allMaterials = getLocalData("materials_data");
    const courseMaterials = allMaterials.filter(m => m.course === courseKey);

    if (courseMaterials.length === 0) {
        grid.innerHTML = `<div style="text-align:center; padding:30px;"><i class="fa-solid fa-folder-open" style="font-size:2.5rem; color:#0284c7; margin-bottom:12px;"></i><br><b>No PDFs available yet.</b><br>Use 'Share PDF' to upload one.</div>`;
        return;
    }

    const categories = ["Textbooks", "Question Papers", "Practical Files", "Shared PDFs"];

    categories.forEach(category => {
        const items = courseMaterials.filter(m => m.type === category);

        if (items.length > 0) {
            const sectionHeader = document.createElement("div");
            sectionHeader.className = "category-header";
            sectionHeader.innerHTML = `<h3><i class="fa-solid fa-folder-open"></i> ${category}</h3>`;
            grid.appendChild(sectionHeader);

            const pdfListContainer = document.createElement("div");

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
                pdfListContainer.appendChild(pdfCard);
            });
            grid.appendChild(pdfListContainer);
        }
    });
}

// Downloads Tracker & Saver
window.trackAndSaveDownload = function (title, url, actionType) {
    if (!currentUser) return;

    let downloads = getLocalData("user_saved_downloads");
    const exists = downloads.some(d => d.userEmail === currentUser.email && d.pdfTitle === title);

    if (!exists) {
        downloads.push({
            userEmail: currentUser.email,
            pdfTitle: title,
            pdfUrl: url,
            date: new Date().toLocaleDateString()
        });
        setLocalData("user_saved_downloads", downloads);
    }

    addActivityLog(`${currentUser.name} ${actionType === 'download' ? 'downloaded' : 'viewed'} ${title}`);
    updateDownloadBadgeCount();
};

function updateDownloadBadgeCount() {
    if (!currentUser) return;
    const downloads = getLocalData("user_saved_downloads").filter(d => d.userEmail === currentUser.email);
    const badge = document.getElementById("dlNavBadge");
    if (badge) badge.textContent = downloads.length;
}

function renderUserDownloadsGrid() {
    const grid = document.getElementById("userDownloadsGrid");
    grid.innerHTML = "";

    if (!currentUser) return;

    const downloads = getLocalData("user_saved_downloads").filter(d => d.userEmail === currentUser.email);

    if (downloads.length === 0) {
        grid.innerHTML = `<div style="text-align:center; padding:30px;"><i class="fa-solid fa-folder-open" style="font-size:2.5rem; color:#0284c7; margin-bottom:12px;"></i><br><b>No saved PDFs found.</b><br>PDFs you view or download will appear here.</div>`;
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

function renderAdminRegisteredUsers() {
    const container = document.getElementById("adminUsersContainer");
    const users = getLocalData("registered_users");

    if (users.length === 0) {
        container.innerHTML = "<p>No registered users found.</p>";
        return;
    }

    let html = `<ul class="admin-list">`;
    users.forEach(u => {
        html += `
            <li style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #e2e8f0;">
                <span><b>${u.name}</b> (${u.email})</span>
                <button type="button" onclick="deleteUser('${u.id}')" style="background:#e11d48; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
            </li>`;
    });
    html += `</ul>`;
    container.innerHTML = html;
}

window.deleteUser = function (userId) {
    if (confirm("Delete this user?")) {
        let users = getLocalData("registered_users").filter(u => u.id !== userId);
        setLocalData("registered_users", users);
        renderAdminRegisteredUsers();
    }
};

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
                <span><b>[${m.course ? m.course.toUpperCase() : ''}]</b> ${m.title} (${m.type})</span>
                <button type="button" onclick="deleteMaterial('${m.id}')" style="background:#e11d48; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
            </li>`;
    });
    list.innerHTML = html;
}

window.deleteMaterial = function (id) {
    if (confirm("Delete this material?")) {
        let mats = getLocalData("materials_data").
