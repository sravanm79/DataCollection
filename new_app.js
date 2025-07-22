    /*
    * This script has been generated for the project titled
    * "Voice Data Collection for Psychiatric Evaluation and Research"
    * The original author of the script is
    * Swapnil S Sontakke, Project Associate, IIIT, Dharwad
    * Year: January, 2022
    * Version: 2 (Updated for safety and modern async practices)
    */

    require('dotenv').config();  // Load environment variables from .envgututryutry
    const express = require("express"); // express is required to create the server
    const app = express(); // binds the express module to 'app'
    const path = require('path'); // path is required to read the local path
    const fs = require('fs'); // **Keep this for synchronous fs operations like rea
    // 
    // 
    // 
    // 
    // 
    // dFileSync**
    const fsp = require('fs').promises; // **Add this for promise-based fs operations (e.g., mkdir, writeFile)**
    const https = require('https'); // https is required for the safari and edge browsers
    const cookieParser = require('cookie-parser');
    const logger = require('morgan');
    const bodyParser = require('body-parser'); // To parse the web page body
    // const flash = require('express-flash');
    // const session = require('express-session');
    const multer = require('multer');
    const upload = multer(); // For handling multipart/form-data (file uploads)
    // const Noty = require('Noty');
    const csvParser = require('csv-parser'); // To parse the CSV files
    const io = require('socket.io')(https); // Socket.io integration (ensure httpsServer is used)
    const axios = require('axios'); // For making HTTP requests
    const iconv = require('iconv-lite'); // To read and display UTF-8 text from CSV
    const mysql = require('mysql'); // Explicitly require mysql
    const port = process.env.PORT || 3000;

    // --- Middleware Setup ---
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(logger('dev'));
    app.use(express.json()); // For parsing application/json
    app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    const cors = require('cors'); // ← add this near the top
    app.use(cors()); // Allow all origins (for testing only — safer to limit in production)

    // Import the database connectivity file
    var mydb = require('./public/js/database'); // Ensure this file correctly exports a mysql connection

    // --- SSL/HTTPS Setup ---
    // Need to create a SSL private key and certificate for https
    // IMPORTANT: For production, use secure methods to store and load these keys (e.g., environment variables, vault)
    // These synchronous reads are fine here as they happen once at server startup


    //Old part

    // var privateKey = fs.readFileSync('privateKey.pem', 'utf8');
    // var certificate = fs.readFileSync('certificate.pem', 'utf8');

    // // Use key and certificate
    // var credentials = { privateKey: privateKey, certificate: certificate };
    // var port = 3000; // Define port

    // // Access the public folder for static assets
     app.use(express.static('public'));

    // /* Create a https server */
    // var httpsServer = https.createServer(
    //     {
    //         key: privateKey,
    //         cert: certificate,
    //         ciphers: [
    //             "ECDHE-RSA-AES128-SHA256",
    //             "DHE-RSA-AES128-SHA256",
    //             "AES128-GCM-SHA256",
    //             "RC4",
    //             "HIGH",
    //             "!MD5",
    //             "!aNULL"
    //         ].join(':'),
    //     },
    //     app
    // );

    // httpsServer.listen(port, function() {
    //     console.log("HTTPS SERVER STARTED ON localhost:", port);
    // });



    //New only for local:

    const http = require('http');
    //const https = require('https');
    const isProduction = process.env.NODE_ENV === 'production';

    let server;
    if (isProduction) {
    const privateKey = fs.readFileSync('privateKey.pem', 'utf8');
    const certificate = fs.readFileSync('certificate.pem', 'utf8');
    server = https.createServer({ key: privateKey, cert: certificate }, app);
    console.log("HTTPS server started");
    } else {
    server = http.createServer(app);
    console.log("HTTP server started");
    }

    server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    });


    // --- Routes ---
    const uploadRecording = multer({ storage: multer.memoryStorage() });

    app.post('/uploadRecording', uploadRecording.single('file'), async (req, res) => {
    try {
        const patientId = req.body.patientId;
        if (!req.file || !patientId) return res.status(400).send('No file or patientId.');
        const userDir = path.join(__dirname, 'public/recordings', patientId.toString());
        await fsp.mkdir(userDir, { recursive: true });
        const filePath = path.join(userDir, Date.now() + '-' + req.file.originalname);
        await fsp.writeFile(filePath, req.file.buffer);
        res.status(200).send('File uploaded!');
    } catch (err) {
        res.status(500).send('Upload failed.');
    }
    });

    // Home Page
    app.get('/', function(req, res) {
        res.sendFile(path.join(__dirname, 'public/pages/Home.html'));
    });

    // About Us Page
    app.get('/aboutus', function(req, res) {
        res.sendFile(path.join(__dirname, 'public/pages/aboutus.html'));
    });

    // Registration Page
    app.get('/registration', function(req, res) {
        res.sendFile(path.join(__dirname, 'public/pages/userDetails.html'));
    });

    // Post Route for Patient Registration
    app.post('/', async function (req, res) {
        try {
            // Get the data from HTML form
            const patientID = req.body.patientID; // manually entered by user
            const patientName = req.body.username;
            const doctorID = parseInt(req.body.doctorID);
            const age = parseInt(req.body.age);
            const maritalStatus = req.body.maritalStatus;
            const education = req.body.education;
            const occupation = req.body.occupation;
            const monthlyIncome = parseInt(req.body.monthlyIncome);
            const consentType = req.body.consentType;
            const consentGiven = consentType === 'Audio-Video' ? 'Yes' : 'No';

            // Optional fields
            const height = req.body.height || null;
            const weight = req.body.weight || null;
            const identificationMarks = req.body.identificationMarks || null;
            const injuries = req.body.injuries || null;

            // Basic validation
            if (
                !patientID || !patientName || isNaN(doctorID) || isNaN(age) ||
                !maritalStatus || !education || !occupation ||
                isNaN(monthlyIncome) || !consentType
            ) {
                console.error('Validation Error: Missing or invalid form data.');
                return res.redirect('/registration?status=validationError');
            }

            // --- Step 1: Insert into `patient` table ---
            const patientInsertSql = `
                INSERT INTO patient 
                (patientID, patientName, doctorID, age, maritalStatus, education, occupation, monthlyIncome, height, weight, identificationMarks, injuries) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const patientValues = [
                patientID, patientName, doctorID, age, maritalStatus,
                education, occupation, monthlyIncome,
                height, weight, identificationMarks, injuries
            ];

            console.log('Attempting to insert patient data...');
            await new Promise((resolve, reject) => {
                mydb.query(patientInsertSql, patientValues, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            // --- Step 2: Insert into `patientConsent` table ---
            const consentInsertSql = `INSERT INTO patientConsent (patientID, consentGiven) VALUES (?, ?)`;
            const consentValues = [patientID, consentGiven];

            await new Promise((resolve, reject) => {
                mydb.query(consentInsertSql, consentValues, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            console.log(`Patient '${patientName}' registered successfully with ID: ${patientID}`);

            // --- Step 3: Create patient-specific folders ---
            const patientFolderPath = path.join(__dirname, 'public', 'recordings', patientID);
            await fsp.mkdir(patientFolderPath, { recursive: true });

            // const subdirectories = ['1', '2', '3', '4', '5', '6', '7', 'demo', 'continuous'];
            // for (const sub of subdirectories) {
            //     await fsp.mkdir(path.join(patientFolderPath, sub));
            // }

            // --- Step 4: Redirect or respond ---
            const [consentRecord] = await new Promise((resolve, reject) => {
                mydb.query(
                    `SELECT consentGiven FROM patientConsent WHERE patientID = ?`,
                    [patientID],
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );
            });

            if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept.indexOf('application/json') > -1) {
                return res.json({ success: true, patientID });
            }

            if (consentRecord && consentRecord.consentGiven === 'Yes') {
                return res.redirect('/consent');
            } else if (consentRecord && consentRecord.consentGiven === 'No') {
                return res.redirect('/recordData');
            } else {
                return res.redirect('/registration?status=consentError');
            }

        } catch (err) {
            console.error('An error occurred during patient registration:', err);

            if (err.sqlMessage) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.error('Duplicate entry for patientID:', req.body.patientID);
                    return res.redirect('/registration?status=duplicateEntry');
                }
                if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.redirect('/registration?status=invalidDoctorID');
                }
                if (err.code === 'ER_BAD_NULL_ERROR' || err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
                    return res.redirect('/registration?status=invalidData');
                }
            }

            if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept.indexOf('application/json') > -1) {
                return res.status(500).json({ success: false, error: 'Registration failed.' });
            }

            return res.redirect('/registration?status=error');
        }
    });



    // Data Collection Page
    app.get('/recordData', function(req, res) {
        res.sendFile(path.join(__dirname, 'public/pages/record.html'));
    });

    // Consent Page
    app.get('/consent', function(req, res) {
        res.sendFile(path.join(__dirname, 'public/pages/consent.html'));
    });

    // Contact Us Page
    app.get('/contactus', function(req, res) {
        res.sendFile(path.join(__dirname, 'public/pages/contactus.html'));
    });


 
// Upload Audio Recording (used by recordData.html)
app.post('/api/uploadAudio', upload.single('audioFile'), async (req, res) => {
    console.log('Received /api/uploadAudio request. Body:', req.body, 'File:', req.file ? 'Attached' : 'None');
    try {
        const patientId = req.body.patientId; // from FormData
        const audioBuffer = req.file ? req.file.buffer : null;

        if (!patientId || !audioBuffer) {
            console.log('Missing patientId or audioBuffer for upload.');
            return res.status(400).json({ success: false, message: 'Patient ID and audio file are required.' });
        }

        // Step 1: Save the audio file to folder
        const recordingsRoot = path.join(__dirname, 'public', 'recordings');
        const patientFolder = path.join(recordingsRoot, patientId);

        // Create the parent folder if it doesn't exist
        await fsp.mkdir(patientFolder, { recursive: true });

        // Use current timestamp for filename
        const now = new Date();
        // Format: YYYYMMDD_HHMMSS (ex: 20250719_220238)
        const timestamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
        const audioFileName = `${timestamp}_${patientId}.wav`;
        const filePath = path.join(patientFolder, audioFileName);

        // Write audio buffer to file
        await fsp.writeFile(filePath, audioBuffer);

        // Step 2: Save the audio to MySQL table patientAudio
        const sql = `
            INSERT INTO patientAudio (patientID, recordingDate, audioFile)
            VALUES (?, NOW(), ?)
        `;
        await new Promise((resolve, reject) => {
            mydb.query(sql, [patientId, audioBuffer], (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        console.log(`Audio for patient ${patientId} saved successfully to disk (${filePath}) and database.`);
        res.status(200).json({ success: true, message: 'Audio recording saved successfully.' });
    } catch (err) {
        console.error('Error in /api/uploadAudio (catch block):', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Get Audio Recording (used by recordData.html)
app.get('/getAudio/:patientId', (req, res) => {
    const patientId = req.params.patientId;
    if (!patientId) {
        return res.status(400).json({ success: false, message: 'Patient ID is required.' });
    }
    const sql = `
        SELECT audioFile, recordingDate
        FROM patientAudio
        WHERE patientID = ?
        ORDER BY recordingDate DESC
        LIMIT 3
    `;
    mydb.query(sql, [patientId], (err, results) => {
        if (err) {
            console.error('MySQL error fetching audio:', err);
            return res.status(500).json({ success: false, message: 'Database error.' });
        }
        if (results.length > 0) {
            // Return JSON, not raw wav data!
            const audioList = results.map(r => ({
                recordingDate: r.recordingDate,
                audio: r.audioFile.toString('base64')
            }));
            res.json({ success: true, audioList });
        } else {
            res.status(404).json({ success: false, message: `No audio found for patient ID "${patientId}".` });
        }
    });
});




    // Check if patient exists
    app.post('/checkPatient', async (req, res) => {
    try {
        const { patientID } = req.body;
        const [row] = await new Promise((resolve, reject) => {
        mydb.query(
            'SELECT patientID FROM patient WHERE patientID = ?',
            [patientID],
            (err, result) => {
            if (err) return reject(err);
            resolve(result);
            }
        );
        });
        res.json({ success: !!row });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
    });


    // Upload consent audio/video recording (if needed elsewhere)
    app.post('/uploadConsent', upload.single('newVideo'), async (req, res) => {
    try {
        const { userName: patientID } = req.body;
        const blob = req.file.buffer;

        await new Promise((resolve, reject) => {
        mydb.query(
            `INSERT INTO patientAudio (patientID, recordingDate, audioFile)
            VALUES (?, NOW(), ?)`,
            [patientID, blob],
            (err, result) => (err ? reject(err) : resolve(result))
        );
        });

        res.status(200).send('Uploaded');
    } catch (err) {
        console.error(err);
        res.status(500).send('Upload failed');
    }
    });

    // Submit patient consent as Yes or No
    app.post('/submitConsent', async (req, res) => {
    try {
        const { patientID, consentGiven } = req.body;
        const allowed = ['Yes', 'No'];
        if (!allowed.includes(consentGiven)) {
        return res.status(400).json({ success: false, message: 'Invalid consent value' });
        }

        // Insert or update into patientConsent
        await new Promise((resolve, reject) => {
        mydb.query(
            `INSERT INTO patientConsent (patientID, consentGiven)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE consentGiven = VALUES(consentGiven)`,
            [patientID, consentGiven],
            (err, result) => (err ? reject(err) : resolve(result))
        );
        });

        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
    });



///userDetails.html

    app.post('/checkExistingPatient', (req, res) => {
        console.log('checkExistingPatient called with body:', req.body);
        const { patientID } = req.body;
        if (!patientID) return res.json({ success: false, message: 'Patient ID missing' });

        const sql = 'SELECT patientID, patientName, doctorID FROM patient WHERE patientID = ?';
        mydb.query(sql, [patientID.trim()], (err, rows) => {
            if (err) {
            console.error('DB error:', err);
            return res.json({ success: false, message: 'Database error' });
            }
            if (rows.length) {
            return res.json({ success: true, patient: rows[0] });
            }
            return res.json({ success: false, message: 'Patient not found' });
        });
    });

// 2. Route to update existing patient's name and doctor
app.post('/updateExistingPatient', async (req, res) => {
    try {
        const { patientID, patientName, doctorID } = req.body;
        
        if (!patientID || !patientName || !doctorID) {
            return res.status(400).json({ 
                success: false, 
                message: 'Patient ID, name, and doctor ID are required' 
            });
        }

        // Update patient's name and doctor
        const updateQuery = 'UPDATE patient SET patientName = ?, doctorID = ? WHERE patientID = ?';
        
        mydb.query(updateQuery, [patientName, doctorID, patientID], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error occurred' 
                });
            }
            
            if (result.affectedRows > 0) {
                res.json({ 
                    success: true, 
                    message: 'Patient information updated successfully' 
                });
            } else {
                res.status(404).json({ 
                    success: false, 
                    message: 'Patient not found or no changes made' 
                });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// 3. Route to register fresh patient (completely new)
app.post('/registerFreshPatient', async (req, res) => {
    try {
        const {
            patientID,
            username,
            doctorID,
            age,
            maritalStatus,
            education,
            occupation,
            monthlyIncome,
            height,
            weight,
            identificationMarks,
            injuries
        } = req.body;

        // Validate required fields
        if (!patientID || !username || !doctorID || !age || !maritalStatus || !education || !occupation || monthlyIncome === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be filled' 
            });
        }

        // Check if patient ID already exists
        const checkQuery = 'SELECT patientID FROM patient WHERE patientID = ?';
        
        mydb.query(checkQuery, [patientID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error occurred' 
                });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Patient ID already exists. Please choose a different ID.' 
                });
            }

            // Insert new patient
            const insertQuery = `
                INSERT INTO patient 
                (patientID, patientName, doctorID, age, maritalStatus, education, occupation, monthlyIncome, height, weight, identificationMarks, injuries) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                patientID,
                username,
                doctorID,
                age,
                maritalStatus,
                education,
                occupation,
                monthlyIncome,
                height || null,
                weight || null,
                identificationMarks || null,
                injuries || null
            ];
            
            mydb.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to register patient' 
                    });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Patient registered successfully',
                    patientID: patientID
                });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// 4. Route to register patient who was marked as "old" but didn't exist
