import { useState } from 'react'
import './App.css'

const menuItems = [
  { icon: '⌂', label: 'Επισκόπηση' },
  { icon: '↔', label: 'Συναλλαγές' },
  { icon: '◎', label: 'Προϋπολογισμοί' },
  { icon: '◇', label: 'Αποταμίευση' },
  { icon: '♙', label: 'Ομάδα' },
  { icon: '□', label: 'Συναντήσεις' },
  { icon: '▥', label: 'Αναφορές' },
]

const chartData = [
  { month: 'Απρ', value: 48 },
  { month: 'Μάι', value: 64 },
  { month: 'Ιούν', value: 55 },
  { month: 'Ιούλ', value: 78 },
  { month: 'Αύγ', value: 68 },
  { month: 'Σεπ', value: 88 },
]

const transactions = [
  { name: 'Vodafone Business', type: 'Έσοδο', amount: '+€1.850', positive: true },
  { name: 'Adobe Creative Cloud', type: 'Λογισμικό', amount: '-€36,89', positive: false },
  { name: 'Γραφείο Αθηνών', type: 'Ενοίκιο', amount: '-€620', positive: false },
]

function App() {
  const [activeItem, setActiveItem] = useState('Επισκόπηση')
  const [darkMode, setDarkMode] = useState(true)

  return (
    <div className={`ember-app ${darkMode ? 'dark' : 'light'}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🔥</div>
          <div>
            <strong>Ember</strong>
            <span>Burn & Cash Flow</span>
          </div>
        </div>

        <nav className="navigation">
          <p className="nav-title">ΚΕΝΤΡΙΚΟ ΜΕΝΟΥ</p>

          {menuItems.map((item) => (
            <button
              key={item.label}
              className={activeItem === item.label ? 'nav-item active' : 'nav-item'}
              onClick={() => setActiveItem(item.label)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="trial-card">
          <span>ΔΩΡΕΑΝ ΔΟΚΙΜΗ</span>
          <strong>14 ημέρες</strong>
          <p>Ανακάλυψε όλες τις δυνατότητες της Ember.</p>
          <button>Δες τα πακέτα</button>
        </div>

        <button className="settings-button">
          <span>⚙</span>
          Ρυθμίσεις
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">ΟΙΚΟΝΟΜΙΚΗ ΕΙΚΟΝΑ</p>
            <h1>Καλησπέρα, Κώστα</h1>
            <span>Δες πώς κινείται η επιχείρησή σου σήμερα.</span>
          </div>

          <div className="topbar-actions">
            <button className="language-button">EL</button>
            <button
              className="theme-button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Αλλαγή θέματος"
            >
              {darkMode ? '☀' : '☾'}
            </button>
            <div className="avatar">KK</div>
          </div>
        </header>

        <section className="summary-grid">
          <article className="summary-card">
            <span>Συνολικό υπόλοιπο</span>
            <strong>€12.480,20</strong>
            <small className="positive">↑ 8,4% αυτόν τον μήνα</small>
          </article>

          <article className="summary-card">
            <span>Μηνιαία έσοδα</span>
            <strong>€5.240,00</strong>
            <small className="positive">↑ 12,1% από τον Αύγουστο</small>
          </article>

          <article className="summary-card">
            <span>Μηνιαία έξοδα</span>
            <strong>€2.180,45</strong>
            <small className="negative">↓ 3,2% από τον Αύγουστο</small>
          </article>

          <article className="summary-card accent-card">
            <span>Καθαρή ροή</span>
            <strong>+€3.059,55</strong>
            <small>Η οικονομική σου εικόνα είναι θετική</small>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel cashflow-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">ΑΝΑΛΥΣΗ</p>
                <h2>Ταμειακή ροή</h2>
              </div>
              <button>Τελευταίοι 6 μήνες⌄</button>
            </div>

            <div className="chart">
              {chartData.map((item) => (
                <div className="bar-column" key={item.month}>
                  <div className="bar-track">
                    <div className="bar" style={{ height: `${item.value}%` }} />
                  </div>
                  <span>{item.month}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel budget-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">ΣΤΟΧΟΣ ΜΗΝΑ</p>
                <h2>Προϋπολογισμός</h2>
              </div>
              <strong>68%</strong>
            </div>

            <div className="budget-ring">
              <div>
                <strong>€2.180</strong>
                <span>από €3.200</span>
              </div>
            </div>

            <p className="budget-message">
              Σου απομένουν <strong>€1.020</strong> για αυτόν τον μήνα.
            </p>
          </article>
        </section>

        <section className="panel transactions-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">ΠΡΟΣΦΑΤΗ ΔΡΑΣΤΗΡΙΟΤΗΤΑ</p>
              <h2>Τελευταίες συναλλαγές</h2>
            </div>
            <button>Προβολή όλων →</button>
          </div>

          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div className="transaction-row" key={transaction.name}>
                <div className="transaction-icon">
                  {transaction.positive ? '↗' : '↘'}
                </div>
                <div className="transaction-info">
                  <strong>{transaction.name}</strong>
                  <span>{transaction.type}</span>
                </div>
                <strong className={transaction.positive ? 'positive' : ''}>
                  {transaction.amount}
                </strong>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App