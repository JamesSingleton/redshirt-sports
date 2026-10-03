import { PUBLISHED_FETCH_OPTIONS } from "@redshirt-sports/sanity/live";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import type { Metadata } from "next";
import type { ContactPage, WithContext } from "schema-dts";

import { ContactEmailLink } from "@/components/contact-email-link";
import { JsonLdScript, websiteId } from "@/components/json-ld";
import PageHeader from "@/components/page-header";
import { getBaseUrl, getSiteEmailDomain } from "@/lib/get-base-url";
import { getPageMetadata } from "@/lib/global-seo-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { perspective } = PUBLISHED_FETCH_OPTIONS;
  return getPageMetadata(
    {
      title: "Contact Us",
      description: `Contact ${process.env.NEXT_PUBLIC_APP_NAME} for collaboration, advertising, or general inquiries. We're here to assist with any questions about our college sports coverage.`,
      slug: "/contact",
    },
    perspective,
  );
}

const baseUrl = getBaseUrl();
const emailDomain = getSiteEmailDomain();

const contactDetails = [
  {
    title: "Collaborate",
    description: "For partnership and collaboration inquiries",
    email: `editors@${emailDomain}`,
  },
  {
    title: "Advertising",
    description: "For advertising and sponsorship opportunities",
    email: `advertising@${emailDomain}`,
  },
  {
    title: "General Inquiries",
    description: "For all other questions and information",
    email: `contact@${emailDomain}`,
  },
];

const contactPageJsonLd: WithContext<ContactPage> = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${baseUrl}/contact`,
  name: "Contact Us",
  description: `Contact ${process.env.NEXT_PUBLIC_APP_NAME} for collaboration, advertising, or general inquiries. We're here to assist with any questions about our college sports coverage.`,
  url: `${baseUrl}/contact`,
  isPartOf: {
    "@type": "WebSite",
    "@id": websiteId,
  },
  inLanguage: "en-us",
  breadcrumb: {
    "@type": "BreadcrumbList",
    "@id": `${baseUrl}/contact#breadcrumb`,
    name: "Contact Breadcrumbs",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Contact Us",
        item: `${baseUrl}/contact`,
      },
    ],
  },
};

export default function Page() {
  return (
    <>
      <JsonLdScript data={contactPageJsonLd} id="contact-page-json-ld" />
      <PageHeader
        title="Contact us"
        subtitle="Interested in collaborating or advertising with us? Pick the inbox that fits and we will get back to you."
      />
      <section className="container pb-12">
        <ul className="grid gap-4 md:grid-cols-3">
          {contactDetails.map(({ title, description, email }) => (
            <li key={title}>
              <Card className="h-full gap-3 rounded-md py-5 shadow-none">
                <CardHeader className="px-5">
                  <CardTitle className="headline text-xl">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto px-5">
                  <ContactEmailLink email={email} category={title} />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
