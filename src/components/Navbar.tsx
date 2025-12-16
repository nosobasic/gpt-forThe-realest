import { useAuth } from '@clerk/clerk-react';
import { SignInButton, SignOutButton } from '@clerk/clerk-react';

export default function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-brand">gpt 4 real</h1>
        <div className="navbar-actions">
          {isLoaded && (
            <>
              {isSignedIn ? (
                <SignOutButton>
                  <button className="navbar-button logout-button" type="button">
                    Logout
                  </button>
                </SignOutButton>
              ) : (
                <SignInButton mode="modal">
                  <button className="navbar-button login-button" type="button">
                    Login
                  </button>
                </SignInButton>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

