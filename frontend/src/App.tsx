import { useEffect, useRef, useState, type FormEvent } from 'react'
import AuthScreen from './components/AuthScreen'
import MeetingsPage from './components/MeetingsPage'
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
import {
  addGoalContribution,
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
  type BusinessGoal,
} from './services/goals'
import {
  getTeamMembers,
  inviteTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  type TeamMember,
  type TeamRole,
} from './services/team'
import './App.css'

const navigation = [
  { icon: '⌂', label: 'Επισκόπηση' },
  { icon: '↗', label: 'Συναλλαγές' },
  { icon: '◫', label: 'Προϋπολογισμοί' },
  { icon: '○', label: 'Αποταμίευση' },
  { icon: '♙', label: 'Ομάδα' },
  { icon: '□', label: 'Συναντήσεις' },
  { icon: '≡', label: 'Αναφορές' },
  { icon: '◇', label: 'Συνδρομή' },
]

type Language = 'el' | 'en'

const englishText: Record<string, string> = {
  Επισκόπηση: 'Overview',
  Συναλλαγές: 'Transactions',
  Προϋπολογισμοί: 'Budgets',
  Αποταμίευση: 'Savings',
  Ομάδα: 'Team',
  Συναντήσεις: 'Meetings',
  Αναφορές: 'Reports',
  Συνδρομή: 'Subscription',
  Ρυθμίσεις: 'Settings',
  Αποσύνδεση: 'Log out',
  'Χώρος εργασίας': 'Workspace',
  'ΣΥΝΟΛΙΚΗ ΚΑΘΑΡΗ ΡΟΗ': 'TOTAL NET FLOW',
  'καθαρή ροή τον τρέχοντα μήνα': 'net flow this month',
  Εξαγωγή: 'Export',
  '+ Νέα συναλλαγή': '+ New transaction',
  Έσοδα: 'Income',
  Έξοδα: 'Expenses',
  'Αυτόν τον μήνα': 'This month',
  'Καθαρή ροή': 'Net flow',
  Θετική: 'Positive',
  Αρνητική: 'Negative',
  'ΤΕΛΕΥΤΑΙΟΙ 6 ΜΗΝΕΣ': 'LAST 6 MONTHS',
  'Ταμειακή ροή': 'Cash flow',
  Προϋπολογισμός: 'Budget',
  'Δωρεάν δοκιμή': 'Free trial',
  ημέρες: 'days',
  ΔΡΑΣΤΗΡΙΟΤΗΤΑ: 'ACTIVITY',
  'Πρόσφατες συναλλαγές': 'Recent transactions',
  'Προβολή όλων →': 'View all →',
  'Φόρτωση συναλλαγών...': 'Loading transactions...',
  'Δεν υπάρχουν ακόμη συναλλαγές.': 'No transactions yet.',
  'ΟΛΕΣ ΟΙ ΚΑΤΑΧΩΡΗΣΕΙΣ': 'ALL ENTRIES',
  'Αναζήτηση περιγραφής ή κατηγορίας...': 'Search description or category...',
  'Όλες': 'All',
  'Εμφανίζονται': 'Showing',
  'Σύνολο εσόδων': 'Total income',
  'Σύνολο εξόδων': 'Total expenses',
  'Δεν βρέθηκαν συναλλαγές με αυτά τα φίλτρα.': 'No transactions match these filters.',
  'ΠΡΟΫΠΟΛΟΓΙΣΜΟΙ': 'BUDGETS',
  'Υπόλοιπο από όριο ': 'Remaining from a limit of ',
  ' και έξοδα ': ' and expenses ',
  '+ Νέος προϋπολογισμός': '+ New budget',
  'Συνολικό όριο': 'Total limit',
  κατηγορίες: 'categories',
  'Έχουν δαπανηθεί': 'Spent',
  χρήση: 'used',
  Υπόλοιπο: 'Remaining',
  'Εντός ορίου': 'Within limit',
  'Πάνω από το όριο': 'Over limit',
  'Φόρτωση προϋπολογισμών...': 'Loading budgets...',
  'Δεν υπάρχουν προϋπολογισμοί': 'No budgets yet',
  'Δημιούργησε το πρώτο όριο για μια κατηγορία εξόδων.': 'Create your first limit for an expense category.',
  '+ Δημιουργία προϋπολογισμού': '+ Create budget',
  ΚΑΤΗΓΟΡΙΑ: 'CATEGORY',
  Δαπάνες: 'Spent',
  Όριο: 'Limit',
  'ΠΡΟΤΙΜΗΣΕΙΣ': 'PREFERENCES',
  'Ρυθμίσεις εμφάνισης': 'Appearance settings',
  'Θέμα εφαρμογής': 'App theme',
  'Η επιλογή αποθηκεύεται σε αυτή τη συσκευή.': 'This choice is saved on this device.',
  Σκούρο: 'Dark',
  Λευκό: 'Light',
  Γλώσσα: 'Language',
  'Η Ember είναι προσωρινά ρυθμισμένη στα Ελληνικά.': 'Choose the language for the Ember interface.',
  ΛΟΓΑΡΙΑΣΜΟΣ: 'ACCOUNT',
  'Το προφίλ σου': 'Your profile',
  Πλάνο: 'Plan',
  'Υπόλοιπο δοκιμής': 'Trial remaining',
  'Η δωρεάν δοκιμή ολοκληρώθηκε': 'Your free trial has ended',
  'Επιστροφή στην επισκόπηση': 'Back to overview',
  'Η ενότητα θα συνδεθεί με τα πραγματικά δεδομένα της Ember.': 'This section will be connected to Ember data.',
  'ΕΠΕΞΕΡΓΑΣΙΑ': 'EDIT',
  'ΝΕΑ ΚΑΤΑΧΩΡΗΣΗ': 'NEW ENTRY',
  'Επεξεργασία προϋπολογισμού': 'Edit budget',
  'Νέος προϋπολογισμός': 'New budget',
  Κατηγορία: 'Category',
  'Μηνιαίο όριο': 'Monthly limit',
  Περίοδος: 'Period',
  Ακύρωση: 'Cancel',
  'Αποθήκευση...': 'Saving...',
  'Αποθήκευση αλλαγών': 'Save changes',
  Αποθήκευση: 'Save',
  'Επεξεργασία συναλλαγής': 'Edit transaction',
  'Νέα συναλλαγή': 'New transaction',
  Επεξεργασία: 'Edit',
  'Διαγραφή συναλλαγής': 'Delete transaction',
  υπόλοιπο: 'remaining',
  'Πρόοδος προϋπολογισμού': 'Budget progress',
  'ΑΝΑΛΥΣΗ': 'ANALYTICS',
  'Ανάλυση εξόδων': 'Expense analysis',
  'Έξοδα ανά κατηγορία': 'Expenses by category',
  'Αυτός ο μήνας': 'This month',
  'Τελευταίο τρίμηνο': 'Last quarter',
  'Αυτό το έτος': 'This year',
  'Όλο το ιστορικό': 'All history',
  'Εξαγωγή CSV': 'Export CSV',
  'Δεν υπάρχουν έξοδα για ανάλυση.': 'There are no expenses to analyze yet.',
  'Συνολικές συναλλαγές': 'Total transactions',
  'Μέσο έξοδο': 'Average expense',
  'Μεγαλύτερη κατηγορία': 'Top category',
  'Καμία κατηγορία': 'No category',
  'ΣΤΟΧΟΙ ΕΠΙΧΕΙΡΗΣΗΣ': 'BUSINESS GOALS',
  'Στόχοι επιχείρησης': 'Business goals',
  'Δημιούργησε στόχους που οδηγούν την επιχείρησή σου μπροστά.': 'Create goals that move your business forward.',
  '+ Νέος στόχος': '+ New goal',
  'Δεν υπάρχουν ακόμη στόχοι.': 'No goals yet.',
  'Δημιούργησε τον πρώτο επιχειρηματικό σου στόχο.': 'Create your first business goal.',
  '+ Δημιουργία στόχου': '+ Create goal',
  'Ενεργοί στόχοι': 'Active goals',
  'Ολοκληρωμένοι': 'Completed',
  'Συνολικό κεφάλαιο στόχων': 'Total goal capital',
  'Πρόοδος': 'Progress',
  'Προσθήκη ποσού': 'Add contribution',
  'Επεξεργασία στόχου': 'Edit goal',
  'Διαγραφή στόχου': 'Delete goal',
  'Ολοκληρώθηκε': 'Completed',
  'Προθεσμία': 'Deadline',
  'Χωρίς προθεσμία': 'No deadline',
  'Νέος στόχος': 'New goal',
  'Όνομα στόχου': 'Goal name',
  'Τύπος στόχου': 'Goal type',
  'Ποσό-στόχος': 'Target amount',
  'Τρέχουσα πρόοδος': 'Current progress',
  'Σημειώσεις': 'Notes',
  'π.χ. Ταμειακό απόθεμα 3 μηνών': 'e.g. Three-month cash reserve',
  'π.χ. Κεφάλαιο για νέο εξοπλισμό': 'e.g. Capital for new equipment',
  'Επιλογή επιχειρηματικού στόχου': 'Choose a business goal',
  'Custom': 'Custom',
  'Φορολογία / ΦΠΑ': 'Tax / VAT reserve',
  'Ταμειακό απόθεμα': 'Cash reserve',
  'Εξοπλισμός': 'Equipment',
  'Marketing': 'Marketing',
  'Μισθοδοσία': 'Payroll',
  'Επέκταση επιχείρησης': 'Business expansion',
  'ΟΜΑΔΑ': 'TEAM',
  'Η ομάδα σου': 'Your team',
  'Διαχειρίσου τους συνεργάτες και τους ρόλους του workspace.': 'Manage workspace collaborators and roles.',
  '+ Πρόσκληση μέλους': '+ Invite member',
  'Ενεργά μέλη': 'Active members',
  'Εκκρεμείς προσκλήσεις': 'Pending invites',
  'Διαχειριστές': 'Admins',
  'Δεν υπάρχουν ακόμη μέλη.': 'No team members yet.',
  'Πρόσθεσε τον πρώτο συνεργάτη στο workspace.': 'Add the first collaborator to your workspace.',
  '+ Πρόσκληση συνεργάτη': '+ Invite collaborator',
  Owner: 'Owner',
  Admin: 'Admin',
  Member: 'Member',
  Active: 'Active',
  Pending: 'Pending',
  'Πρόσκληση μέλους': 'Invite team member',
  'Email συνεργάτη': 'Collaborator email',
  'Όνομα συνεργάτη': 'Collaborator name',
  Ρόλος: 'Role',
  'π.χ. maria@company.gr': 'e.g. maria@company.com',
  'Η πρόσκληση θα εμφανιστεί ως εκκρεμής μέχρι να συνδεθεί ο συνεργάτης.': 'The invitation stays pending until the collaborator signs in.',
  'Αφαίρεση μέλους': 'Remove member',
  'ΠΛΑΝΟ EMBER': 'EMBER PLAN',
  'Η πρόσβασή σου': 'Your access',
  'Διαχειρίσου το πλάνο και την πρόσβαση της επιχείρησής σου.': 'Manage your business plan and access.',
  'Τρέχον πλάνο': 'Current plan',
  'Η δοκιμή σου λήγει σε': 'Your trial ends in',
  'Επιλογή πλάνου': 'Choose plan',
  'Για επαγγελματίες': 'For professionals',
  'Για μικρές ομάδες': 'For small teams',
  'Για αναπτυσσόμενες επιχειρήσεις': 'For growing businesses',
  'Βασικά οικονομικά εργαλεία': 'Core finance tools',
  'Συναλλαγές και προϋπολογισμοί': 'Transactions and budgets',
  'Ομάδα και ρόλοι': 'Team and roles',
  'Αναφορές και export': 'Reports and export',
  'Όλα του Team': 'Everything in Team',
  'Προηγμένα permissions': 'Advanced permissions',
  'Σύντομα διαθέσιμο': 'Available soon',
  'Η πληρωμή θα συνδεθεί με ασφαλές checkout.': 'Secure checkout will be connected here.',
  'Επικοινωνία για αναβάθμιση': 'Contact for upgrade',
  'Αναζήτηση συναλλαγών': 'Search transactions',
  'Φίλτρο τύπου συναλλαγής': 'Filter transaction type',
  'Περιγραφή': 'Description',
  Ποσό: 'Amount',
  Τύπος: 'Type',
  'Κλείσιμο φόρμας': 'Close form',
  Εντάξει: 'Okay',
  'Έσοδο': 'Income',
  'Έξοδο': 'Expense',
  'Φόρτωση Ember...': 'Loading Ember...',
}

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

