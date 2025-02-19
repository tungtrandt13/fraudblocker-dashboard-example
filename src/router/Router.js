import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import {
  Login,
  Register,
  ResetPassword,
  SetPassword,
  AuthAction,
  AppSumoRegister
} from '../pages';
import RegisterNew from '../pages/RegisterNew/RegisterNew';
import DefaultLayout from '../containers/DefaultLayout/DefaultLayout';
import RouteChangeHandler from './RouteChangeHandler';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const auth = useSelector(state => state.auth);
  const accounts = useSelector(state => state.accounts);

  console.log('auth', auth);

  if (!auth?.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node
};

function Router() {
  return (
    <BrowserRouter>
      <RouteChangeHandler>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/set-password/:email/:invitation_id" 
            element={<SetPassword />} 
          />
          <Route path="/auth/action" element={<AuthAction />} />
          <Route path="/register-legacy" element={<Register />} />
          <Route path="/appsumo" element={<AppSumoRegister />} />
          <Route path="/register" element={<RegisterNew />} />
          
          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DefaultLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </RouteChangeHandler>
    </BrowserRouter>
  );
}

export default Router;