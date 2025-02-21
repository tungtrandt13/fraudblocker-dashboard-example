import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import User from '../redux/actions/User';

import { Login, Register, ResetPassword, SetPassword, AuthAction, AppSumoRegister } from "../pages";
import RegisterNew from "../pages/RegisterNew/RegisterNew";
import DefaultLayout from "../containers/DefaultLayout/DefaultLayout";
import Loading from "../containers/Loading/Loading";

import RouteChangeHandler from "./RouteChangeHandler";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!auth.user && !auth.isAuthenticating) {
      dispatch(User.checkAuth());
    }
  }, [auth.user, auth.isAuthenticating, dispatch]);

  // Đang kiểm tra auth, hiển thị loading
  if (auth.isAuthenticating) {
    return <Loading />;
  }

  // Nếu đang có token trong localStorage nhưng chưa có user
  if (localStorage.getItem('token') && !auth.user) {
    return <Loading />;
  }

  // Không có token và không có user -> redirect to login
  if (!localStorage.getItem('token') && !auth.user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node,
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
          
          {/* Protected Routes - DefaultLayout sẽ handle các route con */}
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
