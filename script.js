/* ONE-OS HYBRID SEARCH ENGINE - MASTER LOGIC
   Features: Local Ads, HostGPT AI, Web Search, & Multi-Device SafeSearch
*/

// 1. LOCAL BUSINESS DATABASE (Adpagespace Index)
const businessIndex = [
    { name: "ITGuru", category: "IT", link: "it-guru-backpage.html", keywords: ["web", "repair", "server", "architecture"], safe: true },
    { name: "Edenbridge Cafe", category: "Food", link: "cafe-backpage.html", keywords: ["coffee", "food", "kent"], safe: true },
    { name: "Code Central", category: "Education", link: "code-central.html", keywords: ["coding", "python", "javascript"], safe: true },
    { name: "King's College Hospital", category: "Health", link: "https://www.kch.nhs.uk/", keywords: ["hospital", "doctor", "emergency"], safe: true },
    { name: "YouTube", category: "Videos", link: "https://www.youtube.com/", keywords: ["music", "adverts", "films"], safe: true },
];

// 2. INITIALIZATION & LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const safeToggle = document.getElementById('safe-search-toggle');

    // Load SafeSearch preference from "Memory SLL" (LocalStorage)
    if (safeToggle) {
        const isSafe = localStorage.getItem('oneOS_SafeSearch') === 'true';
        safeToggle.checked = isSafe;
    }

    if (searchBtn) searchBtn.addEventListener('click', performOneSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performOneSearch();
        });
    }

    displayHistory();
});

// 3. THE UNIFIED SEARCH ENGINE (The Brain)
async function performOneSearch() {
    const input = document.getElementById('search-input');
    const query = input.value.trim();
    const isSafeEnabled = document.getElementById('safe-search-toggle')?.checked;
    
    if (!query) return;

    // Save SafeSearch setting to "Memory" so other devices/pages can see it
    localStorage.setItem('oneOS_SafeSearch', isSafeEnabled);

    // A. Save to History
    saveToHistory(query);

    // B. LOCAL BUSINESS SEARCH (Filtering for Safety if enabled)
    let localResults = businessIndex.filter(biz => 
        biz.name.toLowerCase().includes(query.toLowerCase()) || 
        biz.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
    );

    if (isSafeEnabled) {
        localResults = localResults.filter(biz => biz.safe === true);
    }
    displayLocalResults(localResults);

    // C. EXTERNAL WEB SEARCH (DuckDuckGo with SafeSearch flag)
    const safeParam = isSafeEnabled ? "&kp=1" : "&kp=-1"; // DuckDuckGo safe search params
    // window.open removed so users stay on our architected platform
    console.log("Internal search performed for: " + query);

    // D. AI INSIGHTS (HostGPT Integration)
    const aiDisplay = document.getElementById('ai-response-box');
    if (aiDisplay) {
        aiDisplay.innerHTML = isSafeEnabled ? "<em>Jarvis is consulting HostGPT (SafeMode Active)...</em>" : "<em>Jarvis is consulting HostGPT...</em>";
        
        let aiPrompt = query;
        if (isSafeEnabled) aiPrompt = `(Kid-friendly/Safe) ${query}`;

        const aiAnswer = await getHostGPTResponse(aiPrompt);
        aiDisplay.innerHTML = `<strong>OneAnswer:</strong> ${aiAnswer}`;
    }
}

// 4. UI DISPLAY FUNCTIONS
function displayLocalResults(results) {
    const container = document.getElementById('local-results-container');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = "<p>No local businesses found for this query.</p>";
        return;
    }

    container.innerHTML = results.map(biz => `
        <div class="result-card">
            <h3>${biz.name}</h3>
            <span class="category-tag">${biz.category}</span>
            <a href="${biz.link}" class="btn-primary">View Website</a>
        </div>
    `).join('');
}

// 5. MEMORY & HISTORY SLL
function saveToHistory(query) {
    let history = JSON.parse(localStorage.getItem('oneSearchHistory')) || [];
    history = history.filter(item => item !== query);
    history.unshift(query);
    if (history.length > 10) history.pop();
    localStorage.setItem('oneSearchHistory', JSON.stringify(history));
    displayHistory();
}

function displayHistory() {
    const list = document.getElementById('history-list');
    if (!list) return;
    const history = JSON.parse(localStorage.getItem('oneSearchHistory')) || [];
    list.innerHTML = history.map(item => `<li onclick="autoFillSearch('${item}')">${item}</li>`).join('');
}

function autoFillSearch(item) {
    document.getElementById('search-input').value = item;
    performOneSearch();
}

// 6. HOSTGPT API CALL
async function getHostGPTResponse(promptText) {
    const HOSTGPT_API_KEY = "YOUR_HOSTGPT_KEY_HERE";
    const API_URL = "https://api.hostgpt.ai/v1/chat"; 

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${HOSTGPT_API_KEY}`
            },
            body: JSON.stringify({
                prompt: promptText,
                model: "gpt-4" 
            })
        });
        const data = await response.json();
        return data.choices[0].message.content || data.choices[0].text;
    } catch (e) {
        return "HostGPT is currently processing. Displaying local data only.";
    }
}