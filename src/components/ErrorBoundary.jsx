import { Component } from 'react'
import { RefreshCw, Trash2, TriangleAlert } from 'lucide-react'
import { BrandMark } from './brand'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('SubBoost crashed:', error, info)
  }

  resetLocalData = () => {
    try {
      localStorage.removeItem('subboost-nepal-v1')
      localStorage.removeItem('subboost-nepal-v2')
    } catch {
      /* storage unavailable */
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-dvh items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f172a] p-6 text-center shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]">
          <div className="mb-5 flex justify-center">
            <BrandMark />
          </div>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-300">
            <TriangleAlert className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-white">Something went wrong</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            The app hit an unexpected error. Reloading usually fixes it; if it keeps happening, reset the locally cached data.
          </p>
          <pre className="mt-4 max-h-24 overflow-auto rounded-xl border border-white/[0.07] bg-black/30 p-3 text-left text-[10.5px] leading-relaxed text-rose-200/70">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff2d20] to-[#c00009] text-sm font-semibold text-white transition hover:brightness-110"
            >
              <RefreshCw className="h-4 w-4" /> Reload app
            </button>
            <button
              type="button"
              onClick={this.resetLocalData}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1]"
            >
              <Trash2 className="h-4 w-4" /> Reset local data
            </button>
          </div>
        </div>
      </div>
    )
  }
}
