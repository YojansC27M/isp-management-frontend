import type { FormEvent } from 'react'

const LoginPage = () => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <div className="page">
      <h1>ISP Management Login</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" placeholder="you@example.com" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input type="password" name="password" placeholder="********" required />
        </label>
        <button type="submit">Sign In</button>
      </form>
    </div>
  )
}

export default LoginPage
