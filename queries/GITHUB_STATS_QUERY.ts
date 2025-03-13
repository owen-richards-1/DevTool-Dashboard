// queries/GITHUB_STATS_QUERY.ts

export const GITHUB_STATS_QUERY = `
  query {
    viewer {
      name
      login
      avatarUrl
      followers {
        totalCount
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
      repositories(first: 100, privacy: PUBLIC, isFork: false) {
        totalCount
        nodes {
          stargazerCount
        }
      }
      pullRequests(first: 100, states: MERGED) {
        totalCount
      }
      issues(first: 100, states: CLOSED) {
        totalCount
      }
      openPullRequests: pullRequests(first: 100, states: OPEN) {
        totalCount
      }
      openIssues: issues(first: 100, states: OPEN) {
        totalCount
      }
    }
  }
`;