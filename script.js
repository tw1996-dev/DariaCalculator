// Minutes Tracker JavaScript
let people = [];
let personIdCounter = 1;
let autoNameCounter = 1;
let isEditing = false;
let editingId = null;
let currentSortColumn = null;
let currentSortDirection = 'asc';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    initializeEventListeners();
    focusNameInput();
    renderTable();
});

// ========== LOCAL STORAGE FUNCTIONS ==========
function saveToLocalStorage() {
    try {
        localStorage.setItem('minutesTrackerData', JSON.stringify({
            people: people,
            personIdCounter: personIdCounter,
            autoNameCounter: autoNameCounter
        }));
    } catch (error) {
        console.log('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('minutesTrackerData');
        if (saved) {
            const data = JSON.parse(saved);
            people = data.people || [];
            personIdCounter = data.personIdCounter || 1;
            autoNameCounter = data.autoNameCounter || 1;
        }
    } catch (error) {
        console.log('Error loading from localStorage:', error);
    }
}

// ========== EVENT LISTENERS ==========
function initializeEventListeners() {
    // Add person button
    document.getElementById('addPerson').addEventListener('click', handleAddPerson);
    
    // Enter key in any input field
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAddPerson();
        }
    });
    
    // Minus minutes input - auto convert to negative
    const minusInput = document.getElementById('minusMinutes');
    minusInput.addEventListener('input', handleMinusInput);
    
    // Input validation
    document.getElementById('plusMinutes').addEventListener('input', validateMinutesInput);
    document.getElementById('minusMinutes').addEventListener('input', validateMinutesInput);
    
    // Floating labels support
    document.addEventListener('input', updateFloatingLabels);
    document.addEventListener('focus', updateFloatingLabels, true);
    document.addEventListener('blur', updateFloatingLabels, true);
    

    initializeSorting();
}

// ========== SORTING FUNCTIONS ==========

function initializeSorting() {
    const sortHeaders = document.querySelectorAll('th[data-sort]');
    sortHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortBy = this.getAttribute('data-sort');
            sortTable(sortBy);
        });
    });
}

function sortTable(column) {
    // Determine sort direction
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDirection = 'asc';
    }
    
    currentSortColumn = column;
    
    // Sort the people array
    people.sort((a, b) => {
        let valueA, valueB;
        
        switch (column) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'plus':
                valueA = a.plus;
                valueB = b.plus;
                break;
            case 'minus':
                valueA = a.minus;
                valueB = b.minus;
                break;
            case 'sum':
                valueA = a.sum;
                valueB = b.sum;
                break;
            default:
                return 0;
        }
        
        // Compare values
        let comparison = 0;
        if (valueA > valueB) {
            comparison = 1;
        } else if (valueA < valueB) {
            comparison = -1;
        }
        
        // Apply sort direction
        return currentSortDirection === 'desc' ? comparison * -1 : comparison;
    });
    
    // Update sort indicators in headers
    updateSortIndicators();
    
    // Re-render table
    renderTable();
    
    // Save sorted data
    saveToLocalStorage();
}

function updateSortIndicators() {
    // Remove all existing sort indicators
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add indicator to current sorted column
    if (currentSortColumn) {
        const activeHeader = document.querySelector(`th[data-sort="${currentSortColumn}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${currentSortDirection}`);
        }
    }
}

// ========== INPUT VALIDATION ==========
function validateMinutesInput(e) {
    let value = e.target.value;
    

    value = value.replace(/,/g, '.');
    

    value = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit integer part to 9999
    if (parts[0] && parseInt(parts[0]) > 9999) {
        parts[0] = '9999';
        value = parts.join('.');
    }
    
    // Limit decimal part to 2 digits
    if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2);
        value = parts.join('.');
    }
    
    e.target.value = value;
}

function handleMinusInput(e) {
    validateMinutesInput(e);
    updateFloatingLabels();
}

function updateFloatingLabels() {
    const inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(input => {
        if (input.value && input.value !== '') {
            input.classList.add('has-value');
        } else {
            input.classList.remove('has-value');
        }
    });
}

