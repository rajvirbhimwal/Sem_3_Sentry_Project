import Dashboard from "./Dashboard";
import React, { useState, useEffect } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Bell,
  Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Earth, Eye, EyeOff,
  Flower2, Globe2, Heart, Leaf, LockKeyhole, Mail, MapPin, Menu, MessageCircle,
  Recycle, ShieldCheck, Smartphone, Sprout, Trees, Users, Waves, X, Zap
} from 'lucide-react';

const reports = [
  { type: 'Waste & litter', title: 'Plastic waste near the lake path', place: 'Sector 14, Gurugram', status: 'In progress', color: 'amber', initials: 'PW' },
  { type: 'Water pollution', title: 'Drainage flowing into a pond', place: 'Green Park community', status: 'Verified', color: 'blue', initials: 'WP' },
  { type: 'Public spaces', title: 'Community garden needs attention', place: 'Rosewood neighbourhood', status: 'Resolved', color: 'green', initials: 'PS' },
];

function Brand({ light = false }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href="#home" aria-label="EcoConnect home">
    <span className="brand-mark"><Leaf size={21} strokeWidth={2.4} /></span>
    <span>eco<span className="brand-strong">connect</span><small>SMALL ACTION. BIG CHANGE.</small></span>
  </a>;
}

function AuthModal({ onClose, onLoginSuccess }) {
  const [method, setMethod] = useState('email');
  const [stage, setStage] = useState('login');
  const [value, setValue] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const API_BASE = 'http://localhost:5000/api';

  async function requestOtp(e) {
    e.preventDefault();
    const identifier = method === 'phone' ? value.replace(/\D/g, '') : value.trim().toLowerCase();
    if (!identifier) { setNotice(method === 'email' ? 'Enter your email address to continue.' : 'Enter your phone number to continue.'); return; }
    // Trim and normalize email input; let the backend validate it.
    // This avoids stale/overly strict client-side validation blocking valid addresses.
    if (method === 'phone' && identifier.length !== 10) { setNotice('Enter a valid 10-digit Indian mobile number.'); return; }

    setNotice('');
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, identifier })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Could not request an OTP. Please try again.');
      }
      setValue(identifier);
      setOtp('');
      setStage('otp');
      setNotice(data.message || 'OTP requested. In development, check the backend terminal for the code.');
    } catch (error) {
      setNotice(error.message || 'Unable to connect to the backend. Make sure it is running on port 5000.');
    } finally {
      setBusy(false);
    }
  }


  async function verifyOtp(e) {
    e.preventDefault();

    const cleanOtp = otp.replace(/\D/g, '');

    if (cleanOtp.length !== 6) {
      setNotice('Enter the 6-digit verification code.');
      return;
    }

    setNotice('');
    setBusy(true);

    try {
      const identifier =
        method === 'phone'
          ? value.replace(/\D/g, '')
          : value.trim().toLowerCase();

      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          identifier,
          otp: cleanOtp
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'OTP verification failed. Check the code and try again.'
        );
      }

      if (!data.token) {
        throw new Error('Verification succeeded, but the server did not return a login token.');
      }

      localStorage.setItem('ecoconnect_token', data.token);
      localStorage.setItem('ecoconnect_user', JSON.stringify(data.user));

      onLoginSuccess(data.user);

    } catch (error) {
      setNotice(
        error.message ||
        'Unable to connect to the backend. Make sure it is running on port 5000.'
      );
    } finally {
      setBusy(false);
    }
  }



  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close login"><X size={20} /></button>
      <div className="auth-art">
        <div className="auth-art-top"><Brand light /><span className="art-pill"><Sprout size={14} /> Be part of the change</span></div>
        <div className="auth-art-copy">
          <span className="eyebrow eyebrow-light">YOUR COMMUNITY. YOUR PLANET.</span>
          <h2>A cleaner world<br />starts with <em>you.</em></h2>
          <p>Join neighbours, local changemakers and organisations turning everyday concerns into real-world action.</p>
        </div>
        <div className="auth-art-bottom">
          <div className="avatar-stack"><span>AK</span><span>RS</span><span>MP</span><span><Leaf size={15} /></span></div>
          <div><strong>Good things grow together.</strong><small>One report can start a movement.</small></div>
        </div>
        <div className="art-orb orb-one"></div><div className="art-orb orb-two"></div>
      </div>
      <div className="auth-form-side">
        <div className="auth-mobile-brand"><Brand /></div>
        {stage === 'otp' ? <>
          <button className="back-link" onClick={() => { setStage('login'); setNotice(''); setOtp(''); }}>← Back</button>
          <div className="auth-icon"><ShieldCheck size={25} /></div>
          <span className="eyebrow">ONE QUICK CHECK</span>
          <h2 id="auth-title">Verify it’s you</h2>
          <p className="auth-intro">Enter the 6-digit code requested for <strong>{value}</strong>.</p>
          <form onSubmit={verifyOtp}>
            <label htmlFor="otp">Verification code</label>
            <input id="otp" className="otp-input" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="• • • • • •" maxLength={6} />
            <div className="resend-row"><span>Didn't receive a code?</span><button type="button" className="text-button" disabled={busy} onClick={requestOtp}>Resend code</button></div>
            <button className="button button-primary button-full" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Verify & continue'} {!busy && <ArrowRight size={17} />}</button>
            {notice && <div className="notice">{notice}</div>}
          </form>
          <div className="secure-note"><LockKeyhole size={14} /> Your details are protected.</div>
        </> : <>
          <span className="eyebrow">WELCOME TO ECOCONNECT</span>
          <h2 id="auth-title">Let’s make a<br /><span className="text-green">difference.</span></h2>
          <p className="auth-intro">Sign in or create an account to start making your neighbourhood greener.</p>
          <div className="auth-tabs" role="tablist" aria-label="Login method">
            <button className={method === 'email' ? 'active' : ''} onClick={() => { setMethod('email'); setNotice(''); }} role="tab" aria-selected={method === 'email'}><Mail size={16} /> Email</button>
            <button className={method === 'phone' ? 'active' : ''} onClick={() => { setMethod('phone'); setNotice(''); }} role="tab" aria-selected={method === 'phone'}><Smartphone size={16} /> Phone</button>
          </div>
          <form onSubmit={requestOtp}>
            <label htmlFor="contact">{method === 'email' ? 'Email address' : 'Phone number'}</label>
            <div className="input-wrap">
              {method === 'email' ? <Mail size={17} /> : <Smartphone size={17} />}
              {method === 'phone' && <span className="country-code">+91</span>}
              <input id="contact" type={method === 'email' ? 'text' : 'tel'} inputMode={method === 'email' ? 'email' : 'tel'} value={value} onChange={e => { setValue(e.target.value); setNotice(''); }} placeholder={method === 'email' ? 'you@example.com' : 'Enter 10-digit mobile number'} autoComplete={method === 'email' ? 'email' : 'tel'} />
            </div>
            <p className="field-hint">{method === 'email' ? 'We’ll use this to help you access your account.' : 'We’ll use your number for account verification.'}</p>
            <button className="button button-primary button-full" type="submit" disabled={busy}>{busy ? 'Please wait…' : `Continue with ${method === 'email' ? 'email' : 'phone'}`} {!busy && <ArrowRight size={17} />}</button>
            {notice && <div className="notice">{notice}</div>}
          </form>
          <div className="auth-divider"><span>SECURE BY DESIGN</span></div>
          <p className="terms-copy">By continuing, you agree to our <a href="#privacy" onClick={e => e.preventDefault()}>Terms of Service</a> and <a href="#privacy" onClick={e => e.preventDefault()}>Privacy Policy</a>.</p>
          <div className="secure-note"><LockKeyhole size={14} /> Your information stays safe with us.</div>
        </>}
      </div>
    </section>
  </div>;
}

