// Global variables
const STORAGE_KEY = 'wingFestivalCandidates';
let candidates = [];

// DOM Elements
const form = document.getElementById('registrationForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const candidatesList = document.getElementById('candidatesList');
const statisticsGrid = document.getElementById('statisticsGrid');
const filterWingType = document.getElementById('filterWingType');
const filterMusicStyle = document.getElementById('filterMusicStyle');
const filterStatus = document.getElementById('filterStatus');

document.addEventListener('DOMContentLoaded', function() {
    loadItems();
    setupEventListeners();
});

function setupEventListeners() {
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    if (filterWingType) {
        filterWingType.addEventListener('change', renderItems);
    }
    if (filterMusicStyle) {
        filterMusicStyle.addEventListener('change', renderItems);
    }
    if (filterStatus) {
        filterStatus.addEventListener('change', renderItems);
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    hideMessages();
    
    const firstName = document.getElementById('firstName').value.trim();
    const stageName = document.getElementById('stageName').value.trim();
    const email = document.getElementById('email').value.trim();
    const wingType = document.getElementById('wingType').value;
    const musicStyle = document.getElementById('musicStyle').value;
    const selectedSong = document.getElementById('selectedSong').value.trim();
    const experience = document.getElementById('experience').value || 0;
    const voiceChecked = document.getElementById('voiceChecked').checked;
    
    const candidate = {
        id: Date.now().toString(),
        firstName: firstName,
        stageName: stageName,
        email: email,
        wingType: wingType,
        musicStyle: musicStyle,
        selectedSong: selectedSong,
        experience: parseInt(experience),
        voiceChecked: voiceChecked,
        status: 'pending',
        registrationDate: new Date().toLocaleDateString('he-IL')
    };

    if (validateForm(candidate)) {
        saveItem(candidate);
        showSuccessMessage('The Form have been Succsefully sent to the system, The candidate have been added');
        form.reset();
    }
}

function validateForm(candidate) {
    const errors = [];

    if (!candidate.firstName) {
        errors.push('First Name is Required');
    }

    if (!candidate.stageName) {
        errors.push('Stage Name is Required');
    }

    if (!candidate.email) {
        errors.push('Email is Required');     
    }

    if (!candidate.wingType) {
        errors.push('You must Choose Wings Type');
    }

    if (!candidate.musicStyle) {
        errors.push('You must choose Music Style');
    }

    if (!candidate.selectedSong) {
        errors.push('You must choose a Song for the Contest');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (candidate.email && !emailPattern.test(candidate.email)) {
        errors.push('Unvalied Email Adress please try Again');
    }

    if (emailExists(candidate.email, candidate.id)) {
        errors.push('This Email is Already at the System!');
    }

    if (candidate.experience < 0 || candidate.experience > 50) {
        errors.push('The Experience have to be between 0-50 Years');
    }

    if (candidate.experience > 3 && !candidate.voiceChecked) {
        errors.push('Candidate that have less then 3 Years of experience have to Be Chacked By the Voltuer');
    }

    if (errors.length > 0) {
        showErrorMessage(errors.join('<br>'));
        return false;
    }

    return true;
}

function emailExists(email, currentId) {
    for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].email === email && candidates[i].id !== currentId) {
            return true;
        }
    }
    return false;
}

function saveItem(candidate) {
    candidates.push(candidate);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
    renderItems();
}

function loadItems() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        candidates = JSON.parse(stored);
    } else {
        candidates = [];
    }
    renderItems();
}


