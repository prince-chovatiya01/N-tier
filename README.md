# 3-Tier Library Management System

A clean, human-crafted 3-tier "Library Management" web application built using **Node.js, Express, and SQLite** demonstrating strict separation of concerns, domain rule enforcement, mock-tested business logic, and interchangeable data layers.

---

## 1. Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
npm install
```

### Running the Application
```bash
npm start
```
Open your browser and navigate to: **`http://localhost:3000`**

### Running the Unit Tests
Run the unit test suite (runs business logic tests against a mock data tier, plus swap tests):
```bash
npm test
```

### Running the Data Layer Swap Demo
Execute the standalone demonstration showing identical business tier behavior across both SQLite and In-Memory repositories:
```bash
npm run demo:swap
```

---

## 2. Architecture & Tier Breakdown

The system is organized into three distinct tiers with strict one-way communication:

```text
Presentation Tier (/presentation) ──► Business Tier (/business) ──► Data Tier (/data)
```

### 1. Presentation Tier (`/presentation`)
- **Location:** `presentation/routes.js` and `presentation/public/`
- **Role:** Handles user interaction, HTTP routing, parsing request bodies, formatting JSON responses, and returning proper HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict`).
- **Rule:** Contains **zero** business validation logic and **zero** direct database queries.

### 2. Business Logic Tier (`/business`)
- **Location:** `business/BookService.js`, `business/models/Book.js`, `business/errors.js`, `business/BookRepositoryInterface.js`
- **Role:** Central domain authority. Orchestrates operations, validates all inputs, and enforces core business rules:
  - *Title* and *Author* cannot be empty or only whitespace.
  - *Publication Year* must be a valid integer $\le$ current year and $> 0$.
  - *ISBN* must consist of exactly 10 or 13 numeric digits.
  - *Quantity* cannot be negative.
  - *Check-out rule:* Decreases quantity by 1; if quantity is 0, throws a domain-specific `InsufficientStockError` preventing a server crash.
- **Rule:** Has no knowledge of HTTP or SQLite libraries. Depends strictly on the abstraction `BookRepositoryInterface`.

### 3. Data Access Tier (`/data`)
- **Location:** `data/SqliteBookRepository.js` and `data/InMemoryBookRepository.js`
- **Role:** Handles pure persistence and data retrieval (table creation, SQL queries, memory map operations).
- **Rule:** Contains **no** validation logic and **no** presentation knowledge.

---

## 3. Design Decision Rationale

> **Design Decision:** I implemented the **Repository Pattern** (`BookRepositoryInterface`) combined with **Constructor Dependency Injection** in `BookService`.
>
> **Why:** By programming the `BookService` against an abstract interface rather than a concrete SQLite library, the business logic is entirely decoupled from the underlying storage mechanism. This architectural decision enables two key advantages:
> 1. **Isolated Unit Testing:** We can test all business rules and edge cases with 100% fidelity using a fast, in-memory fake repository without spinning up a database or managing file cleanup.
> 2. **Effortless Extensibility:** Swapping the data tier (e.g., transitioning from SQLite to PostgreSQL, MongoDB, or an In-Memory cache) requires creating a new repository class that implements the interface, without modifying a single line of business logic or UI code.

---

## 4. Business Logic Unit Tests

Unit tests are located in `tests/business.test.js` and run with Jest. They use a pure in-memory fake repository to ensure **no real database is touched during testing**:

1. **Successful Book Creation:** Verifies entity properties are accurately persisted.
2. **Empty Title/Author Validation:** Ensures whitespace/empty strings are rejected with `ValidationError`.
3. **Future Publication Year Validation:** Ensures years beyond the current year are rejected.
4. **ISBN Digit Validation:** Validates 10- and 13-digit requirements and hyphen sanitization.
5. **Negative Quantity Validation:** Prevents negative inventory from being accepted.
6. **Book Check-out Decrement:** Confirms stock decreases by 1 on checkout.
7. **Zero Inventory Check-out Prevention:** Throws `InsufficientStockError` when quantity is 0.
8. **Partial Matching Search:** Confirms case-insensitive partial search on title and author.

---

## 5. Data Layer Swap Demonstration

The repository provides two concrete data tier implementations:
- `SqliteBookRepository`: Persistent storage in a local SQLite file.
- `InMemoryBookRepository`: Ephemeral storage in a JavaScript Map.

The swap test in `tests/swap.test.js` and the demo script `tests/demo_swap.js` execute the complete lifecycle (`add` $\rightarrow$ `get` $\rightarrow$ `search` $\rightarrow$ `checkout` $\rightarrow$ `update` $\rightarrow$ `delete`) against both repositories, demonstrating identical functionality with zero business-tier modifications.
