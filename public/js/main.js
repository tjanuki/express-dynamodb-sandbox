document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const createUserForm = document.getElementById('createUserForm');
    const userList = document.getElementById('userList');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const userProfile = document.querySelector('.user-profile');
    const profileInfo = document.querySelector('.profile-info');
    const logoutButton = document.getElementById('logout-button');

    // Authentication state
    let authToken = localStorage.getItem('authToken');
    let currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // Initialize auth state
    function initAuthState() {
        if (authToken && currentUser) {
            // User is logged in
            updateUIForLoggedInUser();
        } else {
            // User is logged out
            updateUIForLoggedOutUser();
        }
    }

    // Update UI for logged in state
    function updateUIForLoggedInUser() {
        // Show user profile
        userProfile.classList.remove('d-none');
        profileInfo.innerHTML = `
            <p><strong>Name:</strong> ${currentUser.name}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>ID:</strong> ${currentUser.id}</p>
        `;

        // Update authentication-required areas
        document.querySelectorAll('.auth-required').forEach(element => {
            element.querySelector('.auth-required-message').classList.add('d-none');
            element.querySelector('.form-content').classList.remove('d-none');
        });

        // Hide login/register forms
        loginForm.classList.add('d-none');
        document.querySelector('#loginForm').previousElementSibling.textContent = 'Logged In';
        registerForm.classList.add('d-none');
        document.querySelector('#registerForm').previousElementSibling.textContent = 'Already Registered';

        // Update login message
        document.getElementById('login-message').innerHTML = '<div class="alert alert-success">You are logged in</div>';
    }

    // Update UI for logged out state
    function updateUIForLoggedOutUser() {
        // Hide user profile
        if (userProfile) {
            userProfile.classList.add('d-none');
        }

        // Update authentication-required areas
        document.querySelectorAll('.auth-required').forEach(element => {
            const authMessage = element.querySelector('.auth-required-message');
            const formContent = element.querySelector('.form-content');

            if (authMessage) authMessage.classList.remove('d-none');
            if (formContent) formContent.classList.add('d-none');
        });

        // Show login/register forms
        if (loginForm) {
            loginForm.classList.remove('d-none');
            const loginHeader = document.querySelector('#loginForm').previousElementSibling;
            if (loginHeader) loginHeader.textContent = 'Login';
        }

        if (registerForm) {
            registerForm.classList.remove('d-none');
            const registerHeader = document.querySelector('#registerForm').previousElementSibling;
            if (registerHeader) registerHeader.textContent = 'Register New User';
        }
    }

    // Register a new user
    function registerUser(userData) {
        fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || 'Failed to register'); });
                }
                return response.json();
            })
            .then(user => {
                // Show success message
                document.getElementById('register-message').innerHTML = '<div class="alert alert-success">Registration successful! You can now log in.</div>';
                registerForm.reset();

                // Refresh user list
                fetchUsers();
            })
            .catch(error => {
                document.getElementById('register-message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            });
    }

    // Login user
    function loginUser(credentials) {
        fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        })
            .then(response => {
                // Check if the response is JSON
                const contentType = response.headers.get('content-type');
                const isJson = contentType && contentType.includes('application/json');

                if (!response.ok) {
                    if (isJson) {
                        return response.json().then(err => {
                            throw new Error(err.error || 'Login failed');
                        });
                    } else {
                        throw new Error('Server error: ' + response.status);
                    }
                }
                return response.json();
            })
            .then(data => {
                // Store auth info
                authToken = data.token;
                currentUser = data.user;

                // Save to localStorage
                localStorage.setItem('authToken', authToken);
                localStorage.setItem('currentUser', JSON.stringify(currentUser));

                // Update UI
                updateUIForLoggedInUser();

                // Clear form
                loginForm.reset();

                // Refresh user list
                fetchUsers();
            })
            .catch(error => {
                document.getElementById('login-message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            });
    }

    // Logout user
    function logoutUser() {
        // Clear auth data
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');

        // Update UI
        updateUIForLoggedOutUser();

        // Show logout message
        document.getElementById('login-message').innerHTML = '<div class="alert alert-info">You have been logged out</div>';

        // Refresh user list
        fetchUsers();
    }

    // Change password
    function changePassword(passwordData) {
        fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify(passwordData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || 'Failed to change password'); });
                }
                return response.json();
            })
            .then(data => {
                // Show success message
                document.getElementById('change-password-message').innerHTML = '<div class="alert alert-success">Password changed successfully!</div>';
                changePasswordForm.reset();
            })
            .catch(error => {
                document.getElementById('change-password-message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            });
    }

    // Fetch and display users
    function fetchUsers() {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = authToken;
        }

        fetch('/api/users', { headers })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        userList.innerHTML = '<div class="alert alert-warning">Authentication required to view users</div>';
                        return null;
                    }
                    throw new Error('Failed to fetch users');
                }
                return response.json();
            })
            .then(users => {
                if (users) {
                    displayUsers(users);
                }
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                userList.innerHTML = '<div class="alert alert-danger">Error loading users</div>';
            });
    }

    // Display users in the UI
    function displayUsers(users) {
        if (!users || users.length === 0) {
            userList.innerHTML = '<div class="alert alert-info">No users found</div>';
            return;
        }

        let html = '<div class="list-group">';
        users.forEach(user => {
            html += `
                <div class="list-group-item">
                    <div class="d-flex w-100 justify-content-between">
                        <h5 class="mb-1">${user.name}</h5>
                        <small>${user.id === currentUser?.id ? '<span class="badge bg-primary">You</span>' : ''}</small>
                    </div>
                    <p class="mb-1"><strong>Email:</strong> ${user.email}</p>
                    <p class="mb-1"><strong>Age:</strong> ${user.age || 'Not specified'}</p>
                    ${user.id === currentUser?.id ?
                `<button class="btn btn-sm btn-outline-danger delete-user" data-id="${user.id}">Delete Account</button>` : ''}
                </div>
            `;
        });
        html += '</div>';

        userList.innerHTML = html;

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                    deleteUser(userId);
                }
            });
        });
    }

    // Create a new user (admin function)
    function createUser(userData) {
        fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            },
            body: JSON.stringify(userData)
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw new Error(err.error || 'Failed to create user'); });
                }
                return response.json();
            })
            .then(() => {
                // Show success message
                document.getElementById('create-user-message').innerHTML = '<div class="alert alert-success">User created successfully!</div>';

                // Clear form and refresh user list
                createUserForm.reset();
                fetchUsers();
            })
            .catch(error => {
                document.getElementById('create-user-message').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            });
    }

    // Delete a user
    function deleteUser(userId) {
        fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': authToken
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete user');
                }

                // If deleting own account, logout
                if (userId === currentUser?.id) {
                    logoutUser();
                } else {
                    fetchUsers();
                }
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
    }

    // Event listeners
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const userData = {
                email: document.getElementById('register-email').value,
                name: document.getElementById('register-name').value,
                password: document.getElementById('register-password').value,
                age: document.getElementById('register-age').value ? parseInt(document.getElementById('register-age').value) : undefined
            };

            registerUser(userData);
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const credentials = {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            };

            loginUser(credentials);
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault();
            logoutUser();
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const passwordData = {
                currentPassword: document.getElementById('current-password').value,
                newPassword: document.getElementById('new-password').value
            };

            changePassword(passwordData);
        });
    }

    if (createUserForm) {
        createUserForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const userData = {
                email: document.getElementById('email').value,
                name: document.getElementById('name').value,
                age: document.getElementById('age').value ? parseInt(document.getElementById('age').value) : undefined
            };

            createUser(userData);
        });
    }

    // Initialize app
    initAuthState();

    // Initialize - fetch users on page load
    if (userList) {
        fetchUsers();
    }
});