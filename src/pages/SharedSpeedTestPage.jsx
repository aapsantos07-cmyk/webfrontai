import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { Phone, Share, Loader2, Cpu, Menu, X, LogIn, Zap, Users, TrendingUp, Shield, Check } from 'lucide-react';

// Reuse components from App.jsx
function MetricCircle({ value, color, label, size = 'md' }) {
  const dimensions = size === 'sm' ? 50 : 80;
  const strokeWidth = size === 'sm' ? 4 : 6;
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colorClasses = {
    red: { stroke: 'stroke-red-500', text: 'text-red-400', bg: 'text-red-500/20' },
    green: { stroke: 'stroke-green-500', text: 'text-green-400', bg: 'text-green-500/20' }
  };

  const colors = colorClasses[color] || colorClasses.green;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width={dimensions} height={dimensions} className="transform -rotate-90">
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-zinc-800"
          />
          <circle
            cx={dimensions / 2}
            cy={dimensions / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${colors.stroke} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${colors.text}`}>{value}</span>
        </div>
      </div>
      <span className="text-sm text-zinc-300 text-center font-medium">{label}</span>
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-zinc-900/50 border border-zinc-800 rounded-xl ${className}`}>
      {children}
    </div>
  );
}

function Button({ children, variant = 'primary', onClick, className = '' }) {
  const baseClasses = 'px-6 py-3 rounded-lg font-bold transition-colors';
  const variantClasses = variant === 'primary'
    ? 'bg-white text-black hover:bg-gray-200'
    : 'bg-zinc-800 text-white hover:bg-zinc-700';

  return (
    <button onClick={onClick} className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </button>
  );
}

