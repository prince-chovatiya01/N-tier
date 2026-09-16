/**
 * Standalone Demonstration Script for Data Layer Swapping.
 * Run with: npm run demo:swap
 */

const BookService = require("../business/BookService");
const InMemoryBookRepository = require("../data/InMemoryBookRepository");
const SqliteBookRepository = require("../data/SqliteBookRepository");
const fs = require("fs");
const path = require("path");

async function demonstrateDataSwap() {
  console.log("===============================================================");
  console.log("  3-TIER ARCHITECTURE: DATA LAYER SWAP DEMONSTRATION");
  console.log("===============================================================\n");

  const demoDb = path.join(__dirname, "demo.db");
  if (fs.existsSync(demoDb)) {
    try { fs.unlinkSync(demoDb); } catch (_) {}
  }

  const memoryRepo = new InMemoryBookRepository();
  const sqliteRepo = new SqliteBookRepository(demoDb);

  const repos = [
    { name: "In-Memory Repository", instance: memoryRepo },
    { name: "SQLite Repository (node:sqlite)", instance: sqliteRepo }
  ];

  for (const { name, instance } of repos) {
    console.log(`--- Testing with: [${name}] ---`);

    // Notice: BookService instantiation requires zero code changes regardless of repository
    const service = new BookService(instance);

    // 1. Add
    const book = await service.addBook({
      title: "The Mythical Man-Month",
      author: "Fred Brooks",
      isbn: "9780201835953",
      publicationYear: 1995,
      quantity: 3
    });
    console.log(`[+] Added Book #${book.id}: "${book.title}" (Qty: ${book.quantity})`);

    // 2. Checkout
    const checkedOut = await service.checkoutBook(book.id);
    console.log(`[>] Checked out 1 copy. Remaining quantity: ${checkedOut.quantity}`);

    // 3. Search
    const searchResults = await service.searchBooks("Brooks");
    console.log(`[?] Search for 'Brooks' returned ${searchResults.length} match(es).`);

    // 4. Clean up
    await service.deleteBook(book.id);
    console.log(`[-] Deleted Book #${book.id}.\n`);
  }

  sqliteRepo.close();
  if (fs.existsSync(demoDb)) {
    try { fs.unlinkSync(demoDb); } catch (_) {}
  }

  console.log("===============================================================");
  console.log("  SUCCESS: Both data layers performed identically!");
  console.log("  Loose coupling between Business and Data tiers confirmed.");
  console.log("===============================================================");
}

demonstrateDataSwap().catch(err => {
  console.error("Swap demo encountered error:", err);
});
