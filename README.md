# Node.js Express Ecommerce API

A RESTful ecommerce API built with Node.js, Express.js, and PostgreSQL featuring user authentication, session-based cart management, and order processing.

## 🚀 Features

- **User Management**
  - User registration with bcrypt password hashing
  - Local authentication using Passport.js
  - Session-based authentication
  - Customer profile management

- **Product Catalog**
  - Browse all items
  - Search items by name (case-insensitive)
  - Filter items by category
  - Inventory management

- **Shopping Cart**
  - Session-based cart (no database storage)
  - Add/remove items from cart
  - Update item quantities
  - View cart with item details and totals
  - Inventory validation when adding items

- **Order Management**
  - Create orders with multiple items
  - Automatic inventory reduction
  - Order tracking by customer
  - Shipping address management

- **Security**
  - Rate limiting on all endpoints
  - Password hashing with bcrypt
  - SQL injection protection with parameterized queries
  - Session management with express-session

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (port 5433)
- **Authentication:** Passport.js with Local Strategy
- **Password Hashing:** bcrypt
- **Session Management:** express-session
- **Database Client:** pg (PostgreSQL client)
- **Security:** express-rate-limit

## 📊 Database Schema

### Tables

**Customer**
- CustomerID (Primary Key)
- FirstName, LastName, Email
- LoginId, PasswordHash
- CreatedBy, CreatedDate, LastUpdatedBy, LastUpdatedDate

**Orders**
- OrderId (Primary Key)
- CustomerId (Foreign Key)
- OrderPrice, OrderDate, OrderStatus
- CreatedBy, CreatedDate, LastUpdatedBy, LastUpdatedDate

**Items**
- ItemId (Primary Key)
- ItemName, Description, Category
- Inventory, Price
- CreatedBy, CreatedDate, LastUpdatedBy, LastUpdatedDate

**OrderItems**
- OrderId, ItemId (Composite Primary Key)
- Quantity

**ShippingAddress**
- AddressId (Primary Key)
- OrderId (Foreign Key)
- ShippingAddress1, ShippingAddress2
- City, StateCode, CountryCode, PostalCode

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (running on port 5433)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm install dotenv
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your actual values
   nano .env  # or use your preferred editor
   ```
   
   **Required Environment Variables:**
   - `DB_PASSWORD` - Your PostgreSQL password
   - `DB_NAME` - Your database name
   - `SESSION_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   
   All other variables have sensible defaults.

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb e_comm_app
   
   # Create tables using the schema (see Database Schema section above)
   # Run your SQL scripts to create: Customer, Orders, Items, OrderItems, ShippingAddress tables
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

The server will run on `http://localhost:3000`

## 📚 API Endpoints

### Authentication Routes (`/api`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | `{firstName, lastName, email, loginId, password}` |
| POST | `/login` | User login | `{loginid, password}` |
| GET | `/logout` | User logout | - |

### Item Routes (`/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items` | Get all items |
| GET | `/items/itemname/:itemname` | Search items by name |
| GET | `/items/category/:category` | Get items by category |

### Cart Routes (`/api`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/cart/add` | Add item to cart | `{itemId, quantity}` |
| GET | `/cart` | Get cart contents | - |
| PUT | `/cart/item/:itemId` | Update item quantity | `{quantity}` |
| DELETE | `/cart/item/:itemId` | Remove item from cart | - |
| DELETE | `/cart` | Clear entire cart | - |

### Order Routes (`/api`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/orders/postOrder` | Create new order | `{customerId, items[], shippingAddress{}}` |
| GET | `/orders/customer/:customerId` | Get customer orders | - |
| GET | `/orders/:orderId` | Get specific order | - |

### Customer Routes (`/api`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/customers/:customerid` | Get customer details | - |
| PUT | `/customers/update` | Update customer info | `{customerId, firstName, lastName, email}` |

## 🔧 Configuration

### Environment Variables
All configuration is handled through environment variables in the `.env` file:

**Database Configuration:**
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5433)
- `DB_NAME` - Database name (default: e_comm_app)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (required)

**Session Configuration:**
- `SESSION_SECRET` - Secret for session encryption (required, generate randomly)
- `SESSION_MAX_AGE` - Session timeout in milliseconds
- `SESSION_SECURE` - Set to true in production with HTTPS

**Rate Limiting:**
- `RATE_LIMIT_WINDOW_MS` - Global rate limit window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)
- `REGISTRATION_RATE_LIMIT_WINDOW_MS` - Registration rate limit window (default: 1 hour)
- `REGISTRATION_RATE_LIMIT_MAX` - Max registration attempts (default: 5)

**Security:**
- `BCRYPT_SALT_ROUNDS` - Password hashing complexity (default: 10)

### Usage
Copy `.env.example` to `.env` and update with your actual values. Never commit the `.env` file to version control.

## 🏗️ Project Structure

```
ecommerce-app/
├── routes/
│   ├── auth_api.js          # Authentication routes
│   ├── registration_api.js   # User registration
│   ├── items_api.js         # Product catalog
│   ├── cart_api.js          # Shopping cart
│   ├── orders_api.js        # Order management
│   └── customers_api.js     # Customer management
├── db/
│   └── connection.js        # Database connection
├── app.js                   # Main application file
├── .env                     # Environment variables (not committed)
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json
└── README.md
```

## 🔐 Security Features

- **Password Security:** bcrypt hashing with salt
- **Rate Limiting:** Prevents API abuse
- **SQL Injection Protection:** Parameterized queries
- **Session Security:** Secure session configuration
- **Input Validation:** Request body validation
- **Environment Variables:** Secure configuration management

## 🎯 Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","loginId":"johndoe","password":"securepassword"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"loginid":"johndoe","password":"securepassword"}'
```

### Add item to cart
```bash
curl -X POST http://localhost:3000/api/cart/add \
  -H "Content-Type: application/json" \
  -d '{"itemId":1,"quantity":2}'
```

### Create an order
```bash
curl -X POST http://localhost:3000/api/orders/postOrder \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "items": [{"itemId": 1, "quantity": 2, "price": 29.99}],
    "shippingAddress": {
      "addressLine1": "123 Main St",
      "city": "Anytown",
      "stateCode": "TX",
      "countryCode": "US",
      "postalCode": "12345"
    }
  }'
```

## 🚨 Known Limitations

- Cart data is session-based and will be lost when session expires
- No persistent cart for logged-out users
- Single database client (no connection pooling)
- No email verification for registration
- No password reset functionality

## 🔮 Future Enhancements

- [ ] Connection pooling for better performance
- [ ] Persistent cart storage in database
- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] Admin panel for inventory management
- [ ] Order status updates
- [ ] Payment integration
- [ ] Product images and categories
- [ ] User reviews and ratings
- [ ] Wishlist functionality

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

<<<<<<< HEAD

=======
>>>>>>> 96f732150696d65c3a7d6bf81a39594abdebdb0f
- Ankur Anubhav

## 🐛 Bug Reports

Please report bugs and issues in the GitHub Issues section.
<<<<<<< HEAD


## 🐛 Bug Reports

Please report bugs and issues in the GitHub Issues section.
=======
>>>>>>> 96f732150696d65c3a7d6bf81a39594abdebdb0f
