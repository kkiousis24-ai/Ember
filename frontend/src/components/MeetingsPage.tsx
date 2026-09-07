import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import {
  createMeeting,
  deleteMeeting,
  getMeetings,
  updateMeeting,
  type Meeting,
  type MeetingStatus,
  type SaveMeetingInput,
} from '../services/meetings'
import './MeetingsPage.css'

interface MeetingsPageProps {
  language: 'el' | 'en'
}

type MeetingFilter = 'all' | 'upcoming' | 'today' | 'completed' | 'cancelled'

const calendarWeekdays = ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ']

function calendarKey(date: Date): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
type MeetingModal =
  | { kind: 'create' }
  | { kind: 'edit'; meeting: Meeting }
  | { kind: 'delete'; meeting: Meeting }
  | null

interface MeetingForm {
  title: string
  startsAt: string
  endsAt: string
  location: string
  notes: string
  status: MeetingStatus
}

const english: Record<string, string> = {
  'Συναντήσεις': 'Meetings',
  'ΤΟ ΠΡΟΓΡΑΜΜΑ ΣΟΥ': 'YOUR SCHEDULE',
  'Χρόνος για όσα μετράνε': 'Make time for what matters',
  'Οργάνωσε τις επαγγελματικές σου συναντήσεις σε ένα μέρος.':
    'Keep your business meetings in one place.',
  '+ Νέα συνάντηση': '+ New meeting',
  'Προσεχείς': 'Upcoming',
  'Σήμερα': 'Today',
  'Ολοκληρωμένες': 'Completed',
  'Ακυρωμένες': 'Cancelled',
  'Όλες': 'All',
  'Αναζήτηση συναντήσεων': 'Search meetings',
  'Αναζήτηση τίτλου ή τοποθεσίας…': 'Search title or location…',
  'Φίλτρα συναντήσεων': 'Meeting filters',
  'Ανανέωση': 'Refresh',
  'Ανανέωση…': 'Refreshing…',
  'Φόρτωση συναντήσεων…': 'Loading meetings…',
  'Δεν υπάρχουν ακόμη συναντήσεις': 'No meetings yet',
  'Πρόσθεσε την πρώτη σου συνάντηση για να οργανώσεις το πρόγραμμά σου.':
    'Add your first meeting to start planning your schedule.',
  'Δεν βρέθηκαν συναντήσεις': 'No matching meetings',
  'Δοκίμασε διαφορετική αναζήτηση ή φίλτρο.': 'Try another search or filter.',
  'Καθαρισμός φίλτρων': 'Clear filters',
  'Δεν ήταν δυνατή η φόρτωση των συναντήσεων.': 'Meetings could not be loaded.',
  'Δοκίμασε ξανά': 'Try again',
  'Προγραμματισμένη': 'Scheduled',
  'Ολοκληρωμένη': 'Completed',
  'Ακυρωμένη': 'Cancelled',
  'Σε εξέλιξη': 'In progress',
  'Επεξεργασία': 'Edit',
  'Διαγραφή': 'Delete',
  'Νέα συνάντηση': 'New meeting',
  'Επεξεργασία συνάντησης': 'Edit meeting',
  'Διαγραφή συνάντησης': 'Delete meeting',
  'Τίτλος': 'Title',
  'π.χ. Συνάντηση με πελάτη': 'e.g. Client meeting',
  'Έναρξη': 'Start',
  'Λήξη': 'End',
  'Τοποθεσία (προαιρετικό)': 'Location (optional)',
  'π.χ. Γραφείο ή online': 'e.g. Office or online',
  'Σημειώσεις (προαιρετικό)': 'Notes (optional)',
  'Θέματα προς συζήτηση…': 'Agenda and talking points…',
  'Κατάσταση': 'Status',
  'Οι ώρες εμφανίζονται στην τοπική ζώνη ώρας της συσκευής σου.':
    'Times are shown in your device’s local time zone.',
  'Γράψε έναν τίτλο.': 'Enter a title.',
  'Συμπλήρωσε έγκυρη ημερομηνία και ώρα έναρξης και λήξης.':
    'Enter a valid start and end date and time.',
  'Η λήξη πρέπει να είναι μετά την έναρξη της συνάντησης.':
    'The meeting must end after it starts.',
  'Αυτή η τοπική ώρα δεν υπάρχει λόγω αλλαγής ώρας. Επίλεξε άλλη ώρα.':
    'This local time does not exist because the clocks change. Choose another time.',
  'Αποθήκευση': 'Save',
  'Αποθήκευση αλλαγών': 'Save changes',
  'Αποθήκευση…': 'Saving…',
  'Διαγραφή…': 'Deleting…',
  'Ακύρωση': 'Cancel',
  'Κλείσιμο': 'Close',
  'Η συνάντηση αποθηκεύτηκε.': 'Meeting saved.',
  'Η συνάντηση ενημερώθηκε.': 'Meeting updated.',
  'Η συνάντηση διαγράφηκε.': 'Meeting deleted.',
  'Δεν ήταν δυνατή η ολοκλήρωση της ενέργειας. Δοκίμασε ξανά.':
    'The action could not be completed. Try again.',
  'Η σύνδεσή σου έληξε. Συνδέσου ξανά.': 'Your session has expired. Sign in again.',
  'Δεν ήταν δυνατή η σύνδεση με τον διακομιστή. Δοκίμασε ξανά σε λίγο.':
    'Could not connect to the server. Try again shortly.',
  'Η συνάντηση δεν βρέθηκε. Ανανέωσε τη λίστα.':
    'The meeting was not found. Refresh the list.',
  'Δεν έχεις πρόσβαση στις συναντήσεις. Έλεγξε τη συνδρομή σου.':
    'You do not have access to meetings. Check your subscription.',
  'Επίλεξε ένα πακέτο για να συνεχίσεις να χρησιμοποιείς τις συναλλαγές.':
    'Choose a plan to continue using Ember.',
  'Ο τίτλος μπορεί να έχει έως 160 χαρακτήρες.': 'Titles can have up to 160 characters.',
  'Η τοποθεσία μπορεί να έχει έως 240 χαρακτήρες.': 'Locations can have up to 240 characters.',
  'Οι σημειώσεις μπορούν να έχουν έως 1000 χαρακτήρες.': 'Notes can have up to 1,000 characters.',
  'ΗΜΕΡΟΛΟΓΙΟ': 'CALENDAR',
  'Πρόγραμμα συναντήσεων': 'Meeting schedule',
  'Προηγούμενος μήνας': 'Previous month',
  'Επόμενος μήνας': 'Next month',
  'Υπάρχει συνάντηση': 'Meeting scheduled',
  'Δεν υπάρχει συνάντηση αυτή την ημέρα.': 'No meeting on this day.',
}