// ========== DECIMAL TO MINUTES CONVERSION ==========
function convertToMinutes(inputValue) {
    if (!inputValue || inputValue === '') return 0;
    
    // Replace comma with dot for consistency
    const normalizedValue = inputValue.toString().replace(',', '.');
    const numValue = parseFloat(normalizedValue);
    
    if (isNaN(numValue) || numValue === 0) return 0;
    
    // If value is between 0.01 and 0.99, treat as minutes
    if (numValue > 0 && numValue < 1) {
        return Math.round(numValue * 100); // 0.45 becomes 45 minutes
    }
    
    // For values >= 1, treat integer part as hours, decimal as minutes
    const hours = Math.floor(numValue);
    const decimalPart = numValue - hours;
    const minutesFromHours = hours * 60;
    const minutesFromDecimal = Math.round(decimalPart * 100);
    
    return minutesFromHours + minutesFromDecimal;
}

// ========== ADD/EDIT PERSON LOGIC ==========
function handleAddPerson() {
    if (isEditing) {
        updatePerson();
    } else {
        addPerson();
    }
}

function addPerson() {
    const nameInput = document.getElementById('personName');
    const plusInput = document.getElementById('plusMinutes');
    const minusInput = document.getElementById('minusMinutes');
    
    // Get values
    let name = nameInput.value.trim();
    const plusMinutes = convertToMinutes(plusInput.value);
    const minusMinutes = convertToMinutes(minusInput.value);
    
    // Auto-generate name if empty
    if (!name) {
        name = `Name${autoNameCounter}`;
        autoNameCounter++;
    } else {
        // Capitalize first letter of each word
        name = capitalizeName(name);
    }
    
    // Convert minus to negative
    const actualMinusMinutes = minusMinutes > 0 ? -minusMinutes : 0;
    
    // Calculate sum
    const sum = plusMinutes + actualMinusMinutes;
    
    // Create person object
    const person = {
        id: personIdCounter++,
        name: name,
        plus: plusMinutes,
        minus: actualMinusMinutes,
        sum: sum
    };
    
    // Add to array
    people.push(person);
    
    // Save and update
    saveToLocalStorage();
    renderTable();
    clearForm();
    focusNameInput();
}

function updatePerson() {
    const nameInput = document.getElementById('personName');
    const plusInput = document.getElementById('plusMinutes');
    const minusInput = document.getElementById('minusMinutes');
    
    // Get values
    let name = nameInput.value.trim();
    const plusMinutes = convertToMinutes(plusInput.value);
    const minusMinutes = convertToMinutes(minusInput.value);
    
    // Auto-generate name if empty
    if (!name) {
        name = `Name${autoNameCounter}`;
        autoNameCounter++;
    } else {
        // Capitalize first letter of each word
        name = capitalizeName(name);
    }
    
    // Convert minus to negative
    const actualMinusMinutes = minusMinutes > 0 ? -minusMinutes : 0;
    
    // Calculate sum
    const sum = plusMinutes + actualMinusMinutes;
    
    // Find and update person
    const personIndex = people.findIndex(p => p.id === editingId);
    if (personIndex !== -1) {
        people[personIndex] = {
            id: editingId,
            name: name,
            plus: plusMinutes,
            minus: actualMinusMinutes,
            sum: sum
        };
    }
    
    // Reset editing state
    isEditing = false;
    editingId = null;
    
    // Update button text
    document.getElementById('addPerson').textContent = '➕ Add Person';
    
    // Save and update
    saveToLocalStorage();
    renderTable();
    clearForm();
    focusNameInput();
}

// ========== EDIT PERSON ==========
function convertMinutesToDecimal(minutes) {
    if (minutes === 0) return '';
    
    const absMinutes = Math.abs(minutes);
    
    // If less than 60 minutes, show as decimal (45 minutes = 0.45)
    if (absMinutes < 60) {
        return (absMinutes / 100).toFixed(2).replace(/\.?0+$/, '');
    }
    
    // For 60+ minutes, convert to hours.minutes format
    const hours = Math.floor(absMinutes / 60);
    const remainingMinutes = absMinutes % 60;
    
    if (remainingMinutes === 0) {
        return hours.toString();
    }
    
    const decimalPart = (remainingMinutes / 100).toFixed(2).substring(1); // Remove leading "0"
    return hours + decimalPart;
}

