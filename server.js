


const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const awsIot = require('aws-iot-device-sdk');

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Store nutritional data temporarily
let nutritionalData = {
  calories: 0,
  protein: 0,
  fats: 0,
  fibres: 0,
  carbs: 0
};

// AWS IoT Core Credentials
const AWS_IOT_ENDPOINT = "your-aws-endpoint.iot.us-east-1.amazonaws.com";
const PORT = 8883;
const TOPIC = "Realtimedata/data";
const CERTS_PATH = "mqtt_app/certs/";

// AWS IoT Device Setup (MQTT)
const device = awsIot.device({
  keyPath: CERTS_PATH + 'private.pem.key',
  certPath: CERTS_PATH + 'device.pem.crt',
  caPath: CERTS_PATH + 'AmazonRootCA1.pem',
  clientId: 'nutritionAnalyticsApp',
  host: AWS_IOT_ENDPOINT,
  port: PORT
});

// Connect to AWS IoT
device.on('connect', function () {
  console.log('Connected to AWS IoT Core');
});

// API to get current nutritional data
app.get('/api/nutrition', (req, res) => {
  res.json(nutritionalData);
});

// API to update nutritional data
app.post('/api/nutrition', (req, res) => {
  const { calories, protein, fats, fibres, carbs } = req.body;

  // Update local storage
  nutritionalData = { calories, protein, fats, fibres, carbs };
  console.log('Received data:', nutritionalData);

  // Publish to AWS IoT Core
  const message = JSON.stringify({
    type: "nutrition_update",
    data: nutritionalData,
    timestamp: new Date().toISOString()
  });

  device.publish(TOPIC, message, (err) => {
    if (err) {
      console.error('Failed to publish to AWS IoT:', err);
      res.status(500).json({ message: 'Failed to publish to AWS IoT' });
    } else {
      console.log('Data published to AWS IoT Core');
      res.json({ message: 'Data updated and published to AWS IoT' });
    }
  });
});

// Start Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

