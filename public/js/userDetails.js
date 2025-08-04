

    // Global variables
    let currentMode = 'initial'; // 'initial', 'fresh', 'old'
    let doctorMap = {};  // doctorName → doctorID

    
    // Helper functions
    function showMessage(elementId, message, type = 'info') {
        const messageArea = document.getElementById(elementId);
        messageArea.innerHTML = `<div class="${type}-message">${message}</div>`;
    }
    
    function clearMessage(elementId) {
        document.getElementById(elementId).innerHTML = '';
    }
    
    function showInitialForm() {
        document.getElementById('initialFormSection').style.display = 'block';
        document.getElementById('expandedFormSection').style.display = 'none';
        currentMode = 'initial';
        clearMessage('messageArea');
        clearMessage('expandedMessageArea');
    }
    
    function showExpandedForm(mode, errorMsg = null) {
        document.getElementById('initialFormSection').style.display = 'none';
        document.getElementById('expandedFormSection').style.display = 'block';
        currentMode = mode;
        
        // Copy basic info to expanded form
        document.getElementById('username').value = document.getElementById('initialName').value;
        document.getElementById('patientID').value = document.getElementById('initialPatientID').value;
            // Only set doctorID if the element exists
        const doctorIDInput = document.getElementById('doctorID');
        if (doctorIDInput) {
            doctorIDInput.value = document.getElementById('initialDoctor').value;
        }
        
        if (errorMsg) {
            showMessage('expandedMessageArea', errorMsg, 'error');
        } else {
            clearMessage('expandedMessageArea');
        }
    }
    
    // Initial form submission handler
    document.getElementById('initialForm').addEventListener('submit', async function (e) {
    e.preventDefault();

// Collect values
const name = document.getElementById('initialName').value.trim();
const patientID = document.getElementById('initialPatientID').value.trim();
const doctorName = document.getElementById('initialDoctorInput').value.trim();
const opdType = document.getElementById('opdType').value;


// Get doctor ID by matching name from datalist
const doctorOptions = Array.from(document.getElementById('initialDoctorList').options);
const matchedDoctor = doctorOptions.find(opt => opt.value === doctorName);

if (!matchedDoctor) {
    showMessage('messageArea', 'Please select a valid doctor from the suggestions.', 'error');
    return;
}

const doctorID = matchedDoctor.getAttribute('data-id');

// Validate basic fields
if (!name || !patientID || !doctorID || !opdType) {
    showMessage('messageArea', 'Please fill all required fields.', 'error');
    return;
}

// FRESH: Show expanded form
if (opdType === 'fresh') {
    showExpandedForm('fresh');
    return;
}

// OLD: Check existing in DB
if (opdType === 'old') {
    showMessage('messageArea', 'Checking patient details...', 'loading');
    try {
        console.log("Fetching patient...");
        const response = await fetch('/checkExistingPatient', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientID })
        });
        console.log("Got response for check:", response);
        const result = await response.json();
        console.log("Result of checkExistingPatient:", result);

        if (response.ok && result.success) {
            console.log("Patient exists, updating...");
            const updateResp = await fetch('/updateExistingPatient', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientID,
                    patientName: name,
                    doctorID
                })
            });
            console.log("Got response for update:", updateResp);
            // THE FOLLOWING LINE IS MOST LIKELY FAILING!
            const updateJson = await updateResp.json();
            console.log("Update response json:", updateJson);

            if (updateResp.ok && updateJson.success) {
                showMessage('messageArea', '', '');
                document.getElementById('popupTitle').textContent = 'Patient Updated!';
                document.getElementById('displayPatientId').textContent = patientID;
                document.getElementById('popupTitle').textContent = 'Patient Updated!';

                document.getElementById('patientIdPopup').style.display = 'block';
                return;
            } else {
                showMessage('messageArea', updateJson.message || 'Failed to update patient information.', 'error');
                return;
            }
        } else {
            showExpandedForm('old', `No patient found with ID "${patientID}". Please fill the complete registration form.`);
            return;
        }
    } catch (err) {
        console.error("ERROR in OLD OPD handler:", err);
        showMessage('messageArea', 'Error checking patient details. Please try again.', 'error');
    }
}
});




    // Expanded form submission handler
    document.getElementById('expandedForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => { 
            data[key] = value; 
        });

            // Convert doctor name to ID
        const doctorName = data.initialDoctor;
        if (doctorMap[doctorName]) {
            data.doctorID = doctorMap[doctorName];
            delete data.initialDoctor;
        } else {
            showMessage('expandedMessageArea', 'Please select a valid doctor from the list.', 'error');
            return;
        }
                
        showMessage('expandedMessageArea', 'Processing registration...', 'loading');
        
        try {
            const endpoint = currentMode === 'fresh' ? '/registerFreshPatient' : '/registerOldPatient';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
    if (response.ok && result.success) {
        const popupTitle = document.getElementById('popupTitle');
        const popupMessage = document.getElementById('popupMessage');
        const displayPatientId = document.getElementById('displayPatientId');
        

        if (popupTitle) popupTitle.textContent = 'Registration Successful!';
        if (popupMessage) popupMessage.textContent = 'Patient registered successfully.';
        if (displayPatientId) displayPatientId.textContent = result.patientID;

        document.getElementById('patientIdPopup').style.display = 'block';
    }
    else {
                showMessage('expandedMessageArea', result.message || 'Registration failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error registering patient:', error);
            showMessage('expandedMessageArea', 'Error during registration. Please try again.', 'error');
        }
    });
    
    // Back button handler
    document.getElementById('backBtn').addEventListener('click', function() {
        showInitialForm();
        // Reset initial form
        document.getElementById('initialForm').reset();
    });
    
    // Popup close handler
    document.getElementById('closePopup').addEventListener('click', function() {
        document.getElementById('patientIdPopup').style.display = 'none';
        // Reset forms and go back to initial
        document.getElementById('initialForm').reset();
        document.getElementById('expandedForm').reset();
        showInitialForm();
    });

