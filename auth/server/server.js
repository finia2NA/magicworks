import db from './database.js';
import { setup, insertUser, getUser } from './database.js';
setup(db);

import express from 'express';
import bcrypt from 'bcrypt';

const app = express();
const port = 12345;
app.use(express.json());

const activeTokens = new Set();

app.post('/register', (req, res) => {
  console.log(req.body);
  const { email, pw } = req.body;

  // Generate a salt
  const saltRounds = 10;
  bcrypt.genSalt(saltRounds, (err, salt) => {
    // Hash the password using the generated salt
    bcrypt.hash(pw, salt, (err, hash) => {
      // Insert the new user into the database
      insertUser(email, hash, salt);
      res.sendStatus(200);
    });
  });
});

app.post('/login', (req, res) => {
  const { email, pw } = req.body;

  // Get the user from the database
  getUser(email, (user) => {
    if (user) {
      // Compare the password to the hash
      bcrypt.compare(pw, user.pwHash, (err, result) => {
        if (result) {
          // Generate a token
          const token = Math.random().toString(36).substring(2, 15);
          console.log("Added token: " + token)
          activeTokens.add(token);
          res.json({ token });
        } else {
          res.sendStatus(401);
        }
      });
    } else {
      res.sendStatus(401);
    }
  });
});

app.post('/logout', (req, res) => {
  console.log("received logout request.");
  const { token } = req.body;
  activeTokens.delete(token);
  res.sendStatus(200);
  console.log("removed token: " + token);
});

// Start the server
app.listen(port, () => console.log(`Listening on port ${port}`));

// print url
console.log(`http://localhost:${port}/`);

// every 5 seconds, print active tokens
setInterval(() => {
  console.log("Active tokens: " + JSON.stringify(Array.from(activeTokens)));
}, 5000);