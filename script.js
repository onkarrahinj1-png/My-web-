// Firebase SDKs Imports
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
    appId: "1:1066506689674:web:3b860b11f6a1572929e173",
    measurementId: "G-N2TNG3BXGE"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let currentCourseKey = "";

// Firebase Collections References
const usersCol = collection(db, "registeredUsers");
const materialsCol = collection(db, "materialsData");
const historyCol = collection(db, "activityHistory");

document.addEventListener("DOMContentLoaded", function () {
    initAuthNavigation();
    checkAuthStatus();
    setupRealtimeListeners();

    document.getElementById("userLoginForm").addEventListener("submit", handleUserLogin);
    document.getElementById("userSignupForm").addEventListener("submit", handleUserSignup);
    document.getElementById("adminLoginForm").addEventListener("submit", handleAdminLogin);
    document.getElementById("addMaterialForm").addEventListener("submit", handleAddMaterial);
    document.getElementById("userShareForm").addEventListener("submit", handleUserShareMaterial);
    document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);
});

// Setup Realtime Listeners for Live Updates
function setupRealtimeListeners() {
    // 1. Listen for Materials Update
    onSnapshot(query(materialsCol, orderBy("timestamp", "desc")), () => {
        if (!document.getElementById("courseDetailView").classList.contains("hidden")) {
            renderCourseMaterials(currentCourseKey);
        }
        if (!document.getElementById("adminPanelView").classList.contains("hidden")) {
            renderAdminMaterialsList();
        }
    });

    // 2. Listen for History/Activity Log Update
    onSnapshot(query(historyCol, orderBy("timestamp", "desc")), (snapshot) => {
        renderHistoryList(snapshot);
    });

    // 3. Listen for Registered Users List Updates
    onSnapshot(usersCol, (snapshot) => {
        if (!document.getElementById("adminPanelView").classList.contains("hidden")) {
            renderAdminRegisteredUsers(snapshot);
        }
    });
}

// Controls switching between Login, Registration Page, and Admin Login
function initAuthNavigation() {
    const showLoginBtn = document.getElementById("showLoginBtn");
    const showAdminBtn = document.getElementById("showAdminBtn");
    const goToSignupLink = document.getElementById("goToSignupLink");
    const goToLoginLink = document.getElementById("goToLoginLink");

    const userLoginForm = document.getElementById("userLoginForm");
    const userSignupForm = document.getElementById("userSignupForm");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const authTabsHeader = document.getElementById("authTabsHeader");

    // Click "User Login" Tab
    showLoginBtn.onclick = function () {
        setActiveTab(showLoginBtn);
        showForm(userLoginForm);
        authTabsHeader.style.display = "flex";
    };

    // Click "Admin Login" Tab
    showAdminBtn.onclick = function () {
        setActiveTab(showAdminBtn);
        showForm(adminLoginForm);
        authTabsHeader.style.display = "flex";
    };

    // Click "Register here" link
    goToSignupLink.onclick = function (e) {
        e.preventDefault();
        showForm(userSignupForm);
        authTabsHeader.style.display = "none";
    };

    // Click "Back to Login" link inside Registration page
    goToLoginLink.onclick = function (e) {
        e.preventDefault();
        showLoginBtn.click();
    };

    function setActiveTab(btn) {
        [showLoginBtn, showAdminBtn].forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    }

    function showForm(form) {
        [userLoginForm, userSignupForm, adminLoginForm].forEach(f => f.classList.add("hidden"));
        form.classList.remove("hidden");
    }
}

// Handles User Login using Firebase Firestore
async function handleUserLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const snapshot = await getDocs(usersCol);
        let user = null;
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (data.email === email && data.password === password) {
                user = { id: docSnap.id, ...data };
            }
        });

        if (user) {
            currentUser = { name: user.name, email: user.email, role: "user" };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            checkAuthStatus();
            addActivityLog(`${user.name} logged in.`);
        } else {
            alert("Account not found or invalid password! Please register first.");
            document.getElementById("goToSignupLink").click();
        }
    } catch (error) {
        alert("Login Error: " + error.message);
    }
}

