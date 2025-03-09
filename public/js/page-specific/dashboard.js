document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard data
    loadDashboardData();
    
    async function loadDashboardData() {
        try {
            // Show loading state
            document.getElementById('documents-count').innerHTML = '<div class="loading-spinner"></div>';
            document.getElementById('scans-count').innerHTML = '<div class="loading-spinner"></div>';
            document.getElementById('matches-count').innerHTML = '<div class="loading-spinner"></div>';
            
            // Fetch documents
            const documents = await fetchDocuments();
            
            // Update document count
            document.getElementById('documents-count').textContent = documents.length || 0;
            
            // Render recent documents
            renderRecentDocuments(documents);
            
            // Fetch scans if API exists
            // try {
            //     const scans = await fetchScans();
            //     document.getElementById('scans-count').textContent = scans.length || 0;
                
            //     // Calculate matches
            //     const matches = scans.reduce((total, scan) => {
            //         return total + (scan.matches ? scan.matches.length : 0);
            //     }, 0);
                
            //     document.getElementById('matches-count').textContent = matches;
            // } catch (error) {
            //     console.error('Error fetching scans:', error);
            //     document.getElementById('scans-count').textContent = '0';
            //     document.getElementById('matches-count').textContent = '0';
            // }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            document.getElementById('documents-count').textContent = '0';
            document.getElementById('empty-documents').style.display = 'block';
        }
    }
    
    async function fetchDocuments() {
        try {
            return await api.get('/api/documents');
        } catch (error) {
            console.error('Error fetching documents:', error);
            return [];
        }
    }
    
    async function fetchScans() {
        try {
            return await api.get('/api/scans');
        } catch (error) {
            console.error('Error fetching scans:', error);
            return [];
        }
    }
    
    function renderRecentDocuments(documents) {
        const recentDocumentsContainer = document.getElementById('recent-documents');
        const emptyState = document.getElementById('empty-documents');
        
        if (!documents || documents.length === 0) {
            recentDocumentsContainer.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Sort documents by date (newest first)
        const sortedDocuments = [...documents].sort((a, b) => {
            return new Date(b.createdAt || b.uploadDate || 0) - new Date(a.createdAt || a.uploadDate || 0);
        });
        
        // Take only the most recent 5 documents
        const recentDocs = sortedDocuments.slice(0, 5);
        
        // Generate HTML for each document
        recentDocumentsContainer.innerHTML = recentDocs.map(doc => {
            const docDate = new Date(doc.createdAt || doc.uploadDate || new Date());
            const formattedDate = docDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            return `
                <div class="document-item" data-id="${doc._id || doc.id}">
                    <div class="item-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="item-details">
                        <div class="item-title">${doc.filename || doc.name || 'Untitled Document'}</div>
                        <div class="item-meta">
                            <div class="meta-item">
                                <i class="fas fa-calendar"></i>
                                <span>${formattedDate}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click event to document items
        document.querySelectorAll('.document-item').forEach(item => {
            item.addEventListener('click', function() {
                const docId = this.getAttribute('data-id');
                window.location.href = `/documents.html?id=${docId}`;
            });
        });
    }
}); 