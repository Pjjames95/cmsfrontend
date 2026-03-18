import React, { useEffect, useState } from 'react'
import { publicAPI } from '../../lib/supabase'
import HeroSection from '../../components/public/home/HeroSection'
import MinistriesPreview from '../../components/public/home/MinistriesPreview'
import UpcomingEvents from '../../components/public/home/UpcomingEvents'
import LatestSermons from '../../components/public/home/LatestSermons'
import NewsHighlights from '../../components/public/home/NewsHighlights'
import HymnsPreview from '../../components/public/home/HymnsPreview'
// import ProjectsPreview from '../../components/public/home/ProjectsPreview'
import LoadingSpinner from '../../components/common/LoadingSpinner'

const HomePage = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    news: [],
    sermons: [],
    services: []
  })

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true)
      try {
        const [newsRes, sermonsRes, servicesRes] = await Promise.all([
          publicAPI.getNews(),
          publicAPI.getSermons(),
          publicAPI.getUpcomingServices(5)
        ])

        setData({
          news: newsRes.data?.slice(0, 3) || [],
          sermons: sermonsRes.data?.slice(0, 3) || [],
          services: servicesRes.data || []
        })
      } catch (error) {
        console.error('Error fetching home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <HeroSection />
      <MinistriesPreview />
      <UpcomingEvents events={data.services} />
      {/* <ProjectsPreview /> */}
      <LatestSermons sermons={data.sermons} />
      <NewsHighlights news={data.news} />
      <HymnsPreview />
    </div>
  )        
}

export default HomePage