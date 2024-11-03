const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;
const users = require('./router/auth_users.js').users;

// Check if a user with the given username already exists
const doesExist = (username) => {
    return users.some(user => user.username === username);
};

// Check if the user with the given username and password exists
const authenticatedUser = (username, password) => {
    return users.some(user => user.username === username && user.password === password);
};

const app = express();

app.use(express.json());

app.use("/customer", session({
    secret: "access",
    resave: true,
    saveUninitialized: true
}))

// Authentication middleware for "/customer/auth/*" routes
app.use("/customer/auth/*", function auth(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    jwt.verify(token, "access", (err, user) => {
        if (!err) {
            req.user = user;
            next();
        } else {
            return res.status(403).json({ message: "User not authenticated" });
        }
    });
});

// Login endpoint
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (authenticatedUser(username, password)) {
        const accessToken = jwt.sign({ username }, 'access', { expiresIn: '1h' });

        req.session.authorization = {
            accessToken,
            username
        };

        return res.status(200).json({ message: "User successfully logged in" });
    } else {
        return res.status(401).json({ message: "Invalid login credentials" });
    }
});

// Register a new user
app.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (username && password) {
        if (!doesExist(username)) {
            users.push({ username, password });
            return res.status(201).json({ message: "User successfully registered. Now you can login" });
        } else {
            return res.status(409).json({ message: "User already exists" });
        }
    }
    return res.status(400).json({ message: "Username and password are required" });
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
