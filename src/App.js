import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import './App.scss';
import './theme/style.scss';
import Store from './redux/Store';
import Router from './router/Router';
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  useEffect(() => {

  }, []); // Empty dependency array for componentDidMount behavior

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <Provider store={Store}>
        <Router />
      </Provider>
    </GoogleOAuthProvider>
  );
}

export default App;