import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const { pathname } = req.nextUrl

  const hostname = req.headers.get('host')

  if (!hostname) {
    return new Response(null, {
      status: 400,
      statusText: 'No hostname found in request headers',
    })
  }

  if (pathname === '/fcs/page/1') {
    url.pathname = '/fcs'
    return NextResponse.redirect(url)
  }
}
