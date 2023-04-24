import { forwardRef, Fragment, useEffect, useId, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { Dialog, Transition, Combobox } from '@headlessui/react'
import clsx from 'clsx'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'

function useSearchProps() {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  return {
    buttonProps: {
      ref: buttonRef,
      onClick() {
        setOpen(true)
      },
    },
    dialogProps: {
      open,
      setOpen(open: boolean | ((prevState: boolean) => boolean)) {
        const { width, height } = buttonRef.current?.getBoundingClientRect() || {}
        if (!open || (width !== 0 && height !== 0)) {
          setOpen(open)
        }
      },
    },
  }
}

function SearchDialog({
  open,
  setOpen,
  className,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  className?: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      return
    }

    function onKeyDown(event: {
      key: string
      metaKey: any
      ctrlKey: any
      preventDefault: () => void
    }) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog onClose={setOpen} className={clsx('fixed inset-0 z-50', className)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-400/25 backdrop-blur-sm dark:bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-20 md:py-32 lg:px-8 lg:py-[15vh]">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto overflow-hidden rounded-lg bg-zinc-50 shadow-xl ring-1 ring-zinc-900/7.5 dark:bg-zinc-900 dark:ring-zinc-800 sm:max-w-xl">
              <div>
                <form ref={formRef}>
                  <div className="group relative flex h-12">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-0 h-full w-5 stroke-zinc-500" />
                    <input
                      placeholder="Find something..."
                      ref={inputRef}
                      className="flex-auto appearance-none bg-transparent pl-10 pr-4 text-zinc-900 outline-none placeholder:text-zinc-500 focus:w-full focus:flex-none dark:text-white sm:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
                    />
                  </div>
                  <div
                    ref={panelRef}
                    className="border-t border-zinc-200 bg-white empty:hidden dark:border-zinc-100/5 dark:bg-white/2.5"
                  ></div>
                </form>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export function Search() {
  const [modifierKey, setModifierKey] = useState('⌘' || 'Ctrl ')
  const { buttonProps, dialogProps } = useSearchProps()

  useEffect(
    () => setModifierKey(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl '),
    []
  )

  return (
    <div className="hidden lg:block lg:max-w-md lg:flex-auto">
      <button
        type="button"
        className="hidden h-8 w-full items-center gap-2 rounded-full bg-white pl-2 pr-3 text-sm text-zinc-500 ring-1 ring-zinc-900/10 transition hover:ring-zinc-900/20 dark:bg-white/5 dark:text-zinc-400 dark:ring-inset dark:ring-white/10 dark:hover:ring-white/20 lg:flex focus:[&:not(:focus-visible)]:outline-none"
        {...buttonProps}
      >
        <MagnifyingGlassIcon className="h-5 w-5 stroke-current" />
        Find something...
        <kbd className="text-2xs ml-auto text-zinc-400 dark:text-zinc-500">
          <kbd className="font-sans">{modifierKey}</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>
      <SearchDialog {...dialogProps} />
    </div>
  )
}

export function MobileSearch() {
  const { buttonProps, dialogProps } = useSearchProps()

  return (
    <div className="contents lg:hidden">
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5 lg:hidden focus:[&:not(:focus-visible)]:outline-none"
        aria-label="Find something..."
        {...buttonProps}
      >
        <MagnifyingGlassIcon className="h-5 w-5 stroke-zinc-900 dark:stroke-white" />
      </button>
      <SearchDialog {...dialogProps} />
    </div>
  )
}