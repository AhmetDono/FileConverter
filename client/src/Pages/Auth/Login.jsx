import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styles from './Login.module.css'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    setIsLoading(true)
    setErrors({}) // Clear previous errors
    
    try {
      const response = await fetch('http://localhost:4000/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
        if (response.status === 401) {
          setErrors({ general: 'Invalid email or password' })
        } else if (response.status === 404) {
          setErrors({ general: 'User not found' })
        } else if (response.status === 429) {
          setErrors({ general: 'Too many login attempts. Please try again later.' })
        } else {
          setErrors({ general: data.message || 'Login failed. Please try again.' })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      
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
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to your account</p>
      </div>

      <div className={styles.authCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Login</h2>
          <p className={styles.cardSubtitle}>Enter your credentials to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {errors.general && (
            <div className={styles.errorMessage}>
              {errors.general}
            </div>
          )}

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
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <div className={styles.formOptions}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} disabled={isLoading} />
              <span className={styles.checkboxText}>Remember me</span>
            </label>
            <Link to="/forgot-password" className={styles.forgotLink}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`${styles.submitButton} ${isLoading ? styles.submitButtonLoading : ''}`}
          >
            {isLoading ? (
              <>
                <div className={styles.spinner}></div>
                Signing in...
              </>
            ) : (
              'Sign In'
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
            Continue with Google
          </button>
        </div>

        <p className={styles.authSwitch}>
          Don't have an account?{' '}
          <Link to="/register" className={styles.authLink}>
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}