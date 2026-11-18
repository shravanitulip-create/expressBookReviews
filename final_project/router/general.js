
const express = require('express');
const axios = require('axios');

let books = require('./booksdb.js');
let isValid = require('./auth_users.js').isValid;
let users = require('./auth_users.js').users;

const public_users = express.Router();

const API_BASE = 'http://localhost:5000';

// Registration
public_users.post('/register', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      message: 'Username and password are required'
    });
  }

  if (isValid(username)) {
    return res.status(409).json({
      message: 'User already exists'
    });
  }

  users.push({ username, password });

  return res.status(200).json({
    message: 'User successfully registered'
  });
});

// Internal data endpoints used by Axios
public_users.get('/_internal/books', (req, res) => {
  return res.json(books);
});

public_users.get('/_internal/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];

  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.json(book);
});

public_users.get('/_internal/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();

  const result = Object.values(books).filter(
    book => book.author.toLowerCase() === author
  );

  return res.json(result);
});

public_users.get('/_internal/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();

  const result = Object.values(books).filter(
    book => book.title.toLowerCase() === title
  );

  return res.json(result);
});

// Get all books using Axios and async/await
public_users.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${API_BASE}/_internal/books`);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: 'Error retrieving books'
    });
  }
});

// Get book by ISBN using Axios
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const response = await axios.get(
      `${API_BASE}/_internal/isbn/${encodeURIComponent(req.params.isbn)}`
    );

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error retrieving book'
    });
  }
});

// Get books by author using Axios
public_users.get('/author/:author', async (req, res) => {
  try {
    const response = await axios.get(
      `${API_BASE}/_internal/author/${encodeURIComponent(req.params.author)}`
    );

    if (response.data.length === 0) {
      return res.status(404).json({
        message: 'No books found for this author'
      });
    }

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error retrieving books'
    });
  }
});

// Get books by title using Axios
public_users.get('/title/:title', async (req, res) => {
  try {
    const response = await axios.get(
      `${API_BASE}/_internal/title/${encodeURIComponent(req.params.title)}`
    );

    if (response.data.length === 0) {
      return res.status(404).json({
        message: 'No books found with this title'
      });
    }

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Error retrieving books'
    });
  }
});

// Get book reviews
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews);
  }

  return res.status(404).json({
    message: 'Book not found'
  });
});

module.exports.general = public_users;