function Header({ openAuth }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <header className="site-header">
    <div className="container nav-wrap">
      <Brand />
      <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'}>
        <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#explore" onClick={() => setMenuOpen(false)}>Explore issues</a>
        <a href="#impact" onClick={() => setMenuOpen(false)}>Our impact</a>
        <a href="#partners" onClick={() => setMenuOpen(false)}>For organisations</a>
      </nav>
      <div className="nav-actions">
        <button className="login-link" onClick={openAuth}>Log in</button>
        <button className="button button-dark nav-cta" onClick={openAuth}>Join the movement <ArrowUpRight size={16} /></button>
      </div>
      <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
    </div>
  </header>;
}

function Hero({ openAuth }) {
  return <section className="hero" id="home">
    <div className="hero-grid container">
      <div className="hero-copy">
        <div className="live-pill"><span className="live-dot"></span> A COMMUNITY FOR A GREENER TOMORROW</div>
        <h1>The world we want<br />starts <span className="headline-highlight">where we are.</span></h1>
        <p className="hero-lede">Spot an environmental problem? Turn that concern into action. EcoConnect brings citizens, NGOs and local authorities together to create cleaner, healthier communities.</p>
        <div className="hero-actions">
          <button className="button button-primary button-large" onClick={openAuth}><MapPin size={18} /> Report an issue <ArrowRight size={17} /></button>
          <a className="button button-soft button-large" href="#how"><span className="play-icon">↗</span> See how it works</a>
        </div>
        <div className="hero-proof">
          <div className="mini-avatars"><span>A</span><span>R</span><span>S</span><span>+</span></div>
          <div><strong>Better together.</strong><small>Every voice can spark change.</small></div>
          <div className="proof-divider"></div>
          <div className="proof-stat"><strong>01 <span>planet</span></strong><small>Shared responsibility</small></div>
        </div>
      </div>
      <div className="hero-visual">
        <div className="visual-backdrop"></div>
        <div className="sun-glow"></div>
        <div className="visual-label label-top"><span className="label-icon"><Leaf size={16} /></span><div><strong>Small actions.</strong><small>Lasting impact.</small></div></div>
        <div className="landscape">
          <div className="hill hill-back"></div><div className="hill hill-mid"></div><div className="hill hill-front"></div>
          <div className="river"></div>
          <div className="tree tree-a"><i></i><b></b></div><div className="tree tree-b"><i></i><b></b></div><div className="tree tree-c"><i></i><b></b></div>
          <div className="flower flower-a">✦</div><div className="flower flower-b">✦</div><div className="flower flower-c">✦</div>
          <div className="tiny-house"><div></div></div>
        </div>
        <div className="visual-label label-bottom"><div className="pulse-icon"><Check size={15} /></div><div><strong>Change is happening</strong><small>One community at a time</small></div><ArrowUpRight size={17} /></div>
        <div className="floating-leaf leaf-one"><Leaf size={24} /></div><div className="floating-leaf leaf-two"><Leaf size={18} /></div>
      </div>
    </div>
    <div className="hero-bottom container">
      <span>BUILT FOR PEOPLE. ROOTED IN THE PLANET.</span>
      <div className="hero-bottom-line"></div>
      <span className="scroll-cue">SCROLL TO EXPLORE <ArrowDownRight size={14} /></span>
    </div>
  </section>;
}