const doctorInput = document.getElementById('initialDoctorInput');
const doctorList = document.getElementById('doctorList');

// Function to fetch doctors (with or without query)
async function fetchDoctors(query = '') {
try {
    const res = await fetch(`/searchDoctors?q=${encodeURIComponent(query)}`);
    const result = await res.json();

    if (result.success) {
        doctorList.innerHTML = '';
        doctorMap = {};  // reset the map

        result.doctors.forEach(doctor => {
            const opt = document.createElement('option');
            opt.value = doctor.doctorName;
            opt.setAttribute('data-id', doctor.doctorID);
            doctorList.appendChild(opt);

            // Save to map
            doctorMap[doctor.doctorName] = doctor.doctorID;
        });
    }
} catch (err) {
    console.error("Doctor fetch failed:", err);
}
}

const initialDoctorInput = document.getElementById('initialDoctorInput');
const initialDoctorList = document.getElementById('initialDoctorList');

async function fetchInitialDoctors(query = '') {
try {
    const res = await fetch(`/searchDoctors?q=${encodeURIComponent(query)}`);
    const result = await res.json();

    if (result.success) {
        initialDoctorList.innerHTML = ''; // Clear old options
        result.doctors.forEach(doctor => {
            const opt = document.createElement('option');
            opt.value = doctor.doctorName;
            opt.setAttribute('data-id', doctor.doctorID);
            initialDoctorList.appendChild(opt);
        });
    }
} catch (err) {
    console.error("Doctor fetch failed for initial form:", err);
}
}

// Filter as user types
initialDoctorInput.addEventListener('input', function () {
const query = this.value.trim();
fetchInitialDoctors(query);
});



// Load all doctors on page load
document.addEventListener('DOMContentLoaded', () => {
fetchDoctors();
fetchInitialDoctors(); 
});

// Filter on input
doctorInput.addEventListener('input', function () {
const query = this.value.trim();
fetchDoctors(query);
});
