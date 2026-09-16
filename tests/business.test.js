const BookService = require("../business/BookService");
const BookRepositoryInterface = require("../business/BookRepositoryInterface");
const Book = require("../business/models/Book");
const {
  ValidationError,
  NotFoundError,
  InsufficientStockError
} = require("../business/errors");

/**
 * Pure Fake/Mock Repository implementing BookRepositoryInterface for unit testing.
 * Does NOT interact with any real database file or SQL engine.
 */
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

describe("Business Logic Tier: BookService Unit Tests (Mocked Data Tier)", () => {
  let service;
  let mockRepo;

  beforeEach(() => {
    mockRepo = new FakeBookRepository();
    service = new BookService(mockRepo);
  });

  test("1. Successfully adds a valid book", async () => {
    const result = await service.addBook({
      title: "Domain-Driven Design",
      author: "Eric Evans",
      isbn: "9780321125217",
      publicationYear: 2003,
      quantity: 5
    });

    expect(result.id).toBe(1);
    expect(result.title).toBe("Domain-Driven Design");
    expect(result.author).toBe("Eric Evans");
    expect(result.isbn).toBe("9780321125217");
    expect(result.publicationYear).toBe(2003);
    expect(result.quantity).toBe(5);
  });

  test("2. Fails when Title or Author is empty or whitespace", async () => {
    await expect(
      service.addBook({
        title: "   ",
        author: "Valid Author",
        isbn: "9780321125217",
        publicationYear: 2020,
        quantity: 1
      })
    ).rejects.toThrow(ValidationError);

    await expect(
      service.addBook({
        title: "Valid Title",
        author: "",
        isbn: "9780321125217",
        publicationYear: 2020,
        quantity: 1
      })
    ).rejects.toThrow(ValidationError);
  });

  test("3. Fails when Publication Year is in the future", async () => {
    const futureYear = new Date().getFullYear() + 1;
    await expect(
      service.addBook({
        title: "Future Computing",
        author: "Time Traveler",
        isbn: "9780321125217",
        publicationYear: futureYear,
        quantity: 1
      })
    ).rejects.toThrow(ValidationError);
  });

  test("4. Fails when ISBN is not 10 or 13 digits", async () => {
    // 8 digits (invalid)
    await expect(
      service.addBook({
        title: "Bad ISBN",
        author: "Author",
        isbn: "12345678",
        publicationYear: 2020,
        quantity: 1
      })
    ).rejects.toThrow(ValidationError);

    // 10 digits with hyphens (valid after stripping)
    const valid10 = await service.addBook({
      title: "Clean 10",
      author: "Author",
      isbn: "0-321-12521-5",
      publicationYear: 2020,
      quantity: 1
    });
    expect(valid10.isbn).toBe("0321125215");
  });

  test("5. Fails when Quantity is negative", async () => {
    await expect(
      service.addBook({
        title: "Negative Stock",
        author: "Author",
        isbn: "9780321125217",
        publicationYear: 2020,
        quantity: -3
      })
    ).rejects.toThrow(ValidationError);
  });

  test("6. Successfully checks out a book (decrements quantity by 1)", async () => {
    const book = await service.addBook({
      title: "Refactoring",
      author: "Martin Fowler",
      isbn: "9780201485677",
      publicationYear: 1999,
      quantity: 2
    });

    const updated = await service.checkoutBook(book.id);
    expect(updated.quantity).toBe(1);

    const fetched = await service.getBookById(book.id);
    expect(fetched.quantity).toBe(1);
  });

  test("7. Fails to check out when quantity is 0 (throws InsufficientStockError)", async () => {
    const book = await service.addBook({
      title: "Popular Novel",
      author: "Jane Doe",
      isbn: "9780201485677",
      publicationYear: 2015,
      quantity: 0
    });

    await expect(service.checkoutBook(book.id)).rejects.toThrow(
      InsufficientStockError
    );
  });

  test("8. Search performs case-insensitive partial matching on title and author", async () => {
    await service.addBook({
      title: "Clean Architecture",
      author: "Robert C. Martin",
      isbn: "9780134494166",
      publicationYear: 2017,
      quantity: 2
    });
    await service.addBook({
      title: "Design Patterns",
      author: "Erich Gamma",
      isbn: "9780201633610",
      publicationYear: 1994,
      quantity: 1
    });

    const titleMatch = await service.searchBooks("archi");
    expect(titleMatch.length).toBe(1);
    expect(titleMatch[0].title).toBe("Clean Architecture");

    const authorMatch = await service.searchBooks("gamma");
    expect(authorMatch.length).toBe(1);
    expect(authorMatch[0].author).toBe("Erich Gamma");
  });
});
