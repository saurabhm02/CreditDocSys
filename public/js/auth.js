// Authentication related functions
const auth = {
    // Check if user is logged in
    isLoggedIn: function() {
        return !!localStorage.getItem('token');
    },
    
    // Get user data
    getUserData: function() {
        return JSON.parse(localStorage.getItem('user')) || { name: 'User', role: 'user', credits: 14 };
    },
    
    // Get auth token
    getToken: function() {
        return localStorage.getItem('token');
    },
    
    // Login user
    login: function(token, userData) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
    },
    
    // Logout user
    logout: function() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    },
    
    // Update user data
    updateUserData: function(userData) {
        const currentData = this.getUserData();
        localStorage.setItem('user', JSON.stringify({...currentData, ...userData}));
    },
    
    // Check if token is expired
    isTokenExpired: function() {
        const token = this.getToken();
        if (!token) return true;
        
        try {
            // Simple check - in a real app, you'd decode the JWT and check its exp claim
            return false;
        } catch (e) {
            return true;
        }
    },
    
    // Redirect if not logged in
    requireAuth: function() {
        if (!this.isLoggedIn() || this.isTokenExpired()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
};

// Run auth check on page load
document.addEventListener('DOMContentLoaded', function() {
    // Skip auth check on login and register pages
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
        return;
    }
    
    // Redirect to login if not authenticated
    auth.requireAuth();
});

// Authentication utility functions
const Auth = {
    // Check if user is logged in
    isLoggedIn: function() {
        return localStorage.getItem('token') !== null;
    },
    
    // Get current user data
    getUser: function() {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    },
    
    // Get authentication token
    getToken: function() {
        return localStorage.getItem('token');
    },
    
    // Log out user
    logout: function() {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/login.html';
    },
    
    // Redirect if not logged in
    requireAuth: function() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login.html';
        }
    },
    
    // Redirect if already logged in
    redirectIfLoggedIn: function() {
        if (this.isLoggedIn()) {
            window.location.href = '/dashboard.html';
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const currentPage = window.location.pathname;
  
  // Pages that require authentication
  const authRequiredPages = [
    '/dashboard.html',
    '/documents.html',
    '/scan.html',
    '/history.html',
    '/credits.html',
    '/admin.html',
    '/settings.html'
  ];
  
  // Pages that should redirect to dashboard if already logged in
  const nonAuthPages = [
    '/login.html',
    '/register.html',
    '/forgot-password.html'
  ];
  
  // Check if current page requires authentication
  if (authRequiredPages.some(page => currentPage.endsWith(page)) && !token) {
    // Redirect to login page if not authenticated
    window.location.href = 'login.html';
    return;
  }
  
  // Redirect to dashboard if already logged in and trying to access login/register pages
  if (nonAuthPages.some(page => currentPage.endsWith(page)) && token) {
    window.location.href = 'dashboard.html';
    return;
  }
  
  // Handle logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      Auth.logout();
    });
  }
  
  // Load user data if authenticated
  if (token) {
    loadUserData();
  }
  
  // Handle registration form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      try {
        const username = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
          showAlert('Passwords do not match', 'error');
          return;
        }
        
        // Register user
        const response = await api.register({
          username,
          email,
          password
        });
        
        if (response.success) {
          const loginResponse = await api.login({
            email,
            password
          });
          if (loginResponse.success) {
            // Save token and user data
            localStorage.setItem('token', loginResponse.token);
            localStorage.setItem('user', JSON.stringify(loginResponse.user));
            window.location.href = 'dashboard.html';
          }
          
        } else {
          showAlert(response.message || 'Registration failed', 'error');
        }
      } catch (error) {
        showAlert('An error occurred during registration', 'error');
        console.error(error);
      }
    });
    
    // Password strength meter
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthText = document.querySelector('.strength-text');
    
    if (passwordInput && strengthMeter && strengthText) {
      passwordInput.addEventListener('input', function() {
        const strength = calculatePasswordStrength(this.value);
        updatePasswordStrength(strength);
      });
    }
  }
  
  // Handle login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Login user
        const response = await api.login({
          email,
          password
        });
        
        if (response.success) {
          // Save token and user data
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Redirect to dashboard
          window.location.href = 'dashboard.html';
        } else {
          showAlert(response.message || 'Login failed', 'error');
        }
      } catch (error) {
        showAlert('An error occurred during login', 'error');
        console.error(error);
      }
    });
  }
  
  // Toggle password visibility
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const passwordInput = this.previousElementSibling;
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
    });
  });
});

