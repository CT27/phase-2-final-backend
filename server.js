const jsonServer = require("json-server");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db", "db.json"));
const middlewares = jsonServer.defaults();

const PORT = process.env.PORT || 3001;

server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

// Use default JSON Server middlewares
server.use(middlewares);

// Custom signup endpoint
server.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;
  const dbPath = path.join(__dirname, "db", "db.json");
  console.log("Signup request received for:", email);

  try {
    const db = JSON.parse(fs.readFileSync(dbPath));
    console.log("Current users in db:", db.users);

    const userExists = db.users.find((u) => u.email === email);
    console.log("User exists:", userExists);

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
      console.log("New user added:", newUser);
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      res.json({ message: "Signup successful", user: newUser });
    }
  } catch (error) {
    console.error("Error reading or writing db.json:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Custom login endpoint
server.post("/api/login", (req, res) => {
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

// Custom update user endpoint
server.patch("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email } = req.body;
  const dbPath = path.join(__dirname, "db", "db.json");

  try {
    const db = JSON.parse(fs.readFileSync(dbPath));
    const userIndex = db.users.findIndex((u) => u.id === userId);

    if (userIndex !== -1) {
      db.users[userIndex].name = name || db.users[userIndex].name;
      db.users[userIndex].email = email || db.users[userIndex].email;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      res.json({
        message: "User details updated successfully",
        user: db.users[userIndex],
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Use default JSON Server router
server.use("/api", router);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
