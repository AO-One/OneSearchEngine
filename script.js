/* ONE-OS HYBRID SEARCH ENGINE - MASTER LOGIC
   Features: Local Ads, HostGPT AI, Web Search, YouTube Integration & Multi-Device SafeSearch
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

    // Load SafeSearch preference from "Memory" (LocalStorage)
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
    const query = input?.value.trim();
    const isSafeEnabled = document.getElementById('safe-search-toggle')?.checked;
    
    if (!query) return;

    // Save SafeSearch setting
    localStorage.setItem('oneOS_SafeSearch', isSafeEnabled);

    // A. Save to History
    saveToHistory(query);

    // B. LOCAL BUSINESS SEARCH (Filtering for Safety if enabled)
    let localResults = businessIndex.filter(biz => 
        biz.name.toLowerCase().includes(query.toLowerCase()) || 
        (biz.keywords && biz.keywords.some(k => k.toLowerCase().includes(query.toLowerCase())))
    );

    if (isSafeEnabled) {
        localResults = localResults.filter(biz => biz.safe === true);
    }
    displayLocalResults(localResults);

    // C. EXTERNAL WEB & YOUTUBE SEARCH
    fetchSearchResults(query);

    // D. AI INSIGHTS (HostGPT Integration)
    const aiDisplay = document.getElementById('ai-response-box');
    if (aiDisplay) {
        aiDisplay.style.display = 'block';
        aiDisplay.innerHTML = isSafeEnabled ? "<em>Jarvis is consulting HostGPT (SafeMode Active)...</em>" : "<em>Jarvis is consulting HostGPT...</em>";
        
        let aiPrompt = query;
        if (isSafeEnabled) aiPrompt = `(Kid-friendly/Safe) ${query}`;

        const aiAnswer = await getHostGPTResponse(aiPrompt);
        aiDisplay.innerHTML = `<strong>OneAnswer:</strong> ${aiAnswer}`;
    }
}

// 4. EXTERNAL WEB & YOUTUBE SEARCH ENGINE
async function fetchSearchResults(query) {
    const resultsContainer = document.getElementById('onesearch-results');
    const isSafeEnabled = document.getElementById('safe-search-toggle')?.checked;
    
    if (!resultsContainer) return;

    // Clear previous results & show loading state
    resultsContainer.innerHTML = "<p style='color:#888;'>Searching global web and video index...</p>";

    try {
        // Option A: Video / YouTube Intent
        if (query.toLowerCase().includes("youtube") || query.toLowerCase().includes("video") || query.toLowerCase().includes("song")) {
            await renderYouTubeResults(query, resultsContainer);
        } else {
            // Option B: Global Web Search across all sites
            await renderGeneralWebResults(query, resultsContainer, isSafeEnabled);
        }
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color:red;">Error fetching live web results: ${error.message}</p>`;
    }
}

// Render YouTube Results
async function renderYouTubeResults(query, container) {
    const cleanQuery = encodeURIComponent(query.replace(/youtube/gi, '').trim() || query);
    const apiUrl = `https://vid.puffyan.us/api/v1/search?q=${cleanQuery}&type=video`;

    try {
        const res = await fetch(apiUrl);
        const videos = await res.json();

        if (!videos || videos.length === 0) {
            container.innerHTML = "<p>No YouTube videos found.</p>";
            return;
        }

        let html = "<h3 style='margin-bottom:12px;'>YouTube Video Results</h3><div class='video-grid' style='display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;'>";
        
        videos.slice(0, 6).forEach(video => {
            html += `
                <div class="video-card" style="border: 1px solid #333; padding: 10px; border-radius: 8px; background: #1e1e1e;">
                    <a href="https://www.youtube.com/watch?v=${video.videoId}" target="_blank" style="text-decoration:none; color:white;">
                        <img src="${video.videoThumbnails ? video.videoThumbnails[0].url : ''}" style="width:100%; border-radius:6px; aspect-ratio: 16/9; object-fit: cover;" alt="${video.title}" />
                        <h4 style="margin: 8px 0 4px 0; font-size:14px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${video.title}</h4>
                        <span style="font-size:12px; color:#aaa;">${video.author}</span>
                    </a>
                </div>
            `;
        });
        html += "</div>";
        container.innerHTML = html;

    } catch (err) {
        // Fallback UI
        container.innerHTML = `
            <div style="padding:15px; background:#1e1e1e; border-radius:8px; border:1px solid #333; margin-top:10px;">
                <p><strong>YouTube Search Gateway:</strong></p>
                <a href="https://www.youtube.com/results?search_query=${cleanQuery}" target="_blank" style="color:#4EC9B0; font-size:16px;">
                    ▶ View results for "${query}" on YouTube
                </a>
            </div>
        `;
    }
}

// Global Web Search Renderer (SearXNG Metasearch with SafeSearch)
async function renderGeneralWebResults(query, container, isSafeEnabled) {
    const cleanQuery = encodeURIComponent(query);
    const safeParam = isSafeEnabled ? 2 : 0;
    const searxUrl = `https://searx.be/search?q=${cleanQuery}&format=json&safe_search=${safeParam}`;

    try {
        const response = await fetch(searxUrl);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            container.innerHTML = "<p>No safe web results found matching your query.</p>";
            return;
        }

        let html = `<h3 style="margin-bottom:12px;">Web Results ${isSafeEnabled ? '<span style="font-size:12px; color:#4EC9B0;">[SafeSearch Active]</span>' : ''}</h3>`;
        
        data.results.slice(0, 8).forEach(item => {
            html += `
                <div class="result-card" style="margin-bottom:15px; padding:12px; background:#1e1e1e; border-radius:8px; border:1px solid #333;">
                    <a href="${item.url}" target="_blank" style="color:#4EC9B0; font-size:16px; font-weight:bold; text-decoration:none;">
                        ${item.title}
                    </a>
                    <div style="color:#888; font-size:12px; margin: 4px 0;">${item.url}</div>
                    <p style="color:#ccc; font-size:13px; margin:0;">${item.content || 'No description available.'}</p>
                </div>
            `;
        });

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = `
            <div class="result-card" style="padding:15px; background:#1e1e1e; border-radius:8px; border:1px solid #333;">
                <h4 style="margin:0 0 8px 0;">Global Search Gateway</h4>
                <p style="color:#ccc; font-size:13px;">SafeSearch is currently forcing filtered results for: <strong>${query}</strong></p>
                <a href="https://duckduckgo.com/?q=${cleanQuery}&kp=${isSafeEnabled ? '1' : '-1'}" target="_blank" style="color:#4EC9B0; text-decoration:none;">
                    ▶ View Safe Web Results on DuckDuckGo
                </a>
            </div>
        `;
    }
}

// 5. UI DISPLAY FUNCTIONS
function displayLocalResults(results) {
    const container = document.getElementById('local-results-container');
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = "<p style='color:#888;'>No local business records match this query.</p>";
        return;
    }

    container.innerHTML = results.map(biz => `
        <div class="result-card">
            <h3>${biz.name}</h3>
            <span class="category-tag">${biz.category}</span>
            <a href="${biz.link}" class="btn-primary" target="_blank">View Website</a>
        </div>
    `).join('');
}

// 6. MEMORY & HISTORY SLL
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
    const input = document.getElementById('search-input');
    if (input) input.value = item;
    performOneSearch();
}

function clearHistory() {
    localStorage.removeItem('oneSearchHistory');
    displayHistory();
}

// 7. HOSTGPT API CALL
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
        return "HostGPT is currently processing. Displaying local and external data.";
    }
}
