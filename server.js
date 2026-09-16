const createApp = require("./app");

const PORT = process.env.PORT || 3000;
const app = createApp({ repositoryType: "sqlite", dbPath: "library.db" });

// Seed sample books if database is fresh
const bookService = app.locals.bookService;
(async () => {
  const existingBooks = await bookService.getAllBooks();
  if (existingBooks.length === 0) {
    await bookService.addBook({
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: "9780132350884",
      publicationYear: 2008,
      quantity: 4
    });
    await bookService.addBook({
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      isbn: "9781449373320",
      publicationYear: 2017,
      quantity: 2
    });
    await bookService.addBook({
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt, David Thomas",
      isbn: "9780201616224",
      publicationYear: 1999,
      quantity: 1
    });
    console.log("Seeded default book records.");
  }
})();

app.listen(PORT, () => {
  console.log("==================================================");
  console.log(`  The Reading Room: Library Management (3-Tier)   `);
  console.log(`  Server running at: http://localhost:${PORT}     `);
  console.log("==================================================");
});
