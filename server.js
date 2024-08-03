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
server.use(middlewares);

const readDb = () =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "db", "db.json")));
const writeDb = (db) =>
  fs.writeFileSync(
    path.join(__dirname, "db", "db.json"),
    JSON.stringify(db, null, 2)
  );

// Custom signup endpoint
server.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;
  const dbPath = path.join(__dirname, "db", "db.json");
  console.log("Signup request received for:", email);

  try {
    const db = readDb();
    console.log("Current users in db:", db.users);

    const userExists = db.users.find((u) => u.email === email);
    console.log("User exists:", userExists);

    if (userExists) {
      console.log("User already exists");
      res.status(400).json({ message: "User already exists" });
    } else {
      const newUser = {
        id: Date.now().toString(), // Use Date.now() for unique ID
        name,
        email,
        password,
        profilePicture: "path/to/default/profile/photo.jpg",
      };
      db.users.push(newUser);
      console.log("New user added:", newUser);
      writeDb(db);
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
    const db = readDb();
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
server.patch("/api/users/:id", (req, res) => {
  const userId = req.params.id.toString(); // Ensure userId is treated as a string
  const { name, email, profilePicture } = req.body;
  const dbPath = path.join(__dirname, "db", "db.json");

  try {
    const db = readDb();
    console.log("Patching user with ID:", userId);

    // Log the IDs of all users in the database for debugging
    db.users.forEach((user, index) => {
      console.log(
        `User ${index}: ID=${user.id}, Name=${user.name}, Email=${user.email}`
      );
    });

    // Verify if IDs are being compared as strings
    const userIndex = db.users.findIndex((u) => u.id.toString() === userId);
    console.log("User index found:", userIndex);
    console.log("User ID type in db:", typeof db.users[userIndex]?.id);
    console.log("Provided User ID type:", typeof userId);

    if (userIndex !== -1) {
      db.users[userIndex].name = name || db.users[userIndex].name;
      db.users[userIndex].email = email || db.users[userIndex].email;
      db.users[userIndex].profilePicture =
        profilePicture || db.users[userIndex].profilePicture;
      writeDb(db);
      res.json({
        message: "User details updated successfully",
        user: db.users[userIndex],
      });
    } else {
      console.log("User not found");
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
