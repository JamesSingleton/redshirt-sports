"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@redshirt-sports/auth/client";
import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@redshirt-sports/ui/components/form";
import { Input } from "@redshirt-sports/ui/components/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { completeOnboarding } from "@/actions/complete-onboarding";
import { safeRedirectPath } from "@/lib/safe-redirect";
import {
  type OnboardingValues,
  onboardingSchema,
} from "@/lib/schemas/onboarding";

export default function Onboarding() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organizationName: "",
      organizationRole: "",
    },
  });

  const handleSubmit = async (formData: FormData) => {
    const res = await completeOnboarding(formData);
    if (res?.error) {
      toast.error(res.error);
    }
    if (res?.message) {
      await user?.reload();
      toast.success("Onboarding completed successfully!");
      const redirectUrl = safeRedirectPath(
        searchParams.get("redirect_url"),
        window.location.origin,
      );
      if (redirectUrl) {
        router.push(redirectUrl);
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
        <CardDescription>
          Please provide information about what organization you represent and
          your role and that organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form action={handleSubmit} className="grid gap-4">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your organization's name"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide the name of the organization you are
                    representing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organizationRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Role</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your job title or role"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please provide your job title or role within the
                    organization.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
