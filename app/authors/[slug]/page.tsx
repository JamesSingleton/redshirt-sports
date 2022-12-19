import Image from 'next/image'
import { EnvelopeOpenIcon, GlobeAltIcon } from '@heroicons/react/24/solid'

import { getAllAuthorsSlugs, getAuthorBySlug } from '@lib/sanity.client'
import { urlForImage } from '@lib/sanity.image'
import {
  Instagram,
  Twitter,
  Facebook,
  SpotifyIcon,
  ApplePodcastIcon,
  OvercastIcon,
} from '@components/common/icons'
import { HorizontalCard } from '@components/ui'
import { PortableTextComponent } from '@lib/sanity.text'

export async function generateStaticParams() {
  return await getAllAuthorsSlugs()
}

export default async function Page({ params }: { params: { slug: string } }) {
  const author = await getAuthorBySlug(params.slug)
  return (
    <main>
      <section className="bg-slate-50 py-12 sm:py-16 md:py-20 lg:py-20">
        <div className="mx-auto max-w-xl px-6 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
          <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
            <div className="flex flex-col items-center md:flex-row">
              <Image
                src={urlForImage(author.image).url()}
                alt={`${author.name} profile picture`}
                width={96}
                height={96}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl object-cover"
              />
              <div className="mt-6 text-center md:mt-0 md:ml-5 md:text-left">
                <span className="block font-archivoNarrow text-xs uppercase tracking-widest text-brand-500">
                  {author.role}
                </span>
                <h1 className="mt-1 font-sans text-3xl font-semibold tracking-normal text-slate-900 sm:text-4xl md:tracking-tight lg:leading-tight">
                  {author.name}
                </h1>
              </div>
            </div>
            <div className="mt-6 md:mt-0">
              <ul className="flex items-center space-x-3">
                {author.socialMedia &&
                  author.socialMedia.map((social) => (
                    <li key={social._key}>
                      <a
                        href={social.url}
                        target="_blank"
                        className="group flex"
                        rel="noreferrer noopener"
                      >
                        <span className="sr-only">{`${author.name}'s ${social.name} profile`}</span>
                        {social.name === 'Email' ? (
                          <EnvelopeOpenIcon className="h-6 w-6 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Twitter' ? (
                          <Twitter className="h-6 w-6 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Facebook' ? (
                          <Facebook className="h-6 w-6 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Instagram' ? (
                          <Instagram className="h-6 w-6 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Website' ? (
                          <GlobeAltIcon className="h-6 w-6 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Spotify Podcast' ? (
                          <SpotifyIcon className="h-6 w-6 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Apple Podcast' ? (
                          <ApplePodcastIcon className="h-6 w-6 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                        {social.name === 'Overcast Podcast' ? (
                          <OvercastIcon className="h-6 w-6 fill-slate-400 group-hover:fill-slate-600" />
                        ) : null}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-xl py-12 px-4 sm:px-12 sm:py-16 md:max-w-3xl lg:max-w-7xl lg:px-8 lg:py-24">
        <div className="w-full lg:grid lg:grid-cols-3 lg:gap-8 xl:gap-12">
          <div className="col-span-2">
            <h2 className="relative border-b border-slate-300 pb-3 font-archivo text-2xl font-semibold text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">
              Recent Articles
            </h2>
            <div className="mt-6 pt-8 sm:mt-10 sm:pt-10">
              {author.posts!.length > 0 ? (
                author.posts!.map((post) => <HorizontalCard key={post._id} post={post} />)
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <Image
                    src="/images/empty-state.png"
                    alt="No Posts"
                    width={613}
                    height={420}
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAA6ZJREFUWEe1VwFuGzEMk2///+8uydmDSFGWfdduKLAUQYqsiyiKpJQ2xhj2t4f/RR82RreO18FX/xlm+oDWzKw1a63Z4c+Dz3YcX1ZoPwLQh/VBIF48O2he/78BiO57R3ECMIDAw7s3L27WvGswcCQT+IeHx78x4HR7Ye9cIygM5Oc+MnBgDD8HkDPvNgJAHz27XwRUAfj8G4tTBxDIjYPvGfAuUfSJfo7AH/4SE5gaQOE5Av/9iYWvAWzFvWvQXwVYDQTxFRF68dTCBLODeAYQImPnon7VgBxQOYUDQL1e5wj4njNCq2ocNwD4YPicxSm8+bsYcP7r/GW/BFE0IFBiBH8D0zQrADhTCKzM3YtfVQMhSrIf03fq/adSro4XRmhPPsO93av5R8lWpTgLx/Ny788k9No1ATOAQnjoOoTITFiL+3sg4epXhiE9ziIofrE4fycAx0uwMX11X4pA/bJfWHGCCOojvdr780EvSrU6dy98BYj5PgEU82X2q4gAZBo+da8RvN7vGwBR78UnEyHGGJX4l6Co8Ek7KQ8rSgfwqawaGjhfr0UDolydJ4gtimU/iK/ZLXS0BaclqQFuS7oQ//d8nWAUqzWiFtRj7hdGMEeh+U8DEkB0rgWkFIxVLBC5rmVBx/H7PJMBbLlQPQqX4hqLRFgZyC4lvtwBcwQ1J9h9iHEBgJjdCl8XnQAxcg0jhAY/5L7/vahccCzJmP6XBR3IIwOl8w8KcxRax0rBnwEIIYqB83whVNnYzACOYNeAr+Gwoe6Q5QKanSuEMoA2K4YKXYTFBQqgEGHqwIFEQtYg0gqGBm4CLIvoONYIzihu1pADxQV7BogJ2pNOSRZ4hH3jgpIDhQFYMc44JmHcdtqCsl3aT4GkpRRC1DGIHCjXD0Wo4gyouqaVAXi9PheDdVnDg/MP9e9xXBnQIYoUbKH64oJcSCUN5/lu1rrzGgCYA3sWEIgvJn/d7wGMwEdRL+ESRIslyyrObYhVuIyAAOoikhjzQsptyHsg7agVjHEcdvyqdyHZURbkDsldHCBuDJTusZ5xK8ZVHBtJQty3Ye1+2Q2xkKDD5ZuRg4gRLG74diXrC0lxQ45gzYX9MLkD8He6zSNEEby7YLOibDVvv1p4i+UaSDcG4sxzFpaLSJfRPoJylueyKafYPgJ9T6g74fEsH85CLbpdRvp2LPekosNqa+FtDPE3ukqfvxdoDBuIeq4td2Gc+uxsjeB0Q1nRPEx4lPwBA2anSbfNT08AAAAASUVORK5CYII="
                  />
                  <p className="font-archivo text-2xl text-slate-600">No articles yet.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-12 w-full sm:mt-16 lg:col-span-1 lg:mt-0">
            <div className="w-full rounded-2xl bg-slate-50 p-5 sm:p-8">
              <h2 className="relative border-b border-slate-300 pb-3 font-archivo text-2xl font-semibold text-slate-900 before:absolute before:left-0 before:-bottom-[1px] before:h-px before:w-24 before:bg-brand-500">{`About ${author.name}`}</h2>
              <div className="pt-6 text-base leading-loose text-slate-600">
                <PortableTextComponent value={author.bio} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
