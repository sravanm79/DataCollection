let mediaRecorder;
let chunks = [];
let audioStream;
let recordedPatientID = '';

const patientIDInput = document.getElementById('patientID');
const checkPatientForm = document.getElementById('checkPatientForm');
const consentPatientIDHidden = document.getElementById('consentPatientID');
const cpaAudio = document.getElementById('CPAudio');
const recordingImg = document.getElementById('recordingImg');
const stoppedRec = document.getElementById('stoppedRec');
const finalAgreeBtn = document.getElementById('finalAgreeBtn');
const finalDisagreeBtn = document.getElementById('finalDisagreeBtn');
const consentPreAudioDiv = document.querySelector('.consentPreAudio');
const recIconDiv = document.querySelector('.recIcon');
const submitConsentFormDiv = document.getElementById('submitConsentForm');

// Setup audio-only recording
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    audioStream = stream;
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        chunks = [];

        const formData = new FormData();
        formData.append('consentAudio', blob, recordedPatientID + '_consentAudio.webm');
        formData.append('patientID', recordedPatientID);

        try {
            const uploadResponse = await fetch('/uploadConsentAudio', {
                method: 'POST',
                body: formData,
            });

            if (uploadResponse.ok) {
                console.log("Consent audio uploaded.");
            } else {
                console.error("Upload failed:", await uploadResponse.text());
                alert("Failed to upload audio.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Network error uploading audio.");
        }

        recordingImg.style.display = 'none';
        stoppedRec.style.display = 'inline';
        finalAgreeBtn.disabled = false;
        finalDisagreeBtn.disabled = false;
    };
}).catch(err => {
    console.error("Mic access error:", err);
    alert("Microphone access is required.");
    checkPatientForm.querySelector('input[type="submit"]').disabled = true;
});

// Handle Patient ID submission
checkPatientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    recordedPatientID = patientIDInput.value.trim();
    if (!recordedPatientID) return alert("Enter Patient ID.");

    const resp = await fetch('/checkPatient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientID: recordedPatientID })
    });
    const json = await resp.json();

    if (json.success) {
        consentPatientIDHidden.value = recordedPatientID;
        consentPreAudioDiv.style.display = '';
        recIconDiv.style.display = '';
        submitConsentFormDiv.style.display = '';
        checkPatientForm.style.display = 'none';
        initiateConsentRecording();
    } else {
        alert("Patient not found.");
        patientIDInput.value = '';
    }
});

// Consent process: play audio, beep, record 10s, beep
function initiateConsentRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'recording') return;

    finalAgreeBtn.disabled = true;
    finalDisagreeBtn.disabled = true;

    // Start playback
    cpaAudio.play();

    // After consent audio finishes
    cpaAudio.onended = () => {
        new Audio('./sounds/beep.wav').play();

        setTimeout(() => {
            if (mediaRecorder.state === 'inactive') {
                mediaRecorder.start();
                recordingImg.style.display = 'inline';
                stoppedRec.style.display = 'none';
            }
        }, 0);

        // Stop recording after 10 seconds
        setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
                new Audio('./sounds/beep.wav').play();
                mediaRecorder.stop();
                audioStream.getTracks().forEach(track => track.stop());

            }
        }, 10000);
    };
}

// Submit YES
document.getElementById('submitConsentForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
        const res = await fetch('/submitConsent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientID: recordedPatientID, consentGiven: 'Yes' })
        });
        if (!res.ok) throw new Error("Failed to update consent.");
        alert("Consent: YES recorded.");
        resetConsentUI();
    } catch (err) {
        alert("Error updating consent.");
    }
});

// Submit NO
document.getElementById('finalDisagreeBtn').addEventListener('click', async () => {
    await fetch('/submitConsent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientID: recordedPatientID, consentGiven: 'No' })
    });
    alert("Consent: NO recorded.");
    resetConsentUI();
});

function resetConsentUI() {
    consentPreAudioDiv.style.display = 'none';
    recIconDiv.style.display = 'none';
    submitConsentFormDiv.style.display = 'none';
    checkPatientForm.style.display = '';
    patientIDInput.value = '';
    recordingImg.style.display = 'none';
    stoppedRec.style.display = 'none';
    finalAgreeBtn.disabled = true;
    finalDisagreeBtn.disabled = true;
}
