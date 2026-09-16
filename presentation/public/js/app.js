/**
 * The Reading Room - Library Management UI Script
 * Communicates strictly with Presentation Tier REST endpoints.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const booksGrid = document.getElementById("booksGrid");
  const booksTableBody = document.getElementById("booksTableBody");
  const booksTableWrapper = document.getElementById("booksTableWrapper");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const totalBooksCount = document.getElementById("totalBooksCount");
  const totalCopiesCount = document.getElementById("totalCopiesCount");
  const catalogSummary = document.getElementById("catalogSummary");

  // Views
  const viewCardsBtn = document.getElementById("viewCardsBtn");
  const viewTableBtn = document.getElementById("viewTableBtn");
  let currentView = "cards";

  // Modals
  const bookModal = document.getElementById("bookModal");
  const modalTitle = document.getElementById("modalTitle");
  const bookForm = document.getElementById("bookForm");
  const formErrorAlert = document.getElementById("formErrorAlert");
  const openAddModalBtn = document.getElementById("openAddModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");

  const deleteModal = document.getElementById("deleteModal");
  const deleteBookTitle = document.getElementById("deleteBookTitle");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const closeDeleteModalBtn = document.getElementById("closeDeleteModalBtn");

  // Inputs
  const bookIdInput = document.getElementById("bookId");
  const bookTitleInput = document.getElementById("bookTitle");
  const bookAuthorInput = document.getElementById("bookAuthor");
  const bookIsbnInput = document.getElementById("bookIsbn");
  const bookYearInput = document.getElementById("bookYear");
  const bookQuantityInput = document.getElementById("bookQuantity");

  let activeDeleteId = null;
  let cachedBooks = [];

  // --- Toast Notifications ---
  function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  // --- API Calls ---
  async function fetchBooks(query = "") {
    try {
      const url = query ? `/api/books?q=${encodeURIComponent(query)}` : "/api/books";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load catalog.");
      const books = await res.json();
      cachedBooks = books;
      renderBooks(books, query);
      updateStats(books);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // --- Stats and Rendering ---
  function updateStats(books) {
    totalBooksCount.textContent = books.length;
    const copies = books.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    totalCopiesCount.textContent = copies;
  }

  function renderBooks(books, query = "") {
    if (query) {
      catalogSummary.textContent = `Found ${books.length} book(s) matching "${query}"`;
    } else {
      catalogSummary.textContent = `Showing all ${books.length} books in repository`;
    }

    if (books.length === 0) {
      booksGrid.style.display = "none";
      booksTableWrapper.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    if (currentView === "cards") {
      booksGrid.style.display = "grid";
      booksTableWrapper.style.display = "none";
      renderCards(books);
    } else {
      booksGrid.style.display = "none";
      booksTableWrapper.style.display = "block";
      renderTable(books);
    }
  }

  function renderCards(books) {
    booksGrid.innerHTML = "";
    books.forEach(b => {
      const card = document.createElement("div");
      card.className = "book-card";
      const inStock = b.quantity > 0;

      card.innerHTML = `
        <div class="card-top">
          <h3 class="book-card-title">${escapeHtml(b.title)}</h3>
          <p class="book-card-author">by ${escapeHtml(b.author)}</p>
          <div class="card-meta">
            <span>ISBN: ${escapeHtml(b.isbn)}</span>
            <span>Year: ${b.publicationYear}</span>
          </div>
        </div>
        <div>
          <div class="card-inventory">
            <span class="inventory-label">Availability</span>
            <span class="inventory-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
              ${b.quantity} ${b.quantity === 1 ? 'copy' : 'copies'}
            </span>
          </div>
          <div class="card-actions">
            <button class="btn btn-secondary btn-sm checkout-btn" data-id="${b.id}" ${!inStock ? 'disabled title="Out of stock"' : ''}>
              Check Out
            </button>
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${b.id}">
              Edit
            </button>
            <button class="btn btn-secondary btn-sm delete-btn" data-id="${b.id}" data-title="${escapeHtml(b.title)}">
              Delete
            </button>
          </div>
        </div>
      `;
      booksGrid.appendChild(card);
    });
  }

  function renderTable(books) {
    booksTableBody.innerHTML = "";
    books.forEach(b => {
      const tr = document.createElement("tr");
      const inStock = b.quantity > 0;
      tr.innerHTML = `
        <td>#${b.id}</td>
        <td><strong>${escapeHtml(b.title)}</strong></td>
        <td>${escapeHtml(b.author)}</td>
        <td><code>${escapeHtml(b.isbn)}</code></td>
        <td>${b.publicationYear}</td>
        <td>
          <span class="inventory-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
            ${b.quantity}
          </span>
        </td>
        <td class="text-right">
          <div style="display:inline-flex; gap:6px;">
            <button class="btn btn-secondary btn-sm checkout-btn" data-id="${b.id}" ${!inStock ? 'disabled' : ''}>
              Check Out
            </button>
            <button class="btn btn-secondary btn-sm edit-btn" data-id="${b.id}">
              Edit
            </button>
            <button class="btn btn-secondary btn-sm delete-btn" data-id="${b.id}" data-title="${escapeHtml(b.title)}">
              Delete
            </button>
          </div>
        </td>
      `;
      booksTableBody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // --- Modal Handling ---
  function openModal(isEdit = false, book = null) {
    formErrorAlert.style.display = "none";
    formErrorAlert.textContent = "";

    if (isEdit && book) {
      modalTitle.textContent = "Edit Book";
      bookIdInput.value = book.id;
      bookTitleInput.value = book.title;
      bookAuthorInput.value = book.author;
      bookIsbnInput.value = book.isbn;
      bookYearInput.value = book.publicationYear;
      bookQuantityInput.value = book.quantity;
    } else {
      modalTitle.textContent = "Add New Book";
      bookForm.reset();
      bookIdInput.value = "";
      bookYearInput.value = new Date().getFullYear();
      bookQuantityInput.value = 1;
    }
    bookModal.style.display = "flex";
    bookTitleInput.focus();
  }

  function closeModal() {
    bookModal.style.display = "none";
  }

  // --- Form Submit (Add / Edit) ---
  bookForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formErrorAlert.style.display = "none";

    const bookId = bookIdInput.value;
    const payload = {
      title: bookTitleInput.value,
      author: bookAuthorInput.value,
      isbn: bookIsbnInput.value,
      publicationYear: parseInt(bookYearInput.value, 10),
      quantity: parseInt(bookQuantityInput.value, 10)
    };

    const isEdit = Boolean(bookId);
    const url = isEdit ? `/api/books/${bookId}` : "/api/books";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        formErrorAlert.textContent = data.error || "An error occurred.";
        formErrorAlert.style.display = "block";
        return;
      }

      closeModal();
      showToast(isEdit ? "Book updated successfully." : "Book added to catalog.");
      fetchBooks(searchInput.value.trim());
    } catch (err) {
      formErrorAlert.textContent = "Network error: Unable to reach server.";
      formErrorAlert.style.display = "block";
    }
  });

  // --- Check Out Book ---
  async function handleCheckout(bookId) {
    try {
      const res = await fetch(`/api/books/${bookId}/checkout`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Could not check out book.", "error");
        return;
      }
      showToast(`Checked out 1 copy of "${data.title}".`);
      fetchBooks(searchInput.value.trim());
    } catch (err) {
      showToast("Failed to process check-out.", "error");
    }
  }

  // --- Event Delegations ---
  function handleActionClick(e) {
    const checkoutBtn = e.target.closest(".checkout-btn");
    if (checkoutBtn) {
      const id = checkoutBtn.dataset.id;
      handleCheckout(id);
      return;
    }

    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) {
      const id = parseInt(editBtn.dataset.id, 10);
      const book = cachedBooks.find(b => b.id === id);
      if (book) openModal(true, book);
      return;
    }

    const deleteBtn = e.target.closest(".delete-btn");
    if (deleteBtn) {
      activeDeleteId = deleteBtn.dataset.id;
      deleteBookTitle.textContent = `"${deleteBtn.dataset.title}"`;
      deleteModal.style.display = "flex";
      return;
    }
  }

  booksGrid.addEventListener("click", handleActionClick);
  booksTableBody.addEventListener("click", handleActionClick);

  // --- Delete Confirmation ---
  confirmDeleteBtn.addEventListener("click", async () => {
    if (!activeDeleteId) return;
    try {
      const res = await fetch(`/api/books/${activeDeleteId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete book.");
      }
      deleteModal.style.display = "none";
      activeDeleteId = null;
      showToast("Book removed from catalog.");
      fetchBooks(searchInput.value.trim());
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.style.display = "none";
    activeDeleteId = null;
  });
  closeDeleteModalBtn.addEventListener("click", () => {
    deleteModal.style.display = "none";
    activeDeleteId = null;
  });

  // --- Modal Controls ---
  openAddModalBtn.addEventListener("click", () => openModal(false));
  closeModalBtn.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);

  // --- Search Filtering ---
  let searchTimeout = null;
  searchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    clearSearchBtn.style.display = val ? "block" : "none";
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchBooks(val.trim());
    }, 250);
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    fetchBooks("");
  });

  // --- View Toggle Buttons ---
  viewCardsBtn.addEventListener("click", () => {
    currentView = "cards";
    viewCardsBtn.classList.add("active");
    viewTableBtn.classList.remove("active");
    renderBooks(cachedBooks, searchInput.value.trim());
  });

  viewTableBtn.addEventListener("click", () => {
    currentView = "table";
    viewTableBtn.classList.add("active");
    viewCardsBtn.classList.remove("active");
    renderBooks(cachedBooks, searchInput.value.trim());
  });

  // Initial load
  fetchBooks();
});
