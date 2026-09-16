const Book = require("./models/Book");
const {
  ValidationError,
  NotFoundError,
  InsufficientStockError
} = require("./errors");

class BookService {
  /**
   * @param {import('./BookRepositoryInterface')} repository
   */
  constructor(repository) {
    if (!repository) {
      throw new Error("A repository instance is required by BookService.");
    }
    this.repository = repository;
  }

  /**
   * Internal validation for book properties enforcing all business rules.
   */
  _validateBookData(title, author, isbn, publicationYear, quantity) {
    // 1. Title and Author cannot be empty or only whitespace
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new ValidationError("Title cannot be empty.");
    }
    if (!author || typeof author !== "string" || !author.trim()) {
      throw new ValidationError("Author cannot be empty.");
    }

    // 2. Publication Year must be a valid integer and not in the future
    const currentYear = new Date().getFullYear();
    const year = Number(publicationYear);
    if (!Number.isInteger(year)) {
      throw new ValidationError("Publication year must be a valid integer.");
    }
    if (year > currentYear) {
      throw new ValidationError(
        `Publication year cannot be in the future (max allowed: ${currentYear}).`
      );
    }
    if (year <= 0) {
      throw new ValidationError("Publication year must be greater than zero.");
    }

    // 3. ISBN must be exactly 10 or 13 digits (stripping hyphens and spaces)
    if (!isbn || typeof isbn !== "string") {
      throw new ValidationError("ISBN is required.");
    }
    const cleanIsbn = isbn.replace(/[-\s]/g, "");
    if (!/^\d{10}$|^\d{13}$/.test(cleanIsbn)) {
      throw new ValidationError(
        "ISBN must consist of exactly 10 or 13 numeric digits."
      );
    }

    // 4. Quantity cannot be negative
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      throw new ValidationError("Quantity must be a non-negative integer.");
    }

    return {
      title: title.trim(),
      author: author.trim(),
      isbn: cleanIsbn,
      publicationYear: year,
      quantity: qty
    };
  }

  async addBook(data) {
    const validated = this._validateBookData(
      data.title,
      data.author,
      data.isbn,
      data.publicationYear,
      data.quantity
    );

    const book = new Book(validated);
    return await this.repository.add(book);
  }

  async getAllBooks() {
    return await this.repository.getAll();
  }

  async getBookById(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      throw new ValidationError("Invalid book ID.");
    }
    const book = await this.repository.getById(numericId);
    if (!book) {
      throw new NotFoundError(`Book with ID ${numericId} was not found.`);
    }
    return book;
  }

  async searchBooks(query) {
    if (!query || typeof query !== "string" || !query.trim()) {
      return await this.getAllBooks();
    }
    return await this.repository.search(query.trim());
  }

  async updateBook(id, data) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      throw new ValidationError("Invalid book ID.");
    }

    const existingBook = await this.repository.getById(numericId);
    if (!existingBook) {
      throw new NotFoundError(
        `Cannot update: Book with ID ${numericId} does not exist.`
      );
    }

    const validated = this._validateBookData(
      data.title,
      data.author,
      data.isbn,
      data.publicationYear,
      data.quantity
    );

    const updatedBook = new Book({
      id: numericId,
      ...validated
    });

    return await this.repository.update(updatedBook);
  }

  async deleteBook(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      throw new ValidationError("Invalid book ID.");
    }

    const existingBook = await this.repository.getById(numericId);
    if (!existingBook) {
      throw new NotFoundError(
        `Cannot delete: Book with ID ${numericId} does not exist.`
      );
    }

    return await this.repository.delete(numericId);
  }

  async checkoutBook(id) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      throw new ValidationError("Invalid book ID.");
    }

    const book = await this.repository.getById(numericId);
    if (!book) {
      throw new NotFoundError(
        `Cannot check out: Book with ID ${numericId} does not exist.`
      );
    }

    // Enforce business rule: cannot checkout if quantity <= 0
    if (book.quantity <= 0) {
      throw new InsufficientStockError(
        `Cannot check out '${book.title}': No copies available (Quantity is 0).`
      );
    }

    book.quantity -= 1;
    return await this.repository.update(book);
  }
}

module.exports = BookService;
