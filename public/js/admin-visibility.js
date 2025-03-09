// Admin visibility controller
function checkAndShowAdminPanel() {
    try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        // Check if user is admin
        if (userData && userData.role === 'admin') {
            // Find admin section in sidebar
            const adminSection = document.getElementById('admin-section');
            if (adminSection) {
                adminSection.style.display = 'block';
            }
            
            // Find admin panel link in sidebar
            const adminPanelLink = document.querySelector('.admin-panel-link');
            if (adminPanelLink) {
                adminPanelLink.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

// Run when DOM is loaded
document.addEventListener('DOMContentLoaded', checkAndShowAdminPanel); 