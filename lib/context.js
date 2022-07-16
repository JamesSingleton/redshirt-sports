import React, { createContext, useContext, useState } from 'react'

const initialContext = {
  isPageTransition: false,
}

const SiteContext = createContext({
  context: initialContext,
  setContext: () => null,
})

const SiteContextProvider = ({ data, children }) => {
  const [context, setContext] = useState({
    ...initialContext,
  })

  const [initContext, setInitContext] = useState(false)
}
