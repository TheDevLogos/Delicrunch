# TODO: Fix Require Cycles and AuthContext Issues

## Steps to Complete

- [x] Create contexts/AuthContext.js with AuthContext and useAuth
- [x] Update contexts/AuthProvider.js to import from contexts/AuthContext.js
- [x] Modify App.js to remove AuthContext definition and wrap with AuthProvider
- [x] Update navigation/AppNavigator.js to import useAuth from contexts/AuthContext.js
- [ ] Update app/LoginScreen.js to import useAuth from contexts/AuthContext.js
- [x] Update app/ProfileScreen.js to import useAuth from contexts/AuthContext.js
- [ ] Update app/HomeScreen.js to import useAuth from contexts/AuthContext.js
- [x] Update app/MyOrdersScreen.js to import useAuth from contexts/AuthContext.js
- [ ] Update app/MyProductsScreen.js to import useAuth from contexts/AuthContext.js
- [ ] Update app/MerchantOrdersScreen.js to import useAuth from contexts/AuthContext.js
- [ ] Update app/StoreProductsScreen.js to import useAuth from contexts/AuthContext.js
- [ ] Update app/StoreOrdersScreen.js to import useAuth from contexts/AuthContext.js
- [ ] Remove navigation/AuthContext.js
- [x] Add font preloading in App.js to fix WelcomeScreen icon error
- [ ] Test the app to ensure cycles are resolved and icons load properly
