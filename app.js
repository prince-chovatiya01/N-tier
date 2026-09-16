const express = require("express");
const path = require("path");
const BookService = require("./business/BookService");
const SqliteBookRepository = require("./data/SqliteBookRepository");
const InMemoryBookRepository = require("./data/InMemoryBookRepository");
const createPresentationRouter = require("./presentation/routes");

/**
 * Express Application Factory with Dependency Injection.
 *
 * @param {Object} options
 * @param {'sqlite'|'memory'} options.repositoryType
 * @param {string} options.dbPath
 */
function createApp(options = {}) {
  const { repositoryType = "sqlite", dbPath = "library.db" } = options;

  // 1. Data Tier: Instantiate selected repository implementation
  let repository;
  if (repositoryType === "memory") {
    repository = new InMemoryBookRepository();
  } else {
    repository = new SqliteBookRepository(dbPath);
  }

  // 2. Business Tier: Inject repository into BookService
  const bookService = new BookService(repository);

  // 3. Presentation Tier: Express setup and routing
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "presentation", "public")));

  // Mount API endpoints
  const router = createPresentationRouter(bookService);
  app.use(router);

  // Fallback to index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "presentation", "public", "index.html"));
  });

  // Attach services to app instance for testability / inspection
  app.locals.bookService = bookService;
  app.locals.repository = repository;

  return app;
}

module.exports = createApp;
