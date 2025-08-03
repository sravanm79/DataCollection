 //
        // Utility function to convert WebM Blob to WAV Blob
        const convertToWav = async (webmBlob) => {
        return new Promise((resolve, reject) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const fileReader = new FileReader();

            fileReader.onload = async () => {
                try {
                    const arrayBuffer = fileReader.result;
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    const numChannels = audioBuffer.numberOfChannels;
                    const sampleRate = audioBuffer.sampleRate;
                    const format = 1; // PCM
                    const bitDepth = 16;
                    const bytesPerSample = bitDepth / 8;
                    const length = audioBuffer.length * numChannels * bytesPerSample;

                    const buffer = new ArrayBuffer(44 + length);
                    const view = new DataView(buffer);

                    // WAV Header
                    writeString(view, 0, 'RIFF');
                    view.setUint32(4, 36 + length, true);
                    writeString(view, 8, 'WAVE');
                    writeString(view, 12, 'fmt ');
                    view.setUint32(16, 16, true);
                    view.setUint16(20, format, true);
                    view.setUint16(22, numChannels, true);
                    view.setUint32(24, sampleRate, true);
                    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
                    view.setUint16(32, numChannels * bytesPerSample, true);
                    view.setUint16(34, bitDepth, true);
                    writeString(view, 36, 'data');
                    view.setUint32(40, length, true);

                    // Interleave and write audio samples
                    const interleaved = interleaveChannels(audioBuffer);
                    let offset = 44;
                    for (let i = 0; i < interleaved.length; i++) {
                        const sample = Math.max(-1, Math.min(1, interleaved[i]));
                        view.setInt16(offset, sample * 0x7FFF, true);
                        offset += 2;
                    }

                    resolve(new Blob([view], { type: 'audio/wav' }));
                } catch (err) {
                    reject(err);
                }
            };

            fileReader.onerror = (err) => reject(err);
            fileReader.readAsArrayBuffer(webmBlob);
        });
    };

    // Interleave channels: [L1, R1, L2, R2, ...]
    function interleaveChannels(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length;
        const result = new Float32Array(length * numChannels);
        const channelData = [];

        for (let i = 0; i < numChannels; i++) {
            channelData.push(audioBuffer.getChannelData(i));
        }

        for (let i = 0; i < length; i++) {
            for (let j = 0; j < numChannels; j++) {
                result[i * numChannels + j] = channelData[j][i];
            }
        }

        return result;
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }


        // DOM Elements
        const patientIdInput = document.getElementById('patientId');
        const checkPatientIdBtn = document.getElementById('checkPatientIdBtn');
        const registerPatientBtn = document.getElementById('registerPatientBtn');
        const messageDisplay = document.getElementById('messageDisplay');
        const liveWaveformCanvas = document.getElementById('liveWaveformCanvas');
        const recordedWaveformCanvas = document.getElementById('recordedWaveformCanvas');
        const startRecordingBtn = document.getElementById('startRecordingBtn');
        const stopRecordingBtn = document.getElementById('stopRecordingBtn');
        const submitRecordingBtn = document.getElementById('submitRecordingBtn');
        const audioPlayer = document.getElementById('audioPlayer');
        const playRecordedAudioBtn = document.getElementById('playRecordedAudioBtn');
        const fetchAndPlayExistingAudioBtn = document.getElementById('fetchAndPlayExistingAudioBtn');

        // State variables (simulated with global vars for vanilla JS)
        let isPatientValid = false;
        let isRecording = false;
        let recordedAudioBlob = null;
        let isPlaying = false;
        let loading = false; // For disabling buttons during async ops
        let isPaused = false;
        let pauseResumeRecordingBtn = document.getElementById('pauseResumeRecordingBtn');


        // Audio API variables
        let audioContext = null;
        let analyser = null;
        let microphoneStream = null;
        let liveWaveformAnimationId = null;
        let mediaRecorder = null;
        let recordedChunks = [];

        // Helper to update message display
        function updateMessage(msg, type = 'info') {
            messageDisplay.textContent = msg;
            messageDisplay.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700', 'bg-blue-100', 'text-blue-700');
            if (type === 'error') {
                messageDisplay.classList.add('bg-red-100', 'text-red-700');
            } else if (type === 'success') {
                messageDisplay.classList.add('bg-green-100', 'text-green-700');
            } else {
                messageDisplay.classList.add('bg-blue-100', 'text-blue-700');
            }
            messageDisplay.classList.remove('hidden');
        }

        // Helper to set button states
        function setButtonStates() {
            patientIdInput.disabled = loading || isRecording || isPlaying;
            checkPatientIdBtn.disabled = loading || isRecording || isPlaying || !patientIdInput.value.trim();
            // registerPatientBtn.disabled is handled by its onclick directly
            pauseResumeRecordingBtn.disabled = !isRecording || loading || isPlaying;
            pauseResumeRecordingBtn.textContent = isPaused ? 'Resume Recording' : 'Pause Recording';

            
            startRecordingBtn.disabled = !isPatientValid || isRecording || loading || isPlaying;
            stopRecordingBtn.disabled = !isRecording || loading || isPlaying;
            submitRecordingBtn.disabled = !recordedAudioBlob || isRecording || loading || isPlaying;
            playRecordedAudioBtn.disabled = !recordedAudioBlob || isRecording || loading || isPlaying;
            fetchAndPlayExistingAudioBtn.disabled = !isPatientValid || isRecording || loading || isPlaying;

            // Show/hide register button based on patient validation status
            if (!isPatientValid && patientIdInput.value.trim() && messageDisplay.textContent.includes("not found")) {
                registerPatientBtn.classList.remove('hidden');
            } else {
                registerPatientBtn.classList.add('hidden');
            }
        }

        function togglePauseResumeRecording() {
    if (!mediaRecorder) return;

    if (isPaused) {
        mediaRecorder.resume();
        isPaused = false;
        updateMessage('Recording resumed.', 'info');
    } else {
        mediaRecorder.pause();
        isPaused = true;
        updateMessage('Recording paused.', 'info');
    }

    setButtonStates();
}
        pauseResumeRecordingBtn.addEventListener('click', togglePauseResumeRecording);


        // Waveform drawing utility for live input
        const drawWaveform = (analyserNode, canvasCtx, canvasEl, dataArray, animationIdRef) => {
            animationIdRef.current = requestAnimationFrame(() => drawWaveform(analyserNode, canvasCtx, canvasEl, dataArray, animationIdRef));

            analyserNode.getByteFrequencyData(dataArray);

            canvasCtx.fillStyle = '#f9f9f9';
            canvasCtx.fillRect(0, 0, canvasEl.width, canvasEl.height);

            const barWidth = (canvasEl.width / dataArray.length) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
                barHeight = dataArray[i] / 2;

                canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                canvasCtx.fillRect(x, canvasEl.height - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        };

        // Initialize Web Audio API for live waveform
        async function initLiveWaveform() {
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            try {
                if (microphoneStream) {
                    microphoneStream.getTracks().forEach(track => track.stop());
                }
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        sampleRate: 44100
                    }
                });
                microphoneStream = stream;

                const source = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.8;
                source.connect(analyser);

                const canvasCtx = liveWaveformCanvas.getContext('2d');
                const bufferLength = analyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);

                // Use a ref-like object for animation ID in vanilla JS
                const animationIdRef = { current: null };
                drawWaveform(analyser, canvasCtx, liveWaveformCanvas, dataArray, animationIdRef);
                liveWaveformAnimationId = animationIdRef.current; // Store the actual ID
                updateMessage('Microphone ready.', 'info');
                return true;
            } catch (error) {
                console.error('Error accessing microphone:', error);
                updateMessage(`Error accessing microphone: ${error.message}. Please allow microphone access.`, 'error');
                if (liveWaveformAnimationId) {
                    cancelAnimationFrame(liveWaveformAnimationId);
                    liveWaveformAnimationId = null;
                }
                if (microphoneStream) {
                    microphoneStream.getTracks().forEach(track => track.stop());
                    microphoneStream = null;
                }
                return false;
            }
        }

        // Stop live waveform
        function stopLiveWaveform() {
            if (liveWaveformAnimationId) {
                cancelAnimationFrame(liveWaveformAnimationId);
                liveWaveformAnimationId = null;
            }
            if (microphoneStream) {
                microphoneStream.getTracks().forEach(track => track.stop());
                microphoneStream = null;
            }
            if (analyser && audioContext) {
                analyser.disconnect();
                analyser = null;
            }
            const canvasCtx = liveWaveformCanvas.getContext('2d');
            canvasCtx.clearRect(0, 0, liveWaveformCanvas.width, liveWaveformCanvas.height);
        }

        // Draw waveform for recorded audio
        async function drawRecordedWaveform(audioBlob) {
            const canvasCtx = recordedWaveformCanvas.getContext('2d');
            canvasCtx.clearRect(0, 0, recordedWaveformCanvas.width, recordedWaveformCanvas.height);

            if (!audioBlob) return;

            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const data = audioBuffer.getChannelData(0); // Get data from the first channel
            const step = Math.ceil(data.length / recordedWaveformCanvas.width);
            const amp = recordedWaveformCanvas.height / 2;

            canvasCtx.beginPath();
            canvasCtx.strokeStyle = '#3B82F6'; // Blue color for recorded waveform
            canvasCtx.lineWidth = 1;

            for (let i = 0; i < recordedWaveformCanvas.width; i++) {
                let min = 1.0;
                let max = -1.0;
                for (let j = 0; j < step; j++) {
                    const datum = data[(i * step) + j];
                    if (datum < min) min = datum;
                    if (datum > max) max = datum;
                }
                canvasCtx.lineTo(i, (1 + min) * amp);
                canvasCtx.lineTo(i, (1 + max) * amp);
            }
            canvasCtx.stroke();
        }

        // Patient ID validation (uses /checkPatient route)
        async function checkPatientId() {
            const pId = patientIdInput.value.trim();
            if (!pId) {
                updateMessage('Please enter a Speaker ID.', 'error');
                isPatientValid = false;
                setButtonStates();
                return false;
            }

            loading = true;
            setButtonStates();
            updateMessage('Checking Speaker ID...', 'info');
            try {
                const response = await fetch('/checkPatient', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ patientID: pId }) // Use patientID
                });
                const data = await response.json();

                if (response.ok && data.success) { // Check data.success
                    updateMessage(`Speaker ID "${pId}" found. You can now record.`, 'success');
                    isPatientValid = true;
                    return true;
                } else {
                    updateMessage(data.message || `Speaker ID "${pId}" not found. Please register first.`, 'error');
                    isPatientValid = false;
                    return false;
                }
            } catch (error) {
                console.error('Error checking patient ID:', error);
                updateMessage(`Error checking Speaker ID: ${error.message}`, 'error');
                isPatientValid = false;
                return false;
            } finally {
                loading = false;
                setButtonStates();
            }
        }

        // Start Recording
        async function startRecording() {
            if (!isPatientValid) {
                updateMessage('Please validate Speaker ID first.', 'error');
                return;
            }
            if (!microphoneStream) {
                const success = await initLiveWaveform(); // Ensure microphone is ready
                if (!success) {
                    updateMessage('Microphone not available. Cannot start recording.', 'error');
                    return;
                }
            }

            recordedChunks = [];
            recordedAudioBlob = null;
            isRecording = true;
            isPaused = false;
            updateMessage('Recording...', 'info');
            setButtonStates();

            mediaRecorder = new MediaRecorder(microphoneStream);

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const webmBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                try {
                    const wavBlob = await convertToWav(webmBlob);
                    recordedAudioBlob = wavBlob;
                    drawRecordedWaveform(wavBlob);
                    updateMessage('Recording stopped. Ready to submit or play.', 'success');
                } catch (error) {
                    console.error('Error converting to WAV:', error);
                    updateMessage(`Error processing audio: ${error.message}`, 'error');
                } finally {
                    setButtonStates();
                }
            };

            mediaRecorder.start();
        }

        // Stop Recording
        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                isRecording = false;
                stopLiveWaveform();
                setButtonStates();
            }
        }

        // Submit Recording
        async function submitRecording() {
            if (!recordedAudioBlob) {
                updateMessage('No audio recorded to submit.', 'error');
                return;
            }
            const pId = patientIdInput.value.trim();

            loading = true;
            setButtonStates();
            updateMessage('Submitting recording...', 'info');
            try {
                const formData = new FormData();
                formData.append('patientId', pId); // Use patientId as backend expects
                formData.append('audioFile', recordedAudioBlob, 'recording.wav');

                const response = await fetch('/api/uploadAudio', { // Corrected to /api/uploadAudio
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    updateMessage('Recording submitted successfully!', 'success');
                    recordedAudioBlob = null; // Clear recorded audio
                    drawRecordedWaveform(null); // Clear waveform
                } else {
                    updateMessage(data.message || 'Failed to submit recording.', 'error');
                }
            } catch (error) {
                console.error('Error submitting recording:', error);
                updateMessage(`Error submitting recording: ${error.message}`, 'error');
            } finally {
                loading = false;
                setButtonStates();
            }
        }

        // Play Recorded Audio (either newly recorded or fetched)
        async function playAudio(audioBlobToPlay = recordedAudioBlob) {
            if (!audioBlobToPlay) {
                updateMessage('No audio available to play.', 'error');
                return;
            }

            if (audioPlayer) {
                const audioUrl = URL.createObjectURL(audioBlobToPlay);
                audioPlayer.playbackRate = 1.0;
                audioPlayer.src = audioUrl;
                audioPlayer.onended = () => {
                    URL.revokeObjectURL(audioPlayer.src);
                    isPlaying = false;
                    setButtonStates();
                };
                audioPlayer.play();
                isPlaying = true;
                updateMessage('Playing audio...', 'info');
                drawRecordedWaveform(audioBlobToPlay); // Redraw waveform for playback
                setButtonStates();
            }
        }

        // Fetch and Play Existing Audio
        async function fetchAndPlayExistingAudio() {
            const pId = patientIdInput.value.trim();

            // Prepare or find a container for the results
            let audioListContainer = document.getElementById('audioPlaybackContainer');
            if (!audioListContainer) {
                audioListContainer = document.createElement('div');
                audioListContainer.id = 'audioPlaybackContainer';
                // Place this after the audioPlayer div (or wherever you want)
                let ref = document.getElementById('audioPlayer');
                ref.parentNode.insertBefore(audioListContainer, ref.nextSibling);
            }
            audioListContainer.innerHTML = ''; // Clear previous

            if (!pId) {
                updateMessage('Please enter a Speaker ID to fetch audio.', 'error');
                return;
            }

            loading = true;
            setButtonStates();
            updateMessage('Fetching audio...', 'info');

            try {
                const response = await fetch(`/getAudio/${encodeURIComponent(pId)}`);
                const data = await response.json();

                if (response.ok && data.success && Array.isArray(data.audioList) && data.audioList.length > 0) {
                    updateMessage(`Found ${data.audioList.length} audio file(s) for Speaker ID "${pId}".`, 'success');
                    audioListContainer.innerHTML = ''; // Clear loading message

                    data.audioList.forEach((audioItem, idx) => {
                        const div = document.createElement('div');
                        div.style.marginBottom = '13px';

                        const label = document.createElement('div');
                        label.textContent = `Audio #${idx + 1} (${new Date(audioItem.recordingDate).toLocaleString()})`;
                        label.style.fontWeight = 'bold';
                        label.style.fontSize = '1em';
                        label.style.marginBottom = '3px';

                        const audio = document.createElement('audio');
                        audio.controls = true;
                        audio.style.width = '100%';
                        audio.src = 'data:audio/wav;base64,' + audioItem.audio;

                        div.appendChild(label);
                        div.appendChild(audio);
                        audioListContainer.appendChild(div);
                    });
                } else {
                    audioListContainer.innerHTML = `<div style="color:red; font-weight:500;">No audio found for Speaker ID "${pId}".</div>`;
                    updateMessage(data.message || `No audio found for Speaker ID "${pId}".`, 'error');
                }
            } catch (error) {

                audioListContainer.innerHTML = `<div style="color:red;">Error fetching or displaying audios.</div>`;
                updateMessage(`Error fetching audio: ${error.message}`, 'error');
                console.error(error);
            } finally {
                loading = false;
                setButtonStates();
            }
        }

        // Event Listeners
        patientIdInput.addEventListener('input', () => {
            isPatientValid = false; // Invalidate on ID change
            updateMessage('', 'info'); // Clear message
            setButtonStates();
        });
        checkPatientIdBtn.addEventListener('click', checkPatientId);
        // registerPatientBtn's onclick is now directly in HTML for navigation
        startRecordingBtn.addEventListener('click', startRecording);
        stopRecordingBtn.addEventListener('click', stopRecording);
        submitRecordingBtn.addEventListener('click', submitRecording);
        playRecordedAudioBtn.addEventListener('click', () => playAudio());
        fetchAndPlayExistingAudioBtn.addEventListener('click', fetchAndPlayExistingAudio);

        // Initial setup on window load
        window.onload = async () => {
            await initLiveWaveform(); // Initialize waveform
            setButtonStates(); // Initial button state setup
        };

        // Cleanup on page unload (optional, for robustness)
        window.addEventListener('beforeunload', () => {
            stopLiveWaveform();
            if (audioContext && audioContext.state !== 'closed') {
                audioContext.close();
                audioContext = null;
            }
        });
