import { Routes, Route } from 'react-router-dom';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

// Shop pages
import HomePage from './pages/shop/HomePage';
import ShopPage from './pages/shop/ShopPage';
import ProductPage from './pages/shop/ProductPage';
import CartPage from './pages/shop/CartPage';
import CheckoutPage from './pages/shop/CheckoutPage';
import OrderConfirmationPage from './pages/shop/OrderConfirmationPage';
import CustomOrderPage from './pages/shop/CustomOrderPage';

// Admin pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminCustomCMSPage from './pages/admin/AdminCustomCMSPage';

export default function App() {
  return (
    <Routes>
      {/* Shop */}
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/product/:id" element={<ProductPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
      <Route path="/custom" element={<CustomOrderPage />} />

      {/* Admin — public */}
      <Route path="/admin" element={<AdminLoginPage />} />

      {/* Admin — protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/custom-cms" element={<AdminCustomCMSPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
