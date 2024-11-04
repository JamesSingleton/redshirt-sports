import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TransferPortalPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8 flex items-center space-x-4">
        <h1 className="text-2xl font-bold">Redshirt Sports Transfer Portal</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="overflow-hidden">
          <Image
            src="/placeholder.svg?height=200&width=400"
            alt="Football player in action"
            width={400}
            height={200}
            className="aspect-video object-cover"
          />
          <CardContent className="p-4">
            <Badge className="mb-2">Redshirt Sports Football</Badge>
            <h2 className="mb-2 line-clamp-2 text-xl font-bold">
              Middle Tennessee transfer RB Frank Peasant hearing from pair of SEC schools
            </h2>
            <p className="text-sm text-muted-foreground">James Singleton • 10/24/24</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <Image
            src="/placeholder.svg?height=200&width=400"
            alt="Football celebration"
            width={400}
            height={200}
            className="aspect-video object-cover"
          />
          <CardContent className="p-4">
            <Badge className="mb-2">Redshirt Sports Football</Badge>
            <h2 className="mb-2 line-clamp-2 text-xl font-bold">
              UNLV QB Matthew Sluka officially enters NCAA Transfer Portal after NIL dispute
            </h2>
            <p className="text-sm text-muted-foreground">James Singleton • 10/24/24</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <Image
            src="/placeholder.svg?height=200&width=400"
            alt="Football game action"
            width={400}
            height={200}
            className="aspect-video object-cover"
          />
          <CardContent className="p-4">
            <Badge className="mb-2">Redshirt Sports Football</Badge>
            <h2 className="mb-2 line-clamp-2 text-xl font-bold">
              Transfer portal impact players of Week 9
            </h2>
            <p className="text-sm text-muted-foreground">James Singleton • 10/23/24</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-6 text-xl font-bold">Transfer Portal News</h2>
          <div className="space-y-6">
            {[1, 2, 3, 4].map((item) => (
              <Card key={item} className="flex overflow-hidden">
                <Image
                  src="/placeholder.svg?height=120&width=200"
                  alt="News thumbnail"
                  width={200}
                  height={120}
                  className="h-[120px] w-[200px] object-cover"
                />
                <CardContent className="flex-1 p-4">
                  <Badge className="mb-2">Redshirt Sports Football</Badge>
                  <h3 className="mb-2 line-clamp-2 font-bold">
                    Latest transfer portal news and updates
                  </h3>
                  <p className="text-sm text-muted-foreground">James Singleton • 10/22/24</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Card className="bg-muted/40">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transfer Portal Wire</CardTitle>
              <Link href="/transfer-portal/all" className="text-sm text-primary hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="rounded-lg bg-background p-4">
                  <div className="mb-2 flex items-center text-sm text-muted-foreground">
                    <Badge variant="outline" className="mr-2">
                      ENTERED
                    </Badge>
                    10/31/24
                  </div>
                  <div className="flex items-start space-x-3">
                    <Image
                      src="/placeholder.svg?height=48&width=48"
                      alt="Tim Malo"
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary">Tim Malo</h4>
                      <p className="text-sm text-muted-foreground">SR / 6-0 / 185</p>
                      <p className="text-sm text-muted-foreground">Sehome (Bellingham, WA)</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Image
                        src="/placeholder.svg?height=24&width=24"
                        alt="School logo"
                        width={24}
                        height={24}
                        className="rounded"
                      />
                      <ArrowRight className="h-4 w-4" />
                      <Badge variant="secondary">UNDECIDED</Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-background p-4">
                  <div className="mb-2 flex items-center text-sm text-muted-foreground">
                    <Badge variant="outline" className="mr-2">
                      ENTERED
                    </Badge>
                    10/31/24
                  </div>
                  <div className="flex items-start space-x-3">
                    <Image
                      src="/placeholder.svg?height=48&width=48"
                      alt="Nicholas Hilliard"
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary">Nicholas Hilliard</h4>
                      <p className="text-sm text-muted-foreground">SR / 6-1 / 294</p>
                      <p className="text-sm text-muted-foreground">
                        Ascension Catholic (Donaldsonville, LA)
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Image
                        src="/placeholder.svg?height=24&width=24"
                        alt="School logo"
                        width={24}
                        height={24}
                        className="rounded"
                      />
                      <ArrowRight className="h-4 w-4" />
                      <Badge variant="secondary">UNDECIDED</Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-background p-4">
                  <div className="mb-2 flex items-center text-sm text-muted-foreground">
                    <Badge variant="outline" className="mr-2">
                      ENTERED
                    </Badge>
                    10/30/24
                  </div>
                  <div className="flex items-start space-x-3">
                    <Image
                      src="/placeholder.svg?height=48&width=48"
                      alt="Matthew Sluka"
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-primary">Matthew Sluka</h4>
                      <p className="text-sm text-muted-foreground">SR / 6-3 / 216</p>
                      <p className="text-sm text-muted-foreground">
                        Kellenberg Memorial (Locust Valley, NY)
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Image
                        src="/placeholder.svg?height=24&width=24"
                        alt="School logo"
                        width={24}
                        height={24}
                        className="rounded"
                      />
                      <ArrowRight className="h-4 w-4" />
                      <Badge variant="secondary">UNDECIDED</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
