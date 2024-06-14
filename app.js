// Add these functions at the top of app.js June 14,2024, vipul & chatGPT
// Toast notification function
// Toast notification function
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Function to show the sign-up form
function showSignup() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

// Function to show the login form
function showLogin() {
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// Handle sign-up form submission
document.getElementById('signup').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const email = data.get('email');
    const password = data.get('password');
    const passwordConfirm = data.get('passwordConfirm');

    if (password !== passwordConfirm) {
        showToast('Passwords do not match!');
        return;
    }

    // Send the sign-up request to PocketBase
    try {
        const response = await fetch('http://127.0.0.1:8090/api/collections/users/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            showToast('Sign up successful! Please log in.');
            showLogin();
        } else {
            showToast('Sign up failed. Please try again.');
        }
    } catch (error) {
        showToast('An error occurred. Please try again.');
    }
});

// Handle login form submission
document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const email = data.get('email');
    const password = data.get('password');

    // Send the login request to PocketBase
    try {
        const response = await fetch('http://127.0.0.1:8090/api/collections/users/auth-with-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem('userToken', result.token);
            showToast('Login successful!');
            document.getElementById('authForms').style.display = 'none';
            document.getElementById('appContent').style.display = 'block';
            loadNames();
        } else {
            showToast('Login failed. Please check your credentials.');
        }
    } catch (error) {
        showToast('An error occurred. Please try again.');
    }
});

// Handle Google Sign-In
function handleCredentialResponse(response) {
    const data = jwt_decode(response.credential);
    const email = data.email;
    const firstName = data.given_name;
    const lastName = data.family_name;

    // Send the data to PocketBase for signup or login
    fetch('http://127.0.0.1:8090/api/collections/users/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName })
    })
    .then(response => response.json())
    .then(data => {
        showToast('Sign up successful! Please log in.');
        showLogin();
    })
    .catch(error => {
        showToast('Sign up failed. Please try again.');
    });
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: 'YOUR_GOOGLE_CLIENT_ID',
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById('buttonDiv'),
        { theme: 'outline', size: 'large' }
    );
    google.accounts.id.prompt();
}

// Other existing code for loading names, updating fields, etc...



