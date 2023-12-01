# Checkout Stripe Backend

This project functions as a backend service. It is designed to manage user
registration and login processes, handle shopping cart operations, and integrate
with Stripe for checkout procedures.

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository: git clone
   https://github.com/SigneAnnaMaria/checkout-stripe-backend.git

2. Navigate to the project directory: cd checkout-stripe-backend

3. Install dependencies: npm install

### Configuration

1. Ensure the frontend service is up and running, as this backend serves it:
   https://github.com/YourRepository/checkout-stripe.git
2. Create a `.env` file in the root directory.
3. Add the Stripe secret key (STRIPE_SECRET_KEY) to your `.env` file.

### Running the Server

Execute the following command to start the server: npm start