function SharedSpeedTestPage() {
  const { testId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);

        const getResultFunction = httpsCallable(functions, 'getPageSpeedResult');
        const response = await getResultFunction({ testId });

        if (response.data.success) {
          setResults(response.data.data);
        } else {
          throw new Error(response.data.error || 'Failed to load results');
        }
      } catch (err) {
        console.error('Error fetching speed test results:', err);
        setError(err.message || 'Failed to load speed test results');
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchResults();
    }
  }, [testId]);

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto" />
          <p className="text-zinc-400">Loading speed test results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="max-w-md text-center space-y-6 px-6">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold text-red-400">Results Not Found</h1>
          <p className="text-zinc-400">{error}</p>
          <a href="/#pagespeed">
            <Button variant="primary">
              Test Your Own Site
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const improvements = results.improvements || {
    avgImprovement: Math.round(
      ((results.optimizedScores.performance - results.currentScores.performance) +
       (results.optimizedScores.accessibility - results.currentScores.accessibility) +
       (results.optimizedScores.seo - results.currentScores.seo) +
       (results.optimizedScores.bestPractices - results.currentScores.bestPractices)) / 4
    ),
    loadTimeSaved: '2.3',
    conversionBoost: 16
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-x-hidden">
      {/* Navigation Header - Matching Main Site */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-zinc-800 py-3 md:py-4' : 'bg-transparent py-4 md:py-6'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          {/* Logo */}
          <a href="/" className="text-xl md:text-2xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg">
              <Cpu size={20} />
            </div>
            WEBFRONT AI
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="/#services" className="hover:text-white transition-colors">Services</a>
            <a href="/#pagespeed" className="hover:text-white transition-colors">Speed Test</a>
            <a href="/#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="/login" className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
              <LogIn size={14} /> Login
            </a>
            <Button variant="primary" onClick={() => window.location.href = 'tel:8627540435'}>
              Book Strategy Call
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[70px] bg-black/95 backdrop-blur-lg z-40 p-8 flex flex-col gap-6 animate-fade-in border-t border-zinc-800">
            <a href="/#services" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-zinc-400 hover:text-white">Services</a>
            <a href="/#pagespeed" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-zinc-400 hover:text-white">Speed Test</a>
            <a href="/#pricing" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-zinc-400 hover:text-white">Pricing</a>
            <hr className="border-zinc-800"/>
            <a href="/login" className="text-left text-2xl font-bold text-blue-400 hover:text-blue-300">Login to Portal</a>
            <Button variant="primary" className="mt-4 py-4 w-full" onClick={() => { setIsMenuOpen(false); window.location.href = 'tel:8627540435'; }}>
              Book Strategy Call
            </Button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">Speed Test Results</h2>
              <p className="text-zinc-400 break-all">{results.url}</p>
            </div>

            {/* Performance Cards */}
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8 border-red-500/20">
                <h3 className="text-xl font-bold mb-8 text-center text-red-400">Current Performance</h3>
                <div className="grid grid-cols-2 gap-8">
                  <MetricCircle value={results.currentScores.performance} color="red" label="Performance" />
                  <MetricCircle value={results.currentScores.accessibility} color="red" label="Accessibility" />
                  <MetricCircle value={results.currentScores.seo} color="red" label="SEO" />
                  <MetricCircle value={results.currentScores.bestPractices} color="red" label="Best Practices" />
                </div>
              </Card>

              <Card className="p-8 border-green-500/20">
                <h3 className="text-xl font-bold mb-8 text-center text-green-400">With WebFront</h3>
                <div className="grid grid-cols-2 gap-8">
                  <MetricCircle value={results.optimizedScores.performance} color="green" label="Performance" />
                  <MetricCircle value={results.optimizedScores.accessibility} color="green" label="Accessibility" />
                  <MetricCircle value={results.optimizedScores.seo} color="green" label="SEO" />
                  <MetricCircle value={results.optimizedScores.bestPractices} color="green" label="Best Practices" />
                </div>
              </Card>
            </div>

            {/* Improvements */}
            <Card className="p-8 bg-gradient-to-br from-green-900/10 to-blue-900/10">
              <h3 className="text-2xl font-bold mb-8 text-center">Estimated Improvements</h3>
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-green-400 mb-2">+{improvements.avgImprovement}%</div>
                  <div className="text-zinc-400">Average Score Increase</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-400 mb-2">{improvements.loadTimeSaved}s</div>
                  <div className="text-zinc-400">Load Time Saved</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-green-400 mb-2">+{improvements.conversionBoost}%</div>
                  <div className="text-zinc-400">Conversion Boost</div>
                </div>
              </div>
            </Card>

            {/* Detailed Analysis Section */}
            {results.issues && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center mb-6">What We Can Improve</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Performance Issues */}
                  {results.issues.performance && results.issues.performance.length > 0 && (
                    <Card className="p-6 border-red-500/10">
                      <h4 className="text-lg font-bold mb-4 text-red-400 flex items-center gap-2">
                        <Zap size={20} />
                        Performance Optimizations
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {results.issues.performance.slice(0, 5).map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-zinc-300">
                            <Check size={16} className="text-green-400 mt-1 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                        {results.issues.performance.length > 5 && (
                          <li className="text-zinc-500 text-xs mt-2">
                            +{results.issues.performance.length - 5} more optimizations
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}

                  {/* Accessibility Issues */}
                  {results.issues.accessibility && results.issues.accessibility.length > 0 && (
                    <Card className="p-6 border-blue-500/10">
                      <h4 className="text-lg font-bold mb-4 text-blue-400 flex items-center gap-2">
                        <Users size={20} />
                        Accessibility Fixes
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {results.issues.accessibility.slice(0, 5).map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-zinc-300">
                            <Check size={16} className="text-green-400 mt-1 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                        {results.issues.accessibility.length > 5 && (
                          <li className="text-zinc-500 text-xs mt-2">
                            +{results.issues.accessibility.length - 5} more fixes
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}

                  {/* SEO Issues */}
                  {results.issues.seo && results.issues.seo.length > 0 && (
                    <Card className="p-6 border-purple-500/10">
                      <h4 className="text-lg font-bold mb-4 text-purple-400 flex items-center gap-2">
                        <TrendingUp size={20} />
                        SEO Enhancements
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {results.issues.seo.slice(0, 5).map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-zinc-300">
                            <Check size={16} className="text-green-400 mt-1 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                        {results.issues.seo.length > 5 && (
                          <li className="text-zinc-500 text-xs mt-2">
                            +{results.issues.seo.length - 5} more enhancements
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}

                  {/* Best Practices Issues */}
                  {results.issues.bestPractices && results.issues.bestPractices.length > 0 && (
                    <Card className="p-6 border-orange-500/10">
                      <h4 className="text-lg font-bold mb-4 text-orange-400 flex items-center gap-2">
                        <Shield size={20} />
                        Best Practices Updates
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {results.issues.bestPractices.slice(0, 5).map((issue, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-zinc-300">
                            <Check size={16} className="text-green-400 mt-1 flex-shrink-0" />
                            <span>{issue}</span>
                          </li>
                        ))}
                        {results.issues.bestPractices.length > 5 && (
                          <li className="text-zinc-500 text-xs mt-2">
                            +{results.issues.bestPractices.length - 5} more updates
                          </li>
                        )}
                      </ul>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" onClick={() => window.location.href = 'tel:8627540435'} className="flex items-center justify-center gap-2">
                <Phone size={18} />
                Book Strategy Call: (862) 754-0435
              </Button>
              <button
                onClick={handleShare}
                className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 font-bold"
              >
                <Share size={18} />
                {copied ? 'Link Copied!' : 'Share Results'}
              </button>
            </div>

            {/* Test Your Own Site CTA */}
            <div className="text-center pt-8">
              <p className="text-zinc-400 mb-4">Want to see how your site performs?</p>
              <a href="/#pagespeed">
                <Button variant="primary">
                  Test Your Website Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SharedSpeedTestPage;
