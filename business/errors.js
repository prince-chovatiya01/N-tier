/**
 * Domain error classes for the Business Logic Tier.
 * These enable the service layer to signal domain-specific violations
 * without having any awareness of HTTP status codes or transport mechanisms.
 */

class BusinessError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends BusinessError {
  constructor(message) {
    super(message);
  }
}

class NotFoundError extends BusinessError {
  constructor(message) {
    super(message);
  }
}

class InsufficientStockError extends BusinessError {
  constructor(message) {
    super(message);
  }
}

module.exports = {
  BusinessError,
  ValidationError,
  NotFoundError,
  InsufficientStockError
};
