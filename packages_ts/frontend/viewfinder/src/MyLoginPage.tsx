// in src/MyLoginPage.tsx
import React, { useState } from "react";
import { useLogin, useNotify } from "react-admin";

// Define inline styles to ensure visibility
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
    padding: "1rem"
  },
  card: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px"
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: "1.5rem",
    color: "#333"
  },
  formGroup: {
    marginBottom: "1rem",
    width: "100%"
  },
  label: {
    display: "block",
    marginBottom: "0.5rem",
    fontWeight: "500",
    color: "#555"
  },
  input: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "0.25rem",
    border: "1px solid #ddd",
    fontSize: "1rem",
    boxSizing: "border-box",
    color: "#333"
  },
  button: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#2196f3",
    color: "white",
    border: "none",
    borderRadius: "0.25rem",
    fontSize: "1rem",
    fontWeight: "500",
    cursor: "pointer",
    marginTop: "1rem"
  }
};

const MyLoginPage = ({ theme }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const notify = useNotify();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email, password }).catch(() => notify("Invalid email or password"));
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login</h1>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={styles.input}
              required
            />
          </div>
          <button 
            type="submit" 
            style={styles.button}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};

export default MyLoginPage;
