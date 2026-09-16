const { DatabaseSync } = require("node:sqlite");
const BookRepositoryInterface = require("../business/BookRepositoryInterface");
const Book = require("../business/models/Book");

class SqliteBookRepository extends BookRepositoryInterface {
  constructor(dbPath = "library.db") {
    super();
    this.db = new DatabaseSync(dbPath);
    this._initTable();
  }

  _initTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT NOT NULL,
        publicationYear INTEGER NOT NULL,
        quantity INTEGER NOT NULL
      )
    `);
  }

  close() {
    if (this.db) {
      this.db.close();
    }
  }

  async add(book) {
    const insertStmt = this.db.prepare(`
      INSERT INTO books (title, author, isbn, publicationYear, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insertStmt.run(
      book.title,
      book.author,
      book.isbn,
      book.publicationYear,
      book.quantity
    );
    return new Book({
      id: Number(result.lastInsertRowid),
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publicationYear: book.publicationYear,
      quantity: book.quantity
    });
  }

  async getById(id) {
    const stmt = this.db.prepare("SELECT * FROM books WHERE id = ?");
    const row = stmt.get(id);
    if (!row) return null;
    return new Book({
      id: Number(row.id),
      title: String(row.title),
      author: String(row.author),
      isbn: String(row.isbn),
      publicationYear: Number(row.publicationYear),
      quantity: Number(row.quantity)
    });
  }

  async getAll() {
    const stmt = this.db.prepare("SELECT * FROM books ORDER BY id DESC");
    const rows = stmt.all();
    return rows.map(
      r =>
        new Book({
          id: Number(r.id),
          title: String(r.title),
          author: String(r.author),
          isbn: String(r.isbn),
          publicationYear: Number(r.publicationYear),
          quantity: Number(r.quantity)
        })
    );
  }

  async search(query) {
    const stmt = this.db.prepare(`
      SELECT * FROM books
      WHERE title LIKE ? OR author LIKE ?
      ORDER BY id DESC
    `);
    const pattern = `%${query}%`;
    const rows = stmt.all(pattern, pattern);
    return rows.map(
      r =>
        new Book({
          id: Number(r.id),
          title: String(r.title),
          author: String(r.author),
          isbn: String(r.isbn),
          publicationYear: Number(r.publicationYear),
          quantity: Number(r.quantity)
        })
    );
  }

  async update(book) {
    const stmt = this.db.prepare(`
      UPDATE books
      SET title = ?, author = ?, isbn = ?, publicationYear = ?, quantity = ?
      WHERE id = ?
    `);
    stmt.run(
      book.title,
      book.author,
      book.isbn,
      book.publicationYear,
      book.quantity,
      book.id
    );
    return new Book({ ...book });
  }

  async delete(id) {
    const stmt = this.db.prepare("DELETE FROM books WHERE id = ?");
    const result = stmt.run(id);
    return Number(result.changes) > 0;
  }
}

module.exports = SqliteBookRepository;
