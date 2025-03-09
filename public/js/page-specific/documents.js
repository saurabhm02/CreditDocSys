document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const documentsGrid = document.getElementById('documents-grid');
    const emptyState = document.getElementById('empty-documents');
    const errorState = document.getElementById('error-documents');
    const loadingState = document.getElementById('documents-loading');
    const paginationContainer = document.getElementById('pagination');
    const searchInput = document.getElementById('search-input');
    const sortBySelect = document.getElementById('sort-by');
    const fileTypeSelect = document.getElementById('file-type');
    const retryBtn = document.getElementById('retry-btn');
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    const itemsPerPage = 12;
    
    // Filter state
    let searchQuery = '';
    let sortBy = 'date-desc';
    let fileType = 'all';
    
    // All documents
    let allDocuments = [];
    
    // Initialize
    loadDocuments();
    
    // Event listeners
    searchInput.addEventListener('input', function() {
        searchQuery = this.value.trim().toLowerCase();
        currentPage = 1;
        filterAndRenderDocuments();
    });
    
    sortBySelect.addEventListener('change', function() {
        sortBy = this.value;
        filterAndRenderDocuments();
    });
    
    fileTypeSelect.addEventListener('change', function() {
        fileType = this.value;
        filterAndRenderDocuments();
    });
    
    retryBtn.addEventListener('click', loadDocuments);
    
    // Functions
    async function loadDocuments() {
        showLoading();
        
        try {
            const documents = await api.get('/api/documents');
            
            if (Array.isArray(documents)) {
                allDocuments = documents;
                filterAndRenderDocuments();
            } else {
                showError();
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            showError();
        }
    }
    
    function filterAndRenderDocuments() {
        // Filter by search query
        let filteredDocs = allDocuments.filter(doc => {
            const docName = (doc.filename || doc.name || '').toLowerCase();
            return docName.includes(searchQuery);
        });
        
        // Filter by file type
        if (fileType !== 'all') {
            filteredDocs = filteredDocs.filter(doc => {
                const filename = doc.filename || doc.name || '';
                return filename.toLowerCase().endsWith(`.${fileType}`);
            });
        }
        
        // Sort documents
        filteredDocs = sortDocuments(filteredDocs, sortBy);
        
        // Calculate pagination
        totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
        
        // Get current page items
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageItems = filteredDocs.slice(startIndex, endIndex);
        
        // Render documents
        renderDocuments(currentPageItems);
        
        // Render pagination
        renderPagination();
    }
    
    function sortDocuments(docs, sortOption) {
        return [...docs].sort((a, b) => {
            switch (sortOption) {
                case 'date-desc':
                    return new Date(b.createdAt || b.uploadDate || 0) - new Date(a.createdAt || a.uploadDate || 0);
                case 'date-asc':
                    return new Date(a.createdAt || a.uploadDate || 0) - new Date(b.createdAt || b.uploadDate || 0);
                case 'name-asc':
                    return (a.filename || a.name || '').localeCompare(b.filename || b.name || '');
                case 'name-desc':
                    return (b.filename || b.name || '').localeCompare(a.filename || a.name || '');
                default:
                    return 0;
            }
        });
    }
    
    function renderDocuments(documents) {
        hideLoading();
        
        if (documents.length === 0) {
            documentsGrid.innerHTML = '';
            emptyState.style.display = 'block';
            errorState.style.display = 'none';
            paginationContainer.style.display = 'none';
            return;
        }
        
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
        paginationContainer.style.display = totalPages > 1 ? 'flex' : 'none';
        
        documentsGrid.innerHTML = documents.map(doc => {
            const docDate = new Date(doc.createdAt || doc.uploadDate || new Date());
            const formattedDate = docDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            const fileType = getFileType(doc.filename || doc.name || '');
            const fileSize = formatFileSize(doc.size || 0);
            
            return `
                <div class="document-card" data-id="${doc._id || doc.id}">
                    <div class="document-header">
                        <div class="document-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="document-title">${doc.filename || doc.name || 'Untitled Document'}</div>
                    </div>
                    <div class="document-body">
                        <div class="document-meta">
                            <div class="meta-row">
                                <i class="fas fa-calendar"></i>
                                <span>${formattedDate}</span>
                            </div>
                            <div class="meta-row">
                                <i class="fas fa-file"></i>
                                <span>${fileType}</span>
                            </div>
                            <div class="meta-row">
                                <i class="fas fa-hdd"></i>
                                <span>${fileSize}</span>
                            </div>
                        </div>
                        <div class="document-actions">
                            <button class="action-btn btn-view view-document" data-id="${doc._id || doc.id}">
                                <i class="fas fa-eye"></i>
                                View
                            </button>
                            <button class="action-btn btn-delete delete-document" data-id="${doc._id || doc.id}">
                                <i class="fas fa-trash"></i>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners to document cards
        document.querySelectorAll('.view-document').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const docId = this.getAttribute('data-id');
                viewDocument(docId);
            });
        });
        
        document.querySelectorAll('.delete-document').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const docId = this.getAttribute('data-id');
                deleteDocument(docId);
            });
        });
        
        document.querySelectorAll('.document-card').forEach(card => {
            card.addEventListener('click', function() {
                const docId = this.getAttribute('data-id');
                viewDocument(docId);
            });
        });
    }
    
    function renderPagination() {
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        let paginationHTML = `
            <button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" id="prev-page">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Show max 5 page buttons
        const maxButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }
        
        paginationHTML += `
            <button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" id="next-page">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        paginationContainer.innerHTML = paginationHTML;
        
        // Add event listeners to pagination buttons
        document.querySelectorAll('.page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', function() {
                currentPage = parseInt(this.getAttribute('data-page'));
                filterAndRenderDocuments();
            });
        });
        
        const prevBtn = document.getElementById('prev-page');
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (currentPage > 1) {
                    currentPage--;
                    filterAndRenderDocuments();
                }
            });
        }
        
        const nextBtn = document.getElementById('next-page');
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (currentPage < totalPages) {
                    currentPage++;
                    filterAndRenderDocuments();
                }
            });
        }
    }
    
    function viewDocument(docId) {
        // Redirect to document viewer or open modal
        console.log('View document:', docId);
        // For now, just alert
        alert(`Viewing document ${docId}`);
    }
    
    function deleteDocument(docId) {
        if (confirm('Are you sure you want to delete this document?')) {
            // Call API to delete document
            api.delete(`/api/documents/${docId}`)
                .then(() => {
                    // Remove from local array
                    allDocuments = allDocuments.filter(doc => (doc._id || doc.id) !== docId);
                    // Re-render
                    filterAndRenderDocuments();
                })
                .catch(error => {
                    console.error('Error deleting document:', error);
                    alert('Failed to delete document. Please try again.');
                });
        }
    }
    
    function showLoading() {
        loadingState.style.display = 'flex';
        documentsGrid.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'none';
    }
    
    function hideLoading() {
        loadingState.style.display = 'none';
        documentsGrid.style.display = 'grid';
    }
    
    function showError() {
        loadingState.style.display = 'none';
        documentsGrid.style.display = 'none';
        emptyState.style.display = 'none';
        errorState.style.display = 'block';
        paginationContainer.style.display = 'none';
    }
    
    // Helper functions
    function getFileType(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'txt':
                return 'Text File';
            case 'csv':
                return 'CSV File';
            case 'md':
                return 'Markdown File';
            default:
                return 'Document';
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 