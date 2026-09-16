/**
 * Abstract BookRepositoryInterface
 * Defines the contract that any Data Access Layer implementation must satisfy.
 * The Business Tier interacts exclusively with this interface.
 */

class BookRepositoryInterface {
  async add(book) {
    throw new Error("Method 'add()' must be implemented.");
  }

  async getById(id) {
    throw new Error("Method 'getById()' must be implemented.");
  }

  async getAll() {
    throw new Error("Method 'getAll()' must be implemented.");
  }

  async search(query) {
    throw new Error("Method 'search()' must be implemented.");
  }

  async update(book) {
    throw new Error("Method 'update()' must be implemented.");
  }

  async delete(id) {
    throw new Error("Method 'delete()' must be implemented.");
  }
}

module.exports = BookRepositoryInterface;
