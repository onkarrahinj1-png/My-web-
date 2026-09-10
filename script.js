let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let currentCourseKey = "";

document.addEventListener("DOMContentLoaded", function () {
    initAuthNavigation();
    checkAuthStatus();
    loadHistory();

    document.getElementById("userLoginForm").addEventListener("submit", handleUserLogin);
    document.getElementById("userSignupForm").addEventListener("submit", handleUserSignup);
    document.getElementById("adminLoginForm").addEventListener("submit", handleAdminLogin);
    document.getElementById("addMaterialForm").addEventListener("submit", handleAddMaterial);
    document.getElementById("userShareForm").addEventListener("submit", handleUserShareMaterial);
    document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);
});

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
        authTabsHeader.style.display = "none"; // Hide tabs header to treat registration as a separate page
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

// Handles Login using Registered Name
function handleUserLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = { name: user.name, email: user.email, role: "user" };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        checkAuthStatus();
    } else {
        alert("Account not found or invalid password! Please register first.");
        document.getElementById("goToSignupLink").click();
    }
}

// User Registration Handler
function handleUserSignup(e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        alert("This email is already registered! Please Login.");
        document.getElementById("goToLoginLink").click();
        return;
    }

    users.push({ id: Date.now(), name, email, password });
    localStorage.setItem("registeredUsers", JSON.stringify(users));

    alert("Registration Successful! Redirecting to Login...");
    
    document.getElementById("userSignupForm").reset();
    document.getElementById("goToLoginLink").click();
}

function handleAdminLogin(e) {
    e.preventDefault();
    const secretKey = document.getElementById("adminSecretKey").value.trim();

    if (secretKey === "admin123") {
        currentUser = { name: "System Admin", role: "admin" };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        checkAuthStatus();
    } else {
        alert("Invalid Secret Key! Use 'admin123'");
    }
}

function logout() {
    localStorage.removeItem("currentUser");
    currentUser = null;
    checkAuthStatus();
    showHome();
}

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

function openCourse(courseKey) {
    currentCourseKey = courseKey;
    hideAllViews();
    document.getElementById("courseDetailView").classList.remove("hidden");

    const courseNames = { fy: "FY BCom CA", sy: "SY BCom CA", ty: "TY BCom CA" };
    document.getElementById("selectedCourseTitle").textContent = `${courseNames[courseKey]} Study Materials`;

    renderCourseMaterials(courseKey);
}

function showHome() {
    hideAllViews();
    document.getElementById("courseSelectionView").classList.remove("hidden");
}

function openUserUploadPanel() {
    hideAllViews();
    document.getElementById("userUploadView").classList.remove("hidden");
}

function openAdminPanel() {
    hideAllViews();
    document.getElementById("adminPanelView").classList.remove("hidden");
    renderAdminRegisteredUsers();
    renderAdminMaterialsList();
}

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

