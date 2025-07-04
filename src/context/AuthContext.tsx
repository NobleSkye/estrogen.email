import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: string | null;
  login: (email: string, password: string) => Promise<'code-sent'>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<boolean>;
  verifyLoginCode: (code: string) => Promise<boolean>;
  pendingLogin: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<string | null>(null);
  const [pendingLogin, setPendingLogin] = useState<string | null>(null);
  const [loginCode, setLoginCode] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendLoginCode = async (email: string, code: string) => {
    await fetch('http://localhost:4000/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        from: 'no-reply@estrogen.email',
        subject: 'Your Login Code',
        html: `<p>Your login code is: <strong>${code}</strong></p>`,
        text: `Your login code is: ${code}`,
      }),
    });
  };

  const login = async (email: string, password: string): Promise<'code-sent'> => {
    if (!email) {
      throw new Error('Email is required.');
    }

    if (!password) {
      throw new Error('Password is required.');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    localStorage.setItem('user', email);
    setUser(email);
    setIsAuthenticated(true);
    return 'code-sent';
  };

  // Step 1: Start login, send code
  const startLogin = async (email: string, password: string): Promise<'code-sent'> => {
    // Removed @estrogen.email domain restriction
    if (!email) {
      throw new Error('Email is required.');
    }
    if (!password) {
      throw new Error('Password is required.');
    }
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // Generate and send code
    const code = generateCode();
    setPendingLogin(email);
    setLoginCode(code);
    localStorage.setItem('pendingLogin', email);
    localStorage.setItem('loginCode', code);
    await sendLoginCode(email, code);
    return 'code-sent';
  };

  const verifyLoginCode = async (code: string): Promise<boolean> => {
    const storedCode = loginCode || localStorage.getItem('loginCode');
    const email = pendingLogin || localStorage.getItem('pendingLogin');
    if (!storedCode || !email) throw new Error('No login in progress.');
    if (code !== storedCode) throw new Error('Invalid code.');
    localStorage.setItem('user', email);
    setUser(email);
    setIsAuthenticated(true);
    setPendingLogin(null);
    setLoginCode(null);
    localStorage.removeItem('pendingLogin');
    localStorage.removeItem('loginCode');
    return true;
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const signup = async (email: string, password: string): Promise<boolean> => {
    // Check if email already exists (simulate API call)
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    if (existingUsers.find((u: any) => u.email === email)) {
      throw new Error('Email already exists. Please use a different email.');
    }
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }
    // Generate a unique forwarding alias
    const username = email.split('@')[0];
    const forwardingEmail = `${username}@estrogen.email`;
    // Store user with real email and forwarding alias
    const newUser = { email, forwardingEmail, username };
    existingUsers.push(newUser);
    localStorage.setItem('users', JSON.stringify(existingUsers));
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(JSON.stringify(newUser));
    setIsAuthenticated(true);
    // TODO: Call backend to set up forwarding with Unsend SMTP
    return true;
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login: startLogin,
      logout,
      signup,
      verifyLoginCode,
      pendingLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};