app.post('/registerOldPatient', async (req, res) => {
    try {
        const {
            patientID,
            username,
            doctorID,
            age,
            maritalStatus,
            education,
            occupation,
            monthlyIncome,
            height,
            weight,
            identificationMarks,
            injuries
        } = req.body;

        // Validate required fields
        if (!patientID || !username || !doctorID || !age || !maritalStatus || !education || !occupation || monthlyIncome === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'All required fields must be filled' 
            });
        }

        // For "old" patients that didn't exist, we still need to check for ID conflicts
        const checkQuery = 'SELECT patientID FROM patient WHERE patientID = ?';
        
        mydb.query(checkQuery, [patientID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error occurred' 
                });
            }
            
            if (results.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Patient ID already exists. Please choose a different ID.' 
                });
            }

            // Insert new patient (same as fresh, but we know it was initially marked as "old")
            const insertQuery = `
                INSERT INTO patient 
                (patientID, patientName, doctorID, age, maritalStatus, education, occupation, monthlyIncome, height, weight, identificationMarks, injuries) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const values = [
                patientID,
                username,
                doctorID,
                age,
                maritalStatus,
                education,
                occupation,
                monthlyIncome,
                height || null,
                weight || null,
                identificationMarks || null,
                injuries || null
            ];
            
            mydb.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Failed to register patient' 
                    });
                }
                
                res.json({ 
                    success: true, 
                    message: 'Patient registered successfully (was marked as old but not found in database)',
                    patientID: patientID
                });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});

// Optional: Route to get patient details (for debugging or additional features)
app.get('/getPatientDetails/:patientID', async (req, res) => {
    try {
        const { patientID } = req.params;
        
        const query = 'SELECT * FROM patient WHERE patientID = ?';
        
        mydb.query(query, [patientID], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database error occurred' 
                });
            }
            
            if (results.length > 0) {
                res.json({ 
                    success: true, 
                    patient: results[0]
                });
            } else {
                res.status(404).json({ 
                    success: false, 
                    message: 'Patient not found' 
                });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error occurred' 
        });
    }
});