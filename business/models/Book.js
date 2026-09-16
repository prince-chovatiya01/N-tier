/**
 * Book Domain Entity
 */

class Book {
  constructor({ id = null, title, author, isbn, publicationYear, quantity }) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.isbn = isbn;
    this.publicationYear = publicationYear;
    this.quantity = quantity;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      author: this.author,
      isbn: this.isbn,
      publicationYear: this.publicationYear,
      quantity: this.quantity
    };
  }
}

module.exports = Book;
