
const express = require('express');
const cors = require('cors');
const awsIot = require('aws-iot-device-sdk');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// AWS IoT Core Configuration
const device = awsIot.device({
    keyPath: 'C:\Users\DELL\AppData\Local\Microsoft\Windows\INetCache\IE\C38COELQ\e6b6251b433503bdf336c1cb81781690c9051b2e72ba3711843760110c4f9548-private.pem[1].key',
    certPath: 'path/to/certificate.pem.crt',
    caPath: 'C:\Users\DELL\AppData\Local\Microsoft\Windows\INetCache\IE\C38COELQ\AmazonRootCA1[1].pem',
    clientId: 'Digi-diet-final',
    host: 'http://a2pdag2dg17yas-ats.iot.eu-north-1.amazonaws.com'
});

// Default nutritional data
let nutritionData = {
    calories: 2200,
    protein: 75,
    fats: 65,
    fibres: 30,
    carbs: 280
};

// Save historical data
const saveHistoricalData = (data) => {
    const timestamp = new Date().toISOString();
    const record = { timestamp, ...data };
    fs.appendFile('nutrition-history.json', JSON.stringify(record) + '\n', (err) => {
        if (err) console.error('Error saving data:', err);
    });
};

// Connect to AWS IoT Core
device.on('connect', () => {
    console.log('Connected to AWS IoT Core');
    device.subscribe('nutrition/data');
});

// Receive messages from IoT Core
device.on('message', (topic, payload) => {
    console.log(`Received message from ${topic}:`, payload.toString());
    try {
        const newData = JSON.parse(payload.toString());
        nutritionData = newData;
        saveHistoricalData(newData);
    } catch (error) {
        console.error('Error parsing message:', error);
    }
});

// API Endpoint to fetch current nutritional data
app.get('/api/nutrition', (req, res) => {
    res.json(nutritionData);
});

// API Endpoint to fetch historical data
app.get('/api/nutrition/history', (req, res) => {
    fs.readFile('nutrition-history.json', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to load history' });
        const records = data.trim().split('\n').map(line => JSON.parse(line));
        res.json(records);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

