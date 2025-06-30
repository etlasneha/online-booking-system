// Global variables
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let currentBookingId = 1;
let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// DOM elements
const authContainer = document.getElementById('authContainer');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const bookingForm = document.getElementById('bookingForm');
const bookingsList = document.getElementById('bookingsList');
const clearAllBtn = document.getElementById('clearAll');
const successModal = document.getElementById('successModal');
const modalClose = document.querySelector('.close');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const userName = document.getElementById('userName');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
    setupSmoothScrolling();
});

// Check if user is authenticated
function checkAuthentication() {
    const session = JSON.parse(localStorage.getItem('session')) || null;
    
    if (session && session.userId) {
        const user = users.find(u => u.id === session.userId);
        if (user) {
            currentUser = user;
            showMainApp();
            return;
        }
    }
    
    showAuthContainer();
}

// Show authentication container
function showAuthContainer() {
    authContainer.style.display = 'flex';
    mainApp.style.display = 'none';
}

// Show main application
function showMainApp() {
    authContainer.style.display = 'none';
    mainApp.style.display = 'block';
    
    // Update user name in navigation
    if (currentUser) {
        userName.textContent = currentUser.name;
    }
    
    // Initialize booking system
    initializeApp();
    renderBookings();
}

// Setup event listeners
function setupEventListeners() {
    // Authentication forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // Booking form
    bookingForm.addEventListener('submit', handleBookingSubmit);
    
    // Clear all bookings
    clearAllBtn.addEventListener('click', clearAllBookings);
    
    // Modal close
    modalClose.addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        if (event.target === successModal) {
            closeModal();
        }
    });
    
    // Mobile navigation
    hamburger.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu when clicking on links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Form validation
    setupFormValidation();
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validate input
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    // Find user
    const user = users.find(u => u.email === email);
    
    if (!user) {
        showNotification('User not found. Please register first.', 'error');
        return;
    }
    
    // Check password
    if (user.password !== password) {
        showNotification('Invalid password', 'error');
        return;
    }
    
    // Login successful
    currentUser = user;
    
    // Create session
    const session = {
        userId: user.id,
        email: user.email,
        loginTime: new Date().toISOString(),
        rememberMe: rememberMe
    };
    
    localStorage.setItem('session', JSON.stringify(session));
    
    // Show success message
    showNotification(`Welcome back, ${user.name}!`, 'success');
    
    // Show main app
    setTimeout(() => {
        showMainApp();
    }, 1000);
}

// Handle registration
function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validate input
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showNotification('Please agree to the Terms & Conditions', 'error');
        return;
    }
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showNotification('User with this email already exists', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };
    
    // Add user to users array
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login
    currentUser = newUser;
    
    // Create session
    const session = {
        userId: newUser.id,
        email: newUser.email,
        loginTime: new Date().toISOString(),
        rememberMe: false
    };
    
    localStorage.setItem('session', JSON.stringify(session));
    
    // Show success message
    showNotification(`Account created successfully! Welcome, ${name}!`, 'success');
    
    // Show main app
    setTimeout(() => {
        showMainApp();
    }, 1000);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session
        localStorage.removeItem('session');
        currentUser = null;
        
        // Show auth container
        showAuthContainer();
        
        // Clear forms
        loginForm.reset();
        registerForm.reset();
        
        showNotification('Logged out successfully', 'info');
    }
}

// Toggle between login and register forms
function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authToggle = document.getElementById('authToggle');
    
    if (loginForm.style.display === 'none') {
        // Show login form
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        authToggle.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleAuthForm()">Sign up here</a>';
    } else {
        // Show register form
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authToggle.innerHTML = 'Already have an account? <a href="#" onclick="toggleAuthForm()">Sign in here</a>';
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentNode.querySelector('.password-toggle i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        button.className = 'fas fa-eye';
    }
}

// Show terms and conditions
function showTerms() {
    alert('Terms & Conditions:\n\n1. You agree to use this service responsibly\n2. All bookings are subject to availability\n3. Cancellation policies apply\n4. Your data is stored locally on your device\n5. We respect your privacy');
}

// Show forgot password
function showForgotPassword() {
    alert('Forgot Password:\n\nSince this is a demo application with local storage, please create a new account or contact support for assistance.');
}

// Initialize the booking application
function initializeApp() {
    // Set minimum date to today
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    // Set default time to current time + 1 hour
    const timeInput = document.getElementById('time');
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const timeString = now.toTimeString().slice(0, 5);
    timeInput.value = timeString;
    
    // Pre-fill user data if available
    if (currentUser) {
        document.getElementById('name').value = currentUser.name;
        document.getElementById('email').value = currentUser.email;
    }
}

// Handle booking form submission
function handleBookingSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showNotification('Please login to make bookings', 'error');
        return;
    }
    
    if (!validateForm()) {
        return;
    }
    
    const booking = {
        id: currentBookingId++,
        userId: currentUser.id,
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        notes: document.getElementById('notes').value,
        status: 'confirmed',
        createdAt: new Date().toISOString()
    };
    
    // Add booking to array
    bookings.unshift(booking);
    
    // Save to localStorage
    saveBookings();
    
    // Render updated bookings
    renderBookings();
    
    // Show success modal
    showSuccessModal(booking);
    
    // Reset form
    bookingForm.reset();
    
    // Reset minimum date
    const dateInput = document.getElementById('date');
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    
    // Pre-fill user data again
    if (currentUser) {
        document.getElementById('name').value = currentUser.name;
        document.getElementById('email').value = currentUser.email;
    }
}

