import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Mail, Lock, UserPlus, LogIn, Loader2, AlertCircle } from 'lucide-react'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        })
        if (error) throw error

        if (data.user) {
          // Ensure they are added to the employees table with a default role
          await supabase.from('employees').insert([{
            id: data.user.id,
            name: email.split('@')[0],
            email: email,
            role: 'employee'
          }])
        }
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
            SalemCCTV <span className="text-accent-primary">Ops</span>
          </h1>
          <p className="text-secondary">Security Operations Management</p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="badge badge-error w-full text-center p-3">
              <AlertCircle size={14} className="mr-2 inline" />
              {error}
            </div>
          )}

          {message && (
            <div className="badge badge-success w-full text-center p-3">
              <AlertCircle size={14} className="mr-2 inline" />
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mt-2 py-3"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : (isSignUp ? <UserPlus size={18} className="mr-2" /> : <LogIn size={18} className="mr-2" />)}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-secondary hover:text-accent-primary transition-colors bg-transparent border-none cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  )
}
