import sqlite3 from 'sqlite3';

// Connect to the database (creates the file if it does not exist)
const db = new sqlite3.Database('./mydb.sqlite3', (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Close the database connection when the application is terminated
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Closed the database connection.');
    process.exit(0);
  });
});

export const setup = (db) => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    pwHash TEXT NOT NULL,
    salt TEXT NOT NULL
  )`, (err) => {
    if (err) {
      // Table already created
      console.error(err.message);
    } else {
      console.log('Table created');
    }
  });
}

export const insertUser = (email, pwHash, salt) => {
  db.run('INSERT INTO users (email, pwHash, salt) VALUES (?, ?, ?)', [email, pwHash, salt], (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log(`A row has been inserted.`);
  });
}

export const getUser = (email, callback) => {
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    callback(row);
  });
}

export default db;