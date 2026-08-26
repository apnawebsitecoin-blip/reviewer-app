import { google } from 'googleapis'

export function getYouTubeClient() {
  const auth = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
  )
  auth.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN })
  return google.youtube({ version: 'v3', auth })
}
