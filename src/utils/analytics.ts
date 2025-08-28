// Google Analytics event tracking utilities

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_TRACKING_ID = 'G-90JPK6BVXQ'

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Specific event tracking functions
export const trackNavigationClick = (linkName: string) => {
  event({
    action: 'click',
    category: 'Navigation',
    label: linkName,
  })
}

export const trackProjectClick = (projectName: string, linkType: 'github' | 'live_demo') => {
  event({
    action: 'click',
    category: 'Project',
    label: `${projectName} - ${linkType}`,
  })
}

export const trackContactClick = (contactType: string) => {
  event({
    action: 'click',
    category: 'Contact',
    label: contactType,
  })
}

export const trackWorkExperienceClick = (company: string, position: string) => {
  event({
    action: 'click',
    category: 'Work Experience',
    label: `${company} - ${position}`,
  })
}

export const trackScrollToSection = (sectionName: string) => {
  event({
    action: 'scroll_to_section',
    category: 'Navigation',
    label: sectionName,
  })
}
