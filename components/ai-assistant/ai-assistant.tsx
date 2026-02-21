'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Sparkles,
    X,
    Send,
    ChevronDown,
    Loader2,
    Bot,
    User,
    RefreshCw,
    Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPageContext } from '@/lib/ai-page-contexts'

// ─── Types ────────────────────────────────────────────────────

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

// ─── Helpers ──────────────────────────────────────────────────

function generateId() {
    return Math.random().toString(36).slice(2, 10)
}

// ─── Typing indicator ─────────────────────────────────────────

function TypingDots() {
    return (
        <div className="flex items-center gap-1 px-1 py-0.5">
            {[0, 1, 2].map(i => (
                <motion.span
                    key={i}
                    className="block w-1.5 h-1.5 rounded-full bg-primary/60"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </div>
    )
}

// ─── Message bubble ───────────────────────────────────────────

function MessageBubble({ message, isStreaming, index }: { message: Message; isStreaming?: boolean; index: number }) {
    const isUser = message.role === 'user'
    return (
        <motion.div
            initial={{ opacity: 0, x: isUser ? 20 : -20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: [0.21, 1.11, 0.81, 0.99] // Bouncy/Elastic feel
            }}
            className={cn('flex gap-3 items-end group', isUser && 'flex-row-reverse')}
        >
            {/* Avatar */}
            <div className={cn(
                'shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110',
                isUser
                    ? 'bg-primary/10 border border-primary/20 backdrop-blur-md'
                    : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
            )}>
                {isUser
                    ? <User className="w-4 h-4 text-primary" />
                    : <img src="/branding/v1_icon.png" alt="V_1.0" className="w-full h-full object-cover rounded-xl" />
                }
            </div>

            {/* Content Container */}
            <div className={cn(
                'relative max-w-[85%] px-4 py-3 text-sm leading-relaxed shadow-sm',
                isUser
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-none font-medium'
                    : 'glass-dark border border-white/10 rounded-2xl rounded-bl-none text-foreground/90'
            )}>
                {/* Subtle internal glow for assistant messages */}
                {!isUser && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
                )}

                {isStreaming && !message.content
                    ? <TypingDots />
                    : <span className="whitespace-pre-wrap relative z-10">{message.content}</span>
                }
                {isStreaming && message.content && (
                    <motion.span
                        className="inline-block w-1 h-4 bg-primary/80 ml-1.5 align-middle shadow-[0_0_8px_oklch(var(--primary))]"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                    />
                )}
            </div>
        </motion.div>
    )
}

// ─── Quick Action Chip ────────────────────────────────────────

function ActionChip({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="px-4 py-2 rounded-xl text-[11px] font-semibold bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 text-foreground/70 hover:text-foreground transition-all duration-300 cursor-pointer whitespace-nowrap backdrop-blur-sm shadow-sm"
        >
            {label}
        </motion.button>
    )
}

// ─── Main Component ───────────────────────────────────────────

export function AIAssistant() {
    const pathname = usePathname()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [streamingId, setStreamingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const abortRef = useRef<AbortController | null>(null)

    const pageContext = getPageContext(pathname || '/dashboard')

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isLoading])

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }, [input])

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => textareaRef.current?.focus(), 300)
        }
    }, [isOpen])

    // Reset quick actions when page changes
    useEffect(() => {
        // Clear error on page change
        setError(null)
    }, [pathname])

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim()
        if (!trimmed || isLoading) return

        setError(null)
        setInput('')

        const userMsg: Message = {
            id: generateId(),
            role: 'user',
            content: trimmed,
            timestamp: new Date(),
        }

        const assistantId = generateId()
        const assistantMsg: Message = {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMsg, assistantMsg])
        setIsLoading(true)
        setStreamingId(assistantId)

        // Build conversation history (exclude current empty assistant msg)
        const history = messages.map(m => ({ role: m.role, content: m.content }))

        try {
            abortRef.current = new AbortController()

            const response = await fetch('/api/ai-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: trimmed,
                    pageContext,
                    conversationHistory: history,
                }),
                signal: abortRef.current.signal,
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Unknown error' }))
                throw new Error(err.error || 'Failed to get response')
            }

            const contentType = response.headers.get('Content-Type') || ''

            if (contentType.includes('application/json')) {
                const data = await response.json()
                if (data.type === 'tool_result') {
                    // Update the message content first
                    setMessages(prev => prev.map(m =>
                        m.id === assistantId ? { ...m, content: data.result } : m
                    ))

                    // Handle specific actions
                    if (data.action === 'navigate') {
                        setTimeout(() => {
                            router.push(data.path)
                            setIsOpen(false)
                        }, 800)
                    } else if (data.action === 'refresh') {
                        router.refresh()
                    }
                } else if (data.type === 'error') {
                    throw new Error(data.message)
                }
                setIsLoading(false)
                setStreamingId(null)
                return
            }

            // Stream the response
            const reader = response.body?.getReader()
            if (!reader) throw new Error('No response stream')

            const decoder = new TextDecoder()
            let fullContent = ''

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                fullContent += chunk

                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantId ? { ...m, content: fullContent } : m
                    )
                )
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return

            const errorText = err.message || 'Something went wrong. Please try again.'
            setError(errorText)

            // Update the assistant message with error
            setMessages(prev =>
                prev.map(m =>
                    m.id === assistantId
                        ? { ...m, content: `❌ ${errorText}` }
                        : m
                )
            )
        } finally {
            setIsLoading(false)
            setStreamingId(null)
        }
    }, [isLoading, messages, pageContext])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    const handleClearChat = () => {
        abortRef.current?.abort()
        setMessages([])
        setError(null)
        setIsLoading(false)
        setStreamingId(null)
    }

    const isEmpty = messages.length === 0

    return (
        <>
            {/* ── Floating Trigger Button ─────────────────────────── */}
            <motion.button
                onClick={() => setIsOpen(prev => !prev)}
                className={cn(
                    'fixed bottom-8 right-8 z-50',
                    'w-16 h-16 rounded-[24px]',
                    'flex items-center justify-center',
                    'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500',
                    'shadow-[0_8px_30px_rgb(139,92,246,0.35)]',
                    'border border-white/20',
                    'hover:shadow-[0_8px_40px_rgb(139,92,246,0.5)] transition-all duration-500',
                    'mb-safe'
                )}
                whileHover={{ scale: 1.08, rotate: isOpen ? -90 : 5 }}
                whileTap={{ scale: 0.92 }}
                title="V_1.0 Assistant"
                aria-label="Open V_1.0 Assistant"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity rounded-[24px]" />
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                        >
                            <X className="w-6 h-6 text-white" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ duration: 0.2 }}
                            className="w-8 h-8 pointer-events-none"
                        >
                            <img src="/branding/v1_icon.png" alt="V_1.0" className="w-full h-full object-cover rounded-lg" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Atmospheric Glow Ring */}
                {!isOpen && (
                    <motion.span
                        className="absolute inset-[-4px] rounded-[28px] border border-violet-500/30"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0.2, 0.8] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}
                {!isOpen && (
                    <motion.span
                        className="absolute inset-0 rounded-[24px] shadow-[0_0_25px_oklch(var(--primary)/0.4)]"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </motion.button>

            {/* ── Slide-Up Panel ─────────────────────────────────────── */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(20px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(20px)' }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className={cn(
                            'fixed z-50',
                            // Responsive Positioning & Sizing
                            'bottom-0 right-0 w-full h-full rounded-none', // XS/S: Full screen
                            'sm:bottom-24 sm:right-8 sm:w-[420px] sm:h-auto sm:max-h-[min(700px,calc(100vh-10rem))] sm:rounded-[32px]', // MD: Standard
                            'lg:w-[480px] lg:max-h-[min(800px,calc(100vh-12rem))] lg:rounded-[40px]', // L: Large
                            'xl:w-[540px] xl:right-12 xl:bottom-32 xl:rounded-[48px]', // XL: Ultra-luxury

                            'overflow-hidden flex flex-col',
                            'border border-white/10',
                            'glass-dark saturate-150 shadow-[0_20px_60px_rgba(0,0,0,0.6)]',
                        )}
                    >
                        {/* Interactive Background Grain & Mesh */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                        <div className="absolute -top-[20%] -right-[20%] w-[60%] h-[60%] bg-violet-500/10 blur-[100px] pointer-events-none rounded-full" />
                        <div className="absolute -bottom-[20%] -left-[20%] w-[60%] h-[60%] bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />
                        {/* ── Header ─────────────────────────────────────── */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0 bg-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg border border-white/10">
                                    <img src="/branding/v1_icon.png" alt="V_1.0 Logo" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-foreground tracking-tight sm:text-lg">V_1.0</p>
                                    <p className="text-[11px] text-muted-foreground/80 leading-none font-medium mt-1">
                                        Luxury Intelligence · {pageContext.page}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <button
                                        onClick={handleClearChat}
                                        className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Clear chat"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* ── Messages Area ───────────────────────────────── */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 scroll-smooth overscroll-contain"
                            style={{
                                scrollbarWidth: 'thin',
                                WebkitOverflowScrolling: 'touch' // iOS Momentum Scrolling
                            }}
                        >
                            {/* Empty state — welcome message */}
                            {isEmpty && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center pt-4 pb-2"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-3">
                                        <Zap className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        Ask me anything about your {pageContext.page}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed px-4">
                                        {pageContext.hint}
                                    </p>
                                </motion.div>
                            )}

                            {/* Message list */}
                            {messages.map((msg, idx) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    index={idx}
                                    isStreaming={streamingId === msg.id}
                                />
                            ))}
                        </div>

                        {/* ── Quick Action Chips ──────────────────────────── */}
                        {isEmpty && (
                            <div className="px-4 pb-3 shrink-0">
                                <div className="flex flex-wrap gap-1.5">
                                    {pageContext.quickActions.slice(0, 4).map(action => (
                                        <ActionChip
                                            key={action}
                                            label={action}
                                            onClick={() => sendMessage(action)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="px-6 pb-6 shrink-0 border-t border-white/5 pt-6 bg-white/5 backdrop-blur-xl">
                            {error && (
                                <p className="text-xs text-destructive/90 font-medium mb-3 px-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                                    {error}
                                </p>
                            )}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[24px] opacity-0 group-focus-within:opacity-15 transition-opacity duration-700 blur-xl" />
                                <div className="relative flex items-end gap-3 bg-white/5 border border-white/10 rounded-[24px] px-5 py-4 focus-within:border-primary/40 focus-within:bg-white/10 transition-all duration-500 shadow-inner">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={`Consult with V_1.0...`}
                                        rows={1}
                                        disabled={isLoading}
                                        className="flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/50 resize-none outline-none leading-relaxed min-h-[26px] max-h-[160px] scrollbar-thin disabled:opacity-50 font-medium"
                                    />
                                    <motion.button
                                        onClick={() => sendMessage(input)}
                                        disabled={!input.trim() || isLoading}
                                        whileHover={{ scale: 1.1, rotate: input.trim() ? -5 : 0 }}
                                        whileTap={{ scale: 0.9 }}
                                        className={cn(
                                            'shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500',
                                            input.trim() && !isLoading
                                                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-[0_4px_15px_rgba(139,92,246,0.3)] cursor-pointer'
                                                : 'bg-white/5 text-muted-foreground/30 cursor-not-allowed'
                                        )}
                                    >
                                        {isLoading
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : <Send className="w-5 h-5" />
                                        }
                                    </motion.button>
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground/40 mt-3 text-center font-medium tracking-wide">
                                PROMPT V_1.0 · SHIFT+ENTER FOR NEW LINE
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
