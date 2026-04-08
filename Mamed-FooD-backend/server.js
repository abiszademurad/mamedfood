const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(cors());

// Static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// ================= MYSQL CONNECTION =================
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "mamed_food"
});

db.connect((err) => {
    if (err) {
        console.log("DB connection error:", err);
    } else {
        console.log("MySQL connected");
    }
});

// ================= REGISTER =================
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: "Boş xana ola bilməz" });
    }

    db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "DB error" });
            }

            if (result.length > 0) {
                return res.json({ success: false, message: "İstifadəçi artıq var" });
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 10);

                db.query(
                    "INSERT INTO users (username, password) VALUES (?, ?)",
                    [username, hashedPassword],
                    (err) => {
                        if (err) {
                            console.log(err);
                            return res.json({ success: false, message: "Insert error" });
                        }

                        res.json({ success: true });
                    }
                );
            } catch (e) {
                console.log(e);
                res.json({ success: false, message: "Hash error" });
            }
        }
    );
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: "Boş xana ola bilməz" });
    }

    /*
    ⚠️ SQL INJECTION İZAHI:

    Bu hissədə hazırda parameterized query istifadə olunur:
        db.query("SELECT * FROM users WHERE username = ?", [username])

    Bu o deməkdir ki:
    - istifadəçi input-u birbaşa SQL query-yə string kimi daxil edilmir
    - MySQL avtomatik olaraq escape edir
    - SQL injection qarşısı alınır

    ƏGƏR belə yazılsaydı:
        "SELECT * FROM users WHERE username = '" + username + "'"

    onda attacker belə input verə bilərdi:
        username: ' OR '1'='1

    nəticədə query belə olardı:
        SELECT * FROM users WHERE username = '' OR '1'='1'

    Bu isə bütün istifadəçiləri qaytarardı → SQL Injection hücumu

    Bu layihədə injection riski parameterized query ilə qarşısı alınıb.
    */

    db.query(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, result) => {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: "DB error" });
            }

            if (result.length === 0) {
                return res.json({ success: false, message: "User tapılmadı" });
            }

            const user = result[0];

            try {
                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) {
                    return res.json({ success: false, message: "Şifrə yanlışdır" });
                }

                return res.json({ success: true });
            } catch (e) {
                console.log(e);
                return res.json({ success: false, message: "Compare error" });
            }
        }
    );
});

// ================= ROUTES =================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/mamedfood", (req, res) => {
    res.sendFile(path.join(__dirname, "mamedfood.html"));
});

// ================= START SERVER =================
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
