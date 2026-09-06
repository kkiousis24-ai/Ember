import { useEffect, useRef, useState, type FormEvent } from 'react'
import AuthScreen from './components/AuthScreen'
import { getCurrentUser, logout, type AuthUser } from './services/auth'
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction,
  type Transaction,
  type TransactionType,
} from './services/transactions'
import {
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
  type Budget,
} from './services/budgets'
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

type TransactionFilter = 'all' | 'income' | 'expense'

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

function createEmptyBudget() {
  const now = new Date()

  return {
    category: '',
    limitAmount: '',
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }
}

type AccessUser = AuthUser & {
  hasActiveAccess?: boolean
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
  const [transactionSearch, setTransactionSearch] = useState('')
  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilter>('all')
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)
  const [isSavingTransaction, setIsSavingTransaction] = useState(false)
  const saveInProgress = useRef(false)
  const transactionModalRef = useRef<HTMLElement | null>(null)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [isLoadingBudgets, setIsLoadingBudgets] = useState(false)
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [budgetError, setBudgetError] = useState('')
  const [newBudget, setNewBudget] = useState(createEmptyBudget())
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [isSavingBudget, setIsSavingBudget] = useState(false)
  const budgetSaveInProgress = useRef(false)

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('ember-theme')

    if (savedTheme === 'light') {
      setDarkMode(false)
    }
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

  useEffect(() => {
    if (!currentUser) {
      setBudgets([])
      return
    }

    setIsLoadingBudgets(true)

    getBudgets()
      .then(setBudgets)
      .catch(() => setBudgets([]))
      .finally(() => setIsLoadingBudgets(false))
  }, [currentUser])

  useEffect(() => {
    if (!showTransactionForm) return

    const modal = transactionModalRef.current
    if (!modal) return

    const previousFocus = document.activeElement
    modal.querySelector<HTMLInputElement>('#description')?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()

        if (!saveInProgress.current) {
          setShowTransactionForm(false)
          setEditingTransaction(null)
          setNewTransaction(createEmptyTransaction())
          setTransactionError('')
        }

        return
      }

      if (event.key !== 'Tab') return

      const elements = modal.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled])',
      )
      const first = elements.item(0)
      const last = elements.item(elements.length - 1)

      if (!first || !last) {
        event.preventDefault()
        modal.focus()
        return
      }

      const focusOutside = !modal.contains(document.activeElement)

      if (event.shiftKey && (document.activeElement === first || focusOutside)) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || focusOutside)
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus()
      }
    }
  }, [showTransactionForm])

  async function handleLogout() {
    try {
      await logout()
    } finally {
      setCurrentUser(null)
    }
  }

  function toggleTheme() {
    setDarkMode((current) => {
      const next = !current
      window.localStorage.setItem('ember-theme', next ? 'dark' : 'light')
      return next
    })
  }

  function openCreateTransactionForm() {
    if (saveInProgress.current) return

    setEditingTransaction(null)
    setNewTransaction(createEmptyTransaction())
    setTransactionError('')
    setShowTransactionForm(true)
  }

  function openEditTransactionForm(transaction: Transaction) {
    if (saveInProgress.current) return

    setEditingTransaction(transaction)
    setNewTransaction({
      description: transaction.description,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
    })
    setTransactionError('')
    setShowTransactionForm(true)
  }

  function closeTransactionForm() {
    if (saveInProgress.current) return

    setShowTransactionForm(false)
    setEditingTransaction(null)
    setNewTransaction(createEmptyTransaction())
    setTransactionError('')
  }

  async function handleSaveTransaction(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (saveInProgress.current) return

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

    const input = {
      description: newTransaction.description.trim(),
      amount,
      type: newTransaction.type,
      category: newTransaction.category.trim() || 'Άλλο',
    }

    saveInProgress.current = true
    setIsSavingTransaction(true)

    try {
      if (editingTransaction) {
        const transaction = await updateTransaction(editingTransaction.id, {
          ...input,
          occurredAtUtc: editingTransaction.occurredAtUtc,
          isRecurring: editingTransaction.isRecurring,
        })

        setTransactions((items) =>
          items.map((item) =>
            item.id === transaction.id ? transaction : item,
          ),
        )
      } else {
        const transaction = await createTransaction({
          ...input,
          isRecurring: false,
        })

        setTransactions((items) => [transaction, ...items])
      }

      setNewTransaction(createEmptyTransaction())
      setEditingTransaction(null)
      setShowTransactionForm(false)
    } catch (error) {
      setTransactionError(
        error instanceof Error
          ? error.message
          : 'Δεν ήταν δυνατή η αποθήκευση.',
      )
    } finally {
      saveInProgress.current = false
      setIsSavingTransaction(false)
    }
  }

  async function handleDeleteTransaction(id: string) {
    await deleteTransaction(id)
    setTransactions((items) => items.filter((item) => item.id !== id))
  }

  function openCreateBudgetForm() {
    if (budgetSaveInProgress.current) return

    setEditingBudget(null)
    setNewBudget(createEmptyBudget())
    setBudgetError('')
    setShowBudgetForm(true)
  }

  function openEditBudgetForm(budget: Budget) {
    if (budgetSaveInProgress.current) return

    setEditingBudget(budget)
    setNewBudget({
      category: budget.category,
      limitAmount: String(budget.limitAmount),
      month: budget.month,
      year: budget.year,
    })
    setBudgetError('')
    setShowBudgetForm(true)
  }

  function closeBudgetForm() {
    if (budgetSaveInProgress.current) return

    resetBudgetForm()
  }

  function resetBudgetForm() {
    setShowBudgetForm(false)
    setEditingBudget(null)
    setNewBudget(createEmptyBudget())
    setBudgetError('')
  }

  async function handleSaveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (budgetSaveInProgress.current) return

    setBudgetError('')

    const limitAmount = Number(newBudget.limitAmount.replace(',', '.'))

    if (!newBudget.category.trim()) {
      setBudgetError('Γράψε μια κατηγορία.')
      return
    }

    if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
      setBudgetError('Το όριο πρέπει να είναι μεγαλύτερο από μηδέν.')
      return
    }

    budgetSaveInProgress.current = true
    setIsSavingBudget(true)

    try {
      const input = {
        category: newBudget.category.trim(),
        limitAmount,
        month: newBudget.month,
        year: newBudget.year,
      }

      if (editingBudget) {
        const budget = await updateBudget(editingBudget.id, input)

        setBudgets((items) =>
          items.map((item) => (item.id === budget.id ? budget : item)),
        )
      } else {
        const budget = await createBudget(input)
        setBudgets((items) => [budget, ...items])
      }

      resetBudgetForm()
    } catch (error) {
      setBudgetError(
        error instanceof Error
          ? error.message
          : 'Δεν ήταν δυνατή η αποθήκευση.',
      )
    } finally {
      budgetSaveInProgress.current = false
      setIsSavingBudget(false)
    }
  }

  async function handleDeleteBudget(id: string) {
    await deleteBudget(id)
    setBudgets((items) => items.filter((item) => item.id !== id))
  }

  if (checkingSession) {
    return <div className="session-loading">Φόρτωση Ember...</div>
  }

  if (!currentUser) {
    return <AuthScreen onAuthenticated={setCurrentUser} />
  }

  const hasActiveAccess =
    (currentUser as AccessUser).hasActiveAccess ?? true

  if (!hasActiveAccess) {
    return (
      <div className="subscription-lock">
        <section className="subscription-lock-card">
          <div className="lock-mark">⌛</div>
          <span className="section-label">EMBER TRIAL</span>
          <h1>Η δωρεάν δοκιμή ολοκληρώθηκε</h1>
          <p>
            Οι 14 ημέρες δοκιμής σου τελείωσαν. Επίλεξε ένα πακέτο για να
            συνεχίσεις να χρησιμοποιείς τις συναλλαγές και το dashboard.
          </p>
          <button className="secondary-button" onClick={handleLogout}>
            Αποσύνδεση
          </button>
        </section>
      </div>
    )
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
  const accountPlan =
    (currentUser as AuthUser & { plan?: string }).plan || 'Free trial'
  const totalBudgetLimit = budgets.reduce(
    (total, budget) => total + budget.limitAmount,
    0,
  )
  const totalBudgetSpent = budgets.reduce(
    (total, budget) => total + budget.spentAmount,
    0,
  )
  const totalBudgetRemaining = totalBudgetLimit - totalBudgetSpent
  const budgetUsagePercentage = totalBudgetLimit
    ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100)
    : 0
  const currentMonthLabel = new Intl.DateTimeFormat('el-GR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const normalizedSearch = transactionSearch.trim().toLocaleLowerCase('el-GR')
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesFilter =
      transactionFilter === 'all' ||
      (transactionFilter === 'income' && transaction.type === 1) ||
      (transactionFilter === 'expense' && transaction.type === 2)

    if (!matchesFilter) return false
    if (!normalizedSearch) return true

    return `${transaction.description} ${transaction.category}`
      .toLocaleLowerCase('el-GR')
      .includes(normalizedSearch)
  })

  function renderTransactionRow(transaction: Transaction) {
    return (
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
          <span>
            {transaction.category}{' · '}
            <button
              type="button"
              className="text-button"
              style={{ padding: 0, fontSize: 'inherit' }}
              onClick={() => openEditTransactionForm(transaction)}
              disabled={isSavingTransaction}
              aria-label={`Επεξεργασία συναλλαγής: ${transaction.description}`}
            >
              Επεξεργασία
            </button>
          </span>
        </div>

        <span className="transaction-date">
          {formatDate(transaction.occurredAtUtc)}
        </span>

        <strong
          className={transaction.type === 1 ? 'amount income' : 'amount'}
        >
          {transaction.type === 1 ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </strong>

        <button
          className="delete-transaction"
          onClick={() => handleDeleteTransaction(transaction.id)}
          disabled={isSavingTransaction}
          aria-label={`Διαγραφή συναλλαγής: ${transaction.description}`}
        >
          ×
        </button>
      </div>
    )
  }

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
            onClick={openCreateTransactionForm}
            disabled={isSavingTransaction}
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

          {transactions.slice(0, 5).map(renderTransactionRow)}
        </div>
      </section>
    </>
  )

  const transactionsPage = (
    <section className="panel transactions-page-panel">
      <div className="panel-heading">
        <div>
          <span className="section-label">ΟΛΕΣ ΟΙ ΚΑΤΑΧΩΡΗΣΕΙΣ</span>
          <h3>Συναλλαγές</h3>
        </div>

        <button
          className="primary-button"
          onClick={openCreateTransactionForm}
          disabled={isSavingTransaction}
        >
          + Νέα συναλλαγή
        </button>
      </div>

      <div className="transactions-toolbar">
        <input
          className="transaction-search"
          value={transactionSearch}
          onChange={(event) => setTransactionSearch(event.target.value)}
          placeholder="Αναζήτηση περιγραφής ή κατηγορίας..."
          aria-label="Αναζήτηση συναλλαγών"
        />

        <select
          className="transaction-filter"
          value={transactionFilter}
          onChange={(event) =>
            setTransactionFilter(event.target.value as TransactionFilter)
          }
          aria-label="Φίλτρο τύπου συναλλαγής"
        >
          <option value="all">Όλες</option>
          <option value="income">Έσοδα</option>
          <option value="expense">Έξοδα</option>
        </select>
      </div>

      <div className="transaction-summary">
        <div className="transaction-summary-card">
          <span>Εμφανίζονται</span>
          <strong>{filteredTransactions.length}</strong>
        </div>
        <div className="transaction-summary-card">
          <span>Σύνολο εσόδων</span>
          <strong className="income-text">{formatCurrency(totalIncome)}</strong>
        </div>
        <div className="transaction-summary-card">
          <span>Σύνολο εξόδων</span>
          <strong>{formatCurrency(totalExpense)}</strong>
        </div>
      </div>

      <div className="transaction-list full-transaction-list">
        {isLoadingTransactions && (
          <p className="transactions-empty">Φόρτωση συναλλαγών...</p>
        )}

        {!isLoadingTransactions && filteredTransactions.length === 0 && (
          <p className="transactions-empty">
            {transactions.length === 0
              ? 'Δεν υπάρχουν ακόμη συναλλαγές.'
              : 'Δεν βρέθηκαν συναλλαγές με αυτά τα φίλτρα.'}
          </p>
        )}

        {!isLoadingTransactions &&
          filteredTransactions.map(renderTransactionRow)}
      </div>
    </section>
  )

  const budgetsPage = (
    <>
      <section className="balance-section budgets-header">
        <div>
          <span className="section-label">ΠΡΟΫΠΟΛΟΓΙΣΜΟΙ · {currentMonthLabel}</span>
          <h2>{formatCurrency(totalBudgetRemaining)}</h2>
          <p>
            Υπόλοιπο από όριο {formatCurrency(totalBudgetLimit)} και έξοδα{' '}
            {formatCurrency(totalBudgetSpent)}
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openCreateBudgetForm}
          disabled={isSavingBudget}
        >
          + Νέος προϋπολογισμός
        </button>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>Συνολικό όριο</span>
          <strong>{formatCurrency(totalBudgetLimit)}</strong>
          <small>{budgets.length} κατηγορίες</small>
        </div>

        <div className="metric">
          <span>Έχουν δαπανηθεί</span>
          <strong>{formatCurrency(totalBudgetSpent)}</strong>
          <small>{budgetUsagePercentage}% χρήση</small>
        </div>

        <div className="metric">
          <span>Υπόλοιπο</span>
          <strong>{formatCurrency(totalBudgetRemaining)}</strong>
          <small className={totalBudgetRemaining >= 0 ? 'up' : 'negative'}>
            {totalBudgetRemaining >= 0 ? 'Εντός ορίου' : 'Πάνω από το όριο'}
          </small>
        </div>
      </section>

      <section className="budget-grid">
        {isLoadingBudgets && (
          <p className="transactions-empty">Φόρτωση προϋπολογισμών...</p>
        )}

        {!isLoadingBudgets && budgets.length === 0 && (
          <div className="panel budget-empty">
            <span>◫</span>
            <h3>Δεν υπάρχουν προϋπολογισμοί</h3>
            <p>Δημιούργησε το πρώτο όριο για μια κατηγορία εξόδων.</p>
            <button className="primary-button" onClick={openCreateBudgetForm}>
              + Δημιουργία προϋπολογισμού
            </button>
          </div>
        )}

        {!isLoadingBudgets &&
          budgets.map((budget) => (
            <article className="panel budget-card" key={budget.id}>
              <div className="budget-card-heading">
                <div>
                  <span className="section-label">ΚΑΤΗΓΟΡΙΑ</span>
                  <h3>{budget.category}</h3>
                </div>

                <div className="budget-card-actions">
                  <button
                    className="more-button"
                    onClick={() => openEditBudgetForm(budget)}
                    disabled={isSavingBudget}
                    aria-label={`Επεξεργασία προϋπολογισμού ${budget.category}`}
                  >
                    ✎
                  </button>
                  <button
                    className="delete-transaction"
                    onClick={() => handleDeleteBudget(budget.id)}
                    disabled={isSavingBudget}
                    aria-label={`Διαγραφή προϋπολογισμού ${budget.category}`}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="budget-amounts">
                <div>
                  <span>Δαπάνες</span>
                  <strong>{formatCurrency(budget.spentAmount)}</strong>
                </div>
                <div>
                  <span>Όριο</span>
                  <strong>{formatCurrency(budget.limitAmount)}</strong>
                </div>
              </div>

              <div className="budget-progress" aria-label="Πρόοδος προϋπολογισμού">
                <span
                  className={
                    budget.progressPercentage > 100 ? 'over-budget' : undefined
                  }
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, budget.progressPercentage),
                    )}%`,
                  }}
                />
              </div>

              <div className="budget-card-footer">
                <span>{Math.round(budget.progressPercentage)}% χρήση</span>
                <strong
                  className={
                    budget.remainingAmount >= 0 ? 'income-text' : 'negative'
                  }
                >
                  {formatCurrency(budget.remainingAmount)} υπόλοιπο
                </strong>
              </div>
            </article>
          ))}
      </section>
    </>
  )

  const settingsPage = (
    <section className="settings-grid">
      <article className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">ΠΡΟΤΙΜΗΣΕΙΣ</span>
            <h3>Ρυθμίσεις εμφάνισης</h3>
          </div>
        </div>

        <div className="settings-list">
          <div className="settings-row">
            <div>
              <strong>Θέμα εφαρμογής</strong>
              <span>
                Η επιλογή αποθηκεύεται σε αυτή τη συσκευή.
              </span>
            </div>
            <button className="secondary-button" onClick={toggleTheme}>
              {darkMode ? 'Σκούρο' : 'Λευκό'}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <strong>Γλώσσα</strong>
              <span>Η Ember είναι προσωρινά ρυθμισμένη στα Ελληνικά.</span>
            </div>
            <span className="settings-value">EL</span>
          </div>
        </div>
      </article>

      <article className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">ΛΟΓΑΡΙΑΣΜΟΣ</span>
            <h3>Το προφίλ σου</h3>
          </div>
        </div>

        <div className="settings-list">
          <div className="settings-row stacked">
            <span>Email</span>
            <strong>{currentUser.email}</strong>
          </div>

          <div className="settings-row stacked">
            <span>Πλάνο</span>
            <strong>{accountPlan}</strong>
          </div>

          <div className="settings-row stacked">
            <span>Υπόλοιπο δοκιμής</span>
            <strong>{currentUser.trialDaysRemaining} ημέρες</strong>
          </div>
        </div>
      </article>
    </section>
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
          <button
            className={
              activePage === 'Ρυθμίσεις' ? 'nav-item active' : 'nav-item'
            }
            onClick={() => setActivePage('Ρυθμίσεις')}
          >
            <span>⚙</span>
            Ρυθμίσεις
          </button>

          <button
            className="nav-item"
            onClick={handleLogout}
            disabled={isSavingTransaction}
          >
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
              onClick={toggleTheme}
              aria-label="Αλλαγή θέματος"
            >
              {darkMode ? '☀' : '☾'}
            </button>
          </div>
        </header>

        {activePage === 'Επισκόπηση'
          ? dashboard
          : activePage === 'Συναλλαγές'
            ? transactionsPage
            : activePage === 'Προϋπολογισμοί'
              ? budgetsPage
            : activePage === 'Ρυθμίσεις'
              ? settingsPage
              : (
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

      {showBudgetForm && (
        <div className="modal-backdrop" onMouseDown={closeBudgetForm}>
          <section
            className="transaction-modal budget-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-label">
                  {editingBudget ? 'ΕΠΕΞΕΡΓΑΣΙΑ' : 'ΝΕΑ ΚΑΤΑΧΩΡΗΣΗ'}
                </span>
                <h3 id="budget-form-title">
                  {editingBudget
                    ? 'Επεξεργασία προϋπολογισμού'
                    : 'Νέος προϋπολογισμός'}
                </h3>
              </div>

              <button
                className="more-button"
                type="button"
                onClick={closeBudgetForm}
                disabled={isSavingBudget}
                aria-label="Κλείσιμο φόρμας"
              >
                ×
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleSaveBudget}>
              <label htmlFor="budget-category">Κατηγορία</label>
              <input
                id="budget-category"
                value={newBudget.category}
                onChange={(event) =>
                  setNewBudget((form) => ({
                    ...form,
                    category: event.target.value,
                  }))
                }
                placeholder="π.χ. Λογισμικό"
                maxLength={80}
                disabled={isSavingBudget}
                required
              />

              <label htmlFor="budget-limit">Μηνιαίο όριο</label>
              <input
                id="budget-limit"
                type="number"
                min="0.01"
                step="0.01"
                value={newBudget.limitAmount}
                onChange={(event) =>
                  setNewBudget((form) => ({
                    ...form,
                    limitAmount: event.target.value,
                  }))
                }
                placeholder="0,00"
                disabled={isSavingBudget}
                required
              />

              <div className="budget-period-note">
                <span>Περίοδος</span>
                <strong>{currentMonthLabel}</strong>
              </div>

              {budgetError && (
                <p className="auth-error" role="alert">
                  {budgetError}
                </p>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeBudgetForm}
                  disabled={isSavingBudget}
                >
                  Ακύρωση
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSavingBudget}
                >
                  {isSavingBudget
                    ? 'Αποθήκευση...'
                    : editingBudget
                      ? 'Αποθήκευση αλλαγών'
                      : 'Αποθήκευση'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showTransactionForm && (
        <div
          className="modal-backdrop"
          onMouseDown={closeTransactionForm}
        >
          <section
            ref={transactionModalRef}
            className="transaction-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-form-title"
            aria-busy={isSavingTransaction}
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-label">
                  {editingTransaction ? 'ΕΠΕΞΕΡΓΑΣΙΑ' : 'ΝΕΑ ΚΑΤΑΧΩΡΗΣΗ'}
                </span>
                <h3 id="transaction-form-title">
                  {editingTransaction
                    ? 'Επεξεργασία συναλλαγής'
                    : 'Νέα συναλλαγή'}
                </h3>
              </div>

              <button
                className="more-button"
                type="button"
                onClick={closeTransactionForm}
                disabled={isSavingTransaction}
                aria-label="Κλείσιμο φόρμας"
              >
                ×
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleSaveTransaction}
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
                maxLength={160}
                disabled={isSavingTransaction}
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
                disabled={isSavingTransaction}
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
                disabled={isSavingTransaction}
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
                maxLength={80}
                disabled={isSavingTransaction}
              />

              {transactionError && (
                <p className="auth-error" role="alert">
                  {transactionError}
                </p>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeTransactionForm}
                  disabled={isSavingTransaction}
                >
                  Ακύρωση
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSavingTransaction}
                >
                  {isSavingTransaction
                    ? 'Αποθήκευση...'
                    : editingTransaction
                      ? 'Αποθήκευση αλλαγών'
                      : 'Αποθήκευση'}
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
