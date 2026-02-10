# E-Commerce Application - Modular Route Structure

## 📁 Project Structure

This project follows an enterprise-level modular architecture with clear separation of concerns.

### Route Modules

```
routes/
├── index.js              # Main router - coordinates all modules
├── auth.js               # Authentication (login, register, logout)
├── cart.js               # Shopping cart operations
├── shop.js               # Product browsing
├── payment.js            # Payment processing (wallet, Stripe)
├── bargain-routes.js     # Bargain/negotiation system
├── admin.js              # Admin panel & product management
└── profile.js            # User profile

middleware/
└── auth.js               # Authentication middleware (isLoggedIn)

config/
└── passport.js           # Passport authentication configuration
```

## 🔗 Route Mapping

### Authentication Routes (`/routes/auth.js`)
- `GET /login` - Login page
- `POST /login` - Process login
- `GET /register` - Registration page
- `POST /register` - Process registration
- `GET /logout` - Logout user

### Shop Routes (`/routes/shop.js`)
- `GET /shop` - Browse products

### Cart Routes (`/routes/cart.js`)
- `GET /cart` - View cart
- `GET /cart/add/:productID` - Add product to cart (quick add)
- `POST /cart/add/:productID` - Add product with quantity
- `POST /cart/remove/:productID` - Remove product from cart

Legacy compatibility:
- `GET /addtocart/:productID` → redirects to cart module
- `POST /addtocart/:productID` → redirects to cart module
- `POST /removeFromCart/:productID` → redirects to cart module

### Payment Routes (`/routes/payment.js`)
- `GET /wallet` - Wallet page
- `POST /wallet/create-payment-intent` - Create Stripe payment for wallet
- `POST /wallet/confirm-payment` - Confirm wallet top-up
- `GET /pay-now/:userID` - Pay using wallet balance
- `GET /checkout` - Stripe checkout page
- `POST /create-payment-intent` - Create payment intent for order
- `POST /confirm-direct-payment` - Confirm order payment

### Bargain Routes (`/routes/bargain-routes.js`)
- `POST /bargain/:productId` - Submit bargain request
- `GET /bargain/requests` - View bargain requests (vendors)
- `POST /bargain/:id/approve` - Approve bargain
- `POST /bargain/:id/reject` - Reject bargain

Legacy compatibility:
- `GET /bargains` → redirects to `/bargain/requests`

### Admin Routes (`/routes/admin.js`)
- `GET /admin` - Admin dashboard
- `POST /admin` - Create new product
- `GET /admin/products` - View all products & sales
- `POST /admin/delete-product/:productId` - Delete product

Legacy compatibility:
- `GET /admin-products` → redirects to `/admin/products`

### Profile Routes (`/routes/profile.js`)
- `GET /profile` - User profile page

## 🛡️ Middleware

### Authentication Middleware (`/middleware/auth.js`)
- `isLoggedIn()` - Protects routes requiring authentication

## ⚙️ Configuration

### Passport Config (`/config/passport.js`)
- Configures local authentication strategy
- Sets up serialization/deserialization

## 🎯 Benefits of This Structure

1. **Modularity**: Each feature has its own file
2. **Maintainability**: Easy to locate and update specific functionality
3. **Scalability**: Simple to add new features without cluttering main router
4. **Team Collaboration**: Multiple developers can work on different modules
5. **Testing**: Each module can be tested independently
6. **Code Organization**: Clear separation of concerns
7. **Backward Compatibility**: Legacy routes still work while using new structure

## 🚀 Usage

The main `app.js` imports the coordinating `index.js` router, which automatically includes all feature modules:

```javascript
const indexRouter = require('./routes/index');
app.use('/', indexRouter);
```

All routes are automatically available through this single import!
