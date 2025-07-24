const STORAGE_KEY = 'wingFestivalCandidates';
let candidates = [];

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (document.getElementById('candidatesList')) {
        loadItems();
        setupFilters();
        setupModal();
    }
});

function isOnlyLetters(text) {
    return /^[a-zA-Zא-ת\s]+$/.test(text);
}

function handleSubmit(e) {
    e.preventDefault();
    hideMessages();
    
    const candidate = {
        id: Date.now().toString(),
        firstName: getValue('firstName'),
        stageName: getValue('stageName'),
        email: getValue('email'),
        wingType: getValue('wingType'),
        musicStyle: getValue('musicStyle'),
        selectedSong: getValue('selectedSong'),
        experience: parseInt(getValue('experience')) || 0,
        voiceChecked: document.getElementById('voiceChecked').checked,
        status: 'pending',
        registrationDate: new Date().toLocaleDateString('he-IL')
    };

    if (validateCandidate(candidate)) {
        saveCandidate(candidate);
        showMessage('success', 'ההרשמה הושלמה בהצלחה!');
        document.getElementById('registrationForm').reset();
    }
}

function validateCandidate(candidate) {
    const errors = [];
    
    if (!candidate.firstName) {
        errors.push('שם פרטי חובה');
    } else if (!isOnlyLetters(candidate.firstName)) {
        errors.push('שם פרטי יכול להכיל רק אותיות');
    }
    
    if (!candidate.stageName) {
        errors.push('שם במה חובה');
    } else if (!isOnlyLetters(candidate.stageName)) {
        errors.push('שם במה יכול להכיל רק אותיות');
    }
    
    if (!candidate.email) {
        errors.push('אימייל חובה');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
        errors.push('אימייל לא תקין');
    }
    
    if (!candidate.wingType) {
        errors.push('בחירת סוג כנפיים חובה');
    }
    
    if (!candidate.musicStyle) {
        errors.push('בחירת סגנון מוזיקלי חובה');
    }
    
    if (!candidate.selectedSong) {
        errors.push('שיר נבחר חובה');
    }
    
    if (candidate.experience < 0 || candidate.experience > 50) {
        errors.push('ניסיון חייב להיות 0-50 שנים');
    }
    
    if (candidate.experience > 3 && !candidate.voiceChecked) {
        errors.push('מועמדים מנוסים חייבים בדיקת קול');
    }
    
    if (emailExists(candidate.email)) {
        errors.push('אימייל כבר קיים במערכת');
    }
    
    if (errors.length > 0) {
        showMessage('error', errors.join('<br>'));
        return false;
    }
    return true;
}

function loadItems() {
    candidates = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    renderCandidates();
    updateStats();
}

function saveCandidate(candidate) {
    candidates = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    candidates.push(candidate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
}

function saveAll() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
}

function deleteItem(id) {
    if (confirm('למחוק מועמד?')) {
        candidates = candidates.filter(c => c.id !== id);
        saveAll();
        renderCandidates();
        updateStats();
    }
}

function updateStatus(id, status) {
    const candidate = candidates.find(c => c.id === id);
    if (candidate) {
        candidate.status = status;
        saveAll();
        renderCandidates();
        updateStats();
    }
}

