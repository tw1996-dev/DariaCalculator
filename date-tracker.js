// Date Tracker Extension for Minutes Tracker
// This script adds date tracking functionality without modifying the original code

(function() {
    'use strict';
    
    // Wait for DOM and original script to load
    let originalInterval = setInterval(() => {
        if (typeof people !== 'undefined' && typeof renderTable !== 'undefined') {
            clearInterval(originalInterval);
            initializeDateTracker();
        }
    }, 100);
    
    function initializeDateTracker() {
        // Store original functions
        const originalAddPerson = window.addPerson;
        const originalUpdatePerson = window.updatePerson;
        const originalRenderTable = window.renderTable;
        const originalLoadFromLocalStorage = window.loadFromLocalStorage;
        
        // Override addPerson to include date
        window.addPerson = function() {
            // Call original function first
            const originalLength = people.length;
            originalAddPerson.call(this);
            
            // If a new person was added, add the date
            if (people.length > originalLength) {
                const newPerson = people[people.length - 1];
                newPerson.dateAdded = getCurrentDateString();
                saveToLocalStorage(); // Save with the new date
            }
        };
        
        // Override updatePerson to preserve original date or add new one
        window.updatePerson = function() {
            // Find the person being edited to preserve their original date
            const editingPersonIndex = people.findIndex(p => p.id === editingId);
            const originalDate = editingPersonIndex !== -1 ? people[editingPersonIndex].dateAdded : null;
            
            // Call original function
            originalUpdatePerson.call(this);
            
            // Restore or add date
            if (editingPersonIndex !== -1) {
                people[editingPersonIndex].dateAdded = originalDate || getCurrentDateString();
                saveToLocalStorage();
            }
        };
        
        // Override renderTable to include dates in display
        window.renderTable = function() {
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
            
            tbody.innerHTML = people.map((person, index) => {
                const dateDisplay = person.dateAdded ? `<div class="date-added">${person.dateAdded}</div>` : '';
                
                return `
                    <tr>
                        <td class="name-cell" onclick="editPerson(${person.id})" style="cursor: pointer;" title="Click to edit">
                            <div class="name-wrapper">
                                <strong>${person.name}</strong>
                                ${dateDisplay}
                            </div>
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
                `;
            }).join('');
            
            showDeleteAllButton();
            showTotal();
            updateSortIndicators();
        };
        
        // Add date to existing people who don't have it (for backward compatibility)
        window.loadFromLocalStorage = function() {
            originalLoadFromLocalStorage.call(this);
            
            // Add dates to existing people who don't have them
            let needsSave = false;
            people.forEach(person => {
                if (!person.dateAdded) {
                    person.dateAdded = getCurrentDateString();
                    needsSave = true;
                }
            });
            
            if (needsSave) {
                saveToLocalStorage();
            }
        };
        

        
        // Trigger initial load with date functionality
        loadFromLocalStorage();
        renderTable();
    }
    
    function getCurrentDateString() {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${day}.${month}`;
    }
    

    
})();