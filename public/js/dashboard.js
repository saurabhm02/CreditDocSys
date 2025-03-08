document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  
  // Load dashboard data
  loadDashboardData();
  
  // Toggle sidebar on mobile
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      document.querySelector('.sidebar').classList.toggle('collapsed');
    });
  }
});

// Load dashboard data
async function loadDashboardData() {
  try {
    // Get user data
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      updateUserUI(userData);
    }
    
    // Load documents
    const documents = await api.getDocuments();
    updateDocumentsCount(documents.length);
    updateRecentDocuments(documents.slice(0, 5));
    
    // Load scan history
    const history = await api.getDocumentHistory();
    updateScansCount(history.length);
    updateRecentScans(history.slice(0, 5));
    
    // Calculate matches count
    let matchesCount = 0;
    history.forEach(scan => {
      if (scan.matchResults && scan.matchResults.length) {
        matchesCount += scan.matchResults.length;
      }
    });
    updateMatchesCount(matchesCount);
    
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showAlert('Error loading dashboard data', 'error');
  }
}

// Update documents count
function updateDocumentsCount(count) {
  const documentsCountEl = document.getElementById('documents-count');
  if (documentsCountEl) {
    documentsCountEl.textContent = count;
  }
}

// Update scans count
function updateScansCount(count) {
  const scansCountEl = document.getElementById('scans-count');
  if (scansCountEl) {
    scansCountEl.textContent = count;
  }
}

// Update matches count
function updateMatchesCount(count) {
  const matchesCountEl = document.getElementById('matches-count');
  if (matchesCountEl) {
    matchesCountEl.textContent = count;
  }
}

// Update recent documents list
function updateRecentDocuments(documents) {
  const recentDocumentsList = document.getElementById('recent-documents-list');
  const emptyState = recentDocumentsList.querySelector('.empty-state');
  
  if (!recentDocumentsList) return;
  
  if (!documents.length) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  
  if (emptyState) emptyState.classList.add('hidden');
  
  // Clear existing items
  const existingItems = recentDocumentsList.querySelectorAll('.document-item');
  existingItems.forEach(item => item.remove());
  
  // Add new items
  documents.forEach(doc => {
    const docItem = createDocumentItem(doc);
    recentDocumentsList.appendChild(docItem);
  });
}

// Create document item element
function createDocumentItem(doc) {
  const docItem = document.createElement('div');
  docItem.className = 'document-item';
  
  const date = new Date(doc.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  docItem.innerHTML = `
    <div class="document-icon">
      <i class="fas fa-file-alt"></i>
    </div>
    <div class="document-info">
      <h4>${doc.title}</h4>
      <div class="document-meta">
        <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
        <a href="documents.html?id=${doc._id}" class="btn btn-sm btn-outline">View</a>
      </div>
    </div>
  `;
  
  return docItem;
}

// Update recent scans list
function updateRecentScans(scans) {
  const recentScansList = document.getElementById('recent-scans-list');
  const emptyState = recentScansList.querySelector('.empty-state');
  
  if (!recentScansList) return;
  
  if (!scans.length) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }
  
  if (emptyState) emptyState.classList.add('hidden');
  
  // Clear existing items
  const existingItems = recentScansList.querySelectorAll('.scan-item');
  existingItems.forEach(item => item.remove());
  
  // Add new items
  scans.forEach(scan => {
    const scanItem = createScanItem(scan);
    recentScansList.appendChild(scanItem);
  });
}

// Create scan item element
function createScanItem(scan) {
  const scanItem = document.createElement('div');
  scanItem.className = 'scan-item';
  
  const date = new Date(scan.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const documentTitle = scan.document ? scan.document.title : 'Unknown Document';
  const matchesCount = scan.matchResults ? scan.matchResults.length : 0;
  
  scanItem.innerHTML = `
    <div class="scan-icon ${scan.usedAI ? 'ai-scan' : ''}">
      <i class="fas ${scan.usedAI ? 'fa-brain' : 'fa-search'}"></i>
    </div>
    <div class="scan-info">
      <h4>${documentTitle}</h4>
      <div class="scan-meta">
        <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
        <span><i class="fas fa-link"></i> ${matchesCount} matches</span>
        <a href="history.html?id=${scan._id}" class="btn btn-sm btn-outline">Details</a>
      </div>
    </div>
  `;
  
  return scanItem;
}
