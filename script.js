import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Config Keys
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

const uploadForm = document.getElementById("uploadForm");
const materialsList = document.getElementById("materialsList");

// Load Materials from Firestore
async function loadMaterials() {
    materialsList.innerHTML = "<p>Loading materials...</p>";
    try {
        const q = query(collection(db, "materials"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        
        materialsList.innerHTML = "";
        
        if (querySnapshot.empty) {
            materialsList.innerHTML = "<p>No study materials uploaded yet.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <h3>${data.title}</h3>
                <p><strong>Subject:</strong> ${data.subject}</p>
                <a href="${data.link}" target="_blank" rel="noopener noreferrer">
                    <button>View / Download</button>
                </a>
            `;
            materialsList.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading data: ", error);
        materialsList.innerHTML = "<p>Failed to load materials.</p>";
    }
}

// Save Material to Firestore
uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const subject = document.getElementById("subject").value;
    const link = document.getElementById("link").value;

    try {
        await addDoc(collection(db, "materials"), {
            title: title,
            subject: subject,
            link: link,
            timestamp: new Date()
        });

        alert("Material uploaded successfully!");
        uploadForm.reset();
        loadMaterials();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Upload failed: " + error.message);
    }
});

// Initial Load
loadMaterials();
