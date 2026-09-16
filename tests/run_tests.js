/**
 * Native Node.js test runner suite for Business Logic and Swap tests.
 * Runs instantly without requiring external test binaries.
 * Command: node tests/run_tests.js
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const BookService = require("../business/BookService");
const BookRepositoryInterface = require("../business/BookRepositoryInterface");
const Book = require("../business/models/Book");
const {
  ValidationError,
  NotFoundError,
  InsufficientStockError
} = require("../business/errors");
const InMemoryBookRepository = require("../data/InMemoryBookRepository");
const SqliteBookRepository = require("../data/SqliteBookRepository");

class FakeBookRepository extends BookRepositoryInterface {
  constructor() {
    super();
    this.storage = new Map();
    this.idCounter = 1;
  }

  async add(book) {
    const id = this.idCounter++;
    const saved = new Book({ ...book, id });
    this.storage.set(id, saved);
    return new Book({ ...saved });
  }

  async getById(id) {
    const b = this.storage.get(id);
    return b ? new Book({ ...b }) : null;
  }

  async getAll() {
    return Array.from(this.storage.values()).map(b => new Book({ ...b }));
  }

  async search(query) {
    const q = query.toLowerCase();
    return Array.from(this.storage.values())
      .filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      )
      .map(b => new Book({ ...b }));
  }

  async update(book) {
    this.storage.set(book.id, new Book({ ...book }));
    return new Book({ ...book });
  }

  async delete(id) {
    return this.storage.delete(id);
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("  RUNNING 3-TIER APPLICATION TEST SUITE (NATIVE RUNNER)");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failed++;
    }
  }

  console.log("--- 1. Business Logic Tier Unit Tests (Mock Data Tier) ---");

  await test("Successfully adds a valid book", async () => {
    const service = new BookService(new FakeBookRepository());
    const res = await service.addBook({
      title: "Domain-Driven Design",
      author: "Eric Evans",
      isbn: "9780321125217",
      publicationYear: 2003,
      quantity: 5
    });
    assert.strictEqual(res.id, 1);
    assert.strictEqual(res.title, "Domain-Driven Design");
    assert.strictEqual(res.quantity, 5);
  });

  await test("Rejects empty or whitespace title", async () => {
    const service = new BookService(new FakeBookRepository());
    let errorThrown = false;
    try {
      await service.addBook({
        title: "   ",
        author: "Valid Author",
        isbn: "9780321125217",
        publicationYear: 2020,
        quantity: 1
      });
    } catch (e) {
      if (e instanceof ValidationError) errorThrown = true;
    }
    assert.strictEqual(errorThrown, true);
  });

  await test("Rejects future publication year", async () => {
    const service = new BookService(new FakeBookRepository());
    const futureYear = new Date().getFullYear() + 1;
    let errorThrown = false;
    try {
      await service.addBook({
        title: "Future Computing",
        author: "Time Traveler",
        isbn: "9780321125217",
        publicationYear: futureYear,
        quantity: 1
      });
    } catch (e) {
      if (e instanceof ValidationError) errorThrown = true;
    }
    assert.strictEqual(errorThrown, true);
  });

  await test("Enforces 10 or 13 digit ISBN validation", async () => {
    const service = new BookService(new FakeBookRepository());
    let errorThrown = false;
    try {
      await service.addBook({
        title: "Bad ISBN",
        author: "Author",
        isbn: "12345",
        publicationYear: 2020,
        quantity: 1
      });
    } catch (e) {
      if (e instanceof ValidationError) errorThrown = true;
    }
    assert.strictEqual(errorThrown, true);

    const valid10 = await service.addBook({
      title: "Clean 10",
      author: "Author",
      isbn: "0-321-12521-5",
      publicationYear: 2020,
      quantity: 1
    });
    assert.strictEqual(valid10.isbn, "0321125215");
  });

  await test("Rejects negative quantity", async () => {
    const service = new BookService(new FakeBookRepository());
    let errorThrown = false;
    try {
      await service.addBook({
        title: "Negative Stock",
        author: "Author",
        isbn: "9780321125217",
        publicationYear: 2020,
        quantity: -2
      });
    } catch (e) {
      if (e instanceof ValidationError) errorThrown = true;
    }
    assert.strictEqual(errorThrown, true);
  });

  await test("Checkout decrements quantity by 1", async () => {
    const service = new BookService(new FakeBookRepository());
    const book = await service.addBook({
      title: "Refactoring",
      author: "Martin Fowler",
      isbn: "9780201485677",
      publicationYear: 1999,
      quantity: 2
    });
    const updated = await service.checkoutBook(book.id);
    assert.strictEqual(updated.quantity, 1);
  });

  await test("Checkout at quantity 0 throws InsufficientStockError", async () => {
    const service = new BookService(new FakeBookRepository());
    const book = await service.addBook({
      title: "Out of stock book",
      author: "Jane Doe",
      isbn: "9780201485677",
      publicationYear: 2015,
      quantity: 0
    });
    let errorThrown = false;
    try {
      await service.checkoutBook(book.id);
    } catch (e) {
      if (e instanceof InsufficientStockError) errorThrown = true;
    }
    assert.strictEqual(errorThrown, true);
  });

  await test("Search matches partial title and author", async () => {
    const service = new BookService(new FakeBookRepository());
    await service.addBook({
      title: "Clean Architecture",
      author: "Robert C. Martin",
      isbn: "9780134494166",
      publicationYear: 2017,
      quantity: 2
    });
    const results = await service.searchBooks("archi");
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].title, "Clean Architecture");
  });

  console.log("\n--- 2. Data Tier Swap Tests (Loose Coupling Verification) ---");

  async function testLifecycle(repository) {
    const service = new BookService(repository);
    const added = await service.addBook({
      title: "SICP",
      author: "Abelson & Sussman",
      isbn: "9780262510875",
      publicationYear: 1996,
      quantity: 3
    });
    assert.strictEqual(added.title, "SICP");

    const checked = await service.checkoutBook(added.id);
    assert.strictEqual(checked.quantity, 2);

    const searchRes = await service.searchBooks("Abelson");
    assert.strictEqual(searchRes.length, 1);

    const deleted = await service.deleteBook(added.id);
    assert.strictEqual(deleted, true);

    const all = await service.getAllBooks();
    assert.strictEqual(all.length, 0);
  }

  await test("Swap: In-Memory Repository lifecycle", async () => {
    await testLifecycle(new InMemoryBookRepository());
  });

  await test("Swap: SQLite Repository lifecycle", async () => {
    const testDb = path.join(__dirname, "native_test.db");
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
    const sqliteRepo = new SqliteBookRepository(testDb);
    await testLifecycle(sqliteRepo);
    sqliteRepo.close();
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  });

  console.log("\n===============================================================");
  console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("===============================================================");

  if (failed > 0) process.exit(1);
}

runTests();
