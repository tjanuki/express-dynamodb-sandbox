document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const createUserForm = document.getElementById('createUserForm');
    const userList = document.getElementById('userList');

    // Fetch and display users
    function fetchUsers() {
        fetch('/api/users')
            .then(response => response.json())
            .then(users => {
                displayUsers(users);
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

        let html = '';
        users.forEach(user => {
            html += `
        <div class="user-card" data-id="${user.id}">
          <h5>${user.name}</h5>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Age:</strong> ${user.age || 'Not specified'}</p>
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-danger delete-user">Delete</button>
          </div>
        </div>
      `;
        });

        userList.innerHTML = html;

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-user').forEach(button => {
            button.addEventListener('click', function() {
                const userId = this.closest('.user-card').getAttribute('data-id');
                deleteUser(userId);
            });
        });
    }

    // Create a new user
    function createUser(userData) {
        fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
                // Clear form and refresh user list
                createUserForm.reset();
                fetchUsers();
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
    }

    // Delete a user
    function deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete user');
                }
                fetchUsers();
            })
            .catch(error => {
                alert('Error: ' + error.message);
            });
    }

    // Event listeners
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

    // Initialize - fetch users on page load
    if (userList) {
        fetchUsers();
    }
});