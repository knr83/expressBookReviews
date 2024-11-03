const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => { //returns boolean
    return users.some(user => user.username === username);
}

const authenticatedUser = (username, password) => { //returns boolean
    return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req, res) => {
    const {username, password} = req.body;

    if (!username || !password) {
        return res.status(400).json({message: "Username and password are required"});
    }
    if (!authenticatedUser(username, password)) {
        return res.status(401).json({message: "Invalid username or password"});
    }
    const accessToken = jwt.sign({username}, 'access', {expiresIn: '1h'});

    return res.status(200).json({
        message: "Login successful",
        accessToken
    });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;
    const username = req.user?.username || req.session.authorization?.username; // Try both session and user

    if (!username) {
        return res.status(401).json({message: "User not authenticated"});
    }
    if (!review) {
        return res.status(400).json({message: "Review content is required"});
    }
    const booksByIsbn = Object.values(books).filter(book => book.isbn === isbn);

    if (!booksByIsbn) {
        return res.status(404).json({message: "Book not found with given ISBN"});
    }

    // Add or update the review
    if (!booksByIsbn.reviews) {
        booksByIsbn.reviews = {};
    }
    booksByIsbn.reviews[username] = review;

    return res.status(200).json({
        message: "Review added or updated successfully",
        reviews: booksByIsbn.reviews
    });

});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const {isbn} = req.params;
    const token = req.headers.authorization?.split(" ")[1]; // Get JWT token from Authorization header

    if (!token) {
        return res.status(401).json({message: "Authorization token required"});
    }

    try {
        // Decode JWT to get the username
        const decoded = jwt.verify(token, 'access');
        const username = decoded.username;

        // Find the book by ISBN
        const book = Object.values(books).find(book => book.isbn === isbn);
        if (!book || !book.reviews) {
            return res.status(404).json({message: "Book or reviews not found"});
        }

        // Check if the review by this user exists
        if (!book.reviews[username]) {
            return res.status(403).json({message: "No review found for this user"});
        }

        delete book.reviews[username];

        return res.status(200).json({
            message: "Review deleted successfully",
            reviews: book.reviews
        });

    } catch (error) {
        return res.status(403).json({message: "Invalid or expired token"});
    }
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
