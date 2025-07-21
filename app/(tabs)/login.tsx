import React, { useState } from 'react';
import { signUp, signIn } from '../../components/authService'; 

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); 
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // Connexion
        await signIn(email, password);
      } else {
        // Inscription
        await signUp(email, password);
      }
      onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isLogin ? 'Se connecter' : "S'inscrire"}</button>
      </form>
      <button type="button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Créer un compte" : "Se connecter"}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
