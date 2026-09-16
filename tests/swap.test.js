const fs = require("fs");
const path = require("path");
const BookService = require("../business/BookService");
const SqliteBookRepository = require("../data/SqliteBookRepository");
const InMemoryBookRepository = require("../data/InMemoryBookRepository");

describe("Data Layer Swap Test: Proving Loose Coupling", () => {
  const testDbPath = path.join(__dirname, "swap_test.db");
  let sqliteRepoInstance = null;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (_) {}
    }
  });

  afterEach(() => {
    if (sqliteRepoInstance) {
      sqliteRepoInstance.close();
      sqliteRepoInstance = null;
    }
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (_) {}
    }
  });

  async function runStandardLifecycle(repository) {
    // 1. Inject repository into BookService without altering any business logic
    const service = new BookService(repository);

    // 2. Add Book
    const added = await service.addBook({
      title: "Structure and Interpretation of Computer Programs",
      author: "Harold Abelson, Gerald Jay Sussman",
      isbn: "9780262510875",
      publicationYear: 1996,
      quantity: 3
    });
    expect(added.id).toBeDefined();
    expect(added.title).toBe(
      "Structure and Interpretation of Computer Programs"
    );

    // 3. Retrieve All Books
    const all = await service.getAllBooks();
    expect(all.length).toBe(1);

    // 4. Search Books (partial match)
    const searchResults = await service.searchBooks("abelson");
    expect(searchResults.length).toBe(1);

    // 5. Checkout Book (decrement quantity)
    const afterCheckout = await service.checkoutBook(added.id);
    expect(afterCheckout.quantity).toBe(2);

    // 6. Update Book
    const updated = await service.updateBook(added.id, {
      title: "SICP - 2nd Edition",
      author: "Harold Abelson, Gerald Jay Sussman",
      isbn: "9780262510875",
      publicationYear: 1996,
      quantity: 5
    });
    expect(updated.title).toBe("SICP - 2nd Edition");
    expect(updated.quantity).toBe(5);

    // 7. Delete Book
    const isDeleted = await service.deleteBook(added.id);
    expect(isDeleted).toBe(true);

    const remaining = await service.getAllBooks();
    expect(remaining.length).toBe(0);
  }

  test("Business Logic behaves identically with InMemoryBookRepository", async () => {
    const memoryRepo = new InMemoryBookRepository();
    await runStandardLifecycle(memoryRepo);
  });

  test("Business Logic behaves identically with SqliteBookRepository", async () => {
    sqliteRepoInstance = new SqliteBookRepository(testDbPath);
    await runStandardLifecycle(sqliteRepoInstance);
  });
});
