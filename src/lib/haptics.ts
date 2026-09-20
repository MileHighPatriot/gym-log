/** Small taps that fail silently where unsupported. */
export function buzz(pattern: number | readonly number[]) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([...(typeof pattern === 'number' ? [pattern] : pattern)])
  } catch {
    /* not supported */
  }
}

export const BUZZ = {
  check: 30,
  pr: [60, 40, 60, 40, 120],
  restDone: [80, 40, 80],
} as const

let ctx: AudioContext | null = null

/** Two short beeps. Needs a prior user gesture on iOS; we call it after Set taps so that is satisfied. */
export function beep() {
  try {
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
      | typeof AudioContext
      | undefined
    if (!Ctor) return
    ctx ??= new Ctor()
    const now = ctx.currentTime
    for (const at of [0, 0.22]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, now + at)
      gain.gain.exponentialRampToValueAtTime(0.2, now + at + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + at)
      osc.stop(now + at + 0.16)
    }
  } catch {
    /* no audio */
  }
}

export function canNotify(): boolean {
  return typeof Notification !== 'undefined'
}

export function notifyPermission(): NotificationPermission | 'unsupported' {
  return canNotify() ? Notification.permission : 'unsupported'
}

export async function askNotify(): Promise<NotificationPermission | 'unsupported'> {
  if (!canNotify()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Fires a system notification if allowed. Reaches you when the screen is off but the tab is alive. */
export function notify(title: string, body?: string) {
  if (!canNotify() || Notification.permission !== 'granted') return
  try {
    navigator.serviceWorker?.ready
      .then((reg) => reg.showNotification(title, { body, tag: 'gym-log-rest', vibrate: [80, 40, 80] } as NotificationOptions))
      .catch(() => new Notification(title, { body, tag: 'gym-log-rest' }))
  } catch {
    try {
      new Notification(title, { body, tag: 'gym-log-rest' })
    } catch {
      /* blocked */
    }
  }
}
