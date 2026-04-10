const jsonServer = require("json-server");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

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

// Strip password before returning user to client
const safeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

// Custom signup endpoint
server.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Signup request received for:", email);

  try {
    const db = readDb();

    const userExists = db.users.find((u) => u.email === email);
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      profilePicture: "path/to/default/profile/photo.jpg",
    };
    db.users.push(newUser);
    writeDb(db);
    res.json({ message: "Signup successful", user: safeUser(newUser) });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Custom login endpoint
server.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Login request received for:", email);

  try {
    const db = readDb();
    const user = db.users.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      res.json({ message: "Login successful", user: safeUser(user) });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Custom update user endpoint
server.patch("/api/users/:id", (req, res) => {
  const userId = req.params.id.toString();
  const { name, email, profilePicture } = req.body;

  try {
    const db = readDb();
    const userIndex = db.users.findIndex((u) => u.id.toString() === userId);

    if (userIndex !== -1) {
      db.users[userIndex].name = name || db.users[userIndex].name;
      db.users[userIndex].email = email || db.users[userIndex].email;
      db.users[userIndex].profilePicture =
        profilePicture || db.users[userIndex].profilePicture;
      writeDb(db);
      res.json({
        message: "User details updated successfully",
        user: safeUser(db.users[userIndex]),
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
