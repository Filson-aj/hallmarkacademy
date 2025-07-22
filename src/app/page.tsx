"use client";

import Header from "@/components/ui/header/header";
import Landing from "@/pages/landing/landing";
import Footer from "@/components/ui/footer/footer";


// Type definitions for menu
export interface SubLink {
  name: string;
  link: string;
}

export interface SubMenuGroup {
  Head: string;
  sublink: SubLink[];
}

export interface MenuItem {
  name: string;
  link?: string;
  submenu?: boolean;
  sublinks?: SubMenuGroup[];
}

const links: MenuItem[] = [
  {
    name: 'Admission', submenu: true, sublinks: [
      {
        Head: 'Sections',
        sublink: [
          { name: 'Apply Now', link: '/admission-apply' },
          { name: 'Requirements', link: '/admission-requirements' },
          { name: 'Check Admission', link: '/admission-check' },
        ]
      },
      {
        Head: 'Fees & Scholarship',
        sublink: [
          { name: 'Schedule of fees', link: '/schedule-fees' },
          { name: 'Available Scholarship', link: '/available-scholarship' },
        ]
      },
    ]
  },
  {
    name: 'About Us', submenu: true, sublinks: [
      {
        Head: 'Hallmark Academy',
        sublink: [
          { name: 'The Proprietor', link: '/about-proprietor' },
          { name: 'The Principal', link: '/about-principal' },
          { name: 'The Head Master', link: '/about-head-master' },
          { name: 'The Nursery Head', link: '/about-nursery-head' },
          { name: 'Our Mission', link: '/about-mission' },
          { name: 'Our Vision', link: '/about-vision' },
        ]
      },
      {
        Head: 'Units & Sections',
        sublink: [
          { name: 'The Nursery School', link: '/about-nursery-school' },
          { name: 'The Primary School', link: '/about-primary-school' },
          { name: 'The Junior School', link: '/about-junior-school' },
          { name: 'The Senior School', link: '/about-senior-school' },
        ]
      },
    ]
  },
  {
    name: 'News & Media', submenu: true, sublinks: [
      {
        Head: 'News Updates',
        sublink: [
          { name: 'School News', link: '/school-news' },
          { name: 'School News Letter', link: '/school-news-letter' },
          { name: 'Photo Gallery', link: '/photo-gallery' },
        ]
      },
    ]
  },
  {
    name: 'Contact Us', submenu: true, sublinks: [
      {
        Head: 'Contact Information',
        sublink: [
          { name: 'Contact Us', link: '/contact-us' },
          { name: 'Subscribe', link: '/contact-subscribe' },
        ]
      },
    ]
  },
];

const App = () => {
  return (
    <article className="w-full min-h-screen flex flex-col bg-neutral-900 text-neutral-200 font-[family-name:var(--font-geist-sans)]">
      <Header />
      <Landing />
      <Footer />
    </article>
  );
};

export default App;