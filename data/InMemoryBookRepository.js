const BookRepositoryInterface = require("../business/BookRepositoryInterface");
const Book = require("../business/models/Book");

class InMemoryBookRepository extends BookRepositoryInterface {
  constructor(initialBooks = []) {
    super();
    this.books = new Map();
    this.nextId = 1;

    for (const book of initialBooks) {
      this.add(book);
    }
  }

  async add(book) {
    const id = this.nextId++;
    const storedBook = new Book({
      id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      publicationYear: book.publicationYear,
      quantity: book.quantity
    });
    this.books.set(id, storedBook);
    return new Book({ ...storedBook });
  }

  async getById(id) {
    const book = this.books.get(id);
    if (!book) return null;
    return new Book({ ...book });
  }

  async getAll() {
    return Array.from(this.books.values())
      .map(b => new Book({ ...b }))
      .sort((a, b) => b.id - a.id);
  }

  async search(query) {
    const q = query.toLowerCase();
    return Array.from(this.books.values())
      .filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      )
      .map(b => new Book({ ...b }))
      .sort((a, b) => b.id - a.id);
  }

  async update(book) {
    if (!this.books.has(book.id)) {
      throw new Error(`Book with id ${book.id} not found in memory store.`);
    }
    const updated = new Book({ ...book });
    this.books.set(book.id, updated);
    return new Book({ ...updated });
  }

  async delete(id) {
    return this.books.delete(id);
  }
}

module.exports = InMemoryBookRepository;
