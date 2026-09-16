const express = require("express");
const {
  ValidationError,
  NotFoundError,
  InsufficientStockError
} = require("../business/errors");

/**
 * Creates and configures the Presentation Tier router.
 * @param {import('../business/BookService')} bookService
 */
function createPresentationRouter(bookService) {
  const router = express.Router();

  // GET /api/books (view all books or search)
  router.get("/api/books", async (req, res) => {
    try {
      const query = req.query.q;
      const books = query
        ? await bookService.searchBooks(query)
        : await bookService.getAllBooks();
      res.status(200).json(books.map(b => b.toJSON()));
    } catch (err) {
      res.status(500).json({ error: "Failed to retrieve books." });
    }
  });

  // GET /api/books/:id (view single book)
  router.get("/api/books/:id", async (req, res) => {
    try {
      const book = await bookService.getBookById(req.params.id);
      res.status(200).json(book.toJSON());
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: "Internal server error." });
    }
  });

  // POST /api/books (add book)
  router.post("/api/books", async (req, res) => {
    try {
      const { title, author, isbn, publicationYear, quantity } = req.body;
      const created = await bookService.addBook({
        title,
        author,
        isbn,
        publicationYear,
        quantity
      });
      res.status(201).json(created.toJSON());
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to add book." });
    }
  });

  // PUT /api/books/:id (update book)
  router.put("/api/books/:id", async (req, res) => {
    try {
      const { title, author, isbn, publicationYear, quantity } = req.body;
      const updated = await bookService.updateBook(req.params.id, {
        title,
        author,
        isbn,
        publicationYear,
        quantity
      });
      res.status(200).json(updated.toJSON());
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to update book." });
    }
  });

  // DELETE /api/books/:id (delete book)
  router.delete("/api/books/:id", async (req, res) => {
    try {
      await bookService.deleteBook(req.params.id);
      res.status(200).json({ message: "Book deleted successfully." });
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to delete book." });
    }
  });

  // POST /api/books/:id/checkout (check out book)
  router.post("/api/books/:id/checkout", async (req, res) => {
    try {
      const checkedOutBook = await bookService.checkoutBook(req.params.id);
      res.status(200).json(checkedOutBook.toJSON());
    } catch (err) {
      if (err instanceof NotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof InsufficientStockError) {
        return res.status(409).json({ error: err.message });
      }
      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to checkout book." });
    }
  });

  return router;
}

module.exports = createPresentationRouter;