function localInputValue(date: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0')
  return [
    date.getFullYear(), '-', pad(date.getMonth() + 1), '-', pad(date.getDate()),
    'T', pad(date.getHours()), ':', pad(date.getMinutes()),
  ].join('')
}

function emptyForm(): MeetingForm {
  const quarterHour = 15 * 60 * 1000
  const start = new Date(Math.ceil((Date.now() + 60_000) / quarterHour) * quarterHour)
  return {
    title: '',
    startsAt: localInputValue(start),
    endsAt: localInputValue(new Date(start.getTime() + 30 * 60 * 1000)),
    location: '',
    notes: '',
    status: 1,
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Δεν ήταν δυνατή η ολοκλήρωση της ενέργειας. Δοκίμασε ξανά.'
}

interface MeetingDialogProps {
  children: ReactNode
  titleId: string
  initialFocusId: string
  busy: boolean
  onClose: () => void
}

function MeetingDialog({
  children, titleId, initialFocusId, busy, onClose,
}: MeetingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    const initialFocus = document.getElementById(initialFocusId)
    if (initialFocus instanceof HTMLElement) initialFocus.focus()

    return () => {
      dialog.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus()
      }
    }
  }, [initialFocusId])

  return (
    <dialog
      ref={dialogRef}
      className="meeting-dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget || busy) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom
        ) {
          onClose()
        }
      }}
    >
      {children}
    </dialog>
  )
}

