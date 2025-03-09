const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = 3000;

app.use(express.static("public"));
app.use(cookieParser());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const fileName = Date.now() + path.extname(file.originalname);
        cb(null, fileName);
    },
});

const upload = multer({ storage });

app.use((req, res, next) => {
    if (!req.cookies.sessionId) {
        res.cookie("sessionId", uuidv4(), { maxAge: 86400000, httpOnly: true });
    }
    next();
});

app.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const sessionId = req.cookies.sessionId;
    const userHistoryPath = path.join(__dirname, `history_${sessionId}.json`);
    let history = [];

    if (fs.existsSync(userHistoryPath)) {
        history = JSON.parse(fs.readFileSync(userHistoryPath, "utf8"));
    }

    const fileData = {
        name: req.file.filename,
        originalName: req.file.originalname,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        status: "Berhasil",
        link: `/uploads/${req.file.filename}`,
    };

    history.push(fileData);
    fs.writeFileSync(userHistoryPath, JSON.stringify(history, null, 2));

    res.json(fileData);
});

app.get("/uploads", (req, res) => {
    const sessionId = req.cookies.sessionId;
    const userHistoryPath = path.join(__dirname, `history_${sessionId}.json`);
    if (!fs.existsSync(userHistoryPath)) return res.json([]);
    const history = JSON.parse(fs.readFileSync(userHistoryPath, "utf8"));
    res.json(history);
});

app.use("/uploads", express.static(uploadDir));

app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));