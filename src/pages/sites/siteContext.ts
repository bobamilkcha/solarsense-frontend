import { useOutletContext } from 'react-router'
import type { Project, Site } from '../../api/types'

export type SiteContext = { site: Site; project: Project | null }

/** The site loaded by SitePage, for use inside its tab routes. */
export function useSiteContext(): SiteContext {
  return useOutletContext<SiteContext>()
}
