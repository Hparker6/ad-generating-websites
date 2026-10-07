export interface NavItem {
  label: string;
  href: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export interface RelatedTool {
  title: string;
  href: string;
  description?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