function ImpactStrip() {
  return <section className="impact-strip" id="impact">
    <div className="container impact-inner">
      <div className="impact-intro"><span className="eyebrow">WHY ECOCONNECT</span><h2>Care is a good start.<br /><em>Action changes everything.</em></h2></div>
      <div className="impact-item"><span className="impact-icon"><Users size={21} /></span><div><strong>People-powered</strong><p>Local voices, real community action.</p></div></div>
      <div className="impact-item"><span className="impact-icon"><ShieldCheck size={21} /></span><div><strong>Accountable by design</strong><p>Follow every report, step by step.</p></div></div>
      <div className="impact-item"><span className="impact-icon"><Globe2 size={21} /></span><div><strong>Planet-first thinking</strong><p>Better decisions for a healthier world.</p></div></div>
    </div>
  </section>;
}

function HowItWorks({ openAuth }) {
  const steps = [
    { n: '01', icon: MapPin, title: 'Notice something?', text: 'Spot litter, polluted water, illegal dumping or a public space that needs care.' },
    { n: '02', icon: MessageCircle, title: 'Tell the community', text: 'Add a photo, a short description and the location. It only takes a few minutes.' },
    { n: '03', icon: Sprout, title: 'Watch change grow', text: 'The right organisation reviews the report and shares progress until it’s resolved.' }
  ];
  return <section className="section how-section" id="how">
    <div className="container">
      <div className="section-heading">
        <div><span className="eyebrow">FROM CONCERN TO CHANGE</span><h2>Three steps.<br /><em>A world of difference.</em></h2></div>
        <p>Making your neighbourhood better shouldn’t be complicated. We make it easier to speak up, find support and see progress.</p>
      </div>
      <div className="steps-grid">
        {steps.map((s, i) => <article className="step-card" key={s.n}>
          <div className="step-top"><span>{s.n}</span><span className="step-icon"><s.icon size={22} /></span></div>
          <h3>{s.title}</h3><p>{s.text}</p>
          <div className={`step-illustration step-illustration-${i + 1}`} aria-hidden="true">
            {i === 0 ? <><MapPin size={34} /><span className="map-pin-dot"></span><span className="contour contour-a"></span><span className="contour contour-b"></span></> : i === 1 ? <><MessageCircle size={32} /><span className="upload-cloud"><Leaf size={18} /></span><span className="upload-dot"></span></> : <><Sprout size={40} /><span className="sun-small"></span><span className="ground-line"></span></>}
          </div>
        </article>)}
      </div>
      <div className="center-action"><button className="button button-primary" onClick={openAuth}>Start with one small action <ArrowRight size={17} /></button></div>
    </div>
  </section>;
}