// Handles User Registration using Firebase Firestore
async function handleUserSignup(e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    try {
        const snapshot = await getDocs(usersCol);
        let existingUser = false;
        snapshot.forEach(docSnap => {
            if (docSnap.data().email === email) existingUser = true;
        });

        if (existingUser) {
            alert("This email is already registered! Please Login.");
            document.getElementById("goToLoginLink").click();
            return;
        }

        await addDoc(usersCol, {
            name: name,
            email: email,
            password: password,
            createdAt: serverTimestamp()
        });

        alert("Registration Successful! Redirecting to Login...");
        document.getElementById("userSignupForm").reset();
        document.getElementById("goToLoginLink").click();
    } catch (error) {
        alert("Registration Failed: " + error.message);
    }
}

// Admin Login
function handleAdminLogin(e) {
    e.preventDefault();
    const secretKey = document.getElementById("adminSecretKey").value.trim();

    if (secretKey === "admin123") {
        currentUser = { name: "System Admin", role: "admin" };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        checkAuthStatus();
        addActivityLog("Admin logged in.");
    } else {
        alert("Invalid Secret Key! Use 'admin123'");
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
        navHTML += `<li><button onclick="openUserUploadPanel()"><i class="fa-solid fa-upload"></i> Share PDF</button></li>`;

        if (currentUser.role === "admin") {
            navHTML += `<li><button onclick="openAdminPanel()"><i class="fa-solid fa-user-shield"></i> Admin Panel</button></li>`;
        }

        navHTML += `<li><button onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button></li>`;
        navLinks.innerHTML = navHTML;
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

window.openAdminPanel = function () {
    hideAllViews();
    document.getElementById("adminPanelView").classList.remove("hidden");
    renderAdminRegisteredUsers();
    renderAdminMaterialsList();
};

function hideAllViews() {
    document.getElementById("courseSelectionView").classList.add("hidden");
    document.getElementById("courseDetailView").classList.add("hidden");
    document.getElementById("userUploadView").classList.add("hidden");
    document.getElementById("adminPanelView").classList.add("hidden");
}

function formatEmbedUrl(rawUrl) {
    if (rawUrl.includes("drive.google.com")) {
        return rawUrl.replace(/\/view\?usp=[a-zA-Z0-9_]+/, "/preview")
                     .replace(/\/view$/, "/preview")
                     .replace(/\/edit$/, "/preview");
    }
    return rawUrl;
}

// Render Course Materials from Firestore
async function renderCourseMaterials(courseKey) {
    const grid = document.getElementById("materialsGrid");
    grid.innerHTML = "<p style='color: #64748b;'>Loading materials...</p>";

    try {
        const snapshot = await getDocs(query(materialsCol, orderBy("timestamp", "desc")));
        const materials = [];
        snapshot.forEach(docSnap => {
            materials.push({ id: docSnap.id, ...docSnap.data() });
        });

        const courseMaterials = materials.filter(m => m.course === courseKey);
        grid.innerHTML = "";

        if (courseMaterials.length === 0) {
            grid.innerHTML = `<div class="no-data-msg"><i class="fa-solid fa-folder-open" style="font-size:2.5rem; color:#0284c7; margin-bottom:12px;"></i><br><b>No PDFs available yet.</b><br>Use 'Share PDF' to upload one.</div>`;
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
                pdfListContainer.className = "pdf-list-container";

                items.forEach(item => {
                    const pdfCard = document.createElement("div");
                    pdfCard.className = "pdf-item-card";

                    const embedUrl = formatEmbedUrl(item.url);

                    pdfCard.innerHTML = `
                        <div class="pdf-item-header">
                            <div class="pdf-item-title">
                                <i class="fa-solid fa-file-pdf" style="color: #e11d48; margin-right: 8px;"></i>
                                <b>${item.title}</b>
                            </div>
                            <a href="${item.url}" target="_blank" class="download-btn" onclick="logDownload('${item.title}')" style="color:#0284c7; text-decoration:none; font-weight:600; font-size:0.9rem;">
                                <i class="fa-solid fa-arrow-up-right-from-square"></i> Open PDF
                            </a>
                        </div>
                        <iframe src="${embedUrl}" width="100%" height="300" style="border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 10px;" allow="autoplay"></iframe>
                    `;
                    pdfListContainer.appendChild(pdfCard);
                });
                grid.appendChild(pdfListContainer);
            }
        });
    } catch (error) {
        grid.innerHTML = "<p>Error loading materials.</p>";
    }
}