function escapeCsvValue(value: string | number | boolean) {
  return `"${String(value).replace(/"/g, '""')}"`
}

function exportTransactions(transactions: Transaction[]) {
  const headers = [
    'Περιγραφή',
    'Ποσό',
    'Τύπος',
    'Κατηγορία',
    'Ημερομηνία',
    'Νόμισμα',
    'Επαναλαμβανόμενη',
  ]

  const rows = transactions.map((transaction) => [
    transaction.description,
    transaction.amount.toFixed(2),
    transaction.type === 1 ? 'Έσοδο' : 'Έξοδο',
    transaction.category,
    new Date(transaction.occurredAtUtc).toLocaleDateString('el-GR'),
    transaction.currency,
    transaction.isRecurring ? 'Ναι' : 'Όχι',
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(';'))
    .join('\r\n')

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `ember-transactions-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getLastSixMonths(transactions: Transaction[]) {
  const now = new Date()

  return Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1),
    )
    const nextMonth = new Date(
      Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1),
    )

    const monthTransactions = transactions.filter((transaction) => {
      const occurredAt = new Date(transaction.occurredAtUtc)
      return occurredAt >= monthDate && occurredAt < nextMonth
    })

    return {
      month: new Intl.DateTimeFormat('el-GR', {
        month: 'short',
        timeZone: 'UTC',
      }).format(monthDate),
      income: monthTransactions
        .filter((transaction) => transaction.type === 1)
        .reduce((total, transaction) => total + transaction.amount, 0),
      expense: monthTransactions
        .filter((transaction) => transaction.type === 2)
        .reduce((total, transaction) => total + transaction.amount, 0),
    }
  })
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

function createEmptyGoal() {
  return {
    name: '',
    goalType: 'Custom',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
    notes: '',
  }
}

function createEmptyTeamMember() {
  return {
    email: '',
    name: '',
    role: 'Member' as TeamRole,
  }
}

const goalTypeLabels: Record<string, { el: string; en: string }> = {
  Custom: { el: 'Custom', en: 'Custom' },
  'Tax / VAT': { el: 'Φορολογία / ΦΠΑ', en: 'Tax / VAT' },
  'Cash reserve': { el: 'Ταμειακό απόθεμα', en: 'Cash reserve' },
  Equipment: { el: 'Εξοπλισμός', en: 'Equipment' },
  Marketing: { el: 'Marketing', en: 'Marketing' },
  Payroll: { el: 'Μισθοδοσία', en: 'Payroll' },
  'Business expansion': {
    el: 'Επέκταση επιχείρησης',
    en: 'Business expansion',
  },
}

type AccessUser = AuthUser & {
  hasActiveAccess?: boolean
}

function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState<Language>('el')
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
  const [goals, setGoals] = useState<BusinessGoal[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalError, setGoalError] = useState('')
  const [newGoal, setNewGoal] = useState(createEmptyGoal())
  const [editingGoal, setEditingGoal] = useState<BusinessGoal | null>(null)
  const [contributionGoal, setContributionGoal] =
    useState<BusinessGoal | null>(null)
  const [contributionAmount, setContributionAmount] = useState('')
  const [isSavingGoal, setIsSavingGoal] = useState(false)
  const goalSaveInProgress = useRef(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoadingTeam, setIsLoadingTeam] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamError, setTeamError] = useState('')
  const [newTeamMember, setNewTeamMember] = useState(createEmptyTeamMember())
  const [isSavingTeam, setIsSavingTeam] = useState(false)
  const teamSaveInProgress = useRef(false)
  const [subscriptionMessage, setSubscriptionMessage] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('month')

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setCheckingSession(false))
  }, [])

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('ember-theme')
    const savedLanguage = window.localStorage.getItem('ember-language')

    if (savedTheme === 'light') {
      setDarkMode(false)
    }

    if (savedLanguage === 'en') {
      setLanguage('en')
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
    if (!currentUser) {
      setGoals([])
      return
    }

    setIsLoadingGoals(true)

    getGoals()
      .then(setGoals)
      .catch(() => setGoals([]))
      .finally(() => setIsLoadingGoals(false))
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) {
      setTeamMembers([])
      return
    }

    setIsLoadingTeam(true)

    getTeamMembers()
      .then(setTeamMembers)
      .catch(() => setTeamMembers([]))
      .finally(() => setIsLoadingTeam(false))
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

  function toggleLanguage() {
    setLanguage((current) => {
      const next = current === 'el' ? 'en' : 'el'
      window.localStorage.setItem('ember-language', next)
      return next
    })
  }

  function t(value: string) {
    return language === 'en' ? englishText[value] ?? value : value
  }

  function formatGoalType(value: string) {
    return goalTypeLabels[value]?.[language] ?? value
  }

  function handlePlanSelection(planName: string) {
    setSelectedPlan(planName)
    setSubscriptionMessage(
      language === 'en'
        ? `${planName} will be connected to secure checkout in the next release.`
        : `Το ${planName} θα συνδεθεί με ασφαλές checkout στο επόμενο release.`,
    )
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

  function openCreateGoalForm() {
    if (goalSaveInProgress.current) return

    setEditingGoal(null)
    setNewGoal(createEmptyGoal())
    setGoalError('')
    setShowGoalForm(true)
  }

  function openEditGoalForm(goal: BusinessGoal) {
    if (goalSaveInProgress.current) return

    setEditingGoal(goal)
    setNewGoal({
      name: goal.name,
      goalType: goal.goalType,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      deadline: goal.deadlineUtc ? goal.deadlineUtc.slice(0, 10) : '',
      notes: goal.notes ?? '',
    })
    setGoalError('')
    setShowGoalForm(true)
  }

  function closeGoalForm() {
    if (goalSaveInProgress.current) return

    setShowGoalForm(false)
    setEditingGoal(null)
    setNewGoal(createEmptyGoal())
    setGoalError('')
  }

  async function handleSaveGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (goalSaveInProgress.current) return

    setGoalError('')

    const targetAmount = Number(newGoal.targetAmount.replace(',', '.'))
    const currentAmount = Number(newGoal.currentAmount.replace(',', '.'))

    if (!newGoal.name.trim()) {
      setGoalError(language === 'en' ? 'Enter a goal name.' : 'Γράψε ένα όνομα στόχου.')
      return
    }

    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setGoalError(
        language === 'en'
          ? 'The target must be greater than zero.'
          : 'Ο στόχος πρέπει να είναι μεγαλύτερος από μηδέν.',
      )
      return
    }

    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      setGoalError(
        language === 'en'
          ? 'Progress cannot be negative.'
          : 'Η πρόοδος δεν μπορεί να είναι αρνητική.',
      )
      return
    }

    goalSaveInProgress.current = true
    setIsSavingGoal(true)

    try {
      const input = {
        name: newGoal.name.trim(),
        goalType: newGoal.goalType,
        targetAmount,
        currentAmount,
        deadlineUtc: newGoal.deadline
          ? new Date(`${newGoal.deadline}T23:59:59`).toISOString()
          : undefined,
        notes: newGoal.notes.trim() || undefined,
      }

      if (editingGoal) {
        const goal = await updateGoal(editingGoal.id, input)
        setGoals((items) =>
          items.map((item) => (item.id === goal.id ? goal : item)),
        )
      } else {
        const goal = await createGoal(input)
        setGoals((items) => [goal, ...items])
      }

      goalSaveInProgress.current = false
      closeGoalForm()
    } catch (error) {
      setGoalError(
        error instanceof Error
          ? error.message
          : language === 'en'
            ? 'The goal could not be saved.'
            : 'Δεν ήταν δυνατή η αποθήκευση του στόχου.',
      )
    } finally {
      goalSaveInProgress.current = false
      setIsSavingGoal(false)
    }
  }

  async function handleDeleteGoal(id: string) {
    await deleteGoal(id)
    setGoals((items) => items.filter((item) => item.id !== id))
  }

  function openContributionForm(goal: BusinessGoal) {
    setContributionGoal(goal)
    setContributionAmount('')
    setGoalError('')
  }

  function closeContributionForm() {
    if (goalSaveInProgress.current) return

    setContributionGoal(null)
    setContributionAmount('')
    setGoalError('')
  }

  async function handleAddContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (goalSaveInProgress.current || !contributionGoal) return

    const amount = Number(contributionAmount.replace(',', '.'))

    if (!Number.isFinite(amount) || amount <= 0) {
      setGoalError(
        language === 'en'
          ? 'The contribution must be greater than zero.'
          : 'Το ποσό πρέπει να είναι μεγαλύτερο από μηδέν.',
      )
      return
    }

    goalSaveInProgress.current = true
    setIsSavingGoal(true)

    try {
      const goal = await addGoalContribution(contributionGoal.id, amount)
      setGoals((items) =>
        items.map((item) => (item.id === goal.id ? goal : item)),
      )
      goalSaveInProgress.current = false
      closeContributionForm()
    } catch (error) {
      setGoalError(
        error instanceof Error
          ? error.message
          : language === 'en'
            ? 'The contribution could not be saved.'
            : 'Δεν ήταν δυνατή η αποθήκευση του ποσού.',
      )
    } finally {
      goalSaveInProgress.current = false
      setIsSavingGoal(false)
    }
  }

  function openTeamForm() {
    if (teamSaveInProgress.current) return

    setNewTeamMember(createEmptyTeamMember())
    setTeamError('')
    setShowTeamForm(true)
  }

  function closeTeamForm() {
    if (teamSaveInProgress.current) return

    setShowTeamForm(false)
    setNewTeamMember(createEmptyTeamMember())
    setTeamError('')
  }

  async function handleInviteTeamMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (teamSaveInProgress.current) return

    setTeamError('')

    if (!newTeamMember.email.trim()) {
      setTeamError(language === 'en' ? 'Enter an email address.' : 'Γράψε ένα email.')
      return
    }

    teamSaveInProgress.current = true
    setIsSavingTeam(true)

    try {
      const member = await inviteTeamMember({
        email: newTeamMember.email.trim(),
        name: newTeamMember.name.trim() || undefined,
        role: newTeamMember.role,
      })

      setTeamMembers((items) => [member, ...items])
      teamSaveInProgress.current = false
      closeTeamForm()
    } catch (error) {
      setTeamError(
        error instanceof Error
          ? error.message
          : language === 'en'
            ? 'The invitation could not be saved.'
            : 'Δεν ήταν δυνατή η αποθήκευση της πρόσκλησης.',
      )
    } finally {
      teamSaveInProgress.current = false
      setIsSavingTeam(false)
    }
  }

  async function handleTeamRoleChange(id: string, role: TeamRole) {
    if (teamSaveInProgress.current) return

    teamSaveInProgress.current = true
    setIsSavingTeam(true)

    try {
      const member = await updateTeamMemberRole(id, role)
      setTeamMembers((items) =>
        items.map((item) => (item.id === member.id ? member : item)),
      )
    } catch (error) {
      setTeamError(
        error instanceof Error
          ? error.message
          : language === 'en'
            ? 'The role could not be updated.'
            : 'Δεν ήταν δυνατή η αλλαγή ρόλου.',
      )
    } finally {
      teamSaveInProgress.current = false
      setIsSavingTeam(false)
    }
  }

  async function handleRemoveTeamMember(id: string) {
    if (teamSaveInProgress.current) return

    teamSaveInProgress.current = true
    setIsSavingTeam(true)

    try {
      await removeTeamMember(id)
      setTeamMembers((items) => items.filter((item) => item.id !== id))
    } catch (error) {
      setTeamError(
        error instanceof Error
          ? error.message
          : language === 'en'
            ? 'The member could not be removed.'
            : 'Δεν ήταν δυνατή η αφαίρεση του μέλους.',
      )
    } finally {
      teamSaveInProgress.current = false
      setIsSavingTeam(false)
    }
  }

  if (checkingSession) {
    return <div className="session-loading">{t('Φόρτωση Ember...')}</div>
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
          <h1>{t('Η δωρεάν δοκιμή ολοκληρώθηκε')}</h1>
          <p>
            {language === 'en'
              ? 'Your 14-day trial has ended. Choose a plan to continue using transactions and the dashboard.'
              : 'Οι 14 ημέρες δοκιμής σου τελείωσαν. Επίλεξε ένα πακέτο για να συνεχίσεις να χρησιμοποιείς τις συναλλαγές και το dashboard.'}
          </p>
          <button className="secondary-button" onClick={handleLogout}>
            {t('Αποσύνδεση')}
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

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const currentMonthTransactions = transactions.filter((transaction) => {
    const occurredAt = new Date(transaction.occurredAtUtc)
    return occurredAt >= currentMonthStart && occurredAt < nextMonthStart
  })
  const currentMonthIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === 1)
    .reduce((total, transaction) => total + transaction.amount, 0)
  const currentMonthExpense = currentMonthTransactions
    .filter((transaction) => transaction.type === 2)
    .reduce((total, transaction) => total + transaction.amount, 0)
  const currentMonthNet = currentMonthIncome - currentMonthExpense
  const cashFlow = getLastSixMonths(transactions)
  const maxCashFlow = Math.max(
    1,
    ...cashFlow.flatMap((item) => [item.income, item.expense]),
  )

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
  const currentMonthLabel = new Intl.DateTimeFormat(
    language === 'en' ? 'en-US' : 'el-GR',
    {
    month: 'long',
    year: 'numeric',
    },
  ).format(new Date())

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

  const reportPeriodStart = (() => {
    if (reportPeriod === 'all') return null
    const start = new Date(now)
    if (reportPeriod === 'month') start.setDate(1)
    if (reportPeriod === 'quarter') start.setMonth(start.getMonth() - 2, 1)
    if (reportPeriod === 'year') start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
    return start
  })()
  const reportTransactions = transactions.filter((transaction) => {
    if (!reportPeriodStart) return true
    return new Date(transaction.occurredAtUtc) >= reportPeriodStart
  })
  const reportExpense = reportTransactions.filter((transaction) => transaction.type === 2).reduce((sum, transaction) => sum + transaction.amount, 0)

  function exportReport() {
    const header = ['Ημερομηνία', 'Περιγραφή', 'Τύπος', 'Κατηγορία', 'Ποσό', 'Νόμισμα']
    const rows = reportTransactions.map((transaction) => [
      new Date(transaction.occurredAtUtc).toLocaleDateString('el-GR'),
      transaction.description, transaction.type === 1 ? 'Έσοδο' : 'Έξοδο',
      transaction.category, transaction.amount.toFixed(2), transaction.currency,
    ])
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\r\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = `ember-report-${reportPeriod}.csv`; link.click(); URL.revokeObjectURL(url)
  }

  const expenseByCategory = reportTransactions
    .filter((transaction) => transaction.type === 2)
    .reduce<Record<string, number>>((totals, transaction) => {
      const category = transaction.category || 'Άλλο'
      totals[category] = (totals[category] ?? 0) + transaction.amount
      return totals
    }, {})

  const reportCategories = Object.entries(expenseByCategory).sort(
    ([, firstAmount], [, secondAmount]) => secondAmount - firstAmount,
  )
  const largestCategory = reportCategories[0]
  const averageExpense = reportExpense / Math.max(1, reportTransactions.filter((transaction) => transaction.type === 2).length)
  const maxCategoryAmount = Math.max(
    1,
    ...reportCategories.map(([, amount]) => amount),
  )

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
              aria-label={`${t('Επεξεργασία συναλλαγής')}: ${transaction.description}`}
            >
              {t('Επεξεργασία')}
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
          aria-label={`${t('Διαγραφή συναλλαγής')}: ${transaction.description}`}
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
          <span className="section-label">{t('ΣΥΝΟΛΙΚΗ ΚΑΘΑΡΗ ΡΟΗ')}</span>
          <h2>{formatCurrency(netCashFlow)}</h2>
          <p>
            <strong>
              {currentMonthNet >= 0 ? '+' : ''}
              {formatCurrency(currentMonthNet)}
            </strong>{' '}
            {t('καθαρή ροή τον τρέχοντα μήνα')}
          </p>
        </div>

        <div className="balance-actions">
          <button
            className="secondary-button"
            onClick={() => exportTransactions(transactions)}
            disabled={transactions.length === 0}
          >
            {t('Εξαγωγή')}
          </button>
          <button
            className="primary-button"
            onClick={openCreateTransactionForm}
            disabled={isSavingTransaction}
          >
            {t('+ Νέα συναλλαγή')}
          </button>
        </div>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>{t('Έσοδα')}</span>
          <strong>{formatCurrency(currentMonthIncome)}</strong>
          <small className="up">{t('Αυτόν τον μήνα')}</small>
        </div>

        <div className="metric">
          <span>{t('Έξοδα')}</span>
          <strong>{formatCurrency(currentMonthExpense)}</strong>
          <small>{t('Αυτόν τον μήνα')}</small>
        </div>

        <div className="metric">
          <span>{t('Καθαρή ροή')}</span>
          <strong>{formatCurrency(currentMonthNet)}</strong>
          <small className={currentMonthNet >= 0 ? 'up' : 'negative'}>
            {t(currentMonthNet >= 0 ? 'Θετική' : 'Αρνητική')}
          </small>
        </div>
      </section>

      <section className="content-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">{t('ΤΕΛΕΥΤΑΙΟΙ 6 ΜΗΝΕΣ')}</span>
              <h3>{t('Ταμειακή ροή')}</h3>
            </div>

            <div className="legend">
              <span>
                <i className="income-dot" />
                {t('Έσοδα')}
              </span>
              <span>
                <i className="expense-dot" />
                {t('Έξοδα')}
              </span>
            </div>
          </div>

          <div className="chart">
            {cashFlow.map((item) => (
              <div className="chart-column" key={item.month}>
                <div className="bars">
                  <span
                    className="income-bar"
                    style={{ height: `${(item.income / maxCashFlow) * 100}%` }}
                  />
                  <span
                    className="expense-bar"
                    style={{ height: `${(item.expense / maxCashFlow) * 100}%` }}
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
              <span className="section-label">
                {currentMonthLabel.toUpperCase()}
              </span>
              <h3>{t('Αυτόν τον μήνα')}</h3>
            </div>
            <button className="more-button">•••</button>
          </div>

          <div className="month-list">
            <div>
              <span>{t('Προϋπολογισμός')}</span>
              <strong>{budgetUsagePercentage}%</strong>
            </div>

            <div className="progress">
              <span
                style={{
                  width: `${Math.min(100, Math.max(0, budgetUsagePercentage))}%`,
                }}
              />
            </div>

            <div className="month-row">
              <span>{t('Έσοδα')}</span>
              <strong>{formatCurrency(currentMonthIncome)}</strong>
            </div>

            <div className="month-row">
              <span>{t('Έξοδα')}</span>
              <strong>{formatCurrency(currentMonthExpense)}</strong>
            </div>

            <div className="month-row">
              <span>{t('Δωρεάν δοκιμή')}</span>
              <strong>{currentUser.trialDaysRemaining} {t('ημέρες')}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="panel transactions-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">{t('ΔΡΑΣΤΗΡΙΟΤΗΤΑ')}</span>
            <h3>{t('Πρόσφατες συναλλαγές')}</h3>
          </div>

          <button
            className="text-button"
            onClick={() => setActivePage('Συναλλαγές')}
          >
            {t('Προβολή όλων →')}
          </button>
        </div>

        <div className="transaction-list">
          {isLoadingTransactions && (
            <p className="transactions-empty">{t('Φόρτωση συναλλαγών...')}</p>
          )}

          {!isLoadingTransactions && transactions.length === 0 && (
            <p className="transactions-empty">
              {t('Δεν υπάρχουν ακόμη συναλλαγές.')}
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
          <span className="section-label">{t('ΟΛΕΣ ΟΙ ΚΑΤΑΧΩΡΗΣΕΙΣ')}</span>
          <h3>{t('Συναλλαγές')}</h3>
        </div>

        <button
          className="primary-button"
          onClick={openCreateTransactionForm}
          disabled={isSavingTransaction}
        >
          {t('+ Νέα συναλλαγή')}
        </button>
      </div>

      <div className="transactions-toolbar">
        <input
          className="transaction-search"
          value={transactionSearch}
          onChange={(event) => setTransactionSearch(event.target.value)}
          placeholder={t('Αναζήτηση περιγραφής ή κατηγορίας...')}
          aria-label={t('Αναζήτηση συναλλαγών')}
        />

        <select
          className="transaction-filter"
          value={transactionFilter}
          onChange={(event) =>
            setTransactionFilter(event.target.value as TransactionFilter)
          }
          aria-label={t('Φίλτρο τύπου συναλλαγής')}
        >
          <option value="all">{t('Όλες')}</option>
          <option value="income">{t('Έσοδα')}</option>
          <option value="expense">{t('Έξοδα')}</option>
        </select>
      </div>

      <div className="transaction-summary">
        <div className="transaction-summary-card">
          <span>{t('Εμφανίζονται')}</span>
          <strong>{filteredTransactions.length}</strong>
        </div>
        <div className="transaction-summary-card">
          <span>{t('Σύνολο εσόδων')}</span>
          <strong className="income-text">{formatCurrency(totalIncome)}</strong>
        </div>
        <div className="transaction-summary-card">
          <span>{t('Σύνολο εξόδων')}</span>
          <strong>{formatCurrency(totalExpense)}</strong>
        </div>
      </div>

      <div className="transaction-list full-transaction-list">
        {isLoadingTransactions && (
          <p className="transactions-empty">{t('Φόρτωση συναλλαγών...')}</p>
        )}

        {!isLoadingTransactions && filteredTransactions.length === 0 && (
          <p className="transactions-empty">
            {transactions.length === 0
              ? t('Δεν υπάρχουν ακόμη συναλλαγές.')
              : t('Δεν βρέθηκαν συναλλαγές με αυτά τα φίλτρα.')}
          </p>
        )}

        {!isLoadingTransactions &&
          filteredTransactions.map(renderTransactionRow)}
      </div>
    </section>
  )

  const reportsPage = (
    <>
      <section className="balance-section reports-header">
        <div>
          <span className="section-label">{t('ΑΝΑΛΥΣΗ')}</span>
          <h2>{t('Ανάλυση εξόδων')}</h2>
          <p>{t('Έξοδα ανά κατηγορία')}</p>
        </div>
        <div className="report-actions">
          <select className="report-period-select" value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value as typeof reportPeriod)}>
            <option value="month">{t('Αυτός ο μήνας')}</option>
            <option value="quarter">{t('Τελευταίο τρίμηνο')}</option>
            <option value="year">{t('Αυτό το έτος')}</option>
            <option value="all">{t('Όλο το ιστορικό')}</option>
          </select>
          <button className="secondary-button" type="button" onClick={exportReport}>{t('Εξαγωγή CSV')}</button>
        </div>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>{t('Συνολικές συναλλαγές')}</span>
          <strong>{reportTransactions.length}</strong>
          <small>{t('Αυτόν τον μήνα')}</small>
        </div>
        <div className="metric">
          <span>{t('Μέσο έξοδο')}</span>
          <strong>{formatCurrency(averageExpense)}</strong>
          <small>{t('Έξοδα')}</small>
        </div>
        <div className="metric">
          <span>{t('Μεγαλύτερη κατηγορία')}</span>
          <strong>{largestCategory?.[0] ?? t('Καμία κατηγορία')}</strong>
          <small>{largestCategory ? formatCurrency(largestCategory[1]) : '—'}</small>
        </div>
      </section>

      <section className="panel report-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">{t('ΑΝΑΛΥΣΗ')}</span>
            <h3>{t('Έξοδα ανά κατηγορία')}</h3>
          </div>
          <strong className="report-total">{formatCurrency(reportExpense)}</strong>
        </div>

        {reportCategories.length === 0 ? (
          <p className="transactions-empty">{t('Δεν υπάρχουν έξοδα για ανάλυση.')}</p>
        ) : (
          <div className="category-report-list">
            {reportCategories.map(([category, amount]) => (
              <div className="category-report-row" key={category}>
                <div className="category-report-heading">
                  <strong>{category}</strong>
                  <span>{formatCurrency(amount)}</span>
                </div>
                <div className="category-report-track">
                  <span
                    style={{ width: `${(amount / maxCategoryAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )

  const completedGoals = goals.filter((goal) => goal.isCompleted).length
  const totalGoalCapital = goals.reduce(
    (total, goal) => total + goal.currentAmount,
    0,
  )

  const goalsPage = (
    <>
      <section className="balance-section goals-header">
        <div>
          <span className="section-label">{t('ΣΤΟΧΟΙ ΕΠΙΧΕΙΡΗΣΗΣ')}</span>
          <h2>{t('Στόχοι επιχείρησης')}</h2>
          <p>{t('Δημιούργησε στόχους που οδηγούν την επιχείρησή σου μπροστά.')}</p>
        </div>

        <button
          className="primary-button"
          onClick={openCreateGoalForm}
          disabled={isSavingGoal}
        >
          {t('+ Νέος στόχος')}
        </button>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>{t('Ενεργοί στόχοι')}</span>
          <strong>{goals.length - completedGoals}</strong>
          <small>{t('Στόχοι επιχείρησης')}</small>
        </div>
        <div className="metric">
          <span>{t('Ολοκληρωμένοι')}</span>
          <strong>{completedGoals}</strong>
          <small>{t('Ολοκληρώθηκε')}</small>
        </div>
        <div className="metric">
          <span>{t('Συνολικό κεφάλαιο στόχων')}</span>
          <strong>{formatCurrency(totalGoalCapital)}</strong>
          <small>{t('Τρέχουσα πρόοδος')}</small>
        </div>
      </section>

      {isLoadingGoals && (
        <p className="transactions-empty">{language === 'en' ? 'Loading goals...' : 'Φόρτωση στόχων...'}</p>
      )}

      {!isLoadingGoals && goals.length === 0 && (
        <div className="panel budget-empty">
          <span>◎</span>
          <h3>{t('Δεν υπάρχουν ακόμη στόχοι.')}</h3>
          <p>{t('Δημιούργησε τον πρώτο επιχειρηματικό σου στόχο.')}</p>
          <button className="primary-button" onClick={openCreateGoalForm}>
            {t('+ Δημιουργία στόχου')}
          </button>
        </div>
      )}

      {!isLoadingGoals && goals.length > 0 && (
        <section className="goal-grid">
          {goals.map((goal) => (
            <article className="panel goal-card" key={goal.id}>
              <div className="goal-card-heading">
                <div>
                  <span className="section-label">{formatGoalType(goal.goalType)}</span>
                  <h3>{goal.name}</h3>
                </div>
                <div className="budget-card-actions">
                  <button
                    className="more-button"
                    onClick={() => openEditGoalForm(goal)}
                    disabled={isSavingGoal}
                    aria-label={`${t('Επεξεργασία στόχου')}: ${goal.name}`}
                  >
                    ✎
                  </button>
                  <button
                    className="delete-transaction"
                    onClick={() => handleDeleteGoal(goal.id)}
                    disabled={isSavingGoal}
                    aria-label={`${t('Διαγραφή στόχου')}: ${goal.name}`}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="goal-card-amounts">
                <div>
                  <span>{t('Πρόοδος')}</span>
                  <strong>{formatCurrency(goal.currentAmount)}</strong>
                </div>
                <div>
                  <span>{t('Ποσό-στόχος')}</span>
                  <strong>{formatCurrency(goal.targetAmount)}</strong>
                </div>
              </div>

              <div className="goal-progress" aria-label={t('Πρόοδος')}>
                <span style={{ width: `${goal.progressPercentage}%` }} />
              </div>

              <div className="goal-card-footer">
                <span>{Math.round(goal.progressPercentage)}%</span>
                <span>
                  {goal.isCompleted
                    ? t('Ολοκληρώθηκε')
                    : goal.deadlineUtc
                      ? `${t('Προθεσμία')}: ${formatDate(goal.deadlineUtc)}`
                      : t('Χωρίς προθεσμία')}
                </span>
              </div>

              <button
                className="secondary-button goal-contribution-button"
                onClick={() => openContributionForm(goal)}
                disabled={isSavingGoal || goal.isCompleted}
              >
                + {t('Προσθήκη ποσού')}
              </button>
            </article>
          ))}
        </section>
      )}
    </>
  )

  const activeTeamMembers = teamMembers.filter(
    (member) => member.status === 'Active',
  ).length
  const pendingTeamMembers = teamMembers.filter(
    (member) => member.status === 'Pending',
  ).length
  const adminTeamMembers = teamMembers.filter(
    (member) => member.role === 'Admin',
  ).length

  const teamPage = (
    <>
      <section className="balance-section team-header">
        <div>
          <span className="section-label">{t('ΟΜΑΔΑ')}</span>
          <h2>{t('Η ομάδα σου')}</h2>
          <p>{t('Διαχειρίσου τους συνεργάτες και τους ρόλους του workspace.')}</p>
        </div>

        <button
          className="primary-button"
          onClick={openTeamForm}
          disabled={isSavingTeam}
        >
          {t('+ Πρόσκληση μέλους')}
        </button>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>{t('Ενεργά μέλη')}</span>
          <strong>{activeTeamMembers + 1}</strong>
          <small>{t('Owner')}</small>
        </div>
        <div className="metric">
          <span>{t('Εκκρεμείς προσκλήσεις')}</span>
          <strong>{pendingTeamMembers}</strong>
          <small>{t('Pending')}</small>
        </div>
        <div className="metric">
          <span>{t('Διαχειριστές')}</span>
          <strong>{adminTeamMembers}</strong>
          <small>{t('Admin')}</small>
        </div>
      </section>

      {teamError && (
        <p className="auth-error team-page-error" role="alert">
          {teamError}
        </p>
      )}

      {isLoadingTeam && (
        <p className="transactions-empty">
          {language === 'en' ? 'Loading team...' : 'Φόρτωση ομάδας...'}
        </p>
      )}

      {!isLoadingTeam && teamMembers.length === 0 && (
        <div className="panel budget-empty">
          <span>♙</span>
          <h3>{t('Δεν υπάρχουν ακόμη μέλη.')}</h3>
          <p>{t('Πρόσθεσε τον πρώτο συνεργάτη στο workspace.')}</p>
          <button className="primary-button" onClick={openTeamForm}>
            {t('+ Πρόσκληση συνεργάτη')}
          </button>
        </div>
      )}

      {!isLoadingTeam && teamMembers.length > 0 && (
        <section className="panel team-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">{t('ΟΜΑΔΑ')}</span>
              <h3>{t('Η ομάδα σου')}</h3>
            </div>
          </div>

          <div className="team-member-list">
            <div className="team-member-row owner-row">
              <div className="avatar team-avatar">KK</div>
              <div className="team-member-identity">
                <strong>{displayName}</strong>
                <span>{currentUser.email}</span>
              </div>
              <span className="team-status active">{t('Owner')}</span>
              <span className="team-role-label">{t('Owner')}</span>
            </div>

            {teamMembers.map((member) => (
              <div className="team-member-row" key={member.id}>
                <div className="avatar team-avatar">
                  {(member.name || member.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="team-member-identity">
                  <strong>{member.name || member.email.split('@')[0]}</strong>
                  <span>{member.email}</span>
                </div>
                <span className={`team-status ${member.status.toLowerCase()}`}>
                  {t(member.status)}
                </span>
                <select
                  className="team-role-select"
                  value={member.role}
                  onChange={(event) =>
                    handleTeamRoleChange(
                      member.id,
                      event.target.value as TeamRole,
                    )
                  }
                  disabled={isSavingTeam}
                  aria-label={`${t('Ρόλος')}: ${member.email}`}
                >
                  <option value="Admin">{t('Admin')}</option>
                  <option value="Member">{t('Member')}</option>
                </select>
                <button
                  className="delete-transaction"
                  onClick={() => handleRemoveTeamMember(member.id)}
                  disabled={isSavingTeam}
                  aria-label={`${t('Αφαίρεση μέλους')}: ${member.email}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )

  const subscriptionPage = (
    <>
      <section className="balance-section subscription-header">
        <div>
          <span className="section-label">{t('ΠΛΑΝΟ EMBER')}</span>
          <h2>{t('Η πρόσβασή σου')}</h2>
          <p>{t('Διαχειρίσου το πλάνο και την πρόσβαση της επιχείρησής σου.')}</p>
        </div>
        <div className="subscription-current">
          <span>{t('Τρέχον πλάνο')}</span>
          <strong>{accountPlan}</strong>
        </div>
      </section>

      <section className="panel subscription-trial-panel">
        <div>
          <span className="section-label">{t('Δωρεάν δοκιμή')}</span>
          <h3>
            {t('Η δοκιμή σου λήγει σε')} {currentUser.trialDaysRemaining} {t('ημέρες')}
          </h3>
        </div>
        <span className="trial-badge">Trial · {currentUser.trialDaysRemaining}d</span>
      </section>

      <section className="plan-grid">
        <article className="panel plan-card">
          <span className="section-label">EMBER SOLO</span>
          <h3>Solo</h3>
          <p>{t('Για επαγγελματίες')}</p>
          <ul>
            <li>{t('Βασικά οικονομικά εργαλεία')}</li>
            <li>{t('Συναλλαγές και προϋπολογισμοί')}</li>
            <li>{t('Business Goals')}</li>
          </ul>
          <button
            className="secondary-button"
            onClick={() => handlePlanSelection('Ember Solo')}
          >
            {t('Επιλογή πλάνου')}
          </button>
        </article>

        <article className="panel plan-card featured-plan">
          <span className="plan-recommended">RECOMMENDED</span>
          <span className="section-label">EMBER TEAM</span>
          <h3>Team</h3>
          <p>{t('Για μικρές ομάδες')}</p>
          <ul>
            <li>{t('Βασικά οικονομικά εργαλεία')}</li>
            <li>{t('Συναλλαγές και προϋπολογισμοί')}</li>
            <li>{t('Ομάδα και ρόλοι')}</li>
            <li>{t('Αναφορές και export')}</li>
          </ul>
          <button
            className="primary-button"
            onClick={() => handlePlanSelection('Ember Team')}
          >
            {t('Επιλογή πλάνου')}
          </button>
        </article>

        <article className="panel plan-card">
          <span className="section-label">EMBER SCALE</span>
          <h3>Scale</h3>
          <p>{t('Για αναπτυσσόμενες επιχειρήσεις')}</p>
          <ul>
            <li>{t('Όλα του Team')}</li>
            <li>{t('Προηγμένα permissions')}</li>
            <li>{t('Σύντομα διαθέσιμο')}</li>
          </ul>
          <button
            className="secondary-button"
            onClick={() => handlePlanSelection('Ember Scale')}
          >
            {t('Επικοινωνία για αναβάθμιση')}
          </button>
        </article>
      </section>

      {subscriptionMessage && (
        <p className="subscription-message" role="status">
          {subscriptionMessage}
        </p>
      )}
    </>
  )

  const budgetsPage = (
    <>
      <section className="balance-section budgets-header">
        <div>
          <span className="section-label">{t('ΠΡΟΫΠΟΛΟΓΙΣΜΟΙ')} · {currentMonthLabel}</span>
          <h2>{formatCurrency(totalBudgetRemaining)}</h2>
          <p>
            {t('Υπόλοιπο από όριο ')}{formatCurrency(totalBudgetLimit)}{t(' και έξοδα ')}
            {formatCurrency(totalBudgetSpent)}
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openCreateBudgetForm}
          disabled={isSavingBudget}
        >
          {t('+ Νέος προϋπολογισμός')}
        </button>
      </section>

      <section className="metrics">
        <div className="metric">
          <span>{t('Συνολικό όριο')}</span>
          <strong>{formatCurrency(totalBudgetLimit)}</strong>
          <small>{budgets.length} {t('κατηγορίες')}</small>
        </div>

        <div className="metric">
          <span>{t('Έχουν δαπανηθεί')}</span>
          <strong>{formatCurrency(totalBudgetSpent)}</strong>
          <small>{budgetUsagePercentage}% {t('χρήση')}</small>
        </div>

        <div className="metric">
          <span>{t('Υπόλοιπο')}</span>
          <strong>{formatCurrency(totalBudgetRemaining)}</strong>
          <small className={totalBudgetRemaining >= 0 ? 'up' : 'negative'}>
            {t(totalBudgetRemaining >= 0 ? 'Εντός ορίου' : 'Πάνω από το όριο')}
          </small>
        </div>
      </section>

      <section className="budget-grid">
        {isLoadingBudgets && (
          <p className="transactions-empty">{t('Φόρτωση προϋπολογισμών...')}</p>
        )}

        {!isLoadingBudgets && budgets.length === 0 && (
          <div className="panel budget-empty">
            <span>◫</span>
            <h3>{t('Δεν υπάρχουν προϋπολογισμοί')}</h3>
            <p>{t('Δημιούργησε το πρώτο όριο για μια κατηγορία εξόδων.')}</p>
            <button className="primary-button" onClick={openCreateBudgetForm}>
              {t('+ Δημιουργία προϋπολογισμού')}
            </button>
          </div>
        )}

        {!isLoadingBudgets &&
          budgets.map((budget) => (
            <article className="panel budget-card" key={budget.id}>
              <div className="budget-card-heading">
                <div>
                  <span className="section-label">{t('ΚΑΤΗΓΟΡΙΑ')}</span>
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
                  <span>{t('Δαπάνες')}</span>
                  <strong>{formatCurrency(budget.spentAmount)}</strong>
                </div>
                <div>
                  <span>{t('Όριο')}</span>
                  <strong>{formatCurrency(budget.limitAmount)}</strong>
                </div>
              </div>

              <div className="budget-progress" aria-label={t('Πρόοδος προϋπολογισμού')}>
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
                <span>{Math.round(budget.progressPercentage)}% {t('χρήση')}</span>
                <strong
                  className={
                    budget.remainingAmount >= 0 ? 'income-text' : 'negative'
                  }
                >
                  {formatCurrency(budget.remainingAmount)} {t('υπόλοιπο')}
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
            <span className="section-label">{t('ΠΡΟΤΙΜΗΣΕΙΣ')}</span>
            <h3>{t('Ρυθμίσεις εμφάνισης')}</h3>
          </div>
        </div>

        <div className="settings-list">
          <div className="settings-row">
            <div>
              <strong>{t('Θέμα εφαρμογής')}</strong>
              <span>
                {t('Η επιλογή αποθηκεύεται σε αυτή τη συσκευή.')}
              </span>
            </div>
            <button className="secondary-button" onClick={toggleTheme}>
              {t(darkMode ? 'Σκούρο' : 'Λευκό')}
            </button>
          </div>

          <div className="settings-row">
            <div>
              <strong>{t('Γλώσσα')}</strong>
              <span>{t('Η Ember είναι προσωρινά ρυθμισμένη στα Ελληνικά.')}</span>
            </div>
            <button className="secondary-button" onClick={toggleLanguage}>
              {language === 'el' ? 'Ελληνικά' : 'English'}
            </button>
          </div>
        </div>
      </article>

      <article className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">{t('ΛΟΓΑΡΙΑΣΜΟΣ')}</span>
            <h3>{t('Το προφίλ σου')}</h3>
          </div>
        </div>

        <div className="settings-list">
          <div className="settings-row stacked">
            <span>Email</span>
            <strong>{currentUser.email}</strong>
          </div>

          <div className="settings-row stacked">
            <span>{t('Πλάνο')}</span>
            <strong>{accountPlan}</strong>
          </div>

          <div className="settings-row stacked">
            <span>{t('Υπόλοιπο δοκιμής')}</span>
            <strong>{currentUser.trialDaysRemaining} {t('ημέρες')}</strong>
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
            <span>{t('Χώρος εργασίας')}</span>
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
              {t(item.label)}
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
            {t('Ρυθμίσεις')}
          </button>

          <button
            className="nav-item"
            onClick={handleLogout}
            disabled={isSavingTransaction}
          >
            <span>↪</span>
            {t('Αποσύνδεση')}
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
              EMBER / {t(activePage).toUpperCase()}
            </span>
            <h1>{t(activePage)}</h1>
          </div>

          <div className="topbar-actions">
            <button
              className="language-button"
              onClick={toggleLanguage}
              aria-label="Change language"
            >
              {language === 'el' ? 'EL' : 'EN'}
            </button>
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
              : activePage === 'Αναφορές'
                ? reportsPage
                : activePage === 'Αποταμίευση'
                  ? goalsPage
                  : activePage === 'Ομάδα'
                    ? teamPage
                    : activePage === 'Συναντήσεις'
                      ? <MeetingsPage key={currentUser.email} language={language} />
                      : activePage === 'Συνδρομή'
                        ? subscriptionPage
            : activePage === 'Ρυθμίσεις'
              ? settingsPage
              : (
                <section className="empty-page">
                  <span>
                    {navigation.find((item) => item.label === activePage)?.icon}
                  </span>
                  <h2>{activePage}</h2>
                  <p>
                    {t('Η ενότητα θα συνδεθεί με τα πραγματικά δεδομένα της Ember.')}
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setActivePage('Επισκόπηση')}
                  >
                    {t('Επιστροφή στην επισκόπηση')}
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
                  {t(editingBudget ? 'ΕΠΕΞΕΡΓΑΣΙΑ' : 'ΝΕΑ ΚΑΤΑΧΩΡΗΣΗ')}
                </span>
                <h3 id="budget-form-title">
                  {editingBudget
                    ? t('Επεξεργασία προϋπολογισμού')
                    : t('Νέος προϋπολογισμός')}
                </h3>
              </div>

              <button
                className="more-button"
                type="button"
                onClick={closeBudgetForm}
                disabled={isSavingBudget}
                aria-label={t('Κλείσιμο φόρμας')}
              >
                ×
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleSaveBudget}>
              <label htmlFor="budget-category">{t('Κατηγορία')}</label>
              <input
                id="budget-category"
                value={newBudget.category}
                onChange={(event) =>
                  setNewBudget((form) => ({
                    ...form,
                    category: event.target.value,
                  }))
                }
                placeholder={language === 'en' ? 'e.g. Software' : 'π.χ. Λογισμικό'}
                maxLength={80}
                disabled={isSavingBudget}
                required
              />

              <label htmlFor="budget-limit">{t('Μηνιαίο όριο')}</label>
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
                <span>{t('Περίοδος')}</span>
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
                  {t('Ακύρωση')}
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSavingBudget}
                >
                  {isSavingBudget
                    ? t('Αποθήκευση...')
                    : editingBudget
                      ? t('Αποθήκευση αλλαγών')
                      : t('Αποθήκευση')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showGoalForm && (
        <div className="modal-backdrop" onMouseDown={closeGoalForm}>
          <section
            className="transaction-modal goal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-label">
                  {t(editingGoal ? 'ΕΠΕΞΕΡΓΑΣΙΑ' : 'ΝΕΑ ΚΑΤΑΧΩΡΗΣΗ')}
                </span>
                <h3 id="goal-form-title">
                  {editingGoal ? t('Επεξεργασία στόχου') : t('Νέος στόχος')}
                </h3>
              </div>

              <button
                className="more-button"
                type="button"
                onClick={closeGoalForm}
                disabled={isSavingGoal}
                aria-label={t('Κλείσιμο φόρμας')}
              >
                ×
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleSaveGoal}>
              <label htmlFor="goal-name">{t('Όνομα στόχου')}</label>
              <input
                id="goal-name"
                value={newGoal.name}
                onChange={(event) =>
                  setNewGoal((form) => ({ ...form, name: event.target.value }))
                }
                placeholder={t('π.χ. Ταμειακό απόθεμα 3 μηνών')}
                maxLength={120}
                disabled={isSavingGoal}
                required
              />

              <label htmlFor="goal-type">{t('Τύπος στόχου')}</label>
              <select
                id="goal-type"
                value={newGoal.goalType}
                onChange={(event) =>
                  setNewGoal((form) => ({
                    ...form,
                    goalType: event.target.value,
                  }))
                }
                disabled={isSavingGoal}
              >
                <option value="Custom">{t('Custom')}</option>
                <option value="Tax / VAT">{t('Φορολογία / ΦΠΑ')}</option>
                <option value="Cash reserve">{t('Ταμειακό απόθεμα')}</option>
                <option value="Equipment">{t('Εξοπλισμός')}</option>
                <option value="Marketing">{t('Marketing')}</option>
                <option value="Payroll">{t('Μισθοδοσία')}</option>
                <option value="Business expansion">
                  {t('Επέκταση επιχείρησης')}
                </option>
              </select>

              <label htmlFor="goal-target">{t('Ποσό-στόχος')}</label>
              <input
                id="goal-target"
                type="number"
                min="0.01"
                step="0.01"
                value={newGoal.targetAmount}
                onChange={(event) =>
                  setNewGoal((form) => ({
                    ...form,
                    targetAmount: event.target.value,
                  }))
                }
                placeholder="0,00"
                disabled={isSavingGoal}
                required
              />

              <label htmlFor="goal-current">{t('Τρέχουσα πρόοδος')}</label>
              <input
                id="goal-current"
                type="number"
                min="0"
                step="0.01"
                value={newGoal.currentAmount}
                onChange={(event) =>
                  setNewGoal((form) => ({
                    ...form,
                    currentAmount: event.target.value,
                  }))
                }
                placeholder="0,00"
                disabled={isSavingGoal}
              />

              <label htmlFor="goal-deadline">{t('Προθεσμία')}</label>
              <input
                id="goal-deadline"
                type="date"
                value={newGoal.deadline}
                onChange={(event) =>
                  setNewGoal((form) => ({
                    ...form,
                    deadline: event.target.value,
                  }))
                }
                disabled={isSavingGoal}
              />

              <label htmlFor="goal-notes">{t('Σημειώσεις')}</label>
              <textarea
                id="goal-notes"
                value={newGoal.notes}
                onChange={(event) =>
                  setNewGoal((form) => ({ ...form, notes: event.target.value }))
                }
                placeholder={t('π.χ. Κεφάλαιο για νέο εξοπλισμό')}
                maxLength={300}
                rows={3}
                disabled={isSavingGoal}
              />

              {goalError && (
                <p className="auth-error" role="alert">
                  {goalError}
                </p>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeGoalForm}
                  disabled={isSavingGoal}
                >
                  {t('Ακύρωση')}
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSavingGoal}
                >
                  {isSavingGoal ? t('Αποθήκευση...') : t('Αποθήκευση')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {contributionGoal && (
        <div className="modal-backdrop" onMouseDown={closeContributionForm}>
          <section
            className="transaction-modal contribution-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribution-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-label">{t('Προσθήκη ποσού')}</span>
                <h3 id="contribution-form-title">{contributionGoal.name}</h3>
              </div>
              <button
                className="more-button"
                type="button"
                onClick={closeContributionForm}
                disabled={isSavingGoal}
                aria-label={t('Κλείσιμο φόρμας')}
              >
                ×
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleAddContribution}>
              <label htmlFor="contribution-amount">{t('Ποσό')}</label>
              <input
                id="contribution-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={contributionAmount}
                onChange={(event) => setContributionAmount(event.target.value)}
                placeholder="0,00"
                disabled={isSavingGoal}
                autoFocus
                required
              />

              {goalError && (
                <p className="auth-error" role="alert">
                  {goalError}
                </p>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeContributionForm}
                  disabled={isSavingGoal}
                >
                  {t('Ακύρωση')}
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSavingGoal}
                >
                  {isSavingGoal ? t('Αποθήκευση...') : t('Προσθήκη ποσού')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {showTeamForm && (
        <div className="modal-backdrop" onMouseDown={closeTeamForm}>
          <section
            className="transaction-modal team-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-form-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-label">{t('ΟΜΑΔΑ')}</span>
                <h3 id="team-form-title">{t('Πρόσκληση μέλους')}</h3>
              </div>
              <button
                className="more-button"
                type="button"
                onClick={closeTeamForm}
                disabled={isSavingTeam}
                aria-label={t('Κλείσιμο φόρμας')}
              >
                ×
              </button>
            </div>

            <form className="transaction-form" onSubmit={handleInviteTeamMember}>
              <label htmlFor="team-email">{t('Email συνεργάτη')}</label>
              <input
                id="team-email"
                type="email"
                value={newTeamMember.email}
                onChange={(event) =>
                  setNewTeamMember((member) => ({
                    ...member,
                    email: event.target.value,
                  }))
                }
                placeholder={t('π.χ. maria@company.gr')}
                maxLength={256}
                disabled={isSavingTeam}
                autoFocus
                required
              />

              <label htmlFor="team-name">{t('Όνομα συνεργάτη')}</label>
              <input
                id="team-name"
                value={newTeamMember.name}
                onChange={(event) =>
                  setNewTeamMember((member) => ({
                    ...member,
                    name: event.target.value,
                  }))
                }
                placeholder={language === 'en' ? 'e.g. Maria Papadopoulou' : 'π.χ. Μαρία Παπαδοπούλου'}
                maxLength={120}
                disabled={isSavingTeam}
              />

              <label htmlFor="team-role">{t('Ρόλος')}</label>
              <select
                id="team-role"
                value={newTeamMember.role}
                onChange={(event) =>
                  setNewTeamMember((member) => ({
                    ...member,
                    role: event.target.value as TeamRole,
                  }))
                }
                disabled={isSavingTeam}
              >
                <option value="Admin">{t('Admin')}</option>
                <option value="Member">{t('Member')}</option>
              </select>

              <p className="form-hint">
                {t('Η πρόσκληση θα εμφανιστεί ως εκκρεμής μέχρι να συνδεθεί ο συνεργάτης.')}
              </p>

              {teamError && (
                <p className="auth-error" role="alert">
                  {teamError}
                </p>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={closeTeamForm}
                  disabled={isSavingTeam}
                >
                  {t('Ακύρωση')}
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSavingTeam}
                >
                  {isSavingTeam ? t('Αποθήκευση...') : t('Πρόσκληση μέλους')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedPlan && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setSelectedPlan(null)}
        >
          <section
            className="transaction-modal subscription-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="panel-heading">
              <div>
                <span className="section-label">EMBER SUBSCRIPTION</span>
                <h3 id="subscription-modal-title">{selectedPlan}</h3>
              </div>
              <button
                className="more-button"
                type="button"
                onClick={() => setSelectedPlan(null)}
                aria-label={t('Κλείσιμο φόρμας')}
              >
                ×
              </button>
            </div>

            <div className="subscription-modal-content">
              <div className="subscription-modal-icon">✓</div>
              <p>
                {language === 'en'
                  ? 'Your plan selection is ready. Secure checkout will be connected in the next release.'
                  : 'Η επιλογή του πλάνου είναι έτοιμη. Το ασφαλές checkout θα συνδεθεί στο επόμενο release.'}
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => setSelectedPlan(null)}
              >
                {t('Εντάξει')}
              </button>
            </div>
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
                  {t(editingTransaction ? 'ΕΠΕΞΕΡΓΑΣΙΑ' : 'ΝΕΑ ΚΑΤΑΧΩΡΗΣΗ')}
                </span>
                <h3 id="transaction-form-title">
                  {editingTransaction
                    ? t('Επεξεργασία συναλλαγής')
                    : t('Νέα συναλλαγή')}
                </h3>
              </div>

              <button
                className="more-button"
                type="button"
                onClick={closeTransactionForm}
                disabled={isSavingTransaction}
                aria-label={t('Κλείσιμο φόρμας')}
              >
                ×
              </button>
            </div>

            <form
              className="transaction-form"
              onSubmit={handleSaveTransaction}
            >
              <label htmlFor="description">{t('Περιγραφή')}</label>
              <input
                id="description"
                value={newTransaction.description}
                onChange={(event) =>
                  setNewTransaction((form) => ({
                    ...form,
                    description: event.target.value,
                  }))
                }
                placeholder={language === 'en' ? 'e.g. Office rent' : 'π.χ. Ενοίκιο γραφείου'}
                maxLength={160}
                disabled={isSavingTransaction}
                required
              />

              <label htmlFor="amount">{t('Ποσό')}</label>
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

              <label htmlFor="type">{t('Τύπος')}</label>
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
                <option value={1}>{t('Έσοδο')}</option>
                <option value={2}>{t('Έξοδο')}</option>
              </select>

              <label htmlFor="category">{t('Κατηγορία')}</label>
              <input
                id="category"
                value={newTransaction.category}
                onChange={(event) =>
                  setNewTransaction((form) => ({
                    ...form,
                    category: event.target.value,
                  }))
                }
                placeholder={language === 'en' ? 'e.g. Software' : 'π.χ. Λογισμικό'}
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
                  {t('Ακύρωση')}
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSavingTransaction}
                >
                  {isSavingTransaction
                    ? t('Αποθήκευση...')
                    : editingTransaction
                      ? t('Αποθήκευση αλλαγών')
                      : t('Αποθήκευση')}
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