function Explore({ openAuth }) {
  return <section className="section explore-section" id="explore">
    <div className="container">
      <div className="section-heading explore-heading">
        <div><span className="eyebrow">SEE WHAT NEEDS CARE</span><h2>Every issue matters.<br /><em>Every action counts.</em></h2></div>
        <a className="inline-link" href="#home" onClick={e => { e.preventDefault(); openAuth(); }}>Explore community reports <ArrowUpRight size={17} /></a>
      </div>
      <div className="explore-layout">
        <div className="reports-panel">
          <div className="panel-head"><div><span className="eyebrow">COMMUNITY PULSE</span><h3>Issues in the spotlight</h3></div><span className="panel-live"><span className="live-dot"></span> Live preview</span></div>
          <div className="report-list">
            {reports.map((r, i) => <article className="report-row" key={r.title}>
              <div className={`report-thumb thumb-${i + 1}`}><span>{r.initials}</span>{i === 0 ? <Recycle size={25} /> : i === 1 ? <Waves size={25} /> : <Flower2 size={25} />}</div>
              <div className="report-info"><span className="report-type">{r.type}</span><h4>{r.title}</h4><span className="report-place"><MapPin size={12} />{r.place}</span></div>
              <span className={`status status-${r.color}`}>{r.status}</span>
            </article>)}
          </div>
          <button className="panel-footer" onClick={openAuth}>Sign in to view community reports <ArrowRight size={16} /></button>
        </div>
        <div className="map-panel">
          <div className="map-top"><div><span className="eyebrow">LOCAL TO GLOBAL</span><h3>Change starts nearby.</h3></div><span className="map-expand"><ArrowUpRight size={16} /></span></div>
          <div className="illustrated-map">
            <div className="map-river"></div><div className="map-road road-one"></div><div className="map-road road-two"></div><div className="map-road road-three"></div>
            <span className="map-green green-one"></span><span className="map-green green-two"></span><span className="map-green green-three"></span><span className="map-green green-four"></span>
            <div className="map-marker marker-one"><span><Recycle size={16} /></span></div><div className="map-marker marker-two"><span><Waves size={16} /></span></div><div className="map-marker marker-three"><span><Trees size={16} /></span></div>
            <div className="map-legend"><span><i className="legend-dot dot-waste"></i>Waste</span><span><i className="legend-dot dot-water"></i>Water</span><span><i className="legend-dot dot-green"></i>Green spaces</span></div>
            <div className="map-caption"><span className="map-caption-icon"><MapPin size={17} /></span><div><strong>Your area, your impact</strong><small>See local issues and progress on the map.</small></div></div>
          </div>
        </div>
      </div>
      <p className="demo-caption">Illustrative preview — sample reports and map markers, not live community data.</p>
    </div>
  </section>;
}

