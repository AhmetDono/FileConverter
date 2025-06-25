import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Register.module.css'

export default function Register() {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [acceptTerms, setAcceptTerms] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
  
    
    setIsLoading(true)
    setErrors({}) // Clear previous errors
    
    try {
      const response = await fetch('http://localhost:4000/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: formData.userName,
          email: formData.email,
          password: formData.password
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Save JWT token to localStorage
        localStorage.setItem('token', data.token)
        
        // Optional: Save user info if returned from API
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        
        // Redirect to home page
        navigate('/')
      } else {
        // Handle different error status codes
        if (response.status === 409) {
          setErrors({ general: 'Email already exists. Please use a different email.' })
        } else if (response.status === 400) {
          setErrors({ general: data.message || 'Invalid registration data' })
        } else if (response.status === 429) {
          setErrors({ general: 'Too many registration attempts. Please try again later.' })
        } else {
          setErrors({ general: data.message || 'Registration failed. Please try again.' })
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setErrors({ general: 'Network error. Please check your connection and try again.' })
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Join Us Today</h1>
        <p className={styles.subtitle}>Create your account and get started</p>
      </div>

      <div className={styles.authCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Register</h2>
          <p className={styles.cardSubtitle}>Fill in your information to create an account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.general && (
            <div className={styles.errorMessage}>
              {errors.general}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="userName" className={styles.label}>
              Username
            </label>
            <input
              type="text"
              id="userName"
              name="userName"
              value={formData.userName}
              onChange={handleChange}
              className={`${styles.input} ${errors.userName ? styles.inputError : ''}`}
              placeholder="Enter your username"
              disabled={isLoading}
            />
            {errors.userName && <span className={styles.errorText}>{errors.userName}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.label}>
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
              placeholder="Create a strong password"
              disabled={isLoading}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
            <div className={styles.passwordHint}>
              Must contain at least 8 characters with uppercase, lowercase and number
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
          </div>

          <div className={styles.termsGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                className={styles.checkbox}
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                disabled={isLoading}
              />
              <span className={styles.checkboxText}>
                I agree to the{' '}
                <Link to="/terms" className={styles.termsLink}>Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className={styles.termsLink}>Privacy Policy</Link>
              </span>
            </label>
            {errors.terms && <span className={styles.errorText}>{errors.terms}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.submitButton} ${isLoading ? styles.submitButtonLoading : ''}`}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerText}>or</span>
        </div>

        <div className={styles.socialButtons}>
          <button className={styles.socialButton} disabled={isLoading}>
            <svg className={styles.socialIcon} viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        <p className={styles.authSwitch}>
          Already have an account?{' '}
          <Link to="/login" className={styles.authLink}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  )
}