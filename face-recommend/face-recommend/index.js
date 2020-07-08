require('dotenv').config();

const path = require('path');

const express = require('express');
require('express-async-errors');

const bodyParser = require('body-parser');
const mysql2 = require('mysql2/promise');
const https = require('https');
const fs = require('fs');

const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT, DB_NAME } = process.env;

const pool = mysql2.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    database: DB_NAME,
});

const app = express();

app.use(express.static(path.resolve(__dirname, 'public')));

app.use(bodyParser.urlencoded({
    extended: true,
}));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'views/index.html'));
});

app.get('/recommends/:faceType', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { faceType } = req.params;

        const [recommends] = await connection.query('SELECT * FROM `recommends` WHERE `face_type` = ?', [faceType]);

        res.json({
            recommends,
        });
    } finally {
        connection.release();
    }
}, async (err, req, res) => {
    res.status(500).json({
        message: err.message,
    });
});

const server = https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app);

server.listen(8443, () => {
    console.log(`Express server started at port ${server.address().port}`);
});