// Upload & Share Material to Firestore
async function handleAddMaterial(e) {
    e.preventDefault();
    const course = document.getElementById("matCourse").value;
    const type = document.getElementById("matType").value;
    const title = document.getElementById("matTitle").value.trim();
    const url = document.getElementById("matUrl").value.trim();

    try {
        await addDoc(materialsCol, { course, type, title, url, timestamp: serverTimestamp() });
        alert("Material uploaded successfully!");
        document.getElementById("addMaterialForm").reset();
        addActivityLog(`Admin uploaded PDF: ${title}`);
    } catch (error) {
        alert("Upload failed: " + error.message);
    }
}

async function handleUserShareMaterial(e) {
    e.preventDefault();
    const course = document.getElementById("userMatCourse").value;
    const type = document.getElementById("userMatType").value;
    const title = document.getElementById("userMatTitle").value.trim();
    const url = document.getElementById("userMatUrl").value.trim();

    try {
        await addDoc(materialsCol, { course, type, title, url, timestamp: serverTimestamp() });
        alert("PDF Uploaded & Shared Successfully!");
        document.getElementById("userShareForm").reset();
        addActivityLog(`${currentUser.name} shared PDF: ${title}`);
        openCourse(course);
    } catch (error) {
        alert("Share failed: " + error.message);
    }
}

// Admin Panel Functions
async function renderAdminRegisteredUsers(snapshot) {
    const container = document.getElementById("adminUsersContainer");
    try {
        const snap = snapshot || await getDocs(usersCol);
        if (snap.empty) {
            container.innerHTML = "<p>No registered users found.</p>";
            return;
        }

        let html = `<ul class="admin-list">`;
        snap.forEach(docSnap => {
            const u = docSnap.data();
            html += `
                <li style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #e2e8f0;">
                    <span><b>${u.name}</b> (${u.email})</span>
                    <button onclick="deleteUser('${docSnap.id}')" style="background:#e11d48; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                </li>`;
        });
        html += `</ul>`;
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = "<p>Failed to load users.</p>";
    }
}

window.deleteUser = async function (userId) {
    if (confirm("Are you sure you want to delete this user?")) {
        await deleteDoc(doc(db, "registeredUsers", userId));
        alert("User deleted.");
    }
};

async function renderAdminMaterialsList() {
    const list = document.getElementById("adminMaterialList");
    try {
        const snap = await getDocs(materialsCol);
        if (snap.empty) {
            list.innerHTML = "<li>No materials found.</li>";
            return;
        }

        let html = "";
        snap.forEach(docSnap => {
            const m = docSnap.data();
            html += `
                <li style="display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #e2e8f0;">
                    <span><b>[${m.course ? m.course.toUpperCase() : ''}]</b> ${m.title} (${m.type})</span>
                    <button onclick="deleteMaterial('${docSnap.id}')" style="background:#e11d48; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                </li>`;
        });
        list.innerHTML = html;
    } catch (error) {
        list.innerHTML = "<li>Failed to load materials.</li>";
    }
}

window.deleteMaterial = async function (materialId) {
    if (confirm("Delete this material?")) {
        await deleteDoc(doc(db, "materialsData", materialId));
        alert("Material deleted.");
    }
};

// Activity Log in Firestore
async function addActivityLog(text) {
    try {
        await addDoc(historyCol, { text, timestamp: serverTimestamp() });
    } catch (e) {
        console.error(e);
    }
}

window.logDownload = function (title) {
    addActivityLog(`${currentUser ? currentUser.name : 'User'} opened PDF: ${title}`);
};

function renderHistoryList(snapshot) {
    const historyList = document.getElementById("historyList");
    const countText = document.getElementById("downloadCount");

    if (snapshot.empty) {
        historyList.innerHTML = `<li class="empty-msg">No activity yet.</li>`;
        countText.textContent = "0";
        return;
    }

    countText.textContent = snapshot.size;
    let html = "";
    snapshot.forEach(docSnap => {
        const item = docSnap.data();
        html += `<li style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;"><i class="fa-solid fa-angle-right"></i> ${item.text}</li>`;
    });
    historyList.innerHTML = html;
}

async function clearHistory() {
    if (confirm("Clear all activity logs?")) {
        const snap = await getDocs(historyCol);
        snap.forEach(async (docSnap) => {
            await deleteDoc(doc(db, "activityHistory", docSnap.id));
        });
    }
                     }
        
