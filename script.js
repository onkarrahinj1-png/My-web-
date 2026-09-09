let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let currentCourseKey = "";

document.addEventListener("DOMContentLoaded", function () {
    initAuthTabs();
    checkAuthStatus();
    loadHistory();

    document.getElementById("userLoginForm").addEventListener("submit", handleUserLogin);
    document.getElementById("userSignupForm").addEventListener("submit", handleUserSignup);
    document.getElementById("adminLoginForm").addEventListener("submit", handleAdminLogin);
    document.getElementById("addMaterialForm").addEventListener("submit", handleAddMaterial);
    document.getElementById("userShareForm").addEventListener("submit", handleUserShareMaterial);
    document.getElementById("clearHistoryBtn").addEventListener("click", clearHistory);
});

function initAuthTabs() {
    const showLoginBtn = document.getElementById("showLoginBtn");
    const showSignupBtn = document.getElementById("showSignupBtn");
    const showAdminBtn = document.getElementById("showAdminBtn");

    const userLoginForm = document.getElementById("userLoginForm");
    const userSignupForm = document.getElementById("userSignupForm");
    const adminLoginForm = document.getElementById("adminLoginForm");

    if (showLoginBtn && showSignupBtn && showAdminBtn) {
        showLoginBtn.onclick = function () {
            setActiveTab(showLoginBtn);
            showForm(userLoginForm);
        };

        showSignupBtn.onclick = function () {
            setActiveTab(showSignupBtn);
            showForm(userSignupForm);
        };

        showAdminBtn.onclick = function () {
            setActiveTab(showAdminBtn);
            showForm(adminLoginForm);
        };
    }

    function setActiveTab(btn) {
        [showLoginBtn, showSignupBtn, showAdminBtn].forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    }

    function showForm(form) {
        [userLoginForm, userSignupForm, adminLoginForm].forEach(f => f.classList.add("hidden"));
        form.classList.remove("hidden");
    }
}

function handleUserLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const users = JSON.parse(localStorage.getItem("registeredUsers")) || [];

    const user = users.find(u => u.email === email);
    if (user) {
        currentUser = { name: user.name, email: user.email, role: "user" };
    } else {
        currentUser = { name: email.split('@')[0], email: email, role: "user" };
    }
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    checkAuthStatus();
}

function handleUserSignup(e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    let users = JSON.parse(localStorage.getItem("registeredUsers")) || [];
    users.push({ name, email, password });
    localStorage.setItem("registeredUsers", JSON.stringify(users));

    currentUser = { name, email, role: "user" };
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    alert("Registration Successful!");
    checkAuthStatus();
}

function handleAdminLogin(e) {
    e.preventDefault();
    const secretKey = document.getElementById("adminSecretKey").value.trim();

    if (secretKey === "admin123") {
        currentUser = { name: "System Admin", role: "admin" };
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        checkAuthStatus();
    } else {
        alert("Invalid Admin Secret Key! Use 'admin123' for demo.");
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

function renderAdminMaterialsList() {
    const materials = JSON.parse(localStorage.getItem("materialsData")) || [];
    const list = document.getElementById("adminMaterialList");
    list.innerHTML = "";

    if(materials.length === 0) {
        list.innerHTML = "<li style='color:gray;'>No materials added yet.</li>";
        return;
    }

    materials.forEach(item => {
        const li = document.createElement("li");
        li.style.margin = "8px 0";
        li.innerHTML = `
            <span><b>[${item.course.toUpperCase()}]</b> ${item.title} (<i>${item.type}</i>)</span>
        `;
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
