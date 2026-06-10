'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [result, setResult] = useState('')
  
  // Bot protection states
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 })
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0)
  const [submissionCount, setSubmissionCount] = useState(0)
  
  // Form reference for reliable reset
  const formRef = useRef<HTMLFormElement>(null)

  // Generate math captcha question
  const generateCaptcha = useCallback(() => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setCaptchaQuestion({ num1, num2, answer: num1 + num2 })
    setCaptchaAnswer('')
  }, [])

  // Initialize captcha on component mount
  useEffect(() => {
    generateCaptcha()
  }, [generateCaptcha])

  // Bot protection validation
  const validateBotProtection = (formData: FormData) => {
    const now = Date.now()
    
    // Rate limiting: max 5 submissions per 10 minutes
    if (now - lastSubmissionTime < 600000 && submissionCount >= 5) {
      return { isValid: false, error: 'Too many submissions. Please wait 10 minutes before trying again.' }
    }

    // Check honeypot field (should be empty)
    const honeypot = formData.get('website')
    if (honeypot) {
      return { isValid: false, error: 'Bot detected. Submission blocked.' }
    }

    // Check captcha answer
    const userAnswer = parseInt(captchaAnswer)
    if (isNaN(userAnswer) || userAnswer !== captchaQuestion.answer || captchaQuestion.answer === 0) {
      return { isValid: false, error: 'Please solve the math problem correctly.' }
    }

    // Check for suspicious patterns
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const message = formData.get('message') as string

    if (name && email && name.toLowerCase() === email.split('@')[0]) {
      return { isValid: false, error: 'Please provide a valid name.' }
    }

    if (!message || message.length < 10) {
      return { isValid: false, error: 'Message must be at least 10 characters long.' }
    }

    // Check for spam keywords
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'congratulations', 'click here', 'free money']
    const lowerMessage = message.toLowerCase()
    if (spamKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return { isValid: false, error: 'Message contains suspicious content.' }
    }

    return { isValid: true, error: '' }
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')
    setResult('Validating...')
    
    try {
      const formDataObj = new FormData(event.currentTarget)
      
      // Add bot protection validation
      const validation = validateBotProtection(formDataObj)
      if (!validation.isValid) {
        setResult(validation.error)
        setSubmitStatus('error')
        generateCaptcha() // Generate new captcha on error
        setIsSubmitting(false)
        return
      }

      setResult('Sending...')
      formDataObj.append("access_key", "1a29e400-9df6-4275-a82e-ed5fd2cf504e")

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formDataObj
      })

      const data = await response.json()
      console.log('Web3Forms response:', data) // Debug log

      if (data.success) {
        setResult("Message sent successfully! I'll get back to you soon.")
        setSubmitStatus('success')
        setFormData({ name: '', email: '', subject: '', message: '' })
        setCaptchaAnswer('')
        generateCaptcha() // Generate new captcha after successful submission
        
        // Reset form using ref (more reliable than event.currentTarget)
        if (formRef.current) {
          formRef.current.reset()
        }
        
        // Update rate limiting - reset counter on successful submission
        setLastSubmissionTime(Date.now())
        setSubmissionCount(1) // Reset to 1 instead of incrementing
      } else {
        // Handle Web3Forms error messages more gracefully
        let errorMessage = "Something went wrong. Please try again."
        
        if (data.message) {
          // Check if it's a rate limiting message from Web3Forms
          if (data.message.includes('rate') || data.message.includes('limit') || data.message.includes('full')) {
            errorMessage = "Too many requests. Please wait a moment and try again."
          } else {
            errorMessage = data.message
          }
        }
        
        setResult(errorMessage)
        setSubmitStatus('error')
        generateCaptcha() // Generate new captcha on error
      }
    } catch (error) {
      console.error('Error:', error)
      setResult("Something went wrong. Please try again.")
      setSubmitStatus('error')
      generateCaptcha() // Generate new captcha on error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }, [])

  const socialLinks = useMemo(() => [
    {
      name: 'GitHub',
      url: 'https://github.com/MattConstant',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/matthieu-constant-b9a171221/',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
        </svg>
      ),
    },
  ], [])

  return (
    <section id="contact" className="py-24 bg-zinc-950 border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
            Let&apos;s Connect
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            Ready to bring your ideas to life? I&apos;m always excited to discuss new projects, 
            collaborations, or just have a friendly chat about technology.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors duration-300">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Contact Information
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4 group">
                  <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">Email</p>
                    <a href="mailto:matthieu.constant7792@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-lg">
                      matthieu.constant7792@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4 group">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">Phone</p>
                    <a href="tel:+16133710413" className="text-emerald-400 hover:text-emerald-300 transition-colors duration-200 text-lg">
                      (613) 371-0413
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4 group">
                  <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">Location</p>
                    <p className="text-sky-400 text-lg">
                      Ottawa, Ontario, Canada
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors duration-300">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
                Connect With Me
              </h3>
              <div className="flex space-x-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-zinc-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors duration-300">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </span>
                Languages
              </h3>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-sm font-semibold">
                  🇺🇸 English (Native)
                </span>
                <span className="px-4 py-2 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full text-sm font-semibold">
                  🇫🇷 French (Fluent)
                </span>
                <span className="px-4 py-2 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full text-sm font-semibold">
                  🇵🇱 Polish (Basic)
                </span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors duration-300">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
              <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              Send a Message
            </h3>
            
            <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-zinc-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-white/20"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-zinc-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-white/20"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-zinc-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-white/20"
                  placeholder="What's this about?"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-zinc-300 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-white/20 resize-none"
                  placeholder="Tell me about your project, idea, or just say hello!"
                />
              </div>

              {/* Bot Protection Fields */}
              
              {/* Honeypot field - hidden from users */}
              <div style={{ display: 'none' }}>
                <label htmlFor="website">Website (leave blank)</label>
                <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              {/* Math Captcha */}
              <div>
                <label htmlFor="captcha" className="block text-sm font-semibold text-zinc-300 mb-2">
                  Security Check *
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 bg-zinc-900 px-4 py-3 rounded-xl border border-white/10">
                    <span className="text-lg font-bold text-white">
                      {captchaQuestion.num1} + {captchaQuestion.num2} = ?
                    </span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="ml-2 p-1 text-zinc-500 hover:text-zinc-200 transition-colors duration-200"
                      title="Generate new question"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <input
                    type="number"
                    id="captcha"
                    name="captcha"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    required
                    className="w-24 px-3 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-white/20 text-center font-semibold"
                    placeholder="?"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Please solve this simple math problem to verify you&apos;re human
                </p>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Message...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Message
                  </>
                )}
              </button>
              
              {result && (
                <div className={`p-4 rounded-xl ${
                  submitStatus === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' 
                    : submitStatus === 'error'
                    ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                }`}>
                  <div className="flex items-center space-x-2">
                    {submitStatus === 'success' && (
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {submitStatus === 'error' && (
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="font-medium">{result}</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact