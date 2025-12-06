// ---------------- DOM Elements ----------------
const patientIdInput = document.getElementById('patientId');
const checkPatientIdBtn = document.getElementById('checkPatientIdBtn');
const registerPatientBtn = document.getElementById('registerPatientBtn');
const messageDisplay = document.getElementById('messageDisplay');
const doctorDropdownContainer = document.getElementById('doctorDropdownContainer');
const doctorSelect = document.getElementById('doctorSelect');
const liveWaveformCanvas = document.getElementById('liveWaveformCanvas');
const recordedWaveformCanvas = document.getElementById('recordedWaveformCanvas');
const startRecordingBtn = document.getElementById('startRecordingBtn');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const submitRecordingBtn = document.getElementById('submitRecordingBtn');
const audioPlayer = document.getElementById('audioPlayer');
const playRecordedAudioBtn = document.getElementById('playRecordedAudioBtn');
const downloadRecordingBtn = document.getElementById('downloadRecordingBtn');

// ---------------- State Variables ----------------
let isPatientValid = false;
let isRecording = false;
let recordedAudioBlob = null;
let audioContext = null;
let analyser = null;
let microphoneStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let vadInterval;

const VAD_THRESHOLD = 0.01;

// ---------------- Helper Functions ----------------
function updateMessage(msg, type='info') {
    messageDisplay.textContent = msg;
    messageDisplay.classList.remove('hidden','bg-red-100','text-red-700','bg-green-100','text-green-700','bg-blue-100','text-blue-700');
    if(type==='error') messageDisplay.classList.add('bg-red-100','text-red-700');
    else if(type==='success') messageDisplay.classList.add('bg-green-100','text-green-700');
    else messageDisplay.classList.add('bg-blue-100','text-blue-700');
}

function setButtonStates() {
    patientIdInput.disabled = isRecording;
    checkPatientIdBtn.disabled = isRecording || !patientIdInput.value.trim();
    startRecordingBtn.disabled = !isPatientValid || isRecording;
    stopRecordingBtn.disabled = !isRecording;
    submitRecordingBtn.disabled = !recordedAudioBlob;
    playRecordedAudioBtn.disabled = !recordedAudioBlob;
    downloadRecordingBtn.disabled = !recordedAudioBlob;
    registerPatientBtn.classList.toggle('hidden', isPatientValid || !patientIdInput.value.trim());
    doctorDropdownContainer.classList.toggle('hidden', !isPatientValid);
}

// ---------------- Fetch Doctors ----------------
async function fetchDoctors() {
    try {
        const res = await fetch('/searchDoctors');
        const data = await res.json();
        if(data.success) {
            doctorSelect.innerHTML = '';
            data.doctors.forEach(d => {
                const option = document.createElement('option');
                option.value = d.doctorID;
                option.text = d.doctorName;
                doctorSelect.appendChild(option);
            });
        }
    } catch(err) {
        console.error(err);
        updateMessage('Failed to fetch doctors','error');
    }
}

// ---------------- Check Patient ID ----------------
async function checkPatientId() {
    const pId = patientIdInput.value.trim();
    if(!pId) return updateMessage('Enter Speaker ID','error');

    updateMessage('Checking Speaker ID...');
    try {
        const res = await fetch('/checkPatient', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ patientID: pId })
        });
        const data = await res.json();

        if(res.ok && data.success) {
            isPatientValid = true;
            updateMessage(`Speaker ID "${pId}" found.`, 'success');
            await fetchDoctors();  // populate doctor dropdown
        } else {
            isPatientValid = false;
            updateMessage(`Speaker ID "${pId}" not found. Please register.`, 'error');
            registerPatientBtn.classList.remove('hidden');
        }
    } catch(err) {
        updateMessage('Error checking ID: '+err.message,'error');
        isPatientValid = false;
    }
    setButtonStates();
}

