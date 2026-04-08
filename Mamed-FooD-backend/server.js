const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.json());
app.use(cors());

// MySQL connection
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

  // check user exists
  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false, message: "DB error" });
      }

      if (result.length > 0) {
        return res.json({ success: false, message: "İstifadəçi adı mövcuddur" });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // insert user
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
    }
  );
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({ success: false, message: "Boş xana ola bilməz" });
  }

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  db.query(query, (err, result) => {
    if (err) {
      console.log(err);
      return res.json({ success: false, message: "DB error" });
    }

    if (result.length > 0) {
      return res.json({ success: true });
    } else {
      return res.json({ success: false, message: "Login uğursuzdur" });
    }
  });
});

// ================= START SERVER =================
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
