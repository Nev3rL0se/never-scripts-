const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const port = 5000;

// Ensure scripts directory exists
fs.ensureDirSync(path.join(__dirname, 'scripts'));

app.use(express.urlencoded({ extended: true }));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the style.css file
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post('/create', upload.single('luaFile'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const name = req.body.name.replace(/[^a-z0-9-]/gi, '_').toLowerCase();
        const content = req.file.buffer.toString('utf8');
        
        await fs.writeFile(path.join(__dirname, 'scripts', name + '.lua'), content);
        
        const domain = req.get('host');
        const url = 'http://' + domain + '/scripts/' + name;
        
        res.json({ url: url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/scripts/:name', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'scripts', req.params.name + '.lua');
        if (await fs.pathExists(filePath)) {
            const content = await fs.readFile(filePath, 'utf8');
            res.setHeader('Content-Type', 'text/plain');
            res.send(content);
        } else {
            res.status(404).send('Script not found');
        }
    } catch (err) {
        res.status(500).send('Error reading script');
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log('Server running at http://0.0.0.0:' + port);
});