export default function MeetingsPage({ language }: MeetingsPageProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [filter, setFilter] = useState<MeetingFilter>('all')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<MeetingModal>(null)
  const [form, setForm] = useState<MeetingForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [now, setNow] = useState(Date.now)
  const [calendarMonth, setCalendarMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1) })
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null)
  const operationLock = useRef(false)
  const isMounted = useRef(false)
  const locale = language === 'en' ? 'en-GB' : 'el-GR'
  const t = (text: string) => language === 'en' ? english[text] ?? text : text

  useEffect(() => {
    isMounted.current = true
    const updateClock = () => setNow(Date.now())
    const timer = window.setInterval(updateClock, 60_000)
    window.addEventListener('focus', updateClock)
    return () => {
      isMounted.current = false
      window.clearInterval(timer)
      window.removeEventListener('focus', updateClock)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setLoadError('')

    getMeetings(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return
        setMeetings(items)
        setHasLoaded(true)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [reloadKey])

  function openForm(meeting?: Meeting) {
    if (operationLock.current || isLoading) return
    setFormError('')
    setNotice('')
    if (meeting) {
      setForm({
        title: meeting.title,
        startsAt: localInputValue(new Date(meeting.startsAtUtc)),
        endsAt: localInputValue(new Date(meeting.endsAtUtc)),
        location: meeting.location ?? '',
        notes: meeting.notes ?? '',
        status: meeting.status,
      })
      setModal({ kind: 'edit', meeting })
    } else {
      setForm(emptyForm())
      setModal({ kind: 'create' })
    }
  }

  function closeModal() {
    if (operationLock.current) return
    setModal(null)
    setFormError('')
  }

  function changeStart(value: string) {
    setForm((current) => {
      const start = new Date(value)
      const end = new Date(current.endsAt)
      const needsEnd = Number.isFinite(start.getTime()) &&
        (!Number.isFinite(end.getTime()) || end <= start)
      return {
        ...current,
        startsAt: value,
        endsAt: needsEnd
          ? localInputValue(new Date(start.getTime() + 30 * 60 * 1000))
          : current.endsAt,
      }
    })
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (operationLock.current || !modal || modal.kind === 'delete') return
    setFormError('')
    const title = form.title.trim()
    const editing = modal.kind === 'edit' ? modal.meeting : null
    // Keep the original instant (including seconds and DST offset) when an
    // existing date field has not changed.
    const start = new Date(editing &&
      form.startsAt === localInputValue(new Date(editing.startsAtUtc))
      ? editing.startsAtUtc : form.startsAt)
    const end = new Date(editing &&
      form.endsAt === localInputValue(new Date(editing.endsAtUtc))
      ? editing.endsAtUtc : form.endsAt)

    if (!title) {
      setFormError('Γράψε έναν τίτλο.')
      return
    }
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setFormError('Συμπλήρωσε έγκυρη ημερομηνία και ώρα έναρξης και λήξης.')
      return
    }
    if (localInputValue(start) !== form.startsAt || localInputValue(end) !== form.endsAt) {
      setFormError('Αυτή η τοπική ώρα δεν υπάρχει λόγω αλλαγής ώρας. Επίλεξε άλλη ώρα.')
      return
    }
    if (end <= start) {
      setFormError('Η λήξη πρέπει να είναι μετά την έναρξη της συνάντησης.')
      return
    }

    const input: SaveMeetingInput = {
      title,
      startsAtUtc: start.toISOString(),
      endsAtUtc: end.toISOString(),
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    }
    operationLock.current = true
    setIsSaving(true)
    try {
      const saved = editing
        ? await updateMeeting(editing.id, input)
        : await createMeeting(input)
      if (!isMounted.current) return
      setMeetings((items) => [saved, ...items.filter((item) => item.id !== saved.id)])
      setHasLoaded(true)
      setLoadError('')
      setSearch('')
      setFilter('all')
      setNow(Date.now())
      setModal(null)
      setNotice(editing ? 'Η συνάντηση ενημερώθηκε.' : 'Η συνάντηση αποθηκεύτηκε.')
    } catch (error) {
      if (isMounted.current) setFormError(errorMessage(error))
    } finally {
      operationLock.current = false
      if (isMounted.current) setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (operationLock.current || modal?.kind !== 'delete') return
    const id = modal.meeting.id
    operationLock.current = true
    setIsSaving(true)
    setFormError('')
    try {
      await deleteMeeting(id)
      if (!isMounted.current) return
      setMeetings((items) => items.filter((item) => item.id !== id))
      setModal(null)
      setNotice('Η συνάντηση διαγράφηκε.')
    } catch (error) {
      if (isMounted.current) setFormError(errorMessage(error))
    } finally {
      operationLock.current = false
      if (isMounted.current) setIsSaving(false)
    }
  }

  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  const isUpcoming = (meeting: Meeting) =>
    meeting.status === 1 && new Date(meeting.endsAtUtc).getTime() > now
  const isToday = (meeting: Meeting) =>
    meeting.status !== 3 && new Date(meeting.startsAtUtc) < tomorrowStart &&
    new Date(meeting.endsAtUtc) > todayStart
  const query = search.trim().toLocaleLowerCase(locale)
  const visibleMeetings = meetings
    .filter((meeting) => {
      const matchesStatus = filter === 'all' ||
        (filter === 'upcoming' && isUpcoming(meeting)) ||
        (filter === 'today' && isToday(meeting)) ||
        (filter === 'completed' && meeting.status === 2) ||
        (filter === 'cancelled' && meeting.status === 3)
      const haystack = (meeting.title + ' ' + (meeting.location ?? '')).toLocaleLowerCase(locale)
      return matchesStatus && haystack.includes(query)
    })
    .sort((a, b) => {
      const aNext = isUpcoming(a)
      const bNext = isUpcoming(b)
      if (aNext !== bNext) return aNext ? -1 : 1
      const difference = new Date(a.startsAtUtc).getTime() - new Date(b.startsAtUtc).getTime()
      return (aNext ? difference : -difference) || a.id.localeCompare(b.id)
    })
  const filters: { value: MeetingFilter; label: string }[] = [
    { value: 'all', label: 'Όλες' },
    { value: 'upcoming', label: 'Προσεχείς' },
    { value: 'today', label: 'Σήμερα' },
    { value: 'completed', label: 'Ολοκληρωμένες' },
    { value: 'cancelled', label: 'Ακυρωμένες' },
  ]
  const statusLabel = (meeting: Meeting) => {
    if (meeting.status === 2) return t('Ολοκληρωμένη')
    if (meeting.status === 3) return t('Ακυρωμένη')
    if (new Date(meeting.startsAtUtc).getTime() <= now && isUpcoming(meeting)) {
      return t('Σε εξέλιξη')
    }
    return t('Προγραμματισμένη')
  }
  const dateLabel = (value: string) => new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(value))
  const timeLabel = (value: string) => new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value))
  const countLabel = language === 'en'
    ? visibleMeetings.length + (visibleMeetings.length === 1 ? ' meeting' : ' meetings')
    : visibleMeetings.length + (visibleMeetings.length === 1 ? ' συνάντηση' : ' συναντήσεις')
  const calendarTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(calendarMonth)
  const calendarDays = (() => {
    const firstDay = (calendarMonth.getDay() + 6) % 7
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
    return Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - firstDay + 1))
  })()
  const meetingsByDay = meetings.reduce<Record<string, Meeting[]>>((groups, meeting) => {
    const key = calendarKey(new Date(meeting.startsAtUtc))
    ;(groups[key] ??= []).push(meeting)
    return groups
  }, {})
  const selectedDayMeetings = selectedCalendarDay ? meetingsByDay[selectedCalendarDay] ?? [] : []

  return (
    <div className="meetings-page">
      <section className="panel meetings-heading">
        <div>
          <span className="section-label">{t('ΤΟ ΠΡΟΓΡΑΜΜΑ ΣΟΥ')}</span>
          <h2>{t('Χρόνος για όσα μετράνε')}</h2>
          <p>{t('Οργάνωσε τις επαγγελματικές σου συναντήσεις σε ένα μέρος.')}</p>
        </div>
        <button className="primary-button" type="button" disabled={isLoading || isSaving} onClick={() => openForm()}>
          {t('+ Νέα συνάντηση')}
        </button>
      </section>

      <section className="meetings-stats" aria-label={t('Συναντήσεις')}>
        {[
          { label: 'Προσεχείς', count: meetings.filter(isUpcoming).length },
          { label: 'Σήμερα', count: meetings.filter(isToday).length },
          { label: 'Ολοκληρωμένες', count: meetings.filter((item) => item.status === 2).length },
        ].map((item) => (
          <div className="panel meetings-stat" key={item.label}>
            <span>{t(item.label)}</span>
            <strong>{hasLoaded ? item.count : '—'}</strong>
          </div>
        ))}
      </section>

      <section className="panel meetings-list-panel">
        <div className="meetings-toolbar">
          <label className="meetings-search">
            <span className="meeting-sr-only">{t('Αναζήτηση συναντήσεων')}</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Αναζήτηση τίτλου ή τοποθεσίας…')}
            />
          </label>
          <button
            className="secondary-button"
            type="button"
            disabled={isLoading || isSaving}
            onClick={() => { if (!operationLock.current) setReloadKey((value) => value + 1) }}
          >
            {t(isLoading ? 'Ανανέωση…' : 'Ανανέωση')}
          </button>
        </div>
        <div className="meetings-filters" role="group" aria-label={t('Φίλτρα συναντήσεων')}>
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? 'meeting-filter active' : 'meeting-filter'}
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>

        {notice && <p className="meeting-notice" role="status">{t(notice)}</p>}
        {loadError && (
          <div className="meeting-load-error" role="alert">
            <p>{t(loadError)}</p>
            <button className="secondary-button" type="button" disabled={isLoading || isSaving}
              onClick={() => setReloadKey((value) => value + 1)}>
              {t('Δοκίμασε ξανά')}
            </button>
          </div>
        )}
        {isLoading && <p className="meetings-loading" role="status">{t('Φόρτωση συναντήσεων…')}</p>}
        {!isLoading && !hasLoaded && !loadError && (
          <p role="alert">{t('Δεν ήταν δυνατή η φόρτωση των συναντήσεων.')}</p>
        )}
        {hasLoaded && !isLoading && (
          <>
            <p className="meetings-count" aria-live="polite">{countLabel}</p>
            {visibleMeetings.length === 0 ? (
              <div className="meetings-empty">
                <span className="meeting-empty-mark" aria-hidden="true">□</span>
                <h3>{t(meetings.length === 0 ? 'Δεν υπάρχουν ακόμη συναντήσεις' : 'Δεν βρέθηκαν συναντήσεις')}</h3>
                <p>{t(meetings.length === 0
                  ? 'Πρόσθεσε την πρώτη σου συνάντηση για να οργανώσεις το πρόγραμμά σου.'
                  : 'Δοκίμασε διαφορετική αναζήτηση ή φίλτρο.')}</p>
                {meetings.length === 0 ? (
                  <button className="primary-button" type="button" onClick={() => openForm()}>
                    {t('+ Νέα συνάντηση')}
                  </button>
                ) : (
                  <button className="secondary-button" type="button" onClick={() => { setFilter('all'); setSearch('') }}>
                    {t('Καθαρισμός φίλτρων')}
                  </button>
                )}
              </div>
            ) : (
              <ul className="meeting-list">
                {visibleMeetings.map((meeting) => (
                  <li className="meeting-card" key={meeting.id}>
                    <div className="meeting-date-tile" aria-hidden="true">
                      <span>{new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(meeting.startsAtUtc))}</span>
                      <strong>{new Date(meeting.startsAtUtc).getDate()}</strong>
                    </div>
                    <div className="meeting-card-body">
                      <div className="meeting-card-title">
                        <h3>{meeting.title}</h3>
                        <span className={'meeting-status status-' + meeting.status}>{statusLabel(meeting)}</span>
                      </div>
                      <p className="meeting-time">
                        <time dateTime={meeting.startsAtUtc}>{dateLabel(meeting.startsAtUtc)} · {timeLabel(meeting.startsAtUtc)}</time>
                        {' – '}
                        <time dateTime={meeting.endsAtUtc}>
                          {dateLabel(meeting.startsAtUtc) !== dateLabel(meeting.endsAtUtc) ? dateLabel(meeting.endsAtUtc) + ' · ' : ''}
                          {timeLabel(meeting.endsAtUtc)}
                        </time>
                      </p>
                      {meeting.location && <p className="meeting-location">{meeting.location}</p>}
                      {meeting.notes && <p className="meeting-notes">{meeting.notes}</p>}
                      <div className="meeting-card-actions">
                        <button className="secondary-button" type="button" disabled={isSaving}
                          aria-label={t('Επεξεργασία') + ': ' + meeting.title}
                          onClick={() => openForm(meeting)}>
                          {t('Επεξεργασία')}
                        </button>
                        <button className="meeting-delete-button" type="button" disabled={isSaving}
                          aria-label={t('Διαγραφή') + ': ' + meeting.title}
                          onClick={() => {
                            if (operationLock.current) return
                            setNotice('')
                            setFormError('')
                            setModal({ kind: 'delete', meeting })
                          }}>
                          {t('Διαγραφή')}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section className="panel meeting-calendar-panel">
        <div className="meeting-calendar-heading">
          <div>
            <span className="section-label">{t('ΗΜΕΡΟΛΟΓΙΟ')}</span>
            <h3>{t('Πρόγραμμα συναντήσεων')}</h3>
          </div>
          <div className="meeting-calendar-controls">
            <button className="calendar-arrow" type="button" aria-label={t('Προηγούμενος μήνας')} onClick={() => { setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1)); setSelectedCalendarDay(null) }}>‹</button>
            <strong>{calendarTitle}</strong>
            <button className="calendar-arrow" type="button" aria-label={t('Επόμενος μήνας')} onClick={() => { setCalendarMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1)); setSelectedCalendarDay(null) }}>›</button>
          </div>
        </div>
        <div className="meeting-calendar-grid">
          {calendarWeekdays.map((day) => <span className="calendar-weekday" key={day}>{language === 'en' ? day.slice(0, 3) : day}</span>)}
          {calendarDays.map((date, index) => date ? (
            <button key={calendarKey(date)} type="button" className={'calendar-day' + (selectedCalendarDay === calendarKey(date) ? ' selected' : '') + (calendarKey(date) === calendarKey(new Date()) ? ' today' : '')} onClick={() => setSelectedCalendarDay((current) => current === calendarKey(date) ? null : calendarKey(date))}>
              <span>{date.getDate()}</span>
              {meetingsByDay[calendarKey(date)]?.length ? <i aria-label={t('Υπάρχει συνάντηση')} /> : null}
            </button>
          ) : <span className="calendar-day empty" key={'empty-' + index} />)}
        </div>
        {selectedCalendarDay && (
          <div className="calendar-day-details">
            <strong>{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(selectedCalendarDay + 'T12:00:00'))}</strong>
            {selectedDayMeetings.length ? selectedDayMeetings.map((meeting) => <button className="calendar-meeting" type="button" key={meeting.id} onClick={() => openForm(meeting)}><span>{timeLabel(meeting.startsAtUtc)}</span>{meeting.title}</button>) : <p>{t('Δεν υπάρχει συνάντηση αυτή την ημέρα.')}</p>}
          </div>
        )}
      </section>

      {modal && (
        <MeetingDialog
          titleId="meeting-dialog-title"
          initialFocusId={modal.kind === 'delete' ? 'meeting-cancel-delete' : 'meeting-title'}
          busy={isSaving}
          onClose={closeModal}
        >
          <div className="meeting-dialog-heading">
            <h2 id="meeting-dialog-title">{t(modal.kind === 'delete'
              ? 'Διαγραφή συνάντησης'
              : modal.kind === 'edit' ? 'Επεξεργασία συνάντησης' : 'Νέα συνάντηση')}</h2>
            <button className="more-button" type="button" disabled={isSaving}
              onClick={closeModal} aria-label={t('Κλείσιμο')}>×</button>
          </div>
          {modal.kind === 'delete' ? (
            <div>
              <p className="meeting-delete-question">
                {language === 'en' ? 'Delete the meeting “' : 'Να διαγραφεί η συνάντηση «'}
                <strong>{modal.meeting.title}</strong>
                {language === 'en' ? '”?' : '»;'}
              </p>
              {formError && <p className="meeting-form-error" role="alert">{t(formError)}</p>}
              <div className="meeting-dialog-actions">
                <button id="meeting-cancel-delete" className="secondary-button" type="button"
                  disabled={isSaving} onClick={closeModal}>{t('Ακύρωση')}</button>
                <button className="meeting-danger-button" type="button" disabled={isSaving}
                  onClick={handleDelete}>{t(isSaving ? 'Διαγραφή…' : 'Διαγραφή')}</button>
              </div>
            </div>
          ) : (
            <form className="meetings-form" onSubmit={handleSave}>
              <label className="meeting-field" htmlFor="meeting-title">
                <span>{t('Τίτλος')}</span>
                <input id="meeting-title" value={form.title} maxLength={160} required disabled={isSaving}
                  placeholder={t('π.χ. Συνάντηση με πελάτη')}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
              </label>
              <div className="meeting-date-fields">
                <label className="meeting-field" htmlFor="meeting-start">
                  <span>{t('Έναρξη')}</span>
                  <input id="meeting-start" type="datetime-local" value={form.startsAt} required disabled={isSaving}
                    aria-describedby="meeting-timezone-hint" onChange={(event) => changeStart(event.target.value)} />
                </label>
                <label className="meeting-field" htmlFor="meeting-end">
                  <span>{t('Λήξη')}</span>
                  <input id="meeting-end" type="datetime-local" value={form.endsAt} required disabled={isSaving}
                    aria-describedby="meeting-timezone-hint"
                    onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} />
                </label>
              </div>
              <p className="meeting-timezone-hint" id="meeting-timezone-hint">
                {t('Οι ώρες εμφανίζονται στην τοπική ζώνη ώρας της συσκευής σου.')}
              </p>
              <label className="meeting-field" htmlFor="meeting-location">
                <span>{t('Τοποθεσία (προαιρετικό)')}</span>
                <input id="meeting-location" value={form.location} maxLength={240} disabled={isSaving}
                  placeholder={t('π.χ. Γραφείο ή online')}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              </label>
              <label className="meeting-field" htmlFor="meeting-notes">
                <span>{t('Σημειώσεις (προαιρετικό)')}</span>
                <textarea id="meeting-notes" value={form.notes} maxLength={1000} rows={3} disabled={isSaving}
                  placeholder={t('Θέματα προς συζήτηση…')}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
              <label className="meeting-field" htmlFor="meeting-status">
                <span>{t('Κατάσταση')}</span>
                <select id="meeting-status" value={form.status} disabled={isSaving}
                  onChange={(event) => setForm((current) => ({ ...current, status: Number(event.target.value) as MeetingStatus }))}>
                  <option value={1}>{t('Προγραμματισμένη')}</option>
                  <option value={2}>{t('Ολοκληρωμένη')}</option>
                  <option value={3}>{t('Ακυρωμένη')}</option>
                </select>
              </label>
              {formError && <p className="meeting-form-error" role="alert">{t(formError)}</p>}
              <div className="meeting-dialog-actions">
                <button className="secondary-button" type="button" disabled={isSaving}
                  onClick={closeModal}>{t('Ακύρωση')}</button>
                <button className="primary-button" type="submit" disabled={isSaving}>
                  {t(isSaving ? 'Αποθήκευση…' : modal.kind === 'edit' ? 'Αποθήκευση αλλαγών' : 'Αποθήκευση')}
                </button>
              </div>
            </form>
          )}
        </MeetingDialog>
      )}
    </div>
  )
}