function deleteItem(id) {
    if (confirm('You wish to Delete this Candidate?')) {
        candidates = candidates.filter(function(candidate) {
            return candidate.id !== id;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
        renderItems();
    }
}

function updateCandidateStatus(id, newStatus) {
    for (let i = 0; i < candidates.length; i++) {
        if (candidates[i].id === id) {
            candidates[i].status = newStatus;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
            renderItems();
            break;
        }
    }
}

function renderItems() {
    const filtered = getFilteredCandidates();
    
    if (filtered.length === 0) {
        candidatesList.innerHTML = '<div class="no-candidates">There is no Candidate to Show!</div>';
    } else {
        candidatesList.innerHTML = '';
        for (let i = 0; i < filtered.length; i++) {
            const candidateCard = createCandidateCard(filtered[i]);
            candidatesList.innerHTML += candidateCard;
        }
    }
    
    updateStatistics();
}

function getFilteredCandidates() {
    const wingTypeFilter = filterWingType ? filterWingType.value : '';
    const musicStyleFilter = filterMusicStyle ? filterMusicStyle.value : '';
    const statusFilter = filterStatus ? filterStatus.value : '';
    
    const filtered = [];
    
    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        
        const wingTypeMatch = !wingTypeFilter || candidate.wingType === wingTypeFilter;
        const musicStyleMatch = !musicStyleFilter || candidate.musicStyle === musicStyleFilter;
        const statusMatch = !statusFilter || candidate.status === statusFilter;
        
        if (wingTypeMatch && musicStyleMatch && statusMatch) {
            filtered.push(candidate);
        }
    }
    
    return filtered;
}


function createCandidateCard(candidate) {
    const wingTypeText = getWingTypeText(candidate.wingType);
    const musicStyleText = getMusicStyleText(candidate.musicStyle);
    const statusText = getStatusText(candidate.status);

    return `
        <div class="candidate-card ${candidate.status}">
            <div class="candidate-header">
                <div class="candidate-name">${candidate.stageName}</div>
                <span class="wing-badge ${candidate.wingType}">${wingTypeText}</span>
            </div>
            
            <div class="candidate-details">
                <div class="detail-item">
                    <span class="detail-label">First Name:</span> ${candidate.firstName}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email Adress:</span> ${candidate.email}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Music Style:</span> ${musicStyleText}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Selected Song:</span> ${candidate.selectedSong}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Experience(in Years):</span> ${candidate.experience} Years
                </div>
                <div class="detail-item">
                    <span class="detail-label">Voice Check:</span> ${candidate.voiceChecked ? 'Yes' : 'No'}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span> ${statusText}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Registrition Date:</span> ${candidate.registrationDate}
                </div>
            </div>
            
            <div class="candidate-actions">
                <button class="action-btn pass-btn" onclick="updateCandidateStatus('${candidate.id}', 'passed')">
                    Pass the Audition
                </button>
                <button class="action-btn fail-btn" onclick="updateCandidateStatus('${candidate.id}', 'failed')">
                    Failed at the Audition
                </button>
                <button class="action-btn delete-btn" onclick="deleteItem('${candidate.id}')">
                    Delete Candidate 
                </button>
            </div>
        </div>
    `;
}

function getWingTypeText(wingType) {
    switch(wingType) {
        case 'feathers': return 'Feathers';
        case 'leather': return 'Leather';
        case 'light': return 'Light';
        default: return wingType;
    }
}

function getMusicStyleText(musicStyle) {
    switch(musicStyle) {
        case 'pop': return 'Pop';
        case 'rock': return 'Rock';
        case 'classical': return 'Clasic';
        case 'folk': return 'Folk';
        case 'jazz': return 'Jaxx';
        case 'electronic': return 'Electronic';
        default: return musicStyle;
    }
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Pending for Audition';
        case 'passed': return 'Passed the Audition';
        case 'failed': return 'Failed at the Audition';
        default: return status;
    }
}

function updateStatistics() {
    if (!statisticsGrid) return;
    
    const stats = calculateStatistics();
    statisticsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${stats.total}</div>
            <div class="stat-label">Count of Candatites</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.passed}</div>
            <div class="stat-label">Pass the Audition</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.failed}</div>
            <div class="stat-label">Failed at the Audition</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.pending}</div>
            <div class="stat-label">Pedning</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.passRate}% </div>
            <div class="stat-label">Succses Rate(%)</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.avgExperience} </div>
            <div class="stat-label">Average Experience</div>
        </div>
    `;
}

function calculateStatistics() {
    const total = candidates.length;
    let passed = 0;
    let failed = 0;
    let pending = 0;
    let totalExperience = 0;

    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        
        if (candidate.status === 'passed') {
            passed++;
        } else if (candidate.status === 'failed') {
            failed++;
        } else {
            pending++;
        }
        
        totalExperience += candidate.experience;
    }

    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const avgExperience = total > 0 ? Math.round(totalExperience / total) : 0;

    return {
        total: total,
        passed: passed,
        failed: failed,
        pending: pending,
        passRate: passRate,
        avgExperience: avgExperience
    };
}

function showErrorMessage(message) {
    errorMessage.innerHTML = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function showSuccessMessage(message) {
    successMessage.innerHTML = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}