function renderCandidates() {
    const container = document.getElementById('candidatesList');
    const filtered = getFilteredCandidates();
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="no-candidates">אין מועמדים להצגה</div>';
        return;
    }
    
    container.innerHTML = filtered.map(candidate => `
        <div class="candidate-card ${candidate.status}">
            <div class="candidate-header">
                <div class="candidate-name">${candidate.stageName}</div>
                <div class="status-badges">
                    <span class="wing-badge ${candidate.wingType}">${getWingText(candidate.wingType)}</span>
                    <span class="status-badge status-${candidate.status}">${getStatusText(candidate.status)}</span>
                </div>
            </div>
            
            <div class="candidate-details">
                <div class="detail-item"><span class="detail-label">שם פרטי:</span> ${candidate.firstName}</div>
                <div class="detail-item"><span class="detail-label">אימייל:</span> ${candidate.email}</div>
                <div class="detail-item"><span class="detail-label">סגנון:</span> ${getMusicText(candidate.musicStyle)}</div>
                <div class="detail-item"><span class="detail-label">שיר:</span> ${candidate.selectedSong}</div>
                <div class="detail-item"><span class="detail-label">ניסיון:</span> ${candidate.experience} שנים</div>
                <div class="detail-item"><span class="detail-label">בדיקת קול:</span> ${candidate.voiceChecked ? 'כן' : 'לא'}</div>
                <div class="detail-item"><span class="detail-label">תאריך:</span> ${candidate.registrationDate}</div>
            </div>
            
            <div class="candidate-actions">
                <button class="action-btn pass-btn" onclick="updateStatus('${candidate.id}', 'passed')">עבר</button>
                <button class="action-btn fail-btn" onclick="updateStatus('${candidate.id}', 'failed')">נכשל</button>
                <button class="action-btn pending-btn" onclick="updateStatus('${candidate.id}', 'pending')">ממתין</button>
                <button class="action-btn edit-btn" onclick="openEdit('${candidate.id}')">עריכה</button>
                <button class="action-btn delete-btn" onclick="deleteItem('${candidate.id}')">מחק</button>
            </div>
        </div>
    `).join('');
}

function getFilteredCandidates() {
    const wingFilter = getValue('filterWingType');
    const musicFilter = getValue('filterMusicStyle');
    const statusFilter = getValue('filterStatus');
    
    return candidates.filter(c => 
        (!wingFilter || c.wingType === wingFilter) &&
        (!musicFilter || c.musicStyle === musicFilter) &&
        (!statusFilter || c.status === statusFilter)
    );
}

function updateStats() {
    const container = document.getElementById('statisticsGrid');
    if (!container) return;
    
    const total = candidates.length;
    const passed = candidates.filter(c => c.status === 'passed').length;
    const failed = candidates.filter(c => c.status === 'failed').length;
    const pending = candidates.filter(c => c.status === 'pending').length;
    const avgExp = total > 0 ? Math.round(candidates.reduce((sum, c) => sum + c.experience, 0) / total) : 0;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const voiceChecked = Math.round((candidates.filter(c => c.voiceChecked).length / total) * 100) || 0;
    const experienced = candidates.filter(c => c.experience >= 3).length;
    
    const wingCounts = {};
    const musicCounts = {};
    candidates.forEach(c => {
        wingCounts[c.wingType] = (wingCounts[c.wingType] || 0) + 1;
        musicCounts[c.musicStyle] = (musicCounts[c.musicStyle] || 0) + 1;
    });
    
    const topWing = Object.keys(wingCounts).reduce((a, b) => wingCounts[a] > wingCounts[b] ? a : b, 'אין');
    const topMusic = Object.keys(musicCounts).reduce((a, b) => musicCounts[a] > musicCounts[b] ? a : b, 'אין');
    
    container.innerHTML = `
        <div class="stat-card"><div class="stat-number">${total}</div><div class="stat-label">סה"כ מועמדים</div></div>
        <div class="stat-card"><div class="stat-number">${passed}</div><div class="stat-label">עברו אודישן</div></div>
        <div class="stat-card"><div class="stat-number">${failed}</div><div class="stat-label">נכשלו</div></div>
        <div class="stat-card"><div class="stat-number">${pending}</div><div class="stat-label">ממתינים</div></div>
        <div class="stat-card"><div class="stat-number">${passRate}%</div><div class="stat-label">אחוז הצלחה</div></div>
        <div class="stat-card"><div class="stat-number">${avgExp}</div><div class="stat-label">ממוצע ניסיון</div></div>
        <div class="stat-card"><div class="stat-number">${getWingText(topWing)}</div><div class="stat-label">סוג כנפיים פופולארי</div></div>
        <div class="stat-card"><div class="stat-number">${getMusicText(topMusic)}</div><div class="stat-label">סגנון פופולרי</div></div>
        <div class="stat-card"><div class="stat-number">${voiceChecked}%</div><div class="stat-label">עם בדיקת קול</div></div>
        <div class="stat-card"><div class="stat-number">${experienced}</div><div class="stat-label">מנוסים (3+ שנים)</div></div>
    `;
}

