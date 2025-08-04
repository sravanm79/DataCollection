let currentMode = 'initial'; // 'initial', 'fresh', 'old'
let doctorMap = {};  // doctorName → doctorID

function showMessage(elementId, message, type = 'info') {
    const messageArea = document.getElementById(elementId);
    if (messageArea) {
        messageArea.innerHTML = `<div class="${type}-message">${message}</div>`;
    }
}

function clearMessage(elementId) {
    const messageArea = document.getElementById(elementId);
    if (messageArea) {
        messageArea.innerHTML = '';
    }
}

function showInitialForm() {
    document.getElementById('initialFormSection').style.display = 'block';
    document.getElementById('expandedFormSection').style.display = 'none';
    currentMode = 'initial';
    clearMessage('messageArea');
    clearMessage('expandedMessageArea');
}

function showExpandedForm(mode, errorMsg = null, doctorIDFromInitial = '', doctorNameFromInitial = '') {
    document.getElementById('initialFormSection').style.display = 'none';
    document.getElementById('expandedFormSection').style.display = 'block';
    currentMode = mode;

    document.getElementById('username').value = document.getElementById('initialName').value;
    document.getElementById('patientID').value = document.getElementById('initialPatientID').value;
    document.getElementById('doctorID').value = doctorIDFromInitial || '';
    document.getElementById('selectedDoctorName').value = doctorNameFromInitial || '';

    if (errorMsg) {
        showMessage('expandedMessageArea', errorMsg, 'error');
    } else {
        clearMessage('expandedMessageArea');
    }
}

// Unified doctor fetch
async function fetchDoctors(query = '') {
    try {
        const res = await fetch(`/searchDoctors?q=${encodeURIComponent(query)}`);
        const result = await res.json();

        if (result.success) {
            const initialDoctorList = document.getElementById('initialDoctorList');
            if (!initialDoctorList) return;
            initialDoctorList.innerHTML = '';
            doctorMap = {};

            result.doctors.forEach(doctor => {
                const opt = document.createElement('option');
                opt.value = doctor.doctorName;
                opt.setAttribute('data-id', doctor.doctorID);
                initialDoctorList.appendChild(opt);
                doctorMap[doctor.doctorName] = doctor.doctorID;
            });
        }
    } catch (err) {
        console.error("Doctor fetch failed:", err);
    }
}

// On page load
document.addEventListener('DOMContentLoaded', () => {
    fetchDoctors();

    document.getElementById('initialDoctorInput').addEventListener('input', function () {
        const query = this.value.trim();
        fetchDoctors(query);
    });

    document.getElementById('initialForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const name = document.getElementById('initialName').value.trim();
        const patientID = document.getElementById('initialPatientID').value.trim();
        const doctorName = document.getElementById('initialDoctorInput').value.trim();
        const opdType = document.getElementById('opdType').value;

        const doctorOptions = Array.from(document.getElementById('initialDoctorList').options);
        const matchedDoctor = doctorOptions.find(opt => opt.value === doctorName);
        if (!matchedDoctor) {
            showMessage('messageArea', 'Please select a valid doctor from the suggestions.', 'error');
            return;
        }

        const doctorID = matchedDoctor.getAttribute('data-id');
        if (!name || !patientID || !doctorID || !opdType) {
            showMessage('messageArea', 'Please fill all required fields.', 'error');
            return;
        }

        if (opdType === 'fresh') {
            showExpandedForm('fresh', null, doctorID, doctorName);
            return;
        }

        if (opdType === 'old') {
            showMessage('messageArea', 'Checking patient details...', 'loading');
            try {
                const response = await fetch('/checkExistingPatient', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patientID })
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    const updateResp = await fetch('/updateExistingPatient', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            patientID,
                            patientName: name,
                            doctorID
                        })
                    });

                    const updateJson = await updateResp.json();
                    if (updateResp.ok && updateJson.success) {
                        const popup = document.getElementById('patientIdPopup');
                        const popupTitle = document.getElementById('popupTitle');
                        const displayPatientId = document.getElementById('displayPatientId');
                        if (popup && popupTitle && displayPatientId) {
                            popupTitle.textContent = 'Patient Updated!';
                            popupMessage.textContent = 'Existing patient record was updated successfully.';
                            displayPatientId.textContent = patientID;
                            popup.style.display = 'block';
                        }
                    } else {
                        showMessage('messageArea', updateJson.message || 'Failed to update patient.', 'error');
                    }
                } else {
                    showExpandedForm('old', `No patient found with ID "${patientID}". Please fill full form.`, doctorID, doctorName);
                }
            } catch (err) {
                console.error("ERROR in OLD OPD handler:", err);
                showMessage('messageArea', 'Error checking patient. Try again.', 'error');
            }
        }
    });

    document.getElementById('expandedForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => data[key] = value);

        if (!data.doctorID) {
            showMessage('expandedMessageArea', 'Doctor ID missing. Please go back and select again.', 'error');
            return;
        }

        showMessage('expandedMessageArea', 'Processing registration...', 'loading');

        try {
            const endpoint = currentMode === 'fresh' ? '/registerFreshPatient' : '/registerOldPatient';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok && result.success) {
                const popup = document.getElementById('patientIdPopup');
                const popupTitle = document.getElementById('popupTitle');
                const popupMessage = document.getElementById('popupMessage');
                const displayPatientId = document.getElementById('displayPatientId');
                if (popup && popupTitle && popupMessage && displayPatientId) {
                    popupTitle.textContent = 'Registration Successful!';
                    popupMessage.textContent = 'Patient registered successfully.';
                    displayPatientId.textContent = result.patientID;
                    popup.style.display = 'block';
                }
            } else {
                showMessage('expandedMessageArea', result.message || 'Registration failed. Try again.', 'error');
            }
        } catch (error) {
            console.error('Error registering patient:', error);
            showMessage('expandedMessageArea', 'Error during registration. Try again.', 'error');
        }
    });

    document.getElementById('backBtn').addEventListener('click', () => {
        showInitialForm();
        document.getElementById('initialForm').reset();
    });

    document.getElementById('closePopup').addEventListener('click', () => {
        document.getElementById('patientIdPopup').style.display = 'none';
        document.getElementById('initialForm').reset();
        document.getElementById('expandedForm').reset();
        showInitialForm();
    });
});
