const express = require("express");
const bodyParser = require("body-parser");
const jsonServer = require("json-server");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
const jsonServerApp = jsonServer.create();
const jsonRouter = jsonServer.router(path.join(__dirname, "db", "db.json"));
const middlewares = jsonServer.defaults();

const PORT_JSON_SERVER = process.env.PORT_JSON_SERVER || 3000;
const PORT_EXPRESS_SERVER = process.env.PORT_EXPRESS_SERVER || 3001;

const cors = require("cors");
app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// JSON Server middleware
jsonServerApp.use(middlewares);

// JSON Server routes
jsonServerApp.use("/api", jsonRouter);

// Custom login endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const dbPath = path.join(__dirname, "db", "db.json");
  console.log("Login request received for:", email);

  try {
    const db = JSON.parse(fs.readFileSync(dbPath));
    const user = db.users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      console.log("Login successful for user:", user);
      res.json({ message: "Login successful", user });
    } else {
      console.log("Invalid email or password");
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error reading or parsing db.json:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Custom signup endpoint
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;
  const dbPath = path.join(__dirname, "db", "db.json");
  console.log("Signup request received for:", email);

  try {
    const db = JSON.parse(fs.readFileSync(dbPath));
    const userExists = db.users.find((u) => u.email === email);

    if (userExists) {
      console.log("User already exists");
      res.status(400).json({ message: "User already exists" });
    } else {
      const newUser = {
        id: Date.now(),
        name,
        email,
        password,
        profilePicture: "path/to/default/profile/photo.jpg",
      };
      db.users.push(newUser);
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      console.log("Signup successful for user:", newUser);
      res.json({ message: "Signup successful", user: newUser });
    }
  } catch (error) {
    console.error("Error reading or writing db.json:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to handle forgot password request
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const dbPath = path.join(__dirname, "db", "db.json");
  console.log("Forgot password request received for:", email);

  try {
    const db = JSON.parse(fs.readFileSync(dbPath));
    const user = db.users.find((user) => user.email === email);

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    user.resetToken = resetToken;

    // Update user data in db.json
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // Send reset password email
    sendResetPasswordEmail(user.email, resetToken);

    console.log("Password reset email sent to:", email);
    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error reading or writing db.json:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Endpoint to handle reset password
app.post("/reset-password", (req, res) => {
  const { email, token, newPassword } = req.body;
  const dbPath = path.join(__dirname, "db", "db.json");
  console.log("Reset password request received for:", email);

  try {
    const db = JSON.parse(fs.readFileSync(dbPath));
    const user = db.users.find((user) => user.email === email);

    if (!user || user.resetToken !== token) {
      console.log("Invalid or expired token");
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update user's password
    user.password = newPassword;
    delete user.resetToken; // Remove reset token after password is reset

    // Update user data in db.json
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    console.log("Password reset successfully for user:", email);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error reading or writing db.json:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Helper function to send reset password email
function sendResetPasswordEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your.email@gmail.com",
      pass: "your_password",
    },
  });

  const mailOptions = {
    from: "your.email@gmail.com",
    to: email,
    subject: "Password Reset Request",
    text: `Click the following link to reset your password: http://localhost:${PORT_EXPRESS_SERVER}/reset-password?token=${token}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

// Function to generate random token
function generateRandomToken() {
  return Math.random().toString(36).substr(2, 10);
}

// JSON Server
jsonServerApp.use(middlewares);
jsonServerApp.use("/api", jsonRouter);

// Start JSON Server
jsonServerApp.listen(PORT_JSON_SERVER, () => {
  console.log(`JSON Server is running on http://localhost:${PORT_JSON_SERVER}`);
});

// Custom Express routes (on a different port or different path)
// Start Express app
app.listen(PORT_EXPRESS_SERVER, () => {
  console.log(
    `Express app is running on http://localhost:${PORT_EXPRESS_SERVER}`
  );
});
