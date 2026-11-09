import { PageTransition } from "@/components/motion/page-transition";

/** Templates re-mount on navigation, giving each page a light entrance transition. */
export default function OrganizationTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
