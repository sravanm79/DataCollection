/*
* This script has been generated for the project titled
* "SPEECH TO SPEECH TRANSLATION SYSTEM FOR TRIBAL LANGUAGES"
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
// app.use(express.static('public'));

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
    res.sendFile(path.join(__dirname, 'public/pages/new_userDetails.html'));
});

// Post Route for Patient Registration
app.post('/', async function(req, res) {
    try {
        // Get the data from html form and parse/validate
        const patientName = req.body.username;
        const doctorID = parseInt(req.body.doctorID);
        const age = parseInt(req.body.age);
        const maritalStatus = req.body.maritalStatus;
        const education = req.body.education;
        const occupation = req.body.occupation;
        const monthlyIncome = parseInt(req.body.monthlyIncome);
        const consentType = req.body.consentType;
        const consentGiven = consentType === 'Audio-Video' ? 'Yes' : 'No';

        // Basic validation for required fields and valid numbers
        if (!patientName || isNaN(doctorID) || isNaN(age) || !maritalStatus || !education || !occupation || isNaN(monthlyIncome) || !consentType) {
            console.error('Validation Error: Missing or invalid form data.');
            return res.redirect('/registration?status=validationError');
        }

        // --- Step 1: Insert data into the 'patient' table ---
        const patientInsertSql = `INSERT INTO patient (patientName, doctorID, age, maritalStatus, education, occupation, monthlyIncome) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const patientValues = [patientName, doctorID, age, maritalStatus, education, occupation, monthlyIncome];

        console.log('Attempting to insert patient data...');
        console.log('SQL:', patientInsertSql);
        console.log('Values:', patientValues);

        const patientQueryResult = await new Promise((resolve, reject) => {
            mydb.query(patientInsertSql, patientValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        const newPatientID = patientQueryResult.insertId;
        if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept.indexOf('application/json') > -1) {
            return res.json({ success: true, patientID: newPatientID });
        }
        console.log(`Patient '${patientName}' registered successfully with ID: ${newPatientID}`);
        // --- Step 2: Insert data into the 'patientConsent' table ---
        const consentInsertSql = `INSERT INTO patientConsent (patientID, consentGiven) VALUES (?, ?)`;
        const consentValues = [newPatientID, consentGiven];

        console.log('Attempting to insert patient consent...');
        console.log('SQL:', consentInsertSql);
        console.log('Values:', consentValues);

        await new Promise((resolve, reject) => {
            mydb.query(consentInsertSql, consentValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
        console.log('Patient consent inserted successfully.');

        // --- Step 3: Create patient-specific directories ---
        const patientFolderPath = path.join(__dirname, 'public', 'recordings', patientName);
        console.log(`Attempting to create main directory: ${patientFolderPath}`);

        await fsp.mkdir(patientFolderPath, { recursive: true }); // **Use fsp here**
        console.log('Main directory created successfully!');

        const subdirectories = ['1', '2', '3', '4', '5', '6', '7', 'demo', 'continuous'];
        for (const sub of subdirectories) {
            const subDirPath = path.join(patientFolderPath, sub);
            console.log(`Creating subdirectory: ${subDirPath}`);
            await fsp.mkdir(subDirPath); // **Use fsp here**
            console.log(`Sub directory '${sub}' created successfully!`);
        }
        console.log('All subdirectories created successfully.');

        // --- Step 4: Redirect based on consent type ---
        const selectConsentSql = `SELECT consentGiven FROM patientConsent WHERE patientID = ?`;
        const selectConsentValues = [newPatientID];

        const fetchedConsentResult = await new Promise((resolve, reject) => {
            mydb.query(selectConsentSql, selectConsentValues, (error, result) => {
                if (error) return reject(error);
                resolve(result);
            });
        });

        if (fetchedConsentResult && fetchedConsentResult.length > 0) {
            if (fetchedConsentResult[0].consentGiven === 'Yes') {
                res.redirect('/consent');
            } else if (fetchedConsentResult[0].consentGiven === 'No') {
                res.redirect('/recordData');
            } else {
                console.warn('Unexpected consentGiven value from DB:', fetchedConsentResult[0].consentGiven);
                res.redirect('/registration?status=consentError');
            }
        } else {
            console.error('Consent record not found for new patientID:', newPatientID);
            res.redirect('/registration?status=consentMissing');
        }

    } catch (err) {
        console.error('An error occurred during patient registration process:');
        console.error(err);

        if (err.sqlMessage) {
            console.error('MySQL Error Message:', err.sqlMessage);
            console.error('MySQL Error Code:', err.code);
            if (err.code === 'ER_DUP_ENTRY') {
                console.error(`Possible duplicate entry for patient name: '${req.body.username}'`);
                return res.redirect('/registration?status=duplicateEntry');
            }
            if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
                console.error(`Foreign key constraint error. Check if doctorID '${req.body.doctorID}' exists in the 'doctor' table.`);
                return res.redirect('/registration?status=invalidDoctorID');
            }
            if (err.code === 'ER_BAD_NULL_ERROR' || err.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
                console.error(`Data type or NULL constraint error. Check submitted data vs. DB schema.`);
                return res.redirect('/registration?status=invalidData');
            }
        }
        if (req.headers['x-requested-with'] === 'XMLHttpRequest' || req.headers.accept.indexOf('application/json') > -1) {
            return res.status(500).json({ success: false, error: 'Registration failed.' });
        }
        res.redirect('/registration?status=error');
    }
});

// Data Collection Page
app.get('/recordData', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/pages/dataCollection.html'));
});

// Consent Page
app.get('/consent', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/pages/consent.html'));
});


// --- POST /uploadDemo ---
app.post('/uploadDemo', upload.single('demoStream'), async function(req, res) { // Removed 'next' as it's not used
    try {
        const file = req.file;
        const pName = req.body.userName;

        if (!file || !pName) {
            const err = new Error('Please upload a file and provide a user name.');
            err.httpStatusCode = 400;
            throw err;
        }

        console.log('Received Patient Name for demo recording: ' + pName);
        console.log(`File: ${file.originalname}, Size: ${file.size} bytes`);

        const filePath = path.join(__dirname, 'public', 'recordings', pName, 'demo');
        const uploadLocation = path.join(filePath, file.originalname);

        await fsp.mkdir(filePath, { recursive: true }); // **Use fsp here**
        await fsp.writeFile(uploadLocation, file.buffer); // **Use fsp here**

        console.log('Demo recording saved successfully to: ' + uploadLocation);
        res.sendStatus(200);
    } catch (err) {
        console.error('Error uploading demo recording:', err);
        if (err.httpStatusCode) {
            res.status(err.httpStatusCode).send(err.message);
        } else {
            res.status(500).send('Failed to upload demo recording.');
        }
    }
});


// --- POST /uploadMain ---
app.post('/uploadMain', upload.single('newVideo'), async function(req, res) {
    try {
        const file = req.file;
        const fileName = file.originalname;
        const pName = req.body.userName;
        const secID = req.body.section;

        if (!file || !pName || !secID) {
            const err = new Error('Please upload a file, provide a user name, and section ID.');
            err.httpStatusCode = 400;
            throw err;
        }

        console.log('Received Main recording for Patient: ' + pName + ', Section: ' + secID);
        console.log(`File: ${file.originalname}, Size: ${file.size} bytes`);

        const uPath = path.join(__dirname, 'public', 'recordings', pName, secID.toString());
        const uploadLocation = path.join(uPath, fileName);

        await fsp.mkdir(uPath, { recursive: true }); // **Use fsp here**
        await fsp.writeFile(uploadLocation, file.buffer); // **Use fsp here**

        console.log('Main recording saved successfully to: ' + uploadLocation);
        res.sendStatus(200);
    } catch (err) {
        console.error('Error uploading main recording:', err);
        if (err.httpStatusCode) {
            res.status(err.httpStatusCode).send(err.message);
        } else {
            res.status(500).send('Failed to upload main recording.');
        }
    }
});


// --- POST /uploadCon ---
app.post('/uploadCon', upload.single('conStream'), async function(req, res) { // Removed 'next' as it's not used
    try {
        const file = req.file;
        const pName = req.body.userName;

        if (!file || !pName) {
            const err = new Error('Please upload a file and provide a user name.');
            err.httpStatusCode = 400;
            throw err;
        }

        console.log('Received Patient Name for continuous recording: ' + pName);
        console.log(`File: ${file.originalname}, Size: ${file.size} bytes`);

        const filePath = path.join(__dirname, 'public', 'recordings', pName, 'continuous');
        const uploadLocation = path.join(filePath, file.originalname);

        await fsp.mkdir(filePath, { recursive: true }); // **Use fsp here**
        await fsp.writeFile(uploadLocation, file.buffer); // **Use fsp here**

        console.log('Continuous recording saved successfully to: ' + uploadLocation);
        res.sendStatus(200);
    } catch (err) {
        console.error('Error uploading continuous recording:', err);
        if (err.httpStatusCode) {
            res.status(err.httpStatusCode).send(err.message);
        } else {
            res.status(500).send('Failed to upload continuous recording.');
        }
    }
});


// Contact Us Page
app.get('/contactus', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/pages/contactus.html'));
});

// --- State Variables (consider moving these to a proper state management solution for larger apps) ---
let ddata = {};
let canSpeak = 'N/A';
let currentPtr = 0;
let sdata = {};
let isValidPatient = 0;


// --- POST /testing ---
app.post('/testing', async function(req, res) {
    try {
        const patientName = req.body.user;
        const sessionID = req.body.ele;
        const audioCount = req.body.rec;
        const sentence = req.body.sentence1;

        console.log(`Request for /testing - patientName: ${patientName}, sessionID: ${sessionID}, sentences: ${audioCount}`);

        const selectPatientSql = `SELECT patientID, patientName FROM patient WHERE patientName = ?`;
        const selectPatientValues = [patientName];

        console.log('Executing Patient Check Query:', selectPatientSql, selectPatientValues);
        const patientResult = await new Promise((resolve, reject) => {
            mydb.query(selectPatientSql, selectPatientValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (patientResult.length > 0) {
            console.log('**********Patient Found**********');
            console.log('Patient details:', patientResult[0]);
            isValidPatient = 1;

            const selectPtrSql = `SELECT currentPointer FROM stpointer LIMIT 1`;
            console.log('Executing Pointer Query:', selectPtrSql);
            const ptrResult = await new Promise((resolve, reject) => {
                mydb.query(selectPtrSql, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            if (ptrResult.length > 0) {
                currentPtr = ptrResult[0].currentPointer;
                console.log('Data returned by the SQL query: ' + currentPtr);
            } else {
                console.warn('No currentPointer found in stpointer table. Defaulting to 0.');
                currentPtr = 0;
            }

            console.log('Reading CSV file: ./public/data/lambani1000.csv');
            const csvData = await fsp.readFile('./public/data/lambani1000.csv'); // **Use fsp here**
            const decodedCsv = iconv.decode(csvData, 'utf-8');

            ddata = {};
            const parsedResults = await new Promise((resolve, reject) => {
                const stream = iconv.decodeStream('utf-8')
                    .pipe(csvParser());
                const tempResults = [];
                stream.on('data', (data) => tempResults.push(data));
                stream.on('end', () => resolve(tempResults));
                stream.on('error', (error) => reject(error));
                stream.write(decodedCsv);
                stream.end();
            });

            parsedResults.forEach((item) => {
                ddata[item.ID] = item.Sentence;
            });
            console.log('******...Data from CSV file read successfully...******');

        } else {
            ddata = {};
            canSpeak = '';
            currentPtr = 0;
            isValidPatient = 0;
            console.log('**********Patient Not Found**********');
        }

        res.status(204).send();

    } catch (err) {
        console.error('Error in /testing route:', err);
        res.status(500).send('Internal server error during testing data preparation.');
    }
});


// --- GET /langStatus ---
app.get('/langStatus', function(req, res) {
    console.log('can Speak: ' + canSpeak);
    return res.json(canSpeak);
});

// --- GET /getPointer ---
app.get('/getPointer', function(req, res) {
    console.log('Current Pointer value to be sent: ' + currentPtr);
    return res.json(currentPtr);
});

// --- GET /testing (to retrieve prepared CSV data) ---
app.get('/testing', function(req, res) {
    return res.json(ddata);
});


// --- POST /getSentence ---
app.post('/getSentence', async function(req, res) {
    try {
        const user = req.body.user;
        const stNum = req.body.sentence;

        console.log(`Request for /getSentence - User: ${user}, Sentence: ${stNum}`);

        const selectPatientSql = `SELECT patientID FROM patient WHERE patientName = ?`;
        const selectPatientValues = [user];

        const patientResult = await new Promise((resolve, reject) => {
            mydb.query(selectPatientSql, selectPatientValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (patientResult.length > 0) {
            console.log('**********Patient Found for /getSentence**********');
            console.log('Patient ID:', patientResult[0].patientID);

            const csvData = await fsp.readFile('./public/data/lambani1000.csv'); // **Use fsp here**
            const decodedCsv = iconv.decode(csvData, 'utf-8');

            sdata = {};
            const parsedResults = await new Promise((resolve, reject) => {
                const stream = iconv.decodeStream('utf-8')
                    .pipe(csvParser());
                const tempResults = [];
                stream.on('data', (data) => tempResults.push(data));
                stream.on('end', () => resolve(tempResults));
                stream.on('error', (error) => reject(error));
                stream.write(decodedCsv);
                stream.end();
            });

            parsedResults.forEach((item) => {
                sdata[item.ID] = item.Sentence;
            });
            console.log('******Data from the CSV read successfully for /getSentence...******');
        } else {
            sdata = {};
            console.log('Patient Not Found for /getSentence');
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error in /getSentence POST route:', err);
        res.status(500).send('Internal server error during sentence retrieval preparation.');
    }
});


// --- GET /getSentence ---
app.get('/getSentence', function(req, res) {
    res.cookie('cookieName', 'cookieValue', { sameSite: 'none', secure: true });
    return res.json(sdata);
});


// --- POST /userConsent ---
app.post('/userConsent', async function(req, res) {
    try {
        const patientName = req.body.user;
        console.log('Checking user consent for: ' + patientName);

        const selectPatientSql = `SELECT patientID FROM patient WHERE patientName = ?`;
        const selectPatientValues = [patientName];

        const patientResult = await new Promise((resolve, reject) => {
            mydb.query(selectPatientSql, selectPatientValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (patientResult.length > 0) {
            console.log('**********Patient Found for consent check**********');
            isValidPatient = 1;
        } else {
            console.log('**********Patient Not Found for consent check**********');
            isValidPatient = 0;
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error in /userConsent POST route:', err);
        res.status(500).send('Internal server error during consent check.');
    }
});

// --- GET /userConsent (to retrieve isValidPatient status) ---
app.get('/userConsent', function(req, res) {
    return res.json(isValidPatient);
});


// --- POST /uploadConsent ---
app.post('/uploadConsent', upload.single('newVideo'), async function(req, res) { // Removed 'next'
    try {
        const file = req.file;
        const pName = req.body.userName;
        const fileExt = path.extname(file.originalname);
        const fileName = `${path.basename(file.originalname, fileExt)}` + (fileExt || '.mp4');

        if (!file || !pName) {
            const err = new Error('Please upload a file and provide a user name.');
            err.httpStatusCode = 400;
            throw err;
        }

        console.log('Received Consent Video for Patient: ' + pName);
        console.log(`File: ${file.originalname}, Size: ${file.size} bytes`);

        const uPath = path.join(__dirname, 'public', 'recordings', pName);
        const uploadLocation = path.join(uPath, fileName);

        await fsp.mkdir(uPath, { recursive: true }); // **Use fsp here**
        await fsp.writeFile(uploadLocation, file.buffer); // **Use fsp here**

        console.log('Consent video saved successfully to: ' + uploadLocation);
        res.sendStatus(200);
    } catch (err) {
        console.error('Error uploading consent video:', err);
        if (err.httpStatusCode) {
            res.status(err.httpStatusCode).send(err.message);
        } else {
            res.status(500).send('Failed to upload consent video.');
        }
    }
});


// --- POST /getdemoUser ---
app.post('/getdemoUser', async function(req, res) {
    try {
        const patientID = parseInt((req.body.user || '').trim(), 10);
        console.log('Checking Patient ID for demo recording: ' + patientID);

        if (isNaN(patientID)) {
            console.log('Invalid Patient ID input');
            return res.json({ exists: false });
        }

        const selectPatientSql = `SELECT patientID FROM patient WHERE patientID = ?`;
        const selectPatientValues = [patientID];

        const patientResult = await new Promise((resolve, reject) => {
            mydb.query(selectPatientSql, selectPatientValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (patientResult.length > 0) {
            console.log('**********Patient Found for demo user check**********');
            res.json({ exists: true, id: patientResult[0].patientID });
        } else {
            console.log('**********Patient Not Found for demo user check**********');
            res.json({ exists: false });
        }
    } catch (err) {
        console.error('Error in /getdemoUser POST route:', err);
        res.status(500).json({ exists: false, error: 'Internal server error during demo user check.' });
    }
});

// --- GET /getdemoUser ---
app.get('/getdemoUser', function(req, res) {
    return res.json(isValidPatient);
});


// --- POST /getconUser ---
app.post('/getconUser', async function(req, res) {
    try {
        const patientName = req.body.user;
        console.log('Checking Patient Name for continuous recording: ' + patientName);

        const selectPatientSql = `SELECT patientID FROM patient WHERE patientName = ?`;
        const selectPatientValues = [patientName];

        const patientResult = await new Promise((resolve, reject) => {
            mydb.query(selectPatientSql, selectPatientValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        if (patientResult.length > 0) {
            console.log('**********Patient Found for continuous user check**********');
            isValidPatient = 1;
        } else {
            console.log('**********Patient Not Found for continuous user check**********');
            isValidPatient = 0;
        }
        res.status(204).send();
    } catch (err) {
        console.error('Error in /getconUser POST route:', err);
        res.status(500).send('Internal server error during continuous user check.');
    }
});

// --- GET /getconUser ---
app.get('/getconUser', function(req, res) {
    return res.json(isValidPatient);
});


// --- POST /savePointer ---
app.post('/savePointer', async function(req, res) {
    try {
        const dataToWrite = req.body.pointer;
        console.log('Pointer from Browser to save: ' + dataToWrite);

        const updateSql = `UPDATE stpointer SET currentpointer = ?`;
        const updateValues = [dataToWrite];

        await new Promise((resolve, reject) => {
            mydb.query(updateSql, updateValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        console.log('Pointer updated successfully: ' + dataToWrite);
        res.sendStatus(204);
    } catch (err) {
        console.error('Error in /savePointer route:', err);
        if (err.sqlMessage) {
            console.error('MySQL Error Message:', err.sqlMessage);
            console.error('MySQL Error Code:', err.code);
        }
        res.status(500).send('Failed to update pointer.');
    }
});


// Configure Page
app.get('/configure', function(req, res) {
    res.sendFile(path.join(__dirname, 'public/pages/configure.html'));
});

// --- POST /setPointer ---
app.post('/setPointer', async function(req, res) {
    try {
        const stPtr = req.body.sentenceValue;
        console.log('Setting pointer to: ' + stPtr);

        const updateSql = `UPDATE stpointer SET currentpointer = ?`;
        const updateValues = [stPtr];

        await new Promise((resolve, reject) => {
            mydb.query(updateSql, updateValues, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        console.log('Data updated successfully...');
        status = { 'st': 1 };
        res.sendStatus(200);
    } catch (err) {
        console.error('Error in /setPointer route:', err);
        if (err.sqlMessage) {
            console.error('MySQL Error Message:', err.sqlMessage);
            console.error('MySQL Error Code:', err.code);
        }
        status = { 'st': -1 };
        res.status(502).send('Failed to set pointer.');
    }
});


// --- GET /go (to retrieve pointer status) ---
let status = {}; // Define status here, initialize if needed
app.get('/go', function(req, res) {
    console.log('Current status for /go:', status);
    return res.json(status);
});