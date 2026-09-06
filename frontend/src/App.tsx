import { useEffect, useState, type FormEvent } from 'react'
import AuthScreen from './components/AuthScreen'
import { getCurrentUser, logout, type AuthUser } from './services/auth'
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  type Transaction,
  type TransactionType,
} from './services/transactions'
import './App.css'

const navigation = [
  { icon: '⌂', label: 'Επισκόπηση' },
  { icon: '↗', label: 'Συναλλαγές' },
  { icon: '◫', label: 'Προϋπολογισμοί' },
  { icon: '○', label: 'Αποταμίευση' },
  { icon: '♙', label: 'Ομάδα' },
  { icon: '□', label: 'Συναντήσεις' },
  { icon: '≡', label: 'Αναφορές' },
]

const cashFlow = [
  { month: 'Απρ', income: 52, expense: 31 },
  { month: 'Μάι', income: 66, expense: 42 },
  { month: 'Ιούν', income: 58, expense: 36 },
  { month: 'Ιούλ', income: 76, expense: 44 },
  { month: 'Αύγ', income: 69, expense: 39 },
  { month: 'Σεπ', income: 88, expense: 48 },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('el-GR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value))
}

function createEmptyTransaction() {
  return {
    description: '',
    amount: '',
    type: 2 as TransactionType,
    category: '',
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [activePage, setActivePage] = useState('Επισκόπηση')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [transactionError, setTransactionError] = useState('')
  const [newTransaction, setNewTransaction] = useState(
    createEmptyTransaction(),
  )

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setTransactions([])
      return
    }

    setIsLoadingTransactions(true)

    getTransactions()
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setIsLoadingTransactions(false))
  }, [currentUser])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setCurrentUser(null)
    }
  }

  async function handleCreateTransaction(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setTransactionError('')

    const amount = Number(newTransaction.amount.replace(',', '.'))

    if (!newTransaction.description.trim()) {
      setTransactionError('Γράψε μια περιγραφή.')
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setTransactionError('Το ποσό πρέπει να είναι μεγαλύτερο από μηδέν.')
      return
    }

    try {
      const transaction = await createTransaction({
        description: newTransaction.description.trim(),
        amount,
        type: newTransaction.type,
        category: newTransaction.category.trim() || 'Άλλο',
        isRecurring: false,
      })

      setTransactions((items) => [transaction, ...items])
      setNewTransaction(createEmptyTransaction())
      setShowTransactionForm(false)
    } catch (error) {
      setTransactionError(
        error instanceof Error
          ? error.message
          : 'Δεν ήταν δυνατή η αποθήκευση.',
      )
    }
  }

  async function handleDeleteTransaction(id: string) {
    await deleteTransaction(id)
    setTransactions((items) => items.filter((item) => item.id !== id))
  }

  if (checkingSession) {
    return <div className="session-loading">Φόρτωση Ember...</div>
  }

  if (!currentUser) {
    return <AuthScreen onAuthenticated={setCurrentUser} />
  }

  const totalIncome = transactions
    .filter((transaction) => transaction.type === 1)
    .reduce((total, transaction) => total + transaction.amount, 0)

  const totalExpense = transactions
    .filter((transaction) => transaction.type === 2)
    .reduce((total, transaction) => total + transaction.amount, 0)

  const netCashFlow = totalIncome - totalExpense
  const displayName =
    currentUser.fullName || currentUser.email.split('@')[0]

  const dashboard = (
    <>
      <section className="balance-section">
        <div>
          <span className="section-label">ΔΙΑΘΕΣΙΜΟ ΥΠΟΛΟΙΠΟ</span>
          <h2>{formatCurrency(12480.2 + netCashFlow)}</h2>
          <p>
            <strong>
              {netCashFlow >= 0 ? '+' : ''}
              {formatCurrency(netCashFlow)}
            </strong>{' '}
            καθαρή ροή από τις καταχωρήσεις
          </p>
        </div>

        <div className="balance-actions">
          <button className="secondary-button">Εξαγωγή</button>
          <button
            className="primary-button"
            onClick={() => {
              setTransactionError('')
              setShowTransactionForm(true)
            }}
          >
            + Νέα συναλλαγή
          </button>
        </div>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>Έσοδα</span>
          <strong>{formatCurrency(totalIncome)}</strong>
          <small className="up">Αυτόν τον μήνα</small>
        </div>

        <div className="metric">
          <span>Έξοδα</span>
          <strong>{formatCurrency(totalExpense)}</strong>
          <small>Αυτόν τον μήνα</small>
        </div>

        <div className="metric">
          <span>Καθαρή ροή</span>
          <strong>{formatCurrency(netCashFlow)}</strong>
          <small className={netCashFlow >= 0 ? 'up' : 'negative'}>
            {netCashFlow >= 0 ? 'Θετική' : 'Αρνητική'}
          </small>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">ΤΕΛΕΥΤΑΙΟΙ 6 ΜΗΝΕΣ</span>
              <h3>Ταμειακή ροή</h3>
            </div>

            <div className="legend">
              <span>
                <i className="income-dot" />
                Έσοδα
              </span>
              <span>
                <i className="expense-dot" />
                Έξοδα
              </span>
            </div>
          </div>

          <div className="chart">
            {cashFlow.map((item) => (
              <div className="chart-column" key={item.month}>
                <div className="bars">
                  <span
                    className="income-bar"
                    style={{ height: `${item.income}%` }}
                  />
                  <span
                    className="expense-bar"
                    style={{ height: `${item.expense}%` }}
                  />
                </div>
                <small>{item.month}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel month-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">ΣΕΠΤΕΜΒΡΙΟΣ</span>
              <h3>Αυτόν τον μήνα</h3>
            </div>
            <button className="more-button">•••</button>
          </div>

          <div className="month-list">
            <div>
              <span>Προϋπολογισμός</span>
              <strong>68%</strong>
            </div>

            <div className="progress">
              <span />
            </div>

            <div className="month-row">
              <span>Εκτίμηση ΦΠΑ</span>
              <strong>€742,30</strong>
            </div>

            <div className="month-row">
              <span>Επόμενη πληρωμή</span>
              <strong>12 Σεπ</strong>
            </div>

            <div className="month-row">
              <span>Δωρεάν δοκιμή</span>
              <strong>{currentUser.trialDaysRemaining} ημέρες</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel transactions-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">ΔΡΑΣΤΗΡΙΟΤΗΤΑ</span>
            <h3>Πρόσφατες συναλλαγές</h3>
          </div>

          <button
            className="text-button"
            onClick={() => setActivePage('Συναλλαγές')}
          >
            Προβολή όλων →
          </button>
        </div>

        <div className="transaction-list">
          {isLoadingTransactions && (
            <p className="transactions-empty">Φόρτωση συναλλαγών...</p>
          )}

          {!isLoadingTransactions && transactions.length === 0 && (
            <p className="transactions-empty">
              Δεν υπάρχουν ακόμη συναλλαγές.
            </p>
          )}

          {transactions.slice(0, 5).map((transaction) => (
            <div className="transaction" key={transaction.id}>
              <div
                className={
                  transaction.type === 1
                    ? 'transaction-mark income'
                    : 'transaction-mark'
                }
              >
                {transaction.type === 1 ? '↙' : '↗'}
              </div>

              <div className="transaction-name">
                <strong>{transaction.description}</strong>
                <span>{transaction.category}</span>
              </div>

              <span className="transaction-date">
                {formatDate(transaction.occurredAtUtc)}
              </span>

              <strong
                className={
                  transaction.type === 1 ? 'amount income' : 'amount'
                }
              >
                {transaction.type === 1 ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </strong>

              <button
                className="delete-transaction"
                onClick={() => handleDeleteTransaction(transaction.id)}
                aria-label="Διαγραφή συναλλαγής"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  )

  return (
    <div className={`ember-app ${darkMode ? 'dark' : 'light'}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                fill="url(#emberFlame)"
                d="M17.4 2.5c.5 4.7-3.2 6.3-3.2 9.4 0 1.5.8 2.8 2.2 3.6-.2-2.5 1.1-4.5 3.4-6.2 3.2 2.5 5.2 5.7 5.2 9.1 0 4.8-3.9 8.6-8.8 8.6S7.4 23.2 7.4 18.4c0-3.7 2.1-6.9 5.1-9.6-.3 3.4 1.2 5.1 2.2 5.8-.2-4.4 2.4-6.7 2.7-12.1Z"
              />
              <path
                fill="#ffd0b8"
                d="M16.4 16.1c2 1.7 3.1 3.3 3.1 5.1a3.3 3.3 0 0 1-6.6 0c0-1.5.8-2.9 2.1-4.1 0 1.4.5 2.2 1.1 2.7-.1-1.5.2-2.6.3-3.7Z"
              />
              <defs>
                <linearGradient id="emberFlame" x1="8" y1="4" x2="24" y2="27">
                  <stop stopColor="#ff9a4d" />
                  <stop offset="1" stopColor="#ed3e19" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <strong>Ember</strong>
        </div>

        <div className="workspace">
          <div>
            <span>Χώρος εργασίας</span>
            <strong>Kostas Business</strong>
          </div>
          <span className="trial-badge">
            Trial · {currentUser.trialDaysRemaining}d
          </span>
        </div>

        <nav>
          {navigation.map((item) => (
            <button
              key={item.label}
              className={
                activePage === item.label ? 'nav-item active' : 'nav-item'
              }
              onClick={() => setActivePage(item.label)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item">
            <span>⚙</span>
            Ρυθμίσεις
          </button>

          <button className="nav-item" onClick={handleLogout}>
            <span>↪</span>
            Αποσύνδεση
          </button>

          <div className="profile">
            <div className="avatar">KK</div>
            <div>
              <strong>{displayName}</strong>
              <span>{currentUser.email}</span>
            </div>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <span className="breadcrumb">
              EMBER / {activePage.toUpperCase()}
            </span>
            <h1>{activePage}</h1>
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
          </div>
        </header>

        {activePage === 'Επισκόπηση' ? (
          dashboard
        ) : (
          <section className="empty-page">
            <span>
              {navigation.find((item) => item.label === activePage)?.icon}
            </span>
            <h2>{activePage}</h2>
            <p>
              Η ενότητα θα συνδεθεί με τα πραγματικά δεδομένα της Ember.
            </p>
            <button
              className="primary-button"
              onClick={() => setActivePage('Επισκόπηση')}
            >
              Επιστροφή στην επισκόπηση
            </button>
          </section>
        )}
      </main>

      {showTransactionForm && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowTransactionForm(false)}
        >
          <section
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-label">ΝΕΑ ΚΑΤΑΧΩΡΗΣΗ</span>
                <h3>Νέα συναλλαγή</h3>
              </div>

              <button
                className="more-button"
                onClick={() => setShowTransactionForm(false)}
              >
                ×
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleCreateTransaction}
            >
              <label htmlFor="description">Περιγραφή</label>
              <input
                id="description"
                value={newTransaction.description}
                onChange={(event) =>
                  setNewTransaction((form) => ({
                    ...form,
                    description: event.target.value,
                  }))
                }
                placeholder="π.χ. Ενοίκιο γραφείου"
                required
              />

              <label htmlFor="amount">Ποσό</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={newTransaction.amount}
                onChange={(event) =>
                  setNewTransaction((form) => ({
                    ...form,
                    amount: event.target.value,
                  }))
                }
                placeholder="0,00"
                required
              />

              <label htmlFor="type">Τύπος</label>
              <select
                id="type"
                value={newTransaction.type}
                onChange={(event) =>
                  setNewTransaction((form) => ({
                    ...form,
                    type: Number(event.target.value) as TransactionType,
                  }))
                }
              >
                <option value={1}>Έσοδο</option>
                <option value={2}>Έξοδο</option>
              </select>

              <label htmlFor="category">Κατηγορία</label>
              <input
                id="category"
                value={newTransaction.category}
                onChange={(event) =>
                  setNewTransaction((form) => ({
                    ...form,
                    category: event.target.value,
                  }))
                }
                placeholder="π.χ. Λογισμικό"
              />

              {transactionError && (
                <p className="auth-error">{transactionError}</p>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                >
                  Ακύρωση
                </button>
                <button className="primary-button" type="submit">
                  Αποθήκευση
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App