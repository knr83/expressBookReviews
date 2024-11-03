const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');


public_users.post("/register", (req, res) => {
    const {username, password} = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({message: "Username and password are required"});
    }

    // Check if the username already exists
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return res.status(409).json({message: "Username already exists"});
    }

    // Register the new user
    users.push({username, password});
    return res.status(201).json({message: "User registered successfully"});
});

// Get the book list available in the shop
const fetchBooksWithAxios = () => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                resolve(books);
            } catch (error) {
                reject(new Error("Failed to fetch books"));
            }
        }, 3000);
    });
};

public_users.get('/', (req, res) => {
    fetchBooksWithAxios()
        .then((booksList) => {
            res.status(200).json(booksList);
        })
        .catch((error) => {
            res.status(500).json({message: 'Error fetching book list', error: error.message});
        });
});

// Get book details based on ISBN
const fetchBookByIsbnWithAxios = (isbn) => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const booksByIsbn = Object.values(books).filter(book => book.isbn === isbn);

                if (booksByIsbn.length > 0) {
                    resolve(booksByIsbn);
                } else {
                    reject(new Error("Book not found with given ISBN"));
                }
            } catch (error) {
                reject(new Error("Failed to fetch book by ISBN"));
            }
        }, 3000);
    });
};

public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    fetchBookByIsbnWithAxios(isbn)
        .then((booksByIsbn) => {
            res.status(200).json(booksByIsbn);
        })
        .catch((error) => {
            res.status(404).json({message: error.message});
        });
});

// Get book details based on author
const fetchBooksByAuthorWithAxios = (author) => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const booksByAuthor = Object.values(books).filter(book => book.author === author);
                if (booksByAuthor.length > 0) {
                    resolve(booksByAuthor);
                } else {
                    reject(new Error("No books found by this author"));
                }
            } catch (error) {
                reject(new Error("Failed to fetch books by author"));
            }
        }, 3000);
    });
};

public_users.get('/author/:author', (req, res) => {
    const author = req.params.author;
    fetchBooksByAuthorWithAxios(author)
        .then((booksByAuthor) => {
            res.status(200).json(booksByAuthor);
        })
        .catch((error) => {
            res.status(404).json({message: error.message});
        });
});

// Get all books based on title
const fetchBooksByTitleWithAxios = (title) => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const booksByTitle = Object.values(books).filter(book =>
                    book.title.toLowerCase().includes(title.toLowerCase())
                );

                if (booksByTitle.length > 0) {
                    resolve(booksByTitle);
                } else {
                    reject(new Error("No books found by this title"));
                }
            } catch (error) {
                reject(new Error("Failed to fetch books by title"));
            }
        }, 3000);
    });
};

public_users.get('/title/:title', (req, res) => {
    const title = req.params.title;
    fetchBooksByTitleWithAxios(title)
        .then((booksByTitle) => {
            res.status(200).json(booksByTitle);
        })
        .catch((error) => {
            res.status(404).json({message: error.message});
        });
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const booksByIsbn = Object.values(books).find(book => book.isbn === isbn);

    if (booksByIsbn) {
        return res.status(200).json(booksByIsbn.reviews);
    } else {
        return res.status(404).json({message: "Reviews not found for the given ISBN"});
    }
});

module.exports.general = public_users;
