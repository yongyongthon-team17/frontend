import { useEffect, useState } from "react"
import { Footer } from "./components/layout/Footer"
import { Header } from "./components/layout/Header"
import { MobileBottomNav } from "./components/layout/MobileBottomNav"
import { FacilityDetailDrawer } from "./features/facility-detail/FacilityDetailDrawer"
import { MapFilterModal } from "./features/map/MapFilterModal"
import { MapPage } from "./features/map/MapPage"
import { HomePage } from "./features/search/HomePage"
import { SearchPage } from "./features/search/SearchPage"
import { useFacilitySearch } from "./features/search/useFacilitySearch"
import type { Facility } from "./types/facility"
import type { AppScreen } from "./types/navigation"

function getScreenFromHash(): AppScreen {
  const value = window.location.hash.replace("#/", "")
  return value === "search" || value === "map" ? value : "home"
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(getScreenFromHash)
  const [mapFiltersOpen, setMapFiltersOpen] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  )
  const [mapSelectedId, setMapSelectedId] = useState<string>()

  useEffect(() => {
    if (!["#/home", "#/search", "#/map"].includes(window.location.hash)) {
      window.history.replaceState(null, "", "#/home")
    }
    const handleHashChange = () => {
      setScreen(getScreenFromHash())
      setSelectedFacility(null)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const commitNavigation = (next: AppScreen) => {
    const hash = `#/${next}`
    if (window.location.hash === hash) {
      setScreen(next)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      window.location.hash = `/${next}`
    }
  }

  const search = useFacilitySearch({ onComplete: commitNavigation })

  const navigate = (next: AppScreen) => {
    if (next === "map" && !search.submitted) {
      search.performSearch("map")
      return
    }
    commitNavigation(next)
  }

  return (
    <div
      className={`min-h-screen bg-background text-text-primary ${
        screen === "map"
          ? "pb-0"
          : "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
      }`}
    >
      <Header active={screen} onNavigate={navigate} />

      {screen === "home" && (
        <HomePage
          draft={search.draft}
          onDraftChange={search.setDraft}
          onSearch={() => search.performSearch("search")}
          loading={search.loading}
          onNavigate={navigate}
        />
      )}
      {screen === "search" && (
        <SearchPage
          draft={search.draft}
          onDraftChange={search.setDraft}
          applied={search.applied}
          submitted={search.submitted}
          loading={search.loading}
          error={search.error}
          results={search.results}
          onSearch={() => search.performSearch("search")}
          onRetry={() => search.retrySearch("search")}
          onTypeChange={search.setType}
          onNavigate={navigate}
          onOpenFacility={setSelectedFacility}
        />
      )}
      {screen === "map" && (
        <MapPage
          applied={search.applied}
          submitted={search.submitted}
          loading={search.loading}
          error={search.error}
          results={search.results}
          onSearch={() => search.performSearch("map")}
          onRetry={() => search.retrySearch("map")}
          onTypeChange={search.setType}
          selectedId={mapSelectedId}
          onSelect={setMapSelectedId}
          onOpenFacility={setSelectedFacility}
          onEditFilters={() => setMapFiltersOpen(true)}
          onGoHome={() => navigate("home")}
        />
      )}

      {screen !== "map" && <Footer />}

      {selectedFacility && (
        <FacilityDetailDrawer
          facility={selectedFacility}
          filters={search.applied}
          onClose={() => setSelectedFacility(null)}
        />
      )}
      {screen === "map" && mapFiltersOpen && (
        <MapFilterModal
          filters={search.draft}
          onChange={search.setDraft}
          onSubmit={() => {
            setMapFiltersOpen(false)
            search.performSearch("map")
          }}
          onClose={() => setMapFiltersOpen(false)}
          loading={search.loading}
        />
      )}
      {!selectedFacility && (
        <MobileBottomNav active={screen} onNavigate={navigate} />
      )}
    </div>
  )
}