// Validate form
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const service = document.getElementById('service').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    
    // Clear previous error states
    clearFormErrors();
    
    let isValid = true;
    
    // Name validation
    if (name.length < 2) {
        showFieldError('name', 'Name must be at least 2 characters long');
        isValid = false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        showFieldError('phone', 'Please enter a valid phone number');
        isValid = false;
    }
    
    // Service validation
    if (!service) {
        showFieldError('service', 'Please select a service');
        isValid = false;
    }
    
    // Date validation
    if (!date) {
        showFieldError('date', 'Please select a date');
        isValid = false;
    }
    
    // Time validation
    if (!time) {
        showFieldError('time', 'Please select a time');
        isValid = false;
    }
    
    return isValid;
}

// Show field error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.style.borderColor = '#ef4444';
    field.parentNode.appendChild(errorDiv);
}

// Clear form errors
function clearFormErrors() {
    document.querySelectorAll('.field-error').forEach(error => error.remove());
    document.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(field => {
        field.style.borderColor = '#e5e7eb';
    });
}

// Setup form validation
function setupFormValidation() {
    const inputs = document.querySelectorAll('.form-group input, .form-group select, .form-group textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = '#10b981';
            } else {
                this.style.borderColor = '#e5e7eb';
            }
        });
        
        input.addEventListener('input', function() {
            if (this.style.borderColor === 'rgb(239, 68, 68)') {
                this.style.borderColor = '#e5e7eb';
                const error = this.parentNode.querySelector('.field-error');
                if (error) error.remove();
            }
        });
    });
}

// Render bookings
function renderBookings() {
    if (!currentUser) return;
    
    // Filter bookings for current user
    const userBookings = bookings.filter(booking => booking.userId === currentUser.id);
    
    if (userBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-calendar-times"></i>
                <p>No bookings yet. Make your first booking above!</p>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = userBookings.map(booking => `
        <div class="booking-item" data-id="${booking.id}">
            <div class="booking-header">
                <span class="booking-name">${escapeHtml(booking.name)}</span>
                <span class="booking-service">${getServiceDisplayName(booking.service)}</span>
            </div>
            <div class="booking-details">
                <div class="booking-detail">
                    <i class="fas fa-envelope"></i>
                    <span>${escapeHtml(booking.email)}</span>
                </div>
                <div class="booking-detail">
                    <i class="fas fa-phone"></i>
                    <span>${escapeHtml(booking.phone)}</span>
                </div>
                <div class="booking-detail">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(booking.date)}</span>
                </div>
                <div class="booking-detail">
                    <i class="fas fa-clock"></i>
                    <span>${formatTime(booking.time)}</span>
                </div>
            </div>
            ${booking.notes ? `
                <div class="booking-notes">
                    <strong>Notes:</strong> ${escapeHtml(booking.notes)}
                </div>
            ` : ''}
            <div class="booking-actions">
                <button class="delete-btn" onclick="deleteBooking(${booking.id})">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Delete booking
function deleteBooking(id) {
    if (confirm('Are you sure you want to delete this booking?')) {
        bookings = bookings.filter(booking => booking.id !== id);
        saveBookings();
        renderBookings();
        showNotification('Booking deleted successfully!', 'success');
    }
}

// Clear all bookings
function clearAllBookings() {
    if (!currentUser) return;
    
    const userBookings = bookings.filter(booking => booking.userId === currentUser.id);
    
    if (userBookings.length === 0) {
        showNotification('No bookings to clear!', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to delete all your bookings? This action cannot be undone.')) {
        bookings = bookings.filter(booking => booking.userId !== currentUser.id);
        saveBookings();
        renderBookings();
        showNotification('All bookings cleared successfully!', 'success');
    }
}

// Save bookings to localStorage
function saveBookings() {
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

// Show success modal
function showSuccessModal(booking) {
    const bookingDetails = document.getElementById('bookingDetails');
    bookingDetails.innerHTML = `
        <div class="booking-summary">
            <h4>Booking Summary:</h4>
            <p><strong>Name:</strong> ${escapeHtml(booking.name)}</p>
            <p><strong>Service:</strong> ${getServiceDisplayName(booking.service)}</p>
            <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
            <p><strong>Time:</strong> ${formatTime(booking.time)}</p>
            ${booking.notes ? `<p><strong>Notes:</strong> ${escapeHtml(booking.notes)}</p>` : ''}
        </div>
    `;
    
    successModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    successModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Toggle mobile menu
function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// Close mobile menu
function closeMobileMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}

// Setup smooth scrolling
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getServiceDisplayName(service) {
    const serviceNames = {
        'medical': 'Medical Appointment',
        'beauty': 'Beauty & Spa',
        'restaurant': 'Restaurant Reservation',
        'transport': 'Transportation'
    };
    return serviceNames[service] || service;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add some CSS for the notification
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .booking-actions {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }
    
    .delete-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .delete-btn:hover {
        background: #dc2626;
        transform: translateY(-1px);
    }
    
    .no-bookings {
        text-align: center;
        padding: 3rem;
        color: #64748b;
    }
    
    .no-bookings i {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    .booking-summary {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
    }
    
    .booking-summary h4 {
        margin-bottom: 1rem;
        color: #1e293b;
    }
    
    .booking-summary p {
        margin-bottom: 0.5rem;
        color: #64748b;
    }
    
    .booking-summary strong {
        color: #374151;
    }
`;
document.head.appendChild(notificationStyles);