function setupModal() {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editForm');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelEdit');
    
    if (form) form.addEventListener('submit', handleEdit);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) closeModal();
    });
}

function openEdit(id) {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    
    document.getElementById('editId').value = candidate.id;
    document.getElementById('editFirstName').value = candidate.firstName;
    document.getElementById('editStageName').value = candidate.stageName;
    document.getElementById('editEmail').value = candidate.email;
    document.getElementById('editWingType').value = candidate.wingType;
    document.getElementById('editMusicStyle').value = candidate.musicStyle;
    document.getElementById('editSelectedSong').value = candidate.selectedSong;
    document.getElementById('editExperience').value = candidate.experience;
    document.getElementById('editVoiceChecked').checked = candidate.voiceChecked;
    
    document.getElementById('editModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editForm').reset();
}

function handleEdit(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) return;
    
    const changes = {
        firstName: getValue('editFirstName'),
        stageName: getValue('editStageName'),
        email: getValue('editEmail'),
        wingType: getValue('editWingType'),
        musicStyle: getValue('editMusicStyle'),
        selectedSong: getValue('editSelectedSong'),
        experience: parseInt(getValue('editExperience')) || 0,
        voiceChecked: document.getElementById('editVoiceChecked').checked
    };
    
    if (validateEdit(changes, id)) {
        Object.assign(candidate, changes);
        saveAll();
        renderCandidates();
        updateStats();
        closeModal();
    }
}

function validateEdit(changes, id) {
    if (!changes.firstName) {
        alert('שם פרטי חובה');
        return false;
    }
    
    if (!isOnlyLetters(changes.firstName)) {
        alert('שם פרטי יכול להכיל רק אותיות');
        return false;
    }
    
    if (!changes.stageName) {
        alert('שם במה חובה');
        return false;
    }
    
    if (!isOnlyLetters(changes.stageName)) {
        alert('שם במה יכול להכיל רק אותיות');
        return false;
    }
    
    if (!changes.email) {
        alert('אימייל חובה');
        return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.email)) {
        alert('אימייל לא תקין');
        return false;
    }
    
    if (!changes.wingType) {
        alert('בחירת סוג כנפיים חובה');
        return false;
    }
    
    if (!changes.musicStyle) {
        alert('בחירת סגנון מוזיקלי חובה');
        return false;
    }
    
    if (!changes.selectedSong) {
        alert('שיר נבחר חובה');
        return false;
    }
    
    if (changes.experience < 0 || changes.experience > 50) {
        alert('ניסיון 0-50 שנים');
        return false;
    }
    
    if (changes.experience > 3 && !changes.voiceChecked) {
        alert('מנוסים צריכים בדיקת קול');
        return false;
    }
    
    if (candidates.some(c => c.email === changes.email && c.id !== id)) {
        alert('אימייל כבר קיים');
        return false;
    }
    
    return true;
}

function setupFilters() {
    const filters = ['filterWingType', 'filterMusicStyle', 'filterStatus'];
    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.addEventListener('change', () => {
            renderCandidates();
            updateStats();
        });
    });
}

function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : '';
}

function showMessage(type, message) {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    hideMessages();
    
    if (type === 'error' && errorDiv) {
        errorDiv.innerHTML = message;
        errorDiv.style.display = 'block';
    } else if (type === 'success' && successDiv) {
        successDiv.innerHTML = message;
        successDiv.style.display = 'block';
    }
}

function hideMessages() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

function emailExists(email) {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    return existing.some(c => c.email === email);
}

function getWingText(type) {
    const types = { feathers: 'נוצות', leather: 'עור', light: 'אור' };
    return types[type] || type;
}

function getMusicText(style) {
    const styles = { pop: 'פופ', rock: 'רוק', classical: 'קלאסי', folk: 'פולק', jazz: 'ג\'אז', electronic: 'אלקטרוני' };
    return styles[style] || style;
}

function getStatusText(status) {
    const statuses = { pending: 'ממתין', passed: 'עבר', failed: 'נכשל' };
    return statuses[status] || status;
}

window.deleteItem = deleteItem;
window.updateStatus = updateStatus;
window.openEdit = openEdit;