function editPerson(personId) {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    
    // Fill form with person data
    document.getElementById('personName').value = person.name;
    document.getElementById('plusMinutes').value = convertMinutesToDecimal(person.plus);
    document.getElementById('minusMinutes').value = convertMinutesToDecimal(Math.abs(person.minus));
    
    // Set editing state
    isEditing = true;
    editingId = personId;
    
    // Update button text
    document.getElementById('addPerson').textContent = '✏️ Update Person';
    
    // Update floating labels
    updateFloatingLabels();
    
    // Focus name input
    focusNameInput();
}

// ========== DELETE FUNCTIONS ==========
function deletePerson(personId) {
    people = people.filter(p => p.id !== personId);
    saveToLocalStorage();
    renderTable();
}

function deleteAllPeople() {
    if (people.length === 0) {
        alert('No data to delete!');
        return;
    }
    
    if (confirm('Are you sure you want to delete all entries? This action cannot be undone.')) {
        people = [];
        personIdCounter = 1;
        autoNameCounter = 1;
        

        currentSortColumn = null;
        currentSortDirection = 'asc';
        
        saveToLocalStorage();
        renderTable();
        
        // Reset editing state if active
        if (isEditing) {
            isEditing = false;
            editingId = null;
            document.getElementById('addPerson').textContent = '➕ Add Person';
            clearForm();
        }
    }
}

// ========== RENDER TABLE ==========
function renderTable() {
    const tbody = document.getElementById('minutesTableBody');
    
    if (people.length === 0) {
        tbody.innerHTML = `
            <tr class="no-products">
                <td colspan="5">Add your first person to start tracking minutes! ⏱️</td>
            </tr>
        `;
        hideDeleteAllButton();
        updateSortIndicators();
        return;
    }
    
    tbody.innerHTML = people.map((person, index) => `
        <tr>
            <td class="name-cell" onclick="editPerson(${person.id})" style="cursor: pointer;" title="Click to edit">
                <strong>${person.name}</strong>
            </td>
            <td class="plus-cell">
                ${person.plus > 0 ? '+' + person.plus : person.plus}<span class="min-suffix">min</span>
            </td>
            <td class="minus-cell">
                ${person.minus}<span class="min-suffix">min</span>
            </td>
            <td class="sum-cell ${person.sum >= 0 ? 'positive' : 'negative'}">
            ${person.sum > 0 ? '+' + person.sum : person.sum}<span class="min-suffix">min</span>
            </td>
            <td>
                <button class="delete-btn" onclick="deletePerson(${person.id})" title="Delete entry">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    showDeleteAllButton();
    updateSortIndicators();
}

// ========== DELETE ALL BUTTON ==========
function showDeleteAllButton() {
    let deleteAllBtn = document.getElementById('deleteAllBtn');
    if (!deleteAllBtn) {
        deleteAllBtn = document.createElement('button');
        deleteAllBtn.id = 'deleteAllBtn';
        deleteAllBtn.className = 'btn delete-all-btn';
        deleteAllBtn.textContent = '🗑️ Delete All';
        deleteAllBtn.style.background = 'linear-gradient(135deg, #EF4444, #DC2626)';
        deleteAllBtn.style.marginTop = '20px';
        deleteAllBtn.onclick = deleteAllPeople;
        
        document.querySelector('.table-container').appendChild(deleteAllBtn);
    }
}

function hideDeleteAllButton() {
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.remove();
    }
}

// ========== UTILITY FUNCTIONS ==========
function capitalizeName(name) {
    if (!name || name.trim() === '') return name;
    return name.toLowerCase().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function clearForm() {
    document.getElementById('personName').value = '';
    document.getElementById('plusMinutes').value = '';
    document.getElementById('minusMinutes').value = '';
    updateFloatingLabels();
}

function focusNameInput() {
    setTimeout(() => {
        document.getElementById('personName').focus();
    }, 100);
}

// ========== GLOBAL FUNCTIONS FOR ONCLICK ==========
window.editPerson = editPerson;
window.deletePerson = deletePerson;
window.deleteAllPeople = deleteAllPeople;