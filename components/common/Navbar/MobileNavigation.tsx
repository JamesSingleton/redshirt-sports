import { createContext, Fragment, useContext, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { motion } from 'framer-motion'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid'
import { create } from 'zustand'

import { Header } from './Navbar'
import { Navigation } from './Navigation'

const IsInsideMobileNavigationContext = createContext(false)

export function useIsInsideMobileNavigation() {
  return useContext(IsInsideMobileNavigationContext)
}

interface MobileNavigationState {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const useMobileNavigationStore = create<MobileNavigationState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state: { isOpen: any }) => ({ isOpen: !state.isOpen })),
}))

export function MobileNavigation({ categories }: { categories: any[] }) {
  const isInsideMobileNavigation = useIsInsideMobileNavigation()
  const { isOpen, toggle, close } = useMobileNavigationStore()
  const ToggleIcon = isOpen ? XMarkIcon : Bars3Icon

  return (
    <IsInsideMobileNavigationContext.Provider value={true}>
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5 lg:hidden"
        aria-label="Toggle navigation"
        onClick={toggle}
      >
        <ToggleIcon className="h-6 w-6 stroke-zinc-900 dark:stroke-white" />
      </button>
      {!isInsideMobileNavigation && (
        <Transition.Root show={isOpen} as={Fragment}>
          <Dialog onClose={close} className="fixed inset-0 z-50 lg:hidden">
            <Transition.Child
              as={Fragment}
              enter="duration-300 ease-out"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="duration-200 ease-in"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 top-14 bg-zinc-400/20 backdrop-blur-sm dark:bg-black/40" />
            </Transition.Child>

            <Dialog.Panel>
              <Transition.Child
                as={Fragment}
                enter="duration-300 ease-out"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="duration-200 ease-in"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Header />
              </Transition.Child>

              <Transition.Child
                as={Fragment}
                enter="duration-500 ease-in-out"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="duration-500 ease-in-out"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <motion.div
                  layoutScroll
                  className="fixed bottom-0 left-0 top-14 w-full overflow-y-auto bg-white px-4 pb-4 pt-6 shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-900/7.5 dark:bg-zinc-900 dark:ring-zinc-800 min-[416px]:max-w-sm sm:px-6 sm:pb-10"
                >
                  <Navigation categories={categories} />
                </motion.div>
              </Transition.Child>
            </Dialog.Panel>
          </Dialog>
        </Transition.Root>
      )}
    </IsInsideMobileNavigationContext.Provider>
  )
}
