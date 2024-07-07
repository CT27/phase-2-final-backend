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

const PORT = process.env.PORT || 3000;

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
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "db.json")));
  const user = db.users.find(
    (u) => u.email === email && u.password === password
  );

  if (user) {
    res.json({ message: "Login successful", user });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

// Custom signup endpoint
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "db.json")));
  const userExists = db.users.find((u) => u.email === email);

  if (userExists) {
    res.status(400).json({ message: "User already exists" });
  } else {
    const newUser = { id: Date.now(), name, email, password };
    db.users.push(newUser);
    fs.writeFileSync(
      path.join(__dirname, "db", "db.json"),
      JSON.stringify(db, null, 2)
    );
    res.json({ message: "Signup successful", user: newUser });
  }
});

// Endpoint to handle forgot password request
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "db.json")));
  const user = db.users.find((user) => user.email === email);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Generate reset token (for simplicity, using a simple random token here)
  const resetToken = generateRandomToken(); // Implement a function to generate a random token
  user.resetToken = resetToken;

  // Update user data in db.json
  fs.writeFileSync(
    path.join(__dirname, "db", "db.json"),
    JSON.stringify(db, null, 2)
  );

  // Send reset password email
  sendResetPasswordEmail(user.email, resetToken);

  res.json({ message: "Password reset email sent successfully" });
});

// Endpoint to handle reset password
app.post("/reset-password", (req, res) => {
  const { email, token, newPassword } = req.body;
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "db.json")));
  const user = db.users.find((user) => user.email === email);

  if (!user || user.resetToken !== token) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  // Update user's password
  user.password = newPassword;
  delete user.resetToken; // Remove reset token after password is reset

  // Update user data in db.json
  fs.writeFileSync(
    path.join(__dirname, "db", "db.json"),
    JSON.stringify(db, null, 2)
  );

  res.json({ message: "Password reset successfully" });
});

// Helper function to send reset password email
function sendResetPasswordEmail(email, token) {
  // Configure transporter for sending email (nodemailer example)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "your.email@gmail.com",
      pass: "your_password",
    },
  });

  // Compose email
  const mailOptions = {
    from: "your.email@gmail.com",
    to: email,
    subject: "Password Reset Request",
    text: `Click the following link to reset your password: http://localhost:3000/reset-password?token=${token}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

// Function to generate random token (for simplicity)
function generateRandomToken() {
  return Math.random().toString(36).substr(2, 10); // Generate a 10-character random string
}

// Start JSON Server
jsonServerApp.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});

// Start Express app
app.listen(PORT, () => {
  console.log(`Express app is running on http://localhost:${PORT}`);
});
