import React, { createContext, useContext, useReducer, useEffect } from 'react';
import apiClient from '../api/client';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const restoreSession = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      dispatch({ type: 'LOGOUT' });
      return;
    }

    try {
      // Verify token with /auth/me
      const userData = await apiClient.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: userData, token },
      });
    } catch (error) {
      // If token is invalid or expired
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // OAuth2PasswordRequestForm expects username and password
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const data = await apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const token = data.access_token;
      localStorage.setItem('auth_token', token);

      // Fetch user profile
      const user = await apiClient.get('/auth/me');
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });
      return { success: true, user };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (name, email, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await apiClient.post('/auth/register', { name, email, password });
      // Automatically log in after successful registration
      return await login(email, password);
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        restoreSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