document.addEventListener('DOMContentLoaded', async function() {
    const namesGrid = document.getElementById('namesGrid');
    const confirmationModal = document.getElementById('confirmationModal');
    const addPersonModal = document.getElementById('addPersonModal');
    const syncStatus = document.getElementById('syncStatus');
    const confirmYes = document.getElementById('confirmYes');
    let deleteNameId;

    // Fetch initial data from PocketBase and display in grid
    async function fetchData() {
        try {
            const response = await fetch('http://127.0.0.1:8090/api/collections/names/records', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                namesGrid.innerHTML = ''; // Clear existing grid items
                data.items.forEach(item => {
                    const gridItem = document.createElement('div');
                    gridItem.classList.add('grid-item');
                    gridItem.innerHTML = `
                        <h3>${item.firstName} ${item.lastName}</h3>
                        <p><strong>Updated on:</strong> ${item.presentMoment || 'N/A'}</p>
                        <div><strong>Thoughts:</strong> <span contenteditable="true" onblur="updateField('${item.id}', 'thoughts', this.innerText)">${item.thoughts || ''}</span></div>
                        <div><strong>Improvements:</strong> <span contenteditable="true" onblur="updateField('${item.id}', 'improvements', this.innerText)">${item.improvements || ''}</span></div>
                        <div><strong>Reasons for Love:</strong> <span contenteditable="true" onblur="updateField('${item.id}', 'loveReason', this.innerText)">${item.loveReason || ''}</span></div>
                        <div><strong>Reasons for Change:</strong> <span contenteditable="true" onblur="updateField('${item.id}', 'changeReason', this.innerText)">${item.changeReason || ''}</span></div>
                        <div><strong>Mental Fluctuations:</strong> <span contenteditable="true" onblur="updateField('${item.id}', 'mentalFluctuations', this.innerText)">${item.mentalFluctuations || ''}</span></div>
                        <span class="heart ${item.hasInfluence ? 'red' : ''}" onclick="toggleHeart('${item.id}', this)">${item.hasInfluence ? '❤️' : '🖤'}</span>
                        <span class="delete" onclick="confirmDelete('${item.id}')">&#10060;</span>
                    `;
                    namesGrid.appendChild(gridItem);
                });
            } else {
                const errorData = await response.json();
                console.error('Failed to fetch data:', errorData);
                alert(`Failed to fetch data: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred: ${error.message}`);
        }
    }

    fetchData();

    window.confirmDelete = function(id) {
        deleteNameId = id;
        confirmationModal.style.display = 'block';
    }

    confirmYes.onclick = async function() {
        if (deleteNameId) {
            try {
                const response = await fetch(`http://127.0.0.1:8090/api/collections/names/records/${deleteNameId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert('Name deleted successfully');
                    fetchData();
                } else {
                    const errorData = await response.json();
                    console.error('Failed to delete name:', errorData);
                    alert(`Failed to delete name: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert(`An error occurred: ${error.message}`);
            }
        }
        confirmationModal.style.display = 'none';
        deleteNameId = null;
    }

    window.updateField = async function(id, field, value) {
        const presentMoment = new Date().toISOString(); // Get the current date
        const updateData = { id, [field]: value, presentMoment };

        // Save update to local storage
        saveToLocalStorage(updateData);

        try {
            const response = await fetch(`http://127.0.0.1:8090/api/collections/names/records/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                console.log(`Successfully updated ${field} for ID: ${id}`);
                fetchData(); // Refresh data to show updated timestamp
            } else {
                const errorData = await response.json();
                console.error(`Failed to update ${field} for ID: ${id}`, errorData);
                alert(`Failed to update ${field}: ${errorData.message}`);
            }
        } catch (error) {
            console.error(`Error updating ${field} for ID: ${id}`, error);
            alert(`An error occurred: ${error.message}`);
        }
    }

    window.toggleHeart = async function(id, element) {
        const hasInfluence = !element.classList.contains('red');
        element.classList.toggle('red');
        element.textContent = hasInfluence ? '❤️' : '🖤';
        const updateData = { id, hasInfluence, presentMoment: new Date().toISOString() };

        // Save update to local storage
        saveToLocalStorage(updateData);

        try {
            const response = await fetch(`http://127.0.0.1:8090/api/collections/names/records/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                console.log(`Successfully updated heart state for ID: ${id}`);
                fetchData(); // Refresh data to show updated timestamp
            } else {
                const errorData = await response.json();
                console.error(`Failed to update heart state for ID: ${id}`, errorData);
                alert(`Failed to update heart state: ${errorData.message}`);
            }
        } catch (error) {
            console.error(`Error updating heart state for ID: ${id}`, error);
            alert(`An error occurred: ${error.message}`);
        }
    }

    window.openAddModal = function() {
        addPersonModal.style.display = 'block';
    }

    document.getElementById('addPersonForm').onsubmit = async function(event) {
        event.preventDefault();
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;

        const newEntry = {
            firstName: firstName,
            lastName: lastName,
            presentMoment: new Date().toISOString()
        };

        // Save new entry to local storage
        saveToLocalStorage(newEntry);

        try {
            const response = await fetch('http://127.0.0.1:8090/api/collections/names/records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newEntry)
            });

            if (response.ok) {
                alert('Name added successfully');
                fetchData();
                closeModal('addPersonModal');
            } else {
                const errorData = await response.json();
                console.error('Failed to add name:', errorData);
                alert(`Failed to add name: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`An error occurred: ${error.message}`);
        }
    }

    async function syncData() {
        const unsyncedData = JSON.parse(localStorage.getItem('unsyncedData')) || [];

        if (unsyncedData.length > 0) {
            syncStatus.style.display = 'block';

            for (const item of unsyncedData) {
                try {
                    let method = item.id ? 'PATCH' : 'POST';
                    let url = `http://127.0.0.1:8090/api/collections/names/records${item.id ? '/' + item.id : ''}`;

                    const response = await fetch(url, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(item)
                    });

                    if (response.ok) {
                        console.log(`Successfully synced data for ID: ${item.id}`);
                    } else {
                        const errorData = await response.json();
                        console.error(`Failed to sync data for ID: ${item.id}`, errorData);
                    }
                } catch (error) {
                    console.error(`Error syncing data for ID: ${item.id}`, error);
                }
            }

            localStorage.removeItem('unsyncedData');
            syncStatus.style.display = 'none';
        }
    }

    // Save data to local storage
    function saveToLocalStorage(data) {
        const existingData = JSON.parse(localStorage.getItem('unsyncedData')) || [];
        const index = existingData.findIndex(item => item.id === data.id);
        if (index > -1) {
            existingData[index] = { ...existingData[index], ...data };
        } else {
            existingData.push(data);
        }
        localStorage.setItem('unsyncedData', JSON.stringify(existingData));
    }

    // Sync data every 5 minutes
    setInterval(syncData, 5 * 60 * 1000);

    // Sync data on page load
    syncData();
});

function filterNames() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const gridItems = document.getElementsByClassName('grid-item');

    Array.from(gridItems).forEach(item => {
        const name = item.textContent.toLowerCase();
        if (name.includes(searchInput)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    filterNames();
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