function Partners() {
  return <section className="partners-section" id="partners">
    <div className="container partners-wrap">
      <div className="partners-copy"><span className="eyebrow eyebrow-light">BETTER, TOGETHER</span><h2>Good for your street.<br /><em>Better for our future.</em></h2><p>When citizens, NGOs and local authorities work from the same page, good intentions can become visible progress.</p><a href="#home" className="button button-white" onClick={e => { e.preventDefault(); document.dispatchEvent(new Event('ecoconnect:auth')); }}>Join as a community partner <ArrowRight size={17} /></a></div>
      <div className="partner-visual">
        <div className="partner-circle circle-one"></div><div className="partner-circle circle-two"></div>
        <div className="partner-center"><Earth size={40} /><span>One shared<br />planet</span></div>
        <div className="partner-node node-citizen"><Users size={19} /><span>Citizens</span></div><div className="partner-node node-ngo"><Heart size={19} /><span>NGOs</span></div><div className="partner-node node-gov"><ShieldCheck size={19} /><span>Local authorities</span></div>
        <div className="orbit-dot orbit-dot-a"></div><div className="orbit-dot orbit-dot-b"></div><div className="orbit-dot orbit-dot-c"></div>
      </div>
    </div>
  </section>;
}

function Footer({ openAuth }) {
  return <footer className="site-footer">
    <div className="container footer-main"><div><Brand /><p>Connecting good people to good work<br />for a cleaner, kinder world.</p></div>
      <div className="footer-links"><div><strong>Explore</strong><a href="#how">How it works</a><a href="#explore">Community issues</a><a href="#impact">Our impact</a></div><div><strong>Get involved</strong><a href="#partners">For organisations</a><button onClick={openAuth}>Create an account</button><a href="#home">Back to top ↑</a></div><div><strong>Our promise</strong><span>Community-led</span><span>Transparent action</span><span>Planet-first</span></div></div>
    </div>
    <div className="container footer-bottom"><span>© 2026 EcoConnect. Growing a greener tomorrow.</span><span><Leaf size={13} /> Made for the world we share.</span></div>
  </footer>;
}


export default function App() {
  const [authOpen, setAuthOpen] = useState(false);

  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("ecoconnect_token");
    const savedUser = localStorage.getItem("ecoconnect_user");

    // Restore the dashboard only if a token and user are saved.
    if (token && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem("ecoconnect_user");
        return null;
      }
    }

    return null;
  });

  useEffect(() => {
    const handler = () => setAuthOpen(true);

    document.addEventListener("ecoconnect:auth", handler);

    return () => {
      document.removeEventListener("ecoconnect:auth", handler);
    };
  }, []);

  function handleLoginSuccess(loggedInUser) {
    // Update the application state after OTP verification.
    setUser(loggedInUser);
    setAuthOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("ecoconnect_token");
    localStorage.removeItem("ecoconnect_user");

    setUser(null);
    setAuthOpen(false);
  }

  // IMPORTANT: Show the dashboard after successful login.
  if (user) {
    return (
      <Dashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }

  // Show the original homepage when the user is not logged in.
  return (
    <>
      <Header openAuth={() => setAuthOpen(true)} />

      <main>
        <Hero openAuth={() => setAuthOpen(true)} />

        <ImpactStrip />

        <HowItWorks openAuth={() => setAuthOpen(true)} />

        <Explore openAuth={() => setAuthOpen(true)} />

        <Partners />
      </main>

      <Footer openAuth={() => setAuthOpen(true)} />

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}

