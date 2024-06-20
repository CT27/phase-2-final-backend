const jsonServer = require("json-server");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "db", "db.json"));
const middlewares = jsonServer.defaults();

server.use(cors());
server.use(jsonServer.bodyParser);
server.use(middlewares);

const PORT = process.env.PORT || 3000;

// Custom login endpoint
server.post("/api/login", (req, res) => {
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
server.post("/api/signup", (req, res) => {
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

server.use(router);

server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});
