import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import style from './Navbar.module.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [location])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setIsUserMenuOpen(false)
    navigate('/')
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  return (
    <nav className={style.navbar}>
      <div className={style.navContainer}>
        {/* Logo */}
        <Link to="/" className={style.navLogo}>
          <div className={style.logoIcon}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className={style.logoText}>DonoConverter</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={style.navLinks}>
          <Link 
            to="/" 
            className={`${style.navLink} ${isActive('/') ? style.navLinkActive : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/about" 
            className={`${style.navLink} ${isActive('/about') ? style.navLinkActive : ''}`}
          >
            About
          </Link>
        </div>

        {/* User Section */}
        <div className={style.userSection}>
          {isLoggedIn ? (
            /* User Menu for logged in users */
            <div className={style.userMenu}>
              <button 
                className={style.userButton}
                onClick={toggleUserMenu}
              >
                <div className={style.userAvatar}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <svg className={style.dropdownIcon} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className={style.userDropdown}>
                  <Link to="/profile" className={style.dropdownItem}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    Profile
                  </Link>
                  <div className={style.dropdownDivider}></div>
                  <button onClick={handleLogout} className={style.dropdownItem}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10,17v-3H3v-4h7V7l5,5L10,17z M10,2h9c1.1,0,2,0.9,2,2v16c0,1.1-0.9,2-2,2h-9c-1.1,0-2-0.9-2-2v-3h2v3h9V4h-9v3H8V4 C8,2.9,8.9,2,10,2z"/>
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Auth Buttons for non-logged users */
            <div className={style.authButtons}>
              <Link to="/login" className={style.loginButton}>
                Login
              </Link>
              <Link to="/register" className={style.registerButton}>
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={style.mobileMenuButton}
          onClick={toggleMenu}
        >
          <span className={`${style.hamburger} ${isMenuOpen ? style.hamburgerOpen : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={style.mobileMenu}>
          <div className={style.mobileMenuContent}>
            <Link 
              to="/" 
              className={`${style.mobileNavLink} ${isActive('/') ? style.mobileNavLinkActive : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`${style.mobileNavLink} ${isActive('/about') ? style.mobileNavLinkActive : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            
            <div className={style.mobileAuthSection}>
              {isLoggedIn ? (
                <>
                  <Link 
                    to="/profile" 
                    className={style.mobileLoginButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button 
                    onClick={() => {
                      handleLogout()
                      setIsMenuOpen(false)
                    }}
                    className={style.mobileRegisterButton}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className={style.mobileLoginButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className={style.mobileRegisterButton}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar