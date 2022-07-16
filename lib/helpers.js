import { useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import queryString from 'query-string'

export function clampRange(value, min = 0, max = 1) {
  return value < min ? min : value > max ? max : value
}

export function useParams(fallback) {
  const router = useRouter()
  const currentPath = [].concat(router.query?.slug).join('/')
  const hasQuery = Object.keys(router.query).length

  let currentParams = fallback

  // if query params present, update the current params
  if (hasQuery) {
    currentParams = fallback.map((param) =>
      router.query[param.name] ? { ...param, value: router.query[param.name] } : param
    )
  }

  const setCurrentParams = useCallback(
    (params) => {
      const urlParams = params
        .filter((p) => p.value !== fallback.find((fb) => fb.name === p.name).value)
        .reduce((r, { name, value }) => ((r[name] = value?.split(',')), r), {})

      const qs = queryString.stringify(urlParams, { arayFormat: 'comma' })

      router.replace(`${currentPath}${qs ? `?${qs}` : ''}`, undefined, { shallow: true })
    },
    [router]
  )

  return [currentParams, setCurrentParams]
}

export function usePrevious(value) {
  const prev = useRef()

  useEffect(() => {
    prev.current = value
  })

  return prev.current
}