// Load user data from API
async function loadUserData() {
  try {
    const response = await api.getProfile();
    
    if (response.success) {
      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Update UI with user data
      updateUserUI(response.user);
      
      // Check if user is admin and show admin panel link
      if (response.user.role === 'admin') {
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => link.classList.remove('hidden'));
      }
    } else {
      // If token is invalid, logout
      if (response.message === 'Authentication failed') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

// Update UI with user data
function updateUserUI(user) {
  // Update user name
  const userNameElements = document.querySelectorAll('#user-name, .user-name');
  userNameElements.forEach(el => {
    if (el) el.textContent = user.name;
  });
  
  // Update user role
  const userRoleElements = document.querySelectorAll('.user-role');
  userRoleElements.forEach(el => {
    if (el) el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  });
  
  // Update credits count
  const creditsElements = document.querySelectorAll('#credits-count, #available-credits, #dashboard-credits');
  creditsElements.forEach(el => {
    if (el) el.textContent = user.credits;
  });
  
  // Update user avatar
  const userAvatars = document.querySelectorAll('.user-profile img');
  userAvatars.forEach(avatar => {
    if (avatar) {
      avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`;
    }
  });
}

// Calculate password strength
function calculatePasswordStrength(password) {
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  
  // Character type checks
  if (/[a-z]/.test(password)) strength += 1; // lowercase
  if (/[A-Z]/.test(password)) strength += 1; // uppercase
  if (/[0-9]/.test(password)) strength += 1; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1; // special characters
  
  return Math.min(strength, 5); // Max strength is 5
}

// Update password strength UI
function updatePasswordStrength(strength) {
  const strengthMeter = document.querySelector('.strength-meter');
  const strengthText = document.querySelector('.strength-text');
  
  if (!strengthMeter || !strengthText) return;
  
  // Update meter width
  strengthMeter.style.width = `${(strength / 5) * 100}%`;
  
  // Update color and text
  let color, text;
  
  switch (strength) {
    case 0:
    case 1:
      color = '#ef4444'; // red
      text = 'Very Weak';
      break;
    case 2:
      color = '#f59e0b'; // amber
      text = 'Weak';
      break;
    case 3:
      color = '#f59e0b'; // amber
      text = 'Moderate';
      break;
    case 4:
      color = '#10b981'; // green
      text = 'Strong';
      break;
    case 5:
      color = '#10b981'; // green
      text = 'Very Strong';
      break;
  }
  
  strengthMeter.style.backgroundColor = color;
  strengthText.textContent = text;
  strengthText.style.color = color;
}

// Show alert message
function showAlert(message, type = 'info') {
  // Create alert element
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  
  // Add to document
  document.body.appendChild(alertEl);
  
  // Show alert
  setTimeout(() => {
    alertEl.classList.add('show');
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    alertEl.classList.remove('show');
    setTimeout(() => {
      alertEl.remove();
    }, 300);
  }, 3000);
}

// Add event listeners to logout buttons
document.addEventListener('DOMContentLoaded', function() {
    // Find all logout buttons
    const logoutButtons = document.querySelectorAll('.logout-btn, #logout-button, [data-action="logout"]');
    
    // Add click event to each logout button
    logoutButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            Auth.logout();
        });
    });
});