function renderCourseMaterials(courseKey) {
    const materials = JSON.parse(localStorage.getItem("materialsData")) || [];
    const courseMaterials = materials.filter(m => m.course === courseKey);
    const grid = document.getElementById("materialsGrid");
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
                            <i class="fa-solid fa-file-pdf" style="color: #ef4444;"></i>
                            <span>${item.title}</span>
                        </div>
                        <span class="shared-tag"><i class="fa-solid fa-user"></i> Uploaded by: ${item.uploadedBy || 'User'}</span>
                    </div>
                    <div class="pdf-frame-container">
                        <iframe src="${embedUrl}" allow="autoplay"></iframe>
                    </div>
                `;
                pdfListContainer.appendChild(pdfCard);
            });

            grid.appendChild(pdfListContainer);
        }
    });
}

function handleUserShareMaterial(e) {
    e.preventDefault();
    const course = document.getElementById("userMatCourse").value;
    const type = document.getElementById("userMatType").value;
    const title = document.getElementById("userMatTitle").value.trim();
    const rawUrl = document.getElementById("userMatUrl").value.trim();

    const materials = JSON.parse(localStorage.getItem("materialsData")) || [];
    const newMaterial = {
        id: Date.now(),
        course,
        type,
        title,
        url: rawUrl,
        uploadedBy: currentUser ? currentUser.name : "Student"
    };

    materials.push(newMaterial);
    localStorage.setItem("materialsData", JSON.stringify(materials));

    logActivity(`Uploaded PDF: ${title} (${course.toUpperCase()})`);

    alert("PDF Uploaded Successfully!");
    document.getElementById("userShareForm").reset();
    openCourse(course);
}

function handleAddMaterial(e) {
    e.preventDefault();
    const course = document.getElementById("matCourse").value;
    const type = document.getElementById("matType").value;
    const title = document.getElementById("matTitle").value.trim();
    const rawUrl = document.getElementById("matUrl").value.trim();

    const materials = JSON.parse(localStorage.getItem("materialsData")) || [];
    const newMaterial = {
        id: Date.now(),
        course,
        type,
        title,
        url: rawUrl,
        uploadedBy: "Admin"
    };

    materials.push(newMaterial);
    localStorage.setItem("materialsData", JSON.stringify(materials));

    logActivity(`Admin Uploaded: ${title}`);

    alert("Material Added Successfully!");
    document.getElementById("addMaterialForm").reset();
    renderAdminMaterialsList();
}

// ADMIN FUNCTION 1: Render and Delete Registered Users
function renderAdminRegisteredUsers() {
    const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
    const container = document.getElementById("adminUsersContainer");
    container.innerHTML = "";

    if (users.length === 0) {
        container.innerHTML = "<p style='color:gray;'>No users registered yet.</p>";
        return;
    }

    const table = document.createElement("table");
    table.className = "admin-users-table";
    table.innerHTML = `
        <thead>
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

    const tbody = table.querySelector("tbody");

    users.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><b>${user.name}</b></td>
            <td>${user.email}</td>
            <td>
                <button class="delete-user-btn" onclick="deleteUser('${user.email}')">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    container.appendChild(table);
}

// ADMIN FUNCTION: Delete Registered User
function deleteUser(email) {
    if (confirm(`Are you sure you want to delete the user with email: ${email}?`)) {
        let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
        users = users.filter(u => u.email !== email);
        localStorage.setItem("registeredUsers", JSON.stringify(users));

        logActivity(`Deleted User: ${email}`);
        renderAdminRegisteredUsers();
    }
}

function renderAdminMaterialsList() {
    const materials = JSON.parse(localStorage.getItem("materialsData")) || [];
    const list = document.getElementById("adminMaterialList");
    list.innerHTML = "";

    if (materials.length === 0) {
        list.innerHTML = "<li style='color:gray;'>No materials added yet.</li>";
        return;
    }

    materials.forEach(item => {
        const li = document.createElement("li");
        li.style.margin = "8px 0";
        li.innerHTML = `<span><b>[${item.course.toUpperCase()}]</b> ${item.title} (<i>${item.type}</i>)</span>`;
        list.appendChild(li);
    });
}

function logActivity(title) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let history = JSON.parse(localStorage.getItem("activityHistory")) || [];
    history.unshift({ name: title, time: time });
    localStorage.setItem("activityHistory", JSON.stringify(history));
    loadHistory();
}

function loadHistory() {
    const historyList = document.getElementById("historyList");
    const downloadCount = document.getElementById("downloadCount");
    const history = JSON.parse(localStorage.getItem("activityHistory")) || [];

    historyList.innerHTML = "";
    if (history.length === 0) {
        historyList.innerHTML = '<li class="empty-msg">No activity yet.</li>';
        downloadCount.textContent = "0";
        return;
    }

    downloadCount.textContent = history.length;
    history.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fa-solid fa-file-pdf"></i> ${item.name} <br><small style="color:gray">${item.time}</small>`;
        historyList.appendChild(li);
    });
}

function clearHistory() {
    localStorage.removeItem("activityHistory");
    loadHistory();
}
