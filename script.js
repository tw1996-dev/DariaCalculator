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
    
    // Input validation
    document.getElementById('plusHours').addEventListener('input', validateIntegerInput);
    document.getElementById('plusMinutes').addEventListener('input', validateIntegerInput);
    document.getElementById('minusHours').addEventListener('input', validateIntegerInput);
    document.getElementById('minusMinutes').addEventListener('input', validateIntegerInput);
    
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
                valueA = a.totalPlus;
                valueB = b.totalPlus;
                break;
            case 'minus':
                valueA = a.totalMinus;
                valueB = b.totalMinus;
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
function validateIntegerInput(e) {
    let value = e.target.value;
    
    // Allow only digits
    value = value.replace(/[^0-9]/g, '');
    
    // Limit to 9999
    if (parseInt(value) > 9999) {
        value = '9999';
    }
    
    e.target.value = value;
}

function updateFloatingLabels() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        if (input.value && input.value !== '') {
            input.classList.add('has-value');
        } else {
            input.classList.remove('has-value');
        }
    });
}

// ========== FORMAT FUNCTIONS ==========
function formatHoursAndMinutes(hours, minutes, isNegative = false, isTotal = false) {
    const sign = isNegative ? '-' : '';
    let result = '';
    
    if (hours > 0) {
        result += `${hours}t`;
    }
    
    if (minutes > 0) {
        if (hours > 0) result += ' ';
        result += `${minutes}<span class="${isTotal ? 'min-suffix-total' : 'min-suffix'}">min</span>`;
    }
    
    if (result === '') {
        return '0';
    }
    
    return sign + result;
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
    const plusHoursInput = document.getElementById('plusHours');
    const plusMinutesInput = document.getElementById('plusMinutes');
    const minusHoursInput = document.getElementById('minusHours');
    const minusMinutesInput = document.getElementById('minusMinutes');
    
    // Get values
    let name = nameInput.value.trim();
    const plusHours = parseInt(plusHoursInput.value) || 0;
    const plusMinutes = parseInt(plusMinutesInput.value) || 0;
    const minusHours = parseInt(minusHoursInput.value) || 0;
    const minusMinutes = parseInt(minusMinutesInput.value) || 0;
    
    // Auto-generate name if empty
    if (!name) {
        name = `Name${autoNameCounter}`;
        autoNameCounter++;
    } else {
        // Capitalize first letter of each word
        name = capitalizeName(name);
    }
    
    // Calculate totals for sorting/calculations
    const totalPlusMinutes = (plusHours * 60) + plusMinutes;
    const totalMinusMinutes = (minusHours * 60) + minusMinutes;
    const actualTotalMinus = totalMinusMinutes > 0 ? -totalMinusMinutes : 0;
    const sum = totalPlusMinutes + actualTotalMinus;
    
    // Create person object with separate hours and minutes
    const person = {
        id: personIdCounter++,
        name: name,
        plusHours: plusHours,
        plusMinutes: plusMinutes,
        minusHours: minusHours,
        minusMinutes: minusMinutes,
        totalPlus: totalPlusMinutes,
        totalMinus: actualTotalMinus,
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
    const plusHoursInput = document.getElementById('plusHours');
    const plusMinutesInput = document.getElementById('plusMinutes');
    const minusHoursInput = document.getElementById('minusHours');
    const minusMinutesInput = document.getElementById('minusMinutes');
    
    // Get values
    let name = nameInput.value.trim();
    const plusHours = parseInt(plusHoursInput.value) || 0;
    const plusMinutes = parseInt(plusMinutesInput.value) || 0;
    const minusHours = parseInt(minusHoursInput.value) || 0;
    const minusMinutes = parseInt(minusMinutesInput.value) || 0;
    
    // Auto-generate name if empty
    if (!name) {
        name = `Name${autoNameCounter}`;
        autoNameCounter++;
    } else {
        // Capitalize first letter of each word
        name = capitalizeName(name);
    }
    
    // Calculate totals for sorting/calculations
    const totalPlusMinutes = (plusHours * 60) + plusMinutes;
    const totalMinusMinutes = (minusHours * 60) + minusMinutes;
    const actualTotalMinus = totalMinusMinutes > 0 ? -totalMinusMinutes : 0;
    const sum = totalPlusMinutes + actualTotalMinus;
    
    // Find and update person
    const personIndex = people.findIndex(p => p.id === editingId);
    if (personIndex !== -1) {
        people[personIndex] = {
            id: editingId,
            name: name,
            plusHours: plusHours,
            plusMinutes: plusMinutes,
            minusHours: minusHours,
            minusMinutes: minusMinutes,
            totalPlus: totalPlusMinutes,
            totalMinus: actualTotalMinus,
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
function editPerson(personId) {
    const person = people.find(p => p.id === personId);
    if (!person) return;
    
    // Fill form with person data 
    document.getElementById('personName').value = person.name;
    document.getElementById('plusHours').value = person.plusHours || '';
    document.getElementById('plusMinutes').value = person.plusMinutes || '';
    document.getElementById('minusHours').value = person.minusHours || '';
    document.getElementById('minusMinutes').value = person.minusMinutes || '';
    
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

// ========== TOTAL CALCULATION ==========
function calculateTotal() {
    return people.reduce((total, person) => total + person.sum, 0);
}

function showTotal() {
    const total = calculateTotal();
    
    let totalElement = document.getElementById('totalDisplay');
    if (!totalElement) {
        totalElement = document.createElement('div');
        totalElement.id = 'totalDisplay';
        totalElement.className = 'total-display';
        

        const deleteAllBtn = document.getElementById('deleteAllBtn');
        if (deleteAllBtn) {
            deleteAllBtn.parentNode.insertBefore(totalElement, deleteAllBtn);
        } else {
            document.querySelector('.table-container').appendChild(totalElement);
        }
    }
    
    // Format total as hours and minutes
    const absTotal = Math.abs(total);
    const hours = Math.floor(absTotal / 60);
    const minutes = absTotal % 60;
    const isNegative = total < 0;
    
    totalElement.innerHTML = `
        <strong>TOTAL: <span class="${total >= 0 ? 'total-positive' : 'total-negative'}">${formatHoursAndMinutes(hours, minutes, isNegative, true)}</span></strong>
    `;
}

function hideTotal() {
    const totalElement = document.getElementById('totalDisplay');
    if (totalElement) {
        totalElement.remove();
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
        hideTotal();
        updateSortIndicators();
        return;
    }
    
    tbody.innerHTML = people.map((person, index) => `
        <tr>
            <td class="name-cell" onclick="editPerson(${person.id})" style="cursor: pointer;" title="Click to edit">
                <strong>${person.name}</strong>
            </td>
            <td class="plus-cell">
                ${person.totalPlus > 0 ? '+' : ''}${formatHoursAndMinutes(person.plusHours, person.plusMinutes)}
            </td>
            <td class="minus-cell">
                ${formatHoursAndMinutes(person.minusHours, person.minusMinutes, true)}
            </td>
            <td class="sum-cell ${person.sum >= 0 ? 'positive' : 'negative'}">
                ${person.sum > 0 ? '+' : ''}${formatHoursAndMinutes(Math.floor(Math.abs(person.sum) / 60), Math.abs(person.sum) % 60, person.sum < 0)}
            </td>
            <td>
                <button class="delete-btn" onclick="deletePerson(${person.id})" title="Delete entry">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
    
    showDeleteAllButton();
    showTotal();
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
    document.getElementById('plusHours').value = '';
    document.getElementById('plusMinutes').value = '';
    document.getElementById('minusHours').value = '';
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