// ---------------- Microphone & Waveform ----------------
async function initMicrophone() {
    if(!audioContext) audioContext = new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended') await audioContext.resume();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
        microphoneStream = stream;
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        drawLiveWaveform();
        return true;
    } catch(err) {
        updateMessage('Microphone access error: '+err.message,'error');
        return false;
    }
}

function drawLiveWaveform() {
    const canvasCtx = liveWaveformCanvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);
        canvasCtx.fillStyle = '#f9f9f9';
        canvasCtx.fillRect(0,0,liveWaveformCanvas.width, liveWaveformCanvas.height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#ff0000';
        canvasCtx.beginPath();
        const sliceWidth = liveWaveformCanvas.width / bufferLength;
        let x = 0;
        for(let i=0;i<bufferLength;i++){
            const v = dataArray[i]/128.0 - 1.0;
            const y = (v*liveWaveformCanvas.height/2)+(liveWaveformCanvas.height/2);
            if(i===0) canvasCtx.moveTo(x,y);
            else canvasCtx.lineTo(x,y);
            x += sliceWidth;
        }
        canvasCtx.stroke();
    }
    draw();
}

// ---------------- Recording ----------------
async function startRecording() {
    if(!isPatientValid) return updateMessage('Validate patient ID first','error');
    const micReady = await initMicrophone();
    if(!micReady) return;

    recordedChunks = [];
    isRecording = true;
    updateMessage('Recording...');
    setButtonStates();

    mediaRecorder = new MediaRecorder(microphoneStream);
    mediaRecorder.ondataavailable = e=>{ if(e.data.size>0) recordedChunks.push(e.data); };
    mediaRecorder.start();

    const sampleBuffer = new Float32Array(analyser.fftSize);
    vadInterval = setInterval(()=>{
        analyser.getFloatTimeDomainData(sampleBuffer);
        const rms = Math.sqrt(sampleBuffer.reduce((sum,v)=>sum+v*v,0)/sampleBuffer.length);
        if(rms < VAD_THRESHOLD && mediaRecorder.state==='recording') mediaRecorder.pause();
        if(rms >= VAD_THRESHOLD && mediaRecorder.state==='paused') mediaRecorder.resume();
    },100);
}

function stopRecording() {
    if(mediaRecorder && mediaRecorder.state!=='inactive') mediaRecorder.stop();
    isRecording = false;
    clearInterval(vadInterval);

    mediaRecorder.onstop = async ()=>{
        const webmBlob = new Blob(recordedChunks,{type:'audio/webm'});
        recordedAudioBlob = await convertToWav(webmBlob);
        drawRecordedWaveform(recordedAudioBlob);
        updateMessage('Recording stopped. Ready to submit.','success');
        setButtonStates();
    };
    setButtonStates();
}

// ---------------- Convert WebM to WAV ----------------
async function convertToWav(webmBlob) {
    const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    function writeString(view, offset, str){
        for(let i=0;i<str.length;i++) view.setUint8(offset+i,str.charCodeAt(i));
    }

    writeString(view,0,'RIFF'); view.setUint32(4,36+length,true); writeString(view,8,'WAVE');
    writeString(view,12,'fmt '); view.setUint32(16,16,true); view.setUint16(20,1,true);
    view.setUint16(22,numChannels,true); view.setUint32(24,sampleRate,true);
    view.setUint32(28,sampleRate*numChannels*2,true); view.setUint16(32,numChannels*2,true);
    view.setUint16(34,16,true); writeString(view,36,'data'); view.setUint32(40,length,true);

    let offset=44;
    const interleaved = [];
    for(let i=0;i<audioBuffer.length;i++){
        for(let ch=0;ch<numChannels;ch++){
            interleaved.push(audioBuffer.getChannelData(ch)[i]);
        }
    }
    for(let i=0;i<interleaved.length;i++){
        const s=Math.max(-1,Math.min(1,interleaved[i]));
        view.setInt16(offset,s*0x7FFF,true); offset+=2;
    }
    return new Blob([view],{type:'audio/wav'});
}

