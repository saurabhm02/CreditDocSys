
document.addEventListener('DOMContentLoaded', function() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        fetch('/components/sidebar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load sidebar: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                sidebarContainer.innerHTML = html;
                
                setActiveNavItem();
                
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login.html';
                    });
                }
                
                loadUserData();
            })
            .catch(error => {
                console.error('Error loading sidebar:', error);
                sidebarContainer.innerHTML = `
                    <div class="sidebar-error">
                        <p>Failed to load sidebar. <a href="javascript:location.reload()">Reload</a></p>
                    </div>
                `;
            });
    }
    
    function setActiveNavItem() {
        const path = window.location.pathname;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        if (path.includes('dashboard')) {
            document.getElementById('nav-dashboard').classList.add('active');
        } else if (path.includes('documents')) {
            document.getElementById('nav-documents').classList.add('active');
        } else if (path.includes('scan') && !path.includes('history')) {
            document.getElementById('nav-scan').classList.add('active');
        } else if (path.includes('history')) {
            document.getElementById('nav-history').classList.add('active');
        } else if (path.includes('credits')) {
            document.getElementById('nav-credits').classList.add('active');
        }
    }
    
    function loadUserData() {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }
        
        const userData = JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'user', credits: 14 };
        
        const userNameElement = document.getElementById('user-name');
        const userRoleElement = document.getElementById('user-role');
        const userAvatarElement = document.getElementById('user-avatar');
        
        if (userNameElement) userNameElement.textContent = userData.name || 'User';
        if (userRoleElement) userRoleElement.textContent = (userData.role || 'user').charAt(0).toUpperCase() + (userData.role || 'user').slice(1);
        
        if (userAvatarElement) {
            const initials = userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN';
            userAvatarElement.textContent = initials;
        }
        
        const welcomeNameElement = document.getElementById('welcome-name');
        if (welcomeNameElement) welcomeNameElement.textContent = userData.name || 'User';
        
        const creditsElements = document.querySelectorAll('#credits-count, #dashboard-credits, #available-credits');
        creditsElements.forEach(el => {
            if (el) el.textContent = userData.credits || 14;
        });
    }
});