// ---------------- Draw Recorded Waveform ----------------
async function drawRecordedWaveform(blob){
    const ctx = recordedWaveformCanvas.getContext('2d');
    ctx.clearRect(0,0,recordedWaveformCanvas.width,recordedWaveformCanvas.height);
    if(!blob) return;

    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length/recordedWaveformCanvas.width);
    const amp = recordedWaveformCanvas.height/2;

    ctx.beginPath();
    ctx.strokeStyle='#3B82F6';
    ctx.lineWidth=1;
    for(let i=0;i<recordedWaveformCanvas.width;i++){
        let min=1,max=-1;
        for(let j=0;j<step;j++){
            const val = data[(i*step)+j];
            if(val<min) min=val;
            if(val>max) max=val;
        }
        ctx.lineTo(i,(1+min)*amp);
        ctx.lineTo(i,(1+max)*amp);
    }
    ctx.stroke();
}

// ---------------- Timestamped Filename ----------------
function getTimestampedFileName(patientID) {
    const now = new Date();
    const istOffset = 5.5 * 60;
    const localOffset = now.getTimezoneOffset();
    const istTime = new Date(now.getTime() + (istOffset + localOffset) * 60000);

    const dd = String(istTime.getDate()).padStart(2,'0');
    const mm = String(istTime.getMonth()+1).padStart(2,'0');
    const yyyy = istTime.getFullYear();
    const HH = String(istTime.getHours()).padStart(2,'0');
    const MN = String(istTime.getMinutes()).padStart(2,'0');
    const SS = String(istTime.getSeconds()).padStart(2,'0');

    return `${patientID}_${dd}${mm}${yyyy}_${HH}${MN}${SS}.wav`;
}

// ---------------- Submit / Download / Play ----------------
async function submitRecording() {
    if(!recordedAudioBlob) return updateMessage('No audio to submit','error');
    const pId = patientIdInput.value.trim();
    const doctorName = doctorSelect.options[doctorSelect.selectedIndex].text; // get the name
    const filename = getTimestampedFileName(pId);

    if(!doctorName) return updateMessage('Please select a doctor','error');

    const formData = new FormData();
    formData.append('patientId', pId);
    formData.append('doctorName', doctorName);  // ✅ pass doctor name here
    formData.append('audioFile', recordedAudioBlob, filename);

    updateMessage('Submitting recording...');
    try {
        const res = await fetch('/uploadRecording',{method:'POST',body:formData});
        const data = await res.json();
        if(res.ok && data.success){
            updateMessage('Recording submitted successfully','success');
            recordedAudioBlob = null;
            drawRecordedWaveform(null);
        } else updateMessage(data.message||'Failed to submit','error');
    } catch(err){
        updateMessage('Error: '+err.message,'error');
    }
    setButtonStates();
}

function playAudio() {
    if(!recordedAudioBlob) return;
    audioPlayer.src = URL.createObjectURL(recordedAudioBlob);
    audioPlayer.play();
}

function downloadRecording() {
    if(!recordedAudioBlob) return updateMessage('No recording to download','error');
    const pId = patientIdInput.value.trim() || 'unknown';
    const filename = getTimestampedFileName(pId);

    const url = URL.createObjectURL(recordedAudioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    updateMessage('Recording downloaded to your device.','success');
}

// ---------------- Event Listeners ----------------
patientIdInput.addEventListener('input',()=>{isPatientValid=false; updateMessage(''); setButtonStates();});
checkPatientIdBtn.addEventListener('click',checkPatientId);
startRecordingBtn.addEventListener('click',startRecording);
stopRecordingBtn.addEventListener('click',stopRecording);
submitRecordingBtn.addEventListener('click',submitRecording);
playRecordedAudioBtn.addEventListener('click',playAudio);
downloadRecordingBtn.addEventListener('click',downloadRecording);

// ---------------- Initial Setup ----------------
setButtonStates();
